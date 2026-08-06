document.addEventListener("DOMContentLoaded", () => {
  const DOM = {
    html: document.documentElement,
    themeToggle: document.getElementById("themeToggle"),
    themeIcon: document.getElementById("themeIcon"),
    qrForm: document.getElementById("qrForm"),
    urlInput: document.getElementById("urlInput"),
    clearBtn: document.getElementById("clearBtn"),
    widthInput: document.getElementById("widthInput"),
    heightInput: document.getElementById("heightInput"),
    generateBtn: document.getElementById("generateBtn"),
    resetBtn: document.getElementById("resetBtn"),
    openPdfBtn: document.getElementById("openPdfBtn"),
    previewPlaceholder: document.getElementById("previewPlaceholder"),
    qrBadge: document.getElementById("qrBadge"),
    qrCodeCanvas: document.getElementById("qrCodeCanvas"),
  };

  const state = {
    currentTheme: localStorage.getItem("app_theme") || "light",
    qrCode: null,
  };

  // --- 1. THEME LOGIC WITH LOCALSTORAGE & SMOOTH ICON UPDATE ---
  function applyTheme(theme) {
    state.currentTheme = theme;
    DOM.html.setAttribute("data-theme", theme);
    localStorage.setItem("app_theme", theme);

    if (DOM.themeIcon) {
      if (theme === "dark") {
        DOM.themeIcon.classList.remove("fa-moon");
        DOM.themeIcon.classList.add("fa-sun");
      } else {
        DOM.themeIcon.classList.remove("fa-sun");
        DOM.themeIcon.classList.add("fa-moon");
      }
    }
  }

  function toggleTheme() {
    const nextTheme = state.currentTheme === "light" ? "dark" : "light";
    applyTheme(nextTheme);
  }

  // --- 2. URL VALIDATION & NORMALIZATION ---
  function normalizeUrl(rawInput) {
    if (!rawInput) return { valid: false, url: "" };

    let cleaned = rawInput.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
    if (!cleaned) return { valid: false, url: "" };

    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = "https://" + cleaned;
    }

    try {
      const parsed = new URL(cleaned);
      const isValidHost = parsed.hostname.length > 0;
      return { valid: isValidHost, url: cleaned };
    } catch (_) {
      return { valid: false, url: "" };
    }
  }

  // --- 3. INPUT HANDLER & LOCALSTORAGE FOR FORM ---
  function handleUrlInput() {
    if (!DOM.urlInput) return;
    const rawValue = DOM.urlInput.value.trim();


    localStorage.setItem("app_url_input", DOM.urlInput.value);

    if (rawValue.length > 0) {
      if (DOM.clearBtn) DOM.clearBtn.classList.add("visible");
      const { valid } = normalizeUrl(rawValue);
      if (DOM.generateBtn) DOM.generateBtn.disabled = !valid;
    } else {
      if (DOM.clearBtn) DOM.clearBtn.classList.remove("visible");
      if (DOM.generateBtn) DOM.generateBtn.disabled = true;
    }
  }

  function handleDimensionsInput() {
    if (DOM.widthInput)
      localStorage.setItem("app_qr_width", DOM.widthInput.value);
    if (DOM.heightInput)
      localStorage.setItem("app_qr_height", DOM.heightInput.value);
  }

  // --- 4. QR GENERATOR LOGIC ---
  function generateQRCode(e) {
    if (e) e.preventDefault();

    if (!DOM.urlInput) return;
    const rawValue = DOM.urlInput.value;
    const { valid, url } = normalizeUrl(rawValue);

    if (!valid) return;

    if (DOM.qrCodeCanvas) {
      DOM.qrCodeCanvas.innerHTML = "";
    }

    const width = parseInt(DOM.widthInput?.value, 10) || 200;
    const height = parseInt(DOM.heightInput?.value, 10) || 200;

    try {
      state.qrCode = new QRCodeStyling({
        width: width,
        height: height,
        type: "canvas",
        data: url,
        dotsOptions: {
          color: "#111827",
          type: "square",
        },
        backgroundOptions: {
          color: "#ffffff",
        },
        cornersSquareOptions: {
          color: "#111827",
          type: "square",
        },
        cornersDotOptions: {
          color: "#111827",
          type: "square",
        },
      });

      state.qrCode.append(DOM.qrCodeCanvas);

      if (DOM.previewPlaceholder)
        DOM.previewPlaceholder.classList.add("d-none");
      if (DOM.qrBadge) DOM.qrBadge.classList.remove("d-none");
      if (DOM.openPdfBtn) DOM.openPdfBtn.disabled = false;


      localStorage.setItem("app_qr_generated", "true");
    } catch (err) {
      console.error("QRCode Generation Error:", err);
    }
  }

  // --- 5. FORM ACTIONS & RESET ---
  function clearUrlInputOnly() {
    if (!DOM.urlInput) return;
    DOM.urlInput.value = "";
    localStorage.removeItem("app_url_input");
    if (DOM.clearBtn) DOM.clearBtn.classList.remove("visible");
    if (DOM.generateBtn) DOM.generateBtn.disabled = true;
    DOM.urlInput.focus();
  }

  function resetForm() {
    if (DOM.urlInput) DOM.urlInput.value = "";
    if (DOM.clearBtn) DOM.clearBtn.classList.remove("visible");
    if (DOM.generateBtn) DOM.generateBtn.disabled = true;
    if (DOM.openPdfBtn) DOM.openPdfBtn.disabled = true;

    if (DOM.qrBadge) DOM.qrBadge.classList.add("d-none");
    if (DOM.previewPlaceholder)
      DOM.previewPlaceholder.classList.remove("d-none");

    if (DOM.qrCodeCanvas) DOM.qrCodeCanvas.innerHTML = "";
    state.qrCode = null;

    if (DOM.widthInput) DOM.widthInput.value = 200;
    if (DOM.heightInput) DOM.heightInput.value = 200;


    localStorage.removeItem("app_url_input");
    localStorage.removeItem("app_qr_width");
    localStorage.removeItem("app_qr_height");
    localStorage.removeItem("app_qr_generated");
  }

  // --- 6. RESTORE SAVED STATE ON LOAD ---
  function restoreSavedState() {
    applyTheme(state.currentTheme);

    //  استرجاع بيانات المدخلات
    const savedUrl = localStorage.getItem("app_url_input");
    const savedWidth = localStorage.getItem("app_qr_width");
    const savedHeight = localStorage.getItem("app_qr_height");
    const wasGenerated = localStorage.getItem("app_qr_generated") === "true";

    if (savedUrl && DOM.urlInput) {
      DOM.urlInput.value = savedUrl;
      handleUrlInput();
    }

    if (savedWidth && DOM.widthInput) DOM.widthInput.value = savedWidth;
    if (savedHeight && DOM.heightInput) DOM.heightInput.value = savedHeight;

    if (wasGenerated && savedUrl) {
      generateQRCode();
    }
  }

  // --- 7. PDF EXPORT LOGIC ---
  async function openPdf() {
    if (!DOM.qrBadge || DOM.qrBadge.classList.contains("d-none")) return;

    if (DOM.openPdfBtn) DOM.openPdfBtn.disabled = true;

    const pdfWindow = window.open("", "_blank");
    if (pdfWindow) {
      pdfWindow.document.write(`
        <html lang="en">
          <head>
            <title>Generating PDF...</title>
            <style>
              body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #334155; }
              .loader { font-size: 1.1rem; font-weight: 600; }
            </style>
          </head>
          <body>
            <div class="loader">Generating your PDF badge, please wait...</div>
          </body>
        </html>
      `);
    }

    try {
      const canvas = await html2canvas(DOM.qrBadge, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const maxPdfWidth = pageWidth * 0.7;
      const ratio = Math.min(maxPdfWidth / imgWidth, pageHeight / imgHeight);

      const printWidth = imgWidth * ratio;
      const printHeight = imgHeight * ratio;

      const xPos = (pageWidth - printWidth) / 2;
      const yPos = (pageHeight - printHeight) / 2;

      pdf.addImage(imgData, "PNG", xPos, yPos, printWidth, printHeight);

      const blob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(blob);

      if (pdfWindow) {
        pdfWindow.location.href = pdfUrl;
      } else {
        window.location.href = pdfUrl;
      }
    } catch (err) {
      console.error("Error generating PDF preview:", err);
      if (pdfWindow) pdfWindow.close();
    } finally {
      if (DOM.openPdfBtn) DOM.openPdfBtn.disabled = false;
    }
  }

  // --- 8. EVENT BINDINGS & INIT ---
  if (DOM.themeToggle) DOM.themeToggle.addEventListener("click", toggleTheme);

  if (DOM.qrForm) {
    DOM.qrForm.addEventListener("submit", (e) => {
      e.preventDefault();
      generateQRCode(e);
    });
  }

  if (DOM.urlInput) {
    ["input", "keyup", "change", "paste", "blur", "focus"].forEach((evt) => {
      DOM.urlInput.addEventListener(evt, handleUrlInput);
    });
  }

  if (DOM.widthInput)
    DOM.widthInput.addEventListener("input", handleDimensionsInput);
  if (DOM.heightInput)
    DOM.heightInput.addEventListener("input", handleDimensionsInput);

  if (DOM.clearBtn) DOM.clearBtn.addEventListener("click", clearUrlInputOnly);
  if (DOM.generateBtn)
    DOM.generateBtn.addEventListener("click", (e) => generateQRCode(e));
  if (DOM.resetBtn) DOM.resetBtn.addEventListener("click", resetForm);
  if (DOM.openPdfBtn) DOM.openPdfBtn.addEventListener("click", openPdf);


  restoreSavedState();
});

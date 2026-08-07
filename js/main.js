document.addEventListener("DOMContentLoaded", () => {
  const DOM = {
    html: document.documentElement,
    themeToggle: document.getElementById("themeToggle"),
    themeIcon: document.getElementById("themeIcon"),
    qrForm: document.getElementById("qrForm"),
    urlInput: document.getElementById("urlInput"),
    urlError: document.getElementById("urlError"),
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

  // --- 1. THEME LOGIC ---
  function applyTheme(theme) {
    state.currentTheme = theme;
    DOM.html.setAttribute("data-theme", theme);
    localStorage.setItem("app_theme", theme);

    if (DOM.themeToggle) {
      DOM.themeToggle.setAttribute(
        "aria-pressed",
        theme === "dark" ? "true" : "false",
      );
    }

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

  // --- 2. URL VALIDATION ---
  function normalizeUrl(rawInput) {
    if (!rawInput) return { valid: false, url: "", error: "" };

    let cleaned = rawInput.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
    if (!cleaned) return { valid: false, url: "", error: "" };

    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = "https://" + cleaned;
    }

    try {
      const parsed = new URL(cleaned);
      const isValidHost =
        parsed.hostname.length > 0 && parsed.hostname.includes(".");
      if (!isValidHost) {
        return {
          valid: false,
          url: "",
          error: "Please enter a valid domain (e.g., example.com)",
        };
      }
      return { valid: true, url: cleaned, error: "" };
    } catch (_) {
      return { valid: false, url: "", error: "Invalid URL format" };
    }
  }

  // --- 3. INPUT HANDLERS ---
  function handleUrlInput() {
    if (!DOM.urlInput) return;
    const rawValue = DOM.urlInput.value.trim();

    localStorage.setItem("app_url_input", DOM.urlInput.value);

    if (rawValue.length > 0) {
      if (DOM.clearBtn) DOM.clearBtn.classList.remove("d-none");
      const { valid, error } = normalizeUrl(rawValue);

      if (valid) {
        hideError();
        if (DOM.generateBtn) DOM.generateBtn.disabled = false;
      } else {
        showError(error || "Please enter a valid URL");
        if (DOM.generateBtn) DOM.generateBtn.disabled = true;
      }
    } else {
      if (DOM.clearBtn) DOM.clearBtn.classList.add("d-none");
      if (DOM.generateBtn) DOM.generateBtn.disabled = true;
      hideError();
    }
  }

  function showError(msg) {
    if (DOM.urlInput) DOM.urlInput.classList.add("is-invalid");
    if (DOM.urlError) {
      DOM.urlError.textContent = msg;
      DOM.urlError.style.display = "block";
    }
  }

  function hideError() {
    if (DOM.urlInput) DOM.urlInput.classList.remove("is-invalid");
    if (DOM.urlError) {
      DOM.urlError.textContent = "";
      DOM.urlError.style.display = "none";
    }
  }

  function handleDimensionsInput() {
    if (DOM.widthInput && DOM.heightInput) {
      let val = parseInt(DOM.widthInput.value, 10);
      if (isNaN(val)) val = 200;

      DOM.heightInput.value = val;
      localStorage.setItem("app_qr_width", val);
      localStorage.setItem("app_qr_height", val);
    }
  }

  // --- 4. QR GENERATOR LOGIC ---
  function generateQRCode(e) {
    if (e) e.preventDefault();

    if (!DOM.urlInput) return;
    const rawValue = DOM.urlInput.value;
    const { valid, url, error } = normalizeUrl(rawValue);

    if (!valid) {
      showError(error || "Please enter a valid URL");
      return;
    }

    hideError();

    if (DOM.qrCodeCanvas) {
      DOM.qrCodeCanvas.innerHTML = "";
    }

    // جودة أبعاد مثالية للرسم 300px
    const renderSize = 300;

    try {
      state.qrCode = new QRCodeStyling({
        width: renderSize,
        height: renderSize,
        type: "canvas",
        data: url,
        margin: 0, // إزالة أي هامش داخلي ليتمدد الـ QR بالكامل
        qrOptions: {
          errorCorrectionLevel: "M",
        },
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

  // --- 5. FORM RESET & CLEAR ---
  function clearUrlInputOnly() {
    if (!DOM.urlInput) return;
    DOM.urlInput.value = "";
    localStorage.removeItem("app_url_input");
    hideError();
    if (DOM.clearBtn) DOM.clearBtn.classList.add("d-none");
    if (DOM.generateBtn) DOM.generateBtn.disabled = true;
    DOM.urlInput.focus();
  }

  function resetForm() {
    if (DOM.urlInput) DOM.urlInput.value = "";
    hideError();
    if (DOM.clearBtn) DOM.clearBtn.classList.add("d-none");
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

  // --- 6. RESTORE SAVED STATE ---
  function restoreSavedState() {
    applyTheme(state.currentTheme);

    const savedUrl = localStorage.getItem("app_url_input");
    const savedWidth = localStorage.getItem("app_qr_width");
    const savedHeight = localStorage.getItem("app_qr_height") || savedWidth;
    const wasGenerated = localStorage.getItem("app_qr_generated") === "true";

    if (savedWidth && DOM.widthInput) {
      DOM.widthInput.value = savedWidth;
    }
    if (savedHeight && DOM.heightInput) {
      DOM.heightInput.value = savedHeight;
    }

    if (savedUrl && DOM.urlInput) {
      DOM.urlInput.value = savedUrl;
      handleUrlInput();
    }

    if (wasGenerated && savedUrl && normalizeUrl(savedUrl).valid) {
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
        onclone: (clonedDoc) => {
          clonedDoc.documentElement.setAttribute("data-theme", "light");
          const clonedBadgeInner = clonedDoc.querySelector(".qr-badge-inner");
          const clonedFooterText = clonedDoc.querySelector(
            ".qr-badge-footer-text",
          );

          if (clonedBadgeInner) {
            clonedBadgeInner.style.borderColor = "#111827";
            clonedBadgeInner.style.backgroundColor = "#ffffff";
          }
          if (clonedFooterText) {
            clonedFooterText.style.color = "#111827";
          }
        },
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

  // --- 8. EVENT BINDINGS ---
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

  if (DOM.clearBtn) DOM.clearBtn.addEventListener("click", clearUrlInputOnly);
  if (DOM.generateBtn)
    DOM.generateBtn.addEventListener("click", (e) => generateQRCode(e));
  if (DOM.resetBtn) DOM.resetBtn.addEventListener("click", resetForm);
  if (DOM.openPdfBtn) DOM.openPdfBtn.addEventListener("click", openPdf);

  restoreSavedState();
});

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
    currentTheme: "light",
    qrInstance: null,
  };

  // --- 1. THEME LOGIC ---
  function toggleTheme() {
    state.currentTheme = state.currentTheme === "light" ? "dark" : "light";
    DOM.html.setAttribute("data-theme", state.currentTheme);

    if (DOM.themeIcon) {
      if (state.currentTheme === "dark") {
        DOM.themeIcon.classList.remove("fa-moon");
        DOM.themeIcon.classList.add("fa-sun");
      } else {
        DOM.themeIcon.classList.remove("fa-sun");
        DOM.themeIcon.classList.add("fa-moon");
      }
    }
  }

  // --- 2. URL VALIDATION & NORMALIZATION ---
  function normalizeUrl(rawInput) {
    if (!rawInput) return { valid: false, url: "" };

    // Removal of hidden unicode spaces inserted by mobile keyboards
    let cleaned = rawInput.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
    if (!cleaned) return { valid: false, url: "" };

    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = "https://" + cleaned;
    }

    try {
      const parsed = new URL(cleaned);
      // Ensure host contains at least one dot (e.g. domain.com)
      const isValidHost =
        parsed.hostname.includes(".") &&
        parsed.hostname.split(".")[1].length > 0;
      return { valid: isValidHost, url: cleaned };
    } catch (_) {
      return { valid: false, url: "" };
    }
  }

  // --- 3. INPUT HANDLER ---
  function handleUrlInput() {
    if (!DOM.urlInput) return;
    const rawValue = DOM.urlInput.value;

    if (rawValue.trim().length > 0) {
      if (DOM.clearBtn) DOM.clearBtn.classList.add("visible");
    } else {
      if (DOM.clearBtn) DOM.clearBtn.classList.remove("visible");
    }

    const { valid } = normalizeUrl(rawValue);
    if (DOM.generateBtn) {
      DOM.generateBtn.disabled = !valid;
    }
  }

  // --- 4. QR GENERATOR LOGIC ---
  function generateQRCode() {
    if (!DOM.urlInput) return;
    const rawValue = DOM.urlInput.value;
    const { valid, url } = normalizeUrl(rawValue);

    if (!valid) return;

    // Clear previous QR canvas
    if (DOM.qrCodeCanvas) {
      DOM.qrCodeCanvas.innerHTML = "";
    }
    state.qrInstance = null;

    const width = parseInt(DOM.widthInput?.value, 10) || 200;
    const height = parseInt(DOM.heightInput?.value, 10) || 200;

    try {
      state.qrInstance = new QRCode(DOM.qrCodeCanvas, {
        text: url,
        width: width,
        height: height,
        colorDark: "#111827",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H,
      });
    } catch (err) {
      console.error("QRCode Generation Error:", err);
      return;
    }

    // Safety Polling Mechanism (Max 2 Seconds)
    let attempts = 0;
    const maxAttempts = 100;

    const checkImageReady = setInterval(() => {
      attempts++;
      const img = DOM.qrCodeCanvas?.querySelector("img");
      const canvas = DOM.qrCodeCanvas?.querySelector("canvas");

      if (img && img.getAttribute("src")) {
        if (canvas) canvas.style.display = "none";
        img.style.display = "block";

        if (DOM.previewPlaceholder)
          DOM.previewPlaceholder.classList.add("d-none");
        if (DOM.qrBadge) DOM.qrBadge.classList.remove("d-none");
        if (DOM.openPdfBtn) DOM.openPdfBtn.disabled = false;

        clearInterval(checkImageReady);
      } else if (attempts >= maxAttempts) {
        clearInterval(checkImageReady);
        console.warn("QR code generation timed out.");
      }
    }, 20);
  }

  // --- 5. FORM ACTIONS ---
  function clearUrlInputOnly() {
    if (!DOM.urlInput) return;
    DOM.urlInput.value = "";
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
    state.qrInstance = null;

    if (DOM.widthInput) DOM.widthInput.value = 200;
    if (DOM.heightInput) DOM.heightInput.value = 200;
  }

  // --- 6. PDF EXPORT LOGIC ---
  function openPdf() {
    if (!DOM.qrBadge || DOM.qrBadge.classList.contains("d-none")) return;

    // فتح نافذة فارغة فوراً لتجنب الحجب من متصفحات الموبايل (Pop-up Blocker)
    const pdfWindow = window.open("", "_blank");
    if (pdfWindow) {
      pdfWindow.document.write("Loading PDF preview...");
    }

    const options = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: "qr-badge.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff",
        scrollX: 0,
        scrollY: 0,
      },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.alignItems = "center";
    container.style.paddingTop = "40px";
    container.style.backgroundColor = "#ffffff";

    const clonedBadge = DOM.qrBadge.cloneNode(true);

    // ضمان نقل مصدر صورة الـ QR إلى العنصر المستنسخ بنجاح
    const originalImg = DOM.qrCodeCanvas?.querySelector("img");
    const clonedImg = clonedBadge.querySelector("#qrCodeCanvas img");
    if (originalImg && clonedImg) {
      clonedImg.src = originalImg.src;
    }

    container.appendChild(clonedBadge);

    html2pdf()
      .set(options)
      .from(container)
      .toPdf()
      .output("blob")
      .then((blob) => {
        const pdfUrl = URL.createObjectURL(blob);
        if (pdfWindow) {
          pdfWindow.location.href = pdfUrl;
        } else {
          window.location.href = pdfUrl;
        }
      })
      .catch((err) => {
        console.error("Error generating PDF preview:", err);
        if (pdfWindow) pdfWindow.close();
      });
  }

  // --- 7. EVENT BINDINGS ---
  if (DOM.themeToggle) {
    DOM.themeToggle.addEventListener("click", toggleTheme);
  }

  if (DOM.qrForm) {
    DOM.qrForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (DOM.generateBtn && !DOM.generateBtn.disabled) {
        generateQRCode();
      }
    });
  }

  if (DOM.urlInput) {
    ["input", "keyup", "change", "paste", "blur", "focus"].forEach((evt) => {
      DOM.urlInput.addEventListener(evt, () => {
        setTimeout(handleUrlInput, 10);
      });
    });
  }

  if (DOM.clearBtn) {
    DOM.clearBtn.addEventListener("click", clearUrlInputOnly);
  }

  if (DOM.generateBtn) {
    DOM.generateBtn.addEventListener("click", generateQRCode);
  }

  if (DOM.resetBtn) {
    DOM.resetBtn.addEventListener("click", resetForm);
  }

  if (DOM.openPdfBtn) {
    DOM.openPdfBtn.addEventListener("click", openPdf);
  }
});

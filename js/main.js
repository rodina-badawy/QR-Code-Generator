/**
 * QR Forge - Main Application Logic
 * Senior JavaScript implementation - English Only Version
 */

document.addEventListener("DOMContentLoaded", () => {
  // ==================================================
  // 1. DOM SELECTORS & STATE MANAGEMENT
  // ==================================================
  const DOM = {
    html: document.documentElement,
    themeToggle: document.getElementById("themeToggle"),
    themeIcon: document.getElementById("themeIcon"),
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

  // ==================================================
  // 2. DARK / LIGHT THEME TOGGLE
  // ==================================================
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

  // ==================================================
  // 3. INPUT VALIDATION & CLEAR BUTTON
  // ==================================================
  function isValidUrl(string) {
    if (!string) return false;
    const trimmed = string.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      return false;
    }
    try {
      new URL(trimmed);
      return true;
    } catch (_) {
      return false;
    }
  }

  function handleUrlInput() {
    const value = DOM.urlInput.value.trim();

    // Toggle clear button visibility
    if (value.length > 0) {
      DOM.clearBtn.classList.add("visible");
    } else {
      DOM.clearBtn.classList.remove("visible");
    }

    // Validate syntax and enable/disable generate button
    const valid = isValidUrl(value);
    DOM.generateBtn.disabled = !valid;
  }

  // ==================================================
  // 4. GENERATE QR CODE LOGIC
  // ==================================================
  function generateQRCode() {
    const url = DOM.urlInput.value.trim();
    if (!isValidUrl(url)) return;

    // Clear existing canvas content and previous instance reference
    DOM.qrCodeCanvas.innerHTML = "";
    state.qrInstance = null;

    // Parse dimension inputs (fallback to 200)
    const width = parseInt(DOM.widthInput.value, 10) || 200;
    const height = parseInt(DOM.heightInput.value, 10) || 200;

    // Initialize QRCode instance
    state.qrInstance = new QRCode(DOM.qrCodeCanvas, {
      text: url,
      width: width,
      height: height,
      colorDark: "#111827",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    // Update display state
    DOM.previewPlaceholder.classList.add("d-none");
    DOM.qrBadge.classList.remove("d-none");
    DOM.openPdfBtn.disabled = false;
  }

  // ==================================================
  // 5. RESET FUNCTIONALITY
  // ==================================================
  function resetForm() {
    DOM.urlInput.value = "";
    DOM.clearBtn.classList.remove("visible");

    DOM.generateBtn.disabled = true;
    DOM.openPdfBtn.disabled = true;

    DOM.qrBadge.classList.add("d-none");
    DOM.previewPlaceholder.classList.remove("d-none");

    DOM.qrCodeCanvas.innerHTML = "";
    state.qrInstance = null;

    DOM.widthInput.value = 200;
    DOM.heightInput.value = 200;
  }

  // ==================================================
  // 6. PDF GENERATION (html2pdf.js)
  // ==================================================
  function openPdf() {
    if (!DOM.qrBadge || DOM.qrBadge.classList.contains("d-none")) return;

    const options = {
      margin: [0.5, 0.5, 0.5, 0.5],
      filename: "qr-badge.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: document.documentElement.offsetWidth,
      },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    html2pdf()
      .set(options)
      .from(DOM.qrBadge)
      .toPdf()
      .outputPdf("bloburl")
      .then((pdfUrl) => {
        window.open(pdfUrl, "_blank");
      })
      .catch((err) => {
        console.error("Error generating PDF:", err);
      });
  }

  // ==================================================
  // EVENT LISTENERS BINDING
  // ==================================================
  if (DOM.themeToggle) DOM.themeToggle.addEventListener("click", toggleTheme);

  if (DOM.urlInput) DOM.urlInput.addEventListener("input", handleUrlInput);
  if (DOM.clearBtn) {
    DOM.clearBtn.addEventListener("click", () => {
      resetForm();
    });
  }

  if (DOM.generateBtn)
    DOM.generateBtn.addEventListener("click", generateQRCode);
  if (DOM.resetBtn) DOM.resetBtn.addEventListener("click", resetForm);
  if (DOM.openPdfBtn) DOM.openPdfBtn.addEventListener("click", openPdf);

  // Initial setup (Fixed to English LTR)
  DOM.html.setAttribute("lang", "en");
  DOM.html.setAttribute("dir", "ltr");
  DOM.html.setAttribute("data-theme", "light");
});

document.addEventListener("DOMContentLoaded", () => {
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

    if (value.length > 0) {
      DOM.clearBtn.classList.add("visible");
    } else {
      DOM.clearBtn.classList.remove("visible");
    }

    const valid = isValidUrl(value);
    DOM.generateBtn.disabled = !valid;
  }

  function generateQRCode() {
    const url = DOM.urlInput.value.trim();
    if (!isValidUrl(url)) return;


    DOM.qrCodeCanvas.innerHTML = "";
    state.qrInstance = null;

    
    const width = parseInt(DOM.widthInput.value, 10) || 200;
    const height = parseInt(DOM.heightInput.value, 10) || 200;

    
    DOM.previewPlaceholder.classList.add("d-none");
    DOM.qrBadge.classList.remove("d-none");
    DOM.openPdfBtn.disabled = false;

    // QR Code
    state.qrInstance = new QRCode(DOM.qrCodeCanvas, {
      text: url,
      width: width,
      height: height,
      colorDark: "#111827",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    const canvas = DOM.qrCodeCanvas.querySelector("canvas");
    if (canvas) {
      canvas.style.display = "none";
    }

    const checkAndClean = setInterval(() => {
      const img = DOM.qrCodeCanvas.querySelector("img");
      const currentCanvas = DOM.qrCodeCanvas.querySelector("canvas");

      if (img && img.src) {
        if (currentCanvas) currentCanvas.remove();
        clearInterval(checkAndClean);
      }
    }, 10);
  }

  function clearUrlInputOnly() {
    DOM.urlInput.value = "";
    DOM.clearBtn.classList.remove("visible");
    DOM.generateBtn.disabled = true;
    DOM.urlInput.focus();
  }

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
    container.style.paddingTop = "50px";

    const clonedBadge = DOM.qrBadge.cloneNode(true);
    container.appendChild(clonedBadge);

    html2pdf()
      .set(options)
      .from(container)
      .toPdf()
      .output("blob")
      .then((blob) => {
        const pdfUrl = URL.createObjectURL(blob);
        window.open(pdfUrl, "_blank");
      })
      .catch((err) => {
        console.error("Error generating PDF preview:", err);
      });
  }

  // Event Listeners
  if (DOM.themeToggle) DOM.themeToggle.addEventListener("click", toggleTheme);
  if (DOM.urlInput) DOM.urlInput.addEventListener("input", handleUrlInput);

  if (DOM.clearBtn) {
    DOM.clearBtn.addEventListener("click", clearUrlInputOnly);
  }

  if (DOM.generateBtn)
    DOM.generateBtn.addEventListener("click", generateQRCode);
  if (DOM.resetBtn) DOM.resetBtn.addEventListener("click", resetForm);
  if (DOM.openPdfBtn) DOM.openPdfBtn.addEventListener("click", openPdf);
});

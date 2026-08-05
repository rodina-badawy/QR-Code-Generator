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

  // تحسين دالة التحقق وتنسيق الرابط لتناسب كيبورد الموبايل والإكمال التلقائي
  function formatAndValidateUrl(rawString) {
    if (!rawString) return { valid: false, url: "" };
    let trimmed = rawString.trim();
    if (!trimmed) return { valid: false, url: "" };

    // إذا لم يدخل المستخدم البروتوكول، نضيفه تلقائياً
    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = "https://" + trimmed;
    }

    try {
      const parsed = new URL(trimmed);
      // التأكد من وجود اسم نطاق حقيقي
      const hasValidHost = parsed.hostname.includes(".");
      return { valid: hasValidHost, url: trimmed };
    } catch (_) {
      return { valid: false, url: "" };
    }
  }

  function handleUrlInput() {
    const value = DOM.urlInput ? DOM.urlInput.value : "";

    if (value.trim().length > 0) {
      if (DOM.clearBtn) DOM.clearBtn.classList.add("visible");
    } else {
      if (DOM.clearBtn) DOM.clearBtn.classList.remove("visible");
    }

    const { valid } = formatAndValidateUrl(value);
    if (DOM.generateBtn) DOM.generateBtn.disabled = !valid;
  }

  function generateQRCode() {
    const rawValue = DOM.urlInput ? DOM.urlInput.value : "";
    const { valid, url } = formatAndValidateUrl(rawValue);
    if (!valid) return;

    // 1. تفريغ الحاوية
    DOM.qrCodeCanvas.innerHTML = "";
    state.qrInstance = null;

    // 2. قراءة الأبعاد
    const width = parseInt(DOM.widthInput.value, 10) || 200;
    const height = parseInt(DOM.heightInput.value, 10) || 200;

    // 3. التوليد عبر المكتبة
    state.qrInstance = new QRCode(DOM.qrCodeCanvas, {
      text: url,
      width: width,
      height: height,
      colorDark: "#111827",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });

    // 4. التحقق والانتظار حتى تجهز صورة الـ QR وتتولد خلفيتها بنجاح
    const checkImageReady = setInterval(() => {
      const img = DOM.qrCodeCanvas.querySelector("img");
      const canvas = DOM.qrCodeCanvas.querySelector("canvas");

      if (img && img.getAttribute("src")) {
        if (canvas) canvas.style.display = "none";
        img.style.display = "block";

        // إظهار النتائج وتفعيل زر الـ PDF
        if (DOM.previewPlaceholder)
          DOM.previewPlaceholder.classList.add("d-none");
        if (DOM.qrBadge) DOM.qrBadge.classList.remove("d-none");
        if (DOM.openPdfBtn) DOM.openPdfBtn.disabled = false;

        clearInterval(checkImageReady);
      }
    }, 20);
  }

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

    // عنصر حاوي لضمان توسيط البادج في منتصف صفحة PDF وعدم اقتطاع الأطراف
    const container = document.createElement("div");
    container.style.width = "100%";
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.alignItems = "center";
    container.style.paddingTop = "40px";

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

  // --- Event Listeners ---
  if (DOM.themeToggle) DOM.themeToggle.addEventListener("click", toggleTheme);

  // ربط جميع أحداث الإدخال الممكنة على الهواتف لضمان استجابة زر الـ Generate
  if (DOM.urlInput) {
    ["input", "keyup", "change", "paste", "blur"].forEach((eventName) => {
      DOM.urlInput.addEventListener(eventName, () => {
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

  if (DOM.resetBtn) DOM.resetBtn.addEventListener("click", resetForm);
  if (DOM.openPdfBtn) DOM.openPdfBtn.addEventListener("click", openPdf);
});

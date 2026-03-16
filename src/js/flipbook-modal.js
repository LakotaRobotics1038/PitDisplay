const flipbookButtons = document.querySelectorAll(".open-flipbook");
const flipbookModalEl = document.getElementById("flipbook-modal");
const flipbookFrame = document.getElementById("flipbook-frame");

if (flipbookModalEl && flipbookFrame && flipbookButtons.length > 0 && window.bootstrap) {
  const flipbookModal = new bootstrap.Modal(flipbookModalEl, {
    backdrop: true,
    focus: true,
    keyboard: true
  });

  let pendingFlipbookSrc = "";
  let pendingFlipbookTitle = "";

  const clearFlipbookSource = () => {
    flipbookFrame.removeAttribute("src");
    flipbookFrame.setAttribute("title", "Flipbook");
  };

  const openFlipbook = (button) => {
    const flipbookSrc = button.getAttribute("data-flipbook-src");
    if (!flipbookSrc) return;

    pendingFlipbookSrc = flipbookSrc;
    pendingFlipbookTitle = button.getAttribute("data-flipbook-title") || "Flipbook";
    flipbookModal.show();
  };

  flipbookButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      openFlipbook(btn);
    });
  });

  flipbookModalEl.addEventListener("shown.bs.modal", () => {
    if (!pendingFlipbookSrc) return;
    flipbookFrame.setAttribute("title", pendingFlipbookTitle);
    if (flipbookFrame.getAttribute("src") !== pendingFlipbookSrc) {
      flipbookFrame.src = pendingFlipbookSrc;
    }
  });

  flipbookModalEl.addEventListener("hidden.bs.modal", () => {
    pendingFlipbookSrc = "";
    pendingFlipbookTitle = "";
    clearFlipbookSource();
  });
}

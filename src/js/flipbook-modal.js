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

  const clearFlipbookSource = () => {
    flipbookFrame.removeAttribute("src");
  };

  const openFlipbook = (button) => {
    const flipbookSrc = button.getAttribute("data-flipbook-src");
    if (!flipbookSrc) return;

    pendingFlipbookSrc = flipbookSrc;
    flipbookModal.show();
  };

  flipbookButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      openFlipbook(btn);
    });
  });

  flipbookModalEl.addEventListener("shown.bs.modal", () => {
    if (!pendingFlipbookSrc) return;
    if (flipbookFrame.getAttribute("src") !== pendingFlipbookSrc) {
      flipbookFrame.src = pendingFlipbookSrc;
    }
  });

  flipbookModalEl.addEventListener("hidden.bs.modal", () => {
    pendingFlipbookSrc = "";
    clearFlipbookSource();
  });
}

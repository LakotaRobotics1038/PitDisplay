const buttons = document.querySelectorAll(".open-panel");
const modalEl = document.getElementById("video-modal");
const videoEl = document.getElementById("modal-video");

if (modalEl && videoEl && buttons.length > 0 && window.bootstrap) {
  const modal = new bootstrap.Modal(modalEl, {
    backdrop: true,
    focus: true,
    keyboard: true
  });

  const setVideoSource = (src) => {
    videoEl.innerHTML = "";
    if (!src) {
      videoEl.load();
      return;
    }
    const source = document.createElement("source");
    source.src = src;
    source.type = "video/mp4";
    videoEl.appendChild(source);
    videoEl.load();
  };

  const openPanel = (button) => {
    const videoSrc = button.getAttribute("data-video");
    if (videoSrc) setVideoSource(videoSrc);
    modal.show();
  };

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      openPanel(btn);
    });
  });

  // --- Idle timer keepalive logic ---
  let idleKeepaliveInterval = null;
  function startIdleKeepalive() {
    if (idleKeepaliveInterval) return;
    if (window.idleScreenManager && typeof window.idleScreenManager.resetIdleTimer === 'function') {
      idleKeepaliveInterval = setInterval(() => {
        window.idleScreenManager.resetIdleTimer();
      }, 1000 * 10); // every 10 seconds
    }
  }
  function stopIdleKeepalive() {
    if (idleKeepaliveInterval) {
      clearInterval(idleKeepaliveInterval);
      idleKeepaliveInterval = null;
    }
  }

  videoEl.addEventListener('play', startIdleKeepalive);
  videoEl.addEventListener('pause', stopIdleKeepalive);
  videoEl.addEventListener('ended', stopIdleKeepalive);

  modalEl.addEventListener("hidden.bs.modal", () => {
    videoEl.pause();
    setVideoSource("");
    stopIdleKeepalive();
  });
}

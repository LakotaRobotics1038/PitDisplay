const socialButtons = document.querySelectorAll(".social-icon-btn");
const socialModalEl = document.getElementById("social-modal");
const socialQrCode = document.getElementById("social-qr-code");
const socialModalTitle = document.getElementById("social-modal-title");
const socialModalHandle = document.getElementById("social-modal-handle");

if (socialModalEl && socialButtons.length > 0 && window.bootstrap) {
  const socialModal = new bootstrap.Modal(socialModalEl, {
    backdrop: true,
    focus: true,
    keyboard: true
  });

  const getSocialName = (social) => {
    const names = {
      'facebook': 'Facebook',
      'instagram': 'Instagram',
      'linkedin': 'LinkedIn',
      'youtube': 'YouTube',
      'tiktok': 'TikTok',
      'twitter-x': 'X (Twitter)'
    };
    return names[social] || social;
  };

  const getQrFileName = (social) => {
    const fileNames = {
      'facebook': 'facebook.svg',
      'instagram': 'instagram.svg',
      'linkedin': 'linkedin.svg',
      'youtube': 'youtube.svg',
      'tiktok': 'tiktok.svg',
      'twitter-x': 'twitter-x.svg'
    };
    return fileNames[social] || `${social}.svg`;
  };

  const openSocialModal = (button) => {
    const social = button.getAttribute("data-social");
    const handle = button.getAttribute("data-handle");

    if (handle) {
      const qrCodePath = `./src/img/qr-codes/${getQrFileName(social)}`;
      socialQrCode.src = qrCodePath;
      socialQrCode.alt = `QR Code for ${getSocialName(social)}`;
      socialModalTitle.textContent = `Follow us on ${getSocialName(social)}`;
      socialModalHandle.textContent = handle;
      socialModal.show();
    }
  };

  socialButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      openSocialModal(btn);
    });
  });

  // Clear QR code when modal is closed
  socialModalEl.addEventListener("hidden.bs.modal", () => {
    socialQrCode.src = "";
  });
}

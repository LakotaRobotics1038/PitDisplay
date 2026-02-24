const seniorImages = [
  { name: 'Fredrick', path: './src/img/our-team/senior-banners/Fredrick.png' },
  { name: 'Iris', path: './src/img/our-team/senior-banners/Iris.png' },
  { name: 'Jack', path: './src/img/our-team/senior-banners/Jack.png' },
  { name: 'Morgan', path: './src/img/our-team/senior-banners/Morgan.png' },
  { name: 'Myles', path: './src/img/our-team/senior-banners/Myles.png' },
  { name: 'Nate', path: './src/img/our-team/senior-banners/Nate.png' }
];

const initSeniorsModal = () => {
  const seniorModalEl = document.getElementById("seniors-modal");
  const seniorGridContainer = document.getElementById("seniors-grid-container");
  const seniorFullscreenModalEl = document.getElementById("seniors-fullscreen-modal");
  const fullscreenImage = document.getElementById("fullscreen-senior-image");
  const fullscreenBackBtn = document.getElementById("seniors-fullscreen-back");
  const fullscreenCloseBtn = document.getElementById("seniors-fullscreen-close");

  if (!seniorModalEl || !seniorGridContainer || !window.bootstrap) {
    console.warn("Seniors modal elements not found");
    return;
  }

  const seniorModal = new bootstrap.Modal(seniorModalEl, {
    backdrop: true,
    focus: true,
    keyboard: true
  });

  const seniorFullscreenModal = new bootstrap.Modal(seniorFullscreenModalEl, {
    backdrop: true,
    focus: true,
    keyboard: true
  });

  // Populate the grid with images
  const populateGrid = () => {
    seniorGridContainer.innerHTML = '';
    seniorImages.forEach((senior) => {
      const button = document.createElement('button');
      button.className = 'senior-image-btn';
      button.type = 'button';
      button.setAttribute('aria-label', `View ${senior.name}`);

      const img = document.createElement('img');
      img.src = senior.path;
      img.alt = senior.name;

      button.appendChild(img);

      const openHandler = (event) => {
        if (event.type === 'touchend') {
          event.preventDefault();
        }
        openFullscreenImage(senior.path, senior.name);
      };

      button.addEventListener('click', openHandler);
      button.addEventListener('touchend', openHandler, { passive: false });
      button.addEventListener('pointerup', openHandler);

      seniorGridContainer.appendChild(button);
    });
  };

  const openFullscreenImage = (imagePath, imageName) => {
    fullscreenImage.src = imagePath;
    fullscreenImage.alt = imageName;
    seniorFullscreenModal.show();
  };

  // Back button in fullscreen modal closes fullscreen and returns to grid
  fullscreenBackBtn.addEventListener('click', () => {
    seniorFullscreenModal.hide();
  });

  // Close button in fullscreen modal closes both modals
  fullscreenCloseBtn.addEventListener('click', () => {
    seniorFullscreenModal.hide();
    seniorModal.hide();
  });

  // Clear when seniors modal is closed
  seniorModalEl.addEventListener("hidden.bs.modal", () => {
    seniorFullscreenModal.hide();
    fullscreenImage.src = "";
  });

  // Populate grid when modal is shown
  seniorModalEl.addEventListener("shown.bs.modal", () => {
    populateGrid();
  });

  // Initial population
  populateGrid();
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSeniorsModal);
} else {
  initSeniorsModal();
}

const sectionBtns = document.querySelectorAll(".section-btn");
const sections = document.querySelectorAll(".section");

const sectionOrder = ["home", "robot", "about", "fll", "workshops", "community", "pgsc", "impact", "sponsors"];

// Make switchSection globally available
window.switchSection = (sectionName) => {
  const currentSection = document.querySelector(".section.active");
  const targetSection = document.getElementById(`${sectionName}-section`);
  const targetBtn = document.querySelector(`[data-section="${sectionName}"]`);

  if (currentSection === targetSection) return;

  window.location.hash = sectionName;
  document.body.setAttribute("data-section", sectionName);

  const currentIndex = currentSection
    ? sectionOrder.indexOf(currentSection.id.replace("-section", ""))
    : 0;
  const targetIndex = sectionOrder.indexOf(sectionName);
  const movingForward = targetIndex > currentIndex;

  sections.forEach((section) => {
    if (section !== currentSection && section !== targetSection) {
      section.classList.add("no-transition");
      section.classList.remove("active", "from-left", "from-right", "slide-left", "slide-right");
      void section.offsetWidth;
      section.classList.remove("no-transition");
    }
  });

  if (currentSection) {
    const slideOutClass = movingForward ? "slide-left" : "slide-right";
    currentSection.classList.remove("active", "from-left", "from-right", "slide-left", "slide-right");
    currentSection.classList.add(slideOutClass);
  }

  sectionBtns.forEach((btn) => {
    btn.classList.remove("active");
  });
  if (targetBtn) targetBtn.classList.add("active");

  if (targetSection) {
    const fromClass = movingForward ? "from-right" : "from-left";
    targetSection.classList.remove("active", "from-left", "from-right", "slide-left", "slide-right");
    targetSection.classList.add("no-transition", fromClass);
    void targetSection.offsetWidth;
    targetSection.classList.remove("no-transition");

    requestAnimationFrame(() => {
      targetSection.classList.remove("from-left", "from-right");
      targetSection.classList.add("active");
    });
  }
};

const handleHashChange = () => {
  const hash = window.location.hash.slice(1);
  if (hash && sectionOrder.includes(hash)) {
    window.switchSection(hash);
  }
};

window.addEventListener("hashchange", handleHashChange);

window.addEventListener("load", () => {
  const hash = window.location.hash.slice(1);
  if (hash && sectionOrder.includes(hash)) {
    window.switchSection(hash);
  }
});

sectionBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const sectionName = btn.getAttribute("data-section");
    window.switchSection(sectionName);
  });
});

const buttons = document.querySelectorAll(".open-panel");
const panel = document.getElementById("video-panel");
const videoEl = document.getElementById("modal-video");
const sectionBtns = document.querySelectorAll(".section-btn");
const sections = document.querySelectorAll(".section");

// Section order for determining slide direction
const sectionOrder = ['about', 'robot', 'impact', 'sponsors'];

// Section Navigation
const switchSection = (sectionName) => {
	const currentSection = document.querySelector(".section.active");
	const targetSection = document.getElementById(`${sectionName}-section`);
	const targetBtn = document.querySelector(`[data-section="${sectionName}"]`);

	// Don't switch if already on this section
	if (currentSection === targetSection) return;

	// Update URL hash
	window.location.hash = sectionName;

	// Update body data attribute for background parallax
	document.body.setAttribute('data-section', sectionName);

	// Determine direction based on section order
	const currentIndex = currentSection ? sectionOrder.indexOf(currentSection.id.replace('-section', '')) : 0;
	const targetIndex = sectionOrder.indexOf(sectionName);
	const movingForward = targetIndex > currentIndex;

	// Clean up all sections that aren't current or target - reset them completely with no transition
	sections.forEach(section => {
		if (section !== currentSection && section !== targetSection) {
			section.classList.add('no-transition');
			section.classList.remove('active', 'from-left', 'from-right', 'slide-left', 'slide-right');
			// Force reflow
			void section.offsetWidth;
			section.classList.remove('no-transition');
		}
	});

	// Slide out current section
	if (currentSection) {
		const slideOutClass = movingForward ? 'slide-left' : 'slide-right';
		currentSection.classList.remove('active', 'from-left', 'from-right', 'slide-left', 'slide-right');
		currentSection.classList.add(slideOutClass);
	}

	// Update button states
	sectionBtns.forEach(btn => {
		btn.classList.remove("active");
	});
	if (targetBtn) targetBtn.classList.add("active");

	// Position target section instantly (no transition), then animate
	if (targetSection) {
		const fromClass = movingForward ? 'from-right' : 'from-left';

		// Clear all classes and disable transitions
		targetSection.classList.remove('active', 'from-left', 'from-right', 'slide-left', 'slide-right');
		targetSection.classList.add('no-transition', fromClass);

		// Force reflow to apply instant positioning
		void targetSection.offsetWidth;

		// Re-enable transitions and animate to center
		targetSection.classList.remove('no-transition');

		// Use requestAnimationFrame to ensure transition is re-enabled before animation
		requestAnimationFrame(() => {
			targetSection.classList.remove('from-left', 'from-right');
			targetSection.classList.add("active");
		});
	}
};

// Handle hash changes (browser back/forward and direct hash navigation)
const handleHashChange = () => {
	const hash = window.location.hash.slice(1); // Remove the '#' character
	if (hash && sectionOrder.includes(hash)) {
		switchSection(hash);
	}
};

// Listen for hash changes
window.addEventListener('hashchange', handleHashChange);

// Initialize on page load
window.addEventListener('load', () => {
	const hash = window.location.hash.slice(1);
	if (hash && sectionOrder.includes(hash)) {
		switchSection(hash);
	}
});

sectionBtns.forEach(btn => {
	btn.addEventListener("click", () => {
		const sectionName = btn.getAttribute("data-section");
		switchSection(sectionName);
	});
});

const setVideoSource = (src) => {
	if (!videoEl) return;
	videoEl.innerHTML = "";
	const source = document.createElement("source");
	source.src = src;
	source.type = "video/mp4";
	videoEl.appendChild(source);
	videoEl.load();
};

const animateContainerFromButton = (button) => {
	const container = panel.querySelector(".video-container");
	const video = panel.querySelector("video");
	if (!container) return;

	requestAnimationFrame(() => {
		const btnRect = button.getBoundingClientRect();
		const boxRect = container.getBoundingClientRect();

		const btnCenterX = btnRect.left + btnRect.width / 2;
		const btnCenterY = btnRect.top + btnRect.height / 2;
		const boxCenterX = boxRect.left + boxRect.width / 2;
		const boxCenterY = boxRect.top + boxRect.height / 2;

		const scaleX = btnRect.width / boxRect.width;
		const scaleY = btnRect.height / boxRect.height;
		const scale = Math.min(scaleX, scaleY);

		const translateX = btnCenterX - boxCenterX;
		const translateY = btnCenterY - boxCenterY;

		container.animate(
			[
				{ transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`, opacity: 0 },
				{ transform: "translate(0, 0) scale(1)", opacity: 1 }
			],
			{
				duration: 600,
				easing: "cubic-bezier(0.19, 1, 0.22, 1)",
				fill: "both"
			}
		);

		if (video) video.classList.add("is-zooming");
	});
};

const openPanel = (button) => {
	const videoSrc = button.getAttribute("data-video");
	if (videoSrc) setVideoSource(videoSrc);

	panel.classList.add("is-open");
	panel.setAttribute("aria-hidden", "false");
	document.body.classList.add("modal-open");

	const bg = panel.querySelector(".panel-bg");
	if (bg) {
		bg.animate([{ opacity: 0 }, { opacity: 1 }], {
			duration: 280,
			easing: "linear",
			fill: "both"
		});
	}

	panel.animate([{ opacity: 0 }, { opacity: 1}], {
		duration: 240,
		easing: "linear",
		fill: "both"
	});
	animateContainerFromButton(button);
};

const closePanel = () => {
	const video = panel.querySelector("video");
    const container = panel.querySelector(".video-container");
	if (video) video.classList.remove("is-zooming");

    container.animate([{ opacity: 1 , transform: 'scale(1)'}, { opacity: 0, transform: 'scale(0.5)'}], {
		duration: 220,
		easing: "linear",
		fill: "both"
	});

	panel.animate([{ opacity: 1}, { opacity: 0}], {
		duration: 220,
		easing: "linear",
		fill: "both"
	}).onfinish = () => {
		panel.classList.remove("is-open");
		panel.setAttribute("aria-hidden", "true");
		document.body.classList.remove("modal-open");
	};
};

buttons.forEach((btn) => {
	btn.addEventListener("pointerdown", (e) => {
		e.preventDefault();
		openPanel(btn);
	});
});

panel.querySelectorAll("[data-close]").forEach((el) => {
	el.addEventListener("pointerdown", () => closePanel());
});

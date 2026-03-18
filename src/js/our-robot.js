// Robot subsystem layered image show/hide with fade transition
const robotResetBtn = document.querySelector(".robot-reset-btn");
const robotLabels = document.querySelectorAll(".robot-label");
const subsystemImages = document.querySelectorAll(".robot-subsystem");
const robotBase = document.querySelector(".robot-base");
const cadIframe = document.getElementById("robot-cad-iframe");

const FADE_MS = 400;
let activeImage = null;

let cadRetryTimer = null;
let cadViewerConnected = false;
let cadRetryDelayMs = 1500;

const CAD_RETRY_INITIAL_DELAY_MS = 1500;
const CAD_RETRY_MAX_DELAY_MS = 10000;

const getCadViewerUrl = () => {
	if (!cadIframe) return "";
	return cadIframe.dataset.src || cadIframe.getAttribute("src") || "";
};

const withCacheBuster = (url) => {
	if (!url) return "";
	const separator = url.includes("?") ? "&" : "?";
	return `${url}${separator}retry=${Date.now()}`;
};

const clearCadRetryTimer = () => {
	if (!cadRetryTimer) return;
	clearTimeout(cadRetryTimer);
	cadRetryTimer = null;
};

const scheduleCadRetry = () => {
	clearCadRetryTimer();
	cadRetryTimer = setTimeout(() => {
		attemptCadViewerLoad();
	}, cadRetryDelayMs);
};

const attemptCadViewerLoad = () => {
	if (!cadIframe || cadViewerConnected) return;

	const cadViewerUrl = getCadViewerUrl();
	if (!cadViewerUrl) return;

	cadIframe.src = withCacheBuster(cadViewerUrl);
	scheduleCadRetry();
	cadRetryDelayMs = Math.min(Math.floor(cadRetryDelayMs * 1.5), CAD_RETRY_MAX_DELAY_MS);
};

const markCadViewerConnected = () => {
	if (cadViewerConnected) return;
	cadViewerConnected = true;
	clearCadRetryTimer();
	cadRetryDelayMs = CAD_RETRY_INITIAL_DELAY_MS;
};

const startCadViewerRetry = () => {
	if (!cadIframe) return;
	attemptCadViewerLoad();
};

const transitionToImage = (incoming) => {
	return new Promise((resolve) => {
		if (!incoming || incoming === activeImage) { resolve(); return; }

		const outgoing = activeImage;
		activeImage = incoming;

		// Fade the incoming in first
		incoming.classList.add("active");

		setTimeout(() => {
			// Then fade the outgoing out
			if (outgoing) outgoing.classList.remove("active");
			setTimeout(resolve, FADE_MS);
		}, FADE_MS);
	});
};

// Fade transition helpers for text sections
const fadeOutSection = (section) => {
	return new Promise((resolve) => {
		section.classList.remove("fade-in");
		section.classList.add("fade-out");

		setTimeout(() => {
			section.classList.add("d-none");
			resolve();
		}, FADE_MS);
	});
};

const fadeInSection = (section) => {
	section.classList.add("fade-out");
	section.classList.remove("fade-in");
	section.classList.remove("d-none");

	void section.offsetWidth;

	section.classList.remove("fade-out");
	section.classList.add("fade-in");
};

const resetRobotSection = async () => {
	await transitionToImage(robotBase);

	if (robotResetBtn) {
		robotResetBtn.style.display = "none";
	}

	const robotSection = document.getElementById("robot-section");
	const visibleSections = Array.from(robotSection?.querySelectorAll(".text-container") ?? []).filter(
		(s) => !s.classList.contains("d-none")
	);
	await Promise.all(visibleSections.map((s) => fadeOutSection(s)));

	document.querySelectorAll(".toggle-section").forEach((btn) => btn.classList.remove("active"));
	robotLabels.forEach((label) => label.classList.remove("active"));
};

const componentToTextSection = {
	hopper: "robot-hopper",
	shooters: "robot-shooters",
	drivetrain: "robot-drive",
	acquisition: "robot-acquisition"
};

robotLabels.forEach((label) => {
	label.addEventListener("click", async () => {
		const component = label.dataset.component;
		if (!component) return;

		const target = document.querySelector(`.robot-subsystem[data-subsystem="${component}"]`);
		if (!target) return;

		if (robotResetBtn) robotResetBtn.style.display = "flex";

		// Fade in the subsystem image, fade out whatever was showing
		await transitionToImage(target);

		// Fade out any visible text sections
		const robotSection = document.getElementById("robot-section");
		const visibleSections = Array.from(robotSection?.querySelectorAll(".text-container") ?? []).filter(
			(s) => !s.classList.contains("d-none")
		);
		await Promise.all(visibleSections.map((s) => fadeOutSection(s)));

		// Update active states
		document.querySelectorAll(".toggle-section").forEach((btn) => btn.classList.remove("active"));
		robotLabels.forEach((lbl) => lbl.classList.remove("active"));
		label.classList.add("active");

		// Fade in the corresponding text section
		const textSection = document.getElementById(componentToTextSection[component]);
		if (textSection) fadeInSection(textSection);
	});
});

if (robotResetBtn) {
	robotResetBtn.addEventListener("click", async () => {
		await resetRobotSection();
	});
}

window.resetRobotSection = resetRobotSection;

window.addEventListener("message", (event) => {
	const data = event?.data;
	if (!data || data.source !== "cad-viewer") return;

	if (data.type === "pitdisplay:viewer-ready" || data.type === "pitdisplay:activity") {
		markCadViewerConnected();
	}
});

// Initialize: show base robot image
if (robotBase) {
	robotBase.classList.add("active");
	activeImage = robotBase;
}

startCadViewerRetry();

// Toggle text sections on button click
const toggleButtons = document.querySelectorAll(".toggle-section");

toggleButtons.forEach((button) => {
	button.addEventListener("click", async () => {
		const targetId = button.dataset.target;
		const targetSection = document.getElementById(targetId);
		if (!targetSection) return;

		const isVisible = !targetSection.classList.contains("d-none");

		if (isVisible) {
			await fadeOutSection(targetSection);
			button.classList.remove("active");
		} else {
			// Fade out visible text sections and reset robot image
			const robotSection = document.getElementById("robot-section");
			const visibleSections = Array.from(robotSection?.querySelectorAll(".text-container") ?? []).filter(
				(s) => !s.classList.contains("d-none")
			);
			await Promise.all(visibleSections.map((s) => fadeOutSection(s)));

			await transitionToImage(robotBase);
			if (robotResetBtn) robotResetBtn.style.display = "none";
			robotLabels.forEach((label) => label.classList.remove("active"));

			toggleButtons.forEach((btn) => btn.classList.remove("active"));

			fadeInSection(targetSection);
			button.classList.add("active");
		}
	});
});


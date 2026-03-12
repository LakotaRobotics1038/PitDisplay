// Robot subsystem image switching with fade transition
const robotImage = document.querySelector(".robot-image");
const robotResetBtn = document.querySelector(".robot-reset-btn");
const robotLabels = document.querySelectorAll(".robot-label");
const fullRobotSrc = robotImage?.dataset.fullRobot;

const subsystemImages = {
	hopper: "./src/img/our-robot/Robot Hopper.png",
	climb: "./src/img/our-robot/Robot Climb.png",
	shooters: "./src/img/our-robot/Robot Shooter.png",
	drivetrain: "./src/img/our-robot/Robot Base.png",
	acquisition: "./src/img/our-robot/Robot Acquisition.png"
};

const ROBOT_FADE_IN_MS = 300;
const ROBOT_FADE_OUT_MS = 300;
const ROBOT_OVERLAY_FADE_OUT_MS = 120;
let robotTransitionToken = 0;

const resolveImageUrl = (src) => {
	if (!src) return "";
	try {
		return new URL(src, document.baseURI).href;
	} catch {
		return src;
	}
};

const transitionImage = (newSrc) => {
	if (!robotImage) return;
	if (!newSrc) return;

	const currentSrc = resolveImageUrl(robotImage.currentSrc || robotImage.src);
	const nextSrc = resolveImageUrl(newSrc);
	if (currentSrc === nextSrc) return;

	const container = robotImage.closest(".robot-container");
	if (!container) {
		robotImage.src = newSrc;
		return;
	}

	container.querySelectorAll(".robot-image-overlay").forEach((overlay) => overlay.remove());

	const transitionToken = ++robotTransitionToken;
	const incomingImage = document.createElement("img");
	incomingImage.src = newSrc;
	incomingImage.alt = robotImage.alt;
	incomingImage.className = "robot-image robot-image-overlay";

	container.appendChild(incomingImage);

	requestAnimationFrame(() => {
		if (transitionToken !== robotTransitionToken) return;
		incomingImage.classList.add("overlay-visible");
	});

	setTimeout(() => {
		if (transitionToken !== robotTransitionToken) {
			incomingImage.remove();
			return;
		}

		robotImage.classList.remove("fade-in");
		robotImage.classList.add("fade-out");

		setTimeout(() => {
			if (transitionToken !== robotTransitionToken) {
				incomingImage.remove();
				return;
			}

			robotImage.src = newSrc;

			const completeHandoff = () => {
				if (transitionToken !== robotTransitionToken) {
					incomingImage.remove();
					return;
				}

				// Reveal the updated base image immediately before removing overlay.
				robotImage.classList.add("no-fade");
				robotImage.classList.remove("fade-out");
				robotImage.classList.add("fade-in");
				void robotImage.offsetWidth;
				robotImage.classList.remove("no-fade");

				incomingImage.classList.add("overlay-handoff-out");
				setTimeout(() => {
					if (transitionToken === robotTransitionToken) {
						incomingImage.remove();
					}
				}, ROBOT_OVERLAY_FADE_OUT_MS);
			};

			if (typeof robotImage.decode === "function") {
				robotImage.decode().catch(() => {}).finally(completeHandoff);
			} else {
				requestAnimationFrame(completeHandoff);
			}
		}, ROBOT_FADE_OUT_MS);
	}, ROBOT_FADE_IN_MS);
};

// Fade transition helpers for text sections
const fadeOutSection = (section) => {
	return new Promise((resolve) => {
		section.classList.remove("fade-in");
		section.classList.add("fade-out");

		setTimeout(() => {
			section.classList.add("d-none");
			resolve();
		}, 300);
	});
};

const fadeInSection = (section) => {
	section.classList.remove("d-none");
	section.classList.remove("fade-out");

	// Force reflow to ensure the transition works
	void section.offsetWidth;

	section.classList.add("fade-in");
};

const resetRobotSection = async () => {
	if (!fullRobotSrc) return;
	transitionImage(fullRobotSrc);
	if (robotResetBtn) {
		robotResetBtn.style.display = "none";
	}

	// Hide any visible text sections
	const robotSection = document.getElementById("robot-section");
	const visibleSections = Array.from(robotSection?.querySelectorAll(".text-container") ?? []).filter(
		(section) => !section.classList.contains("d-none")
	);

	await Promise.all(visibleSections.map((section) => fadeOutSection(section)));

	// Remove active state from all buttons
	const toggleButtons = document.querySelectorAll(".toggle-section");
	toggleButtons.forEach((btn) => btn.classList.remove("active"));
	robotLabels.forEach((label) => label.classList.remove("active"));
};

// Map component names to text section IDs
const componentToTextSection = {
	hopper: "robot-hopper",
	climb: "robot-climb",
	shooters: "robot-shooters",
	drivetrain: "robot-drive",
	acquisition: "robot-acquisition"
};

robotLabels.forEach((label) => {
	label.addEventListener("click", async () => {
		const component = label.dataset.component;
		const newSrc = subsystemImages[component];

		if (newSrc) {
			transitionImage(newSrc);
			// Show reset button
			if (robotResetBtn) {
				robotResetBtn.style.display = "flex";
			}

			// Show corresponding text section
			const textSectionId = componentToTextSection[component];
			if (textSectionId) {
				const textSection = document.getElementById(textSectionId);
				if (textSection) {
					// Fade out all other visible sections first
				const robotSection = document.getElementById("robot-section");
				const visibleSections = Array.from(robotSection?.querySelectorAll(".text-container") ?? []).filter(
					(section) => !section.classList.contains("d-none")
				);

					await Promise.all(visibleSections.map((section) => fadeOutSection(section)));

					// Remove active state from all buttons
					const toggleButtons = document.querySelectorAll(".toggle-section");
					toggleButtons.forEach((btn) => btn.classList.remove("active"));
					robotLabels.forEach((lbl) => lbl.classList.remove("active"));

					// Fade in the target section and set active state
					fadeInSection(textSection);
					label.classList.add("active");
				}
			}
		}
	});
});

if (robotResetBtn) {
	robotResetBtn.addEventListener("click", async () => {
		await resetRobotSection();
	});
}

window.resetRobotSection = resetRobotSection;

// Toggle text sections on button click with fade transition
const toggleButtons = document.querySelectorAll(".toggle-section");

toggleButtons.forEach((button) => {
	button.addEventListener("click", async () => {
		const targetId = button.dataset.target;
		const targetSection = document.getElementById(targetId);

		if (!targetSection) return;

		// Reset robot image to full view when toggle button is clicked
		if (fullRobotSrc) {
			transitionImage(fullRobotSrc);
			if (robotResetBtn) {
				robotResetBtn.style.display = "none";
			}
			// Remove active state from robot labels
			robotLabels.forEach((label) => label.classList.remove("active"));
		}

		// Check if the section is currently visible
		const isVisible = !targetSection.classList.contains("d-none");

		if (isVisible) {
			// Fade out and hide the section
			await fadeOutSection(targetSection);
			button.classList.remove("active");
		} else {
			// Fade out all other visible sections first
			const robotSection = document.getElementById("robot-section");
			const visibleSections = Array.from(robotSection?.querySelectorAll(".text-container") ?? []).filter(
				(section) => !section.classList.contains("d-none")
			);

			await Promise.all(visibleSections.map((section) => fadeOutSection(section)));

			// Remove active state from all buttons
			toggleButtons.forEach((btn) => btn.classList.remove("active"));
			robotLabels.forEach((label) => label.classList.remove("active"));

			// Fade in the target section
			fadeInSection(targetSection);
			button.classList.add("active");
		}
	});
});

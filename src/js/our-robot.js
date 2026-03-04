// Robot subsystem image switching with fade transition
const robotImage = document.querySelector(".robot-image");
const robotResetBtn = document.querySelector(".robot-reset-btn");
const robotLabels = document.querySelectorAll(".robot-label");
const fullRobotSrc = robotImage?.dataset.fullRobot;

const subsystemImages = {
	hopper: "./src/img/our-robot/Robot Hopper.png",
	climb: "./src/img/our-robot/Robot Climb.png",
	shooters: "./src/img/our-robot/Robot Shooter.png",
	drivetrain: "./src/img/our-robot/Robot Drive train.png",
	acquisition: "./src/img/our-robot/Robot Acquisition.png"
};

const transitionImage = (newSrc) => {
	if (!robotImage) return;

	// Fade out
	robotImage.classList.remove("fade-in");
	robotImage.classList.add("fade-out");

	// Change image after fade out completes
	setTimeout(() => {
		robotImage.src = newSrc;
		// Fade in
		robotImage.classList.remove("fade-out");
		robotImage.classList.add("fade-in");
	}, 300);
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
	const visibleSections = Array.from(document.querySelectorAll(".text-container")).filter(
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
					const visibleSections = Array.from(document.querySelectorAll(".text-container")).filter(
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
			const visibleSections = Array.from(document.querySelectorAll(".text-container")).filter(
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

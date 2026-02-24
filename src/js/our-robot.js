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

const resetRobotSection = () => {
	if (!fullRobotSrc) return;
	transitionImage(fullRobotSrc);
	if (robotResetBtn) {
		robotResetBtn.style.display = "none";
	}
};

robotLabels.forEach((label) => {
	label.addEventListener("click", () => {
		const component = label.dataset.component;
		const newSrc = subsystemImages[component];

		if (newSrc) {
			transitionImage(newSrc);
			// Show reset button
			if (robotResetBtn) {
				robotResetBtn.style.display = "flex";
			}
		}
	});
});

if (robotResetBtn) {
	robotResetBtn.addEventListener("click", () => {
		resetRobotSection();
	});
}

window.resetRobotSection = resetRobotSection;

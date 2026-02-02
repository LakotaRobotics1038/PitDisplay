const buttons = document.querySelectorAll(".open-panel");
const panel = document.getElementById("video-panel");
const videoEl = document.getElementById("modal-video");

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
				duration: 520,
				easing: "cubic-bezier(0.31, 1.27, 0.00, 1.00)",
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

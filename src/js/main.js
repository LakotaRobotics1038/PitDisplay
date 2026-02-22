const nav = document.querySelector(".section-nav");
const headerImg = document.querySelector(".header-img");
const footerImg = document.querySelector(".footer-img");

const updateNavOffset = () => {
	if (!nav) return;
	const rect = nav.getBoundingClientRect();
	const offset = rect.top + window.scrollY + rect.height + 16;
	document.documentElement.style.setProperty("--nav-offset", `${offset}px`);
	if (headerImg) {
		const headerRect = headerImg.getBoundingClientRect();
		document.documentElement.style.setProperty("--header-img-height", `${headerRect.height}px`);
	}
	if (footerImg) {
		const footerRect = footerImg.getBoundingClientRect();
		document.documentElement.style.setProperty("--footer-img-height", `${footerRect.height}px`);
	}
};

window.addEventListener('resize', updateNavOffset);

// Initialize on page load
window.addEventListener('load', () => {
	updateNavOffset();
});

if (headerImg) {
	headerImg.addEventListener("load", updateNavOffset);
}

if (footerImg) {
	footerImg.addEventListener("load", updateNavOffset);
}

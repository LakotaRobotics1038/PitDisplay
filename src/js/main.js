const nav = document.querySelector(".section-nav");

const updateNavOffset = () => {
	if (!nav) return;
	const rect = nav.getBoundingClientRect();
	const offset = rect.top + window.scrollY + rect.height + 16;
	document.documentElement.style.setProperty("--nav-offset", `${offset}px`);
	const activeSection = document.querySelector(".section.active");
	const activeHeader = activeSection?.querySelector(".section-header") || null;
	const activeFooter = activeSection?.querySelector(".section-footer") || null;
	const headerHeight = activeHeader ? activeHeader.getBoundingClientRect().height : 0;
	const footerHeight = activeFooter ? activeFooter.getBoundingClientRect().height : 0;
	document.documentElement.style.setProperty("--section-header-height", `${headerHeight}px`);
	document.documentElement.style.setProperty("--section-footer-height", `${footerHeight}px`);
};

window.addEventListener('resize', updateNavOffset);
window.addEventListener('hashchange', updateNavOffset);

// Initialize on page load
window.addEventListener('load', () => {
	updateNavOffset();
});

document.querySelectorAll(".section-header").forEach((img) => {
	img.addEventListener("load", updateNavOffset);
});

document.querySelectorAll(".section-footer img").forEach((img) => {
	img.addEventListener("load", updateNavOffset);
});

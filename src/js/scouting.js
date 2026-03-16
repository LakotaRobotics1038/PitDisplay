const syncScoutingRowHeights = () => {
	const firstRowImage = document.querySelector('#scouting-section .row.row-cols-3 img');
	if (!firstRowImage) return;

	const firstRowHeight = firstRowImage.getBoundingClientRect().height;
	if (!firstRowHeight) return;

	document.documentElement.style.setProperty('--scouting-first-row-image-height', `${firstRowHeight}px`);
};

window.addEventListener('resize', syncScoutingRowHeights);
window.addEventListener('load', syncScoutingRowHeights);

document.querySelectorAll('#scouting-section .row.row-cols-3 img').forEach((img) => {
	img.addEventListener('load', syncScoutingRowHeights);
});

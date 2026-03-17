const syncScoutingRowHeights = () => {
	const firstRowImage = document.querySelector('#scouting-section .row.row-cols-3 img');
	if (!firstRowImage) return;

	const firstRowHeight = firstRowImage.getBoundingClientRect().height;
	if (!firstRowHeight) return;

	document.documentElement.style.setProperty('--scouting-first-row-image-height', `${firstRowHeight}px`);
};

const scoutingSubButtons = document.querySelectorAll('#scouting-section .scouting-sub-btn');
const scoutingSubPanels = document.querySelectorAll('#scouting-section .scouting-sub-panel');

const getScoutingTabFromHash = () => {
	const hash = window.location.hash.slice(1);
	if (!hash.startsWith('scouting:')) return null;
	return hash.slice('scouting:'.length);
};

const panelIdFromTab = (tabName) => {
	if (!tabName) return null;
	const normalized = tabName.endsWith('-panel') ? tabName : `${tabName}-panel`;
	return document.getElementById(normalized) ? normalized : null;
};

const tabNameFromPanelId = (panelId) => panelId.replace(/-panel$/, '');

const setActiveScoutingPanel = (panelId, updateHash = false) => {
	scoutingSubButtons.forEach((button) => {
		const isActive = button.dataset.scoutingTarget === panelId;
		button.classList.toggle('active', isActive);
		button.setAttribute('aria-selected', isActive ? 'true' : 'false');
	});

	scoutingSubPanels.forEach((panel) => {
		const isActive = panel.id === panelId;
		panel.classList.toggle('active', isActive);
		panel.hidden = !isActive;
	});

	if (updateHash) {
		window.location.hash = `scouting:${tabNameFromPanelId(panelId)}`;
	}

	syncScoutingRowHeights();
};

scoutingSubButtons.forEach((button) => {
	button.addEventListener('click', () => {
		setActiveScoutingPanel(button.dataset.scoutingTarget, true);
	});
});

const syncScoutingPanelFromHash = () => {
	const panelIdFromHash = panelIdFromTab(getScoutingTabFromHash());
	setActiveScoutingPanel(panelIdFromHash || 'match-scouting-panel');
};

window.addEventListener('hashchange', syncScoutingPanelFromHash);
syncScoutingPanelFromHash();

window.addEventListener('resize', syncScoutingRowHeights);
window.addEventListener('load', syncScoutingRowHeights);

document.querySelectorAll('#scouting-section .row.row-cols-3 img').forEach((img) => {
	img.addEventListener('load', syncScoutingRowHeights);
});

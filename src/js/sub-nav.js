const parseSectionFromHash = () => {
	const hash = window.location.hash.slice(1);
	if (!hash) return { section: '', tab: '' };
	const [section, tab = ''] = hash.split(':');
	return { section, tab };
};

const createSubNavController = (container) => {
	const section = container.dataset.subNavSection || container.closest('.section')?.id?.replace(/-section$/, '') || '';
	const defaultTab = container.dataset.subNavDefault || '';
	const buttons = Array.from(container.querySelectorAll('[data-sub-nav-target]'));
	const targetIds = buttons.map((button) => button.dataset.subNavTarget).filter(Boolean);
	const panels = targetIds
		.map((targetId) => document.getElementById(targetId))
		.filter((panel) => panel);

	if (!section || buttons.length === 0 || panels.length === 0) return null;

	const getPanelIdFromTab = (tab) => {
		if (!tab) return null;
		const normalized = tab.endsWith('-panel') ? tab : `${tab}-panel`;
		return targetIds.includes(normalized) ? normalized : null;
	};

	const getTabNameFromPanelId = (panelId) => panelId.replace(/-panel$/, '');

	const setActivePanel = (panelId, updateHash = false) => {
		buttons.forEach((button) => {
			const isActive = button.dataset.subNavTarget === panelId;
			button.classList.toggle('active', isActive);
			button.setAttribute('aria-selected', isActive ? 'true' : 'false');
		});

		panels.forEach((panel) => {
			const isActive = panel.id === panelId;
			panel.classList.toggle('active', isActive);
			panel.hidden = !isActive;
		});

		if (updateHash) {
			window.location.hash = `${section}:${getTabNameFromPanelId(panelId)}`;
		}

		container.dispatchEvent(new CustomEvent('subnav:change', {
			detail: {
				section,
				panelId,
				tab: getTabNameFromPanelId(panelId),
			},
		}));
	};

	const syncFromHash = () => {
		const { section: hashSection, tab: hashTab } = parseSectionFromHash();
		const panelIdFromHash = hashSection === section ? getPanelIdFromTab(hashTab) : null;
		const panelIdFromDefault = getPanelIdFromTab(defaultTab);
		const fallbackPanelId = targetIds[0];
		setActivePanel(panelIdFromHash || panelIdFromDefault || fallbackPanelId);
	};

	buttons.forEach((button) => {
		button.addEventListener('click', () => {
			setActivePanel(button.dataset.subNavTarget, true);
		});
	});

	window.addEventListener('hashchange', syncFromHash);
	syncFromHash();

	return {
		section,
		setActivePanel,
		syncFromHash,
	};
};

window.initializeSubNavs = () => {
	const controllers = [];
	document.querySelectorAll('[data-sub-nav]').forEach((container) => {
		const controller = createSubNavController(container);
		if (controller) controllers.push(controller);
	});
	return controllers;
};

window.initializeSubNavs();

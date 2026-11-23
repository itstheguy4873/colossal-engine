import { css } from "lit";

export const appStyles = css`
	:host {
		display: block;
		width: 100vw;
		height: 100vh;
		overflow: hidden;
		background: var(--ce-bg);
		color: var(--ce-text);
		font-family: var(--ce-font);
		font-size: var(--ce-font-size);
	}

	#dock {
		width: 100%;
		height: 100%;
	}

	/*
	 * Retune the dockview theme to the Explorer palette so the dock chrome and
	 * panel contents use the same design tokens.
	 */
	.dockview-theme-dark {
		--dv-group-view-background-color: var(--ce-surface);
		--dv-tabs-and-actions-container-background-color: var(--ce-surface-raised);
		--dv-activegroup-visiblepanel-tab-background-color: var(--ce-surface);
		--dv-activegroup-hiddenpanel-tab-background-color: var(--ce-surface);
		--dv-inactivegroup-visiblepanel-tab-background-color: var(--ce-surface);
		--dv-inactivegroup-hiddenpanel-tab-background-color: var(--ce-surface);
		--dv-tab-divider-color: var(--ce-border);
		--dv-activegroup-visiblepanel-tab-color: var(--ce-text);
		--dv-activegroup-hiddenpanel-tab-color: var(--ce-text-muted);
		--dv-inactivegroup-visiblepanel-tab-color: var(--ce-text-muted);
		--dv-inactivegroup-hiddenpanel-tab-color: var(--ce-text-dim);
		--dv-separator-border: var(--ce-border);
		--dv-tab-font-size: var(--ce-font-size);
	}
`;

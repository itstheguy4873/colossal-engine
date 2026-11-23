import { css } from "lit";

/*
 * Deliberately square and flat: no border radius and no shadow, so the menu
 * reads as part of the editor chrome rather than a floating card.
 */
export const contextMenuStyles = css`
	:host {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 100;
		display: block;
	}

	.menu {
		min-width: 200px;
		max-width: 320px;
		max-height: calc(100vh - 16px);
		overflow-y: auto;
		padding: 4px 0;
		border: 1px solid var(--ce-border-strong);
		background: var(--ce-surface-raised);
		color: var(--ce-text);
		font-family: var(--ce-font);
		font-size: var(--ce-font-size);
	}

	.heading {
		padding: 7px 10px;
		border-bottom: 1px solid var(--ce-border);
		color: var(--ce-text-muted);
		font-size: var(--ce-font-size-small);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.group-label {
		padding: 7px 10px 4px;
		color: var(--ce-text-dim);
		font-size: 11px;
		letter-spacing: 0.04em;
	}

	.item {
		display: flex;
		align-items: center;
		gap: var(--ce-gap);
		width: 100%;
		height: 28px;
		padding: 0 10px;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
	}

	.item:hover,
	.item:focus-visible {
		background: var(--ce-accent-strong);
		outline: none;
	}

	.item.danger {
		color: var(--ce-danger);
	}

	.item:disabled,
	.item:disabled:hover {
		background: transparent;
		color: var(--ce-text-dim);
		cursor: default;
	}

	.icon {
		width: var(--ce-icon-size);
		height: var(--ce-icon-size);
		min-width: var(--ce-icon-size);
		object-fit: contain;
	}

	.label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.separator {
		height: 1px;
		margin: 4px 0;
		background: var(--ce-border);
	}
`;

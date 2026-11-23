import { css } from "lit";

/*
 * Tree indentation is driven by the `--depth` custom property set on each row
 * (see `ExplorerWindow.renderNode`). Keeping the arithmetic here means the
 * render function never repeats pixel math.
 */
export const explorerStyles = css`
	:host {
		display: block;
		width: 100%;
		height: 100%;
		overflow: hidden;
		color: var(--ce-text);
		background: var(--ce-surface);
		font-family: var(--ce-font);
		font-size: var(--ce-font-size);
	}

	.explorer {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.tree {
		flex: 1;
		overflow: auto;
		padding: 6px 0;
		outline: none;
	}

	.node-row {
		height: var(--ce-row-height);
		display: flex;
		align-items: center;
		gap: var(--ce-gap);
		padding-right: 8px;
		padding-left: calc(var(--depth, 0) * var(--ce-indent) + 6px);
		cursor: grab;
		white-space: nowrap;
		user-select: none;
	}

	.node-row:hover {
		background: var(--ce-surface-hover);
	}

	.node-row:active {
		cursor: grabbing;
	}

	.node-row.selected {
		background: var(--ce-accent-strong);
		color: white;
	}

	.node-row.dragging {
		opacity: 0.4;
	}

	.node-row.drop-target {
		background: var(--ce-accent-soft);
		outline: 1px solid var(--ce-accent);
		outline-offset: -1px;
	}

	.arrow {
		width: 12px;
		min-width: 12px;
		font-size: 10px;
		color: var(--ce-text-muted);
		cursor: pointer;
	}

	.icon {
		width: var(--ce-icon-size);
		height: var(--ce-icon-size);
		min-width: var(--ce-icon-size);
		object-fit: contain;
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.class-name {
		margin-left: 5px;
		color: var(--ce-text-dim);
		font-size: var(--ce-font-size-small);
	}

	.rename {
		flex: 1;
		height: 19px;
		min-width: 40px;
		padding: 0 4px;
		border: 1px solid var(--ce-accent);
		background: var(--ce-input);
		color: var(--ce-text);
		font: inherit;
		outline: none;
	}

	.row-action {
		width: 18px;
		height: 18px;
		margin-left: auto;
		padding: 0;
		border: 0;
		background: transparent;
		color: var(--ce-text-muted);
		font: inherit;
		line-height: 1;
		cursor: pointer;
		opacity: 0;
	}

	.node-row:hover .row-action,
	.node-row.selected .row-action,
	.node-row:focus-within .row-action {
		opacity: 1;
	}

	.row-action:hover {
		color: var(--ce-text);
		background: var(--ce-surface-hover);
	}

	.empty {
		padding: 12px;
		color: var(--ce-text-muted);
	}
`;

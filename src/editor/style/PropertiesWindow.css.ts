import { css } from "lit";

export const propertiesStyles = css`
	:host {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		min-width: 0;
		overflow: hidden;
		color: var(--ce-text);
		background: var(--ce-surface);
		font-family: var(--ce-font);
		font-size: var(--ce-font-size);
	}

	.properties {
		display: flex;
		flex-direction: column;
		width: 100%;
		height: 100%;
		overflow-x: hidden;
		overflow-y: auto;
	}

	/* Selected instance header */

	.instance-header {
		display: flex;
		align-items: center;
		gap: 10px;
		min-height: 48px;
		padding: 12px;
		background: var(--ce-surface-secondary);
		border-bottom: 1px solid var(--ce-border);
	}

	.instance-header img {
		width: var(--ce-icon-size);
		height: var(--ce-icon-size);
		object-fit: contain;
	}

	.instance-info {
		display: flex;
		flex-direction: column;
		gap: 3px;
		min-width: 0;
	}

	.instance-info strong {
		overflow: hidden;
		color: var(--ce-text);
		font-size: var(--ce-font-size);
		font-weight: 600;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.instance-info small {
		color: var(--ce-text-muted);
		font-size: var(--ce-font-size-small);
	}

	/* Property sections */

	.section {
		display: flex;
		flex-direction: column;
		width: 100%;
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: 7px;
		height: 28px;
		padding: 0 10px;
		color: var(--ce-text);
		background: var(--ce-surface-secondary);
		border-bottom: 1px solid var(--ce-border);
		font-size: var(--ce-font-size-small);
		font-weight: 600;
		cursor: pointer;
		user-select: none;
	}

	.section-header:hover {
		background: var(--ce-surface-hover);
	}

	.arrow {
		width: 10px;
		color: var(--ce-text-muted);
		font-size: 9px;
	}

	.section-content {
		display: flex;
		flex-direction: column;
		padding: 3px 0;
	}

	/* Individual properties */

	.property {
		display: grid;
		grid-template-columns: minmax(90px, 1fr) minmax(0, 1.2fr);
		align-items: center;
		gap: var(--ce-gap);
		min-height: var(--ce-row-height);
		padding: 2px 10px;
	}

	.property:hover {
		background: var(--ce-surface-hover);
	}

	.property-name {
		overflow: hidden;
		color: white;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.property-value {
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.property-value input[type="text"],
	.property-value input[type="number"] {
		box-sizing: border-box;
		width: 100%;
		height: 22px;
		min-width: 0;
		padding: 2px 6px;
		color: var(--ce-text);
		background: var(--ce-input);
		border: 1px solid var(--ce-border);
		border-radius: 2px;
		outline: none;
		font-family: inherit;
		font-size: var(--ce-font-size-small);
	}

	.property-value input:hover {
		border-color: var(--ce-border-strong);
	}

	.property-value input:focus {
		background: var(--ce-surface);
		border-color: var(--ce-accent);
	}

	.property-value input[type="checkbox"] {
		width: 14px;
		height: 14px;
		margin: 0;
		accent-color: var(--ce-accent);
		cursor: pointer;
	}

	.readonly {
		overflow: hidden;
		color: var(--ce-text-muted);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* Empty state */

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		min-height: 120px;
		padding: 20px;
		color: var(--ce-text-muted);
		text-align: center;
	}

	.empty span {
		color: var(--ce-text);
		font-size: var(--ce-font-size);
		font-weight: 600;
	}

	.empty small {
		max-width: 200px;
		font-size: var(--ce-font-size-small);
		line-height: 1.5;
	}

	/* Scrollbar */

	.properties::-webkit-scrollbar {
		width: 8px;
	}

	.properties::-webkit-scrollbar-track {
		background: var(--ce-surface);
	}

	.properties::-webkit-scrollbar-thumb {
		background: var(--ce-scrollbar);
		border-radius: 4px;
	}

	.properties::-webkit-scrollbar-thumb:hover {
		background: var(--ce-scrollbar-hover);
	}
`;

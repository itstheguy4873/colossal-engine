
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BaseWindow } from './BaseWindow';

@customElement('explorer-window')
export class ExplorerWindow extends BaseWindow {
    title = 'Explorer';

    @state()
    private revision = 0;

    @state()
    private expanded = new Set<any>();

    @state()
    private selected: any = null;

    private connections: any[] = [];

    connectedCallback() {
        super.connectedCallback();
        this.refreshSubscriptions();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.disconnectAll();
    }

    updated(changed: Map<PropertyKey, unknown>) {
        if (changed.has('engine')) {
            this.refreshSubscriptions();
        }
    }

    private disconnectAll() {
        for (const connection of this.connections) {
            connection.Disconnect?.();
        }

        this.connections = [];
    }

    private refreshSubscriptions() {
        this.disconnectAll();

        const root = this.engine?.DataModel;
        if (!root) return;

        const subscribe = (signal: any) => {
            if (signal && typeof signal.Connect === 'function') {
                const connection = signal.Connect(() => {
                    this.refreshSubscriptions();
                    this.revision++;
                });

                this.connections.push(connection);
            }
        };

        const observe = (instance: any) => {
            subscribe(instance.ChildAdded);
            subscribe(instance.ChildRemoved);

            for (const child of instance.GetChildren()) {
                observe(child);
            }
        };

        observe(root);
        this.requestUpdate();
    }

    private toggle(instance: any) {
        const next = new Set(this.expanded);

        if (next.has(instance)) {
            next.delete(instance);
        } else {
            next.add(instance);
        }

        this.expanded = next;
    }

    private select(instance: any) {
        this.selected = instance;
    }

    private renderNode(instance: any, depth = 0) {
        const children = instance.GetChildren();
        const hasChildren = children.length > 0;
        const isExpanded = this.expanded.has(instance);
        const isSelected = this.selected === instance;

        return html`
            <div class="node">
                <div
                    class="node-row ${isSelected ? 'selected' : ''}"
                    style="padding-left: ${depth * 16 + 6}px"
                    @click=${() => this.select(instance)}
                    @dblclick=${() => this.toggle(instance)}
                >
                    <span
                        class="arrow"
                        @click=${(event: Event) => {
                            event.stopPropagation();
                            this.toggle(instance);
                        }}
                    >
                        ${hasChildren
                            ? isExpanded ? '▼' : '▶'
                            : ''}
                    </span>

                    <span class="icon">
                        <img
                          class="icon"
                          src=${this.getIcon(instance)}
                          alt=""
                          @error=${(event: Event) => {
                              (event.target as HTMLImageElement).src =
                                  '/class_icons/instance.svg';
                          }}
                      />
                    </span>

                    <span class="name">
                        ${instance.Name}
                    </span>

                    <span class="class-name">
                        ${instance.ClassName ?? ''}
                    </span>
                </div>

                ${isExpanded
                    ? html`
                        <div class="children">
                            ${children.map((child: any) =>
                                this.renderNode(child, depth + 1)
                            )}
                        </div>
                    `
                    : ''}
            </div>
        `;
    }

    private getIcon(instance: any): string {
        return `/class_icons/${instance.ClassName}.svg`;
    }

    render() {
        // Referencing revision makes hierarchy updates reactive.
        void this.revision;

        const root = this.engine?.DataModel;

        if (!root) {
            return html`
                <div class="empty">
                    No DataModel
                </div>
            `;
        }

        return html`
            <div class="explorer">
                <div class="toolbar">
                    <span>Explorer</span>
                    <span class="toolbar-actions">
                        ${this.selected?.Name ?? ''}
                    </span>
                </div>

                <div class="tree">
                    ${this.renderNode(root)}
                </div>
            </div>
        `;
    }

    static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            overflow: hidden;
            color: #cccccc;
            background: #252526;
            font-family: Arial, sans-serif;
            font-size: 12px;
        }

        .explorer {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
        }

        .toolbar {
            height: 30px;
            min-height: 30px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px;
            background: #333333;
            border-bottom: 1px solid #444;
            font-weight: 600;
        }

        .toolbar-actions {
            color: #999;
            font-weight: normal;
        }

        .tree {
            flex: 1;
            overflow: auto;
            padding: 5px 0;
        }

        .node-row {
            height: 23px;
            display: flex;
            align-items: center;
            gap: 5px;
            padding-right: 8px;
            cursor: pointer;
            white-space: nowrap;
            user-select: none;
        }

        .node-row:hover {
            background: #383838;
        }

        .node-row.selected {
            background: #094771;
            color: white;
        }

        .arrow {
            width: 12px;
            min-width: 12px;
            font-size: 9px;
            color: #aaa;
            cursor: pointer;
        }

        .icon {
            width: 17px;
            min-width: 17px;
            text-align: center;
        }

        .name {
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .class-name {
            margin-left: 5px;
            color: #858585;
            font-size: 10px;
        }

        .empty {
            padding: 12px;
            color: #999;
        }
    `;
}

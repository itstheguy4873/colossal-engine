import { useEffect, useRef } from "react";
import { BaseWindow } from "./BaseWindow";
import { useEditor } from "../core/EditorProvider";

/**
 * The engine owns a single viewport element. React must not create or destroy
 * it, so the view simply moves that element into its host and hands it back
 * when the panel unmounts (hiding a tab, restoring a layout, or hot reloading).
 */
export class SceneWindow extends BaseWindow {
	public readonly id = "scene";
	public readonly title: string;

	public constructor(title = "Scene") {
		super();
		this.title = title;
	}

	public Render() {
		return <SceneView />;
	}
}

function SceneView() {
	const { engine } = useEditor();
	const hostRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const host = hostRef.current;
		const viewport = engine.Viewport();

		host?.appendChild(viewport);

		return () => {
			// Leave the element detached instead of letting React remove it: the
			// engine keeps rendering, and the next mount appends it again.
			viewport.remove();
		};
	}, [engine]);

	return <div className="ce-scene" ref={hostRef} />;
}

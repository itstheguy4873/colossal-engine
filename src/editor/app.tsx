import { useEffect, useState } from "react";
import { DockLayout, type LayoutData } from "rc-dock";

import { Engine } from "../engine";
import { WebBackend } from "../engine/web";
import { EditorContextImpl } from "./core/EditorContext";
import { EditorProvider, type EditorServices } from "./core/EditorProvider";
import { LayoutManager } from "./layouts/LayoutManager";

/**
 * The editor shell: one engine, one selection context, one dock.
 *
 * The engine is created once per mount (the viewport element it owns is moved
 * into SceneWindow), then started from an effect so teardown can wait for
 * startup to finish before stopping it.
 */
export function App() {
	const [services] = useState<EditorServices>(() => {
		const mount = document.createElement("div");
		const engine = new Engine("Colossal Engine", new WebBackend(mount));
		const context = new EditorContextImpl();

		context.engine = engine;

		return { engine, context };
	});

	const [layoutManager] = useState(() => new LayoutManager(services.engine.Name));
	const [initialLayout] = useState<LayoutData>(() => layoutManager.LoadLayout());

	useEffect(() => {
		const startTask = services.engine.Start();

		return () => {
			// `Engine.Stop()` is a no-op until `Start()` has finished, so wait for
			// it to settle. Otherwise a teardown during startup is ignored and the
			// frame loop keeps rendering into a removed element.
			void startTask.then(() => services.engine.Stop());
		};
	}, [services]);

	return (
		<EditorProvider value={services}>
			<div className="ce-app">
				<DockLayout
					defaultLayout={initialLayout}
					loadTab={layoutManager.LoadTab}
					saveTab={layoutManager.SaveTab}
					onLayoutChange={(layout) => layoutManager.SaveLayout(layout)}
					style={{ position: "absolute", inset: 0 }}
				/>
			</div>
		</EditorProvider>
	);
}

import { createContext, useContext, useSyncExternalStore } from "react";
import type { Engine } from "../../engine";
import type { EditorContext } from "./EditorContext";

export interface EditorServices {
	engine: Engine;
	context: EditorContext;
}

const EditorServicesContext = createContext<EditorServices | null>(null);

export const EditorProvider = EditorServicesContext.Provider;

export function useEditor(): EditorServices {
	const services = useContext(EditorServicesContext);

	if (!services) {
		throw new Error("Editor windows must be rendered inside <EditorProvider>.");
	}

	return services;
}

/** The current Explorer selection, shared by every window. */
export function useSelectedInstance(): any {
	const { context } = useEditor();

	return useSyncExternalStore(
		context.subscribe,
		context.getSelectedInstance,
		context.getSelectedInstance,
	);
}

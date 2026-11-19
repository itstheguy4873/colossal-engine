import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { CFrame, Color3, Engine, InstanceFactory, Vector3 } from "./engine";
import { WebBackend } from "./engine/web";

/**
 * The contents of the viewport. This is the only scene setup in the app; the
 * editor will replace it with loading the DataModel.
 */
const SetupScene = (EngineInstance: Engine): void => {
	const Workspace = EngineInstance.DataModel.GetService("Workspace");

	const Part = InstanceFactory.new("Part");

	Part.Size = new Vector3(4, 1, 4);
	Part.Color = Color3.fromRGB(200, 65, 65);
	Part.Parent = Workspace;

	Workspace.CurrentCamera.CFrame = new CFrame(new Vector3(0, 6, 12), new Vector3(-0.45, 0, 0));
};

const Viewport = ({ onClose }: { onClose: () => void }): ReactElement => {
	const ContainerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const Container = ContainerRef.current;

		if (!Container) return;

		const EngineInstance = new Engine("Colossal Engine", new WebBackend(Container));

		SetupScene(EngineInstance);

		const Started = EngineInstance.Start();

		return () => {
			// Start() is async: stopping while it is still initializing would leave
			// the frame loop running, so wait for it to finish before tearing down.
			Started.catch(console.error).then(() => EngineInstance.Stop());
		};
	}, []);

	return (
		<>
			<div className="viewport" ref={ContainerRef} />
			<button className="viewport-close" type="button" onClick={onClose}>
				Close viewport
			</button>
		</>
	);
};

export const App = (): ReactElement => {
	const [IsOpen, SetIsOpen] = useState(false);

	return (
		<div className="launcher">
			{IsOpen ? (
				<Viewport onClose={() => SetIsOpen(false)} />
			) : (
				<>
					<h1>Colossal Engine</h1>
					<button type="button" onClick={() => SetIsOpen(true)}>
						Open viewport
					</button>
				</>
			)}
		</div>
	);
};

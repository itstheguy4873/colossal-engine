import * as Classes from "../classes";

export class InstanceFactory {
	public static new(className: string, parent?: Classes.Instance | null): Classes.Instance {
		const constructor = (Classes as any)[className];

		if (!constructor) {
			throw new Error(`Unknown class: ${className}`);
		}

		console.log("Created", className);

		const instance = new constructor(className);

		if (parent) {
			instance.Parent = parent;
		}

		return instance;
	}
}

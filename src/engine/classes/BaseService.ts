import { Instance } from "./Instance";

export abstract class BaseService extends Instance {
	public static readonly Abstract = true;

	public get ClassName(): string {
		return "BaseService";
	}

	constructor(Name: string) {
		super(Name);
	}
}

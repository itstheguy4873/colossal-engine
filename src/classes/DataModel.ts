import * as Classes from "./index";
import { InstanceFactory } from "../core/Factory";

type Concrete<T> = T extends new (...args: any) => infer R ? R : never;

type ServiceMap = {
	[
		Name in keyof typeof Classes as Concrete<(typeof Classes)[Name]> extends Classes.BaseService
			? Name
			: never
	]: Concrete<(typeof Classes)[Name]>;
};

type ServiceName = keyof ServiceMap;

export class DataModel extends Classes.Instance {
	public get ClassName(): string {
		return "DataModel";
	}

	private readonly Services = new Map<string, Classes.BaseService>();

	constructor(Name: string) {
		super(Name);
	}

	public GetService<Name extends ServiceName>(serviceName: Name): ServiceMap[Name];
	public GetService<T extends Classes.BaseService = Classes.BaseService>(serviceName: string): T;
	public GetService<T extends Classes.BaseService = Classes.BaseService>(serviceName: string): T {
		const existing = this.Services.get(serviceName);

		if (existing) {
			return existing as T;
		}

		const service = InstanceFactory.Create(serviceName);

		if (!(service instanceof Classes.BaseService)) {
			throw new Error(`'${serviceName}' is not a Service.`);
		}

		service.Parent = this;

		this.Services.set(serviceName, service);

		return service as T;
	}
}

import { Instance } from "./Instance";
import { BaseService } from "./BaseService";
import { InstanceFactory } from "../core/Factory";

export class DataModel extends Instance {
	public get ClassName(): string {
		return "DataModel";
	}

	private readonly Services = new Map<string, BaseService>();

	constructor(Name: string) {
		super(Name);
	}

	public GetService<T extends BaseService = BaseService>(serviceName: string): T {
		const existing = this.Services.get(serviceName);

		if (existing) {
			return existing as T;
		}

		const service = InstanceFactory.new(serviceName);

		if (!(service instanceof BaseService)) {
			throw new Error(`'${serviceName}' is not a Service.`);
		}

		service.Parent = this;

		this.Services.set(serviceName, service);

		return service as T;
	}
}

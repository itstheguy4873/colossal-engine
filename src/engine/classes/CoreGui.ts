import { BaseService } from "./BaseService";

export class CoreGui extends BaseService {
	public static readonly Concrete = true;

	public get ClassName(): string {
		return "CoreGui";
	}
}

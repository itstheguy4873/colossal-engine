import { BaseService } from "./BaseService";

/**
 * Holds developer-authored ScreenGuis, like Roblox's PlayerGui.
 *
 * Roblox parents PlayerGui under Player; there is no Players service yet, so it
 * is a DataModel service for now and can move under Player later without moving
 * any ScreenGui the game already created.
 */
export class PlayerGui extends BaseService {
	public static readonly Concrete = true;

	public get ClassName(): string {
		return "PlayerGui";
	}
}

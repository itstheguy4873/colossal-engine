
import { BaseService } from "./BaseService";

export class UserInputService extends BaseService {
    public get ClassName(): string {
        return "UserInputService";
    }

    public _currentKeys: Set<string>;

    constructor(Name: string) {
        super(Name);

        this._currentKeys = new Set();

        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
        window.addEventListener("blur", this._onBlur);
    }

    private _onKeyDown = (event: KeyboardEvent): void => {
        this._setKeyEnabled(event.code, true);
    };

    private _onKeyUp = (event: KeyboardEvent): void => {
        this._setKeyEnabled(event.code, false);
    };

    private _onBlur = (): void => {
        this._currentKeys.clear();
    };

    public _setKeyEnabled(Key: string, Enabled: boolean): void {
        if (Enabled) {
            this._currentKeys.add(Key);
        } else {
            this._currentKeys.delete(Key);
        }
    }

    public IsKeyDown(Key: string): boolean {
        return this._currentKeys.has(Key);
    }
}

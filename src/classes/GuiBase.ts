import { Instance } from "./Instance";

export abstract class GuiBase extends Instance {
    public get ClassName(): string {
        return "GuiBase";
    }

    public Enabled: boolean;
    public ResetOnSpawn: boolean;

    constructor(Name: string) {
        super(Name);

        this.Enabled = true;
        this.ResetOnSpawn = true;
    }
}
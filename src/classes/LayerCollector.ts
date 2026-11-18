import { GuiBase } from "./GuiBase";

export abstract class LayerCollector extends GuiBase {
    public get ClassName(): string {
        return "LayerCollector";
    }

    constructor(Name: string) {
        super(Name);
    }
}
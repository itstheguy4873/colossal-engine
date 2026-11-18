import { IGui } from "../../interfaces/IGui";
import { CoreGui } from "../../../classes/CoreGui";
import { GuiButton } from "../../../classes/GuiButton";
import { GuiObject } from "../../../classes/GuiObject";
import { Instance } from "../../../classes/Instance";
import { ScreenGui } from "../../../classes/ScreenGui";
import { ScrollingFrame } from "../../../classes/ScrollingFrame";
import { TextBox } from "../../../classes/TextBox";
import { TextButton } from "../../../classes/TextButton";
import { TextLabel } from "../../../classes/TextLabel";
import { TextXAlignment, TextYAlignment } from "../../../classes/TextAlignment";
import { Color3 } from "../../../datatypes/Color3";
import { UDim } from "../../../datatypes/UDim";
import { Vector2 } from "../../../datatypes/Vector2";
import { UiRegistry } from "../../../rendering/UiRegistry";

type StyleMap = Record<string, string>;

type TextObject = GuiObject & {
	Text: string;
	TextSize: number;
	TextColor3: Color3;
	TextWrapped: boolean;
	TextXAlignment: TextXAlignment;
	TextYAlignment: TextYAlignment;
};

interface ButtonState {
	Hovered: boolean;
	Pressed: boolean;
}

const PLAYER_GUI_Z_INDEX = 10;
const CORE_GUI_Z_INDEX = 20;

const CSSLength = (Dimension: UDim): string =>
	`calc(${Dimension.Scale * 100}% + ${Dimension.Offset}px)`;

const ResolveLength = (Dimension: UDim, Total: number): number =>
	Dimension.Scale * Total + Dimension.Offset;

const CSSColor = (Color: Color3, Transparency: number): string => {
	const Red = Math.round(Color.R * 255);
	const Green = Math.round(Color.G * 255);
	const Blue = Math.round(Color.B * 255);
	const Alpha = Math.min(1, Math.max(0, 1 - Transparency));

	return `rgba(${Red}, ${Green}, ${Blue}, ${Alpha})`;
};

const ToKebabCase = (Property: string): string =>
	Property.replace(/[A-Z]/g, (Character) => `-${Character.toLowerCase()}`);

const IsTextObject = (Node: GuiObject): Node is TextObject =>
	Node instanceof TextLabel || Node instanceof TextButton;

const VerticalAlignment = (Alignment: TextYAlignment): string => {
	if (Alignment === "Top") return "flex-start";
	if (Alignment === "Bottom") return "flex-end";

	return "center";
};

const HorizontalTextAlign = (Alignment: TextXAlignment): string => Alignment.toLowerCase();

/** The pixel bounds of a scrolling frame and the range its canvas can scroll. */
const ScrollLimits = (Node: ScrollingFrame, Element: HTMLElement) => {
	const FrameWidth = Element.clientWidth;
	const FrameHeight = Element.clientHeight;
	const CanvasWidth = ResolveLength(Node.CanvasSize.X, FrameWidth);
	const CanvasHeight = ResolveLength(Node.CanvasSize.Y, FrameHeight);

	return {
		FrameHeight,
		CanvasWidth,
		CanvasHeight,
		MaxX: Math.max(0, CanvasWidth - FrameWidth),
		MaxY: Math.max(0, CanvasHeight - FrameHeight),
	};
};

/**
 * Draws the ScreenGui tree as a DOM overlay above the three.js canvas.
 *
 * Rendering is a reconcile-every-frame pass: the tree is walked, elements are
 * created or removed as ancestry changes, and only styles whose value actually
 * changed are written back to the DOM. Property-change signals can replace the
 * per-frame walk later without changing this structure.
 *
 * One DOM layer is kept per registered container: PlayerGui under CoreGui.
 * Text is drawn into a child span so nodes can have both text and children,
 * TextBox mounts a real input, and ScrollingFrame translates a sized content
 * div behind its clip.
 */
export class WebUi implements IGui {
	private container: HTMLElement;
	private root: HTMLElement | null = null;

	private layers = new Map<Instance, HTMLElement>();
	private elements = new Map<Instance, HTMLElement>();
	private texts = new Map<Instance, HTMLElement>();
	private controls = new Map<Instance, HTMLInputElement | HTMLTextAreaElement>();
	private contents = new Map<Instance, HTMLElement>();
	private tracks = new Map<Instance, HTMLElement>();
	private thumbs = new Map<Instance, HTMLElement>();

	private styles = new Map<object, StyleMap>();

	/** Instances whose DOM listeners have already been attached. */
	private interactions = new Set<Instance>();
	private buttons = new Map<Instance, ButtonState>();

	/** Last Text value written into a TextBox control, to detect external edits. */
	private appliedText = new Map<Instance, string>();

	private isDisposed = false;

	constructor(container: HTMLElement) {
		this.container = container;
	}

	public Initialize(): void {
		if (this.root) return;

		if (getComputedStyle(this.container).position === "static") {
			this.container.style.position = "relative";
		}

		const Root = document.createElement("div");

		Root.dataset.colossalUi = "";
		Root.style.cssText =
			"position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:10";

		const Placeholder = document.createElement("style");

		Placeholder.textContent = [
			"[data-colossal-ui] input::placeholder,",
			"[data-colossal-ui] textarea::placeholder {",
			"color: var(--colossal-placeholder, rgba(0, 0, 0, 0.4));",
			"opacity: 1;",
			"}",
		].join("\n");

		Root.appendChild(Placeholder);

		this.container.appendChild(Root);
		this.root = Root;
	}

	public Render(): void {
		if (this.isDisposed || !this.root) return;

		const Live = new Set<Instance>();
		const ActiveContainers = new Set<Instance>();

		for (const Screen of UiRegistry.GetRoots()) {
			const Container = UiRegistry.GetContainer(Screen);

			if (!Container) continue;

			ActiveContainers.add(Container);
			this.SyncScreenGui(Screen, this.LayerFor(Container), Live);
		}

		for (const [Target, Element] of this.elements) {
			if (Live.has(Target)) continue;

			this.Destroy(Target, Element);
		}

		for (const [Container, Layer] of this.layers) {
			if (ActiveContainers.has(Container)) continue;

			Layer.remove();
			this.layers.delete(Container);
		}
	}

	public Dispose(): void {
		if (this.isDisposed) return;

		this.isDisposed = true;

		this.elements.clear();
		this.texts.clear();
		this.controls.clear();
		this.contents.clear();
		this.tracks.clear();
		this.thumbs.clear();
		this.styles.clear();
		this.interactions.clear();
		this.buttons.clear();
		this.appliedText.clear();
		this.layers.clear();

		this.root?.remove();
		this.root = null;
	}

	private LayerFor(Container: Instance): HTMLElement {
		const Existing = this.layers.get(Container);

		if (Existing) return Existing;

		const ZIndex = Container instanceof CoreGui ? CORE_GUI_Z_INDEX : PLAYER_GUI_Z_INDEX;
		const Layer = document.createElement("div");

		Layer.style.cssText = `position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:${ZIndex}`;

		this.root!.appendChild(Layer);
		this.layers.set(Container, Layer);

		return Layer;
	}

	private SyncScreenGui(Root: ScreenGui, Layer: HTMLElement, Live: Set<Instance>): void {
		const Element = this.EnsureElement(Root, Layer);

		Live.add(Root);

		this.Apply(Root, Element, {
			position: "absolute",
			inset: "0",
			display: Root.Enabled ? "block" : "none",
			zIndex: String(Root.DisplayOrder),
			pointerEvents: "none",
		});

		for (const Child of Root.GetChildren()) {
			if (Child instanceof GuiObject) {
				this.SyncNode(Child, Element, Live);
			}
		}
	}

	private SyncNode(Node: GuiObject, Parent: HTMLElement, Live: Set<Instance>): void {
		const Element = this.EnsureElement(Node, Parent);

		Live.add(Node);

		this.Apply(Node, Element, this.StyleFor(Node));
		this.EnsureInteractions(Node, Element);

		if (IsTextObject(Node)) {
			const Text = this.EnsureText(Node, Element);

			this.Apply(Text, Text, this.TextStyleFor(Node));

			if (Text.textContent !== Node.Text) {
				Text.textContent = Node.Text;
			}
		}

		if (Node instanceof TextBox) {
			this.SyncTextBox(Node, Element);
		}

		let ChildParent = Element;

		if (Node instanceof ScrollingFrame) {
			ChildParent = this.SyncScrollingFrame(Node, Element);
		}

		for (const Child of Node.GetChildren()) {
			if (Child instanceof GuiObject) {
				this.SyncNode(Child, ChildParent, Live);
			}
		}
	}

	private StyleFor(Node: GuiObject): StyleMap {
		const Interactive =
			Node instanceof GuiButton || Node instanceof TextBox || Node instanceof ScrollingFrame;

		const Style: StyleMap = {
			position: "absolute",
			left: CSSLength(Node.Position.X),
			top: CSSLength(Node.Position.Y),
			width: CSSLength(Node.Size.X),
			height: CSSLength(Node.Size.Y),
			transform: this.TransformFor(Node),
			backgroundColor: CSSColor(Node.BackgroundColor3, Node.BackgroundTransparency),
			border:
				Node.BorderSizePixel > 0
					? `${Node.BorderSizePixel}px solid rgba(0, 0, 0, 0.35)`
					: "none",
			boxSizing: "border-box",
			display: Node.Visible ? "block" : "none",
			overflow:
				Node instanceof ScrollingFrame || Node.ClipsDescendants ? "hidden" : "visible",
			zIndex: String(Node.ZIndex),
			pointerEvents: Interactive ? "auto" : "none",
		};

		if (Node instanceof GuiButton) {
			const State = this.buttons.get(Node) ?? { Hovered: false, Pressed: false };

			Style.cursor = "pointer";
			Style.userSelect = "none";
			Style.filter = !Node.AutoButtonColor
				? "none"
				: State.Pressed
					? "brightness(0.75)"
					: State.Hovered
						? "brightness(0.9)"
						: "none";
		}

		if (Node instanceof TextBox) {
			Style.cursor = "text";
		}

		return Style;
	}

	private TextStyleFor(Node: TextObject): StyleMap {
		return {
			position: "absolute",
			inset: "0",
			display: "flex",
			flexDirection: "column",
			justifyContent: VerticalAlignment(Node.TextYAlignment),
			alignItems: "stretch",
			overflow: "hidden",
			pointerEvents: "none",
			fontFamily: "sans-serif",
			fontSize: `${Node.TextSize}px`,
			color: CSSColor(Node.TextColor3, 0),
			textAlign: HorizontalTextAlign(Node.TextXAlignment),
			whiteSpace: Node.TextWrapped ? "pre-wrap" : "pre",
			lineHeight: "1.2",
			wordBreak: "break-word",
		};
	}

	private TransformFor(Node: GuiObject): string {
		const Translate = `translate(${-Node.AnchorPoint.X * 100}%, ${-Node.AnchorPoint.Y * 100}%)`;

		return Node.Rotation === 0 ? Translate : `${Translate} rotate(${Node.Rotation}deg)`;
	}

	private EnsureElement(Target: Instance, Parent: HTMLElement): HTMLElement {
		let Element = this.elements.get(Target);

		if (!Element) {
			Element = document.createElement("div");
			this.elements.set(Target, Element);
		}

		if (Element.parentElement !== Parent) {
			Parent.appendChild(Element);
		}

		return Element;
	}

	private EnsureText(Target: Instance, Parent: HTMLElement): HTMLElement {
		let Text = this.texts.get(Target);

		if (!Text) {
			Text = document.createElement("span");
			Text.style.pointerEvents = "none";

			Parent.appendChild(Text);
			this.texts.set(Target, Text);
		}

		return Text;
	}

	private EnsureInteractions(Node: GuiObject, Element: HTMLElement): void {
		if (this.interactions.has(Node)) return;

		this.interactions.add(Node);

		if (Node instanceof GuiButton) {
			const State: ButtonState = { Hovered: false, Pressed: false };

			this.buttons.set(Node, State);

			Element.addEventListener("mouseenter", () => {
				State.Hovered = true;
				Node.MouseEnter.Fire();
			});

			Element.addEventListener("mouseleave", () => {
				State.Hovered = false;
				State.Pressed = false;
				Node.MouseLeave.Fire();
			});

			Element.addEventListener("mousedown", (Event) => {
				if (Event.button !== 0) return;

				// Clicking a button takes focus away from a text field, like Roblox.
				const Active = document.activeElement;

				if (
					Active instanceof HTMLElement &&
					(Active.tagName === "INPUT" || Active.tagName === "TEXTAREA")
				) {
					Active.blur();
				}

				Event.preventDefault();

				State.Pressed = true;
				Node.MouseButton1Down.Fire();
			});

			Element.addEventListener("mouseup", (Event) => {
				if (Event.button !== 0) return;

				State.Pressed = false;
				Node.MouseButton1Up.Fire();
			});

			Element.addEventListener("click", (Event) => {
				if (Event.button !== 0) return;

				Node.MouseButton1Click.Fire();
				Node.Activated.Fire();
			});
		}

		if (Node instanceof ScrollingFrame) {
			Element.addEventListener(
				"wheel",
				(Event) => {
					if (!Node.ScrollingEnabled) return;

					const Limits = ScrollLimits(Node, Element);

					if (Limits.MaxX === 0 && Limits.MaxY === 0) return;

					Event.preventDefault();

					const Step =
						Event.deltaMode === 1 ? 16 : Event.deltaMode === 2 ? Limits.FrameHeight : 1;
					const X = Math.min(
						Limits.MaxX,
						Math.max(0, Node.CanvasPosition.X + Event.deltaX * Step),
					);
					const Y = Math.min(
						Limits.MaxY,
						Math.max(0, Node.CanvasPosition.Y + Event.deltaY * Step),
					);

					if (X === Node.CanvasPosition.X && Y === Node.CanvasPosition.Y) return;

					Node.CanvasPosition = new Vector2(X, Y);
				},
				{ passive: false },
			);
		}
	}

	private SyncTextBox(Node: TextBox, Container: HTMLElement): void {
		const Tag = Node.MultiLine ? "TEXTAREA" : "INPUT";
		let Control = this.controls.get(Node);

		if (Control && Control.tagName !== Tag) {
			Control.remove();
			this.styles.delete(Control);
			this.controls.delete(Node);
			Control = undefined;
		}

		if (!Control) {
			const Field =
				Tag === "TEXTAREA"
					? document.createElement("textarea")
					: document.createElement("input");

			let EnterPressed = false;

			Field.dataset.colossalTextBox = "";
			Field.setAttribute("spellcheck", "false");
			Field.setAttribute("autocomplete", "off");
			Field.value = Node.Text;

			Field.addEventListener("input", () => {
				if (Node.Text === Field.value) return;

				Node.Text = Field.value;
				this.appliedText.set(Node, Field.value);
				Node.TextChanged.Fire(Field.value);
			});

			Field.addEventListener("keydown", (Event) => {
				if (!(Event instanceof KeyboardEvent) || Event.key !== "Enter") return;
				if (Node.MultiLine) return;

				Event.preventDefault();

				EnterPressed = true;
				Field.blur();
			});

			Field.addEventListener("focus", () => {
				if (Node.ClearTextOnFocus) {
					Node.Text = "";
					Field.value = "";
					this.appliedText.set(Node, "");
					Node.TextChanged.Fire("");
				}

				Node.Focused.Fire();
			});

			Field.addEventListener("blur", () => {
				const WasEnter = EnterPressed;

				EnterPressed = false;
				Node.FocusLost.Fire(WasEnter);
			});

			Container.appendChild(Field);

			this.controls.set(Node, Field);
			this.appliedText.set(Node, Node.Text);
			Control = Field;
		}

		const Field = Control;

		this.Apply(Field, Field, {
			position: "absolute",
			inset: "0",
			width: "100%",
			height: "100%",
			boxSizing: "border-box",
			margin: "0",
			padding: "0 4px",
			border: "none",
			outline: "none",
			background: "transparent",
			resize: "none",
			color: CSSColor(Node.TextColor3, 0),
			caretColor: CSSColor(Node.TextColor3, 0),
			fontFamily: "sans-serif",
			fontSize: `${Node.TextSize}px`,
			lineHeight: "1.2",
			textAlign: HorizontalTextAlign(Node.TextXAlignment),
			pointerEvents: "auto",
			overflow: Node.MultiLine ? "auto" : "hidden",
			whiteSpace: Node.MultiLine ? "pre-wrap" : "pre",
		});

		Field.style.setProperty("--colossal-placeholder", CSSColor(Node.PlaceholderColor3, 0));

		if (Field.placeholder !== Node.PlaceholderText) {
			Field.placeholder = Node.PlaceholderText;
		}

		const ReadOnly = !Node.TextEditable;

		if (Field.readOnly !== ReadOnly) {
			Field.readOnly = ReadOnly;
		}

		if (this.appliedText.get(Node) !== Node.Text) {
			Field.value = Node.Text;
			this.appliedText.set(Node, Node.Text);
		}
	}

	private SyncScrollingFrame(Node: ScrollingFrame, Element: HTMLElement): HTMLElement {
		let Content = this.contents.get(Node);

		if (!Content) {
			Content = document.createElement("div");
			Content.style.cssText = "position:absolute;left:0;top:0;pointer-events:none;";

			Element.appendChild(Content);
			this.contents.set(Node, Content);
		}

		let Track = this.tracks.get(Node);

		if (!Track) {
			Track = document.createElement("div");
			Track.style.cssText = "position:absolute;top:0;bottom:0;right:0;pointer-events:none;";

			const Thumb = document.createElement("div");

			Thumb.style.cssText = "position:absolute;left:0;right:0;top:0;";

			Track.appendChild(Thumb);
			Element.appendChild(Track);

			this.tracks.set(Node, Track);
			this.thumbs.set(Node, Thumb);
		}

		const Thumb = this.thumbs.get(Node)!;
		const Limits = ScrollLimits(Node, Element);
		const X = Math.min(Limits.MaxX, Math.max(0, Node.CanvasPosition.X));
		const Y = Math.min(Limits.MaxY, Math.max(0, Node.CanvasPosition.Y));

		if (X !== Node.CanvasPosition.X || Y !== Node.CanvasPosition.Y) {
			Node.CanvasPosition = new Vector2(X, Y);
		}

		this.Apply(Content, Content, {
			width: `${Limits.CanvasWidth}px`,
			height: `${Limits.CanvasHeight}px`,
			transform: `translate(${-X}px, ${-Y}px)`,
		});

		const ShowBar = Node.ScrollingEnabled && Limits.CanvasHeight > Limits.FrameHeight + 0.5;

		this.Apply(Track, Track, {
			width: `${Node.ScrollBarThickness}px`,
			display: ShowBar ? "block" : "none",
		});

		if (ShowBar) {
			const ThumbHeight = Math.min(
				Limits.FrameHeight,
				Math.max(24, (Limits.FrameHeight * Limits.FrameHeight) / Limits.CanvasHeight),
			);
			const Travel = Limits.FrameHeight - ThumbHeight;
			const Top = Limits.MaxY === 0 ? 0 : (Y / Limits.MaxY) * Travel;

			this.Apply(Thumb, Thumb, {
				height: `${ThumbHeight}px`,
				transform: `translateY(${Top}px)`,
				backgroundColor: CSSColor(
					Node.ScrollBarImageColor3,
					Node.ScrollBarImageTransparency,
				),
				borderRadius: "2px",
			});
		}

		return Content;
	}

	private Destroy(Target: Instance, Element: HTMLElement): void {
		const Control = this.controls.get(Target);

		if (Control) {
			this.styles.delete(Control);
			Control.remove();
		}

		const Text = this.texts.get(Target);

		if (Text) {
			this.styles.delete(Text);
		}

		const Content = this.contents.get(Target);

		if (Content) {
			this.styles.delete(Content);
		}

		const Track = this.tracks.get(Target);

		if (Track) {
			this.styles.delete(Track);
		}

		const Thumb = this.thumbs.get(Target);

		if (Thumb) {
			this.styles.delete(Thumb);
		}

		Element.remove();

		this.elements.delete(Target);
		this.texts.delete(Target);
		this.controls.delete(Target);
		this.contents.delete(Target);
		this.tracks.delete(Target);
		this.thumbs.delete(Target);
		this.styles.delete(Target);
		this.interactions.delete(Target);
		this.buttons.delete(Target);
		this.appliedText.delete(Target);
	}

	private Apply(Target: object, Element: HTMLElement, Next: StyleMap): void {
		let Previous = this.styles.get(Target);

		if (!Previous) {
			Previous = {};
			this.styles.set(Target, Previous);
		}

		for (const [Property, Value] of Object.entries(Next)) {
			if (Previous[Property] === Value) continue;

			Element.style.setProperty(ToKebabCase(Property), Value);
			Previous[Property] = Value;
		}
	}
}

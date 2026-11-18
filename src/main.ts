import { Engine } from "./core/Engine";
import { InstanceFactory } from "./core/Factory";
import { WebBackend } from "./backend/implementations/three/WebBackend";
import { Frame, Part, ScreenGui, ScrollingFrame, TextButton, TextBox, TextLabel } from "./classes";
import { Color3 } from "./datatypes/Color3";
import { UDim2 } from "./datatypes/UDim2";
import { Vector2 } from "./datatypes/Vector2";
import { Vector3 } from "./datatypes/Vector3";

const sleep = (ms: number): Promise<void> => {
	return new Promise((resolve) => setTimeout(resolve, ms));
};

const container = document.querySelector<HTMLElement>("#app");
if (!container) throw new Error("Missing #app container");

const engine = new Engine("Colossal Engine", new WebBackend(container));

const game = engine.DataModel;
const workspace = game.GetService("Workspace");
const runService = game.GetService("RunService");

const test = InstanceFactory.new("Part") as Part;

test.Size = new Vector3(2, 2, 2);
test.Parent = workspace;

console.log("Test's name is:", test.Name);
console.log("Test's parent is:", test.Parent);
console.log("Test's ClassName is:", test.ClassName);

console.log("DataModel's children are:");

for (const child of game.GetChildren()) {
	console.log(child.Name);
}

console.log("Test is an Instance?", test.IsA("Instance"));
console.log("Test is a BasePart?", test.IsA("BasePart"));
console.log("Test is a DataModel?", test.IsA("DataModel"));
console.log("DataModel is a DataModel?", game.IsA("DataModel"));
console.log("Test is a TextButton?", test.IsA("TextButton"));

console.log("Workspace's name is:", workspace.Name);

test.Size = new Vector3(5, 1, 5);
test.CFrame.Rotation = new Vector3(0, 0, 0);

const test2 = InstanceFactory.new("Part") as Part;
test2.Parent = game.GetService("RunService");

test2.CFrame.Position = new Vector3(0, 10, -10);

const playerGui = game.GetService("PlayerGui");

const screenGui = InstanceFactory.new("ScreenGui") as ScreenGui;

const hud = InstanceFactory.new("Frame") as Frame;
hud.Size = UDim2.fromOffset(330, 136);
hud.Position = UDim2.new(0, 16, 1, -16);
hud.AnchorPoint = new Vector2(0, 1);
hud.BackgroundColor3 = Color3.fromRGB(18, 22, 30);
hud.BackgroundTransparency = 0.15;
hud.Parent = screenGui;

const hudTitle = InstanceFactory.new("TextLabel") as TextLabel;
hudTitle.Position = UDim2.new(0, 12, 0, 10);
hudTitle.Size = UDim2.new(1, -24, 0, 24);
hudTitle.BackgroundTransparency = 1;
hudTitle.Text = "Colossal Engine";
hudTitle.TextSize = 20;
hudTitle.TextColor3 = Color3.fromRGB(235, 240, 250);
hudTitle.TextXAlignment = "Left";
hudTitle.Parent = hud;

const nameBox = InstanceFactory.new("TextBox") as TextBox;
nameBox.Position = UDim2.new(0, 12, 0, 44);
nameBox.Size = UDim2.new(1, -136, 0, 30);
nameBox.BackgroundColor3 = Color3.fromRGB(34, 40, 52);
nameBox.TextColor3 = Color3.fromRGB(235, 240, 250);
nameBox.PlaceholderText = "Type your name, then press Enter";
nameBox.PlaceholderColor3 = Color3.fromRGB(140, 148, 164);
nameBox.TextSize = 15;
nameBox.ClearTextOnFocus = false;
nameBox.Parent = hud;

const helloButton = InstanceFactory.new("TextButton") as TextButton;
helloButton.Position = UDim2.new(1, -112, 0, 44);
helloButton.Size = UDim2.fromOffset(100, 30);
helloButton.BackgroundColor3 = Color3.fromRGB(46, 104, 224);
helloButton.Text = "Say hi";
helloButton.TextSize = 15;
helloButton.TextColor3 = Color3.fromRGB(255, 255, 255);
helloButton.Parent = hud;

const status = InstanceFactory.new("TextLabel") as TextLabel;
status.Position = UDim2.new(0, 12, 0, 86);
status.Size = UDim2.new(1, -24, 0, 40);
status.BackgroundTransparency = 1;
status.Text = "Hover, click, type. WASD still moves the part.";
status.TextSize = 13;
status.TextColor3 = Color3.fromRGB(150, 160, 176);
status.TextXAlignment = "Left";
status.TextWrapped = true;
status.Parent = hud;

let clicks = 0;

helloButton.Activated.Connect(() => {
	clicks += 1;

	const name = nameBox.Text.trim();

	status.Text = name
		? `Hello, ${name}! Activated ${clicks} time${clicks === 1 ? "" : "s"}.`
		: `Activated ${clicks} time${clicks === 1 ? "" : "s"}.`;
});

nameBox.FocusLost.Connect((enterPressed: boolean) => {
	status.Text = enterPressed
		? `Hi, ${nameBox.Text.trim() || "stranger"}! (Enter pressed)`
		: "Focus lost without Enter.";
});

const scroller = InstanceFactory.new("ScrollingFrame") as ScrollingFrame;
scroller.Position = UDim2.new(1, -16, 0, 16);
scroller.AnchorPoint = new Vector2(1, 0);
scroller.Size = UDim2.fromOffset(240, 220);
scroller.BackgroundColor3 = Color3.fromRGB(18, 22, 30);
scroller.BackgroundTransparency = 0.15;
scroller.CanvasSize = UDim2.fromOffset(240, 44 * 12);
scroller.ScrollBarThickness = 10;
scroller.Parent = screenGui;

for (let index = 0; index < 12; index++) {
	const row = InstanceFactory.new("TextButton") as TextButton;

	row.Position = UDim2.fromOffset(8, index * 44);
	row.Size = UDim2.new(1, -24, 0, 40);
	row.BackgroundColor3 =
		index % 2 === 0 ? Color3.fromRGB(32, 38, 50) : Color3.fromRGB(26, 31, 42);
	row.Text = `Quest ${index + 1}`;
	row.TextSize = 15;
	row.TextColor3 = Color3.fromRGB(225, 232, 242);
	row.TextXAlignment = "Left";
	row.Parent = scroller;

	row.Activated.Connect(() => {
		status.Text = `Selected ${row.Text}`;
		row.BackgroundColor3 = Color3.fromRGB(46, 104, 224);
	});
}

screenGui.Parent = playerGui;

engine.Start().catch(console.error);

await sleep(1000);

test2.Parent = test;

const userInput = game.GetService("UserInputService");

const camera = workspace.CurrentCamera;

runService.Heartbeat.Connect((DeltaTime: number) => {
	const Speed = 8;

	let X = 0;
	let Y = 0;
	let Z = 0;

	if (userInput.IsKeyDown("KeyW")) Z -= 1;
	if (userInput.IsKeyDown("KeyS")) Z += 1;
	if (userInput.IsKeyDown("KeyA")) X -= 1;
	if (userInput.IsKeyDown("KeyD")) X += 1;
	if (userInput.IsKeyDown("Space")) Y += 1;
	if (userInput.IsKeyDown("ShiftLeft")) Y -= 1;

	if (X === 0 && Y === 0 && Z === 0) return;

	const Length = Math.sqrt(X * X + Y * Y + Z * Z);

	test.CFrame.Position = test.CFrame.Position.Add(
		new Vector3(X / Length, Y / Length, Z / Length).Multiply(Speed * DeltaTime),
	);

	camera.CFrame.Position = test.CFrame.Position.Add(new Vector3(0, 6, 10));
});

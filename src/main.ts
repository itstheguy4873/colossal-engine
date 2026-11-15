import { Engine } from './core/Engine';
import { InstanceFactory } from './core/Factory';
import { WebBackend } from './backend/implementations/three/WebBackend';
import { Part } from './classes/Part';
import { Vector3 } from './datatypes/Vector3';
import { CFrame } from './datatypes/CFrame';
import { RunService } from './classes';
import { PartType } from './enums/PartType';

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const container = document.querySelector<HTMLElement>('#app');
if (!container) throw new Error('Missing #app container');

const engine = new Engine('Colossal Engine', new WebBackend(container));

const game = engine.DataModel;
const workspace = game.GetService('Workspace');
const runService = game.GetService<RunService>('RunService');

const test = InstanceFactory.new('Part') as Part;

test.Size = new Vector3(2, 2, 2);
test.Parent = workspace;

console.log("Test's name is:", test.Name);
console.log("Test's parent is:", test.Parent);
console.log("Test's ClassName is:", test.ClassName);

console.log("DataModel's children are:");

for (const child of game.GetChildren()) {
  console.log(child.Name);
}

console.log('Test is an Instance?', test.IsA('Instance'));
console.log('Test is a BasePart?', test.IsA('BasePart'));
console.log('Test is a DataModel?', test.IsA('DataModel'));
console.log('DataModel is a DataModel?', game.IsA('DataModel'));

console.log("Workspace's name is:", workspace.Name);

test.Size = new Vector3(5, 1, 5);
test.CFrame.Rotation = new Vector3(0, 0, 0);

const test2 = InstanceFactory.new('Part') as Part;
test2.Parent = game.GetService('RunService');

test2.CFrame.Position = new Vector3(0, 10, -10);

engine.Start().catch(console.error);

await sleep(1000);

test2.Parent = test;

const floatHeight = 2;
const floatSpeed = 2;
const startY = test2.CFrame.Position.Y;

let elapsedTime = 0;

runService.Heartbeat.Connect((DeltaTime: number) => {
  const RotationSpeed = 1;

  test.CFrame.Rotation = test.CFrame.Rotation.Add(
    new Vector3(RotationSpeed * DeltaTime, RotationSpeed * DeltaTime, RotationSpeed * DeltaTime),
  );

  elapsedTime += DeltaTime;

  const newY = startY + Math.sin(elapsedTime * floatSpeed) * floatHeight;

  test2.CFrame.Position = new Vector3(test2.CFrame.Position.X, newY, test2.CFrame.Position.Z);
});

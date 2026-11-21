import * as THREE from "three";
import { IRenderer } from "../../interfaces/IRenderer";
import { BasePart } from "../../../classes/BasePart";
import { Part } from "../../../classes/Part";
import { PartType } from "../../../enums/PartType";
import { RenderRegistry } from "../../../rendering/RenderRegistry";
import { GetPartGeometry, DisposePartGeometries } from "./PartGeometry";

export class WebRenderer implements IRenderer {
	private container: HTMLElement;
	private scene: THREE.Scene;
	private camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;

	private isDisposed: boolean = false;
	private meshes = new Map<BasePart, THREE.Mesh>();
	private resizeObserver: ResizeObserver;

	constructor(container: HTMLElement) {
		this.container = container;
		this.scene = new THREE.Scene();

		// The container can still be 0x0 here (a dock panel that has not been
		// laid out yet); 1 keeps the aspect finite until the ResizeObserver runs.
		this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
		// Camera rotations are yaw-first: `CFrame.Rotation` is (pitch, yaw, roll)
		// and 'YXZ' keeps the horizon level while the editor looks around.
		this.camera.rotation.order = "YXZ";
		this.camera.position.z = 5;

		this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		this.resizeToContainer();

		this.resizeObserver = new ResizeObserver(this.onContainerResize);
	}

	public async Initialize(): Promise<void> {
		if (this.isDisposed) {
			throw new Error("Cannot initialize a disposed renderer.");
		}

		this.container.appendChild(this.renderer.domElement);

		this.resizeObserver.observe(this.container);

		await this.loadSceneAssets();
	}

	private async loadSceneAssets(): Promise<void> {
		const light = new THREE.DirectionalLight(0xffffff, 2);
		light.position.set(2, 5, 5);
		this.scene.add(light);
	}

	public Render(): void {
		if (this.isDisposed) return;

		this.syncCamera();
		this.syncScene();

		this.renderer.render(this.scene, this.camera);
	}

	private syncScene(): void {
		const present = new Set<BasePart>();

		for (const part of RenderRegistry.GetObjects()) {
			present.add(part);

			const geometry = GetPartGeometry(part instanceof Part ? part.PartType : PartType.Block);

			let mesh = this.meshes.get(part);

			if (!mesh) {
				// One material per mesh: allocating it in the loop leaked a material
				// every frame and left `Part.Color` changes without effect.
				mesh = new THREE.Mesh(
					geometry,
					new THREE.MeshStandardMaterial({ color: part.Color.ToHex() }),
				);
				this.scene.add(mesh);
				this.meshes.set(part, mesh);
			} else {
				if (mesh.geometry !== geometry) mesh.geometry = geometry;

				const material = mesh.material as THREE.MeshStandardMaterial;
				material.color.set(part.Color.ToHex());
			}

			mesh.position.set(
				part.CFrame.Position.X,
				part.CFrame.Position.Y,
				part.CFrame.Position.Z,
			);
			mesh.rotation.set(
				part.CFrame.Rotation.X,
				part.CFrame.Rotation.Y,
				part.CFrame.Rotation.Z,
			);
			mesh.scale.set(part.Size.X, part.Size.Y, part.Size.Z);
		}

		for (const [part, mesh] of this.meshes) {
			if (present.has(part)) continue;

			this.scene.remove(mesh);
			this.meshes.delete(part);
		}
	}

	public Dispose(): void {
		if (this.isDisposed) return;
		this.isDisposed = true;

		this.resizeObserver.disconnect();
		if (this.renderer.domElement.parentNode === this.container) {
			this.container.removeChild(this.renderer.domElement);
		}

		for (const mesh of this.meshes.values()) {
			(mesh.material as THREE.Material).dispose();
		}
		this.meshes.clear();
		this.scene.clear();

		DisposePartGeometries();
		this.renderer.dispose();
	}

	private onContainerResize = (): void => {
		if (this.isDisposed) return;

		this.resizeToContainer();
	};

	private resizeToContainer(): void {
		const width = this.container.clientWidth;
		const height = this.container.clientHeight;

		// A hidden dock tab reports 0x0; resizing to it would produce a NaN aspect.
		if (width === 0 || height === 0) return;

		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(width, height);
	}

	private syncCamera(): void {
		const ActiveCamera = RenderRegistry.GetWorkspace()?.CurrentCamera;

		if (!ActiveCamera) return;

		this.camera.position.set(
			ActiveCamera.CFrame.Position.X,
			ActiveCamera.CFrame.Position.Y,
			ActiveCamera.CFrame.Position.Z,
		);

		this.camera.rotation.set(
			ActiveCamera.CFrame.Rotation.X,
			ActiveCamera.CFrame.Rotation.Y,
			ActiveCamera.CFrame.Rotation.Z,
		);

		if (this.camera.fov !== ActiveCamera.FieldOfView) {
			this.camera.fov = ActiveCamera.FieldOfView;
			this.camera.updateProjectionMatrix();
		}
	}
}

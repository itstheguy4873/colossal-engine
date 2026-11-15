import * as THREE from 'three';
import { PartType } from '../../../enums/PartType';

const Cache = new Map<PartType, THREE.BufferGeometry>();

export function GetPartGeometry(Type: PartType): THREE.BufferGeometry {
  let Geometry = Cache.get(Type);

  if (!Geometry) {
    Geometry = CreateGeometry(Type);
    Cache.set(Type, Geometry);
  }

  return Geometry;
}

export function DisposePartGeometries(): void {
  for (const Geometry of Cache.values()) {
    Geometry.dispose();
  }

  Cache.clear();
}

function CreateGeometry(Type: PartType): THREE.BufferGeometry {
  switch (Type) {
    case PartType.Ball:
      return new THREE.SphereGeometry(0.5, 32, 16);
    case PartType.Cylinder:
      return CreateCylinder();
    case PartType.Wedge:
      return CreateWedge();
    case PartType.CornerWedge:
      return CreateCornerWedge();
    case PartType.Block:
    default:
      return new THREE.BoxGeometry(1, 1, 1);
  }
}

function CreateCylinder(): THREE.BufferGeometry {
  const Geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 32);

  Geometry.rotateZ(Math.PI / 2);

  return Geometry;
}

function CreateWedge(): THREE.BufferGeometry {
  const Shape = new THREE.Shape();

  Shape.moveTo(-0.5, -0.5);
  Shape.lineTo(0.5, -0.5);
  Shape.lineTo(0.5, 0.5);
  Shape.closePath();

  const Geometry = new THREE.ExtrudeGeometry(Shape, {
    depth: 1,
    bevelEnabled: false,
  });

  Geometry.translate(0, 0, -0.5);
  Geometry.rotateY(Math.PI / 2);

  return Geometry;
}

function CreateCornerWedge(): THREE.BufferGeometry {
  return CreateTetrahedron([
    new THREE.Vector3(-0.5, -0.5, -0.5),
    new THREE.Vector3(0.5, -0.5, -0.5),
    new THREE.Vector3(-0.5, 0.5, -0.5),
    new THREE.Vector3(-0.5, -0.5, 0.5),
  ]);
}

function CreateTetrahedron(Vertices: THREE.Vector3[]): THREE.BufferGeometry {
  const Faces = [
    [0, 1, 2],
    [0, 1, 3],
    [0, 2, 3],
    [1, 2, 3],
  ];

  const Center = new THREE.Vector3();

  for (const Vertex of Vertices) {
    Center.add(Vertex);
  }

  Center.multiplyScalar(1 / Vertices.length);

  const Positions: number[] = [];

  for (const [A, B, C] of Faces) {
    const Va = Vertices[A];
    const Vb = Vertices[B];
    const Vc = Vertices[C];

    const FaceCenter = new THREE.Vector3()
      .addVectors(Va, Vb)
      .add(Vc)
      .multiplyScalar(1 / 3);

    const Normal = new THREE.Vector3()
      .subVectors(Vb, Va)
      .cross(new THREE.Vector3().subVectors(Vc, Va));

    const Outward = new THREE.Vector3().subVectors(FaceCenter, Center);

    const Ordered = Normal.dot(Outward) >= 0 ? [Va, Vb, Vc] : [Va, Vc, Vb];

    for (const Vertex of Ordered) {
      Positions.push(Vertex.x, Vertex.y, Vertex.z);
    }
  }

  const Geometry = new THREE.BufferGeometry();
  Geometry.setAttribute('position', new THREE.Float32BufferAttribute(Positions, 3));
  Geometry.computeVertexNormals();

  return Geometry;
}

/**
 * Browser/web implementation of the engine.
 *
 * This is the only public entry that may pull in three.js (`WebBackend` and the
 * renderer behind it). Keep it separate from `./index` so a consumer that only
 * needs the object model — a headless test, a serializer, a scene loader — never
 * drags the renderer into its graph.
 */

export { WebBackend } from "./backend/implementations/three/WebBackend";

import "./editor/core/Editor";

const Container = document.getElementById("app");

if (!Container) throw new Error("Missing #app container.");

// The import above registers `editor-app`; creating it afterwards means the
// element upgrades as soon as it is inserted.
Container.append(document.createElement("editor-app"));

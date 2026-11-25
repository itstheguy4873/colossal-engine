import { createRoot } from "react-dom/client";

import "rc-dock/dist/rc-dock-dark.css";
import "./editor/style/editor.css";

import { App } from "./editor/app";

const root = document.getElementById("root");

if (!root) {
	throw new Error("Missing #root element in index.html.");
}

createRoot(root).render(<App />);

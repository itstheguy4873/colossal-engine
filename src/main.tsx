import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./app.css";

const Container = document.querySelector<HTMLElement>("#app");

if (!Container) throw new Error("Missing #app container");

createRoot(Container).render(<App />);

// `index.html` already contains <main-app id="app">. Importing the app module
// registers the element, which upgrades that markup in place; creating another
// element here would boot a second dock and a second engine.
import "./editor/app";

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./repo/logos/logo_dark.svg">
    <source media="(prefers-color-scheme: light)" srcset="./repo/logos/logo_light.svg">
    <img src="./repo/logos/logo_light.svg" alt="Colossal Engine logo">
  </picture>
  <br>
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./repo/logos/title_dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="./repo/logos/title_light.svg">
  <img src="./repo/logos/title_light.svg" alt="Colossal Engine" width="400">
</picture>

  <h3>A web-based 2D and 3D game engine</h3>

  <p>
    <a href="https://github.com/itstheguy4873/colossal-engine/releases"><img src="https://img.shields.io/github/v/release/itstheguy4873/colossal-engine?include_prereleases&label=version&logo=github&logoColor=white&style=flat-square" alt="Latest release"></a>
    <a href="https://github.com/itstheguy4873/colossal-engine/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-blue?logo=opensourceinitiative&logoColor=white&style=flat-square" alt="GPL-3.0 license"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/language-TypeScript-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript"></a>
  </p>
</div>

## About

Colossal is a standalone 2D and 3D game engine for Roblox developers.

- Colossal features a familiar Instance-based API, making it easy to pick up.
- Colossal aims to support TypeScript and Lua scripting, alongside an extensible plugin system.
- Colossal is multi-platform and web-based, without being tied to a single ecosystem.

## Getting Started

Download the latest build from the
[releases page](https://github.com/itstheguy4873/colossal-engine/releases).

### Building from source

You'll need `git` and [Node.js](https://nodejs.org) (which includes `npm`).

```bash
git clone https://github.com/itstheguy4873/colossal-engine.git
cd colossal-engine
npm install
npm run build
```

## Project Status

Colossal Engine is currently in active development, and many features and APIs won't be settled until the first release.

## Credits

Colossal is built with the help of these open source packages:

- [Three.js](https://threejs.org)

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for more information.

It also takes inspiration from:

| Project                                                          | Info                         |
| ---------------------------------------------------------------- | ---------------------------- |
| [Gargantuan Engine](https://github.com/rniraclefire/gargantuan/) | Original idea for the engine |
| [Roblox Creator Documentation](https://create.roblox.com)        | Inspiration for the APIs     |

## Roadmap

The following roadmap outlines the current development progress and planned direction of the engine.

### Status Legend

- ✔️ - The feature has been implemented.
- 🔨 - The feature is currently in development.
- ❌ - The feature is planned but not currently in development.
- ❓ - The feature is being reconsidered, and its implementation is not yet decided.

| Status | Feature | Notes (If any) |
|:---:|---|---|
| ✔️ | Implement basic `Instance` functionality | Will be expanded upon the future |
| ✔️ | Implement `UserInputService` and `RunService` | |
| ✔️ | Get game UI working | Support for embeddable HTML may be introduced in the future |
| 🔨 | Implement scripting in TypeScript and Lua |  |
| 🔨 | Implement an editor for games | The actual editor where developers can make games |
| ❌ | Make games serializable | The ability to save and load games |
| ❓ | Implement a character system | May be added for compatibility reasons |
| ❌ | Implement a scene system | Similar to Roblox's Places system |
| ❓ | Distribute native binaries via [Tauri](https://v2.tauri.app/) | Alternate distribution options are being considered |

This roadmap is subject to change as development progresses. Features may be added, removed, or reconsidered as the engine's architecture and requirements evolve.

## License

Colossal Engine is licensed under the
[GNU General Public License v3.0](LICENSE).

## Legal Notice

Colossal Engine is an independent project. It is not affiliated with, endorsed by, or sponsored by Roblox Corporation. "Roblox" is a registered trademark of Roblox Corporation.

Some API names, class structures, and data types are inspired by
the publicly documented Roblox Engine API. Colossal Engine is an
independent implementation and does not include Roblox source code
or proprietary assets.

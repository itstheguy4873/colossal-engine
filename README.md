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
    <img src="./repo/logos/title_light.svg" alt="Colossal Engine">
  </picture>

  <h3>A web-based 2D and 3D game engine</h3>

  <p>
    <a href="https://github.com/itstheguy4873/colossal-engine/releases"><img src="https://img.shields.io/github/v/release/itstheguy4873/colossal-engine?include_prereleases&label=version" alt="Latest release"></a>
    <a href="https://github.com/itstheguy4873/colossal-engine/blob/master/LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-blue" alt="GPL-3.0 license"></a>
    <img src="https://img.shields.io/badge/language-TypeScript-3178C6" alt="TypeScript">
  </p>
</div>


## About

Colossal is a standalone 2D and 3D game engine for Roblox developers.

* Colossal features a familiar Instance-based API, making it easy to pick up.
* Colossal aims to support TypeScript and Lua scripting, alongside an extensible plugin system.
* Colossal is multi-platform and web-based, without being tied to a single ecosystem.


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

* [Three.js](https://threejs.org)

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for more information.

It also takes inspiration from:

| Project | Info |
| --- | --- |
| [Gargantuan Engine](https://github.com/rniraclefire/gargantuan/) | Original idea for the engine |
| [Roblox Creator Documentation](https://create.roblox.com) | Inspiration for the APIs |

## Roadmap

| Status | Feature |
|:------:|---------|
| Finished | Implement basic `Instance` functionality |
| Finished | Implement `UserInputService` and `RunService` |
| In progress | Get UI working |
| Not done | Implement scripting in TypeScript and Lua |
| Not done | Implement an editor for games |
| Not done | Make games serializable |
| Not done | Implement a character system |
| Not done | Implement a scene system |
| Not done | Distribute native binaries via [Tauri](https://v2.tauri.app/) |

## License

Colossal Engine is licensed under the
[GNU General Public License v3.0](LICENSE).

## Legal Notice

Colossal Engine is an independent project. It is not affiliated with, endorsed by, or sponsored by Roblox Corporation. "Roblox" is a registered trademark of Roblox Corporation.

Some API names, class structures, and data types are inspired by
the publicly documented Roblox Engine API. Colossal Engine is an
independent implementation and does not include Roblox source code
or proprietary assets.

# threejs-vr-sandbox

A WebXR sandbox on three.js: a small reusable `DefaultScene` class that handles the renderer, VR controllers, pointer input and teleportation, plus a demo scene built with it.

<!-- Add a screenshot or GIF here: docs/screenshot.png -->

## What it does

`src/index.ts` exports `DefaultScene`. You pass it renderer, scene, camera, controller and teleportation options plus `onReady` and `update` callbacks. It then:

- creates the renderer, scene, camera and an "observer" rig that carries the camera
- checks `navigator.xr` for `immersive-vr` support and, if present, enables WebXR and adds three.js's "Enter VR" button
- sets up controllers (`src/controllers.ts`) with an `on`/`off` event API: `select`, `selectstart`, `selectend`, `pointerenter` and `pointerleave` on given objects. In VR this uses controller raycasts; on desktop the mouse pointer stands in for the controller.
- adds teleportation (`src/teleport.ts`): a Bezier arc and a target ring on allowed surfaces, then a smooth flight along the arc when you select
- provides helpers for glTF loading (`loadModel` in `src/helpers.ts`) and positional audio (`loadAudio`)

The demo (`src/demo/`) builds a procedurally generated block "city" with a floor, point and ambient lights, fog and a loading spinner. It also adds a floating menu panel for switching rooms and a dat.gui panel for moving the main light.

### Controls

| | Desktop | VR |
| --- | --- | --- |
| Show teleport arc | toggle with `Shift`, then point with the mouse | push the thumbstick down |
| Teleport | click a highlighted surface | press the trigger |
| Turn | move the pointer towards the screen edges | touch the thumbstick and push it left or right |

## Tech stack

- three.js 0.133 (WebXR, GLTFLoader, VRButton)
- TypeScript 4
- Rollup 2 (node-resolve, commonjs, rollup-plugin-typescript2, livereload)
- dat.gui
- `serve` for local hosting

## Getting started

Requires Node.js and npm.

```bash
npm ci
npm run build   # bundles src/demo/index.ts into src/demo/bundle.js
npm run demo    # serves src/demo/ at http://localhost:5000
```

For development, run `npm run dev` (Rollup in watch mode with live reload) in one terminal and `npm run demo` in another.

WebXR only works in a secure context. `http://localhost` is fine for desktop testing. To open the demo on a headset over the network, serve it over HTTPS, for example through a tunnel such as [ngrok](https://ngrok.com/) pointed at port 5000.

## Project structure

```
src/
  index.ts          DefaultScene: renderer, camera, observer, XR setup, render loop
  controllers.ts    VR controllers + mouse pointer, raycasting, event subscriptions
  teleport.ts       teleport arc, target marker, movement and rotation
  helpers.ts        observer mesh, curve helper, glTF loader
  demo/
    index.html      demo page (loads bundle.js)
    index.ts        demo scene setup
    utils.ts        scene content: lights, floor, boxes, menu, dat.gui
    public/         glTF models, textures, audio, spinner image
rollup.config.js
tsconfig.json
```

## Known issues

- three.js 0.133 is several years old. Newer releases changed a number of APIs, so upgrading will need code changes.
- `navigator.xr` is accessed through `// @ts-ignore`, and scene parameters are typed as `Record<string, any>`.
- Several demo pieces are commented out in `src/demo/`: the second room, glTF models, stats and audio.

## Credits

The 3D models in `src/demo/public/` are from Sketchfab and licensed under [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/):

- "360 Sphere Robot" (https://sketchfab.com/3d-models/360-sphere-robot-a0bd28b7133648848427a5c27975611b) by mikeramos (https://sketchfab.com/mikeramos)
- "Medieval House Pack Pixel Art" (https://sketchfab.com/3d-models/medieval-house-pack-pixel-art-b8bf1ed358f2467dbb027e61e67af661) by Toni García Vilche (https://sketchfab.com/zul_gv)
- "Kleeblatt Quest Home Environment" (https://sketchfab.com/3d-models/kleeblatt-quest-home-environment-441eeba793ad43e6ae8c6ebebfc15498) by fangzhangmnm (https://sketchfab.com/fangzhangmnm)

## License

The code is MIT licensed, see [LICENSE](LICENSE). The 3D models listed above keep their own CC BY 4.0 licenses.

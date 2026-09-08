# Original art, v2
The original v1 Canvas character designs are preserved. Rear helmets, straps, armor panels, quiver, cloak pattern, pack, bat ears/back and directional cannon geometry were added in `public/game/art.js`. These are procedural vector drawings with a shared cut-out gait; no external character art, animation engine, font file or paid runtime is bundled. The game remains a 2D approximation, not a full 3D rig.

Previews in `docs/previews` were rendered in Chromium from the actual game code using test fixtures. The front/back comparison is a presentation of the implemented renderer, not an extra game screen. The normal roster UI has a front/rear toggle. Tests contain instrumentation; shipped public code does not expose those test helpers.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check (`tsc -b`) then production build
- `npm run test` — run the vitest suite once (`vitest run`)
- `npx vitest run src/geometry/skirt.test.ts` — run a single test file
- `npm run lint` — oxlint
- `npx tsc -b` — type-check only, no build output

There is no browser test runner in this repo. To verify UI/3D changes, use the `run` skill (Playwright against the dev server) — there's no project-specific run skill yet, so it falls back to the generic browser-driven pattern. Console errors and a screenshot are the way to confirm a change actually rendered.

## Architecture

This is a web app for designing 3D costumes via a node graph (Blender Geometry Nodes-style), rendered in a flat toon-shaded illustration style rather than photorealistic 3D. Stack: React + react-three-fiber (Three.js) + React Flow (`@xyflow/react`), zustand for state, no backend — fully client-side, graph state persisted to localStorage.

**Everything is procedurally generated in code — no external 3D mesh assets.** The body and both garments are built from primitives/curves at runtime, not imported models. This is a deliberate constraint, not an oversight.

### The node graph engine (`src/nodes/`)

React Flow (`src/editor/`) owns only UI state — node positions, selection, drag. The actual computation is a separate pure-function layer that knows nothing about React Flow:

- `nodes/types.ts` — the socket type system (`SocketType`: number/color/enum/geometry/material) and `NodeTypeDefinition` (declares `inputs`/`outputs` sockets plus an `evaluate(inputs, data) -> outputs` function). Also defines `GraphNode`/`GraphEdge`, minimal shapes decoupled from React Flow's own `Node`/`Edge` types so the evaluator is usable and testable without the UI library.
- `nodes/registry.ts` — `registerNodeType()` / `getNodeType()`. Every node type (inputs, generators, materials, outputs) registers itself here. `src/nodes/definitions/*.ts` are the actual node type implementations; `definitions/index.ts` side-effect-imports all of them to populate the registry.
- `nodes/evaluateGraph.ts` — the evaluator. Topologically sorts nodes (Kahn's algorithm, throws `GraphCycleError` on a cycle) and evaluates each node's `evaluate()` in order. **Unconnected input sockets fall back to the node's own literal `data[socketId]` value** — this is the same behavior as an unwired Geometry Nodes socket using its widget default, and it's the core mechanic that makes standalone (unconnected) nodes still work.
- Output-category nodes (e.g. `garmentOutput`) have no downstream sockets; their `evaluate()` return value is read directly by the Scene rather than consumed by other nodes.

### Reactivity: why dragging a node doesn't re-run the evaluator

`state/selectors.ts` (`useNodesLite`/`useEdgesLite`) strips React Flow's volatile fields (position, selected, dragging) and — critically — returns the **same array reference** when only those volatile fields changed, via a ref-cached manual equality check (not zustand's `useShallow`, which was tried first and caused an infinite render loop because it does one-level `Object.is` comparison on freshly-mapped objects). `state/useEvaluatedGraph.ts` feeds these stable-reference arrays into a `useMemo(() => evaluateGraph(...))`, so geometry/material recomputation only happens when node *data* or *edges* actually change, never on drag or per-frame. This is verified in practice via the `evaluations: N` counter shown in the bottom-right of the scene pane.

### Custom garment geometry (`src/geometry/`)

- `skirt.ts` — `THREE.LatheGeometry` built from a profile curve (waist → hem, smoothstep-eased radius).
- `top.ts` — **not** Lathe/Extrude, because a neckline dip isn't radially symmetric. It's a hand-built ring-grid `BufferGeometry` (angle × height rings); only the top ring's vertices are pulled down per-angle (weighted by a per-neckline-type falloff function: round/v/square) to carve the neckline. Sleeveless by design (MVP scope decision).
- `body.ts` — capsule/sphere/cylinder primitives for a fixed mannequin, plus `BODY_ANCHORS` (`waist`, `shoulder`) that garments mount to.

**Gotcha already hit once, will bite again if you add new revolved/hand-built geometry:** winding order matters and is easy to get backwards, and the visual symptom is *not* an obvious "inside-out" look — it's the garment rendering as a **solid black silhouette** (with maybe a thin sliver of the real color at one edge). That happens because the outline mesh's `BackSide`-only faces become the only visible surface once the real `FrontSide` mesh is (wrongly) culled. If a new procedural mesh renders solid black, check triangle winding first, not the material/lighting.

### Rendering (`src/rendering/`)

- `gradientTexture.ts` — a shared 4-step `DataTexture` (cached singleton) used as the `gradientMap` for every `MeshToonMaterial`, so all garments/body share identical cel-shading bands.
- `Outline.tsx` — the illustration-style outline: an inverted-hull technique (duplicate geometry, `BackSide` dark `MeshBasicMaterial`, scaled up ~2%). No postprocessing pipeline. `ToonMesh.tsx` pairs a mesh with its outline as one unit.
- Renderer uses `THREE.NoToneMapping` and no environment map, to keep colors flat/poster-like rather than filmic.

### Scene assembly (`src/scene/`)

`Scene.tsx` renders `Body` (static) and `Garments` (dynamic). `Garments.tsx` iterates **every node** in the graph, checks the evaluated result for a `geometry` + `material` key (not just nodes of a specific type), and if present mounts a `ToonMesh` at the anchor named in the result (`anchor`/`offsetY` from `garmentOutput`'s evaluate output). This means any future node type that ends up producing `{geometry, material, anchor, offsetY}` in its evaluated output will render automatically — no Scene-side registration needed.

### Known MVP limitations (intentional, not bugs)

- No UI to add new nodes to the graph — the seed graph in `state/graphStore.ts` is fixed; users rewire existing nodes and adjust their sliders/pickers.
- One fixed body/mannequin (no morph parameters), sleeveless top only.

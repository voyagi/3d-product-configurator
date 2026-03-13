# 3D Asset Guidelines for Designers

Guidelines for preparing 3D assets for the configurator.

## File Format
- Export as **GLB** (binary glTF), not glTF with separate files
- We handle compression on our end (Draco, WebP textures)

## Naming Conventions
- Every configurable part must be a **separate object** with a unique name
- Use snake_case: `legs_oak`, `cushion_back_01`, `armrest_left`
- Prefix by category for easy identification
- No duplicate names

## Origin Points (Critical)
- All variant parts for the same slot **must share the same origin point**
- If `legs_oak` and `legs_metal` both attach to the legs slot, their origins must be identical relative to the base model
- Set origins at the natural attachment point (where the part meets the frame)

## Coordinate System
- glTF standard: **+Y is up**, +Z faces front
- Units: **meters**
- Blender's Z-up converts automatically on glTF export

## Polygon Budget
- Full furniture piece: 30,000-80,000 triangles
- Individual part: 5,000-20,000 triangles
- Use normal maps for fine detail instead of extra geometry

## Texture Rules
- **512x512** or **1024x1024** for most surfaces
- **2048x2048** max for hero close-up surfaces
- **256x256** for small parts
- Always power-of-two dimensions (256, 512, 1024, 2048)
- Use tiling textures for repeating surfaces (fabric, wood grain)

## File Size Targets
- Under **2MB per GLB** before our compression
- Under **5MB total initial load** after compression

## Before Handoff Checklist
- [ ] All meshes triangulated (no quads/ngons)
- [ ] No duplicate mesh names
- [ ] Origins consistent between variant parts
- [ ] Textures are power-of-two
- [ ] Validated with [glTF Validator](https://github.khronos.org/glTF-Validator/)
- [ ] Tested in [BabylonJS Sandbox](https://sandbox.babylonjs.com/)

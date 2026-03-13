/**
 * GLB product model for the horizontal carousel.
 *
 * Three-zone coloring mapped via MESH_NAMES:
 * - bodyHex  -> "Lamp_Metal" (back plate + arm + shade disc)
 * - shadeHex -> "Lamp_Glass" (glass bulb cover)
 * - accentHex -> "Lamp_Filament" (bulb detail)
 *
 * Uses <primitive object={clone}> for reliable rendering. Each component
 * instance deep-clones the GLTF scene so materials are independent.
 *
 * Ghost interpolation: Material properties are updated every frame via
 * useFrame, reading from the shared ghostAmounts array. This enables
 * smooth drag transitions where models progressively ghost/un-ghost
 * based on carousel position.
 *
 * CRITICAL: Materials are created FRESH (not cloned from originals) with
 * transparent=true at creation time. The useFrame toggles transparent
 * on/off at a threshold to keep the active model in the opaque render
 * pass for solid appearance.
 */

import { Center, useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { memo, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { LAMP_SIZES } from "../../constants/sizes";
import {
	partHighlightAnim,
	useConfiguratorStore,
} from "../../store/configuratorStore";

const MODEL_URL = "/models/AnisotropyBarnLamp.glb";

/** CDN-hosted Draco decoder for compressed GLB files */
const DRACO_URL = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";

/** Mesh name contract with the GLB file - must match artist's naming */
const MESH_NAMES = {
	body: "Lamp_Metal",
	shade: "Lamp_Glass",
	accent: "Lamp_Filament",
} as const;

/**
 * Ghost amount per carousel slot (0 = fully visible, 1 = fully ghosted).
 * Derived from LAMP_SIZES to stay in sync. Updated every frame by
 * SizeCarousel in SceneCanvas.
 */
export const ghostAmounts: number[] = LAMP_SIZES.map((_, i) =>
	i === Math.floor(LAMP_SIZES.length / 2) ? 0 : 1,
);

/**
 * Model orbit state for spin/tilt interaction on the active model.
 * Set by R3F onPointerDown (hit detection), consumed by SceneCanvas
 * HTML handlers (tracking) and AutoRotate useFrame (rotation).
 */
export const modelOrbit = {
	active: false,
	startX: 0,
	startY: 0,
	currentX: 0,
	currentY: 0,
	consumedX: 0,
	consumedY: 0,
};

// Reusable color objects to avoid GC pressure in useFrame
const _ghostColor = new THREE.Color("#d0d0d0");
const _tmpColor = new THREE.Color();
const _black = new THREE.Color("#000000");
const _tmpEmissive = new THREE.Color();

/** Data-driven ghost interpolation config per mesh zone */
interface GhostConfig {
	colorRef: "body" | "shade" | "accent";
	metalness: [number, number];
	roughness: [number, number];
	opacity: [number, number];
	depthWriteThreshold?: number;
	transparentThreshold?: number;
	envMapIntensity?: [number, number];
	clearcoat?: [number, number];
	emissive?: true;
	emissiveIntensity?: [number, number];
}

const GHOST_CONFIGS: Record<string, GhostConfig> = {
	[MESH_NAMES.body]: {
		colorRef: "body",
		metalness: [0.35, 0.05],
		roughness: [0.4, 0.7],
		opacity: [1, 0.3],
		depthWriteThreshold: 0.5,
		transparentThreshold: 0.01,
		envMapIntensity: [1.2, 0.1],
	},
	[MESH_NAMES.shade]: {
		colorRef: "shade",
		metalness: [0, 0.05],
		roughness: [0.1, 0.7],
		opacity: [0.55, 0.15],
		clearcoat: [0.8, 0.01],
		envMapIntensity: [2.0, 0.1],
	},
	[MESH_NAMES.accent]: {
		colorRef: "accent",
		metalness: [0.4, 0.05],
		roughness: [0.35, 0.7],
		opacity: [1, 0.3],
		depthWriteThreshold: 0.5,
		transparentThreshold: 0.01,
		emissive: true,
		emissiveIntensity: [0.5, 0],
	},
};

/** Reverse lookup: mesh name -> part key for highlight dimming */
const MESH_TO_PART: Record<string, string> = {
	[MESH_NAMES.body]: "body",
	[MESH_NAMES.shade]: "shade",
	[MESH_NAMES.accent]: "accent",
};

interface MeshRef {
	name: string;
	mat: THREE.MeshPhysicalMaterial | THREE.MeshStandardMaterial;
}

interface GLBProductModelProps {
	bodyHex: string;
	shadeHex: string;
	accentHex: string;
	modelIndex: number;
	onClick?: () => void;
}

export const GLBProductModel = memo(function GLBProductModel({
	bodyHex,
	shadeHex,
	accentHex,
	modelIndex,
	onClick,
}: GLBProductModelProps) {
	const gltf = useGLTF(MODEL_URL, DRACO_URL);
	const invalidate = useThree((s) => s.invalidate);

	// Cached THREE.Color objects - avoids per-frame hex string parsing.
	// copy() (3 number copies) is ~10x cheaper than set(hexString) (parse + convert).
	const cachedColorsRef = useRef({
		body: new THREE.Color(bodyHex),
		shade: new THREE.Color(shadeHex),
		accent: new THREE.Color(accentHex),
		lastBody: bodyHex,
		lastShade: shadeHex,
		lastAccent: accentHex,
	});
	const cc = cachedColorsRef.current;
	if (cc.lastBody !== bodyHex) {
		cc.body.set(bodyHex);
		cc.lastBody = bodyHex;
	}
	if (cc.lastShade !== shadeHex) {
		cc.shade.set(shadeHex);
		cc.lastShade = shadeHex;
	}
	if (cc.lastAccent !== accentHex) {
		cc.accent.set(accentHex);
		cc.lastAccent = accentHex;
	}

	// Deep-clone scene per instance with FRESH materials.
	// Each carousel item gets its own clone so colors and ghosting
	// don't bleed across instances.
	//
	// Fresh materials (new THREE.MeshPhysicalMaterial) instead of
	// origMat.clone() guarantee:
	// 1. No shared internal state between instances
	// 2. transparent=true from creation (compiled with transparent shader)
	const clone = useMemo(() => {
		const c = gltf.scene.clone(true);
		const expectedNames = new Set(Object.values(MESH_NAMES));
		const foundNames = new Set<string>();

		c.traverse((child) => {
			if (!(child instanceof THREE.Mesh) || !child.material) return;

			const origMat = child.material as THREE.Material;
			const name = child.name;

			if (name === MESH_NAMES.body) {
				foundNames.add(name);
				// Extract normalMap from original for surface detail
				const normalMap =
					origMat instanceof THREE.MeshStandardMaterial
						? origMat.normalMap
						: null;
				const normalScale =
					origMat instanceof THREE.MeshStandardMaterial
						? origMat.normalScale.clone()
						: new THREE.Vector2(1, 1);

				child.material = new THREE.MeshPhysicalMaterial({
					transparent: true,
					opacity: 1,
					metalness: 0.35,
					roughness: 0.4,
					normalMap,
					normalScale,
					depthWrite: true,
				});
			} else if (name === MESH_NAMES.shade) {
				foundNames.add(name);
				// Replace transmission material with clean transparency
				// (transmission uses a half-res render target that causes pixelation)
				child.material = new THREE.MeshPhysicalMaterial({
					transparent: true,
					opacity: 0.55,
					roughness: 0.1,
					metalness: 0,
					clearcoat: 0.8,
					envMapIntensity: 2.0,
					depthWrite: false,
				});
			} else if (name === MESH_NAMES.accent) {
				foundNames.add(name);
				child.material = new THREE.MeshStandardMaterial({
					transparent: true,
					opacity: 1,
					metalness: 0.4,
					roughness: 0.35,
					emissiveIntensity: 0.5,
					depthWrite: true,
				});
			}
		});

		// Warn in dev if expected meshes are missing from the GLB
		if (import.meta.env.DEV) {
			for (const expected of expectedNames) {
				if (!foundNames.has(expected)) {
					console.warn(
						`[GLBProductModel] Expected mesh "${expected}" not found in GLB. ` +
							`Color zone will not apply. Check mesh names in the 3D file.`,
					);
				}
			}
		}

		return c;
	}, [gltf.scene]);

	// Cache mesh references for O(1) per-frame updates (avoids traverse)
	const meshCache = useMemo(() => {
		const refs: MeshRef[] = [];
		clone.traverse((child) => {
			if (!(child instanceof THREE.Mesh)) return;
			const mat = child.material;
			if (
				mat instanceof THREE.MeshPhysicalMaterial ||
				mat instanceof THREE.MeshStandardMaterial
			) {
				refs.push({ name: child.name, mat });
			}
		});
		return refs;
	}, [clone]);

	// Dispose materials on unmount to prevent GPU memory leaks
	useEffect(() => {
		return () => {
			for (const { mat } of meshCache) {
				mat.dispose();
			}
		};
	}, [meshCache]);

	// Apply ghost interpolation every frame.
	// Reads ghostAmounts[modelIndex] for continuous 0-1 value.
	// Only toggles mat.transparent at threshold (avoids per-frame recompile).
	useFrame(() => {
		const ga = ghostAmounts[modelIndex] ?? 1;
		const colors = cachedColorsRef.current;

		// Part highlight: dim non-active parts briefly when switching tabs
		const hp = ga < 0.1 ? partHighlightAnim.phase : 0;
		const highlightTarget =
			hp > 0 ? useConfiguratorStore.getState().activePart : null;

		for (const { name, mat } of meshCache) {
			const cfg = GHOST_CONFIGS[name];
			if (!cfg) continue;

			const sourceColor = colors[cfg.colorRef];
			_tmpColor.copy(sourceColor).lerp(_ghostColor, ga);
			mat.color.copy(_tmpColor);
			mat.metalness = THREE.MathUtils.lerp(
				cfg.metalness[0],
				cfg.metalness[1],
				ga,
			);
			mat.roughness = THREE.MathUtils.lerp(
				cfg.roughness[0],
				cfg.roughness[1],
				ga,
			);
			mat.opacity = THREE.MathUtils.lerp(cfg.opacity[0], cfg.opacity[1], ga);

			if (cfg.depthWriteThreshold !== undefined) {
				mat.depthWrite = ga < cfg.depthWriteThreshold;
			}

			if (cfg.transparentThreshold !== undefined) {
				const wantTransparent = ga > cfg.transparentThreshold;
				if (mat.transparent !== wantTransparent) {
					mat.transparent = wantTransparent;
					mat.needsUpdate = true;
				}
			}

			if (mat instanceof THREE.MeshPhysicalMaterial) {
				if (cfg.envMapIntensity)
					mat.envMapIntensity = THREE.MathUtils.lerp(
						cfg.envMapIntensity[0],
						cfg.envMapIntensity[1],
						ga,
					);
				if (cfg.clearcoat)
					mat.clearcoat = THREE.MathUtils.lerp(
						cfg.clearcoat[0],
						cfg.clearcoat[1],
						ga,
					);
			}

			if (cfg.emissive && mat instanceof THREE.MeshStandardMaterial) {
				_tmpEmissive.copy(sourceColor).lerp(_black, ga);
				mat.emissive.copy(_tmpEmissive);
				if (cfg.emissiveIntensity)
					mat.emissiveIntensity = THREE.MathUtils.lerp(
						cfg.emissiveIntensity[0],
						cfg.emissiveIntensity[1],
						ga,
					);
			}

			// Part highlight: dim non-active parts when switching tabs
			if (hp > 0) {
				const meshPart = MESH_TO_PART[name];
				if (meshPart && meshPart !== highlightTarget) {
					mat.opacity *= 1 - hp * 0.4;
				}
			}
		}

		// Decay highlight animation
		if (partHighlightAnim.phase > 0) {
			partHighlightAnim.phase = Math.max(0, partHighlightAnim.phase - 0.02);
			invalidate();
		}

		// Request next frame while ghost amounts are still transitioning
		if (Math.abs(ga) > 0.01 && Math.abs(ga) < 0.99) {
			invalidate();
		}
	});

	return (
		<group
			onPointerDown={(e) => {
				const ga = ghostAmounts[modelIndex] ?? 1;
				if (ga < 0.1) {
					modelOrbit.active = true;
					e.stopPropagation();
				}
			}}
			onClick={(e) => {
				if (onClick) {
					e.stopPropagation();
					onClick();
				}
			}}
		>
			<Center>
				<primitive object={clone} />
			</Center>
		</group>
	);
});

useGLTF.preload(MODEL_URL, DRACO_URL);

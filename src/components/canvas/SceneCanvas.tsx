/**
 * R3F Canvas with horizontal carousel.
 *
 * Architecture:
 * - Fixed camera, NO OrbitControls
 * - Carousel group slides on X-axis with spring-like animation
 * - Drag with momentum: tracks velocity, applies inertia on release
 * - Tight model spacing so neighbors are visible
 * - Active model auto-rotates slowly on Y-axis
 * - Click on ghosted neighbor to navigate
 */

import { ContactShadows } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useRef } from "react";
import * as THREE from "three";
import { BRAND_COLORS, COLOR_HEX } from "../../constants/colors";
import { LAMP_SIZES, type LampSizeKey } from "../../constants/sizes";
import { useConfiguratorStore } from "../../store/configuratorStore";
import { GLBProductModel, ghostAmounts, modelOrbit } from "./GLBProductModel";
import { Lighting } from "./Lighting";

/** Per-model X positions - tighter gap for smaller model on the left */
const MODEL_X = [0.5, 2.5, 5.0];

/** Reference spacing for drag sensitivity and ghost normalization */
const SPACING = 2.5;

/** Lerp factor for smooth carousel slide (0-1, higher = faster) */
const SLIDE_LERP = 0.12;

/** Camera Z distance per size - closer for small, further for large */
const CAMERA_Z: Record<LampSizeKey, number> = {
	"300": 2.8,
	"500": 3.6,
	"1000": 5.2,
};
const CAMERA_Z_ARRAY = LAMP_SIZES.map((s) => CAMERA_Z[s.key]);

/** Minimum drag distance (px) to count as a swipe instead of a click */
const DRAG_THRESHOLD = 8;

/** Drag distance (fraction of container width) to trigger slot advance */
const SNAP_THRESHOLD = 0.1;

/** Velocity threshold to trigger advance on release */
const VELOCITY_THRESHOLD = 0.3;

/** Model orbit sensitivity (radians per pixel) */
const ORBIT_SENSITIVITY = 0.005;

/** Max tilt angle (radians, ~30 degrees) */
const MAX_TILT = Math.PI / 6;

/** Convergence threshold for demand-based frame loop */
const EPSILON = 0.0005;

// Drag state shared between HTML handlers and R3F scene.
// Module-level for frame-loop performance (avoids React re-renders at 60fps).
interface DragState {
	active: boolean;
	startX: number;
	currentX: number;
	containerWidth: number;
	velocity: number;
	lastX: number;
	lastTime: number;
}

const dragState: DragState = {
	active: false,
	startX: 0,
	currentX: 0,
	containerWidth: 1,
	velocity: 0,
	lastX: 0,
	lastTime: 0,
};

let isDragGesture = false;

/** Stored reference to R3F invalidate, set by StoreInvalidator inside the Canvas.
 *  Used by HTML pointer handlers to request frames during drag/orbit. */
let r3fInvalidate: (() => void) | null = null;

/** Respect prefers-reduced-motion for 3D animations (carousel slide, camera zoom) */
const reducedMotionQuery =
	typeof window !== "undefined"
		? window.matchMedia("(prefers-reduced-motion: reduce)")
		: null;
let prefersReducedMotion = reducedMotionQuery?.matches ?? false;
reducedMotionQuery?.addEventListener("change", (e) => {
	prefersReducedMotion = e.matches;
});

function resetDragState() {
	dragState.active = false;
	dragState.startX = 0;
	dragState.currentX = 0;
	dragState.velocity = 0;
	dragState.lastX = 0;
	dragState.lastTime = 0;
	modelOrbit.active = false;
	isDragGesture = false;
}

// R3F Components

function AutoRotate({
	active,
	children,
}: {
	active: boolean;
	children: React.ReactNode;
}) {
	const ref = useRef<THREE.Group>(null);
	const tiltRef = useRef(0);
	const prevActiveRef = useRef(active);

	useFrame(() => {
		if (!ref.current) return;

		// Reset orientation when leaving this model (so ghosted shows default pose)
		if (!active && prevActiveRef.current) {
			ref.current.rotation.y = 0;
			ref.current.rotation.x = 0;
			tiltRef.current = 0;
		}
		prevActiveRef.current = active;

		if (active && modelOrbit.active && isDragGesture) {
			// User orbit: consume pointer deltas
			const dx = modelOrbit.currentX - modelOrbit.consumedX;
			const dy = modelOrbit.currentY - modelOrbit.consumedY;
			modelOrbit.consumedX = modelOrbit.currentX;
			modelOrbit.consumedY = modelOrbit.currentY;

			ref.current.rotation.y -= dx * ORBIT_SENSITIVITY;
			tiltRef.current = THREE.MathUtils.clamp(
				tiltRef.current + dy * ORBIT_SENSITIVITY,
				-MAX_TILT,
				MAX_TILT,
			);
		}

		ref.current.rotation.x = tiltRef.current;
	});

	return <group ref={ref}>{children}</group>;
}

/**
 * Invalidates the R3F frame loop whenever Zustand store values change,
 * ensuring color/size changes trigger a re-render in demand mode.
 */
function StoreInvalidator() {
	const invalidate = useThree((s) => s.invalidate);

	// Expose invalidate to HTML pointer handlers outside the Canvas
	r3fInvalidate = invalidate;

	useEffect(() => {
		return useConfiguratorStore.subscribe(() => invalidate());
	}, [invalidate]);

	return null;
}

/**
 * The carousel group with spring-based sliding animation.
 * Reads from store for colors and wires 3 color zones per model.
 */
function SizeCarousel() {
	const size = useConfiguratorStore((s) => s.size);
	const bodyColor = useConfiguratorStore((s) => s.bodyColor);
	const shadeColor = useConfiguratorStore((s) => s.shadeColor);
	const accentColor = useConfiguratorStore((s) => s.accentColor);
	const setSize = useConfiguratorStore((s) => s.setSize);

	const activeIndex = Math.max(
		0,
		LAMP_SIZES.findIndex((s) => s.key === size),
	);
	const groupRef = useRef<THREE.Group>(null);
	const initializedRef = useRef(false);

	useFrame((state) => {
		if (!groupRef.current) return;

		const targetX = -MODEL_X[activeIndex];

		// First frame: jump directly to target (no animation, no jitter)
		if (!initializedRef.current) {
			groupRef.current.position.x = targetX;
			state.camera.position.z = CAMERA_Z_ARRAY[activeIndex];
			initializedRef.current = true;
		}

		let effectiveTarget = targetX;

		if (dragState.active) {
			const pixelDelta = dragState.currentX - dragState.startX;
			const worldDelta = (pixelDelta / dragState.containerWidth) * SPACING * 2;
			effectiveTarget = targetX + worldDelta;
		}

		// Carousel X - smooth lerp (instant snap when reduced motion preferred)
		const lerpSpeed = prefersReducedMotion
			? 1
			: dragState.active
				? 0.25
				: SLIDE_LERP;
		groupRef.current.position.x = THREE.MathUtils.lerp(
			groupRef.current.position.x,
			effectiveTarget,
			lerpSpeed,
		);

		// Camera Z - during drag: track the drag-adjusted position for live zoom.
		// After release: target the active size Z directly (decoupled from
		// carousel X to prevent coupled oscillation / jitter on release).
		const targetZ = CAMERA_Z_ARRAY[activeIndex];
		if (prefersReducedMotion) {
			state.camera.position.z = targetZ;
		} else if (dragState.active) {
			const viewX = Math.max(
				MODEL_X[0],
				Math.min(MODEL_X[MODEL_X.length - 1], -effectiveTarget),
			);
			let fi = 0;
			for (let j = 0; j < MODEL_X.length - 1; j++) {
				if (viewX >= MODEL_X[j]) fi = j;
			}
			const ci = Math.min(fi + 1, MODEL_X.length - 1);
			const gap = MODEL_X[ci] - MODEL_X[fi];
			const frac = gap > 0 ? (viewX - MODEL_X[fi]) / gap : 0;
			const dragZ =
				CAMERA_Z_ARRAY[fi] + (CAMERA_Z_ARRAY[ci] - CAMERA_Z_ARRAY[fi]) * frac;

			state.camera.position.z = THREE.MathUtils.lerp(
				state.camera.position.z,
				dragZ,
				0.25,
			);
		} else {
			state.camera.position.z = THREE.MathUtils.lerp(
				state.camera.position.z,
				targetZ,
				SLIDE_LERP,
			);
		}

		// Compute per-model ghost amounts from actual carousel position.
		// 0 = fully visible (centered), 1 = fully ghosted (off-screen).
		const viewCenter = -groupRef.current.position.x;
		for (let i = 0; i < LAMP_SIZES.length; i++) {
			ghostAmounts[i] = Math.min(
				1,
				Math.abs(MODEL_X[i] - viewCenter) / SPACING,
			);
		}

		// Request next frame while animation is still converging
		const dx = Math.abs(groupRef.current.position.x - effectiveTarget);
		const dz = Math.abs(state.camera.position.z - targetZ);
		if (dx > EPSILON || dz > EPSILON || dragState.active || modelOrbit.active) {
			state.invalidate();
		}
	});

	return (
		<group ref={groupRef}>
			{LAMP_SIZES.map((lampSize, i) => {
				const isActive = i === activeIndex;
				const scale = lampSize.displayScale;

				return (
					<group key={lampSize.key} position={[MODEL_X[i], 0, 0]} scale={scale}>
						<AutoRotate active={isActive}>
							<GLBProductModel
								bodyHex={COLOR_HEX[bodyColor]}
								shadeHex={COLOR_HEX[shadeColor]}
								accentHex={COLOR_HEX[accentColor]}
								modelIndex={i}
								onClick={
									isActive
										? undefined
										: () => {
												if (!isDragGesture) setSize(lampSize.key);
											}
								}
							/>
						</AutoRotate>
					</group>
				);
			})}
		</group>
	);
}

// Main Component

export function SceneCanvas() {
	const containerRef = useRef<HTMLDivElement>(null);
	const setSize = useConfiguratorStore((s) => s.setSize);

	const getActiveIndex = useCallback(() => {
		const size = useConfiguratorStore.getState().size;
		return Math.max(
			0,
			LAMP_SIZES.findIndex((s) => s.key === size),
		);
	}, []);

	// Reset module-level state on unmount (StrictMode/HMR safety)
	useEffect(() => {
		return () => resetDragState();
	}, []);

	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		const el = containerRef.current;
		if (!el) return;

		// Capture pointer so move/up events fire even if pointer leaves container
		el.setPointerCapture(e.pointerId);

		// Model orbit mode: R3F onPointerDown already set the flag
		if (modelOrbit.active) {
			modelOrbit.startX = e.clientX;
			modelOrbit.startY = e.clientY;
			modelOrbit.currentX = e.clientX;
			modelOrbit.currentY = e.clientY;
			modelOrbit.consumedX = e.clientX;
			modelOrbit.consumedY = e.clientY;
			isDragGesture = false;
			return;
		}

		dragState.active = true;
		dragState.startX = e.clientX;
		dragState.currentX = e.clientX;
		dragState.containerWidth = el.offsetWidth;
		dragState.velocity = 0;
		dragState.lastX = e.clientX;
		dragState.lastTime = performance.now();
		isDragGesture = false;
	}, []);

	const handlePointerMove = useCallback((e: React.PointerEvent) => {
		// Model orbit mode
		if (modelOrbit.active) {
			modelOrbit.currentX = e.clientX;
			modelOrbit.currentY = e.clientY;
			const dx = e.clientX - modelOrbit.startX;
			const dy = e.clientY - modelOrbit.startY;
			if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD && !isDragGesture) {
				isDragGesture = true;
				if (containerRef.current)
					containerRef.current.style.cursor = "grabbing";
			}
			// setPointerCapture redirects events away from R3F canvas,
			// so we must manually request frames during orbit.
			r3fInvalidate?.();
			return;
		}

		if (!dragState.active) return;

		const now = performance.now();
		const dt = now - dragState.lastTime;

		if (dt > 0) {
			const dx = e.clientX - dragState.lastX;
			// Exponential smoothing for velocity
			dragState.velocity = 0.7 * dragState.velocity + 0.3 * (dx / dt) * 16;
		}

		dragState.currentX = e.clientX;
		dragState.lastX = e.clientX;
		dragState.lastTime = now;

		const delta = Math.abs(dragState.currentX - dragState.startX);
		if (delta > DRAG_THRESHOLD && !isDragGesture) {
			isDragGesture = true;
			if (containerRef.current) containerRef.current.style.cursor = "grabbing";
		}

		r3fInvalidate?.();
	}, []);

	const handlePointerUp = useCallback(
		(_e: React.PointerEvent) => {
			// Model orbit mode: just release
			if (modelOrbit.active) {
				modelOrbit.active = false;
				isDragGesture = false;
				if (containerRef.current) containerRef.current.style.cursor = "grab";
				return;
			}

			if (!dragState.active) return;

			if (isDragGesture) {
				const pixelDelta = dragState.currentX - dragState.startX;
				const fraction = pixelDelta / dragState.containerWidth;
				const currentIndex = getActiveIndex();
				const velocity = dragState.velocity / dragState.containerWidth;

				// Advance if dragged far enough OR if velocity is high enough
				if (
					(fraction < -SNAP_THRESHOLD || velocity < -VELOCITY_THRESHOLD) &&
					currentIndex < LAMP_SIZES.length - 1
				) {
					setSize(LAMP_SIZES[currentIndex + 1].key);
				} else if (
					(fraction > SNAP_THRESHOLD || velocity > VELOCITY_THRESHOLD) &&
					currentIndex > 0
				) {
					setSize(LAMP_SIZES[currentIndex - 1].key);
				}
			}

			dragState.active = false;
			dragState.startX = 0;
			dragState.currentX = 0;
			dragState.velocity = 0;
			isDragGesture = false;
			if (containerRef.current) containerRef.current.style.cursor = "grab";
		},
		[getActiveIndex, setSize],
	);

	// Cancel resets state without triggering snap navigation
	const handlePointerCancel = useCallback(() => {
		resetDragState();
		if (containerRef.current) containerRef.current.style.cursor = "grab";
	}, []);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const currentIndex = getActiveIndex();
			if (e.key === "ArrowRight" || e.key === "ArrowDown") {
				e.preventDefault();
				if (currentIndex < LAMP_SIZES.length - 1) {
					setSize(LAMP_SIZES[currentIndex + 1].key);
				}
			} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
				e.preventDefault();
				if (currentIndex > 0) {
					setSize(LAMP_SIZES[currentIndex - 1].key);
				}
			}
		},
		[getActiveIndex, setSize],
	);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const prevent = (e: Event) => e.preventDefault();
		el.addEventListener("dragstart", prevent);
		return () => el.removeEventListener("dragstart", prevent);
	}, []);

	return (
		<div
			ref={containerRef}
			className="w-full h-full touch-none select-none cursor-grab"
			role="region"
			aria-label="3D product preview - use arrow keys to change size"
			aria-roledescription="3D carousel"
			onKeyDown={handleKeyDown}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onPointerCancel={handlePointerCancel}
		>
			<Canvas
				dpr={[1, 2]}
				frameloop="demand"
				camera={{ fov: 40, position: [0, 0.5, 3.6] }}
				gl={{ antialias: true }}
				style={{ width: "100%", height: "100%" }}
			>
				{/* Light warm gray background */}
				<color attach="background" args={[BRAND_COLORS.cream]} />

				<Lighting />
				<StoreInvalidator />

				<ContactShadows
					position={[0, -2.5, 0]}
					opacity={0.2}
					scale={40}
					blur={2.5}
					far={30}
					resolution={512}
				/>

				<Suspense fallback={null}>
					<SizeCarousel />
				</Suspense>
			</Canvas>
		</div>
	);
}

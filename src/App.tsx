/**
 * Root layout for the Aura lamp configurator.
 *
 * Full-viewport 3D canvas with minimal overlaid UI:
 * - Top-left: Brand wordmark
 * - Bottom-left: Product name (serif display font)
 * - Bottom-right: Part tabs + color swatches + arrows + Select button
 */

import { lazy, Suspense } from "react";

const SceneCanvas = lazy(() =>
	import("./components/canvas/SceneCanvas").then((m) => ({
		default: m.SceneCanvas,
	})),
);

/** Check WebGL support once at module load */
const hasWebGL = (() => {
	try {
		const canvas = document.createElement("canvas");
		return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
	} catch {
		return false;
	}
})();

import { BrandHeader } from "./components/ui/BrandHeader";
import { CarouselArrows } from "./components/ui/CarouselArrows";
import { ColorSwatches } from "./components/ui/ColorSwatches";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { LoadingScreen } from "./components/ui/LoadingScreen";
import { PRODUCT_COLORS } from "./constants/colors";
import { LAMP_SIZES } from "./constants/sizes";
import { useConfiguratorStore } from "./store/configuratorStore";

function ProductName() {
	const size = useConfiguratorStore((s) => s.size);
	const sizeData = LAMP_SIZES.find((s) => s.key === size);
	return (
		<div className="pointer-events-auto">
			<h1 className="font-display text-black text-[24px] sm:text-[32px] leading-none tracking-tight">
				Aura {sizeData?.label}
			</h1>
		</div>
	);
}

function AddToCartButton() {
	const size = useConfiguratorStore((s) => s.size);
	const bodyColor = useConfiguratorStore((s) => s.bodyColor);
	const shadeColor = useConfiguratorStore((s) => s.shadeColor);
	const accentColor = useConfiguratorStore((s) => s.accentColor);
	const sizeData = LAMP_SIZES.find((s) => s.key === size);

	const totalPrice =
		495 +
		[bodyColor, shadeColor, accentColor].reduce((sum, key) => {
			const color = PRODUCT_COLORS.find((c) => c.key === key);
			return sum + (color?.priceDelta ?? 0);
		}, 0);

	return (
		<button
			type="button"
			aria-label={`Add Aura ${sizeData?.label} to cart, €${totalPrice}`}
			className="pointer-events-auto bg-black text-white px-5 py-2.5 rounded-lg font-sans text-sm font-medium tracking-wide hover:bg-black/85 active:bg-black/75 transition-colors duration-150 flex flex-col items-center leading-tight focus-ring"
		>
			<span>Add to Cart</span>
			<span className="text-white/60 text-[11px] font-normal">
				€{totalPrice}
			</span>
		</button>
	);
}

export function App() {
	return (
		<div className="relative w-screen h-screen overflow-hidden bg-cream font-sans">
			<a
				href="#configurator-controls"
				className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-1/2 focus:-translate-x-1/2 focus:z-50 focus:bg-black focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm"
			>
				Skip to controls
			</a>

			<LoadingScreen />

			{/* 3D Canvas - fills entire viewport */}
			<main className="absolute inset-0 z-0">
				{hasWebGL ? (
					<ErrorBoundary>
						<Suspense fallback={null}>
							<SceneCanvas />
						</Suspense>
					</ErrorBoundary>
				) : (
					<div className="flex flex-col items-center justify-center h-full bg-cream gap-4">
						<p className="text-black/60 text-sm font-sans">
							Your browser does not support WebGL, which is required for the 3D
							viewer.
						</p>
						<p className="text-black/40 text-xs font-sans">
							Try updating your browser or enabling hardware acceleration.
						</p>
					</div>
				)}
			</main>

			{/* UI overlays */}
			<div className="absolute inset-0 z-10 pointer-events-none">
				{/* Brand header - top left */}
				<header className="absolute top-4 left-4 sm:top-6 sm:left-8">
					<BrandHeader />
				</header>

				{/* Bottom bar - stacks vertically on mobile, horizontal on desktop */}
				<nav
					id="configurator-controls"
					aria-label="Product configuration"
					className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1.5 sm:gap-0"
				>
					{/* Left: product name */}
					<ProductName />

					{/* Right: controls - stack on mobile, inline on desktop */}
					<div className="flex flex-col sm:flex-row items-start sm:items-end gap-1.5 sm:gap-5">
						<ColorSwatches />
						<div className="flex items-end gap-3 sm:gap-5 self-end sm:self-auto">
							<CarouselArrows />
							<AddToCartButton />
						</div>
					</div>
				</nav>
			</div>
		</div>
	);
}

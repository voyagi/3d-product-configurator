/**
 * Brand splash loading screen displayed while the R3F scene initializes.
 * Uses @react-three/drei's useProgress to track scene load progress.
 * Fades out over 0.5s once progress reaches 100, then removes from DOM.
 */

import { useProgress } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import { trackConfiguratorLoaded } from "../../lib/analytics";

export function LoadingScreen() {
	const { progress } = useProgress();
	const [visible, setVisible] = useState(true);
	const [fading, setFading] = useState(false);

	const [timedOut, setTimedOut] = useState(false);

	const loadStartRef = useRef(performance.now());

	useEffect(() => {
		if (progress >= 100) {
			trackConfiguratorLoaded(
				Math.round(performance.now() - loadStartRef.current),
			);
			// Trigger fade-out
			setFading(true);
			const timer = setTimeout(() => {
				setVisible(false);
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [progress]);

	// Show timeout message if loading takes too long (30s)
	useEffect(() => {
		const timer = setTimeout(() => {
			if (progress < 100) setTimedOut(true);
		}, 30_000);
		return () => clearTimeout(timer);
	}, [progress]);

	if (!visible) return null;

	return (
		<div
			className="fixed inset-0 z-50 bg-cream flex flex-col items-center justify-center"
			role="status"
			aria-label="Loading 3D configurator"
			style={{
				opacity: fading ? 0 : 1,
				transition: "opacity 0.5s ease-out",
			}}
		>
			{/* Brand wordmark */}
			<div
				className="font-display text-[28px] text-black tracking-tight mb-6"
				aria-hidden="true"
			>
				Configurator
			</div>

			{/* Thin progress bar */}
			<div
				className="w-32 h-px bg-black/10 relative overflow-hidden"
				role="progressbar"
				aria-valuenow={Math.round(progress)}
				aria-valuemin={0}
				aria-valuemax={100}
				aria-label={`Loading: ${Math.round(progress)}%`}
			>
				<div
					className="absolute inset-y-0 left-0 bg-black transition-all duration-300"
					style={{ width: `${progress}%` }}
				/>
			</div>

			{timedOut && (
				<p className="mt-4 text-black/40 text-xs font-sans">
					Loading is taking longer than expected.{" "}
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="underline hover:text-black/60"
					>
						Refresh
					</button>
				</p>
			)}
		</div>
	);
}

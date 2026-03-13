/**
 * Carousel navigation arrows.
 * Minimal |< >| pagination controls positioned inline with the bottom bar.
 */

import { useCallback } from "react";
import { LAMP_SIZES } from "../../constants/sizes";
import { useConfiguratorStore } from "../../store/configuratorStore";

export function CarouselArrows() {
	const size = useConfiguratorStore((s) => s.size);
	const setSize = useConfiguratorStore((s) => s.setSize);

	const activeIndex = Math.max(
		0,
		LAMP_SIZES.findIndex((s) => s.key === size),
	);

	// Roving tabindex: arrow keys navigate between radio buttons
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			let nextIdx = -1;
			if (e.key === "ArrowRight" || e.key === "ArrowDown") {
				e.preventDefault();
				nextIdx = (activeIndex + 1) % LAMP_SIZES.length;
			} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
				e.preventDefault();
				nextIdx = (activeIndex - 1 + LAMP_SIZES.length) % LAMP_SIZES.length;
			}
			if (nextIdx >= 0) {
				setSize(LAMP_SIZES[nextIdx].key);
				document.getElementById(`size-${LAMP_SIZES[nextIdx].key}`)?.focus();
			}
		},
		[activeIndex, setSize],
	);

	return (
		<div className="pointer-events-auto flex flex-col items-center gap-0.5">
			<span
				className="text-[10px] uppercase tracking-[0.12em] text-black/55 font-medium"
				id="size-label"
			>
				Size
			</span>
			<div
				className="flex items-center gap-0.5"
				role="radiogroup"
				aria-labelledby="size-label"
				onKeyDown={handleKeyDown}
			>
				{LAMP_SIZES.map((s, i) => (
					<button
						type="button"
						key={s.key}
						id={`size-${s.key}`}
						role="radio"
						aria-checked={i === activeIndex}
						tabIndex={i === activeIndex ? 0 : -1}
						className={`
              px-2.5 py-2 sm:px-2 sm:py-1 text-[13px] rounded-full transition-all duration-200 focus-ring
              ${
								i === activeIndex
									? "text-black font-semibold"
									: "text-black/55 font-medium hover:text-black/70 cursor-pointer"
							}
            `}
						onClick={() => setSize(s.key)}
					>
						{s.label}
					</button>
				))}
			</div>
		</div>
	);
}

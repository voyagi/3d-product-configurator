/**
 * Color picker with part tabs.
 *
 * Layout:
 * - Part segment tabs: Body | Shade | Detail (with color preview dots)
 * - Color name + finish type label
 * - Row of circular swatches with ring-on-select
 */

import { useCallback, useEffect, useRef } from "react";
import {
	COLOR_HEX,
	COLOR_LABELS,
	PRODUCT_COLORS,
} from "../../constants/colors";
import type { LampPart } from "../../store/configuratorStore";
import {
	getPartColor,
	LAMP_PARTS,
	partHighlightAnim,
	useConfiguratorStore,
} from "../../store/configuratorStore";

export function ColorSwatches() {
	const activePart = useConfiguratorStore((s) => s.activePart);
	const setActivePart = useConfiguratorStore((s) => s.setActivePart);
	const setActivePartColor = useConfiguratorStore((s) => s.setActivePartColor);

	const state = useConfiguratorStore();
	const activeColorKey = getPartColor(state, activePart);

	const activeColor = PRODUCT_COLORS.find((c) => c.key === activeColorKey);
	const finishLabel =
		activeColor?.finish === "metallic" ? "Metallic finish" : "Matte finish";

	// Trigger part highlight flash on the 3D model when switching tabs
	const isFirstRender = useRef(true);
	// biome-ignore lint/correctness/useExhaustiveDependencies: activePart is the change trigger, not consumed inside
	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		partHighlightAnim.phase = 1;
	}, [activePart]);

	// Roving tabindex: arrow keys navigate between tabs
	const handleTabKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const currentIdx = LAMP_PARTS.findIndex((p) => p.key === activePart);
			let nextIdx = -1;
			if (e.key === "ArrowRight" || e.key === "ArrowDown") {
				e.preventDefault();
				nextIdx = (currentIdx + 1) % LAMP_PARTS.length;
			} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
				e.preventDefault();
				nextIdx = (currentIdx - 1 + LAMP_PARTS.length) % LAMP_PARTS.length;
			} else if (e.key === "Home") {
				e.preventDefault();
				nextIdx = 0;
			} else if (e.key === "End") {
				e.preventDefault();
				nextIdx = LAMP_PARTS.length - 1;
			}
			if (nextIdx >= 0) {
				setActivePart(LAMP_PARTS[nextIdx].key);
				document.getElementById(`tab-${LAMP_PARTS[nextIdx].key}`)?.focus();
			}
		},
		[activePart, setActivePart],
	);

	// Roving tabindex: arrow keys navigate between color swatches
	const handleSwatchKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			const currentIdx = PRODUCT_COLORS.findIndex(
				(c) => c.key === activeColorKey,
			);
			let nextIdx = -1;
			if (e.key === "ArrowRight" || e.key === "ArrowDown") {
				e.preventDefault();
				nextIdx = (currentIdx + 1) % PRODUCT_COLORS.length;
			} else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
				e.preventDefault();
				nextIdx =
					(currentIdx - 1 + PRODUCT_COLORS.length) % PRODUCT_COLORS.length;
			} else if (e.key === "Home") {
				e.preventDefault();
				nextIdx = 0;
			} else if (e.key === "End") {
				e.preventDefault();
				nextIdx = PRODUCT_COLORS.length - 1;
			}
			if (nextIdx >= 0) {
				setActivePartColor(PRODUCT_COLORS[nextIdx].key);
				document
					.getElementById(`swatch-${PRODUCT_COLORS[nextIdx].key}`)
					?.focus();
			}
		},
		[activeColorKey, setActivePartColor],
	);

	return (
		<div className="pointer-events-auto flex flex-col gap-3">
			{/* Part segment tabs - min 44px touch targets on mobile */}
			<div
				className="flex gap-1 bg-black/[0.04] rounded-full p-0.5 w-fit"
				role="tablist"
				aria-label="Lamp part"
				onKeyDown={handleTabKeyDown}
			>
				{LAMP_PARTS.map((part) => {
					const isActive = part.key === activePart;
					const partColorKey = getPartColor(state, part.key);
					return (
						<button
							type="button"
							key={part.key}
							role="tab"
							aria-selected={isActive}
							aria-controls={`panel-${part.key}`}
							aria-label={`${part.label}, ${COLOR_LABELS[partColorKey]}`}
							id={`tab-${part.key}`}
							tabIndex={isActive ? 0 : -1}
							onClick={() => setActivePart(part.key as LampPart)}
							className={`
                relative flex items-center gap-1.5 px-3.5 py-2.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium
                transition-all duration-200 ease-out
                focus-ring
                ${
									isActive
										? "bg-white text-black shadow-sm"
										: "text-black/55 hover:text-black/70"
								}
              `}
						>
							<span
								className="w-2.5 h-2.5 rounded-full flex-shrink-0"
								style={{ backgroundColor: COLOR_HEX[partColorKey] }}
								aria-hidden="true"
							/>
							{part.label}
						</button>
					);
				})}
			</div>

			{/* Color info + swatches row */}
			<div
				className="flex items-center gap-3 sm:gap-4"
				role="tabpanel"
				id={`panel-${activePart}`}
				aria-labelledby={`tab-${activePart}`}
			>
				{/* Color name - compact on mobile, full on desktop */}
				<div className="min-w-0 sm:min-w-[120px]">
					<div className="text-black text-[13px] font-medium leading-tight tracking-wide">
						{activeColor?.label}
					</div>
					<div className="text-black/55 text-[10px] sm:text-[11px] font-normal leading-tight mt-0.5">
						{finishLabel}
					</div>
				</div>

				{/* Swatch dots - 44px touch area via padding, visual dot stays compact */}
				<div
					className="flex items-center -mx-1.5"
					role="listbox"
					aria-label={`${activePart} color`}
					onKeyDown={handleSwatchKeyDown}
				>
					{PRODUCT_COLORS.map((color) => {
						const isSelected = color.key === activeColorKey;
						return (
							<button
								type="button"
								key={color.key}
								id={`swatch-${color.key}`}
								role="option"
								aria-selected={isSelected}
								tabIndex={isSelected ? 0 : -1}
								className="relative group p-[11px] focus-ring rounded-full"
								onClick={() => setActivePartColor(color.key)}
								aria-label={`${color.label} ${color.finish}`}
							>
								<span
									className={`
                    absolute inset-[8px] rounded-full border-[1.5px]
                    transition-all duration-200 ease-out
                    ${isSelected ? "border-black/50 scale-100" : "border-transparent scale-90"}
                  `}
									aria-hidden="true"
								/>
								<span
									className={`
                    block w-[22px] h-[22px] rounded-full
                    transition-transform duration-200 ease-out
                    ${!isSelected ? "group-hover:scale-110" : ""}
                    ${color.key === "noir" ? "ring-1 ring-inset ring-white/20" : ""}
                    ${color.key === "pearl" ? "ring-1 ring-inset ring-black/10" : ""}
                  `}
									style={{ backgroundColor: color.hex }}
									aria-hidden="true"
								/>
							</button>
						);
					})}
				</div>
			</div>
		</div>
	);
}

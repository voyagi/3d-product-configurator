/**
 * Zustand configurator store - shared state between 3D scene and config UI.
 * Three-part color model: body (metal frame), shade (glass), accent (filament/detail).
 * Each part is independently colorable. activePart tracks which zone the
 * color swatches control.
 */

import { create } from "zustand";
import type { ColorKey } from "../constants/colors";
import type { LampSizeKey } from "../constants/sizes";
import { trackColorChange, trackSizeChange } from "../lib/analytics";

export type LampPart = "body" | "shade" | "accent";

export const LAMP_PARTS: { key: LampPart; label: string }[] = [
	{ key: "body", label: "Body" },
	{ key: "shade", label: "Shade" },
	{ key: "accent", label: "Detail" },
];

/** Maps each lamp part to its store color key */
const PART_COLOR_KEYS = {
	body: "bodyColor",
	shade: "shadeColor",
	accent: "accentColor",
} as const;

/** Get the color key for a given part from store state */
export function getPartColor(
	state: { bodyColor: ColorKey; shadeColor: ColorKey; accentColor: ColorKey },
	part: LampPart,
): ColorKey {
	return state[PART_COLOR_KEYS[part]];
}

interface ConfiguratorState {
	bodyColor: ColorKey;
	shadeColor: ColorKey;
	accentColor: ColorKey;
	activePart: LampPart;
	size: LampSizeKey;

	setActivePart: (part: LampPart) => void;
	setActivePartColor: (color: ColorKey) => void;
	setSize: (size: LampSizeKey) => void;
}

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
	bodyColor: "charcoal",
	shadeColor: "rose",
	accentColor: "oat",
	activePart: "body",
	size: "500",

	setActivePart: (part) => set({ activePart: part }),

	setActivePartColor: (color) => {
		const { activePart } = get();
		set({ [PART_COLOR_KEYS[activePart]]: color });
		trackColorChange(activePart, color);
	},

	setSize: (size) => {
		set({ size });
		trackSizeChange(size);
	},
}));

/** Module-level animation state for part highlight flash (read by useFrame, not React) */
export const partHighlightAnim = { phase: 0 };

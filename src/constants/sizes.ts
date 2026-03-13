export type LampSizeKey = "300" | "500" | "1000";

interface LampSize {
	key: LampSizeKey;
	label: string;
	displayScale: number;
	basePrice: number;
}

export const LAMP_SIZES: LampSize[] = [
	{ key: "300", label: "300mm", displayScale: 3.5, basePrice: 395 },
	{ key: "500", label: "500mm", displayScale: 4.5, basePrice: 495 },
	{ key: "1000", label: "1000mm", displayScale: 6.0, basePrice: 695 },
];

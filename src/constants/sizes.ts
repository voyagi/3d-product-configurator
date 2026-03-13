export type LampSizeKey = "300" | "500" | "1000";

interface LampSize {
	key: LampSizeKey;
	label: string;
	displayScale: number;
}

export const LAMP_SIZES: LampSize[] = [
	{ key: "300", label: "300mm", displayScale: 3.5 },
	{ key: "500", label: "500mm", displayScale: 4.5 },
	{ key: "1000", label: "1000mm", displayScale: 6.0 },
];

/**
 * Brand and product color definitions for the Aura lamp configurator.
 * Muted, sophisticated palette with matte and metallic finishes.
 * All hex values are sRGB - R3F v8 ColorManagement handles the Three.js conversion.
 */

export const BRAND_COLORS = {
	cream: "#f5f5f0",
	black: "#1a1a1a",
	magenta: "#d62976",
} as const;

type FinishType = "matte" | "metallic";

export type ColorKey =
	| "rose"
	| "navy"
	| "sage"
	| "pearl"
	| "charcoal"
	| "oat"
	| "noir";

export const COLOR_HEX: Record<ColorKey, string> = {
	rose: "#C4777A",
	navy: "#2B4B8C",
	sage: "#7B9E6B",
	pearl: "#E8E4DF",
	charcoal: "#5A5A5A",
	oat: "#D4C5A9",
	noir: "#1A1A1A",
};

interface ProductColor {
	key: ColorKey;
	hex: string;
	label: string;
	finish: FinishType;
	priceDelta: number;
}

export const COLOR_LABELS: Record<ColorKey, string> = {
	rose: "Rose",
	navy: "Navy",
	sage: "Sage",
	pearl: "Pearl",
	charcoal: "Charcoal",
	oat: "Oat",
	noir: "Noir",
};

export const PRODUCT_COLORS: ProductColor[] = [
	{
		key: "rose",
		hex: COLOR_HEX.rose,
		label: "Rose",
		finish: "matte",
		priceDelta: 0,
	},
	{
		key: "navy",
		hex: COLOR_HEX.navy,
		label: "Navy",
		finish: "matte",
		priceDelta: 0,
	},
	{
		key: "sage",
		hex: COLOR_HEX.sage,
		label: "Sage",
		finish: "matte",
		priceDelta: 0,
	},
	{
		key: "pearl",
		hex: COLOR_HEX.pearl,
		label: "Pearl",
		finish: "metallic",
		priceDelta: 45,
	},
	{
		key: "charcoal",
		hex: COLOR_HEX.charcoal,
		label: "Charcoal",
		finish: "matte",
		priceDelta: 0,
	},
	{
		key: "oat",
		hex: COLOR_HEX.oat,
		label: "Oat",
		finish: "matte",
		priceDelta: 0,
	},
	{
		key: "noir",
		hex: COLOR_HEX.noir,
		label: "Noir",
		finish: "metallic",
		priceDelta: 45,
	},
];

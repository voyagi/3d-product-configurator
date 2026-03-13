import { describe, expect, it } from "vitest";
import {
	COLOR_HEX,
	COLOR_LABELS,
	type ColorKey,
	PRODUCT_COLORS,
} from "../constants/colors";

describe("PRODUCT_COLORS", () => {
	it("has 7 colors", () => {
		expect(PRODUCT_COLORS).toHaveLength(7);
	});

	it("every color has a matching hex entry", () => {
		for (const color of PRODUCT_COLORS) {
			expect(COLOR_HEX[color.key]).toBeDefined();
			expect(color.hex).toBe(COLOR_HEX[color.key]);
		}
	});

	it("every color has a matching label entry", () => {
		for (const color of PRODUCT_COLORS) {
			expect(COLOR_LABELS[color.key]).toBe(color.label);
		}
	});

	it("all hex values are valid 7-char hex strings", () => {
		for (const color of PRODUCT_COLORS) {
			expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/);
		}
	});

	it("priceDelta is zero for matte, non-negative for all", () => {
		for (const color of PRODUCT_COLORS) {
			expect(color.priceDelta).toBeGreaterThanOrEqual(0);
			if (color.finish === "matte") {
				expect(color.priceDelta).toBe(0);
			}
		}
	});

	it("metallic finish colors have positive priceDelta", () => {
		const metallics = PRODUCT_COLORS.filter((c) => c.finish === "metallic");
		expect(metallics.length).toBeGreaterThan(0);
		for (const color of metallics) {
			expect(color.priceDelta).toBeGreaterThan(0);
		}
	});
});

describe("price calculation", () => {
	it("base price 495 + metallic surcharges", () => {
		const base = 495;
		const getPrice = (body: ColorKey, shade: ColorKey, accent: ColorKey) =>
			base +
			[body, shade, accent].reduce((sum, key) => {
				const color = PRODUCT_COLORS.find((c) => c.key === key);
				return sum + (color?.priceDelta ?? 0);
			}, 0);

		// All matte = base price
		expect(getPrice("charcoal", "rose", "oat")).toBe(495);

		// One metallic part
		expect(getPrice("pearl", "rose", "oat")).toBe(540);

		// All metallic
		expect(getPrice("pearl", "noir", "pearl")).toBe(630);
	});
});

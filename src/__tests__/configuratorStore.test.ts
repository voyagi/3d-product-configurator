import { beforeEach, describe, expect, it } from "vitest";
import {
	getPartColor,
	LAMP_PARTS,
	useConfiguratorStore,
} from "../store/configuratorStore";

describe("configuratorStore", () => {
	beforeEach(() => {
		// Reset store to defaults before each test
		useConfiguratorStore.setState({
			bodyColor: "charcoal",
			shadeColor: "rose",
			accentColor: "oat",
			activePart: "body",
			size: "500",
		});
	});

	it("has correct default state", () => {
		const state = useConfiguratorStore.getState();
		expect(state.bodyColor).toBe("charcoal");
		expect(state.shadeColor).toBe("rose");
		expect(state.accentColor).toBe("oat");
		expect(state.activePart).toBe("body");
		expect(state.size).toBe("500");
	});

	it("setActivePart changes the active part", () => {
		useConfiguratorStore.getState().setActivePart("shade");
		expect(useConfiguratorStore.getState().activePart).toBe("shade");
	});

	it("setActivePartColor sets body color when body is active", () => {
		useConfiguratorStore.getState().setActivePart("body");
		useConfiguratorStore.getState().setActivePartColor("navy");
		expect(useConfiguratorStore.getState().bodyColor).toBe("navy");
	});

	it("setActivePartColor sets shade color when shade is active", () => {
		useConfiguratorStore.getState().setActivePart("shade");
		useConfiguratorStore.getState().setActivePartColor("sage");
		expect(useConfiguratorStore.getState().shadeColor).toBe("sage");
	});

	it("setActivePartColor sets accent color when accent is active", () => {
		useConfiguratorStore.getState().setActivePart("accent");
		useConfiguratorStore.getState().setActivePartColor("noir");
		expect(useConfiguratorStore.getState().accentColor).toBe("noir");
	});

	it("setSize updates the size", () => {
		useConfiguratorStore.getState().setSize("1000");
		expect(useConfiguratorStore.getState().size).toBe("1000");
	});

	it("setActivePartColor does not affect other parts", () => {
		useConfiguratorStore.getState().setActivePart("body");
		useConfiguratorStore.getState().setActivePartColor("navy");
		expect(useConfiguratorStore.getState().shadeColor).toBe("rose");
		expect(useConfiguratorStore.getState().accentColor).toBe("oat");
	});
});

describe("getPartColor", () => {
	it("returns body color for body part", () => {
		const state = {
			bodyColor: "navy" as const,
			shadeColor: "rose" as const,
			accentColor: "oat" as const,
		};
		expect(getPartColor(state, "body")).toBe("navy");
	});

	it("returns shade color for shade part", () => {
		const state = {
			bodyColor: "navy" as const,
			shadeColor: "sage" as const,
			accentColor: "oat" as const,
		};
		expect(getPartColor(state, "shade")).toBe("sage");
	});

	it("returns accent color for accent part", () => {
		const state = {
			bodyColor: "navy" as const,
			shadeColor: "rose" as const,
			accentColor: "noir" as const,
		};
		expect(getPartColor(state, "accent")).toBe("noir");
	});
});

describe("LAMP_PARTS", () => {
	it("has 3 parts", () => {
		expect(LAMP_PARTS).toHaveLength(3);
	});

	it("has body, shade, accent in order", () => {
		expect(LAMP_PARTS.map((p) => p.key)).toEqual(["body", "shade", "accent"]);
	});
});

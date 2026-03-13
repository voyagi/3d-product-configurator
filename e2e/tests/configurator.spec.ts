import { test, expect } from "@playwright/test";
import { ConfiguratorPage } from "../pages/configurator.page";

test.describe("Configurator - Loading", () => {
	test("shows loading screen with progress bar on initial load", async ({
		page,
	}) => {
		const configurator = new ConfiguratorPage(page);
		await configurator.goto();

		await expect(configurator.loadingScreen).toBeVisible();
		await expect(configurator.progressBar).toBeVisible();
	});

	test("loading screen disappears after scene loads", async ({ page }) => {
		const configurator = new ConfiguratorPage(page);
		await configurator.goto();
		await configurator.waitForLoaded();

		await expect(configurator.loadingScreen).not.toBeVisible();
	});
});

test.describe("Configurator - Brand & Layout", () => {
	let configurator: ConfiguratorPage;

	test.beforeEach(async ({ page }) => {
		configurator = new ConfiguratorPage(page);
		await configurator.goto();
		await configurator.waitForLoaded();
	});

	test("displays brand header", async () => {
		await expect(configurator.brandHeader.first()).toBeVisible();
	});

	test("displays product name with default size", async () => {
		// Default size is 500mm
		await expect(configurator.productName).toContainText("Aura 500mm");
	});

	test("shows add to cart button with price", async () => {
		await expect(configurator.selectButton).toBeVisible();
		await expect(configurator.selectButton).toContainText("Add to Cart");
		await expect(configurator.selectButton).toContainText("€495");
	});
});

test.describe("Configurator - Part Tabs", () => {
	let configurator: ConfiguratorPage;

	test.beforeEach(async ({ page }) => {
		configurator = new ConfiguratorPage(page);
		await configurator.goto();
		await configurator.waitForLoaded();
	});

	test("shows all three part tabs", async () => {
		await expect(configurator.bodyTab).toBeVisible();
		await expect(configurator.shadeTab).toBeVisible();
		await expect(configurator.detailTab).toBeVisible();
	});

	test("body tab is selected by default", async () => {
		await expect(configurator.bodyTab).toHaveAttribute("aria-selected", "true");
		await expect(configurator.shadeTab).toHaveAttribute(
			"aria-selected",
			"false",
		);
		await expect(configurator.detailTab).toHaveAttribute(
			"aria-selected",
			"false",
		);
	});

	test("clicking shade tab selects it", async () => {
		await configurator.selectPart("Shade");

		await expect(configurator.shadeTab).toHaveAttribute(
			"aria-selected",
			"true",
		);
		await expect(configurator.bodyTab).toHaveAttribute(
			"aria-selected",
			"false",
		);
	});

	test("clicking detail tab selects it", async () => {
		await configurator.selectPart("Detail");

		await expect(configurator.detailTab).toHaveAttribute(
			"aria-selected",
			"true",
		);
		await expect(configurator.bodyTab).toHaveAttribute(
			"aria-selected",
			"false",
		);
	});
});

test.describe("Configurator - Color Selection", () => {
	let configurator: ConfiguratorPage;

	test.beforeEach(async ({ page }) => {
		configurator = new ConfiguratorPage(page);
		await configurator.goto();
		await configurator.waitForLoaded();
	});

	test("displays all 7 color swatches", async () => {
		const options = configurator.colorSwatchList.getByRole("option");
		await expect(options).toHaveCount(7);
	});

	test("default body color is Charcoal", async () => {
		// Store default: bodyColor = 'charcoal'
		await expect(configurator.colorName).toContainText("Charcoal");
	});

	test("clicking a color swatch updates the color name", async () => {
		await configurator.selectColor("Rose");
		await expect(configurator.colorName).toContainText("Rose");
	});

	test("selecting metallic color shows metallic finish label", async ({
		page,
	}) => {
		await configurator.selectColor("Pearl");

		const finishLabel = page.getByText(/Metallic finish/).first();
		await expect(finishLabel).toBeVisible();
	});

	test("selecting matte color shows matte finish label", async ({ page }) => {
		// Charcoal is default and matte, but let's switch to ensure
		await configurator.selectColor("Sage");

		const finishLabel = page.getByText("Matte finish").first();
		await expect(finishLabel).toBeVisible();
	});

	test("each part tab has independent color selection", async () => {
		// Body defaults to Charcoal
		await expect(configurator.colorName).toContainText("Charcoal");

		// Switch to Shade - defaults to Rose
		await configurator.selectPart("Shade");
		await expect(configurator.colorName).toContainText("Rose");

		// Switch to Detail - defaults to Oat
		await configurator.selectPart("Detail");
		await expect(configurator.colorName).toContainText("Oat");
	});

	test("color change persists when switching parts and back", async () => {
		// Change body to Navy
		await configurator.selectColor("Navy");
		await expect(configurator.colorName).toContainText("Navy");

		// Switch to Shade
		await configurator.selectPart("Shade");
		await expect(configurator.colorName).toContainText("Rose");

		// Switch back to Body - should still be Navy
		await configurator.selectPart("Body");
		await expect(configurator.colorName).toContainText("Navy");
	});

	test("selected swatch has aria-selected true", async () => {
		await configurator.selectColor("Sage");

		const sageOption = configurator.getColorOption("Sage");
		await expect(sageOption).toHaveAttribute("aria-selected", "true");
	});
});

test.describe("Configurator - Size Selection", () => {
	let configurator: ConfiguratorPage;

	test.beforeEach(async ({ page }) => {
		configurator = new ConfiguratorPage(page);
		await configurator.goto();
		await configurator.waitForLoaded();
	});

	test("shows all three size options", async () => {
		await expect(configurator.size300).toBeVisible();
		await expect(configurator.size500).toBeVisible();
		await expect(configurator.size1000).toBeVisible();
	});

	test("default size is 500mm", async () => {
		await expect(configurator.size500).toHaveAttribute("aria-checked", "true");
	});

	test("selecting 300mm updates product name", async () => {
		await configurator.selectSize("300mm");

		await expect(configurator.size300).toHaveAttribute("aria-checked", "true");
		await expect(configurator.size500).toHaveAttribute("aria-checked", "false");
		await expect(configurator.productName).toContainText("Aura 300mm");
	});

	test("selecting 1000mm updates product name", async () => {
		await configurator.selectSize("1000mm");

		await expect(configurator.size1000).toHaveAttribute("aria-checked", "true");
		await expect(configurator.productName).toContainText("Aura 1000mm");
	});

	test("select button label updates with size", async () => {
		await configurator.selectSize("300mm");
		await expect(configurator.selectButton).toHaveAccessibleName(
			/Add Aura 300mm to cart/,
		);

		await configurator.selectSize("1000mm");
		await expect(configurator.selectButton).toHaveAccessibleName(
			/Add Aura 1000mm to cart/,
		);
	});
});

test.describe("Configurator - Keyboard Navigation", () => {
	let configurator: ConfiguratorPage;

	test.beforeEach(async ({ page }) => {
		configurator = new ConfiguratorPage(page);
		await configurator.goto();
		await configurator.waitForLoaded();
	});

	test("part tabs are keyboard focusable", async ({ page }) => {
		await configurator.bodyTab.focus();
		await expect(configurator.bodyTab).toBeFocused();

		await page.keyboard.press("Tab");
		await expect(configurator.shadeTab).toBeFocused();
	});

	test("color swatches are keyboard accessible", async ({ page }) => {
		const firstOption = configurator.colorSwatchList
			.getByRole("option")
			.first();
		await firstOption.focus();
		await expect(firstOption).toBeFocused();
	});
});

import { type Page, type Locator } from "@playwright/test";

/**
 * Page object for the Aura lamp configurator.
 * Encapsulates all UI overlay interactions (DOM elements over the 3D canvas).
 */
export class ConfiguratorPage {
	readonly page: Page;

	// Brand
	readonly brandHeader: Locator;

	// Loading
	readonly loadingScreen: Locator;
	readonly progressBar: Locator;

	// Product name
	readonly productName: Locator;

	// Part tabs
	readonly partTabList: Locator;
	readonly bodyTab: Locator;
	readonly shadeTab: Locator;
	readonly detailTab: Locator;

	// Color panel
	readonly colorName: Locator;
	readonly colorSwatchList: Locator;

	// Size selector
	readonly sizeGroup: Locator;
	readonly size300: Locator;
	readonly size500: Locator;
	readonly size1000: Locator;

	// Select/cart button
	readonly selectButton: Locator;

	constructor(page: Page) {
		this.page = page;

		this.brandHeader = page.getByText("Configurator");
		this.loadingScreen = page.getByRole("status", {
			name: "Loading 3D configurator",
		});
		this.progressBar = page.getByRole("progressbar");

		this.productName = page.getByRole("heading", { level: 1 });

		this.partTabList = page.getByRole("tablist", { name: "Lamp part" });
		this.bodyTab = page.getByRole("tab", { name: /^Body/ });
		this.shadeTab = page.getByRole("tab", { name: /^Shade/ });
		this.detailTab = page.getByRole("tab", { name: /^Detail/ });

		this.colorName = page.locator('[role="tabpanel"] .font-medium').first();
		this.colorSwatchList = page.getByRole("listbox");

		this.sizeGroup = page.getByRole("radiogroup", { name: "Size" });
		this.size300 = page.getByRole("radio", { name: "300mm" });
		this.size500 = page.getByRole("radio", { name: "500mm" });
		this.size1000 = page.getByRole("radio", { name: "1000mm" });

		this.selectButton = page.getByRole("button", {
			name: /Add Aura .+ to cart/,
		});
	}

	async goto() {
		await this.page.goto("/");
	}

	async waitForLoaded() {
		// Wait for loading screen to disappear (3D scene finished loading)
		await this.loadingScreen.waitFor({ state: "hidden", timeout: 30_000 });
	}

	async selectPart(part: "Body" | "Shade" | "Detail") {
		await this.page.getByRole("tab", { name: new RegExp(`^${part}`) }).click();
	}

	async selectColor(colorLabel: string) {
		const escaped = colorLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		await this.page.getByRole("option", { name: new RegExp(escaped) }).click();
	}

	async selectSize(sizeLabel: string) {
		await this.page.getByRole("radio", { name: sizeLabel }).click();
	}

	getColorOption(colorLabel: string): Locator {
		const escaped = colorLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		return this.page.getByRole("option", { name: new RegExp(escaped) });
	}
}

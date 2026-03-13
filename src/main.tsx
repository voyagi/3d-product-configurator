import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { App } from "./App";
import { useConfiguratorStore } from "./store/configuratorStore";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
if (SENTRY_DSN) {
	Sentry.init({
		dsn: SENTRY_DSN,
		environment: import.meta.env.MODE,
		// Only send errors in production, not during dev
		enabled: import.meta.env.PROD,
	});
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);

// Expose store on window for console-based state testing during development
// Allows: window.__store.getState(), window.__store.setState({ shapeColors: ['blue', 'green'] })
if (import.meta.env.DEV) {
	(window as Window & { __store?: typeof useConfiguratorStore }).__store =
		useConfiguratorStore;
}

/**
 * Lightweight analytics tracker for configurator interactions.
 * Logs events in development, sends to configured endpoint in production.
 *
 * To connect a real provider (PostHog, Mixpanel, Amplitude), replace the
 * `send` function body. The event interface stays the same.
 */

interface AnalyticsEvent {
	name: string;
	properties?: Record<string, string | number | boolean>;
}

const ANALYTICS_ENDPOINT = import.meta.env.VITE_ANALYTICS_ENDPOINT;

function send(event: AnalyticsEvent) {
	if (import.meta.env.DEV) {
		console.debug("[analytics]", event.name, event.properties);
		return;
	}

	if (!ANALYTICS_ENDPOINT) return;

	// Fire-and-forget beacon (non-blocking, survives page unload)
	const payload = JSON.stringify({
		...event,
		timestamp: new Date().toISOString(),
		url: window.location.href,
	});

	if (navigator.sendBeacon) {
		navigator.sendBeacon(ANALYTICS_ENDPOINT, payload);
	}
}

export function trackColorChange(part: string, color: string) {
	send({ name: "color_change", properties: { part, color } });
}

export function trackSizeChange(size: string) {
	send({ name: "size_change", properties: { size } });
}

export function trackAddToCart(size: string, price: number) {
	send({ name: "add_to_cart", properties: { size, price } });
}

export function trackConfiguratorLoaded(durationMs: number) {
	send({
		name: "configurator_loaded",
		properties: { duration_ms: durationMs },
	});
}

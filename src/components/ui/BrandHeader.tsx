/**
 * Top-left brand wordmark. Display serif for brand, sans for label.
 */

export function BrandHeader() {
	return (
		<div className="pointer-events-auto flex items-baseline gap-1.5">
			<span className="font-display text-black text-[15px] leading-none tracking-tight">
				Configurator
			</span>
			<span className="font-sans text-black/55 text-[11px] font-medium leading-none tracking-wider uppercase">
				Studio
			</span>
		</div>
	);
}

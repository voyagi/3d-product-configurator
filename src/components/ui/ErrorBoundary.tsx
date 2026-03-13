import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): State {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("[ErrorBoundary] 3D scene failed to load:", error, info);
		import("@sentry/react").then((Sentry) => {
			Sentry.captureException(error, {
				extra: { componentStack: info.componentStack },
			});
		});
	}

	render() {
		if (this.state.hasError) {
			return (
				this.props.fallback ?? (
					<div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-cream gap-4">
						<p className="text-black/60 text-sm font-sans">
							Unable to load 3D viewer.
						</p>
						<button
							type="button"
							onClick={() => window.location.reload()}
							className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-black/85 transition-colors"
						>
							Refresh page
						</button>
					</div>
				)
			);
		}

		return this.props.children;
	}
}

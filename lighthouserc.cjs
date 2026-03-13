module.exports = {
	ci: {
		collect: {
			startServerCommand: "npx vite preview --port 4173",
			startServerReadyPattern: "Local",
			url: ["http://localhost:4173"],
			numberOfRuns: 1,
		},
		assert: {
			assertions: {
				"categories:performance": ["warn", { minScore: 0.7 }],
				"categories:accessibility": ["error", { minScore: 0.9 }],
				"first-contentful-paint": ["warn", { maxNumericValue: 3000 }],
				"largest-contentful-paint": ["warn", { maxNumericValue: 5000 }],
				"total-byte-weight": ["warn", { maxNumericValue: 1500000 }],
			},
		},
		upload: {
			target: "temporary-public-storage",
		},
	},
};

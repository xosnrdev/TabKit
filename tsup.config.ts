import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm", "cjs"],
	splitting: false,
	sourcemap: true,
	clean: true,
	minify: "terser",
	treeshake: true,
	outDir: "lib",
	shims: true,
	skipNodeModulesBundle: true,
	dts: true,
	external: ["react", "redux-persist", "react-redux", "@reduxjs/toolkit", "react-dom", "immer", "@xosnrdev/tabkit"]
});

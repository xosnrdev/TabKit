import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["cjs", "esm"],
	splitting: false,
	sourcemap: true,
	clean: true,
	minify: "terser",
	treeshake: true,
	outDir: "lib",
	shims: true,
	skipNodeModulesBundle: true,
	dts: true
});

import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["cjs", "esm"],
	splitting: false,
	sourcemap: true,
	clean: true,
	minify: true,
	treeshake: true,
	experimentalDts: true,
	outDir: "lib",
	shims: true,
	skipNodeModulesBundle: true,
});

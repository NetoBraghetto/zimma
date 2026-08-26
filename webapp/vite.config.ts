import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");

	return {
		plugins: [
			tanstackRouter({
				target: "react",
				autoCodeSplitting: true,
			}),
			react(),
			tailwindcss(),
		],
		server: {
			host: true,
			port: parseInt(env.VITE_PORT || "3000", 10),
		},
		esbuild: {
			drop: ["console", "debugger"],
		},
		build: {
			minify: "esbuild",
		},
		resolve: {
			alias: [
				{
					find: "@",
					replacement: path.resolve(import.meta.dirname, "src"),
				},
			],
		},
	};
});

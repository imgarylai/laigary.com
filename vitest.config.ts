import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": src,
      "#": src,
      // `cloudflare:workers` is a Workers-runtime virtual module; stub it so
      // unit tests can import from modules that reference Cloudflare bindings.
      "cloudflare:workers": `${src}/__tests__/stubs/cloudflare-workers.ts`,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});

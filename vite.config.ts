import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    // three.js sozinho passa de 500 kB sem gzip; com gzip, o site inteiro fica em ~180 kB
    chunkSizeWarningLimit: 800,
  },
});

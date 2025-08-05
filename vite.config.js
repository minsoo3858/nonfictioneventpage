import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        sidea: resolve(__dirname, "sidea/index.html"),
        sideb: resolve(__dirname, "sideb/index.html"),
      },
    },
  },
  // 개발 서버 설정 (선택사항)
  server: {
    port: 3000,
    open: true,
  },
});

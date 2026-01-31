import federation from "@originjs/vite-plugin-federation"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
    federation({
      name: "newtab-shell",
      remotes: {
        autocomplete: "http://localhost:5001/assets/remoteEntry.js",
        news: "http://localhost:5002/assets/remoteEntry.js",
      },
      shared: ["react", "react-dom", "lucide-react"],
    }),
  ],
  build: {
    target: "esnext",
    modulePreload: false,
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5173,
    cors: true,
  },
  resolve: {
    dedupe: ["react", "react-dom", "lucide-react"],
  },
})

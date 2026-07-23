import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "TeleICU Field Checklist",
        short_name: "TeleICU",
        description: "TeleICU Field Checklist Application",
        theme_color: "#0f172a",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "icon-192.png",
            sizes: "192x122",
            type: "image/png"
          },
          {
            src: "icon-512.png",
            sizes: "512x326",
            type: "image/png"
          }
        ]
      }
    })
  ]
});
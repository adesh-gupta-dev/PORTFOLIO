import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import {
  injectTagManager,
  stripTagManager,
  resolveTagManagerId,
} from "./src/lib/tag-manager";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const analyticsEnv = loadEnv(mode, process.cwd(), "VITE_GTM_ID");
  const gtmId = resolveTagManagerId(
    process.env.VITE_GTM_ID ?? analyticsEnv.VITE_GTM_ID,
  );
  if (command === "serve") {
    const env = loadEnv(mode, process.cwd(), ["ADMIN_", "GITHUB_"]);
    for (const [key, value] of Object.entries(env))
      if (process.env[key] === undefined) process.env[key] = value;
  }
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      {
        name: "portfolio-google-tag-manager",
        transformIndexHtml(html, context) {
          const page = new URL(
            context.originalUrl || context.path,
            "https://adeshgupta.site",
          );
          if (
            command !== "build" ||
            !["/", "/index.html"].includes(page.pathname) ||
            page.searchParams.has("admin-preview")
          )
            return stripTagManager(html);
          return injectTagManager(html, gtmId);
        },
      },
      {
        name: "portfolio-admin-dev-api",
        configureServer(server) {
          // Local editing persists to the existing data file. This is never
          // enabled by a Vercel Function or by the static production build.
          process.env.PORTFOLIO_LOCAL_EDITOR = "1";
          process.env.PORTFOLIO_LOCAL_CONTENT_FILE = path.resolve(
            server.config.root,
            "src/lib/portfolio.json",
          );
          server.middlewares.use("/api/admin", async (req, res) => {
            try {
              const { adminHandler } = await server.ssrLoadModule(
                "/src/lib/admin-server.ts",
              );
              await adminHandler(req, res);
            } catch {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: "The local admin service is unavailable.",
                }),
              );
            }
          });
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});

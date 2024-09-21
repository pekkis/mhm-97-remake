// vite.config.ts
import { resolve } from "path";
import externals from "file:///Users/pekkis/js/mhm-97-remake/node_modules/.pnpm/rollup-plugin-node-externals@7.1.3_rollup@4.22.4/node_modules/rollup-plugin-node-externals/dist/index.js";
import { defineConfig } from "file:///Users/pekkis/js/mhm-97-remake/node_modules/.pnpm/vite@5.4.7_@types+node@22.5.5/node_modules/vite/dist/node/index.js";
import dts from "file:///Users/pekkis/js/mhm-97-remake/node_modules/.pnpm/vite-plugin-dts@4.2.1_@types+node@22.5.5_rollup@4.22.4_typescript@5.6.2_vite@5.4.7_@types+node@22.5.5_/node_modules/vite-plugin-dts/dist/index.mjs";
import react from "file:///Users/pekkis/js/mhm-97-remake/node_modules/.pnpm/@vitejs+plugin-react@4.3.1_vite@5.4.7_@types+node@22.5.5_/node_modules/@vitejs/plugin-react/dist/index.mjs";
import stylex from "file:///Users/pekkis/js/mhm-97-remake/node_modules/.pnpm/vite-plugin-stylex@0.10.1_@stylexjs+stylex@0.7.5_vite@5.4.7_@types+node@22.5.5_/node_modules/vite-plugin-stylex/dist/main.mjs";
var __vite_injected_original_dirname = "/Users/pekkis/js/mhm-97-remake/packages/ids";
var vite_config_default = defineConfig(({ command }) => {
  return {
    build: {
      lib: {
        entry: { ids: resolve(__vite_injected_original_dirname, "src/index.ts") },
        formats: ["es"]
      }
    },
    plugins: [
      command === "serve" && stylex({
        unstable_moduleResolution: {
          type: "commonJS",
          rootDir: __vite_injected_original_dirname
        }
      }),
      react({
        jsxRuntime: "automatic"
      }),
      dts({ tsconfigPath: "./tsconfig.app.json" }),
      externals({
        deps: true,
        devDeps: false
      })
    ],
    test: {
      globals: true,
      environment: "jsdom",
      reporters: ["verbose", "junit"],
      outputFile: {
        junit: "./junit.xml"
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvcGVra2lzL2pzL21obS05Ny1yZW1ha2UvcGFja2FnZXMvaWRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvcGVra2lzL2pzL21obS05Ny1yZW1ha2UvcGFja2FnZXMvaWRzL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9wZWtraXMvanMvbWhtLTk3LXJlbWFrZS9wYWNrYWdlcy9pZHMvdml0ZS5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5cbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IGV4dGVybmFscyBmcm9tIFwicm9sbHVwLXBsdWdpbi1ub2RlLWV4dGVybmFsc1wiO1xuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcbmltcG9ydCBkdHMgZnJvbSBcInZpdGUtcGx1Z2luLWR0c1wiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IHN0eWxleCBmcm9tIFwidml0ZS1wbHVnaW4tc3R5bGV4XCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgY29tbWFuZCB9KSA9PiB7XG4gIHJldHVybiB7XG4gICAgYnVpbGQ6IHtcbiAgICAgIGxpYjoge1xuICAgICAgICBlbnRyeTogeyBpZHM6IHJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9pbmRleC50c1wiKSB9LFxuICAgICAgICBmb3JtYXRzOiBbXCJlc1wiXSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICBjb21tYW5kID09PSBcInNlcnZlXCIgJiZcbiAgICAgICAgc3R5bGV4KHtcbiAgICAgICAgICB1bnN0YWJsZV9tb2R1bGVSZXNvbHV0aW9uOiB7XG4gICAgICAgICAgICB0eXBlOiBcImNvbW1vbkpTXCIsXG4gICAgICAgICAgICByb290RGlyOiBpbXBvcnQubWV0YS5kaXJuYW1lLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0pLFxuXG4gICAgICByZWFjdCh7XG4gICAgICAgIGpzeFJ1bnRpbWU6IFwiYXV0b21hdGljXCIsXG4gICAgICB9KSxcbiAgICAgIGR0cyh7IHRzY29uZmlnUGF0aDogXCIuL3RzY29uZmlnLmFwcC5qc29uXCIgfSksXG4gICAgICBleHRlcm5hbHMoe1xuICAgICAgICBkZXBzOiB0cnVlLFxuICAgICAgICBkZXZEZXBzOiBmYWxzZSxcbiAgICAgIH0pLFxuICAgIF0sXG4gICAgdGVzdDoge1xuICAgICAgZ2xvYmFsczogdHJ1ZSxcbiAgICAgIGVudmlyb25tZW50OiBcImpzZG9tXCIsXG4gICAgICByZXBvcnRlcnM6IFtcInZlcmJvc2VcIiwgXCJqdW5pdFwiXSxcbiAgICAgIG91dHB1dEZpbGU6IHtcbiAgICAgICAganVuaXQ6IFwiLi9qdW5pdC54bWxcIixcbiAgICAgIH0sXG4gICAgfSxcbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUVBLFNBQVMsZUFBZTtBQUN4QixPQUFPLGVBQWU7QUFDdEIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sV0FBVztBQUNsQixPQUFPLFlBQVk7QUFQbkIsSUFBTSxtQ0FBbUM7QUFVekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxRQUFRLE1BQU07QUFDM0MsU0FBTztBQUFBLElBQ0wsT0FBTztBQUFBLE1BQ0wsS0FBSztBQUFBLFFBQ0gsT0FBTyxFQUFFLEtBQUssUUFBUSxrQ0FBVyxjQUFjLEVBQUU7QUFBQSxRQUNqRCxTQUFTLENBQUMsSUFBSTtBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsWUFBWSxXQUNWLE9BQU87QUFBQSxRQUNMLDJCQUEyQjtBQUFBLFVBQ3pCLE1BQU07QUFBQSxVQUNOLFNBQVM7QUFBQSxRQUNYO0FBQUEsTUFDRixDQUFDO0FBQUEsTUFFSCxNQUFNO0FBQUEsUUFDSixZQUFZO0FBQUEsTUFDZCxDQUFDO0FBQUEsTUFDRCxJQUFJLEVBQUUsY0FBYyxzQkFBc0IsQ0FBQztBQUFBLE1BQzNDLFVBQVU7QUFBQSxRQUNSLE1BQU07QUFBQSxRQUNOLFNBQVM7QUFBQSxNQUNYLENBQUM7QUFBQSxJQUNIO0FBQUEsSUFDQSxNQUFNO0FBQUEsTUFDSixTQUFTO0FBQUEsTUFDVCxhQUFhO0FBQUEsTUFDYixXQUFXLENBQUMsV0FBVyxPQUFPO0FBQUEsTUFDOUIsWUFBWTtBQUFBLFFBQ1YsT0FBTztBQUFBLE1BQ1Q7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==

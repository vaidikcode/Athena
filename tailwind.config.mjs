/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#e2e8f0",
          muted: "#94a3b8",
          subtle: "#64748b",
          faint: "#334155",
        },
        surface: {
          base: "#0a0f1e",
          raised: "#0f172a",
          overlay: "#1e293b",
          border: "#1e293b",
        },
        agent: {
          DEFAULT: "#38bdf8",
          dim: "#0ea5e9",
        },
        status: {
          success: "#4ade80",
          warning: "#fbbf24",
          error: "#f87171",
          running: "#38bdf8",
        },
      },
      borderColor: {
        DEFAULT: "#1e293b",
      },
    },
  },
  plugins: [],
};

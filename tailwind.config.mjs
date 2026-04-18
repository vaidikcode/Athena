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
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      colors: {
        /* Remap athens-* tokens to green palette — all class names kept so
           no component files need touching */
        athens: {
          blue:      "#16a34a",   /* green-600 */
          stone:     "#e2e8f0",   /* slate-200 */
          highlight: "#f0fdf4",   /* green-50  */
        },

        /* New explicit palette for new components */
        brand: {
          DEFAULT: "#16a34a",
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          600: "#16a34a",
          700: "#15803d",
          900: "#14532d",
        },

        ink: {
          DEFAULT: "#0f172a",
          muted:  "#475569",
          subtle: "#64748b",
          faint:  "#94a3b8",
        },

        surface: {
          base:    "#f8fafc",
          raised:  "#ffffff",
          overlay: "#f0fdf4",
          border:  "#e2e8f0",
        },

        agent: {
          DEFAULT: "#16a34a",
          dim:     "#15803d",
        },

        status: {
          success: "#16a34a",
          warning: "#d97706",
          error:   "#dc2626",
          running: "#16a34a",
        },
      },
      borderColor: {
        DEFAULT: "#e2e8f0",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
    },
  },
  plugins: [],
};

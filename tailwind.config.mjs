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
        sans:   ["Nunito", "system-ui", "-apple-system", "sans-serif"],
        nunito: ["Nunito", "sans-serif"],
        mono:   ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      colors: {
        /* Neo-brutalist palette (avatar-ai) */
        nb: {
          blue:   "#4D96FF",
          yellow: "#FFD93D",
          coral:  "#FF6B6B",
          green:  "#6BCB77",
          purple: "#A29BFE",
          orange: "#FF9F43",
          cream:  "#FFFBF0",
          black:  "#000000",
          white:  "#FFFFFF",
        },

        /* Legacy aliases so all existing athens-* classes still work */
        athens: {
          blue:      "#4D96FF",
          stone:     "#000000",
          highlight: "#FFF9E6",
        },

        brand: {
          DEFAULT: "#4D96FF",
          50:  "#EEF5FF",
          100: "#D4E8FF",
          200: "#A9D0FF",
          400: "#80B8FF",
          500: "#4D96FF",
          600: "#4D96FF",
          700: "#2a7ae8",
          800: "#1a5fc4",
          900: "#0d3d8a",
        },

        ink: {
          DEFAULT: "#000000",
          muted:   "#333333",
          subtle:  "#555555",
          faint:   "#888888",
        },

        surface: {
          base:    "#FFFBF0",
          raised:  "#FFFFFF",
          overlay: "#FFF9E6",
          border:  "#000000",
        },

        agent: {
          DEFAULT: "#4D96FF",
          dim:     "#2a7ae8",
        },

        status: {
          success: "#6BCB77",
          warning: "#FFD93D",
          error:   "#FF6B6B",
          running: "#4D96FF",
        },
      },
      borderColor: {
        DEFAULT: "#000000",
      },
      boxShadow: {
        "nb-sm": "2px 2px 0px 0px #000",
        "nb":    "4px 4px 0px 0px #000",
        "nb-md": "6px 6px 0px 0px #000",
        "nb-lg": "8px 8px 0px 0px #000",
        "nb-xl": "12px 12px 0px 0px #000",
      },
      animation: {
        "pulse-slow": "pulse-slow 3s cubic-bezier(0.4,0,0.6,1) infinite",
      },
      keyframes: {
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
    },
  },
  plugins: [],
};

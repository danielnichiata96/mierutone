/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          black: "#2A2A2A",
          coral: "#FF99A0",
          cornflower: "#82A8E5",
          mint: "#99E6C9",
          sunflower: "#FFC850",
        },
        paper: {
          white: "#F9F8F2",
          off: "#EFEFE5",
        },
        // SAE semantic color mappings
        primary: {
          300: "#DAE6F5",
          500: "#82A8E5",
        },
        secondary: {
          300: "#E0F5EB",
          500: "#99E6C9",
        },
        accent: {
          300: "#FFE0E2",
          500: "#FF99A0",
        },
        energy: {
          300: "#FFF0CC",
          500: "#FFC850",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Zen Kaku Gothic New", "sans-serif"],
        display: ["JetBrains Mono", "monospace"],
        logo: ["Clash Display", "sans-serif"],
      },
      boxShadow: {
        riso: "4px 4px 0 rgba(130, 168, 229, 0.5)",
        "riso-hover": "6px 6px 0 rgba(130, 168, 229, 0.8)",
        "riso-sm": "2px 2px 0 rgba(42, 42, 42, 0.1)",
        "riso-coral": "4px 4px 0 rgba(255, 153, 160, 0.5)",
        "riso-coral-hover": "6px 6px 0 rgba(255, 153, 160, 0.8)",
        "riso-mint": "4px 4px 0 rgba(153, 230, 201, 0.5)",
        "riso-mint-hover": "6px 6px 0 rgba(153, 230, 201, 0.8)",
        "riso-energy": "4px 4px 0 rgba(255, 200, 80, 0.5)",
        "riso-energy-hover": "6px 6px 0 rgba(255, 200, 80, 0.8)",
      },
      borderRadius: {
        riso: "12px",
        "riso-lg": "20px",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Support for opacity: bg-background/50
        background: "rgb(var(--background-rgb) / <alpha-value>)",
        foreground: "rgb(var(--foreground-rgb) / <alpha-value>)",
        brandGreen: "rgb(var(--brandGreen-rgb) / <alpha-value>)",
        textGreen: "#9DE16A",
        accentGreen: "#9CE067",       
        strokeGreen: "#9DE16A",    
      },
      fontFamily: {
        // Matches the CSS variable names exactly
        league: ["var(--font-league)", "sans-serif"],
        sonsie: ["var(--font-sonsie)", "cursive"],
        poppins: ["var(--font-poppins)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        archivoBlack: ["var(--font-archivoBlack)", "sans-serif"],
        leagueGothic: ["var(--font-leagueGothic)", "sans-serif"],
        pattaya: ["var(--font-pattaya)", "sans-serif"],
        manrope: ["var(--font-manrope)", "sans-serif"],
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        '.text-stroke': {
          '-webkit-text-stroke-width': '1px',
          '-webkit-text-stroke-color': 'currentColor',
          '-webkit-text-fill-color': 'transparent',
        },
        '.text-stroke-md': {
          '-webkit-text-stroke-width': '2px',
          '-webkit-text-stroke-color': 'currentColor',
          '-webkit-text-fill-color': 'transparent',
        },
        '.text-stroke-lg': {
          '-webkit-text-stroke-width': '4px',
          '-webkit-text-stroke-color': 'currentColor',
          '-webkit-text-fill-color': 'transparent',
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    }
  ],
};
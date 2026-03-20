/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // The project sources live under `src/` so include those paths.
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    // Keep top-level app/components patterns in case files are moved.
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Use CSS variables so light/dark theme can switch at runtime.
        // Also supports Tailwind opacity variants like `bg-brandGreen/10`.
        brandGreen: "rgb(var(--brandGreen-rgb) / <alpha-value>)",
        textGreen: "#9DE16A",
        accentGreen: "#9CE067",       
        strokeGreen: "#9DE16A",    
      },
      fontFamily: {
        league: ["var(--font-league)", "sans-serif"],
        sonsie: ["var(--font-sonsie)", "cursive"],
        poppins: ["var(--font-poppins)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        archivo: ["var(--font-archivo)", "sans-serif"],
        leagueGothic: ["var(--font-league-gothic)", "sans-serif"],
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
          /* Make the fill transparent without changing `color` so
             `currentColor` remains the visible stroke color. */
          '-webkit-text-fill-color': 'transparent',
          '-moz-text-fill-color': 'transparent',
        },
        '.text-stroke-md': {
          '-webkit-text-stroke-width': '3px',
          '-webkit-text-stroke-color': 'currentColor',
          '-webkit-text-fill-color': 'transparent',
          '-moz-text-fill-color': 'transparent',
        },
        '.text-stroke-lg': {
          '-webkit-text-stroke-width': '4px',
          '-webkit-text-stroke-color': 'currentColor',
          '-webkit-text-fill-color': 'transparent',
          '-moz-text-fill-color': 'transparent',
        },
      }
      addUtilities(newUtilities, ['responsive', 'hover'])
    }
  ],
};
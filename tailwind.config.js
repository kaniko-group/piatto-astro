module.exports = {
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte,mdx,md}",
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'), // This line enables the Typography plugin
  ],
}

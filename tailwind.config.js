/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {},
    },
    safelist: [
        {
            pattern: /^(bg|text|border|border-t|border-b|border-l|border-r|ring)-(orange|green|blue|emerald|amber|indigo|violet|teal|fuchsia|rose|sky|yellow|cyan|stone|gray|slate)-(50|100|200|300|400|500|600|700|800|900)$/,
            variants: ['hover', 'focus', 'active'],
        },
    ],
    plugins: [],
}

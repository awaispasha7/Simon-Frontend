import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: "class",
    content: [
        './src/app/**/*.{ts,tsx}',
        './src/components/**/*.{ts,tsx}',
        './src/lib/**/*.{ts,tsx}'
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#645bb2',
                    50: '#f0effa', 100: '#e6e4f7', 200: '#c9c4ee', 300: '#aca3e5',
                    400: '#8f83dc', 500: '#7262d3', 600: '#645bb2', 700: '#4e4790',
                    800: '#3a356c', 900: '#27244a'
                }
            },
            boxShadow: {
                soft: '0 10px 30px rgba(0,0,0,0.05)'
            }
        }
    },
    plugins: [require('tailwindcss-animate')]
}

export default config
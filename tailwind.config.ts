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
                    DEFAULT: '#ef4444', // Vibrant red for energy
                    50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
                    400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
                    800: '#991b1b', 900: '#7f1d1d'
                },
                fitness: {
                    orange: '#f97316', // Vibrant orange for power
                    red: '#ef4444', // Energy red
                    green: '#22c55e', // Fresh green for health
                    blue: '#3b82f6', // Calming blue for stability
                    dark: '#1f2937', // Strong dark neutral
                    light: '#f9fafb' // Clean light neutral
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
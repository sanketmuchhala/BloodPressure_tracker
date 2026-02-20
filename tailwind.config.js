/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        'primary-dark': '#1F2937',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        text: '#111827',
        'text-secondary': '#6B7280',
        border: '#E5E7EB',
        success: '#10B981',
        error: '#EF4444',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
}

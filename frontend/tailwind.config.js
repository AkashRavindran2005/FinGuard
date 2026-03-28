/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8f8fb', // Soft light background
        card: '#ffffff',       // Pure white cards
        'card-dark': '#1c1b2f', // Navy blue cards from design
        'card-violet': '#dbd8f0', // Soft violet card
        border: 'rgba(0, 0, 0, 0.06)',
        primary: '#1c1b2f',    // Deep navy (primary text & buttons)
        'primary-hover': '#141423',
        accent: '#6b5ce7',     // Purple elements
        'accent-light': '#a29bfe',
        success: '#00b894',    // Emerald updated
        warning: '#fdcb6e',    // Amber
        danger: '#ff7675',     // Rose updated
        info: '#74b9ff',       // Sky updated
        muted: '#636e72',      // Darker grey for text
        'muted-light': '#b2bec3', 
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 10px 30px -5px rgba(28, 27, 47, 0.05)',
        'card-hover': '0 20px 40px -10px rgba(28, 27, 47, 0.1)',
        'glow': '0 0 20px rgba(107, 92, 231, 0.15)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '3rem',
      }
    },
  },
  plugins: [],
}

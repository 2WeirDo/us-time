/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hello Kitty pink palette
        pink: {
          DEFAULT: '#FF69B4',   // Hot pink — primary
          light: '#FFB6C1',    // Light pink — backgrounds
          dark: '#FF1493',     // Deep pink — hover/active
          soft: '#FFE4EC',     // Misty rose — super soft bg
        },
        red: {
          DEFAULT: '#E81A3F',  // Hello Kitty bow red
          light: '#FF6B81',
        },
        white: {
          DEFAULT: '#FFFFFF',
          snow: '#FFFAFA',
        },
        warm: {
          cream: '#FFF5F7',    // Pink-tinted cream bg
        },
        dark: {
          bg: '#2D1B2E',       // Dark plum bg
          card: '#3D2B3E',     // Dark card
          text: '#F5E6F0',     // Light pinkish text for dark mode
        },
        text: {
          primary: '#3D2040',  // Dark plum for text
          muted: '#C495A8',    // Muted pink for secondary text
        },
      },
      fontFamily: {
        display: ['Quicksand', 'Comic Sans MS', 'sans-serif'],
        body: ['Inter', 'PingFang SC', 'Microsoft YaHei', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'soft': '0 2px 16px rgba(255, 105, 180, 0.08)',
        'card': '0 4px 24px rgba(255, 105, 180, 0.12)',
        'lift': '0 8px 36px rgba(255, 105, 180, 0.16)',
        'pink': '0 4px 20px rgba(255, 105, 180, 0.25)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'wiggle': 'wiggle 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-3deg)' },
          '75%': { transform: 'rotate(3deg)' },
        },
      },
    },
  },
  plugins: [],
}

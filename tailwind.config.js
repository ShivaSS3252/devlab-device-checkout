/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [
    function({ addUtilities, addComponents }) {
      // Add base styles
      addUtilities({
        '.scroll-smooth': {
          'scroll-behavior': 'smooth',
        },
      });

      // Add component classes
      addComponents({
        '.btn': {
          '@apply px-4 py-2 rounded-md font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2': {},
        },
        '.btn-primary': {
          '@apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': {},
        },
        '.btn-secondary': {
          '@apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500': {},
        },
        '.btn-danger': {
          '@apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': {},
        },
        '.card': {
          '@apply bg-white rounded-lg shadow-sm border border-gray-200 p-6': {},
        },
        '.input': {
          '@apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent': {},
        },
        '.label': {
          '@apply block text-sm font-medium text-gray-700 mb-1': {},
        },
      });

      // Add utility classes
      addUtilities({
        '.text-balance': {
          'text-wrap': 'balance',
        },
      });
    },
  ],
}

import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {}
  },
  corePlugins: {
    preflight: false
  },
  plugins: [daisyui],
  daisyui: {
    themes: ['light', 'dark']
  }
}

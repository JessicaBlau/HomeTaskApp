import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // The app uses its own CSS custom-property design system (globals.css),
  // not Tailwind utilities. This config satisfies the PostCSS pipeline
  // without generating conflicting styles.
  theme: {
    extend: {},
  },
  plugins: [],
}

export default config

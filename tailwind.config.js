/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
 safelist: [
  // Specific background colors actually used in the codebase
  {
    pattern: /^bg-(red|green|blue|yellow|orange|gray|slate|purple|violet)-(50|100|200|300|400|500|600|700|800|900)$/,
    variants: ['hover', 'focus', 'active', 'dark'],
  },
  // Specific text colors actually used
  {
    pattern: /^text-(red|green|blue|yellow|orange|gray|slate|white|purple|violet)-(50|100|200|300|400|500|600|700|800|900)$/,
    variants: ['hover', 'focus', 'active', 'dark'],
  },
  // Specific border colors actually used
  {
    pattern: /^border-(red|green|blue|yellow|orange|gray|slate)-(50|100|200|300|400|500|600|700|800|900)$/,
    variants: ['hover', 'focus', 'active', 'dark'],
  },
  // Opacity variants for backgrounds
  {
    pattern: /^bg-(red|green|blue|yellow|orange|gray|slate)-(500|400)\/\d{1,2}$/,
  },
  // Essential animations
  'animate-pulse',
  'animate-spin',
  'animate-bounce',
  'animate-meteor-effect',
  // Essential transitions
  'transition-all',
  'transition-colors',
  'duration-300',
  'duration-200',
  'ease-in-out',
  // Common utility classes found in codebase
  'sr-only',
  'focus:not-sr-only',
  'line-through',
  'font-mono',
  'will-change-transform',
  'filter-none'
],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      animation: {
        "meteor-effect": "meteor 5s linear infinite",
      },
      keyframes: {
        meteor: {
          "0%": { transform: "rotate(215deg) translateX(0)", opacity: "1" },
          "70%": { opacity: "1" },
          "100%": {
            transform: "rotate(215deg) translateX(-500px)",
            opacity: "0",
          },
        },
      },
    },
  },
  plugins: [],
}
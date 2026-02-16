import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ✅ shadcn/ui token colors
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",

        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },

        // ═══════════════════════════════════════════════
        //  LOGO-BASED BRAND PALETTE
        // ═══════════════════════════════════════════════

        // 🟢 LIME — Logo "MENTORLUK" rengi — Ana CTA / vurgu
        lime: {
          50:  "#F7FBE8",
          100: "#EEF7C8",
          200: "#DDEF9C",
          300: "#C5E266",
          400: "#AECC42",
          500: "#94B835",
          600: "#7A9A22",
          700: "#5E7A1A",
          800: "#4A6115",
          900: "#3D5112",
        },

        // 🔵 NAVY — Logo "DEĞİŞİM" rengi — Metin / Başlık
        navy: {
          50:  "#F0F3F5",
          100: "#D8DFE5",
          200: "#B0BFCA",
          300: "#7A8FA0",
          400: "#516678",
          500: "#3A4F5E",
          600: "#2B3544",
          700: "#222B38",
          800: "#1A2230",
          900: "#111827",
        },

        // 🩵 TEAL — Logo "D" ikonu rengi — İkincil aksanlar
        teal: {
          50:  "#EFFCF8",
          100: "#D0F5EB",
          200: "#A3E8D6",
          300: "#6DD4BC",
          400: "#4A8C8C",
          500: "#3D7A7A",
          600: "#306666",
          700: "#265252",
          800: "#1D3F3F",
          900: "#142D2D",
        },

        // 🌿 SAGE — Logo ikon geçiş tonu
        sage: {
          400: "#6B9F82",
          500: "#5A8A6F",
          600: "#4A755E",
        },

        // ── BACKWARD COMPAT (primary/accent CSS vars for shadcn) ──
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          50:  "#F7FBE8",
          100: "#EEF7C8",
          200: "#DDEF9C",
          300: "#C5E266",
          400: "#AECC42",
          500: "#94B835",
          600: "#7A9A22",
          700: "#5E7A1A",
          800: "#4A6115",
          900: "#3D5112",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          50:  "#EFFCF8",
          100: "#D0F5EB",
          200: "#A3E8D6",
          300: "#6DD4BC",
          400: "#4A8C8C",
          500: "#3D7A7A",
          600: "#306666",
          700: "#265252",
          800: "#1D3F3F",
          900: "#142D2D",
        },

        cyan: {
          50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9",
          400: "#22d3ee", 500: "#06B6D4", 600: "#0891b2", 700: "#0e7490",
          800: "#155e75", 900: "#164e63",
        },
      },

      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },

      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        heading: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },

      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "scale(0.8)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "pulse-dot": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.4)", opacity: "0.7" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "slide-in-right": "slide-in-right 0.25s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "float": "float 3s ease-in-out infinite",
        "count-up": "count-up 0.5s ease-out forwards",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // ── MD3 Color System ────────────────────────────────────────────────────
      colors: {
        // Primary — Google Blue
        primary:            '#0b57d0',
        'on-primary':       '#ffffff',
        'primary-container': '#d3e3fd',
        'on-primary-container': '#041e49',
        'primary-dark':     '#0842a0',

        // Secondary — Teal
        secondary:          '#006a6a',
        'on-secondary':     '#ffffff',
        'secondary-container': '#9cf0f0',
        'on-secondary-container': '#002020',

        // Tertiary
        tertiary:           '#6b5778',
        'tertiary-container': '#f2daff',

        // Error
        error:              '#b3261e',
        'on-error':         '#ffffff',
        'error-container':  '#f9dedc',
        'on-error-container': '#410e0b',

        // Surface hierarchy (MD3)
        'surface-dim':      '#d9dbe0',
        surface:            '#f8fafd',
        'surface-bright':   '#f8fafd',
        'surface-container-lowest': '#ffffff',
        'surface-container-low':    '#f3f5f9',
        'surface-container':        '#edf0f4',
        'surface-container-high':   '#e7eaf0',
        'surface-container-highest':'#e1e4eb',

        // On-surface
        'on-surface':       '#1a1c23',
        'on-surface-variant': '#44464f',

        // Outline
        outline:            '#74777f',
        'outline-variant':  '#c4c6d0',

        // Semantic aliases (backward compat)
        background:         '#f8fafd',
        'surface-variant':  '#e4e2ec',
        border:             '#c4c6d0',
        textMain:           '#1a1c23',
        textMuted:          '#44464f',
        primaryContainer:   '#d3e3fd',
        surfaceContainer:   '#edf0f4',

        // Status colors
        success:            '#1e7e34',
        'success-container':'#c8f5d3',
        warning:            '#b45309',
        'warning-container':'#fef3c7',
        info:               '#2563eb',
        'info-container':   '#dbeafe',
        danger:             '#b3261e',
        dangerBg:           '#f9dedc',
        warningBg:          '#fef3c7',
        successBg:          '#c8f5d3',
        infoBg:             '#dbeafe',
        oem:                '#b45309',
        oemBg:              '#fef3c7',
        chipBg:             '#e4e2ec',
      },

      // ── MD3 Typography Scale ────────────────────────────────────────────────
      fontSize: {
        'display-lg':  ['57px', { lineHeight: '64px', letterSpacing: '-0.25px' }],
        'display-md':  ['45px', { lineHeight: '52px', letterSpacing: '0' }],
        'display-sm':  ['36px', { lineHeight: '44px', letterSpacing: '0' }],
        'headline-lg': ['32px', { lineHeight: '40px', letterSpacing: '0' }],
        'headline-md': ['28px', { lineHeight: '36px', letterSpacing: '0' }],
        'headline-sm': ['24px', { lineHeight: '32px', letterSpacing: '0' }],
        'title-lg':    ['22px', { lineHeight: '28px', letterSpacing: '0' }],
        'title-md':    ['16px', { lineHeight: '24px', letterSpacing: '0.15px' }],
        'title-sm':    ['14px', { lineHeight: '20px', letterSpacing: '0.1px' }],
        'body-lg':     ['16px', { lineHeight: '24px', letterSpacing: '0.5px' }],
        'body-md':     ['14px', { lineHeight: '20px', letterSpacing: '0.25px' }],
        'body-sm':     ['12px', { lineHeight: '16px', letterSpacing: '0.4px' }],
        'body-xs':     ['11px', { lineHeight: '16px', letterSpacing: '0.4px' }],
        'label-lg':    ['14px', { lineHeight: '20px', letterSpacing: '0.1px', fontWeight: '500' }],
        'label-md':    ['12px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
        'label-sm':    ['11px', { lineHeight: '16px', letterSpacing: '0.5px', fontWeight: '500' }],
      },

      // ── MD3 Elevation shadows ───────────────────────────────────────────────
      boxShadow: {
        'elevation-1': '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)',
        'elevation-2': '0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)',
        'elevation-3': '0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.3)',
        'elevation-4': '0px 6px 10px 4px rgba(0,0,0,0.15), 0px 2px 3px rgba(0,0,0,0.3)',
        // Legacy aliases
        soft:     '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.08)',
        card:     '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.07)',
        md3:      '0px 2px 6px 2px rgba(0,0,0,0.12), 0px 1px 2px rgba(0,0,0,0.20)',
        elevated: '0px 8px 16px rgba(0,0,0,0.12)',
      },

      // ── MD3 Shape scale ─────────────────────────────────────────────────────
      borderRadius: {
        none:   '0',
        xs:     '4px',
        sm:     '8px',
        md:     '12px',
        lg:     '16px',
        xl:     '20px',
        '2xl':  '24px',
        '3xl':  '28px',
        full:   '9999px',
        // Legacy
        md3:    '10px',
        'md3-lg': '14px',
        'md3-xl': '18px',
      },

      fontFamily: {
        sans: ['"Google Sans"', '"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

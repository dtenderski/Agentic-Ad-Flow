/**
 * AdClaw AI – dark fintech palette.
 * Derived from the brand concept: aggressive orange "claws" on deep dark backgrounds.
 * Both keys use the dark palette (app forces dark mode via app.json).
 */

const colors = {
  light: {
    // Legacy alias
    text: '#F0F0FF',
    tint: '#F97316',

    // Core surfaces
    background: '#0D0D18',
    foreground: '#F0F0FF',

    // Cards / elevated surfaces
    card: '#13131F',
    cardForeground: '#F0F0FF',

    // Primary – energetic orange
    primary: '#F97316',
    primaryForeground: '#FFFFFF',

    // Secondary – dark muted surface
    secondary: '#1E1E2E',
    secondaryForeground: '#C0C0E0',

    // Muted / subdued
    muted: '#1A1A28',
    mutedForeground: '#7878A0',

    // Accent – same orange family
    accent: '#FB923C',
    accentForeground: '#FFFFFF',

    // Destructive
    destructive: '#EF4444',
    destructiveForeground: '#FFFFFF',

    // Borders & inputs
    border: '#252538',
    input: '#252538',
  },

  // Border radius in px — matches web --radius: 0.5rem (8px), bumped to 10 for mobile
  radius: 10,
};

export default colors;

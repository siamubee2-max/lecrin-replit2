/** @type {const} */
const themeColors = {
  // Couleur d'accent principale — or champagne luxe
  primary:    { light: '#B8975A', dark: '#C9A96E' },
  // Fond principal — noir profond (dark) / crème ivoire (light)
  background: { light: '#FAF8F4', dark: '#0A0A0A' },
  // Surfaces élevées — blanc cassé (light) / noir charbon (dark)
  surface:    { light: '#F2EDE4', dark: '#141414' },
  // Texte principal — noir absolu (light) / crème (dark)
  foreground: { light: '#0A0A0A', dark: '#F5F0E8' },
  // Texte secondaire — gris foncé (light) / gris clair (dark)
  muted:      { light: '#6B6560', dark: '#9A9490' },
  // Bordures fines — sable (light) / anthracite (dark)
  border:     { light: '#D9D0C3', dark: '#2A2A2A' },
  // Or pour les accents décoratifs
  gold:       { light: '#B8975A', dark: '#C9A96E' },
  // États sémantiques
  success:    { light: '#4A7C59', dark: '#6AAF7A' },
  warning:    { light: '#B8975A', dark: '#C9A96E' },
  error:      { light: '#8B3A3A', dark: '#C97070' },
};

module.exports = { themeColors };

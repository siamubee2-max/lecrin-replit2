/** @type {const} */
const themeColors = {
  // Couleur d'accent — or chaud, nuance miel-cognac
  primary:    { light: '#B8935A', dark: '#D4A96A' },
  // Fond principal — noir espresso chaud (dark) / parchemin crème (light)
  background: { light: '#FBF7F0', dark: '#0C0906' },
  // Surfaces élevées — ivoire ambré (light) / brun charbon (dark)
  surface:    { light: '#F3EBDf', dark: '#161009' },
  // Texte principal — brun foncé (light) / crème ivoire (dark)
  foreground: { light: '#1A1208', dark: '#F5EDDE' },
  // Texte secondaire — brun moyen (light) / sable chaud (dark)
  muted:      { light: '#7A6E5F', dark: '#A0907A' },
  // Bordures — sable doré (light) / brun anthracite chaud (dark)
  border:     { light: '#DDD0B8', dark: '#2C2018' },
  // Or pour les accents décoratifs
  gold:       { light: '#B8935A', dark: '#D4A96A' },
  // États sémantiques
  success:    { light: '#4A7C59', dark: '#6AAF7A' },
  warning:    { light: '#B8935A', dark: '#D4A96A' },
  error:      { light: '#8B3A3A', dark: '#C97070' },
};

module.exports = { themeColors };

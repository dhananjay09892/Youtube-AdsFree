// Color palette for the YouTube AppView mobile app.
// All UI must reference these tokens — never hardcode hex values.

export const colors = {
  background: {
    primary: '#0f0f0f',
    secondary: '#1a1a1a',
    tertiary: '#272727',
    overlay: '#000000CC',
  },
  text: {
    primary: '#ffffff',
    secondary: '#aaaaaa',
    tertiary: '#717171',
    inverse: '#0f0f0f',
  },
  accent: {
    red: '#ff0000',
    redHover: '#cc0000',
    blue: '#3ea6ff',
    white: '#ffffff',
  },
  border: {
    subtle: '#272727',
    medium: '#3f3f3f',
  },
  status: {
    success: '#2ba640',
    error: '#cc0000',
    warning: '#ff9500',
    loading: '#3ea6ff',
  },
  player: {
    controlsBg: '#000000AA',
    seekBarFilled: '#ff0000',
    seekBarEmpty: '#717171',
    thumbColor: '#ffffff',
  },
} as const;

export type Colors = typeof colors;

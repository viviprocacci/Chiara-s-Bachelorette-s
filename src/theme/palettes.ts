export interface DayPalette {
  key: string
  name: string
  bg: string
  bgSecondary: string
  accent: string
  accentLight: string
  text: string
  textMuted: string
  gradient: string
}

export const palettes: Record<string, DayPalette> = {
  prosecco_pink: {
    key: 'prosecco_pink',
    name: 'Prosecco & Pink',
    bg: '#FDF6F4',
    bgSecondary: '#FCE8E4',
    accent: '#E8A0BF',
    accentLight: '#F5D0CB',
    text: '#3D2C2A',
    textMuted: '#8B706C',
    gradient: 'linear-gradient(135deg, #FDF6F4 0%, #FCE8E4 50%, #F5D0CB 100%)',
  },
  mamma_mia_blue: {
    key: 'mamma_mia_blue',
    name: 'Mamma Mia Blue',
    bg: '#F0FAFC',
    bgSecondary: '#D4F1F9',
    accent: '#3BA4BC',
    accentLight: '#A8E0EE',
    text: '#1A3A42',
    textMuted: '#5A8A96',
    gradient: 'linear-gradient(135deg, #F0FAFC 0%, #D4F1F9 50%, #A8E0EE 100%)',
  },
  aperol_sunset: {
    key: 'aperol_sunset',
    name: 'Aperol Sunset',
    bg: '#FFF8F2',
    bgSecondary: '#FFE4CC',
    accent: '#E8652B',
    accentLight: '#F5C99A',
    text: '#3D2818',
    textMuted: '#8B6040',
    gradient: 'linear-gradient(135deg, #FFF8F2 0%, #FFE4CC 50%, #F5C99A 100%)',
  },
  club_night: {
    key: 'club_night',
    name: 'Club Night',
    bg: '#F0F0F8',
    bgSecondary: '#D8D8F0',
    accent: '#6B5B95',
    accentLight: '#B8A9D4',
    text: '#1E1830',
    textMuted: '#6B6080',
    gradient: 'linear-gradient(135deg, #F0F0F8 0%, #D8D8F0 50%, #B8A9D4 100%)',
  },
  default: {
    key: 'default',
    name: 'Mamma Mia',
    bg: '#FDF6F4',
    bgSecondary: '#EAF0F5',
    accent: '#E8A0BF',
    accentLight: '#D4C4B0',
    text: '#2D3436',
    textMuted: '#636E72',
    gradient: 'linear-gradient(135deg, #FDF6F4 0%, #EAF0F5 50%, #F5D0CB 100%)',
  },
}

export const eventTypeAccents: Record<string, string> = {
  brunch: '#E8652B',
  boat: '#3BA4BC',
  dinner: '#E8A0BF',
  club: '#6B5B95',
  spa: '#8B9A7B',
  pilates: '#7B9ACC',
  other: '#D4AF37',
}

export function getPalette(key: string): DayPalette {
  return palettes[key] ?? palettes.default
}

export function applyPalette(palette: DayPalette) {
  const root = document.documentElement
  root.style.setProperty('--palette-bg', palette.bg)
  root.style.setProperty('--palette-bg-secondary', palette.bgSecondary)
  root.style.setProperty('--palette-accent', palette.accent)
  root.style.setProperty('--palette-accent-light', palette.accentLight)
  root.style.setProperty('--palette-text', palette.text)
  root.style.setProperty('--palette-text-muted', palette.textMuted)
  root.style.setProperty('--palette-gradient', palette.gradient)
}

export const AVATAR_COLORS = [
  '#E8A0BF',
  '#3BA4BC',
  '#D4AF37',
  '#6B5B95',
  '#E8652B',
  '#7B9ACC',
  '#C9956B',
  '#F5C6D0',
  '#A8E0EE',
  '#A8829A',
  '#82A882',
  '#829AA8',
]

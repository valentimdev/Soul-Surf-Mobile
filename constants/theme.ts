/**
 * Soul Surf - Paleta de Cores
 * 
 * Tema Claro:
 * - Fundo (Areia): #FAF5E8
 * - Primária (Azul Oceano): #5D9AB6
 * - Texto (Azul Profundo): #2A4B7C
 * 
 * Tema Escuro:
 * - Fundo (Azul Profundo): #2A4B7C
 * - Primária (Azul Oceano): #5D9AB6
 * - Texto (Areia): #FAF5E8
 */

import { Platform } from 'react-native';

const tintColorLight = '#5D9AB6'; // Azul Oceano
const tintColorDark = '#5D9AB6';  // Azul Oceano

export const Colors = {
  light: {
    text: '#2A4B7C',           // Azul Profundo
    background: '#FAF5E8',     // Areia
    tint: tintColorLight,      // Azul Oceano
    icon: '#5D9AB6',           // Azul Oceano
    tabIconDefault: '#2A4B7C', // Azul Profundo
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FAF5E8',           // Areia
    background: '#2A4B7C',     // Azul Profundo
    tint: tintColorDark,       // Azul Oceano
    icon: '#5D9AB6',           // Azul Oceano
    tabIconDefault: '#FAF5E8', // Areia
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

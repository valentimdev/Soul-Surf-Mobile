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

export const SOUL_SURF_MAP_STYLE = {
  version: 8,
  sources: {
    "openfreemap": {
      type: "vector",
      url: "https://tiles.openfreemap.org/planet"
    }
  },
  layers: [
    // Fundo geral → Areia
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#FAF5E8" }
    },
    // Oceano/água → Azul Oceano
    {
      id: "water",
      type: "fill",
      source: "openfreemap",
      "source-layer": "water",
      paint: { "fill-color": "#5D9AB6" }
    },
    // Terra → Areia clara
    {
      id: "landcover",
      type: "fill",
      source: "openfreemap",
      "source-layer": "landcover",
      paint: { "fill-color": "#F0E8D0" }
    },
    // Estradas → Azul Profundo suave
    {
      id: "roads",
      type: "line",
      source: "openfreemap",
      "source-layer": "transportation",
      paint: {
        "line-color": "#2A4B7C",
        "line-opacity": 0.3,
        "line-width": 1
      }
    }
  ]
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

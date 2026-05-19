import type { ImageResizeMode, ImageSourcePropType, ImageStyle, StyleProp } from 'react-native';

export const DEFAULT_AVATAR_SOURCE = require('../assets/images/soul_icon.png');

export function getUserAvatarSource(uri?: string | null): ImageSourcePropType {
  return uri ? { uri } : DEFAULT_AVATAR_SOURCE;
}

export function getUserAvatarResizeMode(uri?: string | null): ImageResizeMode {
  return uri ? 'cover' : 'contain';
}

export function getUserAvatarZoomStyle(uri?: string | null): StyleProp<ImageStyle> {
  return uri ? null : { transform: [{ translateX: -8 }, { scale: 0.72 }] };
}

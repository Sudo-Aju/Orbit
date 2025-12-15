

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#ffffff',
    background: '#000000',
    tint: '#3742fa',
    icon: '#808e9b',
    tabIconDefault: '#485460',
    tabIconSelected: '#3742fa',
    
    card: '#0a0a0a',
    border: '#1a1a1a',
    primary: '#3742fa',
    success: '#0be881',
    warning: '#ffa502',
    danger: '#ff4757',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    tint: '#0be881',
    icon: '#808e9b',
    tabIconDefault: '#485460',
    tabIconSelected: '#0be881',
    
    card: '#0a0a0a',
    border: '#1a1a1a',
    primary: '#3742fa',
    success: '#0be881',
    warning: '#ffa502',
    danger: '#ff4757',
  },
};

export const Fonts = Platform.select({
  ios: {
    
    sans: 'system-ui',
    
    serif: 'ui-serif',
    
    rounded: 'ui-rounded',
    
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

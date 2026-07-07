import { useWindowDimensions } from 'react-native';
import { layout } from '@/theme';

export type DeviceClass = 'phone' | 'tablet' | 'large';

export interface Responsive {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
  deviceClass: DeviceClass;
  isTablet: boolean;
  /** Content width capped for tablets/web so layouts stay elegant. */
  contentWidth: number;
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const deviceClass: DeviceClass =
    width >= layout.largeBreakpoint
      ? 'large'
      : width >= layout.tabletBreakpoint
        ? 'tablet'
        : 'phone';

  return {
    width,
    height,
    isLandscape,
    isPortrait: !isLandscape,
    deviceClass,
    isTablet: deviceClass !== 'phone',
    contentWidth: Math.min(width, layout.maxContentWidth),
  };
}

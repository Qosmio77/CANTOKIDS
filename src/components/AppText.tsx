/**
 * AppText — 全局字體包裝組件
 * 自動套用 jf open 粉圓，同時保留所有傳入的 style
 */
import React from 'react';
import { Text, TextProps, Platform } from 'react-native';

// Web: use system CJK fonts; Mobile: use JF Open Huninn
const BASE_FONT: TextProps['style'] = Platform.OS === 'web'
  ? { fontFamily: '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif' }
  : { fontFamily: 'JFOpenHuninn' };

const AppText = React.forwardRef<Text, TextProps>((props, ref) => (
  <Text
    ref={ref}
    {...props}
    style={[BASE_FONT, props.style]}
  />
));

AppText.displayName = 'AppText';
export default AppText;

/**
 * AppText — 全局字體包裝組件
 * 自動套用 jf open 粉圓，同時保留所有傳入的 style
 */
import React from 'react';
import { Text, TextProps } from 'react-native';

const AppText = React.forwardRef<Text, TextProps>((props, ref) => (
  <Text
    ref={ref}
    {...props}
    style={[{ fontFamily: 'JFOpenHuninn' }, props.style]}
  />
));

AppText.displayName = 'AppText';
export default AppText;

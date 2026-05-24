/**
 * HanziWriterView.web.tsx — Web stub
 * HanziWriter.js 需要 WebView（原生），Web 平台不支援。
 * 顯示佔位提示，避免 react-native-webview import 崩潰。
 */
import React, { forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import AppText from './AppText';

interface HanziWriterViewProps {
  character: string;
  width?: number;
  height?: number;
  showOutline?: boolean;
  showCharacter?: boolean;
  animateOnLoad?: boolean;
  containerStyle?: ViewStyle;
  onAnimationComplete?: () => void;
  onQuizComplete?: (totalMistakes: number) => void;
  onReady?: () => void;
}

export interface HanziWriterHandle {
  startQuiz: () => void;
  startQuizNoNumbers: () => void;
  replay: () => void;
  startDictationQuiz: () => void;
}

const HanziWriterView = forwardRef<HanziWriterHandle, HanziWriterViewProps>(
  ({ character, width = 280, height = 280, containerStyle, onAnimationComplete, onQuizComplete, onReady }, ref) => {
    useImperativeHandle(ref, () => ({
      startQuiz: () => { onQuizComplete?.(0); },
      startQuizNoNumbers: () => { onQuizComplete?.(0); },
      replay: () => { onAnimationComplete?.(); },
      startDictationQuiz: () => { onQuizComplete?.(0); },
    }));

    // Call onReady immediately on mount
    React.useEffect(() => { onReady?.(); }, []);

    return (
      <View style={[styles.container, { width, height }, containerStyle]}>
        <AppText style={styles.char}>{character}</AppText>
        <AppText style={styles.hint}>筆順練習在手機 App 上可用</AppText>
      </View>
    );
  }
);

HanziWriterView.displayName = 'HanziWriterView';
export default HanziWriterView;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#faf8f0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e8d8a0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  char: {
    fontSize: 96,
    color: '#1b1c17',
  },
  hint: {
    fontSize: 12,
    color: '#9a8c6a',
  },
});

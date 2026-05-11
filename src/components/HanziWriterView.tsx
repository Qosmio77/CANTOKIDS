import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface HanziWriterViewProps {
  character: string;
  width?: number;
  height?: number;
  showOutline?: boolean;
  animateOnLoad?: boolean;
  onAnimationComplete?: () => void;
  onQuizComplete?: (totalMistakes: number) => void;
}

/** 父元件可透過 ref 呼叫的方法 */
export interface HanziWriterHandle {
  /** 開始手寫測驗模式（描完所有筆順後觸發 onQuizComplete） */
  startQuiz: () => void;
  /** 重新播放示範動畫 */
  replay: () => void;
}

/**
 * HanziWriterView — 透過 WebView 整合 HanziWriter.js
 *
 * 修復 #2  : 分離 animationComplete 與 quizComplete
 * 修復 #5  : CDN 失敗時顯示離線提示
 * 修復 #6  : window.addEventListener（Android 相容）
 * 修復 #8  : Loader spinner 置中
 * Phase 5  : forwardRef + useImperativeHandle 暴露 startQuiz / replay
 */
const HanziWriterView = forwardRef<HanziWriterHandle, HanziWriterViewProps>(
  (
    {
      character,
      width = 280,
      height = 280,
      showOutline = true,
      animateOnLoad = true,
      onAnimationComplete,
      onQuizComplete,
    },
    ref
  ) => {
    const webViewRef = useRef<WebView>(null);

    // 安全編碼：只允許單一漢字，防止 JS 注入
    const safeCharacter = character.length === 1 ? character : '字';

    /** 向 WebView 發送 postMessage 動作 */
    const sendAction = (action: string) => {
      webViewRef.current?.injectJavaScript(
        `window.dispatchEvent(new MessageEvent('message', {
          data: JSON.stringify({ action: '${action}' })
        })); true;`
      );
    };

    // 暴露 startQuiz / replay 給父元件
    useImperativeHandle(ref, () => ({
      startQuiz: () => sendAction('quiz'),
      replay: () => sendAction('animate'),
    }));

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      display: flex;
      justify-content: center;
      align-items: center;
      width: ${width}px;
      height: ${height}px;
      background: #FFFBEB;
      overflow: hidden;
    }
    #character-target-div {
      border: 2px solid #FDE68A;
      border-radius: 12px;
      background: #FFFFF0;
    }
    #offline-msg {
      display: none;
      font-size: 14px;
      color: #9CA3AF;
      text-align: center;
      padding: 20px;
    }
  </style>
</head>
<body>
  <div id="character-target-div"></div>
  <div id="offline-msg">⚠️ 請連線網路<br/>以載入筆順功能</div>

  <script>
    function onScriptError() {
      document.getElementById('character-target-div').style.display = 'none';
      document.getElementById('offline-msg').style.display = 'block';
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'offline' })
      );
    }
  </script>
  <script
    src="https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js"
    onerror="onScriptError()"
  ></script>

  <script>
    if (typeof HanziWriter !== 'undefined') {
      var writer = null;

      function initWriter(char) {
        writer = HanziWriter.create('character-target-div', char, {
          width: ${width - 20},
          height: ${height - 20},
          padding: 20,
          showOutline: ${showOutline},
          strokeColor: '#1E40AF',
          outlineColor: '#BFDBFE',
          drawingColor: '#F59E0B',
          drawingWidth: 6,
          strokeAnimationSpeed: 1.2,
          delayBetweenStrokes: 300,
        });

        ${animateOnLoad ? `
        writer.animateCharacter({
          onComplete: function() {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'animationComplete' })
            );
          }
        });
        ` : ''}
      }

      // 修復 #6: window.addEventListener（Android WebView 相容）
      window.addEventListener('message', function(e) {
        var msg;
        try { msg = JSON.parse(e.data); } catch(err) { return; }

        if (msg.action === 'init' && msg.character) {
          initWriter(msg.character);
        } else if (msg.action === 'animate' && writer) {
          writer.animateCharacter({
            onComplete: function() {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'animationComplete' })
              );
            }
          });
        } else if (msg.action === 'quiz' && writer) {
          writer.quiz({
            onMistake: function(strokeData) {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'mistake', strokeNum: strokeData.strokeNum })
              );
            },
            onCorrectStroke: function(strokeData) {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'correctStroke', strokeNum: strokeData.strokeNum })
              );
            },
            onComplete: function(summaryData) {
              window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
                JSON.stringify({ type: 'quizComplete', totalMistakes: summaryData.totalMistakes })
              );
            }
          });
        }
      });

      // 頁面載入後通知 RN，由 RN 發送 init 指令
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'ready' })
      );
    }
  </script>
</body>
</html>
    `;

    const handleMessage = (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        switch (msg.type) {
          case 'ready':
            webViewRef.current?.injectJavaScript(
              `window.dispatchEvent(new MessageEvent('message', {
                data: JSON.stringify({ action: 'init', character: '${safeCharacter}' })
              })); true;`
            );
            break;
          case 'animationComplete':
            onAnimationComplete?.();
            break;
          case 'quizComplete':
            onQuizComplete?.(msg.totalMistakes ?? 0);
            break;
          case 'offline':
            break;
          default:
            break;
        }
      } catch (err) {
        if (__DEV__) {
          console.warn('[HanziWriterView] Failed to parse WebView message:', err);
        }
      }
    };

    return (
      <View style={[styles.container, { width, height }]}>
        <WebView
          ref={webViewRef}
          source={{ html: htmlContent }}
          style={{ width, height, backgroundColor: 'transparent' }}
          onMessage={handleMessage}
          scrollEnabled={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          startInLoadingState
          renderLoading={() => (
            <ActivityIndicator size="large" color="#F59E0B" style={styles.loader} />
          )}
        />
      </View>
    );
  }
);

HanziWriterView.displayName = 'HanziWriterView';
export default HanziWriterView;

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFFBEB',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

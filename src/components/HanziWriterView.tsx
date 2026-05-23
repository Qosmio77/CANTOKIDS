import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

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

/** 父元件可透過 ref 呼叫的方法 */
export interface HanziWriterHandle {
  /** 開始手寫測驗（第一次：數字仍可見） */
  startQuiz: () => void;
  /** 開始手寫測驗（第二次以上：先清除數字） */
  startQuizNoNumbers: () => void;
  /** 重新播放示範動畫（逐筆＋數字重新出現） */
  replay: () => void;
  startDictationQuiz: () => void;
}

/**
 * HanziWriterView — 透過 WebView 整合 HanziWriter.js
 *
 * Phase 6 筆順數字功能：
 *   • 動畫模式：逐筆播放，每筆完成後出現一個琥珀圓形數字徽章
 *   • 第一次練寫（startQuiz）：數字徽章保留，作為引導
 *   • 第二次練寫（startQuizNoNumbers）：清除數字，憑記憶練寫
 */
const HanziWriterView = forwardRef<HanziWriterHandle, HanziWriterViewProps>(
  (
    {
      character,
      width = 280,
      height = 280,
      showOutline = true,
      showCharacter = true,
      animateOnLoad = true,
      containerStyle,
      onAnimationComplete,
      onQuizComplete,
      onReady,
    },
    ref
  ) => {
    const webViewRef = useRef<WebView>(null);
    const safeCharacter = character.length === 1 ? character : '字';

    const sendAction = (action: string) => {
      webViewRef.current?.injectJavaScript(
        `window.dispatchEvent(new MessageEvent('message', {
          data: JSON.stringify({ action: '${action}' })
        })); true;`
      );
    };

    useImperativeHandle(ref, () => ({
      startQuiz:          () => sendAction('quiz'),
      startQuizNoNumbers: () => sendAction('quizNoNumbers'),
      replay:             () => sendAction('animate'),
      startDictationQuiz: () => sendAction('dictationQuiz'),
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
      background: #fbf9f1;
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
    var animStrokeIdx = 0;
    var animTotalStrokes = 0;

    // ── 工具：取得 SVG 中的筆劃路徑 ──────────────────────────────
    function getStrokePaths() {
      var svg = document.querySelector('svg');
      if (!svg) return [];
      var mainG = svg.querySelector(':scope > g');
      if (!mainG) return [];
      var childGs = Array.from(mainG.children).filter(function(el) {
        return el.nodeName.toLowerCase() === 'g';
      });
      // 找有路徑的第一個子 group（outline group）
      for (var i = 0; i < childGs.length; i++) {
        var paths = Array.from(childGs[i].querySelectorAll(':scope > path'));
        if (paths.length > 0) return paths;
      }
      return [];
    }

    // ── 工具：在指定筆劃起始位置加上數字徽章 ─────────────────────
    function addNumberBadge(strokeIdx) {
      var svg = document.querySelector('svg');
      if (!svg) return;
      var paths = getStrokePaths();
      var path = paths[strokeIdx];
      if (!path) return;

      try {
        var len = path.getTotalLength();
        if (len === 0) return;
        // 取筆劃前 5% 處作為數字位置，接近起始點但不在邊界
        var pt = path.getPointAtLength(len * 0.05);
        var ctm = path.getCTM();
        if (!ctm) return;

        // 轉換至 SVG viewport 座標
        var svgPt = svg.createSVGPoint();
        svgPt.x = pt.x;
        svgPt.y = pt.y;
        var vp = svgPt.matrixTransform(ctm);

        // 確保徽章不超出畫布邊界
        var m = 15;
        vp.x = Math.max(m, Math.min(${width} - m, vp.x));
        vp.y = Math.max(m, Math.min(${height} - m, vp.y));

        // 建立 SVG group（附加至 svg root，不受 HanziWriter 內部 transform 影響）
        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.setAttribute('class', 'sn');

        // 底色圓圈
        var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', vp.x);
        circle.setAttribute('cy', vp.y);
        circle.setAttribute('r', '13');
        circle.setAttribute('fill', '#E8A000');
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2.5');
        circle.setAttribute('opacity', '0.94');

        // 數字文字
        var text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', vp.x);
        text.setAttribute('y', vp.y + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', '900');
        text.setAttribute('font-family', 'Arial,Helvetica,sans-serif');
        text.setAttribute('pointer-events', 'none');
        text.textContent = String(strokeIdx + 1);

        g.appendChild(circle);
        g.appendChild(text);
        svg.appendChild(g);
      } catch(e) { /* silent */ }
    }

    // ── 工具：清除所有數字徽章 ────────────────────────────────────
    function clearNumbers() {
      var nodes = document.querySelectorAll('.sn');
      Array.from(nodes).forEach(function(n) {
        if (n.parentNode) n.parentNode.removeChild(n);
      });
    }

    // ── 逐筆動畫（附帶數字累積）─────────────────────────────────
    function animateWithNums() {
      clearNumbers();
      var paths = getStrokePaths();
      animTotalStrokes = paths.length;

      if (animTotalStrokes === 0) {
        // 備用：直接呼叫 animateCharacter
        writer.animateCharacter({
          onComplete: function() {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
              JSON.stringify({ type: 'animationComplete' })
            );
          }
        });
        return;
      }

      writer.hideCharacter();
      animStrokeIdx = 0;
      nextStroke();
    }

    // 遞迴：依序播放每一筆，完成後加上數字
    function nextStroke() {
      if (animStrokeIdx >= animTotalStrokes) {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
          JSON.stringify({ type: 'animationComplete' })
        );
        return;
      }
      var i = animStrokeIdx;
      writer.animateStroke(i).then(function() {
        addNumberBadge(i);
        animStrokeIdx++;
        setTimeout(nextStroke, 350);
      });
    }

    // ── 測驗（帶共用 quiz options）───────────────────────────────
    function startQuiz() {
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

    // ── Writer 初始化 ─────────────────────────────────────────────
    function initWriter(char) {
      writer = HanziWriter.create('character-target-div', char, {
        width: ${width - 20},
        height: ${height - 20},
        padding: 20,
        showOutline: ${showOutline},
        showCharacter: ${showCharacter},
        strokeColor: '#1E40AF',
        outlineColor: '#BFDBFE',
        drawingColor: '#E8A000',
        drawingWidth: 6,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 300,
      });

      ${animateOnLoad ? `
      // 短暫延遲確保 SVG paths 已在 DOM 中
      setTimeout(function() { animateWithNums(); }, 80);
      ` : ''}
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'writerReady' })
      );
    }

    // ── 訊息處理 ─────────────────────────────────────────────────
    window.addEventListener('message', function(e) {
      var msg;
      try { msg = JSON.parse(e.data); } catch(err) { return; }

      if (msg.action === 'init' && msg.character) {
        initWriter(msg.character);
      } else if (msg.action === 'animate' && writer) {
        // 重播：重新逐筆播放並重建數字
        setTimeout(function() { animateWithNums(); }, 80);
      } else if (msg.action === 'quiz' && writer) {
        // 第一次練寫：數字保留（從動畫帶過來）
        startQuiz();
      } else if (msg.action === 'quizNoNumbers' && writer) {
        // 第二次練寫：清除數字後開始
        clearNumbers();
        startQuiz();
      } else if (msg.action === 'hideNumbers') {
        clearNumbers();
      } else if (msg.action === 'dictationQuiz' && writer) {
        clearNumbers();
        writer.hideOutline();
        writer.hideCharacter();
        startQuiz();
      }
    });

    // 通知 RN 已就緒，由 RN 發送 init 指令
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
          case 'writerReady':
            onReady?.();
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
      <View style={[styles.container, { width, height }, containerStyle]}>
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
            <ActivityIndicator size="large" color="#E8A000" style={styles.loader} />
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
    backgroundColor: '#fbf9f1',
  },
  loader: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
});

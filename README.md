# CantoKids 🌱
**繁體字與廣東話學習 App — Phase 1 MVP**

## 快速開始

```bash
cd CantoKids
npm install
npx expo start
```

## 專案結構

```
CantoKids/
├── App.tsx                          # 入口點
├── app.json                         # Expo 設定
├── package.json
├── tsconfig.json
└── src/
    ├── screens/
    │   ├── HomeScreen.tsx           # 首頁 & 學習進度
    │   ├── MapScreen.tsx            # 學習地圖 & 關卡
    │   └── LessonScreen.tsx         # 課程室 (字義 + 練寫)
    ├── components/
    │   └── HanziWriterView.tsx      # 筆順動畫 WebView 元件
    ├── navigation/
    │   └── AppNavigator.tsx         # React Navigation 設定
    ├── store/
    │   └── useProgressStore.ts      # Zustand 學習進度狀態
    └── data/
        └── words_seedling.json      # 幼苗級 10 個示範漢字
```

## Phase 1 功能

- ✅ 首頁：歡迎、進度條、今日學習單字格子
- ✅ 學習地圖：關卡解鎖系統
- ✅ 課程室：字義分頁（意思、例句、筆畫數）
- ✅ 課程室：練寫分頁（HanziWriter 筆順動畫）
- ✅ Zustand 進度狀態管理
- ✅ 底部導航

## 下一步 (Phase 2)

- 粵語/普通話真人發音整合
- 互動測驗小遊戲
- 獎勵系統 (星星/徽章)
- 默書室 MVP

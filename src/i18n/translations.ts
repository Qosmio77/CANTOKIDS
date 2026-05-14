/**
 * translations.ts — CantoKids 中英文介面字串
 */

export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    // ── 通用 ──────────────────────────────────────────────
    save:    '儲存',
    cancel:  '取消',
    confirm: '確定',
    close:   '關閉',
    back:    '返回',
    next:    '下一步',
    done:    '完成',
    yes:     '是',
    no:      '否',

    // ── 語言設定 ──────────────────────────────────────────
    language:        '語言',
    languageZh:      '繁體中文',
    languageEn:      'English',

    // ── 底部導航 ──────────────────────────────────────────
    tabHome:    '首頁',
    tabMap:     '地圖',
    tabQuiz:    '測驗',

    // ── HomeScreen ────────────────────────────────────────
    greeting:          '你好，{name}！ 👋',
    learningProgress:  '📊 學習進度',
    progressSummary:   '已學 {learned} / {total} 個漢字 · 共 8 個級別',
    // Phase 3: Energy System
    energyTitle:       '⚡ 星力值',
    energyCharged:     '已充能 {learned} / {total} 格',
    energySubtext:     '🚀 正在為你的太空船充能…',
    todayLearning:     '📖 今日學習',
    startLearning:     '開始學習',
    continueLearning:  '繼續學習',
    interactiveQuiz:   '互動測驗',
    // Phase 4: Voice placeholder
    practiceSpeaking:  '練習說話',
    micComingSoon:     '🎙️ 麥克風已啟動！（即將推出）',
    myBadges:          '我的徽章',
    badgesCollected:   '已收集 {n} / {total} 個',
    // Phase 3: My Pets (renamed from Treasure Vault)
    treasureVault:     '我的寵物',
    treasuresCollected:'已孵化 {n} / {total} 隻',

    // ── MapScreen ─────────────────────────────────────────
    learningMap:       '🗺️ 學習地圖',
    mapSubtitle:       '共 100 個漢字 · 8 個級別',
    unlockBanner:      '🔓 升級解鎖全部 100 個漢字 — 前 10 課免費',
    levelSeedling:     '🌱 幼苗級',
    levelSapling:      '🌿 小樹級',
    levelTree:         '🌳 大樹級',
    levelSunflower:    '🌻 向日葵級',
    levelRainbow:      '🌈 彩虹級',
    levelGalaxy:       '🌌 星河級',
    levelBamboo:       '🎋 竹林級',
    levelJade:         '💎 玉龍級',
    levelWords:        '{n} 個漢字',
    locked:            '🔒',
    bossChallenge:     '⚔️ 挑戰 Boss',
    bossDefeated:      '✅ 已擊敗',
    premiumRequired:   '需要升級',

    // ── 詞語 & 成語 ───────────────────────────────────────────
    levelVocab:          '📝 詞語關卡',
    levelIdiom:          '🏮 成語關卡',
    vocabCount:          '{n} 個詞語',
    idiomCount:          '{n} 個成語',
    vocabLocked:         '先學識 {n} 個漢字才解鎖詞語',
    idiomLocked:         '先學識 {n} 個詞語才解鎖成語',
    vocabUnlockHint:     '🎓 解鎖詞語關卡！',
    idiomUnlockHint:     '🏮 解鎖成語關卡！',
    contentTypeChar:     '單字',
    contentTypeWord:     '詞語',
    contentTypeIdiom:    '成語',
    writeCharProgress:   '第 {current} / {total} 個字',
    writingChar:         '✍️ 按筆順寫「{char}」',
    watchingChar:        '👀 觀看「{char}」示範…',
    quizVocab:           '詞語',
    quizIdiom:           '成語',

    // ── OnboardingScreen ──────────────────────────────────
    onboardingWelcomeTitle: '歡迎來到 CantoKids！',
    onboardingWelcomeDesc:
      '一個為小朋友設計的廣東話 & 繁體字學習應用程式。\n\n透過筆順練習、聆聽、測驗\n讓學習漢字變得有趣！',
    onboardingFeatures: [
      '✍️  筆順動畫練習',
      '🔊  廣東話發音',
      '🎮  互動測驗',
      '🏅  徽章獎勵',
    ],
    onboardingSetup:    '開始設定',
    onboardingNameTitle:'你叫什麼名字？',
    onboardingNameHint: '輸入小朋友的名字，讓 App 更個人化！',
    onboardingNamePlaceholder: '例如：小明',
    onboardingNameNote: '（稍後可在家長控制台更改）',
    onboardingReadyTitle: '{name}，準備好了！',
    onboardingReadyDesc:
      '從幼苗級開始，\n每天學幾個漢字，\n慢慢成長為廣東話高手！',
    onboardingTipTitle: '💡 使用貼士',
    onboardingTips: [
      '• 長按字卡可聆聽廣東話發音',
      '• 每日學習維持連勝火焰 🔥',
      '• 家長可進入控制台查看進度',
    ],
    onboardingStart: '開始學習！',

    // ── LessonScreen ──────────────────────────────────────
    lessonClassroom:   '學習課室',
    lessonMeaning:     '意思',
    lessonExample:     '例句',
    lessonStrokes:     '筆畫數',
    lessonLevel:       '級別',
    lessonPractice:    '去練寫 ✍️  →',
    lessonCantonese:   '粵',
    lessonMandarin:    '普',
    lessonTab_meaning: '📖 字義',
    lessonTab_writing: '✍️ 練寫',
    lessonWritingDone: '🎉 完成！',
    lessonWriteAgain:  '← 再寫',
    lessonNextLesson:  '下一課 →',

    // ── QuizMenuScreen ────────────────────────────────────
    interactiveTest:   '🎮 互動測驗',
    quizSelectMode:    '選擇關卡，再選測驗方式',
    quizListen:        '聽音選字',
    quizListenDesc:    '聆聽粵語發音，選出正確的漢字',
    quizRead:          '看字選音',
    quizReadDesc:      '看漢字，選出正確的粵語拼音',
    quizOddOne:        '揀錯字',
    quizOddOneDesc:    '四個字中，找出意思不同的一個',
    // Level tab labels (short)
    quizTabSeedling:   '幼苗',
    quizTabSapling:    '小樹',
    quizTabTree:       '大樹',
    quizTabSunflower:  '向日葵',
    quizTabRainbow:    '彩虹',
    quizTabGalaxy:     '星河',
    quizTabVocab:      '詞語',
    quizTabIdiom:      '成語',
    quizTabAll:        '全部混',
    // Level info descriptions
    quizInfoSeedling:  '🌱 幼苗級：山水火木日月人口手心（10 字）',
    quizInfoSapling:   '🌳 小樹級：貓狗魚鳥花草雨風天地（10 字）',
    quizInfoTree:      '🏆 大樹級：書學玩食飲大小好多家（10 字）',
    quizInfoSunflower: '🌻 向日葵級：一二三四五六七八九十（10 字）',
    quizInfoRainbow:   '🌈 彩虹級：紅橙黃綠藍頭眼耳鼻腳（10 字）',
    quizInfoGalaxy:    '⭐ 星河級：爸媽哥姐弟妹爺嫲公婆（10 字）',
    quizInfoAll:       '🌍 全部混合：60 個漢字隨機出題',
    quizLevelUpgrade:  '（需升級）',

    // ── BossBattleScreen ─────────────────────────────────
    bossHp:            'HP',
    bossAttack:        '攻擊！',
    bossDefeatedMsg:   '🎉 擊敗了 {name}！',
    bossTreasureDrop:  '獲得寶物！',
    bossNextWave:      '繼續挑戰',
    bossRetry:         '再試一次',

    // ── TreasureScreen ───────────────────────────────────
    treasureTitle:     '🥚 我的寵物',
    treasureAll:       '全部',
    rarityCommon:      '普通',
    rarityRare:        '罕見',
    rarityEpic:        '史詩',
    rarityLegendary:   '傳說',
    treasureUnknown:   '？？？',
    treasureOwned:     '已擁有 x{n}',

    // ── BadgeScreen ───────────────────────────────────────
    badgeTitle:        '🏅 我的徽章',
    badgeLocked:       '未解鎖',
    badgeProgress:     '{n}/{total}',

    // ── SettingsScreen ────────────────────────────────────
    settings:              '設定',
    sectionProfile:        '👧 個人資料',
    childName:             '小朋友名稱',
    nameEmpty:             '名字不能為空',
    nameTooLong:           '名字最多 10 個字',
    sectionWeb:            '🌐 網頁版',
    scanQrLogin:           '掃描登入網頁版',
    webHint:               '在電腦瀏覽器開啟 {url}\n然後用手機掃描 QR Code 即可同步學習進度',
    sectionApp:            '⚙️ 應用程式',
    replayTutorial:        '重新播放引導教學',
    privacyPolicy:         '私隱政策',
    contactSupport:        '聯絡支援',
    sectionLanguage:       '🌐 介面語言',
    sectionAbout:          'ℹ️ 關於',
    aboutVersion:          '版本',
    aboutDictionary:       '詞庫',
    aboutDictionaryValue:  '100 個漢字 · 8 個級別',
    aboutMadeBy:           '製作',
    aboutMadeByValue:      'CantoKids Team 🌱',
    parentDashboard:       '進入家長控制台',
    replayConfirmTitle:    '重播引導',
    replayConfirmMsg:      '確定要重新觀看首次使用引導？',
    privacyMsg:
      'CantoKids 不收集任何兒童個人資料。\n學習進度僅儲存在本機裝置。\n\n符合 COPPA 規範。',
    supportMsg:
      '請電郵至 support@cantokids.app\n\n我們會於 2 個工作天內回覆。',
  },

  en: {
    // ── Common ────────────────────────────────────────────
    save:    'Save',
    cancel:  'Cancel',
    confirm: 'OK',
    close:   'Close',
    back:    'Back',
    next:    'Next',
    done:    'Done',
    yes:     'Yes',
    no:      'No',

    // ── Language ──────────────────────────────────────────
    language:        'Language',
    languageZh:      '繁體中文',
    languageEn:      'English',

    // ── Bottom Tabs ───────────────────────────────────────
    tabHome:    'Home',
    tabMap:     'Map',
    tabQuiz:    'Quiz',

    // ── HomeScreen ────────────────────────────────────────
    greeting:          'Hello, {name}! 👋',
    learningProgress:  '📊 Learning Progress',
    progressSummary:   'Learned {learned} / {total} characters · 8 levels',
    // Phase 3: Energy System
    energyTitle:       '⚡ Star Power',
    energyCharged:     'Charged {learned} / {total} cells',
    energySubtext:     '🚀 Powering up your spaceship…',
    todayLearning:     '📖 Today\'s Learning',
    startLearning:     'Start Learning',
    continueLearning:  'Continue',
    interactiveQuiz:   'Quiz',
    // Phase 4: Voice placeholder
    practiceSpeaking:  'Practice Speaking',
    micComingSoon:     '🎙️ Microphone activated! (Coming soon)',
    myBadges:          'My Badges',
    badgesCollected:   'Collected {n} / {total}',
    // Phase 3: My Pets (renamed from Treasure Vault)
    treasureVault:     'My Pets',
    treasuresCollected:'Hatched {n} / {total}',

    // ── MapScreen ─────────────────────────────────────────
    learningMap:       '🗺️ Learning Map',
    mapSubtitle:       '100 characters · 8 levels',
    unlockBanner:      '🔓 Unlock all 100 characters — first 10 lessons free',
    levelSeedling:     '🌱 Seedling',
    levelSapling:      '🌿 Sapling',
    levelTree:         '🌳 Tree',
    levelSunflower:    '🌻 Sunflower',
    levelRainbow:      '🌈 Rainbow',
    levelGalaxy:       '🌌 Galaxy',
    levelBamboo:       '🎋 Bamboo',
    levelJade:         '💎 Jade Dragon',
    levelWords:        '{n} characters',
    locked:            '🔒',
    bossChallenge:     '⚔️ Challenge Boss',
    bossDefeated:      '✅ Defeated',
    premiumRequired:   'Upgrade Required',

    // ── Vocabulary & Idioms ───────────────────────────────────
    levelVocab:          '📝 Vocabulary',
    levelIdiom:          '🏮 Idioms',
    vocabCount:          '{n} words',
    idiomCount:          '{n} idioms',
    vocabLocked:         'Learn {n} characters to unlock Vocabulary',
    idiomLocked:         'Learn {n} vocabulary words to unlock Idioms',
    vocabUnlockHint:     '🎓 Vocabulary unlocked!',
    idiomUnlockHint:     '🏮 Idioms unlocked!',
    contentTypeChar:     'Character',
    contentTypeWord:     'Vocabulary',
    contentTypeIdiom:    'Idiom',
    writeCharProgress:   'Char {current} / {total}',
    writingChar:         '✍️ Trace "{char}" stroke by stroke',
    watchingChar:        '👀 Watch the strokes for "{char}"…',
    quizVocab:           'Vocab',
    quizIdiom:           'Idioms',

    // ── OnboardingScreen ──────────────────────────────────
    onboardingWelcomeTitle: 'Welcome to CantoKids!',
    onboardingWelcomeDesc:
      'A fun Cantonese & Traditional Chinese learning app designed for kids.\n\nLearn stroke order, listen to pronunciations, and take quizzes!',
    onboardingFeatures: [
      '✍️  Stroke order animations',
      '🔊  Cantonese pronunciation',
      '🎮  Interactive quizzes',
      '🏅  Badge rewards',
    ],
    onboardingSetup:    'Get Started',
    onboardingNameTitle:'What\'s your name?',
    onboardingNameHint: 'Enter the child\'s name to personalise the app!',
    onboardingNamePlaceholder: 'e.g. Alex',
    onboardingNameNote: '(Can be changed later in Parent Dashboard)',
    onboardingReadyTitle: '{name}, you\'re all set!',
    onboardingReadyDesc:
      'Start from Seedling level,\nlearn a few characters every day,\nand grow into a Cantonese master!',
    onboardingTipTitle: '💡 Tips',
    onboardingTips: [
      '• Long-press a card to hear Cantonese pronunciation',
      '• Keep a daily streak to earn 🔥',
      '• Parents can check progress in the dashboard',
    ],
    onboardingStart: 'Start Learning!',

    // ── LessonScreen ──────────────────────────────────────
    lessonClassroom:   'Classroom',
    lessonMeaning:     'Meaning',
    lessonExample:     'Example',
    lessonStrokes:     'Strokes',
    lessonLevel:       'Level',
    lessonPractice:    'Practice Writing ✍️  →',
    lessonCantonese:   'Canto',
    lessonMandarin:    'Mand.',
    lessonTab_meaning: '📖 Meaning',
    lessonTab_writing: '✍️ Writing',
    lessonWritingDone: '🎉 Done!',
    lessonWriteAgain:  '← Again',
    lessonNextLesson:  'Next →',

    // ── QuizMenuScreen ────────────────────────────────────
    interactiveTest:   '🎮 Interactive Quiz',
    quizSelectMode:    'Choose a level, then a quiz mode',
    quizListen:        'Listen & Pick',
    quizListenDesc:    'Hear Cantonese audio, choose the correct character',
    quizRead:          'See & Spell',
    quizReadDesc:      'See the character, choose the correct Jyutping',
    quizOddOne:        'Odd One Out',
    quizOddOneDesc:    'Four characters — find the one with a different meaning',
    // Level tab labels (short)
    quizTabSeedling:   'Seedling',
    quizTabSapling:    'Sapling',
    quizTabTree:       'Tree',
    quizTabSunflower:  'Sunflower',
    quizTabRainbow:    'Rainbow',
    quizTabGalaxy:     'Galaxy',
    quizTabVocab:      'Vocab',
    quizTabIdiom:      'Idioms',
    quizTabAll:        'All Mix',
    // Level info descriptions
    quizInfoSeedling:  '🌱 Seedling: 山水火木日月人口手心 (10 chars)',
    quizInfoSapling:   '🌳 Sapling: 貓狗魚鳥花草雨風天地 (10 chars)',
    quizInfoTree:      '🏆 Tree: 書學玩食飲大小好多家 (10 chars)',
    quizInfoSunflower: '🌻 Sunflower: 一二三四五六七八九十 (10 chars)',
    quizInfoRainbow:   '🌈 Rainbow: 紅橙黃綠藍頭眼耳鼻腳 (10 chars)',
    quizInfoGalaxy:    '⭐ Galaxy: 爸媽哥姐弟妹爺嫲公婆 (10 chars)',
    quizInfoAll:       '🌍 All Mix: 60 characters shuffled randomly',
    quizLevelUpgrade:  '(Upgrade Required)',

    // ── BossBattleScreen ─────────────────────────────────
    bossHp:            'HP',
    bossAttack:        'Attack!',
    bossDefeatedMsg:   '🎉 Defeated {name}!',
    bossTreasureDrop:  'Treasure Dropped!',
    bossNextWave:      'Keep Going',
    bossRetry:         'Try Again',

    // ── TreasureScreen ───────────────────────────────────
    treasureTitle:     '🥚 My Pets',
    treasureAll:       'All',
    rarityCommon:      'Common',
    rarityRare:        'Rare',
    rarityEpic:        'Epic',
    rarityLegendary:   'Legendary',
    treasureUnknown:   '？？？',
    treasureOwned:     'Owned x{n}',

    // ── BadgeScreen ───────────────────────────────────────
    badgeTitle:        '🏅 My Badges',
    badgeLocked:       'Locked',
    badgeProgress:     '{n}/{total}',

    // ── SettingsScreen ────────────────────────────────────
    settings:              'Settings',
    sectionProfile:        '👧 Profile',
    childName:             'Child\'s Name',
    nameEmpty:             'Name cannot be empty',
    nameTooLong:           'Name must be 10 characters or fewer',
    sectionWeb:            '🌐 Web Version',
    scanQrLogin:           'Scan to Log In (Web)',
    webHint:               'Open {url} in your browser\nthen scan the QR code to sync progress',
    sectionApp:            '⚙️ App',
    replayTutorial:        'Replay Tutorial',
    privacyPolicy:         'Privacy Policy',
    contactSupport:        'Contact Support',
    sectionLanguage:       '🌐 Interface Language',
    sectionAbout:          'ℹ️ About',
    aboutVersion:          'Version',
    aboutDictionary:       'Dictionary',
    aboutDictionaryValue:  '100 characters · 8 levels',
    aboutMadeBy:           'Made by',
    aboutMadeByValue:      'CantoKids Team 🌱',
    parentDashboard:       'Parent Dashboard',
    replayConfirmTitle:    'Replay Tutorial',
    replayConfirmMsg:      'Are you sure you want to replay the onboarding tutorial?',
    privacyMsg:
      'CantoKids does not collect any personal data from children.\nLearning progress is stored on-device only.\n\nCOPPA compliant.',
    supportMsg:
      'Email us at support@cantokids.app\n\nWe reply within 2 business days.',
  },
} as const;

export type TranslationKeys = keyof typeof translations.zh;

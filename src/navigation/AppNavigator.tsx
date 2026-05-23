import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';
import AppText from '../components/AppText';
import { Colors } from '../theme/colors';
import { useProgressStore } from '../store/useProgressStore';
import { useTranslation } from '../hooks/useTranslation';

// ── Tab icons ─────────────────────────────────────────────────────────
const TAB_ICONS = {
  Home:    require('../../assets/icons/icon_home.png'),
  Learn:   require('../../assets/icons/icon_book.png'),
  Game:    require('../../assets/icons/icon_target.png'),
  Profile: require('../../assets/icons/icon_person.png'),
};

// ── Screens ──────────────────────────────────────────────────────────
import HomeScreen       from '../screens/HomeScreen';
import LearnScreen      from '../screens/LearnScreen';
import MapScreen        from '../screens/MapScreen';
import LessonScreen     from '../screens/LessonScreen';
import QuizMenuScreen   from '../screens/QuizMenuScreen';
import QuizScreen       from '../screens/quiz/QuizScreen';
import ParentLoginScreen    from '../screens/parent/ParentLoginScreen';
import ParentDashboardScreen from '../screens/parent/ParentDashboardScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import BadgeScreen      from '../screens/BadgeScreen';
import SettingsScreen   from '../screens/SettingsScreen';
import BossBattleScreen from '../screens/BossBattleScreen';
import TreasureScreen   from '../screens/TreasureScreen';
import ProfileScreen    from '../screens/ProfileScreen';
import TopicDetailScreen from '../screens/TopicDetailScreen';
import StoryDetailScreen from '../screens/StoryDetailScreen';
import DictationScreen  from '../screens/DictationScreen';
import PracticeScreen      from '../screens/PracticeScreen';
import PracticeSheetScreen from '../screens/PracticeSheetScreen';
import CreatureScreen           from '../screens/CreatureScreen';
import HatchlingChallengeScreen from '../screens/HatchlingChallengeScreen';
import PlacementTestScreen      from '../screens/PlacementTestScreen';
import VoicePracticeScreen      from '../screens/VoicePracticeScreen';
import CurriculumScreen         from '../screens/CurriculumScreen';
import { ParentAuthProvider } from '../contexts/ParentAuthContext';

// QRScanScreen 條件載入
let QRScanScreen: React.ComponentType<any>;
try {
  QRScanScreen = require('../screens/QRScanScreen').default;
} catch {
  const { View, Text, TouchableOpacity } = require('react-native');
  const { useTranslation: useT } = require('../hooks/useTranslation');
  QRScanScreen = ({ navigation }: any) => {
    const { t } = useT();
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
        <AppText style={{ fontSize: 21, color: '#6B7280', textAlign: 'center', paddingHorizontal: 32 }}>
          {t('qrInstallHint1')}{'\n'}
          <AppText style={{ fontFamily: 'monospace', color: '#1F2937' }}>
            npx expo install expo-camera
          </AppText>
          {'\n'}{t('qrInstallHint2')}
        </AppText>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: '#F59E0B', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
        >
          <AppText style={{ color: '#fff', fontWeight: '700' }}>{t('back')}</AppText>
        </TouchableOpacity>
      </View>
    );
  };
}

// ── Route type definitions ────────────────────────────────────────────
export type RootStackParamList = {
  Onboarding:       undefined;
  MainTabs:         undefined;
  Map:              undefined;
  Lesson:           { wordId: number; lessonId: number };
  QuizMenu:         undefined;
  Quiz:             { quizType: 'listenPick' | 'readPick' | 'findWrong'; quizLevel: import('../screens/QuizMenuScreen').QuizLevel };
  ParentLogin:      undefined;
  ParentDashboard:  undefined;
  Badges:           undefined;
  Settings:         undefined;
  BossBattle:       { bossId: string };
  Treasure:         undefined;
  QRScan:           undefined;
  TopicDetail:      { topicId: string };
  StoryDetail:      { storyId: string };
  Dictation: { mode: 'listen' | 'memory' };
  Practice:      undefined;
  PracticeSheet: undefined;
  Creature:         undefined;
  HatchlingChallenge: undefined;
  PlacementTest:    undefined;
  VoicePractice:    undefined;
  Curriculum:       undefined;
};

export type TabParamList = {
  Home:    undefined;
  Learn:   undefined;
  Game:    undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab   = createBottomTabNavigator<TabParamList>();

// ── Bottom Tab Navigator ──────────────────────────────────────────────
function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          height: 82,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 15, fontWeight: '700' },
        tabBarIcon: ({ focused }) => {
          const src = TAB_ICONS[route.name as keyof typeof TAB_ICONS];
          return (
            <Image
              source={src}
              style={{
                width: 42, height: 42,
                opacity: focused ? 1 : 0.4,
              }}
              resizeMode="contain"
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: t('tabHome') }}
      />
      <Tab.Screen
        name="Learn"
        component={LearnScreen}
        options={{ tabBarLabel: t('tabLearn') ?? (t('tabMap') || '學習') }}
      />
      <Tab.Screen
        name="Game"
        component={QuizMenuScreen}
        options={{ tabBarLabel: t('tabQuiz') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: t('tabProfile') ?? '我的' }}
      />
    </Tab.Navigator>
  );
}

// ── Root Stack Navigator ──────────────────────────────────────────────
export default function AppNavigator() {
  const onboardingDone = useProgressStore(s => s.onboardingDone);
  const { t } = useTranslation();

  const headerOpts = {
    headerStyle:     { backgroundColor: Colors.primaryBg },
    headerTintColor: Colors.primary,
    headerTitleStyle: { fontWeight: '700' as const },
  };

  return (
    <ParentAuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={onboardingDone ? 'MainTabs' : 'Onboarding'}
        >
          <Stack.Screen name="Onboarding"  component={OnboardingScreen} />
          <Stack.Screen name="MainTabs"    component={MainTabs} />

          {/* Map (accessible from Learn tab shortcut) */}
          <Stack.Screen
            name="Map"
            component={MapScreen}
            options={{ headerShown: true, headerTitle: t('tabMap'), ...headerOpts }}
          />

          {/* Lesson */}
          <Stack.Screen
            name="Lesson"
            component={LessonScreen}
            options={{ headerShown: true, headerTitle: t('lessonClassroom'), ...headerOpts }}
          />

          {/* Quiz */}
          <Stack.Screen
            name="QuizMenu"
            component={QuizMenuScreen}
            options={{ headerShown: true, headerTitle: t('interactiveTest'), ...headerOpts }}
          />
          <Stack.Screen
            name="Quiz"
            component={QuizScreen}
            options={{ headerShown: true, headerTitle: t('interactiveTest'), ...headerOpts }}
          />

          {/* Topic & Story */}
          <Stack.Screen name="TopicDetail"  component={TopicDetailScreen} />
          <Stack.Screen name="StoryDetail"  component={StoryDetailScreen} />
          <Stack.Screen
            name="Dictation"
            component={DictationScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Practice"
            component={PracticeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PracticeSheet"
            component={PracticeSheetScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Creature"
            component={CreatureScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HatchlingChallenge"
            component={HatchlingChallengeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PlacementTest"
            component={PlacementTestScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="VoicePractice"
            component={VoicePracticeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Curriculum"
            component={CurriculumScreen}
            options={{ headerShown: false }}
          />

          {/* Parent */}
          <Stack.Screen name="ParentLogin"     component={ParentLoginScreen} />
          <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} />

          {/* Others */}
          <Stack.Screen name="Badges"   component={BadgeScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="BossBattle" component={BossBattleScreen} />
          <Stack.Screen name="Treasure"   component={TreasureScreen} />
          <Stack.Screen
            name="QRScan"
            component={QRScanScreen}
            options={{ headerShown: true, headerTitle: t('scanQrLogin'), ...headerOpts }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ParentAuthProvider>
  );
}

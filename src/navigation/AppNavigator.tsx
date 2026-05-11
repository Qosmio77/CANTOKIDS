import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useProgressStore } from '../store/useProgressStore';

import HomeScreen from '../screens/HomeScreen';
import MapScreen from '../screens/MapScreen';
import LessonScreen from '../screens/LessonScreen';
import QuizMenuScreen from '../screens/QuizMenuScreen';
import QuizScreen from '../screens/quiz/QuizScreen';
import ParentLoginScreen from '../screens/parent/ParentLoginScreen';
import ParentDashboardScreen from '../screens/parent/ParentDashboardScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import BadgeScreen from '../screens/BadgeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import BossBattleScreen from '../screens/BossBattleScreen';
import TreasureScreen from '../screens/TreasureScreen';
import { ParentAuthProvider } from '../contexts/ParentAuthContext';

// QRScanScreen 用到 expo-camera，條件載入避免未安裝時 bundler 爆掉
let QRScanScreen: React.ComponentType<any>;
try {
  QRScanScreen = require('../screens/QRScanScreen').default;
} catch {
  // expo-camera 未安裝時顯示佔位畫面
  const { View, Text, StyleSheet, TouchableOpacity } = require('react-native');
  QRScanScreen = ({ navigation }: any) => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
      <Text style={{ fontSize: 17, color: '#6B7280', textAlign: 'center', paddingHorizontal: 32 }}>
        請先執行 {'\n'}
        <Text style={{ fontFamily: 'monospace', color: '#1F2937' }}>
          npx expo install expo-camera
        </Text>
        {'\n'}以啟用 QR 掃描功能
      </Text>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ backgroundColor: '#F59E0B', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
      >
        <Text style={{ color: '#fff', fontWeight: '700' }}>返回</Text>
      </TouchableOpacity>
    </View>
  );
}

// 路由型別定義
export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: undefined;
  Lesson: { wordId: number; lessonId: number };
  QuizMenu: undefined;
  Quiz: { quizType: 'listenPick' | 'readPick' | 'findWrong'; quizLevel: import('../screens/QuizMenuScreen').QuizLevel };
  // Phase 3: 家長區
  ParentLogin: undefined;
  ParentDashboard: undefined;
  // Phase 4
  Badges: undefined;
  Settings: undefined;
  // Phase 6: Boss 戰
  BossBattle: { bossId: string };
  // Phase 7: 寶物庫
  Treasure: undefined;
  // Phase 7: QR 掃碼登入網頁版
  QRScan: undefined;
};

export type TabParamList = {
  Home: undefined;
  Map: undefined;
  QuizTab: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// 底部導航頁籤
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.primaryBg,
          borderTopColor: Colors.primaryLight,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Map') {
            iconName = focused ? 'map' : 'map-outline';
          } else {
            iconName = focused ? 'game-controller' : 'game-controller-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarLabel:
          route.name === 'Home' ? '首頁' :
          route.name === 'Map' ? '地圖' : '測驗',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="QuizTab" component={QuizMenuScreen} />
    </Tab.Navigator>
  );
}

// 主導航容器
export default function AppNavigator() {
  // Phase 4: 根據 onboardingDone 決定初始路由
  const onboardingDone = useProgressStore((s) => s.onboardingDone);

  return (
    // ParentAuthProvider 包裹整個導航，讓所有頁面都能存取家長驗證狀態
    <ParentAuthProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{ headerShown: false }}
          initialRouteName={onboardingDone ? 'MainTabs' : 'Onboarding'}
        >
          {/* Phase 4: Onboarding（首次啟動才顯示） */}
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />

          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen
            name="Lesson"
            component={LessonScreen}
            options={{
              headerShown: true,
              headerTitle: '學習課室',
              headerStyle: { backgroundColor: Colors.primaryBg },
              headerTintColor: Colors.primary,
            }}
          />
          <Stack.Screen
            name="QuizMenu"
            component={QuizMenuScreen}
            options={{
              headerShown: true,
              headerTitle: '互動測驗',
              headerStyle: { backgroundColor: Colors.primaryBg },
              headerTintColor: Colors.primary,
            }}
          />
          <Stack.Screen
            name="Quiz"
            component={QuizScreen}
            options={{
              headerShown: true,
              headerTitle: '🎮 測驗',
              headerStyle: { backgroundColor: Colors.primaryBg },
              headerTintColor: Colors.primary,
            }}
          />
          {/* Phase 3: 家長區（無 header，自帶返回按鈕） */}
          <Stack.Screen name="ParentLogin" component={ParentLoginScreen} />
          <Stack.Screen name="ParentDashboard" component={ParentDashboardScreen} />
          {/* Phase 4: 徽章展示 */}
          <Stack.Screen name="Badges" component={BadgeScreen} />
          {/* Phase 4: 個人設定 */}
          <Stack.Screen name="Settings" component={SettingsScreen} />
          {/* Phase 6: Boss 戰（全螢幕，無 header） */}
          <Stack.Screen name="BossBattle" component={BossBattleScreen} />
          {/* Phase 7: 寶物庫（全螢幕，無 header） */}
          <Stack.Screen name="Treasure" component={TreasureScreen} />
          {/* Phase 7: QR 掃碼登入網頁版 */}
          <Stack.Screen
            name="QRScan"
            component={QRScanScreen}
            options={{
              headerShown: true,
              headerTitle: '掃描登入網頁版',
              headerStyle: { backgroundColor: Colors.primaryBg },
              headerTintColor: Colors.primary,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ParentAuthProvider>
  );
}

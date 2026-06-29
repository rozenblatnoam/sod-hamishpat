// @ts-nocheck
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../src/theme';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0d0d0d', borderTopColor: 'rgba(255,50,50,0.3)' },
        tabBarActiveTintColor: '#FF5252',
        tabBarInactiveTintColor: colors.text.muted,
      }}
    >
      <Tabs.Screen name="stats" options={{ title: 'סטטיסטיקות', tabBarIcon: ({ color }) => <Ionicons name="stats-chart" size={22} color={color} /> }} />
      <Tabs.Screen name="users" options={{ title: 'משתמשים', tabBarIcon: ({ color }) => <Ionicons name="people" size={22} color={color} /> }} />
      <Tabs.Screen name="rooms" options={{ title: 'חדרים', tabBarIcon: ({ color }) => <Ionicons name="grid" size={22} color={color} /> }} />
    </Tabs>
  );
}

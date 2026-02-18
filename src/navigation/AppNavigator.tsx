import React, { useRef, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';

import Home from '../screens/index';
import Tasks from '../screens/tasks';
import Health from '../screens/health';
import Coach from '../screens/coach';
import Audit from '../screens/audit';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ── Tab items config ──
const TAB_ITEMS = [
  { key: 'Home', label: 'Agenda', icon: '📅', activeColor: '#4F46E5' },
  { key: 'Tasks', label: 'Mi Plan', icon: '🌱', activeColor: '#059669' },
  { key: 'Health', label: 'Salud', icon: '🏥', activeColor: '#dc2626' },
  { key: 'Coach', label: 'Coach', icon: '🤖', activeColor: '#7c3aed' },
  { key: 'Audit', label: 'Analítica', icon: '📊', activeColor: '#0891b2' },
];

// ── Responsive scaler ──
const rs = (base: number, w: number) => {
  const factor = 1 + (w / 375 - 1) * 0.3;
  return Math.round(base * Math.min(Math.max(factor, 0.85), 1.12));
};

// ── Single tab item with animation ──
function CarouselTabItem({
  item,
  focused,
  onPress,
  screenWidth,
}: {
  item: (typeof TAB_ITEMS)[0];
  focused: boolean;
  onPress: () => void;
  screenWidth: number;
}) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const bubbleAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1 : 0,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleAnim, {
        toValue: focused ? 1 : 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  const iconScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const bubbleScale = bubbleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const bubbleOpacity = bubbleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0.5, 1],
  });

  // Each item takes ~1/5 of the screen but with some padding
  const itemWidth = Math.max(rs(68, screenWidth), screenWidth / 5.5);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        width: itemWidth,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: rs(8, screenWidth),
      }}
    >
      {/* Animated bubble behind icon */}
      <View style={{ width: rs(48, screenWidth), height: rs(48, screenWidth), justifyContent: 'center', alignItems: 'center' }}>
        <Animated.View
          style={{
            position: 'absolute',
            width: rs(48, screenWidth),
            height: rs(48, screenWidth),
            borderRadius: rs(24, screenWidth),
            backgroundColor: item.activeColor + '15',
            transform: [{ scale: bubbleScale }],
            opacity: bubbleOpacity,
          }}
        />
        <Animated.Text
          style={{
            fontSize: focused ? rs(24, screenWidth) : rs(20, screenWidth),
            transform: [{ scale: iconScale }],
          }}
        >
          {item.icon}
        </Animated.Text>
      </View>

      {/* Label */}
      <Text
        style={{
          fontSize: rs(10, screenWidth),
          fontWeight: focused ? '700' : '400',
          color: focused ? item.activeColor : '#9ca3af',
          marginTop: rs(2, screenWidth),
        }}
        numberOfLines={1}
      >
        {item.label}
      </Text>

      {/* Active dot indicator */}
      <View
        style={{
          width: focused ? rs(5, screenWidth) : 0,
          height: focused ? rs(5, screenWidth) : 0,
          borderRadius: rs(3, screenWidth),
          backgroundColor: item.activeColor,
          marginTop: rs(3, screenWidth),
        }}
      />
    </TouchableOpacity>
  );
}

// ── Custom Tab Bar (carousel) ──
function CarouselTabBar({ state, descriptors, navigation }: any) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to keep selected tab visible
  useEffect(() => {
    const itemWidth = Math.max(rs(68, width), width / 5.5);
    const scrollX = state.index * itemWidth - width / 2 + itemWidth / 2;
    scrollRef.current?.scrollTo({ x: Math.max(0, scrollX), animated: true });
  }, [state.index, width]);

  return (
    <View
      style={{
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingBottom: Platform.OS === 'ios' ? rs(20, width) : rs(6, width),
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: TAB_ITEMS.length <= 5 ? 'space-evenly' : 'flex-start',
          paddingHorizontal: TAB_ITEMS.length > 5 ? rs(8, width) : 0,
        }}
      >
        {state.routes.map((route: any, index: number) => {
          const tabItem = TAB_ITEMS.find((t) => t.key === route.name) || TAB_ITEMS[index];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <CarouselTabItem
              key={route.key}
              item={tabItem}
              focused={isFocused}
              onPress={onPress}
              screenWidth={width}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Tab Navigator ──
function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CarouselTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Tasks" component={Tasks} />
      <Tab.Screen name="Health" component={Health} />
      <Tab.Screen name="Coach" component={Coach} />
      <Tab.Screen name="Audit" component={Audit} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Root" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

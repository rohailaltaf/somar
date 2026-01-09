import { View, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { useAnimatedStyle, withSpring, useSharedValue } from "react-native-reanimated";
import { useEffect } from "react";
import { hexColors } from "@somar/shared/theme";
import { colors } from "@/src/lib/theme";

// Type for Expo Router tab bar props
interface TabRoute {
  key: string;
  name: string;
  params?: object;
}

interface TabBarProps {
  state: {
    index: number;
    routes: TabRoute[];
  };
  descriptors: Record<string, {
    options: {
      title?: string;
      tabBarIcon?: (props: { focused: boolean; color: string; size: number }) => React.ReactNode;
    };
  }>;
  navigation: {
    emit: (event: object) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
}

const SPRING_CONFIG = {
  damping: 30,
  stiffness: 400,
  mass: 0.8,
};

/**
 * Custom floating tab bar - "Sculptural Float" design.
 * Matches the web mobile nav exactly.
 */
export function FloatingTabBar({ state, descriptors, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  const tabCount = state.routes.length;
  const indicatorPosition = useSharedValue(state.index);

  useEffect(() => {
    indicatorPosition.value = withSpring(state.index, SPRING_CONFIG);
  }, [state.index, indicatorPosition]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withSpring(
            indicatorPosition.value * (280 - 12) / tabCount,
            SPRING_CONFIG
          ),
        },
      ],
    };
  });


  return (
    <View
      className="absolute bottom-0 left-0 right-0 px-4 items-center"
      style={{ paddingBottom: insets.bottom + 8 }}
    >
      {/* Floating dock */}
      <View
        className="w-[280px] bg-nav-dock rounded-2xl p-1.5"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 20,
        }}
      >
        {/* Outer border highlight */}
        <View className="absolute inset-0 rounded-2xl border border-white/[0.04]" />

        {/* Inner container */}
        <View className="flex-row relative">
          {/* Sliding indicator */}
          <Animated.View
            className="absolute top-0 bottom-0 left-0 bg-nav-indicator rounded-xl border-t border-white/[0.06]"
            style={[
              { width: (280 - 12) / tabCount },
              indicatorStyle,
            ]}
          />

          {/* Tab items */}
          {state.routes.map((route) => {
            const { options } = descriptors[route.key];
            const label = options.title ?? route.name;
            const isFocused = state.index === state.routes.indexOf(route);

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                className="flex-1 items-center justify-center py-2.5 gap-1 z-10"
              >
                {options.tabBarIcon?.({
                  focused: isFocused,
                  color: isFocused ? colors.foreground : hexColors.navInactiveIcon,
                  size: 20,
                })}
                <Text
                  className={`text-[10px] font-medium tracking-wide ${
                    isFocused ? "text-foreground" : "text-nav-inactive-label"
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

import { View, Text, Pressable, Modal, Image, ScrollView } from "react-native";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { X, ChevronRight } from "lucide-react-native";
import { demoPlaidLinkStyles, type DemoPlaidLinkProps } from "@somar/shared/styles";

const styles = demoPlaidLinkStyles;

export function DemoPlaidLink({ institutions, onSelect, onClose }: DemoPlaidLinkProps) {
  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        entering={FadeIn.duration(200)}
        className={styles.overlay}
      >
        <Pressable
          style={{ position: "absolute", width: "100%", height: "100%" }}
          onPress={onClose}
        />
        <Animated.View
          entering={SlideInUp.duration(300).springify()}
          className={styles.modal}
        >
          {/* Header */}
          <View className={styles.header}>
            <Text className={styles.title}>Connect a Demo Bank</Text>
            <Pressable onPress={onClose} className={styles.closeButton}>
              <X size={styles.dimensions.closeIconSize} color="#9ca3af" />
            </Pressable>
          </View>

          {/* Subtitle */}
          <Text className={styles.subtitle}>
            Select a demo bank to connect. This will add sample accounts and transactions to your demo.
          </Text>

          {/* Bank list */}
          <ScrollView className={styles.bankList}>
            {institutions.map((institution) => (
              <Pressable
                key={institution.id}
                className={styles.bankButton}
                onPress={() => onSelect(institution.id, institution.name)}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                })}
              >
                <View
                  className={styles.bankLogoWrapper}
                  style={{ backgroundColor: `${institution.color}15` }}
                >
                  <Image
                    source={{ uri: institution.logo }}
                    style={{
                      width: styles.dimensions.logoInnerSize,
                      height: styles.dimensions.logoInnerSize,
                    }}
                    resizeMode="contain"
                  />
                </View>
                <View className={styles.bankInfo}>
                  <Text className={styles.bankName}>{institution.name}</Text>
                  <Text className={styles.bankType}>Demo Bank</Text>
                </View>
                <ChevronRight size={styles.dimensions.chevronSize} color="#9ca3af" />
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

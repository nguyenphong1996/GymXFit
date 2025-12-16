import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

const TYPE_CONFIG = {
  success: {
    backgroundColor: '#E6F4EA',
    borderColor: '#A5DEC0',
    icon: 'checkmark-circle',
    iconColor: '#1F8E4A',
    titleColor: '#14532D',
    messageColor: '#1D4E2F',
  },
  warning: {
    backgroundColor: '#FFF6E5',
    borderColor: '#F7D9A0',
    icon: 'warning',
    iconColor: '#D97706',
    titleColor: '#92400E',
    messageColor: '#B45309',
  },
  error: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
    icon: 'close-circle',
    iconColor: '#DC2626',
    titleColor: '#B91C1C',
    messageColor: '#991B1B',
  },
  info: {
    backgroundColor: '#E8F1FB',
    borderColor: '#BED9FF',
    icon: 'information-circle',
    iconColor: '#1D4ED8',
    titleColor: '#1E40AF',
    messageColor: '#1D4ED8',
  },
};

const ToastBanner = ({
  visible,
  type = 'info',
  title,
  message,
  onHide,
}) => {
  const translateY = useRef(new Animated.Value(-40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: visible ? 0 : -40,
        useNativeDriver: true,
        tension: 70,
        friction: 10,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 160 : 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, opacity, translateY]);

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableWithoutFeedback onPress={onHide}>
        <View
          style={[
            styles.toast,
            {
              backgroundColor: config.backgroundColor,
              borderColor: config.borderColor,
            },
          ]}
        >
          <Ionicons
            name={config.icon}
            size={22}
            color={config.iconColor}
            style={styles.icon}
          />
          <View style={styles.textGroup}>
            {title ? (
              <Text
                style={[styles.title, { color: config.titleColor }]}
              >
                {title}
              </Text>
            ) : null}
            {message ? (
              <Text
                style={[styles.message, { color: config.messageColor }]}
                numberOfLines={4}
                ellipsizeMode="tail"
              >
                {message}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 9999,
    elevation: 10,
    paddingHorizontal: 24,
    paddingTop: '20%',
  },
  toast: {
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
  },
  icon: {
    marginRight: 12,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ToastBanner;

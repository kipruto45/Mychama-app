import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle, ImageStyle, StyleProp } from 'react-native';
import { colors, typography, spacing, borderRadius } from '@/theme';

interface AvatarProps {
  name?: string;
  imageUri?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  imageUri,
  size = 'md',
  style,
}) => {
  const sizeStyles = {
    sm: { width: 32, height: 32, fontSize: typography.fontSize.xs },
    md: { width: 40, height: 40, fontSize: typography.fontSize.sm },
    lg: { width: 56, height: 56, fontSize: typography.fontSize.base },
    xl: { width: 80, height: 80, fontSize: typography.fontSize.lg },
  };

  const currentSize = sizeStyles[size];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const containerStyles: StyleProp<ViewStyle> = [
    styles.container,
    {
      width: currentSize.width,
      height: currentSize.height,
      borderRadius: currentSize.width / 2,
    },
    style,
  ];
  const imageStyles: StyleProp<ImageStyle> = [
    styles.container,
    {
      width: currentSize.width,
      height: currentSize.height,
      borderRadius: currentSize.width / 2,
    },
    style as any,
  ];

  if (imageUri) {
    return (
      <Image
        source={{ uri: imageUri }}
        style={imageStyles}
      />
    );
  }

  return (
    <View style={containerStyles}>
      <Text
        style={[
          styles.text,
          { fontSize: currentSize.fontSize },
        ]}
      >
        {name ? getInitials(name) : '?'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontFamily: typography.fontFamily.semibold,
    color: colors.primary[700],
  },
});

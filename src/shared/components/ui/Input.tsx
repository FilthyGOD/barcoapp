/**
 * Input — campo de texto reutilizable con label, error y íconos.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/core/theme/colors';
import { FontSize, FontWeight } from '@/src/core/theme/typography';
import { BorderRadius, Spacing } from '@/src/core/theme/spacing';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword = false,
  ...props
}: InputProps) {
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState(false);

  const actualSecure = isPassword ? !showPass : props.secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputWrap,
          focused && styles.focused,
          error && styles.error,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={18}
            color={focused ? Colors.primary[500] : Colors.textMuted}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          {...props}
          secureTextEntry={actualSecure}
          onFocus={e => { setFocused(true); props.onFocus?.(e); }}
          onBlur={e => { setFocused(false); props.onBlur?.(e); }}
          style={[styles.input, leftIcon && styles.inputWithLeft]}
          placeholderTextColor={Colors.textMuted}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPass(p => !p)} style={styles.rightIcon}>
            <Ionicons name={showPass ? 'eye-off' : 'eye'} size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    minHeight: 48,
  },
  focused: { borderColor: Colors.primary[500] },
  error:   { borderColor: Colors.danger },
  leftIcon:  { paddingLeft: Spacing[3] },
  rightIcon: { paddingRight: Spacing[3] },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[3],
  },
  inputWithLeft: { paddingLeft: Spacing[2] },
  errorText: { fontSize: FontSize.xs, color: Colors.danger },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted },
});

import * as React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';

export function OTPInput({ length = 6, value, onChange }: { length?: number; value: string; onChange: (v: string) => void }) {
  const refs = React.useRef<(TextInput|null)[]>([]);
  const [focusedIdx, setFocusedIdx] = React.useState<number | null>(null);

  const digits = value.padEnd(length, ' ').split('').slice(0, length);

  const handleChange = (text: string, idx: number) => {
    // handle paste of full OTP
    if (text.length > 1) {
      const clean = text.replace(/\D/g, '').slice(0, length);
      onChange(clean);
      refs.current[Math.min(clean.length, length-1)]?.focus();
      return;
    }
    const clean = text.replace(/\D/g, '').slice(0, 1);
    const arr = value.split('');
    arr[idx] = clean;
    // pad
    const next = arr.join('').replace(/\s/g,'').slice(0, length);
    // if deleted
    if (!clean) {
      const n = value.slice(0, idx) + value.slice(idx+1);
      onChange(n);
      if (idx > 0) refs.current[idx-1]?.focus();
      return;
    }
    onChange(next);
    if (clean && idx < length -1) refs.current[idx+1]?.focus();
  };

  return (
    <View style={{ flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' }}>
      {Array.from({ length }).map((_, i) => (
        <TextInput
          key={i}
          ref={(r) => { refs.current[i] = r; }}
          value={digits[i]?.trim() ?? ''}
          onChangeText={(t)=>handleChange(t,i)}
          keyboardType="number-pad"
          maxLength={i===0? length : 1}
          textContentType="oneTimeCode"
          onFocus={()=>setFocusedIdx(i)}
          onBlur={()=>setFocusedIdx(null)}
          style={[
            styles.box,
            {
              borderColor: focusedIdx===i ? colors.primary : digits[i]?.trim() ? colors.primaryDark : colors.border,
              backgroundColor: digits[i]?.trim() ? colors.primaryMuted : colors.surface,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 48,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});

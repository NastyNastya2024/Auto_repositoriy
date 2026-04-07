import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tariffTypeLabel } from '../context/AppContext';
import type { Tariff } from '../types';
import type { ThemeColors } from '../theme';
import { formatRub } from '../utils/format';

export type TariffCardProps = {
  tariff: Tariff;
  colors: ThemeColors;
  /** Ширина в горизонтальной карусели на главной */
  cardWidth?: number;
  /** В списке админки — без фиксированной высоты */
  compact?: boolean;
  onPressCta?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function TariffCard({
  tariff,
  colors,
  cardWidth,
  compact,
  onPressCta,
  onEdit,
  onDelete,
}: TariffCardProps) {
  const s = useMemo(() => createStyles(colors), [colors]);
  const isAdmin = onEdit != null && onDelete != null;

  return (
    <View
      style={[
        s.card,
        compact && s.cardInList,
        cardWidth != null && { width: cardWidth },
        compact ? { minHeight: undefined } : { minHeight: 272 },
      ]}
    >
      <View style={s.body}>
        <View style={s.head}>
          <View style={s.badgeWrap}>
            <Text style={s.badge}>{tariffTypeLabel(tariff.type)}</Text>
          </View>
          <Text style={s.price}>{formatRub(tariff.priceRub)}</Text>
        </View>
        <Text style={s.name}>{tariff.name}</Text>
        {tariff.description ? <Text style={s.desc}>{tariff.description}</Text> : null}
        {tariff.lessonsCount != null && (
          <Text style={s.meta}>Занятий в пакете: {tariff.lessonsCount}</Text>
        )}
        {tariff.durationMin != null && (
          <Text style={[s.meta, s.metaAfter]}>Длительность: {tariff.durationMin} мин</Text>
        )}
        {isAdmin && !tariff.active ? (
          <Text style={s.adminHiddenHint}>Не показывается на главной</Text>
        ) : null}
      </View>

      {isAdmin ? (
        <>
          <Pressable style={({ pressed }) => [s.cta, pressed && s.ctaPressed]} onPress={onEdit}>
            <Text style={s.ctaText}>Изменить</Text>
          </Pressable>
          <Pressable style={({ pressed }) => [s.dangerBtn, pressed && s.ctaPressed]} onPress={onDelete}>
            <Text style={s.dangerText}>Удалить</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          style={({ pressed }) => [s.cta, pressed && s.ctaPressed]}
          onPress={onPressCta}
        >
          <Text style={s.ctaText}>Отправить заявку</Text>
        </Pressable>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 18,
      paddingHorizontal: 16,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
      marginRight: 12,
      justifyContent: 'space-between',
    },
    cardInList: {
      marginRight: 0,
      marginBottom: 12,
    },
    body: {
      flexShrink: 0,
    },
    head: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    badgeWrap: {
      backgroundColor: colors.chip,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSubtle,
    },
    badge: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
      letterSpacing: 0.15,
    },
    price: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.2,
    },
    name: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
      letterSpacing: -0.2,
    },
    desc: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 21,
      marginBottom: 10,
    },
    meta: {
      fontSize: 13,
      color: colors.textMuted,
      lineHeight: 18,
    },
    metaAfter: {
      marginTop: 6,
    },
    adminHiddenHint: {
      marginTop: 8,
      fontSize: 13,
      fontWeight: '600',
      color: colors.textMuted,
    },
    cta: {
      marginTop: 20,
      backgroundColor: colors.surface,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    ctaPressed: { opacity: 0.85 },
    ctaText: {
      color: colors.primary,
      fontSize: 15,
      fontWeight: '600',
    },
    dangerBtn: {
      marginTop: 10,
      paddingVertical: 8,
      alignItems: 'center',
    },
    dangerText: {
      color: colors.dangerText,
      fontSize: 15,
      fontWeight: '600',
    },
  });
}

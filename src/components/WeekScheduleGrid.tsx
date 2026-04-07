import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { ThemeColors } from '../theme';
import { useTheme } from '../context/ThemeContext';
import type { Booking, Slot, User } from '../types';
import {
  GRID_HOUR_END,
  GRID_HOUR_START,
  HOUR_ROW_PX,
  getBookingForSlot,
  getSlotLayoutPx,
  getStudentName,
  getWeekDayDates,
  slotOverlapsWeek,
} from '../utils/weekCalendar';

const HOURS = Array.from(
  { length: GRID_HOUR_END - GRID_HOUR_START + 1 },
  (_, i) => GRID_HOUR_START + i,
);

const GRID_HEIGHT = (GRID_HOUR_END - GRID_HOUR_START + 1) * HOUR_ROW_PX;

/** Меньше — рисуется раньше (ниже). Закрытые/занятые — поверх свободных. */
function slotPaintOrder(slot: Slot): number {
  switch (slot.status) {
    case 'free':
      return 0;
    case 'completed':
      return 1;
    case 'pending':
    case 'booked':
      return 2;
    case 'blocked':
      return 4;
    case 'cancelled':
      return 1;
    default:
      return 2;
  }
}

function slotZIndex(slot: Slot, booking: Booking | undefined): number {
  if (slot.status === 'blocked') return 50;
  if (slot.status === 'pending' || slot.status === 'booked') return 40;
  if (slot.status === 'completed') return 25;
  if (slot.status === 'free') return 1;
  if (booking && booking.status !== 'cancelled') return 35;
  return 15;
}

type Props = {
  weekStartMonday: Date;
  slots: Slot[];
  bookings: Booking[];
  users: User[];
  mode: 'student' | 'admin';
  currentStudentId?: string;
  onPressFreeSlot: (slot: Slot) => void;
  onPressOwnPending?: (bookingId: string) => void;
  onPressAdminSlot: (slot: Slot) => void;
};

export function WeekScheduleGrid({
  weekStartMonday,
  slots,
  bookings,
  users,
  mode,
  currentStudentId,
  onPressFreeSlot,
  onPressOwnPending,
  onPressAdminSlot,
}: Props) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const styles = useMemo(() => createGridStyles(colors), [colors]);

  const timeColW = 36;
  const dayColW = Math.max((width - timeColW - 24) / 7, 40);
  const days = getWeekDayDates(weekStartMonday);

  const weekSlots = slots.filter((s) => slotOverlapsWeek(s, weekStartMonday));
  const sorted = [...weekSlots].sort((a, b) => {
    const pa = slotPaintOrder(a);
    const pb = slotPaintOrder(b);
    if (pa !== pb) return pa - pb;
    return a.startIso.localeCompare(b.startIso);
  });

  const monthTitle = weekStartMonday.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <View style={styles.wrap}>
      <Text style={styles.monthTitle}>{monthTitle}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          <View style={[styles.headerRow, { paddingLeft: timeColW }]}>
            {days.map((d) => (
              <View key={d.toISOString()} style={[styles.headCell, { width: dayColW }]}>
                <Text style={styles.headDow}>
                  {d.toLocaleDateString('ru-RU', { weekday: 'short' })}
                </Text>
                <Text style={styles.headDay}>{d.getDate()}</Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: timeColW }}>
              {HOURS.map((h) => (
                <View key={h} style={[styles.timeCell, { height: HOUR_ROW_PX }]}>
                  <Text style={styles.timeText}>{h}</Text>
                </View>
              ))}
            </View>

            {days.map((day) => (
              <View
                key={day.toISOString()}
                style={[styles.dayCol, { width: dayColW, height: GRID_HEIGHT }]}
              >
                {HOURS.map((h) => (
                  <View key={h} style={[styles.gridLine, { height: HOUR_ROW_PX }]} />
                ))}
                {sorted.map((slot) => {
                  const layout = getSlotLayoutPx(slot, day);
                  if (!layout) return null;
                  const booking = getBookingForSlot(slot.id, bookings);
                  const isMinePending =
                    mode === 'student' &&
                    !!currentStudentId &&
                    !!booking &&
                    booking.userId === currentStudentId &&
                    booking.status === 'pending';

                  const { bg, border, label, text } = slotAppearance(
                    slot,
                    mode,
                    booking,
                    users,
                    isMinePending,
                    colors,
                  );

                  const onPress = () => {
                    if (mode === 'admin') {
                      onPressAdminSlot(slot);
                      return;
                    }
                    if (slot.status === 'free') {
                      onPressFreeSlot(slot);
                    } else if (isMinePending && onPressOwnPending) {
                      onPressOwnPending(booking!.id);
                    }
                  };

                  const pressable =
                    mode === 'admin' ||
                    slot.status === 'free' ||
                    (isMinePending && !!onPressOwnPending);

                  const zi = slotZIndex(slot, booking);
                  const elevation = zi >= 50 ? 8 : zi >= 40 ? 6 : zi >= 25 ? 4 : zi > 1 ? 2 : 0;
                  const boxStyle = [
                    styles.slotBlock,
                    {
                      top: layout.top,
                      height: layout.height,
                      backgroundColor: bg,
                      borderColor: border,
                      zIndex: zi,
                      elevation,
                    },
                  ];

                  const key = `${slot.id}-${day.getTime()}`;
                  const textStyle = [styles.slotText, { color: text }];
                  const isFree = slot.status === 'free';
                  const slotLabel = (
                    <Text
                      style={[textStyle, isFree && styles.slotTextFree]}
                      numberOfLines={isFree ? 1 : 4}
                      adjustsFontSizeToFit={isFree}
                      minimumFontScale={isFree ? 0.12 : 1}
                      ellipsizeMode={isFree ? 'clip' : 'tail'}
                    >
                      {label}
                    </Text>
                  );

                  const boxStyleWithLayout = [
                    ...boxStyle,
                    isFree && styles.slotBlockFree,
                  ];

                  if (pressable) {
                    return (
                      <Pressable key={key} onPress={onPress} style={boxStyleWithLayout}>
                        {slotLabel}
                      </Pressable>
                    );
                  }

                  return (
                    <View key={key} style={boxStyleWithLayout}>
                      {slotLabel}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function slotAppearance(
  slot: Slot,
  mode: 'student' | 'admin',
  booking: Booking | undefined,
  users: User[],
  isMinePending: boolean,
  colors: ThemeColors,
): { bg: string; border: string; label: string; text: string } {
  if (slot.status === 'blocked') {
    return {
      bg: 'rgba(100, 116, 139, 0.32)',
      border: '#64748b',
      text: '#1e293b',
      label: mode === 'admin' ? 'Закрыто' : 'Занято',
    };
  }
  if (slot.status === 'free') {
    return {
      bg: colors.chipOn,
      border: colors.border,
      text: colors.text,
      label: 'Свободно',
    };
  }
  if (mode === 'student') {
    if (isMinePending) {
      return {
        bg: 'rgba(28, 143, 217, 0.45)',
        border: colors.primary,
        text: '#FFFFFF',
        label: 'Ваша заявка',
      };
    }
    return {
      bg: 'rgba(28, 143, 217, 0.14)',
      border: colors.borderSubtle,
      text: colors.textMuted,
      label: 'Занято',
    };
  }
  if (booking && (slot.status === 'pending' || slot.status === 'booked')) {
    const name = getStudentName(booking.userId, users);
    return {
      bg: colors.primary,
      border: colors.link,
      text: '#FFFFFF',
      label: slot.status === 'pending' ? `${name} (ожид.)` : name,
    };
  }
  if (slot.status === 'completed') {
    return {
      bg: 'rgba(15, 157, 138, 0.14)',
      border: colors.success,
      text: colors.textSecondary,
      label: 'Завершено',
    };
  }
  return {
    bg: colors.surfaceMuted,
    border: colors.border,
    text: colors.text,
    label: slot.status,
  };
}

function createGridStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { marginBottom: 8 },
    monthTitle: {
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 8,
      textTransform: 'capitalize',
      color: colors.text,
    },
    headerRow: { flexDirection: 'row' },
    headCell: { alignItems: 'center', paddingBottom: 6 },
    headDow: { fontSize: 11, color: colors.textMuted },
    headDay: { fontSize: 15, fontWeight: '700', color: colors.text },
    timeCell: { justifyContent: 'flex-start', paddingTop: 0 },
    timeText: { fontSize: 11, color: colors.textMuted },
    dayCol: {
      position: 'relative',
      borderLeftWidth: 1,
      borderColor: 'rgba(28, 143, 217, 0.12)',
      backgroundColor: 'rgba(28, 143, 217, 0.035)',
    },
    gridLine: {
      borderBottomWidth: 1,
      borderColor: 'rgba(28, 143, 217, 0.11)',
    },
    slotBlock: {
      position: 'absolute',
      left: 2,
      right: 2,
      borderRadius: 6,
      borderWidth: 1,
      padding: 4,
      overflow: 'hidden',
    },
    slotBlockFree: {
      justifyContent: 'center',
      alignItems: 'stretch',
    },
    slotText: { fontSize: 10, fontWeight: '600' },
    slotTextFree: {
      width: '100%',
      textAlign: 'center',
    },
  });
}

import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
  const timeColW = 36;
  const dayColW = Math.max((width - timeColW - 24) / 7, 40);
  const days = getWeekDayDates(weekStartMonday);

  const weekSlots = slots.filter((s) => slotOverlapsWeek(s, weekStartMonday));
  const sorted = [...weekSlots].sort((a, b) => a.startIso.localeCompare(b.startIso));

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
                  <View
                    key={h}
                    style={[styles.gridLine, { height: HOUR_ROW_PX }]}
                  />
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

                  const { bg, border, label } = slotAppearance(
                    slot,
                    mode,
                    booking,
                    users,
                    isMinePending,
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

                  const boxStyle = [
                    styles.slotBlock,
                    {
                      top: layout.top,
                      height: layout.height,
                      backgroundColor: bg,
                      borderColor: border,
                    },
                  ];

                  const key = `${slot.id}-${day.getTime()}`;

                  if (pressable) {
                    return (
                      <Pressable key={key} onPress={onPress} style={boxStyle}>
                        <Text style={styles.slotText} numberOfLines={4}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  }

                  return (
                    <View key={key} style={boxStyle}>
                      <Text style={styles.slotText} numberOfLines={4}>
                        {label}
                      </Text>
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
): { bg: string; border: string; label: string } {
  if (slot.status === 'blocked') {
    return {
      bg: '#f9a8d4',
      border: '#db2777',
      label: mode === 'admin' ? 'Закрыто' : 'Занято',
    };
  }
  if (slot.status === 'free') {
    return {
      bg: '#d1fae5',
      border: '#10b981',
      label: 'Свободно',
    };
  }
  if (mode === 'student') {
    if (isMinePending) {
      return {
        bg: '#dbeafe',
        border: '#2563eb',
        label: 'Ваша заявка',
      };
    }
    return {
      bg: '#e5e7eb',
      border: '#9ca3af',
      label: 'Занято',
    };
  }
  if (booking && (slot.status === 'pending' || slot.status === 'booked')) {
    const name = getStudentName(booking.userId, users);
    return {
      bg: '#fbcfe8',
      border: '#db2777',
      label: slot.status === 'pending' ? `${name} (ожид.)` : name,
    };
  }
  if (slot.status === 'completed') {
    return { bg: '#e5e7eb', border: '#6b7280', label: 'Завершено' };
  }
  return { bg: '#f3f4f6', border: '#d1d5db', label: slot.status };
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 8 },
  monthTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  headerRow: { flexDirection: 'row' },
  headCell: { alignItems: 'center', paddingBottom: 6 },
  headDow: { fontSize: 11, color: '#6b7280' },
  headDay: { fontSize: 15, fontWeight: '700' },
  timeCell: { justifyContent: 'flex-start', paddingTop: 0 },
  timeText: { fontSize: 11, color: '#9ca3af' },
  dayCol: {
    position: 'relative',
    borderLeftWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fafafa',
  },
  gridLine: {
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  slotBlock: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: 6,
    borderWidth: 1,
    padding: 4,
    overflow: 'hidden',
    zIndex: 2,
  },
  slotText: { fontSize: 10, fontWeight: '600', color: '#1f2937' },
});

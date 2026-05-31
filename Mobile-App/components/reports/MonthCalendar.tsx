import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { FLEET_COLORS } from '@/constants/theme';

interface Props {
  year: number;
  month: number; // 1-12
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  daysWithData?: number[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function MonthCalendar({ year, month, selectedDay, onSelectDay, daysWithData = [] }: Props) {
  const { width } = useWindowDimensions();
  // 7 cells per row, 32px total horizontal padding, 6px gap between cells
  const cellSize = Math.floor((width - 32 - 6 * 6) / 7);

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const dataSet = new Set(daysWithData);

  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <View style={styles.container}>
      {/* Weekday header */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map(d => (
          <View key={d} style={[styles.headerCell, { width: cellSize }]}>
            <Text style={styles.weekdayText}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Week rows */}
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.weekRow}>
          {week.map((day, di) => {
            if (!day) {
              return <View key={di} style={[styles.cell, { width: cellSize, height: cellSize }]} />;
            }
            const isSelected = day === selectedDay;
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() + 1 &&
              year === today.getFullYear();
            const hasData = dataSet.has(day);

            return (
              <TouchableOpacity
                key={di}
                style={[
                  styles.cell,
                  { width: cellSize, height: cellSize },
                  isSelected && styles.selectedCell,
                  isToday && !isSelected && styles.todayCell,
                ]}
                onPress={() => onSelectDay(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayText,
                    isSelected && styles.selectedDayText,
                    isToday && !isSelected && styles.todayDayText,
                  ]}
                >
                  {day}
                </Text>
                {hasData && (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isSelected ? '#fff' : FLEET_COLORS.primary },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: FLEET_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: FLEET_COLORS.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerCell: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  weekdayText: {
    color: FLEET_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    position: 'relative',
  },
  selectedCell: {
    backgroundColor: FLEET_COLORS.primary,
  },
  todayCell: {
    backgroundColor: FLEET_COLORS.primary + '22',
    borderWidth: 1.5,
    borderColor: FLEET_COLORS.primary,
  },
  dayText: {
    color: FLEET_COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  todayDayText: {
    color: FLEET_COLORS.primary,
    fontWeight: '700',
  },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

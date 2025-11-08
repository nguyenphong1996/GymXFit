// 📁 src/screens/booking/BookScreen.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const H_PADDING = 20;
const CELL_GAP = 8;
const CELL_SIZE = (width - H_PADDING * 2 - CELL_GAP * 6) / 7;

const BookScreen = ({ navigation }) => {
  const [mode, setMode] = useState('month'); // 'month' | 'week'
  const [displayedDate, setDisplayedDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [shiftData, setShiftData] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedShift, setSelectedShift] = useState(null);

  useFocusEffect(
    useCallback(() => {
      StatusBar.setHidden(true, 'fade');
      return () => {
        StatusBar.setHidden(false, 'fade');
      };
    }, []),
  );

  useEffect(() => {
    // Demo dữ liệu ca tập - cần thay bằng API thật ở môi trường production
    setShiftData([
      { id: 1, date: '2025-11-01', shift: 'Ca sáng (06:00 - 09:00)' },
      { id: 2, date: '2025-11-02', shift: 'Ca chiều (14:00 - 17:00)' },
      { id: 3, date: '2025-11-03', shift: 'Ca tối (18:00 - 21:00)' },
    ]);
  }, []);

  const formatDateKey = date => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const monthDays = useMemo(() => {
    const year = displayedDate.getFullYear();
    const month = displayedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    for (let i = 0; i < firstDay.getDay(); i += 1) {
      days.push(null);
    }
    for (let d = 1; d <= lastDay.getDate(); d += 1) {
      days.push(new Date(year, month, d));
    }
    const remainder = days.length % 7;
    if (remainder !== 0) {
      const need = 7 - remainder;
      for (let i = 0; i < need; i += 1) {
        days.push(null);
      }
    }
    return days;
  }, [displayedDate]);

  const weekDays = useMemo(() => {
    const tmp = new Date(displayedDate);
    const start = new Date(tmp);
    start.setDate(tmp.getDate() - tmp.getDay());
    return Array.from({ length: 7 }, (_, index) => {
      const d = new Date(start);
      d.setDate(start.getDate() + index);
      return d;
    });
  }, [displayedDate]);

  const handlePrev = () => {
    const next = new Date(displayedDate);
    if (mode === 'month') {
      next.setMonth(displayedDate.getMonth() - 1);
    } else {
      next.setDate(displayedDate.getDate() - 7);
    }
    setDisplayedDate(next);
  };

  const handleNext = () => {
    const next = new Date(displayedDate);
    if (mode === 'month') {
      next.setMonth(displayedDate.getMonth() + 1);
    } else {
      next.setDate(displayedDate.getDate() + 7);
    }
    setDisplayedDate(next);
  };

  const openDayModal = date => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedShift(null);
    setModalVisible(true);
  };

  const today = new Date();
  const selectedKey = formatDateKey(selectedDate);
  const shiftsForSelected = shiftData.filter(item => item.date === selectedKey);

  const monthLabel = () => {
    const m = displayedDate.getMonth() + 1;
    const y = displayedDate.getFullYear();
    return `Tháng ${m < 10 ? `0${m}` : m} - ${y}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation?.goBack?.()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt lịch huấn luyện viên</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.banner}>
          <View style={styles.bannerBadge}>
            <Icon name="fitness-center" size={18} color="#30C451" />
            <Text style={styles.bannerBadgeText}>GymXFit</Text>
          </View>
          <Text style={styles.bannerTitle}>Chọn ngày &amp; HLV đồng hành</Text>
          <Text style={styles.bannerSubtitle}>
            Lên lịch tập cá nhân hóa, duy trì phong độ và tinh thần luyện tập mỗi ngày.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Huấn luyện viên</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setSelectedTrainer(selectedTrainer)}>
            <Text style={styles.dropdownText}>
              {selectedTrainer || 'Chọn huấn luyện viên phù hợp'}
            </Text>
            <Icon name="keyboard-arrow-down" size={24} color="#102615" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Câu lạc bộ</Text>
          <View style={styles.clubCard}>
            <Icon name="location-on" size={20} color="#30C451" />
            <Text style={styles.clubText}>GymXFit Center</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeaderRow}>
              <TouchableOpacity style={styles.calendarControl} onPress={handlePrev}>
                <Icon name="chevron-left" size={24} color="#102615" />
              </TouchableOpacity>
              <View style={styles.calendarHeaderText}>
                <Text style={styles.calendarTitle}>
                  {mode === 'month'
                    ? monthLabel()
                    : `${weekDays[0].toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                      })} - ${weekDays[6].toLocaleDateString('vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                      })}`}
                </Text>
                <Text style={styles.calendarSubtitle}>
                  {selectedDate.toLocaleDateString('vi-VN', {
                    weekday: 'long',
                    day: '2-digit',
                    month: '2-digit',
                  })}
                </Text>
              </View>
              <TouchableOpacity style={styles.calendarControl} onPress={handleNext}>
                <Icon name="chevron-right" size={24} color="#102615" />
              </TouchableOpacity>
            </View>

            <View style={styles.modeSwitcher}>
              {['month', 'week'].map(value => (
                <TouchableOpacity
                  key={value}
                  style={[styles.modeChip, mode === value && styles.modeChipActive]}
                  onPress={() => setMode(value)}
                >
                  <Text style={[styles.modeChipText, mode === value && styles.modeChipTextActive]}>
                    {value === 'month' ? 'Tháng' : 'Tuần'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.weekdayRow}>
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(label => (
                <Text key={label} style={styles.weekdayLabel}>
                  {label}
                </Text>
              ))}
            </View>

            {mode === 'month' ? (
              <View style={styles.monthGrid}>
                {monthDays.map((date, index) => {
                  const isToday =
                    date &&
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();
                  const isSelected =
                    date &&
                    date.getDate() === selectedDate.getDate() &&
                    date.getMonth() === selectedDate.getMonth() &&
                    date.getFullYear() === selectedDate.getFullYear();
                  return (
                    <TouchableOpacity
                      key={`${date?.toISOString?.() || index}`}
                      activeOpacity={date ? 0.9 : 1}
                      style={[
                        styles.dayCell,
                        !date && styles.dayCellEmpty,
                        isToday && styles.dayCellToday,
                        isSelected && styles.dayCellSelected,
                      ]}
                      onPress={() => openDayModal(date)}
                      disabled={!date}
                    >
                      <Text
                        style={[
                          styles.dayCellText,
                          !date && styles.dayCellTextEmpty,
                          isToday && styles.dayCellTextToday,
                          isSelected && styles.dayCellTextSelected,
                        ]}
                      >
                        {date ? date.getDate() : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.weekRow}>
                {weekDays.map(date => {
                  const isToday = date.toDateString() === today.toDateString();
                  const isSelected = date.toDateString() === selectedDate.toDateString();
                  return (
                    <TouchableOpacity
                      key={date.toISOString()}
                      activeOpacity={0.9}
                      style={[
                        styles.weekCell,
                        isToday && styles.dayCellToday,
                        isSelected && styles.dayCellSelected,
                      ]}
                      onPress={() => openDayModal(date)}
                    >
                      <Text
                        style={[
                          styles.weekCellDay,
                          isSelected && styles.dayCellTextSelected,
                        ]}
                      >
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]}
                      </Text>
                      <Text
                        style={[
                          styles.weekCellDate,
                          isSelected && styles.dayCellTextSelected,
                        ]}
                      >
                        {date.getDate()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.noticeCard}>
            <View style={styles.noticeHeader}>
              <Icon name="event-note" size={20} color="#30C451" />
              <Text style={styles.noticeTitle}>
                Ca tập ngày {selectedDate.toLocaleDateString('vi-VN')}
              </Text>
            </View>

            <View style={styles.noticeContent}>
              {shiftsForSelected.length > 0 ? (
                shiftsForSelected.map(shift => (
                  <TouchableOpacity
                    key={shift.id}
                    activeOpacity={0.9}
                    style={[
                      styles.shiftChip,
                      selectedShift?.id === shift.id && styles.shiftChipActive,
                    ]}
                    onPress={() => setSelectedShift(shift)}
                  >
                    <Icon
                      name="access-time"
                      size={18}
                      color={selectedShift?.id === shift.id ? '#fff' : '#30C451'}
                    />
                    <Text
                      style={[
                        styles.shiftText,
                        selectedShift?.id === shift.id && styles.shiftTextActive,
                      ]}
                    >
                      {shift.shift}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noticeEmpty}>
                  Chưa có ca mở cho ngày này, vui lòng chọn ngày khác hoặc liên hệ HLV để được hỗ trợ.
                </Text>
              )}
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton}>
          <Icon name="event-available" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>
            Xác nhận đặt lịch {selectedShift ? 'với ca đã chọn' : ''}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Ca tập {selectedDate.toLocaleDateString('vi-VN')}
            </Text>
            {shiftsForSelected.length > 0 ? (
              shiftsForSelected.map(shift => (
                <View key={shift.id} style={styles.modalShiftRow}>
                  <Icon name="schedule" size={18} color="#30C451" />
                  <Text style={styles.modalShiftText}>{shift.shift}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.modalEmpty}>Chưa có ca nào cho ngày này.</Text>
            )}

            <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BookScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F9F5',
  },
  header: {
    backgroundColor: '#30C451',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerIcon: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerPlaceholder: {
    width: 32,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  banner: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 22,
    backgroundColor: '#102615',
    padding: 22,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#E6F9ED',
  },
  bannerBadgeText: {
    marginLeft: 6,
    color: '#30C451',
    fontWeight: '700',
    fontSize: 13,
  },
  bannerTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  bannerSubtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#cfe9d6',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: H_PADDING,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102615',
    marginBottom: 12,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#102615',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(48,196,81,0.25)',
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#102615',
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: '#102615',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  clubText: {
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#102615',
  },
  calendarCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#102615',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarControl: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECF7EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarHeaderText: {
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#102615',
  },
  calendarSubtitle: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#5C6F66',
  },
  modeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#ECF7EF',
    borderRadius: 18,
    padding: 4,
    marginTop: 16,
    marginBottom: 12,
  },
  modeChip: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 8,
  },
  modeChipActive: {
    backgroundColor: '#30C451',
    shadowColor: '#30C451',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  modeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#102615',
  },
  modeChipTextActive: {
    color: '#fff',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  weekdayLabel: {
    width: CELL_SIZE,
    textAlign: 'center',
    fontWeight: '700',
    color: '#6F8579',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: CELL_GAP,
    backgroundColor: '#F5FBF7',
  },
  dayCellEmpty: {
    backgroundColor: 'transparent',
  },
  dayCellToday: {
    borderWidth: 2,
    borderColor: '#30C451',
  },
  dayCellSelected: {
    backgroundColor: '#30C451',
    shadowColor: '#30C451',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  dayCellText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#102615',
  },
  dayCellTextToday: {
    color: '#30C451',
  },
  dayCellTextSelected: {
    color: '#fff',
  },
  dayCellTextEmpty: {
    color: 'transparent',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  weekCell: {
    width: CELL_SIZE,
    borderRadius: 16,
    paddingVertical: 12,
    backgroundColor: '#F5FBF7',
    alignItems: 'center',
  },
  weekCellDay: {
    fontSize: 12,
    color: '#6F8579',
    fontWeight: '600',
    marginBottom: 4,
  },
  weekCellDate: {
    fontSize: 18,
    fontWeight: '800',
    color: '#102615',
  },
  noticeCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 18,
    shadowColor: '#102615',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  noticeTitle: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#102615',
  },
  noticeContent: {
    gap: 10,
  },
  shiftChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F5FBF7',
    borderWidth: 1,
    borderColor: 'rgba(48,196,81,0.3)',
    gap: 10,
  },
  shiftChipActive: {
    backgroundColor: '#30C451',
    borderColor: '#30C451',
    shadowColor: '#30C451',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  shiftText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#102615',
  },
  shiftTextActive: {
    color: '#fff',
  },
  noticeEmpty: {
    fontSize: 14,
    color: '#6F8579',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 30,
    marginHorizontal: H_PADDING,
    backgroundColor: '#30C451',
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#30C451',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  primaryButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#102615',
    marginBottom: 14,
  },
  modalShiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  modalShiftText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#102615',
  },
  modalEmpty: {
    fontSize: 14,
    color: '#6F8579',
    fontStyle: 'italic',
  },
  modalButton: {
    marginTop: 20,
    backgroundColor: '#30C451',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});

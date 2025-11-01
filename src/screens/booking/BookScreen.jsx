// 📁 src/screens/booking/BookScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Modal,
  Dimensions,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');
const paddingHorizontal = 16;
const gap = 8;
const boxSize = (width - paddingHorizontal * 2 - gap * 6) / 7; // consistent with PTScheduleScreen

const BookScreen = ({ navigation }) => {
  // --- state ---
  const [mode, setMode] = useState('week'); // 'week' | 'month'
  const [displayedDate, setDisplayedDate] = useState(new Date()); // used to compute month / week
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [shiftData, setShiftData] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedShift, setSelectedShift] = useState(null);

  // --- load fake shifts (demo) ---
  useEffect(() => {
    // mocked backend data (string date keys: YYYY-MM-DD)
    setShiftData([
      { id: 1, date: '2025-11-01', shift: 'Ca sáng (06:00 - 09:00)' },
      { id: 2, date: '2025-11-02', shift: 'Ca chiều (14:00 - 17:00)' },
      { id: 3, date: '2025-11-03', shift: 'Ca tối (18:00 - 21:00)' },
    ]);
  }, []);

  // --- helpers ---
  const formatDateKey = date => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // --- month grid generator (pads head + tail so rows always 7) ---
  const monthDays = useMemo(() => {
    const year = displayedDate.getFullYear();
    const month = displayedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // leading nulls
    for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
    // actual days
    for (let d = 1; d <= lastDay.getDate(); d++)
      days.push(new Date(year, month, d));
    // trailing nulls to complete last row
    const remainder = days.length % 7;
    if (remainder !== 0) {
      const need = 7 - remainder;
      for (let i = 0; i < need; i++) days.push(null);
    }
    return days;
  }, [displayedDate]);

  // --- week days generator (start Sunday) ---
  const weekDays = useMemo(() => {
    const c = new Date(displayedDate);
    const start = new Date(c);
    start.setDate(c.getDate() - c.getDay()); // sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [displayedDate]);

  // --- navigation prev / next ---
  const handlePrev = () => {
    const d = new Date(displayedDate);
    if (mode === 'month') d.setMonth(d.getMonth() - 1);
    else d.setDate(d.getDate() - 7);
    setDisplayedDate(d);
  };
  const handleNext = () => {
    const d = new Date(displayedDate);
    if (mode === 'month') d.setMonth(d.getMonth() + 1);
    else d.setDate(d.getDate() + 7);
    setDisplayedDate(d);
  };

  // --- open modal when press day ---
  const openDayModal = date => {
    if (!date) return;
    setSelectedDate(date);
    setModalVisible(true);
  };

  const today = new Date();
  const selectedKey = formatDateKey(selectedDate);
  const shiftsForSelected = shiftData.filter(s => s.date === selectedKey);

  // --- month title ---
  const getMonthTitle = () => {
    const m = displayedDate.getMonth() + 1;
    const y = displayedDate.getFullYear();
    return `Tháng ${m} - ${y}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt lịch HLV</Text>
        <TouchableOpacity
          onPress={() => setMode(mode === 'month' ? 'week' : 'month')}
        >
          <Text style={{ color: '#fff', fontWeight: '600' }}>
            {mode === 'month' ? 'Tuần' : 'Tháng'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* chọn HLV */}
        <Text style={styles.sectionTitle}>Chọn huấn luyện viên</Text>
        <TouchableOpacity style={styles.dropdown}>
          <Text style={styles.dropdownText}>
            {selectedTrainer || 'Chưa chọn huấn luyện viên'}
          </Text>
          <Icon name="keyboard-arrow-down" size={24} color="#666" />
        </TouchableOpacity>

        {/* câu lạc bộ */}
        <Text style={styles.subLabel}>Câu lạc bộ</Text>
        <View style={styles.clubBox}>
          <Text style={styles.clubText}>GymXFit Center</Text>
        </View>

        {/* month/week navigation */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={handlePrev}>
            <Icon name="chevron-left" size={30} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode(mode === 'month' ? 'week' : 'month')}
          >
            <Text style={styles.monthTitle}>
              {mode === 'month'
                ? getMonthTitle()
                : `${weekDays[0].getDate()} → ${weekDays[6].getDate()} ${weekDays[6].toLocaleString(
                    'vi-VN',
                    { month: 'long' },
                  )}`}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleNext}>
            <Icon name="chevron-right" size={30} color="#000" />
          </TouchableOpacity>
        </View>

        {/* calendar header labels */}
        <View style={styles.calendarHeader}>
          {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(label => (
            <Text key={label} style={styles.calendarHeaderText}>
              {label}
            </Text>
          ))}
        </View>

        {/* calendar body */}
        {mode === 'month' ? (
          <View style={styles.calendarBody}>
            {monthDays.map((d, idx) => {
              const isToday =
                d &&
                d.getDate() === today.getDate() &&
                d.getMonth() === today.getMonth() &&
                d.getFullYear() === today.getFullYear();

              const isSelected =
                d &&
                selectedDate &&
                d.getDate() === selectedDate.getDate() &&
                d.getMonth() === selectedDate.getMonth() &&
                d.getFullYear() === selectedDate.getFullYear();

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.dayBox,
                    isToday && styles.todayBox,
                    isSelected && styles.selectedBox,
                  ]}
                  onPress={() => openDayModal(d)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isToday && styles.todayText,
                      isSelected && styles.selectedText,
                    ]}
                  >
                    {d ? d.getDate() : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.weekRow}>
            {weekDays.map((d, i) => {
              const isSelected =
                d.toDateString() === selectedDate.toDateString();
              const isToday = d.toDateString() === today.toDateString();
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.weekBox, isSelected && styles.selectedBox]}
                  onPress={() => openDayModal(d)}
                >
                  <Text
                    style={[
                      styles.weekLabel,
                      isSelected && styles.selectedText,
                    ]}
                  >
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]}
                  </Text>
                  <Text
                    style={[
                      styles.weekNumber,
                      isSelected && styles.selectedText,
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* notice / shifts for selected date */}
        <View style={styles.noticeContainer}>
          <Text style={styles.noticeTitle}>
            Thông báo / Lịch ngày {selectedDate.toLocaleDateString('vi-VN')}
          </Text>
          <View style={styles.noticeBox}>
            {shiftsForSelected.length > 0 ? (
              shiftsForSelected.map(s => (
                <View key={s.id} style={styles.shiftRow}>
                  <Text style={styles.shiftText}>{s.shift}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noticeEmpty}>
                (Chưa có thông báo / ca cho ngày này)
              </Text>
            )}
          </View>
        </View>

        {/* action button */}
        <TouchableOpacity style={styles.bookButton}>
          <Icon name="event-available" size={20} color="#fff" />
          <Text style={styles.bookButtonText}>Đặt lịch</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Ca ngày {selectedDate.toLocaleDateString('vi-VN')}
            </Text>
            {shiftsForSelected.length > 0 ? (
              shiftsForSelected.map(s => (
                <View key={s.id} style={styles.shiftItem}>
                  <Text style={styles.shiftText}>{s.shift}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noShift}>Chưa có ca nào</Text>
            )}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BookScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    backgroundColor: '#30C451',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { paddingHorizontal, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#30C451',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: { fontSize: 16, color: '#333' },
  subLabel: { color: '#999', fontSize: 14, marginTop: 12, marginBottom: 6 },
  clubBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 45,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  clubText: { fontSize: 15, color: '#333' },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  monthTitle: { fontSize: 16, fontWeight: '700', color: '#000' },

  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  calendarHeaderText: {
    width: boxSize,
    textAlign: 'center',
    fontWeight: '600',
    color: '#30C451',
  },

  calendarBody: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayBox: {
    width: boxSize,
    height: boxSize,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: gap,
    backgroundColor: '#E8F5E9',
  },
  todayBox: { borderWidth: 2, borderColor: '#30C451' },
  selectedBox: { backgroundColor: '#30C451' },
  dayText: { color: '#333', fontSize: 15, fontWeight: '600' },
  todayText: { color: '#30C451', fontWeight: '700' },
  selectedText: { color: '#fff', fontWeight: '700' },

  // week row
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: paddingHorizontal,
  },
  weekBox: {
    width: boxSize,
    height: boxSize * 1.1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
  },
  weekLabel: { fontSize: 12, color: '#666', marginBottom: 6 },
  weekNumber: { fontSize: 16, fontWeight: '700' },

  noticeContainer: { marginTop: 18, marginHorizontal: paddingHorizontal },
  noticeTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#30C451',
    marginBottom: 8,
  },
  noticeBox: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#30C451',
    borderRadius: 12,
    padding: 14,
    minHeight: 60,
  },
  noticeEmpty: { color: '#666', fontStyle: 'italic' },

  shiftRow: { paddingVertical: 8 },
  shiftText: { fontSize: 15, color: '#333' },

  // actions
  bookButton: {
    backgroundColor: '#30C451',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  // modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#30C451',
    marginBottom: 10,
  },
  shiftItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#30C451',
    borderRadius: 10,
    marginBottom: 8,
  },
  shiftText: { fontSize: 16, color: '#333' },
  noShift: { color: '#777', textAlign: 'center', marginVertical: 10 },
  closeButton: {
    marginTop: 10,
    backgroundColor: '#30C451',
    paddingVertical: 10,
    borderRadius: 10,
  },
  closeText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
});

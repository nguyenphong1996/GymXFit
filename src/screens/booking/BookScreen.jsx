import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const boxSize = (width - 16 * 2 - 6 * 6) / 7; // 7 cột, 6 khoảng cách

const BookScreen = ({ navigation }) => {
  const [selectedTrainer] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [displayedMonth, setDisplayedMonth] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      StatusBar.setHidden(true, 'fade');
      return () => {
        StatusBar.setHidden(false, 'fade');
      };
    }, []),
  );

  // 🔄 Chuyển tháng
  const handleMonthChange = direction => {
    const newMonth = new Date(displayedMonth);
    newMonth.setMonth(displayedMonth.getMonth() + direction);
    setDisplayedMonth(newMonth);
  };

  // 🗓️ Dữ liệu tháng
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // CN=0

  // 🔹 Tạo mảng ngày (đảm bảo dòng cuối đủ 7 ô)
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const totalSlots = firstDayOfWeek + daysInMonth;
  const filledSlots = Math.ceil(totalSlots / 7) * 7; // làm tròn lên bội số của 7

  const rows = [];
  for (let i = 0; i < filledSlots; i++) {
    if (i < firstDayOfWeek || i >= totalSlots) rows.push(null);
    else rows.push(i - firstDayOfWeek + 1);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔹 Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đặt lịch huấn luyện viên</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 🔹 Banner */}
        <View style={styles.bannerContainer}>
          <Text style={styles.bannerTitle}>Chọn ngày và huấn luyện viên</Text>
          <Text style={styles.bannerSubtitle}>
            Lên lịch tập luyện nhanh chóng và dễ dàng.
          </Text>
        </View>

        {/* 🔹 Huấn luyện viên */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Huấn luyện viên</Text>
          <TouchableOpacity style={styles.dropdown}>
            <Text style={styles.dropdownText}>
              {selectedTrainer || 'Chưa chọn HLV'}
            </Text>
            <Icon name="keyboard-arrow-down" size={24} color="#555" />
          </TouchableOpacity>
        </View>

        {/* 🔹 Câu lạc bộ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Câu lạc bộ</Text>
          <View style={styles.clubBox}>
            <Text style={styles.clubPlaceholder}>GymXFit Center</Text>
          </View>
        </View>

        {/* 🔹 Lịch */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn ngày tập luyện</Text>

          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => handleMonthChange(-1)}>
              <Icon name="chevron-left" size={30} color="#000" />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              Tháng {month + 1} - {year}
            </Text>
            <TouchableOpacity onPress={() => handleMonthChange(1)}>
              <Icon name="chevron-right" size={30} color="#000" />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarBox}>
            {/* Hàng tiêu đề thứ */}
            <View style={styles.weekHeader}>
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, i) => (
                <Text
                  key={i}
                  style={[
                    styles.weekDay,
                    i === 0 && { color: 'red', fontWeight: '700' },
                  ]}
                >
                  {d}
                </Text>
              ))}
            </View>

            {/* Lưới ngày */}
            <View style={styles.daysGrid}>
              {rows.map((day, index) =>
                day ? (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.dayBox,
                      selectedDate === day && styles.selectedDayBox,
                    ]}
                    onPress={() => setSelectedDate(day)}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        selectedDate === day && styles.selectedDayText,
                      ]}
                    >
                      {day}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View key={index} style={styles.emptyBox} />
                ),
              )}
            </View>
          </View>
        </View>

        {/* 🔹 Nút đặt lịch */}
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Đặt lịch</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BookScreen;

// 🎨 CSS
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  header: {
    backgroundColor: '#30C451',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: { padding: 4 },
  headerRight: { width: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scrollContent: { paddingBottom: 40 },
  bannerContainer: {
    margin: 16,
    backgroundColor: '#30C451',
    borderRadius: 16,
    padding: 24,
    elevation: 3,
  },
  bannerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  bannerSubtitle: { color: '#eafdea', fontSize: 14, marginTop: 6 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102615',
    marginBottom: 10,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  dropdownText: { fontSize: 15, color: '#333' },
  clubBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    elevation: 2,
  },
  clubPlaceholder: { color: '#666', fontSize: 15 },

  // 🔹 Lịch
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: 10,
  },
  monthText: { fontSize: 18, fontWeight: '700', color: '#000' },
  calendarBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0EFE4',
    overflow: 'hidden',
    elevation: 2,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  weekDay: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    width: boxSize,
    textAlign: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 6,
  },
  emptyBox: {
    width: boxSize,
    height: boxSize,
  },
  dayBox: {
    width: boxSize,
    height: boxSize,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#D9F6DF',
  },
  dayText: { fontSize: 15, color: '#000', fontWeight: '600' },
  selectedDayBox: {
    backgroundColor: '#30C451',
  },
  selectedDayText: { color: '#fff' },

  // 🔹 Nút đặt lịch
  bookButton: {
    backgroundColor: '#30C451',
    marginHorizontal: 16,
    marginTop: 30,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
  },
  bookButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

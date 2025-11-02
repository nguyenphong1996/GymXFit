import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const SearchCalendarScreen = ({ navigation }) => {
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [selectedTab, setSelectedTab] = useState('Danh sách lớp');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const MONTH_NAMES = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ];

  const DAY_NAMES = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const getDaysInMonth = (month, year) =>
    new Date(year, month + 1, 0).getDate();

  // 🔹 Tạo mảng các ngày trong tháng với offset để căn đúng thứ
  const generateCalendarDays = (month, year) => {
    const daysInMonth = getDaysInMonth(month, year);
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // CN=0
    const days = [];

    // Thêm các ô trống trước ngày 1
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Thêm các ngày thực tế
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    // Đảm bảo lịch luôn đủ 6 hàng (42 ô)
    while (days.length < 42) {
      days.push(null);
    }

    return days;
  };

  const calendarDays = generateCalendarDays(currentMonth, currentYear);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* 🔹 Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerLeft}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch tập luyện</Text>
        <TouchableOpacity style={styles.headerRight}>
          <Ionicons name="notifications-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 🔹 Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={22}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm lớp hoặc HLV..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.filterButton}>
          <MaterialCommunityIcons
            name="filter-variant"
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* 🔹 Tháng và năm */}
      <View style={styles.monthHeader}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <Ionicons name="chevron-back-outline" size={24} color="#30C451" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>
          {MONTH_NAMES[currentMonth]} - {currentYear}
        </Text>
        <TouchableOpacity onPress={handleNextMonth}>
          <Ionicons name="chevron-forward-outline" size={24} color="#30C451" />
        </TouchableOpacity>
      </View>

      {/* 🔹 Lịch dạng lưới */}
      <View style={styles.calendarContainer}>
        {/* Tên thứ */}
        <View style={styles.weekRow}>
          {DAY_NAMES.map((day, idx) => (
            <Text
              key={idx}
              style={[
                styles.weekDay,
                day === 'CN' ? { color: '#FF3B30', fontWeight: '700' } : null,
              ]}
            >
              {day}
            </Text>
          ))}
        </View>

        {/* Ngày trong tháng */}
        <View style={styles.daysGrid}>
          {calendarDays.map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayCell,
                day === selectedDay && styles.daySelected,
                !day && styles.emptyDay,
              ]}
              onPress={() => day && setSelectedDay(day)}
              disabled={!day}
            >
              {day && (
                <Text
                  style={[
                    styles.dayText,
                    day === selectedDay && styles.dayTextSelected,
                  ]}
                >
                  {day}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 🔹 Tab điều hướng */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            selectedTab === 'Danh sách lớp' && styles.tabActive,
          ]}
          onPress={() => setSelectedTab('Danh sách lớp')}
        >
          <MaterialCommunityIcons
            name="calendar-check-outline"
            size={20}
            color={selectedTab === 'Danh sách lớp' ? '#fff' : '#30C451'}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'Danh sách lớp' && styles.tabTextActive,
            ]}
          >
            Danh sách lớp
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            selectedTab === 'Đã đăng ký' && styles.tabActive,
          ]}
          onPress={() => setSelectedTab('Đã đăng ký')}
        >
          <FontAwesome5
            name="check-circle"
            size={18}
            color={selectedTab === 'Đã đăng ký' ? '#fff' : '#30C451'}
          />
          <Text
            style={[
              styles.tabText,
              selectedTab === 'Đã đăng ký' && styles.tabTextActive,
            ]}
          >
            Đã đăng ký
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🔹 Nội dung lớp học */}
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.classCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.classTitle}>Lớp Yoga Cơ Bản</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Còn chỗ</Text>
            </View>
          </View>

          <View style={styles.cardRow}>
            <MaterialCommunityIcons
              name="calendar-outline"
              size={18}
              color="#30C451"
            />
            <Text style={styles.cardText}>
              Ngày {selectedDay} {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>
          </View>

          <View style={styles.cardRow}>
            <Ionicons name="time-outline" size={18} color="#30C451" />
            <Text style={styles.cardText}>07:00 - 08:30</Text>
          </View>

          <View style={styles.cardRow}>
            <Ionicons name="location-outline" size={18} color="#30C451" />
            <Text style={styles.cardText}>Phòng 202 - GymXFit Center</Text>
          </View>

          <View style={styles.cardRow}>
            <Ionicons name="person-circle-outline" size={18} color="#30C451" />
            <Text style={styles.cardText}>HLV: Nguyễn Văn Nam</Text>
          </View>

          <TouchableOpacity style={styles.registerButton}>
            <Text style={styles.registerButtonText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SearchCalendarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    backgroundColor: '#30C451',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: { padding: 4 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  headerRight: { padding: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    elevation: 3,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, height: 44, color: '#333', fontSize: 15 },
  filterButton: {
    backgroundColor: '#30C451',
    borderRadius: 10,
    padding: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  monthTitle: { fontSize: 16, fontWeight: '700', color: '#102615' },
  calendarContainer: { marginHorizontal: 16, marginTop: 12 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-around' },
  weekDay: {
    width: 40,
    textAlign: 'center',
    fontWeight: '600',
    color: '#102615',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 8,
  },
  dayCell: {
    width: 40,
    height: 40,
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#E7F8EC',
  },
  daySelected: { backgroundColor: '#30C451' },
  emptyDay: { backgroundColor: 'transparent' },
  dayText: { color: '#30C451', fontWeight: '600' },
  dayTextSelected: { color: '#fff' },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 14,
    marginTop: 16,
    paddingVertical: 8,
    elevation: 2,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tabActive: { backgroundColor: '#30C451' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#30C451' },
  tabTextActive: { color: '#fff' },
  content: { padding: 16 },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  classTitle: { fontSize: 16, fontWeight: '700', color: '#102615' },
  statusBadge: {
    backgroundColor: '#34d399',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 3 },
  cardText: { fontSize: 14, color: '#333', marginLeft: 8 },
  registerButton: {
    backgroundColor: '#30C451',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 12,
  },
  registerButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

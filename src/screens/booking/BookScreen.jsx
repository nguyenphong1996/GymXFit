// BookScreen.js — FULL VERSION with YEAR PICKER
import React, {
  useState,
  useRef,
  useMemo,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';

import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  Platform,
  UIManager,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ITEM_WIDTH = 64;
const COLORS = {
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceVariant: '#E7EFE8',
  outline: '#D7E5DB',
  background: '#F5F7F6',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
  tabInactiveBg: '#FFFFFF',
  tabInactiveBorder: '#FFFFFF',
  tabActiveBg: '#145D33',
  tabActiveText: '#FFFFFF',
};

const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const fullDayNames = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const formatDateKey = date => {
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
};

const DayItem = ({ item, isSelected, isToday, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.85}
    onPress={() => onPress(item)}
    style={[
      styles.dayContainer,
      isSelected && styles.selectedDayContainer,
      isToday && !isSelected && styles.todayContainer,
    ]}
  >
    <Text
      style={[
        styles.dayName,
        isSelected && styles.selectedDayName,
        isToday && !isSelected && styles.todayText,
      ]}
    >
      {item.label}
    </Text>
    <Text
      style={[
        styles.dayDate,
        isSelected && styles.selectedDayDate,
        isToday && !isSelected && styles.todayText,
      ]}
    >
      {item.dayNumber}
    </Text>
    {isToday && !isSelected && <View style={styles.todayDot} />}
  </TouchableOpacity>
);

const BookScreen = ({ navigation }) => {
  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const todayRef = useRef(new Date());
  todayRef.current.setHours(0, 0, 0, 0);

  const flatListRef = useRef(null);
  const scrollRef = useRef(null);
  const PTListRef = useRef(null);

  const [tab, setTab] = useState('book');
  const [trainer, setTrainer] = useState(null);
  const [trainerModalVisible, setTrainerModalVisible] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);

  const trainerList = [
    { id: 1, name: 'PT Nguyên' },
    { id: 2, name: 'PT Khánh' },
    { id: 3, name: 'PT Minh' },
  ];

  const [currentMonth, setCurrentMonth] = useState(() => {
    const t = new Date();
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedSlots, setSelectedSlots] = useState({});

  const slots = [
    { label: 'Ca 1 (06:00 - 10:00)', key: 'Ca 1' },
    { label: 'Ca 2 (10:00 - 12:00)', key: 'Ca 2' },
    { label: 'Ca 3 (14:00 - 17:00)', key: 'Ca 3' },
    { label: 'Ca 4 (17:00 - 21:00)', key: 'Ca 4' },
  ];

  const daysInMonthCount = useCallback((year, month) => {
    return new Date(year, month + 1, 0).getDate();
  }, []);

  const daysForMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const total = daysInMonthCount(year, month);

    const arr = [];
    for (let i = 1; i <= total; i++) {
      const d = new Date(year, month, i);
      d.setHours(0, 0, 0, 0);

      arr.push({
        id: `${d.getTime()}`,
        index: i - 1,
        dateObj: d,
        dayNumber: d.getDate(),
        label: dayNames[d.getDay()],
        isToday: isSameDay(d, todayRef.current),
      });
    }
    return arr;
  }, [currentMonth, daysInMonthCount]);

  useEffect(() => {
    const idx = daysForMonth.findIndex(d => isSameDay(d.dateObj, selectedDate));
    if (idx >= 0) {
      setSelectedDateIndex(idx);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: 0.5,
        });
      }, 50);
      return;
    }

    const dayNum = selectedDate.getDate();
    const clamped = Math.min(Math.max(1, dayNum), daysForMonth.length);
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      clamped,
    );
    newDate.setHours(0, 0, 0, 0);
    const newIdx = clamped - 1;
    setSelectedDate(newDate);
    setSelectedDateIndex(newIdx);
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: newIdx,
        animated: true,
        viewPosition: 0.5,
      });
    }, 50);
  }, [daysForMonth, selectedDate, currentMonth]);

  const toggleSlot = useCallback((dateKey, slotKey) => {
    setSelectedSlots(prev => {
      const current = prev[dateKey] || [];
      const updated = current.includes(slotKey)
        ? current.filter(s => s !== slotKey)
        : [...current, slotKey];
      return { ...prev, [dateKey]: updated };
    });
  }, []);

  const handleBook = () => {
    if (!trainer) {
      Alert.alert('Thông báo', 'Hãy chọn Huấn luyện viên trước khi book.');
      return;
    }
    const key = formatDateKey(selectedDate);
    const chosen = selectedSlots[key] || [];
    if (chosen.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 ca để book PT.');
      return;
    }

    Alert.alert(
      'Đã book PT',
      `Ngày ${key}\nCác ca: ${chosen.join(', ')}\nHuấn luyện viên: ${
        trainer.name
      }`,
    );
  };

  // ----------------------------------------------
  // YEAR PICKER LOGIC
  // ----------------------------------------------
  // YEAR PICKER — INFINITE RANGE
  const MIN_YEAR = 1900;
  const MAX_YEAR = 2300; // Có thể đặt 9999 nếu muốn vô hạn thực sự

  const yearList = useMemo(() => {
    return Array.from(
      { length: MAX_YEAR - MIN_YEAR + 1 },
      (_, i) => MIN_YEAR + i,
    );
  }, []);

  const handleSelectYear = year => {
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();

    const maxDay = daysInMonthCount(year, month);
    const clamped = Math.min(day, maxDay);

    const newDate = new Date(year, month, clamped);
    newDate.setHours(0, 0, 0, 0);

    setSelectedDate(newDate);
    setCurrentMonth(new Date(year, month, 1));

    setYearPickerVisible(false);
  };


  // ----------------------------------------------
  // MONTH NAVIGATION
  // ----------------------------------------------
  const goToPreviousMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const newMonthDate = new Date(year, month - 1, 1);
    setCurrentMonth(newMonthDate);

    const desiredDay = selectedDate.getDate();
    const maxDays = daysInMonthCount(
      newMonthDate.getFullYear(),
      newMonthDate.getMonth(),
    );
    const clampedDay = Math.min(desiredDay, maxDays);
    const newSelected = new Date(
      newMonthDate.getFullYear(),
      newMonthDate.getMonth(),
      clampedDay,
    );
    newSelected.setHours(0, 0, 0, 0);
    setSelectedDate(newSelected);
  };

  const goToNextMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const newMonthDate = new Date(year, month + 1, 1);
    setCurrentMonth(newMonthDate);

    const desiredDay = selectedDate.getDate();
    const maxDays = daysInMonthCount(
      newMonthDate.getFullYear(),
      newMonthDate.getMonth(),
    );
    const clampedDay = Math.min(desiredDay, maxDays);
    const newSelected = new Date(
      newMonthDate.getFullYear(),
      newMonthDate.getMonth(),
      clampedDay,
    );
    newSelected.setHours(0, 0, 0, 0);
    setSelectedDate(newSelected);
  };

  const handlePressDay = dayItem => {
    if (dayItem.dateObj.getTime() < todayRef.current.getTime()) {
      Alert.alert('Thông báo', 'Không thể chọn ngày trong quá khứ.');
      return;
    }
    setSelectedDate(dayItem.dateObj);
    setSelectedDateIndex(dayItem.index);
    flatListRef.current?.scrollToIndex({
      index: dayItem.index,
      animated: true,
      viewPosition: 0.5,
    });
  };

  const renderDay = ({ item }) => (
    <DayItem
      item={item}
      isSelected={item.index === selectedDateIndex}
      isToday={item.isToday}
      onPress={handlePressDay}
    />
  );

  const dateKey = formatDateKey(selectedDate);
  const selectedForDay = selectedSlots[dateKey] || [];

  const scrollToPTSection = () => {
    setTimeout(() => {
      PTListRef.current?.measureLayout(scrollRef.current, (x, y) => {
        scrollRef.current?.scrollTo({ y: y - 40, animated: true });
      });
    }, 80);
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={26} color={COLORS.onPrimary} />
        </TouchableOpacity>

        <Text style={styles.greeting}>Book PT</Text>
        <Text style={styles.headerSub}>Chọn ngày, huấn luyện viên & ca</Text>

        {/* TABS */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              tab === 'book' ? styles.tabActive : styles.tabInactive,
            ]}
            onPress={() => setTab('book')}
          >
            <Text
              style={[styles.tabText, tab === 'book' && styles.tabTextActive]}
            >
              Lịch Book PT
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              tab === 'history' ? styles.tabActive : styles.tabInactive,
            ]}
            onPress={() => setTab('history')}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'history' && styles.tabTextActive,
              ]}
            >
              Lịch đã đặt
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* TRAINER SELECTOR */}
      {tab === 'book' && (
        <View style={styles.trainerSelector}>
          <Text style={styles.trainerLabel}>Huấn luyện viên</Text>
          <TouchableOpacity
            style={styles.trainerDropdown}
            onPress={() => setTrainerModalVisible(true)}
          >
            <Text
              style={[
                styles.trainerDropdownText,
                !trainer && styles.trainerPlaceholder,
              ]}
            >
              {trainer ? trainer.name : 'Chọn huấn luyện viên phù hợp'}
            </Text>
            <Icon name="keyboard-arrow-down" size={26} color="#8AAE98" />
          </TouchableOpacity>
        </View>
      )}

      {/* TRAINER MODAL */}
      <Modal
        visible={trainerModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTrainerModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setTrainerModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn huấn luyện viên</Text>

            {trainerList.map(t => (
              <TouchableOpacity
                key={t.id}
                style={styles.modalItem}
                onPress={() => {
                  setTrainer(t);
                  setTrainerModalVisible(false);
                }}
              >
                <Text style={styles.modalItemText}>{t.name}</Text>
                {trainer?.id === t.id && (
                  <Icon name="check" size={20} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setTrainerModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* YEAR PICKER MODAL */}
      <Modal
        visible={yearPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setYearPickerVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setYearPickerVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.yearModalContainer}>
          <View style={styles.yearModalContent}>
            <Text style={styles.modalTitle}>Chọn năm</Text>

            <FlatList
              data={yearList}
              keyExtractor={item => item.toString()}
              style={{ maxHeight: 350 }}
              initialScrollIndex={yearList.indexOf(selectedDate.getFullYear())}
              getItemLayout={(data, index) => ({
                length: 48,
                offset: 48 * index,
                index,
              })}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleSelectYear(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                  {selectedDate.getFullYear() === item && (
                    <Icon name="check" size={20} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setYearPickerVisible(false)}
            >
              <Text style={styles.modalCloseText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* TAB BOOK */}
      {tab === 'book' && (
        <>
          {/* CALENDAR */}
          <View style={styles.calendarSection}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={goToPreviousMonth}
              >
                <Icon name="chevron-left" size={22} color={COLORS.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.monthYearButton}
                onPress={() => setYearPickerVisible(true)}
              >
                <Text style={styles.monthYearText}>
                  {`${
                    fullDayNames[selectedDate.getDay()]
                  }, ${selectedDate.getDate()}/${
                    selectedDate.getMonth() + 1
                  }/${selectedDate.getFullYear()}`}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={goToNextMonth}
              >
                <Icon name="chevron-right" size={22} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            <FlatList
              ref={flatListRef}
              horizontal
              data={daysForMonth}
              keyExtractor={i => i.id}
              renderItem={renderDay}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScrollContainer}
              initialScrollIndex={selectedDateIndex}
              getItemLayout={(data, index) => ({
                length: ITEM_WIDTH + 12,
                offset: (ITEM_WIDTH + 12) * index,
                index,
              })}
            />
          </View>

          <ScrollView
            ref={scrollRef}
            style={styles.body}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            <View style={styles.daySummary}>
              <Text style={styles.daySummaryTitle}>Thông báo quan trọng</Text>
              <Text style={styles.daySummarySubtitle}>
                Hãy chọn giờ book PT phù hợp với bạn.
              </Text>
            </View>

            <View ref={PTListRef} style={styles.slotSection}>
              {slots.map((slot, i) => {
                const active = selectedForDay.includes(slot.key);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.slotCard, active && styles.slotCardSelected]}
                    onPress={() => toggleSlot(dateKey, slot.key)}
                  >
                    <View style={styles.slotCardContent}>
                      <Icon
                        name="schedule"
                        size={18}
                        color={active ? COLORS.onPrimary : COLORS.primary}
                      />
                      <Text
                        style={[
                          styles.slotLabel,
                          active && { color: COLORS.onPrimary },
                        ]}
                      >
                        {slot.label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
              <TouchableOpacity style={styles.saveButton} onPress={handleBook}>
                <Text style={styles.saveButtonText}>Book PT</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </>
      )}

      {/* TAB HISTORY */}
      {tab === 'history' && (
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '700' }}>
            Lịch PT đã đặt
          </Text>
          <Text style={{ marginTop: 10, color: '#555' }}>
            (Hiện chưa có lịch nào được lưu)
          </Text>
        </View>
      )}
    </View>
  );
};

export default BookScreen;

// -----------------------------------------
// STYLES
// -----------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    position: 'relative',
  },

  backButton: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 42 : 62,
    left: 16,
    padding: 6,
  },

  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.onPrimary,
    textAlign: 'center',
  },
  headerSub: {
    marginTop: 6,
    fontSize: 14,
    color: '#C2F0D4',
    textAlign: 'center',
  },

  tabContainer: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  tabInactive: {
    backgroundColor: COLORS.tabInactiveBg,
    borderColor: COLORS.tabInactiveBorder,
  },
  tabActive: {
    backgroundColor: COLORS.tabActiveBg,
    borderColor: COLORS.tabActiveBg,
  },
  tabText: {
    textAlign: 'center',
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  tabTextActive: {
    color: COLORS.tabActiveText,
  },

  trainerSelector: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
  },
  trainerLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    color: COLORS.textPrimary,
  },
  trainerDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6F0EA',
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  trainerDropdownText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  trainerPlaceholder: { color: '#9AAE9E' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },

  modalContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '25%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  yearModalContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '18%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  yearModalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    color: COLORS.textPrimary,
    alignSelf: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalCloseButton: {
    marginTop: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    color: '#777',
    fontWeight: '700',
  },

  calendarSection: {
    backgroundColor: COLORS.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthYearButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  monthYearText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  daysScrollContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  dayContainer: {
    width: ITEM_WIDTH,
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.outline,
    marginRight: 12,
  },
  selectedDayContainer: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  todayContainer: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  dayName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  dayDate: {
    marginTop: 6,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  selectedDayName: { color: '#C2F0D4' },
  selectedDayDate: { color: COLORS.onPrimary },
  todayText: { color: COLORS.primary },

  todayDot: {
    position: 'absolute',
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },

  body: { flex: 1 },

  daySummary: {
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.surface,
  },
  daySummaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  daySummarySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  slotSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  slotCard: {
    backgroundColor: '#F2FBF6',
    borderWidth: 1,
    borderColor: '#CFF1D9',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  slotCardSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  slotCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slotLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.onPrimary,
    fontWeight: '800',
    fontSize: 16,
  },
});

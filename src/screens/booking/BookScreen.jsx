// 📁 src/screens/booking/BookScreen.jsx
// Giao diện đặt lịch PT kiểu MUI: chọn mục tiêu, PT, ngày, và ca 2 giờ.
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { UserContext } from '@context/UserContext';
import {
  getPtAvailability,
  createPtBooking,
  listPtBookings,
  cancelPtBooking,
} from '@api/ptBookingApi';
import { listStaff } from '@api/staffApi';
import { getUserMe } from '@api/userApi';
import {
  normalizeMembership,
  estimatePtPricing,
  calculateDaysLeft,
  formatCurrency,
} from '../../utils/membership';

const SKILL_LABEL_MAP = {
  strength: 'Strength',
  cardio: 'Cardio',
  mobility: 'Mobility',
  yoga: 'Yoga',
  rehab: 'Rehab',
  nutrition: 'Nutrition',
  boxing: 'Boxing',
  kickboxing: 'Kickboxing',
  hiit: 'HIIT',
  pilates: 'Pilates',
  dance: 'Dance',
  zumba: 'Zumba',
};

// Demo PT list – cần thay bằng API list PT khi có
const PT_LIST = [
  {
    id: '671234567890123456789012',
    name: 'PT Minh',
    specialty: 'Strength',
    skills: ['strength', 'cardio'],
    years: 6,
    avatar: null,
  },
  {
    id: '671234567890123456789013',
    name: 'PT Hoa',
    specialty: 'Yoga',
    skills: ['yoga', 'mobility'],
    years: 4,
    avatar: null,
  },
  {
    id: '671234567890123456789014',
    name: 'PT Quân',
    specialty: 'Mobility',
    skills: ['mobility', 'rehab'],
    years: 5,
    avatar: null,
  },
];

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
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
const CALENDAR_COLORS = {
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#C2F0D4',
  surface: '#FFFFFF',
  outline: '#D7E5DB',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
  secondary: '#3A5B4C',
};
const ITEM_WIDTH = 56;
const BOOKING_STATUS_LABEL = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};
const BOOKING_STATUS_COLORS = {
  pending: '#F59E0B',
  confirmed: '#22C55E',
  completed: '#1D4ED8',
  cancelled: '#9CA3AF',
};

const SLOT_LABELS = {
  available: 'Trống',
  booked: 'Đã đặt',
  booked_by_you: 'Bạn đã đặt',
  blocked: 'Bận (lớp)',
  pending_staff: 'Chờ PT',
};

const FIXED_SHIFTS = [
  { id: 1, label: 'Ca 1', time: '08:00 - 10:00', key: '08:00' },
  { id: 2, label: 'Ca 2', time: '10:00 - 12:00', key: '10:00' },
  { id: 3, label: 'Ca 3', time: '12:00 - 14:00', key: '12:00' },
  { id: 4, label: 'Ca 4', time: '14:00 - 16:00', key: '14:00' },
  { id: 5, label: 'Ca 5', time: '16:00 - 18:00', key: '16:00' },
  { id: 6, label: 'Ca 6', time: '18:00 - 20:00', key: '18:00' },
];

const pad2 = n => String(n).padStart(2, '0');
const formatDateKey = date => {
  if (!date) return '';
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const formatMonthYear = date => {
  if (!date) return '';
  return `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
};

const formatDateLabel = date => {
  if (!date) return '--/--';
  try {
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return '--/--';
  }
};

const formatTimeRange = (start, end) => {
  try {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;
    const formatter = value =>
      value.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return endDate ? `${formatter(startDate)} - ${formatter(endDate)}` : formatter(startDate);
  } catch {
    return '--:--';
  }
};

const isSameDay = (dateA, dateB) => {
  if (!dateA || !dateB) return false;
  return (
    dateA.getDate() === dateB.getDate() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getFullYear() === dateB.getFullYear()
  );
};

const buildSlotsForUI = slots =>
  (slots || []).map(slot => ({
    key: slot.key || slot.slotKey,
    status: slot.status,
    bookingId: slot.bookingId,
  }));

const normalizeBookingItem = item => {
  if (!item) return null;
  const startTime =
    item.startTime || item.start_at || item.start || item.start_date || item.date;
  const endTime = item.endTime || item.end_at || item.end;
  const staffName =
    item.staffName ||
    item.trainerName ||
    item.ptName ||
    item.staff?.name ||
    item.pt?.name ||
    'Huấn luyện viên';
  const status = item.status || item.bookingStatus || 'pending';
  return {
    bookingId: item.bookingId || item.id || item._id,
    staffName,
    startTime,
    endTime,
    status,
    slotKey: item.slotKey || item.slot || item.slot_key,
  };
};

function BookScreen({ navigation }) {
  const { user } = useContext(UserContext);
  const userName = user?.name || user?.phone || 'Bạn';
  const [membership, setMembership] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(false);
  const [membershipError, setMembershipError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('Booking');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [trainers, setTrainers] = useState(PT_LIST);
  const [ptLoading, setPtLoading] = useState(false);
  const [ptError, setPtError] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState(PT_LIST[0]);
  const flatListRef = useRef(null);
  const anchorIndex = 5000;
  const anchorDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);
  const [selectedDate, setSelectedDate] = useState(anchorDate);
  const [selectedDateIndex, setSelectedDateIndex] = useState(anchorIndex);
  const [currentMonth, setCurrentMonth] = useState(() => {
    return new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1);
  });
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const infiniteDays = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 10001; i += 1) {
      const offset = i - anchorIndex;
      const date = new Date(anchorDate);
      date.setDate(anchorDate.getDate() + offset);
      arr.push({
        id: `${date.getTime()}-${i}`,
        index: i,
        dateObj: date,
        dayNumber: date.getDate(),
        label: DAY_LABELS[date.getDay()],
        isToday: isSameDay(date, anchorDate),
      });
    }
    return arr;
  }, [anchorDate, anchorIndex]);

  const currentSelectedDate = useMemo(() => {
    const value =
      selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())
        ? selectedDate
        : new Date(selectedDate || Date.now());
    if (Number.isNaN(value.getTime())) return new Date();
    const clone = new Date(value);
    clone.setHours(0, 0, 0, 0);
    return clone;
  }, [selectedDate]);

  const ptPricing = useMemo(() => estimatePtPricing(membership), [membership]);
  const membershipDaysLeft = useMemo(() => calculateDaysLeft(membership), [membership]);
  const remainingPtSessionsLabel = useMemo(() => {
    if (!membership) return '—';
    if (Number.isFinite(ptPricing.remainingSessions)) return `${ptPricing.remainingSessions}`;
    if (Number.isFinite(membership?.remainingSessions)) return `${membership.remainingSessions}`;
    return '—';
  }, [membership, ptPricing]);

  const skillLabel = useCallback(key => {
    if (!key) return 'Other';
    const normalized = key.toString().toLowerCase();
    if (SKILL_LABEL_MAP[normalized]) return SKILL_LABEL_MAP[normalized];
    const humanized = normalized
      .replace(/[_\-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
    return humanized || 'Other';
  }, []);

  const skillOptions = useMemo(() => {
    const dataSource = trainers?.length ? trainers : PT_LIST;
    const skillMap = new Map();
    dataSource.forEach(pt => {
      (pt.skills || []).forEach(skillKey => {
        const label = skillLabel(skillKey);
        if (skillKey && !skillMap.has(skillKey)) {
          skillMap.set(skillKey, label);
        }
      });
    });
    const options = Array.from(skillMap.entries()).map(([key, label]) => ({ key, label }));
    options.sort((a, b) => a.label.localeCompare(b.label, 'en'));
    return [{ key: 'all', label: 'All' }, ...options];
  }, [skillLabel, trainers]);

  const filteredTrainers = useMemo(() => {
    const dataSource = trainers?.length ? trainers : PT_LIST;
    return dataSource.filter(pt => {
      const matchCategory = selectedCategory === 'all' || pt.skills?.includes(selectedCategory);
      return matchCategory;
    });
  }, [trainers, selectedCategory]);

  useEffect(() => {
    if (!filteredTrainers.length) {
      setSelectedTrainer(null);
      return;
    }
    if (!selectedTrainer || !filteredTrainers.some(pt => pt.id === selectedTrainer.id)) {
      setSelectedTrainer(filteredTrainers[0]);
    }
  }, [filteredTrainers, selectedTrainer]);

  useEffect(() => {
    const hasSelected = skillOptions.some(opt => opt.key === selectedCategory);
    if (!hasSelected) {
      setSelectedCategory('all');
    }
  }, [selectedCategory, skillOptions]);

  const staffIdToUse = useMemo(() => selectedTrainer?.id || '', [selectedTrainer]);

  const normalizeSkillKey = useCallback(value => {
    if (!value) return null;
    const lower = value.toString().trim().toLowerCase();
    if (!lower) return null;
    if (lower.includes('yoga')) return 'yoga';
    if (lower.includes('linh') || lower.includes('mobility')) return 'mobility';
    if (lower.includes('phục') || lower.includes('phuc') || lower.includes('rehab')) return 'rehab';
    if (lower.includes('giảm') || lower.includes('giam') || lower.includes('cardio') || lower.includes('fat')) {
      return 'cardio';
    }
    if (lower.includes('tăng') || lower.includes('tang') || lower.includes('strength') || lower.includes('muscle')) {
      return 'strength';
    }
    return lower.replace(/\s+/g, '_');
  }, []);

  const mapStaffToTrainer = useCallback(
    staff => {
      if (!staff) return null;

      // Try to find user object if nested (common in populated responses)
      const userObj =
        staff.userId && typeof staff.userId === 'object'
          ? staff.userId
          : staff.user && typeof staff.user === 'object'
            ? staff.user
            : {};

      const rawSkills =
        staff.skills ||
        staff.skill ||
        staff.skillName ||
        staff.skillList ||
        staff.skill_list ||
        staff.specialties ||
        staff.specializations ||
        staff.category ||
        staff.tags ||
        staff.categories;
      const skillArray = Array.isArray(rawSkills)
        ? rawSkills
        : typeof rawSkills === 'string'
          ? rawSkills.split(',').map(s => s.trim()).filter(Boolean)
          : [];

      const normalizedSkills = skillArray.map(normalizeSkillKey).filter(Boolean);
      const primarySkill =
        normalizedSkills[0] ||
        normalizeSkillKey(staff.specialty) ||
        normalizeSkillKey(staff.title) ||
        null;

      const years =
        staff.yearsOfExperience ||
        staff.experienceYears ||
        staff.experience ||
        staff.experience_years ||
        staff.yoe ||
        0;

      // Resolve avatar from staff root or nested user object
      let avatar =
        staff.avatar ||
        staff.photo ||
        staff.profileImage ||
        staff.avatarUrl ||
        staff.photoUrl ||
        staff.image;
      if (!avatar) {
        avatar =
          userObj.avatar ||
          userObj.photo ||
          userObj.profileImage ||
          userObj.avatarUrl ||
          userObj.image;
      }

      // Resolve name
      const name =
        staff.name ||
        staff.fullName ||
        staff.displayName ||
        staff.username ||
        userObj.name ||
        userObj.fullName ||
        userObj.displayName ||
        'PT';

      // Resolve ID
      const id =
        staff.id ||
        staff._id ||
        staff.staffId ||
        (typeof staff.userId === 'string' ? staff.userId : userObj._id || userObj.id) ||
        staff.staff_id ||
        staff.objectId;

      const trainer = {
        id,
        name,
        specialty:
          staff.specialty ||
          staff.title ||
          staff.position ||
          skillLabel(primarySkill) ||
          'Huấn luyện viên cá nhân',
        skills: normalizedSkills.length
          ? normalizedSkills
          : primarySkill
            ? [primarySkill]
            : ['strength'],
        years: Number(years) || 0,
        avatar,
      };

      return trainer.id ? trainer : null;
    },
    [normalizeSkillKey, skillLabel],
  );

  const fetchStaffList = useCallback(async () => {
    setPtLoading(true);
    setPtError(null);
    try {
      const response = await listStaff({ page: 1, limit: 50 });
      const normalized = (response || []).map(mapStaffToTrainer).filter(Boolean);
      if (normalized.length) {
        setTrainers(normalized);
      } else {
        setPtError('Không tìm thấy PT từ API, hiển thị danh sách mặc định.');
        setTrainers(PT_LIST);
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Không tải được danh sách PT.';
      setPtError(message);
      setTrainers(prev => (prev && prev.length ? prev : PT_LIST));
    } finally {
      setPtLoading(false);
    }
  }, [mapStaffToTrainer]);

  useEffect(() => {
    fetchStaffList();
  }, [fetchStaffList]);

  const fetchMembership = useCallback(async () => {
    setMembershipLoading(true);
    setMembershipError(null);
    try {
      const response = await getUserMe();
      const normalized = normalizeMembership(response?.user || response?.data || response);
      setMembership(normalized);
    } catch (error) {
      setMembership(null);
      setMembershipError(error.message);
    } finally {
      setMembershipLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  const handleSelectTrainer = trainer => {
    setSelectedTrainer(trainer);
  };

  useEffect(() => {
    StatusBar.setHidden(true, 'fade');
    return () => StatusBar.setHidden(false, 'fade');
  }, []);

  const fetchBookings = useCallback(
    async (isPullToRefresh = false) => {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setBookingsLoading(true);
      }
      setBookingsError(null);
      try {
        const response = await listPtBookings({ limit: 50 });
        const raw =
          Array.isArray(response) ? response : response?.data || response?.items || response?.results || [];
        const rawList = Array.isArray(raw) ? raw : [];
        const normalized = rawList.map(normalizeBookingItem).filter(Boolean);
        setBookings(normalized);
      } catch (error) {
        setBookings([]);
        setBookingsError(
          error?.response?.data?.message || error?.message || 'Không tải được lịch đã đặt.',
        );
      } finally {
        setBookingsLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  const monthTitle = useMemo(() => formatMonthYear(currentMonth), [currentMonth]);

  const goToMonth = useCallback(
    delta => {
      const newMonth = new Date(currentMonth);
      newMonth.setMonth(currentMonth.getMonth() + delta);
      const targetDate = new Date(newMonth.getFullYear(), newMonth.getMonth(), 1);
      const diffDays = Math.floor((targetDate - anchorDate) / (1000 * 60 * 60 * 24));
      const newIndex = anchorIndex + diffDays;

      if (newIndex >= 0 && newIndex < infiniteDays.length) {
        setCurrentMonth(targetDate);
        setSelectedDate(targetDate);
        setSelectedDateIndex(newIndex);
        flatListRef.current?.scrollToIndex({
          index: newIndex,
          animated: true,
          viewPosition: 0.5,
        });
      }
    },
    [anchorDate, anchorIndex, currentMonth, infiniteDays],
  );

  const goToPreviousMonth = useCallback(() => goToMonth(-1), [goToMonth]);
  const goToNextMonth = useCallback(() => goToMonth(1), [goToMonth]);

  const handleGoToday = useCallback(() => {
    const todayClone = new Date(anchorDate);
    setSelectedDate(todayClone);
    setSelectedDateIndex(anchorIndex);
    setCurrentMonth(new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1));
    flatListRef.current?.scrollToIndex({
      index: anchorIndex,
      animated: true,
      viewPosition: 0.5,
    });
  }, [anchorDate, anchorIndex]);

  const handlePressDay = useCallback(day => {
    setSelectedDate(day.dateObj);
    setSelectedDateIndex(day.index);
    setCurrentMonth(new Date(day.dateObj.getFullYear(), day.dateObj.getMonth(), 1));
  }, []);

  const handleRefresh = useCallback(() => {
    if (selectedTab === 'Lịch PT đã đặt') {
      fetchBookings(true);
    }
  }, [selectedTab, fetchBookings]);

  useEffect(() => {
    if (selectedTab === 'Lịch PT đã đặt') {
      fetchBookings();
    }
  }, [selectedTab, fetchBookings]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!staffIdToUse || !currentSelectedDate) {
        setSlots([]);
        return;
      }

      // Nếu là PT mẫu (dummy) thì trả về dữ liệu giả để không gọi API lỗi
      const isDummy = PT_LIST.some(pt => pt.id === staffIdToUse);
      if (isDummy) {
        setSlots(buildSlotsForUI([
          { key: '08:00', status: 'available' },
          { key: '10:00', status: 'booked' },
          { key: '14:00', status: 'available' },
          { key: '16:00', status: 'available' },
        ]));
        return;
      }

      setLoadingSlots(true);
      try {
        const dateStr = formatDateKey(currentSelectedDate);
        console.log('Fetching slots for:', staffIdToUse, dateStr);
        const res = await getPtAvailability(staffIdToUse, dateStr);
        console.log('Slots response:', JSON.stringify(res, null, 2));
        
        let rawSlots = [];
        if (res && Array.isArray(res.slots)) {
          rawSlots = res.slots;
        } else if (typeof res?.slots === 'number') {
          // Handle bitmask format (e.g. slots: 3 -> binary 011 -> index 0 and 1 available)
          const mask = res.slots;
          rawSlots = FIXED_SHIFTS.reduce((acc, shift, index) => {
            if ((mask & (1 << index)) !== 0) {
              acc.push({ key: shift.key, status: 'available' });
            }
            return acc;
          }, []);
          console.log('Converted bitmask', mask, 'to slots:', rawSlots);
        } else if (res && Array.isArray(res)) {
          rawSlots = res;
        } else {
          console.log('Unexpected slots format:', res);
        }

        setSlots(buildSlotsForUI(rawSlots));
      } catch (error) {
        console.log('Error fetching slots:', error);
        // Không alert lỗi để tránh spam popup khi lướt
        setSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [staffIdToUse, currentSelectedDate]);

  const bookSlot = async slot => {
    if (!staffIdToUse) {
      Alert.alert('Thiếu PT', 'Vui lòng chọn hoặc nhập mã PT.');
      return;
    }
    setBookingLoading(true);
    try {
      await createPtBooking({
        staffId: staffIdToUse,
        date: formatDateKey(currentSelectedDate),
        slotKey: slot.key,
      });
      Alert.alert('Đã gửi yêu cầu', 'Booking đang chờ PT xác nhận.');
      const res = await getPtAvailability(staffIdToUse, formatDateKey(currentSelectedDate));
      setSlots(buildSlotsForUI(res?.slots || []));
    } catch (error) {
      Alert.alert(
        'Đặt lịch thất bại',
        error?.response?.data?.message || error?.message || 'Không thể đặt ca này.',
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelBooking = useCallback(
    booking => {
      if (!booking?.bookingId) return;
      Alert.alert('Hủy lịch', 'Bạn chắc chắn muốn hủy lịch này?', [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy lịch',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelPtBooking(booking.bookingId);
              fetchBookings();
            } catch (error) {
              Alert.alert(
                'Không thể hủy',
                error?.response?.data?.message || error?.message || 'Vui lòng thử lại.',
              );
            }
          },
        },
      ]);
    },
    [fetchBookings],
  );

  const renderCalendar = () => (
    <View style={styles.calendarSection}>
      <View style={styles.calendarHeader}>
        <TouchableOpacity style={styles.calendarNavButton} onPress={goToPreviousMonth}>
          <Icon name="chevron-left" size={22} color={CALENDAR_COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.monthYearButton}
          activeOpacity={0.9}
          onPress={handleGoToday}
        >
          <Text style={styles.monthYearText}>{monthTitle}</Text>
          <Icon name="event" size={18} color={CALENDAR_COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.calendarNavButton} onPress={goToNextMonth}>
          <Icon name="chevron-right" size={22} color={CALENDAR_COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        horizontal
        data={infiniteDays}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          const isSelected = item.index === selectedDateIndex;
          const isToday = item.isToday;
          return (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => handlePressDay(item)}
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
        }}
        initialScrollIndex={anchorIndex}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH + 8,
          offset: (ITEM_WIDTH + 8) * index,
          index,
        })}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.daysScrollContainer}
        onScrollToIndexFailed={info => {
          const wait = new Promise(resolve => setTimeout(resolve, 300));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
              viewPosition: 0.5,
            });
          });
        }}
        windowSize={11}
        maxToRenderPerBatch={20}
        removeClippedSubviews={false}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => navigation?.goBack?.()}>
          <Icon name="arrow-back" size={24} color={CALENDAR_COLORS.onPrimary} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Xin chào, {userName} 👋</Text>
          <Text style={styles.headerSubtitle}>Đặt lịch tập luyện hôm nay</Text>
        </View>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'Booking' && styles.activeTab]}
            onPress={() => setSelectedTab('Booking')}
          >
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={18}
              color={selectedTab === 'Booking' ? CALENDAR_COLORS.primary : CALENDAR_COLORS.onPrimary}
            />
            <Text style={[styles.tabText, selectedTab === 'Booking' && styles.activeTabText]}>
              Đặt PT
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'Lịch PT đã đặt' && styles.activeTab]}
            onPress={() => setSelectedTab('Lịch PT đã đặt')}
          >
            <MaterialCommunityIcons
              name="calendar-check"
              size={18}
              color={
                selectedTab === 'Lịch PT đã đặt'
                  ? CALENDAR_COLORS.primary
                  : CALENDAR_COLORS.onPrimary
              }
            />
            <Text
              style={[styles.tabText, selectedTab === 'Lịch PT đã đặt' && styles.activeTabText]}
            >
              Lịch PT đã đặt
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          selectedTab === 'Lịch PT đã đặt'
            ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[CALENDAR_COLORS.primary]}
                tintColor={CALENDAR_COLORS.primary}
              />
            )
            : undefined
        }
      >
        <View style={styles.membershipCard}>
          <View style={styles.membershipHeaderRow}>
            <View>
              <Text style={styles.membershipLabel}>Gói hiện tại</Text>
              <Text style={styles.membershipName}>{membership?.packageName || 'Chưa có gói'}</Text>
            </View>
            {membershipLoading ? (
              <ActivityIndicator size="small" color={CALENDAR_COLORS.primary} />
            ) : (
              <View
                style={[
                  styles.statusPill,
                  membership ? styles.statusPillActive : styles.statusPillInactive,
                ]}
              >
                <Text
                  style={[
                    styles.statusPillText,
                    membership ? styles.statusPillTextActive : styles.statusPillTextInactive,
                  ]}
                >
                  {membership?.status || 'Chưa kích hoạt'}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.membershipMetaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Còn lại</Text>
              <Text style={styles.metaValue}>
                {membershipDaysLeft != null ? `${membershipDaysLeft} ngày` : '—'}
              </Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Lượt PT</Text>
              <Text style={styles.metaValue}>{remainingPtSessionsLabel}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Ước tính phí</Text>
              <Text style={styles.metaValue}>{formatCurrency(ptPricing.price)}</Text>
            </View>
          </View>
          <Text style={styles.metaNote}>{ptPricing.note}</Text>
          {membershipError ? <Text style={styles.membershipError}>{membershipError}</Text> : null}
        </View>

        {selectedTab === 'Booking' ? (
          <>
            {renderCalendar()}

            <View style={[styles.section, styles.sectionCategory]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {skillOptions.map(cat => {
                  const active = cat.key === selectedCategory;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedCategory(cat.key)}
                      activeOpacity={0.9}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Danh sách PT</Text>
                {ptLoading ? <ActivityIndicator size="small" color="#30C451" /> : null}
              </View>
              {ptError ? <Text style={styles.errorText}>{ptError}</Text> : null}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.ptRow}
                snapToAlignment="start"
                decelerationRate="fast"
              >
                {filteredTrainers.length ? (
                  filteredTrainers.map(pt => {
                    const active = selectedTrainer?.id === pt.id;
                    return (
                      <TouchableOpacity
                        key={pt.id}
                        style={[styles.ptCard, active && styles.ptCardActive]}
                        onPress={() => handleSelectTrainer(pt)}
                        activeOpacity={0.9}
                      >
                        <View style={styles.ptAvatarContainer}>
                          {pt.avatar ? (
                            <Image source={{ uri: pt.avatar }} style={styles.ptAvatar} />
                          ) : (
                            <View style={[styles.ptAvatar, styles.ptAvatarPlaceholder]}>
                              <Icon name="person" size={30} color="#30C451" />
                            </View>
                          )}
                          {active && (
                            <View style={styles.activeBadge}>
                              <Icon name="check" size={12} color="#fff" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.ptName} numberOfLines={1}>
                          {pt.name}
                        </Text>
                        <Text style={styles.ptSkillText} numberOfLines={1}>
                          {pt.skills?.length ? skillLabel(pt.skills[0]) : 'Personal Trainer'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={[styles.emptyCard, { width: 200 }]}>
                    <Icon name="search-off" size={26} color="#9ca3af" />
                    <Text style={styles.emptyTitle}>No PT found</Text>
                  </View>
                )}
              </ScrollView>
            </View>

            <View style={styles.section}>
              {loadingSlots ? (
                <ActivityIndicator color="#30C451" />
              ) : !staffIdToUse || !currentSelectedDate ? (
                <Text style={styles.emptySlots}>Chọn PT và ngày để xem ca trống.</Text>
              ) : (
                <>
                  <View style={styles.priceHint}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                      <Text style={styles.priceHintLabel}>Ước tính phí</Text>
                      <Text style={styles.priceHintValue}>{formatCurrency(ptPricing.price)}</Text>
                    </View>
                    <Text style={styles.priceHintNote}>{ptPricing.note}</Text>
                  </View>
                  <View style={styles.slotGrid}>
                    {FIXED_SHIFTS.map(shift => {
                      const slotData = slots.find(s => s.key === shift.key) || {};
                      const status = slotData.status || 'unavailable';
                      const isAvailable = status === 'available';
                      const isMine = status === 'booked_by_you';
                      const isBlocked = status === 'blocked' || status === 'booked';
                      const displayStatus = SLOT_LABELS[status] || (status === 'unavailable' ? 'Không có lịch' : status);

                      return (
                        <TouchableOpacity
                          key={shift.id}
                          style={[
                            styles.slotCard,
                            isAvailable && styles.slotAvailable,
                            isMine && styles.slotMine,
                            isBlocked && styles.slotBlocked,
                            status === 'unavailable' && styles.slotUnavailable,
                          ]}
                          activeOpacity={isAvailable ? 0.85 : 1}
                          onPress={() => isAvailable && bookSlot({ key: shift.key })}
                          disabled={!isAvailable}
                        >
                          <View>
                            <Text style={[styles.slotLabel, isAvailable && styles.slotLabelActive]}>
                              {shift.label}
                            </Text>
                            <Text style={[styles.slotTime, isAvailable && styles.slotTimeActive]}>
                              {shift.time}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.slotStatus,
                              isAvailable && styles.slotStatusActive,
                              isMine && styles.slotStatusMine,
                            ]}
                          >
                            {displayStatus}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
              {bookingLoading && <ActivityIndicator style={{ marginTop: 8 }} color="#30C451" />}
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Lịch PT đã đặt</Text>
              {bookingsLoading && !refreshing ? (
                <ActivityIndicator size="small" color={CALENDAR_COLORS.primary} />
              ) : null}
            </View>
            {bookingsError ? <Text style={styles.errorText}>{bookingsError}</Text> : null}
            {bookingsLoading && !refreshing ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator color={CALENDAR_COLORS.primary} />
              </View>
            ) : bookings.length === 0 ? (
              <View style={[styles.emptyCard, { alignItems: 'center' }]}>
                <MaterialCommunityIcons
                  name="calendar-blank-outline"
                  size={48}
                  color={CALENDAR_COLORS.outline}
                />
                <Text style={styles.emptyTitle}>Chưa có lịch</Text>
                <Text style={styles.emptySubtitle}>Các booking PT của bạn sẽ hiển thị tại đây.</Text>
              </View>
            ) : (
              bookings.map((booking, idx) => {
                const key = booking.bookingId || `${booking.startTime || 'booking'}-${idx}`;
                const statusColor =
                  BOOKING_STATUS_COLORS[booking.status] || CALENDAR_COLORS.textSecondary;
                const canCancel =
                  booking.status !== 'cancelled' &&
                  booking.status !== 'completed';
                return (
                  <View key={key} style={styles.bookingCard}>
                    <View style={styles.bookingCardHeader}>
                      <View style={styles.bookingTitleRow}>
                        <MaterialCommunityIcons
                          name="account-circle"
                          size={24}
                          color={CALENDAR_COLORS.primary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.bookingTrainer}>{booking.staffName}</Text>
                          {booking.slotKey ? (
                            <Text style={styles.bookingSlot}>Ca: {booking.slotKey}</Text>
                          ) : null}
                        </View>
                      </View>
                      <View
                        style={[
                          styles.bookingStatusBadge,
                          { backgroundColor: `${statusColor}22`, borderColor: statusColor },
                        ]}
                      >
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <Text style={[styles.bookingStatusText, { color: statusColor }]}>
                          {BOOKING_STATUS_LABEL[booking.status] || booking.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.bookingInfoRow}>
                      <Icon name="event" size={18} color={CALENDAR_COLORS.secondary} />
                      <Text style={styles.bookingInfoText}>{formatDateLabel(booking.startTime)}</Text>
                    </View>
                    <View style={styles.bookingInfoRow}>
                      <Icon name="schedule" size={18} color={CALENDAR_COLORS.secondary} />
                      <Text style={styles.bookingInfoText}>
                        {formatTimeRange(booking.startTime, booking.endTime)}
                      </Text>
                    </View>

                    {canCancel ? (
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelBooking(booking)}
                      >
                        <Text style={styles.cancelButtonText}>Hủy lịch</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
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
    backgroundColor: CALENDAR_COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: CALENDAR_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
  },
  headerContent: {
    marginTop: 12,
    gap: 6,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: CALENDAR_COLORS.onPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: CALENDAR_COLORS.primaryContainer,
    fontWeight: '600',
  },
  tabContainer: {
    marginTop: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 4,
    borderRadius: 16,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: CALENDAR_COLORS.surface,
  },
  tabText: { color: CALENDAR_COLORS.onPrimary, fontWeight: '700' },
  activeTabText: { color: CALENDAR_COLORS.primary },
  membershipCard: {
    marginTop: 12,
    marginHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: CALENDAR_COLORS.outline,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  membershipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  membershipLabel: {
    color: CALENDAR_COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  membershipName: {
    color: CALENDAR_COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusPillActive: {
    backgroundColor: '#E6F9ED',
  },
  statusPillInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPillTextActive: {
    color: CALENDAR_COLORS.primary,
  },
  statusPillTextInactive: {
    color: '#B91C1C',
  },
  membershipMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  metaItem: { flex: 1 },
  metaLabel: { color: CALENDAR_COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  metaValue: { color: CALENDAR_COLORS.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 4 },
  metaDivider: { width: 1, height: 24, backgroundColor: CALENDAR_COLORS.outline },
  metaNote: { marginTop: 10, color: CALENDAR_COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  membershipError: { marginTop: 6, color: '#B91C1C', fontSize: 12 },
  priceHint: {
    marginTop: 4,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  priceHintLabel: { color: CALENDAR_COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  priceHintValue: { color: CALENDAR_COLORS.textPrimary, fontSize: 16, fontWeight: '800' },
  priceHintNote: { marginTop: 4, color: CALENDAR_COLORS.textSecondary, fontSize: 12 },
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
    marginTop: 12,
    paddingHorizontal: 20,
  },
  sectionCategory: {
    marginTop: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102615',
    marginBottom: 10,
  },
  categoryScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 0,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d0d7de',
    marginRight: 10,
  },
  chipActive: {
    backgroundColor: '#30C451',
    borderColor: '#30C451',
  },
  chipText: { color: '#102615', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#d0d7de',
    color: '#0f172a',
  },
  helperText: {
    display: 'none',
  },
  errorText: {
    marginTop: 6,
    color: '#ef4444',
    fontSize: 12,
  },
  ptRow: {
    marginTop: 12,
    paddingRight: 20,
    gap: 12,
  },
  ptCard: {
    width: 120,
    borderRadius: 16,
    padding: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 12,
    shadowColor: '#102615',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  ptCardActive: {
    borderColor: '#30C451',
    backgroundColor: '#F0FDF4',
  },
  ptAvatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  ptAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  ptAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E6F9ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#30C451',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  ptName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#102615',
    textAlign: 'center',
    marginBottom: 2,
  },
  ptSkillText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  emptyCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  emptyTitle: { marginTop: 6, fontWeight: '700', color: '#0f172a' },
  emptySubtitle: { marginTop: 4, color: '#6b7280', fontSize: 12, textAlign: 'center' },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    marginTop: 12,
    gap: 10,
  },
  bookingCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  bookingTrainer: { fontSize: 16, fontWeight: '700', color: CALENDAR_COLORS.textPrimary },
  bookingSlot: { marginTop: 4, fontSize: 13, color: CALENDAR_COLORS.textSecondary },
  bookingStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  bookingStatusText: { fontSize: 12, fontWeight: '700' },
  bookingInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bookingInfoText: { fontSize: 14, color: CALENDAR_COLORS.textSecondary, fontWeight: '600' },
  cancelButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#F87171',
  },
  cancelButtonText: { color: '#B91C1C', fontWeight: '700', fontSize: 13 },
  calendarSection: {
    backgroundColor: CALENDAR_COLORS.surface,
    paddingTop: 20,
    paddingBottom: 20,
    marginTop: 0,
    borderBottomWidth: 1,
    borderBottomColor: CALENDAR_COLORS.outline,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  calendarNavButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CALENDAR_COLORS.primaryContainer,
  },
  calendarHeaderText: {
    alignItems: 'center',
    gap: 6,
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: CALENDAR_COLORS.primaryContainer,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '700',
    color: CALENDAR_COLORS.textPrimary,
  },
  daysScrollContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  dayContainer: {
    width: ITEM_WIDTH,
    height: 72,
    borderRadius: 16,
    backgroundColor: CALENDAR_COLORS.surface,
    borderWidth: 2,
    borderColor: CALENDAR_COLORS.outline,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedDayContainer: {
    backgroundColor: CALENDAR_COLORS.primary,
    borderColor: CALENDAR_COLORS.primary,
    shadowColor: CALENDAR_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  todayContainer: {
    borderColor: CALENDAR_COLORS.primary,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    color: CALENDAR_COLORS.textSecondary,
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 20,
    fontWeight: '700',
    color: CALENDAR_COLORS.textPrimary,
  },
  selectedDayName: {
    color: CALENDAR_COLORS.primaryContainer,
  },
  selectedDayDate: {
    color: CALENDAR_COLORS.onPrimary,
  },
  todayText: {
    color: CALENDAR_COLORS.primary,
  },
  todayDot: {
    position: 'absolute',
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: CALENDAR_COLORS.primary,
  },
  slotGrid: {
    flexDirection: 'column',
    gap: 12,
    marginTop: 8,
  },
  slotCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotAvailable: {
    backgroundColor: '#fff',
    borderColor: '#30C451',
    shadowColor: '#30C451',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  slotMine: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  slotBlocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    opacity: 0.7,
  },
  slotUnavailable: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  slotLabel: { fontSize: 16, fontWeight: '800', color: '#64748B', marginBottom: 4 },
  slotLabelActive: { color: '#102615' },
  slotTime: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  slotTimeActive: { color: '#475569' },
  slotStatus: { fontSize: 13, fontWeight: '700', color: '#94A3B8' },
  slotStatusActive: { color: '#30C451' },
  slotStatusMine: { color: '#15803D' },
  emptySlots: { color: '#6b7280', fontSize: 14 },
});

// SearchCalendarScreen.js - Material Design 3 Redesign
import React, {
  useState,
  useContext,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StatusBar,
  FlatList,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  UIManager,
  Dimensions,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { UserContext } from '@context/UserContext';
import {
  searchAvailableClasses,
  enrollInClass,
  getMyEnrollments,
  cancelEnrollment,
} from '@api/classesApi';
import { useRoute } from '@react-navigation/native';

// Material Design 3 Colors
const MATERIAL_COLORS = {
  primary: '#1F8E4A',
  onPrimary: '#FFFFFF',
  primaryContainer: '#C2F0D4',
  background: '#F5F7F6',
  surface: '#FFFFFF',
  surfaceVariant: '#E7EFE8',
  outline: '#D7E5DB',
  textPrimary: '#10241A',
  textSecondary: '#47614F',
  secondary: '#3A5B4C',
  error: '#B3261E',
  success: '#34D399',
  warning: '#F59E0B',
};

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const dayNames = [
  'CN',
  'T2',
  'T3',
  'T4',
  'T5',
  'T6',
  'T7',
];

const fullDayNames = [
  'Chủ Nhật',
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
];

const monthNames = [
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

const ITEM_WIDTH = 56; // Compact size for modern design
const WINDOW_WIDTH = Dimensions.get('window').width;

/* Helpers */
const formatMonthYear = date => {
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${month} ${year}`;
};

const formatTimeRange = (start, end) => {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const formatter = value =>
      value.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${formatter(startDate)} - ${formatter(endDate)}`;
  } catch {
    return '--:--';
  }
};

const formatDateLabel = date => {
  try {
    const d = new Date(date);
    return `${fullDayNames[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}`;
  } catch {
    return '--/--';
  }
};

const formatDateTime = date => {
  try {
    if (!date) return null;
    const d = new Date(date);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} lúc ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  } catch {
    return null;
  }
};

const isSameDay = (date1, date2) => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/* Skeleton Loading Component */
const SkeletonCard = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonHeader}>
      <View style={[styles.skeletonBox, { width: '60%', height: 20 }]} />
      <View style={[styles.skeletonBox, { width: 80, height: 24, borderRadius: 12 }]} />
    </View>
    <View style={[styles.skeletonBox, { width: '40%', height: 14, marginTop: 8 }]} />
    <View style={[styles.skeletonBox, { width: '70%', height: 14, marginTop: 12 }]} />
    <View style={[styles.skeletonBox, { width: '50%', height: 14, marginTop: 8 }]} />
    <View style={[styles.skeletonBox, { width: '55%', height: 14, marginTop: 8 }]} />
  </View>
);

/* Day item renderer - Compact & Modern */
const DayItem = ({ item, isSelected, isToday, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.7}
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

/* Class card - Modern Material Design 3 */
const ClassCard = ({ item, onSelect }) => {
  const instructorName = item.instructor?.name || 'Đang cập nhật';
  const timeRange = formatTimeRange(item.startTime, item.endTime);
  const remainingSpots = item.availableSpots || 0;
  const totalSpots = item.capacity || 0;
  const spotsPercentage = totalSpots > 0 ? (remainingSpots / totalSpots) * 100 : 0;

  return (
    <TouchableOpacity
      style={styles.classCard}
      activeOpacity={0.8}
      onPress={() => onSelect(item)}
    >
      {/* Header with badges */}
      <View style={styles.classCardHeader}>
        <View style={styles.classCardTitleRow}>
          <MaterialCommunityIcons 
            name="dumbbell" 
            size={24} 
            color={MATERIAL_COLORS.primary} 
          />
          <Text style={styles.className} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
        
        {item.isEnrolledByUser && (
          <View style={[styles.badge, styles.badgeSuccess]}>
            <Icon name="check-circle" size={14} color="#fff" />
            <Text style={styles.badgeText}>Đã đăng ký</Text>
          </View>
        )}
        {item.isFull && !item.isEnrolledByUser && (
          <View style={[styles.badge, styles.badgeWarning]}>
            <Icon name="block" size={14} color="#fff" />
            <Text style={styles.badgeText}>Đã đầy</Text>
          </View>
        )}
      </View>

      {/* Category tag */}
      {(item.subcategory || item.category) && (
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>
            {item.subcategory || item.category}
          </Text>
        </View>
      )}

      {/* Info rows */}
      <View style={styles.classInfoContainer}>
        <View style={styles.classInfoRow}>
          <Icon name="schedule" size={18} color={MATERIAL_COLORS.secondary} />
          <Text style={styles.classInfoText}>{timeRange}</Text>
        </View>

        {item.location && (
          <View style={styles.classInfoRow}>
            <Icon name="location-on" size={18} color={MATERIAL_COLORS.secondary} />
            <Text style={styles.classInfoText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
        )}

        <View style={styles.classInfoRow}>
          <Icon name="person-outline" size={18} color={MATERIAL_COLORS.secondary} />
          <Text style={styles.classInfoText} numberOfLines={1}>
            {instructorName}
          </Text>
        </View>
      </View>

      {/* Spots indicator */}
      <View style={styles.spotsContainer}>
        <View style={styles.spotsProgressBar}>
          <View 
            style={[
              styles.spotsProgressFill, 
              { 
                width: `${spotsPercentage}%`,
                backgroundColor: spotsPercentage > 50 
                  ? MATERIAL_COLORS.success 
                  : spotsPercentage > 20 
                    ? MATERIAL_COLORS.warning 
                    : MATERIAL_COLORS.error
              }
            ]} 
          />
        </View>
        <Text style={styles.spotsText}>
          {remainingSpots > 0 
            ? `Còn ${remainingSpots}/${totalSpots} chỗ` 
            : 'Không còn chỗ'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

/* Enrollment Card - Modern Design */
const EnrollmentCard = ({ enrollment, onPress }) => {
  const classInfo = enrollment.class || {};
  const timeRange = formatTimeRange(classInfo.startTime, classInfo.endTime);
  const dateLabel = formatDateLabel(classInfo.startTime || enrollment.enrolledAt);
  
  // Determine status
  const hasCheckedIn = !!enrollment.checkInTime;
  const hasCheckedOut = !!enrollment.checkOutTime;
  const isCompleted = hasCheckedIn && hasCheckedOut;

  return (
    <TouchableOpacity 
      style={styles.enrollmentCard}
      activeOpacity={0.8}
      onPress={() => onPress(enrollment)}
    >
      {/* Status badge */}
      <View style={styles.enrollmentBadgeRow}>
        <View style={[
          styles.enrollmentBadge,
          isCompleted && { backgroundColor: '#D4F4DD' },
        ]}>
          <Icon 
            name={isCompleted ? 'check-circle' : hasCheckedIn ? 'access-time' : 'event-available'} 
            size={16} 
            color={isCompleted ? MATERIAL_COLORS.success : hasCheckedIn ? '#2196F3' : MATERIAL_COLORS.primary} 
          />
          <Text style={[
            styles.enrollmentBadgeText,
            isCompleted && { color: MATERIAL_COLORS.success },
            hasCheckedIn && !hasCheckedOut && { color: '#2196F3' },
          ]}>
            {isCompleted ? 'Đã hoàn thành' : hasCheckedIn ? 'Đang diễn ra' : 'Đã đăng ký'}
          </Text>
        </View>
      </View>

      {/* Class info */}
      <View style={styles.enrollmentContent}>
        <View style={styles.enrollmentTitleRow}>
          <MaterialCommunityIcons 
            name="calendar-check" 
            size={24} 
            color={MATERIAL_COLORS.primary} 
          />
          <Text style={styles.enrollmentClassName} numberOfLines={2}>
            {classInfo.name || 'Lớp học'}
          </Text>
          <Icon name="chevron-right" size={24} color={MATERIAL_COLORS.textSecondary} />
        </View>

        <View style={styles.enrollmentInfoContainer}>
          <View style={styles.classInfoRow}>
            <Icon name="event" size={18} color={MATERIAL_COLORS.secondary} />
            <Text style={styles.classInfoText}>{dateLabel}</Text>
          </View>

          <View style={styles.classInfoRow}>
            <Icon name="schedule" size={18} color={MATERIAL_COLORS.secondary} />
            <Text style={styles.classInfoText}>{timeRange}</Text>
          </View>

          {classInfo.location && (
            <View style={styles.classInfoRow}>
              <Icon name="location-on" size={18} color={MATERIAL_COLORS.secondary} />
              <Text style={styles.classInfoText} numberOfLines={1}>
                {classInfo.location}
              </Text>
            </View>
          )}

          {classInfo.instructor?.name && (
            <View style={styles.classInfoRow}>
              <Icon name="person-outline" size={18} color={MATERIAL_COLORS.secondary} />
              <Text style={styles.classInfoText} numberOfLines={1}>
                {classInfo.instructor.name}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const SearchCalendarScreen = () => {
  const route = useRoute();
  const { user } = useContext(UserContext);
  const userName = user?.name || user?.phone || 'Bạn';
  const highlightClassId = route.params?.highlightClassId;

  // Tabs & search
  const [selectedTab, setSelectedTab] = useState('Danh sách lớp');

  // Classes/enrollments
  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentsError, setEnrollmentsError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // modal / enroll
  const [selectedClass, setSelectedClass] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [yearPickerVisible, setYearPickerVisible] = useState(false);
  
  // Enrollment detail modal
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [enrollmentModalVisible, setEnrollmentModalVisible] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Calendar state - Infinite scroll with month navigation
  const flatListRef = useRef(null);
  const todayRef = useRef(new Date());
  const anchorIndex = 5000; // Middle index for infinite scroll
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Generate infinite days array
  const infiniteDays = useMemo(() => {
    const arr = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 10001; i++) {
      const offset = i - anchorIndex;
      const date = new Date(today);
      date.setDate(today.getDate() + offset);
      
      arr.push({
        id: `${date.getTime()}-${i}`,
        index: i,
        dateObj: date,
        dayNumber: date.getDate(),
        label: dayNames[date.getDay()],
        isToday: isSameDay(date, todayRef.current),
      });
    }
    return arr;
  }, []);

  const [selectedDateIndex, setSelectedDateIndex] = useState(anchorIndex);

  /* API helpers */
  const normalizeClasses = useCallback((items = []) => {
    if (!Array.isArray(items)) return [];
    return items.map(item => ({
      ...item,
      classId: item.classId || item.id || item._id || item.class_id,
    }));
  }, []);

  const fetchClasses = useCallback(
    async (dateObj, isPullToRefresh = false) => {
      if (!dateObj) return;
      
      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setClassesLoading(true);
      }
      setClassesError(null);

      const startDate = new Date(dateObj);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(dateObj);
      endDate.setHours(23, 59, 59, 999);

      try {
        const response = await searchAvailableClasses({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          sortBy: 'startTime',
          sortOrder: 'asc',
          limit: 50,
        });

        if (response?.success) {
          setClasses(normalizeClasses(response.data));
        } else {
          setClasses([]);
          setClassesError(response?.message || 'Không tìm thấy lớp phù hợp.');
        }
      } catch (error) {
        setClasses([]);
        setClassesError(error.message);
      } finally {
        setClassesLoading(false);
        setRefreshing(false);
      }
    },
    [normalizeClasses],
  );

  const fetchEnrollments = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) {
      setRefreshing(true);
    } else {
      setEnrollmentsLoading(true);
    }
    setEnrollmentsError(null);
    
    try {
      const response = await getMyEnrollments({ status: 'active', limit: 50 });
      if (response?.success) setEnrollments(response.data || []);
      else {
        setEnrollments([]);
        setEnrollmentsError(response?.message || 'Bạn chưa đăng ký lớp nào.');
      }
    } catch (error) {
      setEnrollments([]);
      setEnrollmentsError(error.message);
    } finally {
      setEnrollmentsLoading(false);
      setRefreshing(false);
    }
  }, []);

  /* initial fetch */
  useEffect(() => {
    fetchClasses(selectedDate);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* refetch on selectedTab change or date change */
  useEffect(() => {
    if (selectedTab === 'Danh sách lớp') {
      fetchClasses(selectedDate);
    } else {
      fetchEnrollments();
    }
  }, [selectedTab, selectedDate, fetchClasses, fetchEnrollments]);

  /* Pull to refresh */
  const handleRefresh = useCallback(() => {
    if (selectedTab === 'Danh sách lớp') {
      fetchClasses(selectedDate, true);
    } else {
      fetchEnrollments(true);
    }
  }, [selectedTab, selectedDate, fetchClasses, fetchEnrollments]);

  /* Calendar navigation */
  const goToPreviousMonth = useCallback(() => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
    
    // Find first day of new month in infinite array
    const targetDate = new Date(newMonth);
    targetDate.setDate(1);
    const diffDays = Math.floor((targetDate - todayRef.current) / (1000 * 60 * 60 * 24));
    const newIndex = anchorIndex + diffDays;
    
    if (newIndex >= 0 && newIndex < infiniteDays.length) {
      setSelectedDateIndex(newIndex);
      setSelectedDate(infiniteDays[newIndex].dateObj);
      flatListRef.current?.scrollToIndex({
        index: newIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [currentMonth, infiniteDays]);

  const goToNextMonth = useCallback(() => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
    
    // Find first day of new month in infinite array
    const targetDate = new Date(newMonth);
    targetDate.setDate(1);
    const diffDays = Math.floor((targetDate - todayRef.current) / (1000 * 60 * 60 * 24));
    const newIndex = anchorIndex + diffDays;
    
    if (newIndex >= 0 && newIndex < infiniteDays.length) {
      setSelectedDateIndex(newIndex);
      setSelectedDate(infiniteDays[newIndex].dateObj);
      flatListRef.current?.scrollToIndex({
        index: newIndex,
        animated: true,
        viewPosition: 0.5,
      });
    }
  }, [currentMonth, infiniteDays]);

  const handleYearPickerOpen = useCallback(() => {
    setYearPickerVisible(true);
  }, []);

  const handleYearSelect = useCallback((year) => {
    const newMonth = new Date(currentMonth);
    newMonth.setFullYear(year);
    setCurrentMonth(newMonth);
    setYearPickerVisible(false);
    
    // Jump to first day of selected month/year
    const targetDate = new Date(newMonth);
    targetDate.setDate(1);
    const diffDays = Math.floor((targetDate - todayRef.current) / (1000 * 60 * 60 * 24));
    const newIndex = anchorIndex + diffDays;
    
    if (newIndex >= 0 && newIndex < infiniteDays.length) {
      setSelectedDateIndex(newIndex);
      setSelectedDate(infiniteDays[newIndex].dateObj);
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: newIndex,
          animated: true,
          viewPosition: 0.5,
        });
      }, 100);
    }
  }, [currentMonth, infiniteDays]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
    setSelectedDateIndex(anchorIndex);
    flatListRef.current?.scrollToIndex({
      index: anchorIndex,
      animated: true,
      viewPosition: 0.5,
    });
  }, []);

  const handlePressDay = useCallback((day) => {
    setSelectedDate(day.dateObj);
    setSelectedDateIndex(day.index);
    setCurrentMonth(new Date(day.dateObj.getFullYear(), day.dateObj.getMonth(), 1));
  }, []);

  /* Handle enrollment detail */
  const handleSelectEnrollment = useCallback((enrollment) => {
    setSelectedEnrollment(enrollment);
    setEnrollmentModalVisible(true);
  }, []);

  const handleCloseEnrollmentModal = useCallback(() => {
    setEnrollmentModalVisible(false);
    setSelectedEnrollment(null);
  }, []);

  const handleCancelEnrollment = useCallback(async () => {
    if (!selectedEnrollment) return;
    
    Alert.alert(
      'Xác nhận hủy đăng ký',
      'Bạn có chắc chắn muốn hủy đăng ký lớp học này?',
      [
        {
          text: 'Không',
          style: 'cancel',
        },
        {
          text: 'Hủy đăng ký',
          style: 'destructive',
          onPress: async () => {
            setIsCancelling(true);
            try {
              const response = await cancelEnrollment(selectedEnrollment.enrollmentId);
              Alert.alert(
                'Thành công',
                response?.message || 'Đã hủy đăng ký lớp học.',
              );
              handleCloseEnrollmentModal();
              await fetchEnrollments();
            } catch (error) {
              Alert.alert('Hủy đăng ký thất bại', error.message);
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ],
    );
  }, [selectedEnrollment, handleCloseEnrollmentModal, fetchEnrollments]);

  /* handle class modal */
  const handleSelectClass = useCallback(classItem => {
    setSelectedClass(classItem);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedClass(null);
  }, []);

  const handleConfirmEnroll = useCallback(async () => {
    if (!selectedClass) return;
    const canEnroll = !selectedClass.isEnrolledByUser && !selectedClass.isFull;
    if (!canEnroll) {
      handleCloseModal();
      return;
    }
    setIsEnrolling(true);
    try {
      const response = await enrollInClass(selectedClass.classId);
      Alert.alert(
        'Thành công',
        response?.message || 'Bạn đã đăng ký lớp thành công.',
      );
      handleCloseModal();
      await fetchClasses(selectedDate);
      await fetchEnrollments();
    } catch (error) {
      Alert.alert('Đăng ký thất bại', error.message);
    } finally {
      setIsEnrolling(false);
    }
  }, [selectedClass, handleCloseModal, fetchClasses, fetchEnrollments, selectedDate]);

  /* highlight class from route params - scroll to class date first */
  useEffect(() => {
    if (!highlightClassId) return;
    
    let isMounted = true;
    
    // Function to scroll to class date and open modal
    const scrollToClassDate = async () => {
      try {
        // Fetch all classes in next 90 days to find the target class
        const response = await searchAvailableClasses({
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        });
        
        if (!isMounted) return;
        
        if (response?.success && response.data) {
          const allClasses = normalizeClasses(response.data);
          const target = allClasses.find(c => c.classId === highlightClassId);
          
          if (target && target.startTime) {
            const classDate = new Date(target.startTime);
            classDate.setHours(0, 0, 0, 0);
            
            // Calculate index in infiniteDays for this date
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const diffTime = classDate.getTime() - today.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            const targetIndex = anchorIndex + diffDays;
            
            // Make sure index is within bounds
            if (targetIndex >= 0 && targetIndex < infiniteDays.length) {
              if (!isMounted) return;
              
              // Update states to scroll to the date
              setSelectedDate(classDate);
              setSelectedDateIndex(targetIndex);
              setCurrentMonth(new Date(classDate.getFullYear(), classDate.getMonth(), 1));
              
              // Scroll calendar
              setTimeout(() => {
                if (!isMounted) return;
                flatListRef.current?.scrollToIndex({
                  index: targetIndex,
                  animated: true,
                  viewPosition: 0.5,
                });
              }, 100);
              
              // The fetchClasses will be triggered by the selectedDate change effect
              // After classes are loaded, select the target class
              setTimeout(() => {
                if (!isMounted) return;
                handleSelectClass(target);
              }, 800);
            }
          }
        }
      } catch (error) {
        console.error('Error scrolling to class date:', error);
      }
    };
    
    scrollToClassDate();
    
    return () => {
      isMounted = false;
    };
  }, [highlightClassId, anchorIndex, infiniteDays.length, normalizeClasses, handleSelectClass]);

  /* Renderers for lists */
  const renderClassItem = ({ item }) => (
    <ClassCard item={item} onSelect={handleSelectClass} />
  );
  const renderEnrollmentItem = ({ item }) => (
    <EnrollmentCard enrollment={item} onPress={handleSelectEnrollment} />
  );

  const currentMonthYear = formatMonthYear(currentMonth);
  
  // Generate years for picker (current year ± 10 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={MATERIAL_COLORS.primary} barStyle="light-content" />

      {/* Modern Header with gradient effect */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greeting}>Xin chào, {userName} 👋</Text>
              <Text style={styles.headerSubtitle}>
                Đặt lịch tập luyện hôm nay
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'Danh sách lớp' && styles.activeTab,
            ]}
            onPress={() => setSelectedTab('Danh sách lớp')}
          >
            <Icon 
              name="list" 
              size={20} 
              color={selectedTab === 'Danh sách lớp' ? MATERIAL_COLORS.primary : MATERIAL_COLORS.onPrimary} 
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === 'Danh sách lớp' && styles.activeTabText,
              ]}
            >
              Danh sách lớp
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'Lịch đã đặt' && styles.activeTab,
            ]}
            onPress={() => setSelectedTab('Lịch đã đặt')}
          >
            <Icon 
              name="event-available" 
              size={20} 
              color={selectedTab === 'Lịch đã đặt' ? MATERIAL_COLORS.primary : MATERIAL_COLORS.onPrimary} 
            />
            <Text
              style={[
                styles.tabText,
                selectedTab === 'Lịch đã đặt' && styles.activeTabText,
              ]}
            >
              Lịch đã đặt
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modern Calendar Section - Only show for "Danh sách lớp" */}
      {selectedTab === 'Danh sách lớp' && (
        <View style={styles.calendarSection}>
          {/* Month Navigation */}
          <View style={styles.calendarHeader}>
          <TouchableOpacity 
            style={styles.calendarNavButton}
            onPress={goToPreviousMonth}
          >
            <Icon name="chevron-left" size={24} color={MATERIAL_COLORS.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.monthYearButton}
            onPress={handleYearPickerOpen}
          >
            <Text style={styles.monthYearText}>{currentMonthYear}</Text>
            <Icon name="event" size={18} color={MATERIAL_COLORS.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.calendarNavButton}
            onPress={goToNextMonth}
          >
            <Icon name="chevron-right" size={24} color={MATERIAL_COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Infinite Scroll Days */}
        <FlatList
          ref={flatListRef}
          horizontal
          data={infiniteDays}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <DayItem
              item={item}
              isSelected={item.index === selectedDateIndex}
              isToday={item.isToday}
              onPress={handlePressDay}
            />
          )}
          initialScrollIndex={anchorIndex}
          getItemLayout={(_, index) => ({
            length: ITEM_WIDTH + 8,
            offset: (ITEM_WIDTH + 8) * index,
            index,
          })}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysScrollContainer}
          onScrollToIndexFailed={(info) => {
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.5,
              });
            });
          }}
          windowSize={11}
          maxToRenderPerBatch={15}
          removeClippedSubviews={Platform.OS === 'android'}
        />
        </View>
      )}

      {/* List Container with Pull to Refresh */}
      <View style={styles.listContainer}>
        {selectedTab === 'Danh sách lớp' ? (
          <>
            {classesLoading && !refreshing ? (
              <ScrollView contentContainerStyle={styles.skeletonContainer}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </ScrollView>
            ) : classesError ? (
              <ScrollView 
                contentContainerStyle={styles.emptyStateContainer}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[MATERIAL_COLORS.primary]}
                    tintColor={MATERIAL_COLORS.primary}
                  />
                }
              >
                <MaterialCommunityIcons 
                  name="alert-circle-outline" 
                  size={64} 
                  color={MATERIAL_COLORS.outline} 
                />
                <Text style={styles.emptyTitle}>Không tìm thấy lớp học</Text>
                <Text style={styles.emptyText}>{classesError}</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => fetchClasses(selectedDate)}
                >
                  <Text style={styles.retryButtonText}>Thử lại</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <FlatList
                data={classes}
                keyExtractor={item => item.classId}
                renderItem={renderClassItem}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[MATERIAL_COLORS.primary]}
                    tintColor={MATERIAL_COLORS.primary}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyStateContainer}>
                    <MaterialCommunityIcons 
                      name="calendar-blank-outline" 
                      size={64} 
                      color={MATERIAL_COLORS.outline} 
                    />
                    <Text style={styles.emptyTitle}>Chưa có lớp học</Text>
                    <Text style={styles.emptyText}>
                      Không có lớp nào trong ngày {formatDateLabel(selectedDate)}
                    </Text>
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        ) : (
          <>
            {enrollmentsLoading && !refreshing ? (
              <ScrollView contentContainerStyle={styles.skeletonContainer}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </ScrollView>
            ) : enrollmentsError ? (
              <ScrollView 
                contentContainerStyle={styles.emptyStateContainer}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[MATERIAL_COLORS.primary]}
                    tintColor={MATERIAL_COLORS.primary}
                  />
                }
              >
                <MaterialCommunityIcons 
                  name="calendar-remove-outline" 
                  size={64} 
                  color={MATERIAL_COLORS.outline} 
                />
                <Text style={styles.emptyTitle}>Chưa có lịch đặt</Text>
                <Text style={styles.emptyText}>{enrollmentsError}</Text>
              </ScrollView>
            ) : (
              <FlatList
                data={enrollments}
                keyExtractor={item => item.enrollmentId}
                renderItem={renderEnrollmentItem}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[MATERIAL_COLORS.primary]}
                    tintColor={MATERIAL_COLORS.primary}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyStateContainer}>
                    <MaterialCommunityIcons 
                      name="calendar-check-outline" 
                      size={64} 
                      color={MATERIAL_COLORS.outline} 
                    />
                    <Text style={styles.emptyTitle}>Chưa có lịch đặt</Text>
                    <Text style={styles.emptyText}>
                      Bạn chưa đăng ký lớp nào. Hãy chọn lớp phù hợp!
                    </Text>
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>

      {/* Modern Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable
            style={styles.modalContent}
            onPress={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Xác nhận đăng ký</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedClass?.name || 'Lớp học'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={handleCloseModal}
              >
                <Icon name="close" size={24} color={MATERIAL_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <View style={styles.modalBody}>
              <View style={styles.modalInfoCard}>
                <View style={styles.modalInfoRow}>
                  <View style={styles.modalIconContainer}>
                    <Icon name="event" size={20} color={MATERIAL_COLORS.primary} />
                  </View>
                  <View style={styles.modalInfoTextContainer}>
                    <Text style={styles.modalInfoLabel}>Ngày học</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedClass ? formatDateLabel(selectedClass.startTime) : '--/--'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalInfoRow}>
                  <View style={styles.modalIconContainer}>
                    <Icon name="schedule" size={20} color={MATERIAL_COLORS.primary} />
                  </View>
                  <View style={styles.modalInfoTextContainer}>
                    <Text style={styles.modalInfoLabel}>Thời gian</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedClass
                        ? formatTimeRange(selectedClass.startTime, selectedClass.endTime)
                        : '--:--'}
                    </Text>
                  </View>
                </View>

                {selectedClass?.location && (
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalIconContainer}>
                      <Icon name="location-on" size={20} color={MATERIAL_COLORS.primary} />
                    </View>
                    <View style={styles.modalInfoTextContainer}>
                      <Text style={styles.modalInfoLabel}>Địa điểm</Text>
                      <Text style={styles.modalInfoValue}>{selectedClass.location}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.modalInfoRow}>
                  <View style={styles.modalIconContainer}>
                    <Icon name="person-outline" size={20} color={MATERIAL_COLORS.primary} />
                  </View>
                  <View style={styles.modalInfoTextContainer}>
                    <Text style={styles.modalInfoLabel}>Huấn luyện viên</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedClass?.instructor?.name || 'Đang cập nhật'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Status Note */}
              {(selectedClass?.isEnrolledByUser || selectedClass?.isFull) && (
                <View style={[
                  styles.modalNote,
                  selectedClass?.isEnrolledByUser 
                    ? styles.modalNoteSuccess 
                    : styles.modalNoteWarning
                ]}>
                  <Icon 
                    name={selectedClass?.isEnrolledByUser ? 'check-circle' : 'error'} 
                    size={20} 
                    color={selectedClass?.isEnrolledByUser ? MATERIAL_COLORS.success : MATERIAL_COLORS.warning} 
                  />
                  <Text style={styles.modalNoteText}>
                    {selectedClass?.isEnrolledByUser
                      ? 'Bạn đã đăng ký lớp học này'
                      : 'Lớp đã đầy, vui lòng chọn lớp khác'}
                  </Text>
                </View>
              )}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSecondary]}
                onPress={handleCloseModal}
              >
                <Text style={styles.modalSecondaryText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalPrimary,
                  (selectedClass?.isEnrolledByUser || selectedClass?.isFull) &&
                    styles.modalButtonDisabled,
                ]}
                onPress={handleConfirmEnroll}
                disabled={
                  isEnrolling ||
                  selectedClass?.isEnrolledByUser ||
                  selectedClass?.isFull
                }
              >
                {isEnrolling ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Icon name="check" size={20} color="#fff" />
                    <Text style={styles.modalPrimaryText}>Xác nhận đăng ký</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Year Picker Modal */}
      <Modal
        transparent
        animationType="fade"
        visible={yearPickerVisible}
        onRequestClose={() => setYearPickerVisible(false)}
      >
        <Pressable 
          style={styles.yearPickerOverlay} 
          onPress={() => setYearPickerVisible(false)}
        >
          <View style={styles.yearPickerContent}>
            <View style={styles.yearPickerHeader}>
              <Text style={styles.yearPickerTitle}>Chọn năm</Text>
              <TouchableOpacity 
                onPress={() => setYearPickerVisible(false)}
                style={styles.yearPickerClose}
              >
                <Icon name="close" size={24} color={MATERIAL_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.yearPickerScroll}
              showsVerticalScrollIndicator={false}
            >
              {years.map(year => (
                <TouchableOpacity
                  key={year}
                  style={[
                    styles.yearItem,
                    year === currentMonth.getFullYear() && styles.yearItemActive
                  ]}
                  onPress={() => handleYearSelect(year)}
                >
                  <Text 
                    style={[
                      styles.yearItemText,
                      year === currentMonth.getFullYear() && styles.yearItemTextActive
                    ]}
                  >
                    {year}
                  </Text>
                  {year === currentMonth.getFullYear() && (
                    <Icon name="check" size={20} color={MATERIAL_COLORS.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Enrollment Detail Modal */}
      <Modal
        transparent
        animationType="slide"
        visible={enrollmentModalVisible}
        onRequestClose={handleCloseEnrollmentModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseEnrollmentModal}>
          <Pressable
            style={styles.modalContent}
            onPress={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Chi tiết lớp đã đăng ký</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedEnrollment?.class?.name || 'Lớp học'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={handleCloseEnrollmentModal}
              >
                <Icon name="close" size={24} color={MATERIAL_COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <View style={styles.modalBody}>
              <View style={styles.modalInfoCard}>
                <View style={styles.modalInfoRow}>
                  <View style={styles.modalIconContainer}>
                    <Icon name="event" size={20} color={MATERIAL_COLORS.primary} />
                  </View>
                  <View style={styles.modalInfoTextContainer}>
                    <Text style={styles.modalInfoLabel}>Ngày học</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedEnrollment?.class?.startTime 
                        ? formatDateLabel(selectedEnrollment.class.startTime) 
                        : '--/--'}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalInfoRow}>
                  <View style={styles.modalIconContainer}>
                    <Icon name="schedule" size={20} color={MATERIAL_COLORS.primary} />
                  </View>
                  <View style={styles.modalInfoTextContainer}>
                    <Text style={styles.modalInfoLabel}>Thời gian</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedEnrollment?.class?.startTime
                        ? formatTimeRange(
                            selectedEnrollment.class.startTime, 
                            selectedEnrollment.class.endTime
                          )
                        : '--:--'}
                    </Text>
                  </View>
                </View>

                {selectedEnrollment?.class?.location && (
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalIconContainer}>
                      <Icon name="location-on" size={20} color={MATERIAL_COLORS.primary} />
                    </View>
                    <View style={styles.modalInfoTextContainer}>
                      <Text style={styles.modalInfoLabel}>Địa điểm</Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedEnrollment.class.location}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.modalInfoRow}>
                  <View style={styles.modalIconContainer}>
                    <Icon name="person-outline" size={20} color={MATERIAL_COLORS.primary} />
                  </View>
                  <View style={styles.modalInfoTextContainer}>
                    <Text style={styles.modalInfoLabel}>Huấn luyện viên</Text>
                    <Text style={styles.modalInfoValue}>
                      {selectedEnrollment?.class?.instructor?.name || 'Đang cập nhật'}
                    </Text>
                  </View>
                </View>

                {/* Description */}
                {selectedEnrollment?.class?.description && (
                  <View style={styles.modalInfoRow}>
                    <View style={styles.modalIconContainer}>
                      <Icon name="description" size={20} color={MATERIAL_COLORS.primary} />
                    </View>
                    <View style={styles.modalInfoTextContainer}>
                      <Text style={styles.modalInfoLabel}>Mô tả</Text>
                      <Text style={styles.modalInfoValue}>
                        {selectedEnrollment.class.description}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.modalInfoRow}>
                  <View style={styles.modalIconContainer}>
                    <Icon name="confirmation-number" size={20} color={MATERIAL_COLORS.primary} />
                  </View>
                  <View style={styles.modalInfoTextContainer}>
                    <Text style={styles.modalInfoLabel}>Mã đăng ký</Text>
                    <Text style={styles.modalInfoValue}>
                      #{selectedEnrollment?.enrollmentId?.slice(-8) || 'N/A'}
                    </Text>
                  </View>
                </View>

                {/* Check-in Time */}
                {selectedEnrollment?.checkInTime && (
                  <View style={styles.modalInfoRow}>
                    <View style={[styles.modalIconContainer, { backgroundColor: '#D4F4DD' }]}>
                      <Icon name="login" size={20} color={MATERIAL_COLORS.success} />
                    </View>
                    <View style={styles.modalInfoTextContainer}>
                      <Text style={styles.modalInfoLabel}>Thời gian check-in</Text>
                      <Text style={styles.modalInfoValue}>
                        {formatDateTime(selectedEnrollment.checkInTime)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Check-out Time */}
                {selectedEnrollment?.checkOutTime && (
                  <View style={styles.modalInfoRow}>
                    <View style={[styles.modalIconContainer, { backgroundColor: '#FFE4E1' }]}>
                      <Icon name="logout" size={20} color="#E57373" />
                    </View>
                    <View style={styles.modalInfoTextContainer}>
                      <Text style={styles.modalInfoLabel}>Thời gian check-out</Text>
                      <Text style={styles.modalInfoValue}>
                        {formatDateTime(selectedEnrollment.checkOutTime)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Show pending if not checked in yet and class has started */}
                {!selectedEnrollment?.checkInTime && 
                 selectedEnrollment?.class?.startTime &&
                 new Date(selectedEnrollment.class.startTime) <= new Date() && (
                  <View style={styles.modalInfoRow}>
                    <View style={[styles.modalIconContainer, { backgroundColor: '#FFF4E6' }]}>
                      <Icon name="schedule" size={20} color={MATERIAL_COLORS.warning} />
                    </View>
                    <View style={styles.modalInfoTextContainer}>
                      <Text style={styles.modalInfoLabel}>Trạng thái điểm danh</Text>
                      <Text style={[styles.modalInfoValue, { color: MATERIAL_COLORS.warning }]}>
                        Chưa điểm danh
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Status Badge */}
              {selectedEnrollment?.checkInTime && selectedEnrollment?.checkOutTime ? (
                <View style={[styles.modalNote, styles.modalNoteSuccess]}>
                  <Icon name="check-circle" size={20} color={MATERIAL_COLORS.success} />
                  <Text style={styles.modalNoteText}>
                    Đã hoàn thành lớp học
                  </Text>
                </View>
              ) : selectedEnrollment?.checkInTime ? (
                <View style={[styles.modalNote, { backgroundColor: '#E3F2FD', borderColor: '#2196F3' }]}>
                  <Icon name="info" size={20} color="#2196F3" />
                  <Text style={styles.modalNoteText}>
                    Đang tham gia lớp học
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSecondary]}
                onPress={handleCloseEnrollmentModal}
              >
                <Text style={styles.modalSecondaryText}>Đóng</Text>
              </TouchableOpacity>
              
              {/* Only show cancel button if class hasn't started yet */}
              {selectedEnrollment?.class?.startTime && 
               new Date(selectedEnrollment.class.startTime) > new Date() && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalDanger]}
                  onPress={handleCancelEnrollment}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Icon name="cancel" size={20} color="#fff" />
                      <Text style={styles.modalDangerText}>Hủy đăng ký</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

export default SearchCalendarScreen;

/* Material Design 3 Styles */
const styles = StyleSheet.create({
  // Container
  container: { 
    flex: 1, 
    backgroundColor: MATERIAL_COLORS.background,
  },

  // Header
  header: {
    backgroundColor: MATERIAL_COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: MATERIAL_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerTop: { 
    marginBottom: 20,
  },
  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: { 
    fontSize: 24, 
    fontWeight: '700', 
    color: MATERIAL_COLORS.onPrimary,
    letterSpacing: 0.5,
  },
  headerSubtitle: { 
    marginTop: 6, 
    fontSize: 14, 
    color: MATERIAL_COLORS.primaryContainer,
    fontWeight: '500',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 4,
    gap: 4,
  },
  tab: { 
    flex: 1, 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
  },
  activeTab: { 
    backgroundColor: MATERIAL_COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: { 
    color: MATERIAL_COLORS.primaryContainer,
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: { 
    color: MATERIAL_COLORS.primary,
    fontWeight: '700',
  },

  // Calendar Section
  calendarSection: {
    backgroundColor: MATERIAL_COLORS.surface,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: MATERIAL_COLORS.outline,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MATERIAL_COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthYearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: MATERIAL_COLORS.surfaceVariant,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '700',
    color: MATERIAL_COLORS.textPrimary,
  },

  // Days Scroll
  daysScrollContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  dayContainer: {
    width: ITEM_WIDTH,
    height: 72,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: MATERIAL_COLORS.surface,
    borderWidth: 2,
    borderColor: MATERIAL_COLORS.outline,
  },
  selectedDayContainer: {
    backgroundColor: MATERIAL_COLORS.primary,
    borderColor: MATERIAL_COLORS.primary,
    shadowColor: MATERIAL_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  todayContainer: {
    borderColor: MATERIAL_COLORS.primary,
    borderWidth: 2,
  },
  dayName: { 
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    color: MATERIAL_COLORS.textSecondary,
  },
  dayDate: { 
    fontSize: 20,
    fontWeight: '700',
    color: MATERIAL_COLORS.textPrimary,
  },
  selectedDayName: { 
    color: MATERIAL_COLORS.primaryContainer,
  },
  selectedDayDate: { 
    color: MATERIAL_COLORS.onPrimary,
  },
  todayText: {
    color: MATERIAL_COLORS.primary,
  },
  todayDot: {
    position: 'absolute',
    bottom: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MATERIAL_COLORS.primary,
  },

  // List Container
  listContainer: { 
    flex: 1,
  },
  listContent: { 
    padding: 16,
    paddingBottom: 32,
  },
  separator: { 
    height: 12,
  },

  // Class Card - Modern Design
  classCard: {
    backgroundColor: MATERIAL_COLORS.surface,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: MATERIAL_COLORS.outline,
  },
  classCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  classCardTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginRight: 8,
  },
  className: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: MATERIAL_COLORS.textPrimary,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: MATERIAL_COLORS.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: MATERIAL_COLORS.primary,
    textTransform: 'uppercase',
  },
  classInfoContainer: {
    gap: 8,
  },
  classInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  classInfoText: {
    flex: 1,
    fontSize: 14,
    color: MATERIAL_COLORS.textSecondary,
    fontWeight: '500',
  },
  spotsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: MATERIAL_COLORS.outline,
  },
  spotsProgressBar: {
    height: 6,
    backgroundColor: MATERIAL_COLORS.surfaceVariant,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  spotsProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  spotsText: {
    fontSize: 13,
    fontWeight: '600',
    color: MATERIAL_COLORS.textSecondary,
  },

  // Badges
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: MATERIAL_COLORS.onPrimary,
  },
  badgeSuccess: {
    backgroundColor: MATERIAL_COLORS.success,
  },
  badgeWarning: {
    backgroundColor: MATERIAL_COLORS.warning,
  },

  // Enrollment Card
  enrollmentCard: {
    backgroundColor: MATERIAL_COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 2,
    borderColor: MATERIAL_COLORS.primaryContainer,
    shadowColor: MATERIAL_COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  enrollmentBadgeRow: {
    marginBottom: 12,
  },
  enrollmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: MATERIAL_COLORS.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  enrollmentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: MATERIAL_COLORS.primary,
  },
  enrollmentContent: {
    gap: 12,
  },
  enrollmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  enrollmentClassName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: MATERIAL_COLORS.textPrimary,
  },
  enrollmentInfoContainer: {
    gap: 8,
  },

  // Skeleton Loading
  skeletonContainer: {
    padding: 16,
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: MATERIAL_COLORS.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: MATERIAL_COLORS.outline,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonBox: {
    backgroundColor: MATERIAL_COLORS.surfaceVariant,
    borderRadius: 8,
  },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: MATERIAL_COLORS.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: MATERIAL_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: MATERIAL_COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: MATERIAL_COLORS.onPrimary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal - Modern Design
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: MATERIAL_COLORS.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'android' ? 24 : 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: MATERIAL_COLORS.outline,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MATERIAL_COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: MATERIAL_COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '700',
    color: MATERIAL_COLORS.textPrimary,
  },
  modalBody: {
    padding: 24,
    gap: 16,
  },
  modalInfoCard: {
    backgroundColor: MATERIAL_COLORS.surfaceVariant,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  modalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MATERIAL_COLORS.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalInfoTextContainer: {
    flex: 1,
  },
  modalInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: MATERIAL_COLORS.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  modalInfoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: MATERIAL_COLORS.textPrimary,
  },
  modalNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalNoteSuccess: {
    backgroundColor: MATERIAL_COLORS.primaryContainer,
    borderColor: MATERIAL_COLORS.success,
  },
  modalNoteWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: MATERIAL_COLORS.warning,
  },
  modalNoteText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: MATERIAL_COLORS.textPrimary,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  modalSecondary: {
    backgroundColor: MATERIAL_COLORS.surfaceVariant,
  },
  modalPrimary: {
    backgroundColor: MATERIAL_COLORS.primary,
    shadowColor: MATERIAL_COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalDanger: {
    backgroundColor: MATERIAL_COLORS.error,
    shadowColor: MATERIAL_COLORS.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  modalButtonDisabled: {
    backgroundColor: MATERIAL_COLORS.outline,
    opacity: 0.6,
  },
  modalSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: MATERIAL_COLORS.textPrimary,
  },
  modalPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: MATERIAL_COLORS.onPrimary,
  },
  modalDangerText: {
    fontSize: 15,
    fontWeight: '700',
    color: MATERIAL_COLORS.onPrimary,
  },

  // Year Picker Modal
  yearPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  yearPickerContent: {
    backgroundColor: MATERIAL_COLORS.surface,
    borderRadius: 24,
    width: '80%',
    maxWidth: 400,
    maxHeight: '70%',
    overflow: 'hidden',
  },
  yearPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: MATERIAL_COLORS.outline,
  },
  yearPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: MATERIAL_COLORS.textPrimary,
  },
  yearPickerClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MATERIAL_COLORS.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearPickerScroll: {
    maxHeight: 400,
  },
  yearItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: MATERIAL_COLORS.outline,
  },
  yearItemActive: {
    backgroundColor: MATERIAL_COLORS.primaryContainer,
  },
  yearItemText: {
    fontSize: 18,
    fontWeight: '500',
    color: MATERIAL_COLORS.textPrimary,
  },
  yearItemTextActive: {
    fontWeight: '700',
    color: MATERIAL_COLORS.primary,
  },
});

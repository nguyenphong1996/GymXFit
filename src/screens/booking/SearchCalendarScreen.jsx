import React, { useState, useContext, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ScrollView,
  Platform,
  UIManager,
  FlatList,
  Modal,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { UserContext } from '@context/UserContext';
import {
  searchAvailableClasses,
  enrollInClass,
  getMyEnrollments,
} from '@api/classesApi';
import { useRoute } from '@react-navigation/native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

const generate31Days = () => {
  const days = [];
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let i = 0; i < 31; i += 1) {
    const date = new Date(normalizedToday);
    date.setDate(normalizedToday.getDate() + i);

    const dayLabel = String(date.getDate()).padStart(2, '0');
    const monthLabel = String(date.getMonth() + 1).padStart(2, '0');

    let label = dayNames[date.getDay()];
    if (i === 0) {
      label = 'Hôm nay';
    }

    days.push({
      id: date.toISOString(),
      dayName: label,
      dateString: `${dayLabel}/${monthLabel}`,
      fullDateString: date.toISOString().split('T')[0],
      dateObj: date,
    });
  }

  return days;
};

const formatTimeRange = (start, end) => {
  try {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const formatter = (value) =>
      value.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return `${formatter(startDate)} - ${formatter(endDate)}`;
  } catch {
    return '--:--';
  }
};

const formatDateLabel = (date) => {
  try {
    return new Date(date).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return '--/--';
  }
};

const ClassCard = ({ item, onSelect }) => {
  const instructorName = item.instructor?.name || 'Đang cập nhật';
  const timeRange = formatTimeRange(item.startTime, item.endTime);
  const remainingText =
    item.availableSpots > 0
      ? `${item.availableSpots} chỗ còn trống`
      : 'Không còn chỗ trống';

  return (
    <TouchableOpacity
      style={styles.classCard}
      activeOpacity={0.85}
      onPress={() => onSelect(item)}
    >
      <View style={styles.classCardHeader}>
        <Text style={styles.className}>{item.name}</Text>
        {item.isEnrolledByUser && (
          <View style={[styles.badge, styles.badgeSuccess]}>
            <Text style={styles.badgeText}>Đã đăng ký</Text>
          </View>
        )}
        {item.isFull && !item.isEnrolledByUser && (
          <View style={[styles.badge, styles.badgeWarning]}>
            <Text style={styles.badgeText}>Đã đầy</Text>
          </View>
        )}
      </View>

      <Text style={styles.classMeta}>{item.subcategory || item.category || 'Khác'}</Text>

      <View style={styles.classInfoRow}>
        <Icon name="schedule" size={18} color="#30C451" />
        <Text style={styles.classInfoText}>{timeRange}</Text>
      </View>

      {item.location ? (
        <View style={styles.classInfoRow}>
          <Icon name="location-on" size={18} color="#30C451" />
          <Text style={styles.classInfoText}>{item.location}</Text>
        </View>
      ) : null}

      <View style={styles.classInfoRow}>
        <Icon name="person-outline" size={18} color="#30C451" />
        <Text style={styles.classInfoText}>{instructorName}</Text>
      </View>

      <View style={styles.spotsRow}>
        <Text style={styles.spotsText}>{remainingText}</Text>
      </View>
    </TouchableOpacity>
  );
};

const EnrollmentCard = ({ enrollment }) => {
  const classInfo = enrollment.class || {};
  const timeRange = formatTimeRange(classInfo.startTime, classInfo.endTime);

  return (
    <View style={styles.enrollmentCard}>
      <View style={styles.classCardHeader}>
        <Text style={styles.className}>{classInfo.name || 'Lớp học'}</Text>
        <View style={[styles.badge, styles.badgeInfo]}>
          <Text style={styles.badgeText}>
            {enrollment.status === 'active' ? 'Đã đăng ký' : enrollment.status}
          </Text>
        </View>
      </View>

      <View style={styles.classInfoRow}>
        <Icon name="event" size={18} color="#30C451" />
        <Text style={styles.classInfoText}>
          {formatDateLabel(classInfo.startTime || enrollment.enrolledAt)}
        </Text>
      </View>

      <View style={styles.classInfoRow}>
        <Icon name="schedule" size={18} color="#30C451" />
        <Text style={styles.classInfoText}>{timeRange}</Text>
      </View>

      {classInfo.location ? (
        <View style={styles.classInfoRow}>
          <Icon name="location-on" size={18} color="#30C451" />
          <Text style={styles.classInfoText}>{classInfo.location}</Text>
        </View>
      ) : null}

      {classInfo.instructor?.name ? (
        <View style={styles.classInfoRow}>
          <Icon name="person-outline" size={18} color="#30C451" />
          <Text style={styles.classInfoText}>{classInfo.instructor.name}</Text>
        </View>
      ) : null}
    </View>
  );
};

const renderSeparator = () => <View style={styles.separator} />;

const SearchCalendarScreen = () => {
  const [selectedTab, setSelectedTab] = useState('Danh sách lớp');
  const route = useRoute();
  const highlightClassId = route.params?.highlightClassId;
  const { user } = useContext(UserContext);
  const userName = user?.name || user?.phone || 'Bạn';

  const days = useMemo(() => generate31Days(), []);
  const [selectedDateId, setSelectedDateId] = useState(days[0]?.id ?? null);

  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [classes, setClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState(null);
  const skipNextClassFetchRef = useRef(false);

  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [enrollmentsError, setEnrollmentsError] = useState(null);

  const [selectedClass, setSelectedClass] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const selectedDay = useMemo(
    () => days.find((item) => item.id === selectedDateId),
    [days, selectedDateId],
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchKeyword.trim());
    }, 400);

    return () => clearTimeout(handler);
  }, [searchKeyword]);

  const normalizeClasses = useCallback((items = []) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({
      ...item,
      classId: item.classId || item.id || item._id || item.class_id,
    }));
  }, []);

  const fetchClasses = useCallback(async () => {
    if (!selectedDay) {
      return;
    }

    setClassesLoading(true);
    setClassesError(null);

    const startDate = new Date(selectedDay.dateObj);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(selectedDay.dateObj);
    endDate.setHours(23, 59, 59, 999);

    try {
      const response = await searchAvailableClasses({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        sortBy: 'startTime',
        sortOrder: 'asc',
        limit: 50,
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
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
    }
  }, [selectedDay, debouncedSearch, normalizeClasses]);

  const fetchEnrollments = useCallback(async () => {
    setEnrollmentsLoading(true);
    setEnrollmentsError(null);

    try {
      const response = await getMyEnrollments({ status: 'active', limit: 50 });

      if (response?.success) {
        setEnrollments(response.data || []);
      } else {
        setEnrollments([]);
        setEnrollmentsError(response?.message || 'Bạn chưa đăng ký lớp nào.');
      }
    } catch (error) {
      setEnrollments([]);
      setEnrollmentsError(error.message);
    } finally {
      setEnrollmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    const hasPrefetched = !!route.params && Object.prototype.hasOwnProperty.call(route.params, 'prefetchedClasses');

    if (hasPrefetched) {
      const prefetched = normalizeClasses(route.params.prefetchedClasses);
      setClasses(prefetched);
      setClassesError(null);
      setClassesLoading(false);
      skipNextClassFetchRef.current = true;
    }
  }, [route.params?.prefetchedClasses, normalizeClasses]);

  useEffect(() => {
    if (selectedTab === 'Danh sách lớp') {
      if (skipNextClassFetchRef.current) {
        skipNextClassFetchRef.current = false;
        return;
      }
      fetchClasses();
    }
  }, [selectedTab, fetchClasses]);

  useEffect(() => {
    if (selectedTab === 'Lịch đã đặt') {
      fetchEnrollments();
    }
  }, [selectedTab, fetchEnrollments]);

  const handleSelectClass = useCallback((classItem) => {
    setSelectedClass(classItem);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedClass(null);
  }, []);

  const handleConfirmEnroll = useCallback(async () => {
    if (!selectedClass) {
      return;
    }

    const canEnroll = !selectedClass.isEnrolledByUser && !selectedClass.isFull;
    if (!canEnroll) {
      handleCloseModal();
      return;
    }

    setIsEnrolling(true);
    try {
      const response = await enrollInClass(selectedClass.classId);
      Alert.alert('Thành công', response?.message || 'Bạn đã đăng ký lớp thành công.');
      handleCloseModal();
      await fetchClasses();
      await fetchEnrollments();
    } catch (error) {
      Alert.alert('Đăng ký thất bại', error.message);
    } finally {
      setIsEnrolling(false);
    }
  }, [selectedClass, handleCloseModal, fetchClasses, fetchEnrollments]);

  const renderClassItem = ({ item }) => (
    <ClassCard item={item} onSelect={handleSelectClass} />
  );

  const renderEnrollmentItem = ({ item }) => <EnrollmentCard enrollment={item} />;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#30C451" barStyle="light-content" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.greeting}>Xin chào {userName}</Text>
          <Text style={styles.headerSubtitle}>Chọn lớp phù hợp với lịch rảnh của bạn</Text>
        </View>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo tên lớp, PT, địa điểm..."
            placeholderTextColor="#999"
            value={searchKeyword}
            onChangeText={setSearchKeyword}
          />
          <View style={styles.filterButton}>
            <View style={styles.filterContent}>
              <Icon name="tune" size={16} color="white" />
              <Text style={styles.filterText}>Lọc</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'Danh sách lớp' && styles.activeTab]}
            onPress={() => setSelectedTab('Danh sách lớp')}
          >
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
            style={[styles.tab, selectedTab === 'Lịch đã đặt' && styles.activeTab]}
            onPress={() => setSelectedTab('Lịch đã đặt')}
          >
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

      <View style={styles.calendarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarScrollContent}
          style={styles.calendarScrollView}
        >
          {days.map((item) => {
            const isSelected = item.id === selectedDateId;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.dayContainer,
                  isSelected ? styles.selectedDayContainer : styles.dayContainerDefault,
                ]}
                onPress={() => setSelectedDateId(item.id)}
              >
                <Text
                  style={[
                    styles.dayName,
                    isSelected ? styles.selectedDayName : styles.defaultDayName,
                  ]}
                >
                  {item.dayName}
                </Text>
                <Text
                  style={[
                    styles.dayDate,
                    isSelected ? styles.selectedDayDate : styles.defaultDayDate,
                  ]}
                >
                  {item.dateString}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.listContainer}>
        {selectedTab === 'Danh sách lớp' ? (
          <>
            {classesLoading ? (
              <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color="#30C451" />
                <Text style={styles.stateText}>Đang tải lớp học...</Text>
              </View>
            ) : classesError ? (
              <View style={styles.stateContainer}>
                <Text style={styles.stateText}>{classesError}</Text>
              </View>
            ) : (
              <FlatList
                data={classes}
                keyExtractor={(item) => item.classId}
                renderItem={renderClassItem}
                ItemSeparatorComponent={renderSeparator}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.stateContainer}>
                    <Text style={styles.stateText}>
                      Không có lớp nào trong ngày đã chọn.
                    </Text>
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        ) : (
          <>
            {enrollmentsLoading ? (
              <View style={styles.stateContainer}>
                <ActivityIndicator size="large" color="#30C451" />
                <Text style={styles.stateText}>Đang tải lịch đã đăng ký...</Text>
              </View>
            ) : enrollmentsError ? (
              <View style={styles.stateContainer}>
                <Text style={styles.stateText}>{enrollmentsError}</Text>
              </View>
            ) : (
              <FlatList
                data={enrollments}
                keyExtractor={(item) => item.enrollmentId}
                renderItem={renderEnrollmentItem}
                ItemSeparatorComponent={renderSeparator}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.stateContainer}>
                    <Text style={styles.stateText}>Bạn chưa đăng ký lớp nào.</Text>
                  </View>
                }
                showsVerticalScrollIndicator={false}
              />
            )}
          </>
        )}
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable style={styles.modalContent} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.modalTitle}>Xác nhận đăng ký</Text>
            <Text style={styles.modalSubtitle}>
              {selectedClass?.name || 'Lớp học'}
            </Text>

            <View style={styles.modalInfoRow}>
              <Icon name="event" size={20} color="#30C451" />
              <Text style={styles.modalInfoText}>
                {selectedClass
                  ? formatDateLabel(selectedClass.startTime)
                  : '--/--'}
              </Text>
            </View>

            <View style={styles.modalInfoRow}>
              <Icon name="schedule" size={20} color="#30C451" />
              <Text style={styles.modalInfoText}>
                {selectedClass
                  ? formatTimeRange(selectedClass.startTime, selectedClass.endTime)
                  : '--:--'}
              </Text>
            </View>

            {selectedClass?.location ? (
              <View style={styles.modalInfoRow}>
                <Icon name="location-on" size={20} color="#30C451" />
                <Text style={styles.modalInfoText}>{selectedClass.location}</Text>
              </View>
            ) : null}

            <View style={styles.modalInfoRow}>
              <Icon name="person-outline" size={20} color="#30C451" />
              <Text style={styles.modalInfoText}>
                {selectedClass?.instructor?.name || 'HLV đang cập nhật'}
              </Text>
            </View>

            <Text style={styles.modalNote}>
              {selectedClass?.isEnrolledByUser
                ? 'Bạn đã đăng ký lớp học này.'
                : selectedClass?.isFull
                ? 'Lớp đã đầy, vui lòng chọn lớp khác.'
                : 'Bạn chắc chắn muốn đăng ký lớp này chứ?'}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSecondary]}
                onPress={handleCloseModal}
              >
                <Text style={styles.modalSecondaryText}>Đóng</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalPrimary,
                  (selectedClass?.isEnrolledByUser || selectedClass?.isFull) && styles.modalButtonDisabled,
                ]}
                onPress={handleConfirmEnroll}
                disabled={
                  isEnrolling || selectedClass?.isEnrolledByUser || selectedClass?.isFull
                }
              >
                {isEnrolling ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalPrimaryText}>Đăng ký</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );

  useEffect(() => {
    if (!highlightClassId || !classes.length) {
      return;
    }
    const target = classes.find((classItem) => classItem.classId === highlightClassId);
    if (target) {
      handleSelectClass(target);
    }
  }, [highlightClassId, classes, handleSelectClass]);
};

export default SearchCalendarScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#30C451',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTop: {
    marginBottom: 16,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#e6ffe8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    color: '#111',
    fontSize: 16,
    paddingVertical: 6,
  },
  filterButton: {
    backgroundColor: '#20B24A',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    color: '#e6ffe8',
    fontSize: 15,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#08843a',
    fontWeight: '700',
  },
  calendarWrapper: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
  },
  calendarScrollView: {
    maxHeight: 110,
  },
  calendarScrollContent: {
    paddingHorizontal: 4,
    gap: 12,
  },
  dayContainer: {
    width: 90,
    height: 90,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  dayContainerDefault: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedDayContainer: {
    backgroundColor: '#30C451',
    borderColor: '#30C451',
  },
  dayName: {
    fontSize: 14,
    marginBottom: 4,
  },
  dayDate: {
    fontSize: 18,
    fontWeight: '700',
  },
  defaultDayName: {
    color: '#555',
  },
  selectedDayName: {
    color: '#fff',
  },
  defaultDayDate: {
    color: '#1a1a1a',
  },
  selectedDayDate: {
    color: '#fff',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listContent: {
    paddingBottom: 24,
  },
  separator: {
    height: 14,
  },
  classCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  enrollmentCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderWidth: 1,
    borderColor: '#d9f6e3',
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  className: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  classMeta: {
    marginTop: 4,
    marginBottom: 12,
    fontSize: 14,
    color: '#4f4f4f',
  },
  classInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  classInfoText: {
    fontSize: 15,
    color: '#222',
  },
  spotsRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spotsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#08843a',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  badgeSuccess: {
    backgroundColor: '#34d399',
  },
  badgeWarning: {
    backgroundColor: '#f97316',
  },
  badgeInfo: {
    backgroundColor: '#60a5fa',
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  stateText: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  modalSubtitle: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '500',
    color: '#30C451',
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  modalInfoText: {
    fontSize: 15,
    color: '#222',
  },
  modalNote: {
    marginTop: 16,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  modalActions: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSecondary: {
    backgroundColor: '#f0f0f0',
  },
  modalPrimary: {
    backgroundColor: '#30C451',
  },
  modalButtonDisabled: {
    backgroundColor: '#a7dfb9',
  },
  modalSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  modalPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

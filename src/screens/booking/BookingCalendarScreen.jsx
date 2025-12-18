import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation, useRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getPtAvailability } from '@api/ptBookingApi';
import { useToast } from '@context/ToastContext';
import { useContext } from 'react';
import { UserContext } from '@context/UserContext';

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

const BookingCalendarScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();
  const { membership } = useContext(UserContext);
  const { staff } = route.params;

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDate) return;
      
      // Kiểm tra membership trước khi fetch availability
      if (!membership || membership.status === 'none') {
        showToast({
          type: 'info',
          title: 'Thông báo',
          message: 'Bạn cần có gói thành viên để đặt lịch với PT. Vui lòng liên hệ lễ tân để mua gói thành viên.',
        });
        navigation.goBack();
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await getPtAvailability(staff.id, selectedDate);
        console.log('📅 BookingCalendarScreen: API Response:', response);
        
        // API trả về trực tiếp array hoặc {success, data}
        const slotsData = Array.isArray(response) ? response : (response?.data || response?.slots || []);
        setSlots(slotsData);
      } catch (error) {
        console.error('❌ BookingCalendarScreen: Error fetching availability:', error);
        showToast({
          type: 'error',
          title: 'Lỗi',
          message: 'Không thể tải lịch của huấn luyện viên.',
        });
        setSlots([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, staff.id, membership, showToast, navigation]);

  const onDayPress = day => {
    setSelectedDate(day.dateString);
  };

  const markedDates = useMemo(() => ({
    [selectedDate]: {
      selected: true,
      selectedColor: '#1F8E4A',
      disableTouchEvent: true,
    },
  }), [selectedDate]);

  const handleSlotPress = (slot) => {
    if (slot.status !== 'available') {
      let message = 'Ca này đã được đặt hoặc không có sẵn.';
      if (slot.status === 'booked_by_you') {
        message = 'Bạn đã đặt ca này rồi.';
      }
      showToast({ type: 'info', title: 'Thông báo', message });
      return;
    }
    navigation.navigate('BookingConfirmationScreen', { staff, slot, date: selectedDate });
  };

  const renderSlot = (slot) => {
    const isAvailable = slot.status === 'available';
    const isBookedByYou = slot.status === 'booked_by_you';

    return (
      <TouchableOpacity
        key={slot.key}
        style={[
          styles.slot,
          isAvailable ? styles.slotAvailable : (isBookedByYou ? styles.slotBookedByYou : styles.slotUnavailable),
        ]}
        onPress={() => handleSlotPress(slot)}
        disabled={!isAvailable}
      >
        <Text
          style={[
            styles.slotText,
            isAvailable ? styles.slotTextAvailable : styles.slotTextUnavailable,
          ]}
        >
          {slot.key}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#10241A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn lịch tập</Text>
      </View>
      <ScrollView>
        <View style={styles.ptHeader}>
          <Image
            source={staff.avatar ? { uri: staff.avatar } : require('@assets/images/avt.png')}
            style={styles.avatar}
          />
          <View>
            <Text style={styles.ptName}>{staff.name}</Text>
            <Text style={styles.ptSpecialty}>Chuyên gia thể hình</Text>
          </View>
        </View>

        <Calendar
          current={selectedDate}
          onDayPress={onDayPress}
          minDate={getTodayString()}
          markedDates={markedDates}
          theme={{
            arrowColor: '#1F8E4A',
            todayTextColor: '#1F8E4A',
            // ... other theme properties
          }}
        />

        <View style={styles.slotsContainer}>
          <Text style={styles.slotsTitle}>Chọn ca tập (mỗi ca 2 giờ)</Text>
          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} size="large" />
          ) : (
            <View style={styles.slotsGrid}>
              {slots.length > 0 ? (
                slots.map(renderSlot)
              ) : (
                <Text style={styles.noSlotsText}>Không có ca trống trong ngày này.</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
    backButton: { marginRight: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#10241A' },
    ptHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#F5F7F6' },
    avatar: { width: 70, height: 70, borderRadius: 35, marginRight: 20 },
    ptName: { fontSize: 22, fontWeight: 'bold', color: '#10241A' },
    ptSpecialty: { fontSize: 16, color: '#47614F' },
    slotsContainer: { padding: 20 },
    slotsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#10241A' },
    slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    slot: {
      width: '48%',
      paddingVertical: 20,
      borderRadius: 8,
      marginBottom: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    slotAvailable: { backgroundColor: '#1F8E4A' },
    slotUnavailable: { backgroundColor: '#E0E0E0', opacity: 0.7 },
    slotBookedByYou: { backgroundColor: '#FFC107' },
    slotText: { fontSize: 16, fontWeight: 'bold' },
    slotTextAvailable: { color: '#FFFFFF' },
    slotTextUnavailable: { color: '#BDBDBD' },
    noSlotsText: { textAlign: 'center', color: '#888', marginTop: 20, width: '100%' },
  });
  

export default BookingCalendarScreen;

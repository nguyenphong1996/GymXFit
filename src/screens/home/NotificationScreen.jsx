import React, { useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const NotificationScreen = ({ navigation }) => {
  const isDarkMode = useColorScheme() === 'dark';

  const [notifications] = useState([]);

  const renderItem = ({ item }) => (
    <View style={styles.itemContent}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons
          name="bell-circle-outline"
          size={28}
          color="#30C451"
        />
      </View>

      <View style={styles.textContent}>
        <Text style={styles.textTitleContent}>{item.title}</Text>
        <Text style={styles.textDate}>{item.date}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backHeader}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={styles.titleHeader}>
          <Text style={styles.textTitle}>Thông báo</Text>
        </View>

        <View style={{ flex: 1 }} />
      </View>

      {/* Danh sách thông báo */}
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="bell-off-outline"
            size={70}
            color="#BDBDBD"
          />
          <Text style={styles.emptyTitle}>Chưa có thông báo</Text>
          <Text style={styles.emptyText}>
            Lịch sử hoạt động của bạn sẽ xuất hiện tại đây khi có cập nhật mới.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  headerContainer: {
    height: 100,
    backgroundColor: '#30C451',
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  backHeader: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  titleHeader: {
    flex: 2,
    alignItems: 'center',
  },

  textTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },

  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },

  itemContent: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 15,
  },

  iconContainer: {
    width: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textContent: {
    flex: 1,
    paddingHorizontal: 10,
  },

  textTitleContent: {
    fontSize: 15,
    fontWeight: '600',
  },

  textDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },

  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
});

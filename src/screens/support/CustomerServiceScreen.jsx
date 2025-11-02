// screens/CustomerServiceScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CustomerServiceScreen = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* --- Header --- */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back-ios" size={22} color="#30C451" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dịch vụ khách hàng</Text>
      </View>

      {/* --- Subtitle --- */}
      <Text style={styles.subtitle}>Xin chào! Tôi ở đây để hỗ trợ bạn.</Text>

      {/* --- Option List --- */}
      <View style={styles.optionList}>
        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => navigation.navigate('SupportScreen')}
        >
          <View>
            <Text style={styles.optionTitle}>
              Chúng tôi có thể giúp gì cho bạn?
            </Text>
            <Text style={styles.optionSubtitle}>Hỗ trợ</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#30C451" />
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => navigation.navigate('HelpCenterScreen')}
        >
          <View>
            <Text style={styles.optionTitle}>Trung tâm trợ giúp</Text>
            <Text style={styles.optionSubtitle}>Thông tin chung</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#30C451" />
        </TouchableOpacity>

        <View style={styles.separator} />

        <TouchableOpacity
          style={styles.optionRow}
          onPress={() => navigation.navigate('ContactScreen')}
        >
          <View>
            <Text style={styles.optionTitle}>Liên hệ với chúng tôi</Text>
            <Text style={styles.optionSubtitle}>Phản hồi & Góp ý</Text>
          </View>
          <Icon name="chevron-right" size={20} color="#30C451" />
        </TouchableOpacity>

        <View style={styles.separator} />
      </View>
    </View>
  );
};

export default CustomerServiceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingHorizontal: 25,
  },
  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  backButton: {
    padding: 6,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212020',
  },
  // --- Subtitle ---
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    color: '#212020',
    marginBottom: 28,
  },
  // --- Option List ---
  optionList: {
    marginTop: 10,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    height: 1,
    backgroundColor: '#EAEAEA',
    marginVertical: 4,
  },
});

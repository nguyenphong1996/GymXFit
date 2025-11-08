// screens/HelpFaqScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FAIcon from 'react-native-vector-icons/FontAwesome';

const HelpFaqScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('Liên hệ');

  const contacts = [
    {
      name: 'Dịch vụ khách hàng',
      icon: <Icon name="support-agent" size={22} color="#0EBE7E" />,
    },
    {
      name: 'Trang web',
      icon: <Icon name="language" size={22} color="#0EBE7E" />,
    },
    {
      name: 'WhatsApp',
      icon: <FAIcon name="whatsapp" size={22} color="#0EBE7E" />,
    },
    {
      name: 'Facebook',
      icon: <FAIcon name="facebook" size={22} color="#0EBE7E" />,
    },
    {
      name: 'Instagram',
      icon: <FAIcon name="instagram" size={22} color="#0EBE7E" />,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back-ios" size={20} color="#0EBE7E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trợ giúp & Câu hỏi thường gặp</Text>
      </View>

      <Text style={styles.subtitle}>Chúng tôi có thể giúp gì cho bạn?</Text>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Câu hỏi' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('Câu hỏi')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Câu hỏi' && styles.tabTextActive,
            ]}
          >
            Câu hỏi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === 'Liên hệ' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('Liên hệ')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'Liên hệ' && styles.tabTextActive,
            ]}
          >
            Liên hệ
          </Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách liên hệ */}
      <ScrollView
        style={styles.contactList}
        showsVerticalScrollIndicator={false}
      >
        {contacts.map((contact, index) => (
          <TouchableOpacity key={index} style={styles.contactItem}>
            <View style={styles.contactLeft}>
              <View style={styles.iconWrapper}>{contact.icon}</View>
              <Text style={styles.contactName}>{contact.name}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default HelpFaqScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    marginLeft: 10,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 15,
    color: '#000',
    marginTop: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 15,
  },
  tabButton: {
    borderWidth: 1,
    borderColor: '#0EBE7E',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 25,
    marginHorizontal: 5,
  },
  tabActive: {
    backgroundColor: '#0EBE7E',
  },
  tabText: {
    color: '#0EBE7E',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },
  contactList: {
    paddingHorizontal: 20,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E9F9F2', // nền xanh nhạt
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#0EBE7E',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactName: {
    marginLeft: 12,
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
});

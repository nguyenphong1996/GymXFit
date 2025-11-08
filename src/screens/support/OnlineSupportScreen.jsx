// screens/OnlineSupportScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

const OnlineSupportScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* --- Header --- */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack?.()}>
            <IonIcon name="arrow-back" size={22} color="#30C451" />
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            <IonIcon name="chatbubbles" size={32} color="#30C451" />
          </View>

          <View style={styles.headerText}>
            <Text style={styles.title}>Trợ lý trực tuyến</Text>
            <Text style={styles.subtitle}>Tôi luôn sẵn sàng hỗ trợ bạn</Text>
          </View>
        </View>

        {/* --- Chat Area --- */}
        <KeyboardAvoidingView
          style={styles.chatWrapper}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <ScrollView
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Tin nhắn có thể thêm tại đây */}
          </ScrollView>

          {/* --- Input Bar --- */}
          <View style={styles.inputContainer}>
            <TouchableOpacity>
              <Feather name="paperclip" size={22} color="#000" />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              placeholder="Nhập tin nhắn..."
              placeholderTextColor="#6D6D6D"
            />

            <TouchableOpacity>
              <IonIcon name="mic-outline" size={22} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.sendButton}>
              <Icon name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

export default OnlineSupportScreen;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, backgroundColor: '#fff' },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 18 : 14,
    paddingBottom: 10,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E9F9F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  headerText: { flexDirection: 'column' },
  title: { fontSize: 18, fontWeight: '700', color: '#000' },
  subtitle: { fontSize: 12, color: '#555' },

  /* Chat area */
  chatWrapper: { flex: 1 },
  chatArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  chatContent: { paddingTop: 10, paddingBottom: 24 },

  /* Input Bar */
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#EEF94E',
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: 14,
    color: '#000',
    marginHorizontal: 8,
  },
  sendButton: {
    backgroundColor: '#30C451',
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});

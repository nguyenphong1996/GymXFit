import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const TOKEN_CARD_THEMES = {
  ncb: ['rgba(122, 46, 42, 0.95)', 'rgba(255, 102, 51, 0.95)'],
  default: ['rgba(0, 68, 148, 0.95)', 'rgba(0, 181, 226, 0.95)'],
};

const PaymentTokenCard = ({
  bankName,
  bankCode,
  cardMask,
  cardHolderName,
  cardExpiry,
}) => {
  const bankKey = (bankCode || bankName || '').toLowerCase();
  const isNcb = bankKey.includes('ncb');
  const gradient = isNcb ? TOKEN_CARD_THEMES.ncb : TOKEN_CARD_THEMES.default;

  const maskedNumber = cardMask || '•••• •••• •••• ••••';
  const resolvedHolder = (cardHolderName || 'NGUYEN VAN A').toUpperCase();
  const resolvedExpiry = cardExpiry || '07/15';

  return (
    <View style={styles.cardPreviewContainer}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBackground}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <MaterialIcons name="memory" size={40} color="#E0E0E0" />
            <Text style={styles.cardBrand}>{bankName || bankCode || 'VNPAY'}</Text>
          </View>

          <View style={styles.cardNumberContainer}>
            <Text style={styles.cardNumber}>{maskedNumber}</Text>
          </View>

          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.cardLabel}>CHỦ THẺ</Text>
              <Text style={styles.cardHolderName}>{resolvedHolder}</Text>
            </View>
            <View>
              <Text style={styles.cardLabel}>NGÀY HẾT HẠN</Text>
              <Text style={styles.cardExpiry}>{resolvedExpiry}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  cardPreviewContainer: {
    width: '100%',
    aspectRatio: 669 / 373,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 24,
    overflow: 'hidden',
    backgroundColor: '#dfe7e2',
  },
  cardBackground: {
    flex: 1,
  },
  cardContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardBrand: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    fontStyle: 'italic',
  },
  cardNumberContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  cardNumber: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 1,
    fontFamily: 'monospace',
    width: '100%',
    flexWrap: 'nowrap',
    textAlign: 'left',
    includeFontPadding: false,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
    fontWeight: '600',
  },
  cardHolderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    letterSpacing: 1,
  },
  cardExpiry: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default PaymentTokenCard;

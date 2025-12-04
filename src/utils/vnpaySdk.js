import { NativeModules } from 'react-native';

const VnpayMerchantModule = NativeModules?.VnpayMerchant;

export const isVnpaySdkAvailable = !!VnpayMerchantModule;

export const launchVnpaySdk = ({
  scheme,
  paymentUrl,
  tmnCode,
  isSandbox = true,
  title = 'Thanh toán VNPAY',
  iconBackName = 'close',
  beginColor = '#ffffff',
  endColor = '#ffffff',
  titleColor = '#333333',
}) => {
  if (!VnpayMerchantModule) {
    throw new Error('VnpayMerchant SDK chưa được link.');
  }

  // SDK yêu cầu mã màu không có dấu #
  const stripHash = (value = '') => value.replace(/#/g, '');

  console.log('VnpayMerchant.show params:', {
    scheme,
    tmnCode,
    isSandbox,
    paymentUrl,
  });

  VnpayMerchantModule.show(
    scheme,
    isSandbox,
    paymentUrl,
    tmnCode,
    'Bạn có chắc chắn trở lại không?',
    title,
    stripHash(titleColor),
    stripHash(beginColor),
    stripHash(endColor),
    iconBackName
  );
};

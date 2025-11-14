import React, {
  Suspense,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CameraKitModule, { Camera, CameraType } from 'react-native-camera-kit';

const PALETTE = {
  primary: '#30C451',
  primaryDark: '#1FA04A',
  accent: '#81F4A8',
  background: '#05130B',
  surface: 'rgba(6, 20, 12, 0.96)',
  surfaceMuted: 'rgba(9, 27, 17, 0.72)',
  surfaceElevated: 'rgba(11, 32, 21, 0.94)',
  textPrimary: '#F1FFF6',
  textSecondary: '#9BBEA9',
  textMuted: '#6F8579',
  textInverse: '#102615',
  textOnPrimary: '#FFFFFF',
  outline: 'rgba(129, 244, 168, 0.28)',
  borderBright: 'rgba(129, 244, 168, 0.42)',
  overlayScrim: 'rgba(5, 19, 11, 0.9)',
  overlayDim: 'rgba(5, 19, 11, 0.64)',
  danger: '#FD5D5D',
  warning: '#FFA726',
  error: '#FF5252',
};

const PERMISSION_STATUS = {
  checking: 'checking',
  granted: 'granted',
  denied: 'denied',
  blocked: 'blocked',
};

// Scan result status types
const SCAN_STATUS = {
  idle: 'idle',
  success: 'success',
  expired: 'expired',
  wrongClass: 'wrongClass',
  invalid: 'invalid',
  processing: 'processing',
};

const DEFAULT_HELPER_TEXT = 'Giữ thiết bị ổn định, đưa QR vào khung để quét mã';


const QrScannerModal = ({
  visible,
  onClose,
  onScanSuccess,
  helperTitle,
}) => {
  const [permissionStatus, setPermissionStatus] = useState(PERMISSION_STATUS.checking);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanStatus, setScanStatus] = useState(SCAN_STATUS.idle);
  const [scanMessage, setScanMessage] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const resetState = useCallback(() => {
    setTorchEnabled(false);
    setScanStatus(SCAN_STATUS.idle);
    setScanMessage('');
    setCameraError(null);
    setIsProcessing(false);
    setPermissionStatus(PERMISSION_STATUS.checking);
  }, []);

  const requestPermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (result === PermissionsAndroid.RESULTS.GRANTED) return PERMISSION_STATUS.granted;
        if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return PERMISSION_STATUS.blocked;
        return PERMISSION_STATUS.denied;
      } catch {
        return PERMISSION_STATUS.denied;
      }
    }

    try {
      const granted = await CameraKitModule?.requestDeviceCameraAuthorization?.();
      return granted ? PERMISSION_STATUS.granted : PERMISSION_STATUS.blocked;
    } catch {
      return PERMISSION_STATUS.blocked;
    }
  }, []);

  const ensurePermission = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        const hasPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
        if (hasPermission) return PERMISSION_STATUS.granted;
      } catch {
        // fallthrough to request
      }
      return requestPermission();
    }

    try {
      const granted = await CameraKitModule?.checkDeviceCameraAuthorizationStatus?.();
      if (granted) return PERMISSION_STATUS.granted;
      return await requestPermission();
    } catch {
      return await requestPermission();
    }
  }, [requestPermission]);

  useEffect(() => {
    let isMounted = true;
    if (visible) {
      resetState();
      ensurePermission().then(status => {
        if (isMounted) setPermissionStatus(status);
      });
    } else {
      resetState();
    }
    return () => {
      isMounted = false;
    };
  }, [ensurePermission, resetState, visible]);

  const handleClose = useCallback(() => {
    resetState();
    onClose?.();
  }, [onClose, resetState]);

  const handleRetryPermission = useCallback(() => {
    setPermissionStatus(PERMISSION_STATUS.checking);
    requestPermission().then(status => setPermissionStatus(status));
  }, [requestPermission]);

  const handleOpenSettings = useCallback(() => {
    Linking.openSettings().catch(() => undefined);
  }, []);

  const handleTorchToggle = useCallback(() => {
    setTorchEnabled(prev => !prev);
  }, []);


  const handleReadCode = useCallback(
    async event => {
      if (isProcessing) return;
      
      const value = event?.nativeEvent?.codeStringValue?.trim();
      if (!value) return;

      Vibration.vibrate(80);
      setIsProcessing(true);
      setScanStatus(SCAN_STATUS.processing);

      try {
        // Parse QR code data
        let qrData;
        try {
          qrData = JSON.parse(value);
        } catch {
          // If not JSON, treat as plain string
          qrData = { raw: value };
        }

        // Call the onScanSuccess callback to validate QR code
        if (onScanSuccess) {
          const result = await onScanSuccess(qrData);
          
          // Handle different response types based on your API
          if (result.success) {
            setScanStatus(SCAN_STATUS.success);
            setScanMessage(result.message || 'Quét mã thành công!');
            Vibration.vibrate([0, 100, 50, 100]); // Success vibration pattern
          } else {
            // Check error type from API response
            const errorMsg = result.message || result.error || '';
            
            if (errorMsg.includes('hết hạn') || errorMsg.includes('expired')) {
              setScanStatus(SCAN_STATUS.expired);
              setScanMessage('Mã QR đã hết hạn');
            } else if (errorMsg.includes('không đăng ký') || errorMsg.includes('not enrolled') || errorMsg.includes('wrong class')) {
              setScanStatus(SCAN_STATUS.wrongClass);
              setScanMessage('Quét sai lớp học - Bạn chưa đăng ký lớp này');
            } else if (errorMsg.includes('không hợp lệ') || errorMsg.includes('invalid')) {
              setScanStatus(SCAN_STATUS.invalid);
              setScanMessage('Quét QR lỗi - Mã không hợp lệ');
            } else {
              // Default error
              setScanStatus(SCAN_STATUS.invalid);
              setScanMessage(errorMsg || 'Quét QR lỗi');
            }
            Vibration.vibrate([0, 200, 100, 200]); // Error vibration pattern
          }
        } else {
          // No callback provided, just mark as success
          setScanStatus(SCAN_STATUS.success);
          setScanMessage('Quét mã thành công!');
          Vibration.vibrate([0, 100, 50, 100]);
        }

        // Auto reset after showing message for 2.5 seconds
        setTimeout(() => {
          setScanStatus(SCAN_STATUS.idle);
          setScanMessage('');
          setIsProcessing(false);
        }, 2500);
      } catch (error) {
        // Handle unexpected errors
        const errorMsg = error?.message || '';
        
        if (errorMsg.includes('hết hạn') || errorMsg.includes('expired')) {
          setScanStatus(SCAN_STATUS.expired);
          setScanMessage('Mã QR đã hết hạn');
        } else if (errorMsg.includes('không đăng ký') || errorMsg.includes('not enrolled') || errorMsg.includes('wrong class')) {
          setScanStatus(SCAN_STATUS.wrongClass);
          setScanMessage('Quét sai lớp học - Bạn chưa đăng ký lớp này');
        } else {
          setScanStatus(SCAN_STATUS.invalid);
          setScanMessage('Quét QR lỗi - ' + (errorMsg || 'Không thể xử lý mã QR'));
        }
        Vibration.vibrate([0, 200, 100, 200]);

        // Auto reset after showing error for 2.5 seconds
        setTimeout(() => {
          setScanStatus(SCAN_STATUS.idle);
          setScanMessage('');
          setIsProcessing(false);
        }, 2500);
      }
    },
    [isProcessing, onScanSuccess],
  );

  const handleCameraError = useCallback(event => {
    const message = event?.nativeEvent?.errorMessage || 'Không thể khởi tạo camera';
    setCameraError(message);
  }, []);

  const permissionContent = (() => {
    if (permissionStatus === PERMISSION_STATUS.checking) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={PALETTE.primary} />
          <Text style={styles.stateText}>Đang kiểm tra quyền truy cập camera...</Text>
        </View>
      );
    }

    if (permissionStatus === PERMISSION_STATUS.granted) {
      return null;
    }

    if (permissionStatus === PERMISSION_STATUS.denied) {
      return (
        <View style={styles.permissionContainer}>
          <Icon name="camera-off" size={56} color={PALETTE.primary} />
          <Text style={styles.permissionTitle}>Chưa có quyền sử dụng camera</Text>
          <Text style={styles.permissionDescription}>
            Vui lòng cho phép GymXFit truy cập camera để quét mã QR.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={handleRetryPermission}>
            <Text style={styles.permissionButtonText}>Thử lại</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.permissionGhostButton} onPress={handleClose}>
            <Text style={styles.permissionGhostButtonText}>Đóng</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.permissionContainer}>
        <Icon name="shield-lock" size={56} color={PALETTE.primary} />
        <Text style={styles.permissionTitle}>Camera đã bị chặn quyền truy cập</Text>
        <Text style={styles.permissionDescription}>
          Hãy mở phần Cài đặt và cấp quyền camera cho GymXFit để tiếp tục quét mã QR.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={handleOpenSettings}>
          <Text style={styles.permissionButtonText}>Mở cài đặt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.permissionGhostButton} onPress={handleClose}>
          <Text style={styles.permissionGhostButtonText}>Đóng</Text>
        </TouchableOpacity>
      </View>
    );
  })();

  // Render scan result based on status - Only show helper text or toast notification
  const renderScanResult = () => {
    // Don't show anything in footer - keeping it minimal
    return null;
  };


  const cameraOverlay = (
    <>
      <View pointerEvents="none" style={styles.overlay}>
        <View style={styles.overlayDim} />
        <View style={styles.overlayRow}>
          <View style={styles.overlayDim} />
          <View style={styles.scanFrame}>
            <View style={[styles.frameCorner, styles.topLeft]} />
            <View style={[styles.frameCorner, styles.topRight]} />
            <View style={[styles.frameCorner, styles.bottomLeft]} />
            <View style={[styles.frameCorner, styles.bottomRight]} />
            {scanStatus === SCAN_STATUS.processing && (
              <View style={styles.scanningIndicator}>
                <ActivityIndicator size="large" color={PALETTE.primary} />
              </View>
            )}
          </View>
          <View style={styles.overlayDim} />
        </View>
        <View style={[styles.overlayDim, styles.overlayBottom]}>
          <Text style={styles.bottomInstruction}>Đưa mã QR vào vùng khung để quét</Text>
        </View>
      </View>

      {/* Toast notification for scan results */}
      {(scanStatus === SCAN_STATUS.success || 
        scanStatus === SCAN_STATUS.expired || 
        scanStatus === SCAN_STATUS.wrongClass || 
        scanStatus === SCAN_STATUS.invalid) && (
        <View style={[
          styles.toastNotification,
          scanStatus === SCAN_STATUS.success && styles.toastSuccess,
          scanStatus === SCAN_STATUS.expired && styles.toastWarning,
          scanStatus === SCAN_STATUS.wrongClass && styles.toastError,
          scanStatus === SCAN_STATUS.invalid && styles.toastDanger,
        ]}>
          <Icon 
            name={
              scanStatus === SCAN_STATUS.success ? 'check-circle' :
              scanStatus === SCAN_STATUS.expired ? 'clock-alert-outline' :
              scanStatus === SCAN_STATUS.wrongClass ? 'alert-circle-outline' :
              'close-circle-outline'
            }
            size={24} 
            color={PALETTE.textOnPrimary} 
          />
          <Text style={styles.toastText}>{scanMessage}</Text>
        </View>
      )}

      <View style={styles.actionsBar}>
        <TouchableOpacity style={styles.controlButton} onPress={handleTorchToggle}>
          <Icon
            name={torchEnabled ? 'flashlight' : 'flashlight-off'}
            size={26}
            color={PALETTE.textPrimary}
          />
          <Text style={[styles.actionLabel, styles.actionLabelSpacing]}>
            {torchEnabled ? 'Tắt đèn' : 'Bật đèn'}
          </Text>
        </TouchableOpacity>
      </View>
      {cameraError ? (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={20} color={PALETTE.textOnPrimary} />
          <Text style={styles.errorText}>{cameraError}</Text>
        </View>
      ) : null}
    </>
  );


  const cameraContent =
    permissionStatus === PERMISSION_STATUS.granted ? (
      <View style={styles.cameraWrapper}>
        <Suspense
          fallback={
            <View style={styles.pendingOverlay}>
              <ActivityIndicator size="large" color={PALETTE.primary} />
              <Text style={styles.pendingText}>Đang kích hoạt camera...</Text>
            </View>
          }
        >
          <Camera
            style={styles.cameraPreview}
            cameraType={CameraType.Back}
            scanBarcode
            flashMode={torchEnabled ? 'on' : 'off'}
            torchMode={torchEnabled ? 'on' : 'off'}
            onReadCode={handleReadCode}
            onError={handleCameraError}
            showFrame={false}
            scanThrottleDelay={1500}
          />
        </Suspense>
        {cameraOverlay}
      </View>
    ) : (
      permissionContent
    );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
            <Icon name="arrow-left" size={24} color={PALETTE.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quét mã QR</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.body}>{cameraContent}</View>
      </SafeAreaView>
    </Modal>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: 'rgba(5, 19, 11, 0.96)',
    borderBottomColor: PALETTE.outline,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.surfaceMuted,
    borderWidth: 1,
    borderColor: PALETTE.outline,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  headerPlaceholder: {
    width: 40,
  },
  body: {
    flex: 1,
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
  },
  cameraWrapper: {
    flex: 1,
    alignSelf: 'stretch',
    marginHorizontal: 0,
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  cameraPreview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
  },
  overlayDim: {
    flex: 1,
    backgroundColor: PALETTE.overlayDim,
  },
  overlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 260,
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderRadius: 20,
    borderColor: PALETTE.borderBright,
    borderWidth: 1.5,
    backgroundColor: 'rgba(3, 18, 10, 0.32)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningIndicator: {
    position: 'absolute',
  },
  frameCorner: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderColor: PALETTE.primary,
    borderWidth: 4,
    shadowColor: PALETTE.primary,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  overlayBottom: {
    paddingTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomInstruction: {
    color: PALETTE.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  actionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(5, 19, 11, 0.95)',
    borderTopColor: PALETTE.outline,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  controlButton: {
    alignItems: 'center',
    marginHorizontal: 16,
  },
  actionLabel: {
    color: PALETTE.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  actionLabelSpacing: {
    marginTop: 6,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: PALETTE.background,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    marginTop: 18,
    textAlign: 'center',
  },
  permissionDescription: {
    color: PALETTE.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: PALETTE.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 20,
    minWidth: 200,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: PALETTE.textOnPrimary,
    fontWeight: '700',
    fontSize: 14,
  },
  permissionGhostButton: {
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: PALETTE.outline,
    marginTop: 12,
    backgroundColor: 'transparent',
    minWidth: 200,
    alignItems: 'center',
  },
  permissionGhostButtonText: {
    color: PALETTE.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: PALETTE.background,
  },
  stateText: {
    color: PALETTE.textSecondary,
    fontSize: 15,
    marginTop: 16,
  },
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.overlayScrim,
  },
  pendingText: {
    color: PALETTE.textPrimary,
    fontSize: 15,
    marginTop: 16,
  },
  errorBanner: {
    position: 'absolute',
    top: 24,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PALETTE.danger,
    borderRadius: 14,
  },
  errorText: {
    color: PALETTE.textOnPrimary,
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  toastNotification: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    gap: 12,
  },
  toastSuccess: {
    backgroundColor: PALETTE.primary,
  },
  toastWarning: {
    backgroundColor: PALETTE.warning,
  },
  toastError: {
    backgroundColor: PALETTE.error,
  },
  toastDanger: {
    backgroundColor: PALETTE.danger,
  },
  toastText: {
    color: PALETTE.textOnPrimary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
});

export default QrScannerModal;

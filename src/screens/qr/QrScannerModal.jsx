import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
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

const PERMISSION_STATUS = {
  checking: 'checking',
  granted: 'granted',
  denied: 'denied',
  blocked: 'blocked',
};

const QrScannerModal = ({ visible, onClose, onScan }) => {
  const [permissionStatus, setPermissionStatus] = useState(PERMISSION_STATUS.checking);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const resetState = useCallback(() => {
    setTorchEnabled(false);
    setScannedResult(null);
    setCameraError(null);
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
    event => {
      if (scannedResult) return;
      const value = event?.nativeEvent?.codeStringValue?.trim();
      if (!value) return;
      Vibration.vibrate(80);
      setScannedResult({
        value,
        type: event?.nativeEvent?.codeFormat ?? 'unknown',
      });
    },
    [scannedResult],
  );

  const handleUseResult = useCallback(() => {
    if (scannedResult && onScan) {
      onScan(scannedResult);
    }
    handleClose();
  }, [handleClose, onScan, scannedResult]);

  const handleRescan = useCallback(() => {
    setScannedResult(null);
  }, []);

  const handleCameraError = useCallback(event => {
    const message = event?.nativeEvent?.errorMessage || 'Không thể khởi tạo camera';
    setCameraError(message);
  }, []);

  const permissionContent = useMemo(() => {
    if (permissionStatus === PERMISSION_STATUS.checking) {
      return (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#30C451" />
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
          <Icon name="camera-off" size={56} color="#30C451" />
          <Text style={styles.permissionTitle}>Chưa có quyền sử dụng camera</Text>
          <Text style={styles.permissionDescription}>
            Vui lòng cho phép GymXFit truy cập camera để quét mã QR của bạn.
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
        <Icon name="shield-lock" size={56} color="#30C451" />
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
  }, [handleClose, handleOpenSettings, handleRetryPermission, permissionStatus]);

  const renderResultCard = scannedResult ? (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Icon name="check-circle" size={24} color="#30C451" />
        <Text style={styles.resultTitle}>Đã quét mã QR</Text>
      </View>
      <Text style={styles.resultValue} numberOfLines={3} ellipsizeMode="middle">
        {scannedResult.value}
      </Text>
      <View style={styles.resultActions}>
        <TouchableOpacity
          style={[styles.resultButton, styles.resultSecondaryButton]}
          onPress={handleRescan}
        >
          <Text style={styles.resultSecondaryText}>Quét lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.resultButton, styles.resultPrimaryButton]}
          onPress={handleUseResult}
        >
          <Text style={styles.resultPrimaryText}>Sử dụng mã</Text>
        </TouchableOpacity>
      </View>
    </View>
  ) : (
    <View style={styles.helperCard}>
      <Icon name="qrcode-scan" size={22} color="#9bbfa3" />
      <Text style={styles.helperText}>Giữ thiết bị ổn định và đảm bảo ánh sáng đủ</Text>
    </View>
  );

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
          </View>
          <View style={styles.overlayDim} />
        </View>
        <View style={[styles.overlayDim, styles.overlayBottom]}>
          <Text style={styles.bottomInstruction}>Đưa mã QR vào vùng khung để quét</Text>
        </View>
      </View>
      <View style={styles.actionsBar}>
        <TouchableOpacity style={styles.actionButton} onPress={handleClose}>
          <Icon name="close" size={26} color="#1b1b1f" />
          <Text style={[styles.actionLabel, styles.actionLabelSpacing]}>Đóng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleTorchToggle}>
          <Icon name={torchEnabled ? 'flashlight' : 'flashlight-off'} size={26} color="#1b1b1f" />
          <Text style={[styles.actionLabel, styles.actionLabelSpacing]}>
            {torchEnabled ? 'Tắt đèn' : 'Bật đèn'}
          </Text>
        </TouchableOpacity>
      </View>
      {cameraError ? (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={20} color="#fff" />
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
              <ActivityIndicator size="large" color="#30C451" />
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
            scanThrottleDelay={1200}
          />
        </Suspense>
        {cameraOverlay}
      </View>
    ) : (
      permissionContent
    );

  return (
    <Modal visible={visible} animationType="fade" presentationStyle="fullScreen" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleClose}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quét mã QR</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.body}>{cameraContent}</View>
        <View style={styles.footer}>{renderResultCard}</View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1b12',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerPlaceholder: {
    width: 40,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraWrapper: {
    flex: 1,
    alignSelf: 'stretch',
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
    backgroundColor: 'rgba(10, 20, 14, 0.6)',
  },
  overlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 260,
  },
  scanFrame: {
    width: 260,
    height: 260,
    borderRadius: 16,
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
  },
  frameCorner: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderColor: '#30C451',
    borderWidth: 4,
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
    paddingTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomInstruction: {
    color: '#d8f4e0',
    fontSize: 15,
  },
  actionsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 18,
    backgroundColor: 'rgba(15, 27, 18, 0.92)',
  },
  actionButton: {
    alignItems: 'center',
    marginHorizontal: 24,
  },
  actionLabel: {
    color: '#d8f4e0',
    fontSize: 13,
    fontWeight: '600',
  },
  actionLabelSpacing: {
    marginTop: 6,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignSelf: 'stretch',
  },
  helperCard: {
    backgroundColor: 'rgba(48, 196, 81, 0.12)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  helperText: {
    color: '#b7d9c0',
    fontSize: 14,
    flex: 1,
    marginLeft: 12,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102615',
    marginLeft: 10,
  },
  resultValue: {
    color: '#273b2c',
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 16,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultSecondaryButton: {
    borderWidth: 1,
    borderColor: '#30C451',
    marginRight: 8,
  },
  resultSecondaryText: {
    color: '#30C451',
    fontWeight: '600',
    fontSize: 15,
  },
  resultPrimaryButton: {
    backgroundColor: '#30C451',
    marginLeft: 8,
  },
  resultPrimaryText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 18,
  },
  permissionDescription: {
    color: '#d8f4e0',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 10,
  },
  permissionButton: {
    backgroundColor: '#30C451',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginTop: 18,
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  permissionGhostButton: {
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    marginTop: 12,
  },
  permissionGhostButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateText: {
    color: '#d8f4e0',
    fontSize: 15,
    marginTop: 16,
  },
  pendingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 27, 18, 0.72)',
  },
  pendingText: {
    color: '#d8f4e0',
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(220, 53, 69, 0.85)',
    borderRadius: 12,
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
});

export default QrScannerModal;

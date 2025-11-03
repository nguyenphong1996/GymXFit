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
};

const PERMISSION_STATUS = {
  checking: 'checking',
  granted: 'granted',
  denied: 'denied',
  blocked: 'blocked',
};

const DEFAULT_HELPER_TEXT = 'Giữ thiết bị ổn định, đưa QR vào khung để điểm danh.';

const formatDateTime = value => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('vi-VN', {
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
};

const shortenValue = (value, max = 28) => {
  if (typeof value !== 'string') return value;
  if (value.length <= max) return value;
  return `${value.slice(0, 12)}…${value.slice(-6)}`;
};

const QrScannerModal = ({
  visible,
  onClose,
  onCheckIn,
  onCheckOut,
  helperTitle,
  disableActions = false,
  onUnsupportedRole,
}) => {
  const [permissionStatus, setPermissionStatus] = useState(PERMISSION_STATUS.checking);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scannedResult, setScannedResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [actionState, setActionState] = useState({ status: 'idle', message: '', type: null });

  const resetState = useCallback(() => {
    setTorchEnabled(false);
    setScannedResult(null);
    setCameraError(null);
    setActionLoading(null);
    setActionState({ status: 'idle', message: '', type: null });
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
      setActionState({ status: 'idle', message: '', type: null });
      setScannedResult({
        value,
        type: event?.nativeEvent?.codeFormat ?? 'unknown',
      });
    },
    [scannedResult],
  );

  const handleRescan = useCallback(() => {
    setScannedResult(null);
    setActionState({ status: 'idle', message: '', type: null });
  }, []);

  const handleCameraError = useCallback(event => {
    const message = event?.nativeEvent?.errorMessage || 'Không thể khởi tạo camera';
    setCameraError(message);
  }, []);

  const parsedPayload = useMemo(() => {
    if (!scannedResult?.value) return null;
    if (typeof scannedResult.value === 'object') return scannedResult.value;
    try {
      return JSON.parse(scannedResult.value);
    } catch {
      return null;
    }
  }, [scannedResult]);

  const handleUnsupported = useCallback(
    message => {
      const fallback = message || 'Tài khoản hiện tại không thể sử dụng chức năng này.';
      setActionState({
        status: 'error',
        message: fallback,
        type: null,
      });
      if (onUnsupportedRole) {
        onUnsupportedRole();
      }
    },
    [onUnsupportedRole],
  );

  const handleAttendanceAction = useCallback(
    async actionType => {
      if (!scannedResult) return;

      if (disableActions) {
        handleUnsupported('Vui lòng đăng nhập bằng tài khoản phù hợp để điểm danh.');
        return;
      }

      const handler = actionType === 'checkin' ? onCheckIn : onCheckOut;
      if (!handler) {
        handleUnsupported(
          actionType === 'checkin'
            ? 'Chức năng check-in hiện chưa khả dụng.'
            : 'Chức năng check-out hiện chưa khả dụng.',
        );
        return;
      }

      try {
        setActionLoading(actionType);
        const feedback = await handler(scannedResult);
        setActionState({
          status: 'success',
          message: feedback || (actionType === 'checkin' ? 'Check-in thành công.' : 'Check-out thành công.'),
          type: actionType,
        });
      } catch (error) {
        setActionState({
          status: 'error',
          message: error?.message || 'Không thể xử lý QR.',
          type: actionType,
        });
      } finally {
        setActionLoading(null);
      }
    },
    [disableActions, handleUnsupported, onCheckIn, onCheckOut, scannedResult],
  );

  const permissionContent = useMemo(() => {
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
  }, [handleClose, handleOpenSettings, handleRetryPermission, permissionStatus]);

  const renderResultCard = scannedResult ? (
    <View style={styles.resultCard}>
      <View style={styles.resultHeader}>
        <Icon name="check-circle" size={24} color={PALETTE.primary} />
        <Text style={styles.resultTitle}>Đã quét mã QR</Text>
      </View>
      {helperTitle ? <Text style={styles.resultHelper}>{helperTitle}</Text> : null}

      <View style={styles.payloadContainer}>
        <View style={styles.payloadRow}>
          <Icon name="fingerprint" size={18} color={PALETTE.primary} />
          <Text style={styles.payloadLabel}>Dữ liệu</Text>
        </View>
        <Text style={styles.payloadValue} numberOfLines={4} ellipsizeMode="middle">
          {scannedResult.value}
        </Text>

        {parsedPayload?.classId ? (
          <View style={styles.payloadMeta}>
            <View style={styles.metaRow}>
              <Icon name="barcode-scan" size={18} color={PALETTE.accent} />
              <Text style={styles.metaText}>Lớp: {shortenValue(parsedPayload.classId)}</Text>
            </View>
            {parsedPayload?.generatedAt ? (
              <View style={styles.metaRow}>
                <Icon name="clock-time-four-outline" size={18} color={PALETTE.accent} />
                <Text style={styles.metaText}>
                  Sinh lúc: {formatDateTime(parsedPayload.generatedAt)}
                </Text>
              </View>
            ) : null}
            {parsedPayload?.token ? (
              <View style={styles.metaRow}>
                <Icon name="shield-key" size={18} color={PALETTE.accent} />
                <Text style={styles.metaText}>Token: {shortenValue(parsedPayload.token)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {actionState.status !== 'idle' ? (
        <View
          style={[
            styles.feedbackBanner,
            actionState.status === 'success' ? styles.feedbackSuccess : styles.feedbackError,
          ]}
        >
          <Icon
            name={actionState.status === 'success' ? 'check-circle-outline' : 'alert-circle-outline'}
            size={18}
            color={PALETTE.textOnPrimary}
          />
          <Text style={styles.feedbackText}>{actionState.message}</Text>
        </View>
      ) : null}

      <View style={styles.resultActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleRescan}
        >
          <Text style={styles.secondaryButtonText}>Quét lại</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.primaryButton,
            disableActions && styles.actionButtonDisabled,
          ]}
          disabled={actionLoading === 'checkin' || disableActions}
          onPress={() => handleAttendanceAction('checkin')}
        >
          {actionLoading === 'checkin' ? (
            <ActivityIndicator color={PALETTE.textOnPrimary} />
          ) : (
            <Text style={styles.primaryButtonText}>Check-in</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.tonalButton,
            disableActions && styles.actionButtonDisabled,
          ]}
          disabled={actionLoading === 'checkout' || disableActions}
          onPress={() => handleAttendanceAction('checkout')}
        >
          {actionLoading === 'checkout' ? (
            <ActivityIndicator color={PALETTE.textPrimary} />
          ) : (
            <Text style={styles.tonalButtonText}>Check-out</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  ) : (
    <View style={styles.helperCard}>
      <Icon name="qrcode-scan" size={22} color={PALETTE.accent} />
      <Text style={styles.helperText}>{helperTitle || DEFAULT_HELPER_TEXT}</Text>
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
          <Icon name="close" size={26} color={PALETTE.textPrimary} />
          <Text style={[styles.actionLabel, styles.actionLabelSpacing]}>Đóng</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleTorchToggle}>
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
            scanThrottleDelay={1200}
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
        <View style={styles.footer}>{renderResultCard}</View>
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
    justifyContent: 'space-evenly',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(5, 19, 11, 0.95)',
    borderTopColor: PALETTE.outline,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionButton: {
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
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(5, 19, 11, 0.96)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: PALETTE.outline,
  },
  helperCard: {
    backgroundColor: PALETTE.surfaceMuted,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PALETTE.borderBright,
  },
  helperText: {
    color: PALETTE.textPrimary,
    fontSize: 14,
    flex: 1,
    marginLeft: 12,
  },
  resultCard: {
    backgroundColor: PALETTE.surfaceElevated,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    borderWidth: 1,
    borderColor: PALETTE.outline,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.textPrimary,
    marginLeft: 10,
  },
  resultHelper: {
    color: PALETTE.textSecondary,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  payloadContainer: {
    backgroundColor: PALETTE.surfaceMuted,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PALETTE.outline,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  payloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  payloadLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: PALETTE.textPrimary,
  },
  payloadValue: {
    color: PALETTE.textPrimary,
    fontSize: 14,
    lineHeight: 20,
  },
  payloadMeta: {
    marginTop: 12,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 13,
    color: PALETTE.textSecondary,
    fontWeight: '600',
  },
  feedbackBanner: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  feedbackSuccess: {
    backgroundColor: 'rgba(48, 196, 81, 0.22)',
  },
  feedbackError: {
    backgroundColor: 'rgba(253, 93, 93, 0.22)',
  },
  feedbackText: {
    color: PALETTE.textPrimary,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  resultActions: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: PALETTE.outline,
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PALETTE.textPrimary,
  },
  primaryButton: {
    backgroundColor: PALETTE.primary,
    shadowColor: PALETTE.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  primaryButtonText: {
    color: PALETTE.textOnPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  tonalButton: {
    backgroundColor: 'rgba(48, 196, 81, 0.16)',
  },
  tonalButtonText: {
    color: PALETTE.primary,
    fontWeight: '700',
    fontSize: 15,
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
});

export default QrScannerModal;

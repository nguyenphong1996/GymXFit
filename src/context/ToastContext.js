import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import ToastBanner from '../components/ToastBanner';

const ToastContext = createContext({
  showToast: () => {},
});

export const ToastProvider = ({ children }) => {
  const [toastState, setToastState] = useState({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    duration: 3000,
  });
  const hideTimeoutRef = useRef(null);

  const hideToast = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    setToastState(prev => ({ ...prev, visible: false }));
  }, []);

  const showToast = useCallback(
    ({
      type = 'info',
      title = '',
      message = '',
      duration = 3500,
    } = {}) => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      setToastState({
        visible: true,
        type,
        title,
        message,
        duration,
      });

      hideTimeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [hideToast],
  );

  useEffect(
    () => () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastBanner
        visible={toastState.visible}
        type={toastState.type}
        title={toastState.title}
        message={toastState.message}
        onHide={hideToast}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

export default ToastContext;

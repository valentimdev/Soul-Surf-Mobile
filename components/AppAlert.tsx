import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export type AppAlertButton = {
  text: string;
  onPress?: () => void | Promise<void>;
  style?: 'default' | 'cancel' | 'destructive';
};

type AppAlertState = {
  title: string;
  message?: string;
  buttons: AppAlertButton[];
};

type AppAlertContextValue = {
  showAlert: (title: string, message?: string, buttons?: AppAlertButton[]) => void;
};

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

export function AppAlertProvider({ children }: PropsWithChildren) {
  const [alertState, setAlertState] = useState<AppAlertState | null>(null);

  const closeAlert = useCallback(() => {
    setAlertState(null);
  }, []);

  const showAlert = useCallback((title: string, message?: string, buttons?: AppAlertButton[]) => {
    setAlertState({
      title,
      message,
      buttons: buttons?.length ? buttons : [{ text: 'OK' }],
    });
  }, []);

  const contextValue = useMemo(() => ({ showAlert }), [showAlert]);

  const handleButtonPress = useCallback(
    async (button: AppAlertButton) => {
      closeAlert();
      await button.onPress?.();
    },
    [closeAlert]
  );

  const primaryButton = alertState?.buttons.length === 1;

  return (
    <AppAlertContext.Provider value={contextValue}>
      {children}
      <Modal
        animationType="fade"
        transparent
        visible={Boolean(alertState)}
        onRequestClose={closeAlert}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeAlert} />
          {alertState ? (
            <View style={styles.card}>
              <View style={styles.iconCircle}>
                <Text style={styles.iconText}>i</Text>
              </View>
              <Text style={styles.title}>{alertState.title}</Text>
              {alertState.message ? (
                <Text style={styles.message}>{alertState.message}</Text>
              ) : null}
              <View style={styles.actions}>
                {alertState.buttons.map((button, index) => {
                  const isCancel = button.style === 'cancel';
                  const isDestructive = button.style === 'destructive';

                  return (
                    <TouchableOpacity
                      key={`${button.text}-${index}`}
                      activeOpacity={0.8}
                      onPress={() => void handleButtonPress(button)}
                      style={[
                        styles.button,
                        primaryButton || (!isCancel && !isDestructive)
                          ? styles.primaryButton
                          : styles.secondaryButton,
                        isDestructive && styles.destructiveButton,
                      ]}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          primaryButton || (!isCancel && !isDestructive)
                            ? styles.primaryButtonText
                            : styles.secondaryButtonText,
                          isDestructive && styles.destructiveButtonText,
                        ]}
                      >
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>
    </AppAlertContext.Provider>
  );
}

export function useAppAlert() {
  const context = useContext(AppAlertContext);
  return context ?? { showAlert: () => undefined };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(31,74,99,0.42)',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E2D3',
    backgroundColor: '#FAF5E8',
    padding: 20,
    alignItems: 'center',
    shadowColor: '#1F4A63',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E7F1F4',
    marginBottom: 12,
  },
  iconText: {
    color: '#5D9AB6',
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  title: {
    color: '#2A4B7C',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: '#4B647A',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  button: {
    flex: 1,
    minHeight: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  primaryButton: {
    backgroundColor: '#5D9AB6',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#D7CDB9',
    backgroundColor: '#FFFFFF',
  },
  destructiveButton: {
    backgroundColor: '#2A4B7C',
    borderWidth: 0,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#2A4B7C',
  },
  destructiveButtonText: {
    color: '#FFFFFF',
  },
});

import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export const BiometricService = {
    /**
     * Check if hardware supports biometrics
     */
    checkAvailability: async (): Promise<{ hasHardware: boolean; isEnrolled: boolean; supportedTypes: LocalAuthentication.AuthenticationType[] }> => {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

        return { hasHardware, isEnrolled, supportedTypes };
    },

    /**
     * Authenticate user with biometrics
     */
    authenticate: async (promptMessage: string = 'Authenticate to unlock'): Promise<boolean> => {
        try {
            console.log('[BiometricService] Starting authentication...');
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage,
                fallbackLabel: 'Use Passcode',
                cancelLabel: 'Cancel',
                disableDeviceFallback: false,
            });
            console.log('[BiometricService] Result:', result);

            return result.success;
        } catch (error) {
            console.error('[BiometricService] Authentication failed:', error);
            return false;
        }
    },

    /**
     * Set biometric preference
     */
    setBiometricEnabled: async (enabled: boolean) => {
        if (enabled) {
            await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
        } else {
            await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
        }
    },

    /**
     * Check if biometric is enabled by user preference
     */
    isBiometricEnabled: async (): Promise<boolean> => {
        const result = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
        return result === 'true';
    },

    /**
     * Save credentials securely
     */
    saveCredentials: async (email: string, pass: string) => {
        await SecureStore.setItemAsync('user_email', email);
        await SecureStore.setItemAsync('user_pass', pass);
    },

    /**
     * Retrieve credentials securely
     */
    getCredentials: async (): Promise<{ email: string; pass: string } | null> => {
        const email = await SecureStore.getItemAsync('user_email');
        const pass = await SecureStore.getItemAsync('user_pass');
        if (email && pass) {
            return { email, pass };
        }
        return null;
    },

    /**
     * Clear credentials
     */
    clearCredentials: async () => {
        await SecureStore.deleteItemAsync('user_email');
        await SecureStore.deleteItemAsync('user_pass');
    }
};

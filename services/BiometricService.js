import FingerprintScanner from 'react-native-fingerprint-scanner';

const BiometricService = {
  isSensorAvailable: async () => {
    try {
      await FingerprintScanner.isSensorAvailable();
      return true;
    } catch (error) {
      return false;
    }
  },

  authenticate: async () => {
    try {
      await FingerprintScanner.authenticate({ description: 'Scan your fingerprint to authenticate' });
      return true;
    } catch (error) {
      throw error;
    }
  },

  release: () => {
    FingerprintScanner.release();
  }
};

export default BiometricService;

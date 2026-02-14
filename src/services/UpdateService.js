import { Platform, Alert, Linking } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import ReactNativeBlobUtil from 'react-native-blob-util';

// NOTE: User needs to replace this with their actual raw GitHub URL after they upload version.json
const VERSION_JSON_URL =
  'https://raw.githubusercontent.com/areebmohd/BusinessManager/refs/heads/main/version.json';

/**
 * Checks for updates and returns the result.
 * @returns {Promise<{updateAvailable: boolean, data: object | null, error: string | null}>}
 */
const checkUpdate = async () => {
    try {
        console.log('Checking for updates...');
        const response = await fetch(VERSION_JSON_URL, {
            headers: {
                'Cache-Control': 'no-cache',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch version info');
        }

        const data = await response.json();
        const currentVersion = DeviceInfo.getVersion();

        // Simple version comparison logic (assumes semver or simpler)
        const isUpdateAvailable = compareVersions(data.version, currentVersion) > 0;

        console.log(
            `Current: ${currentVersion}, Latest: ${data.version}, Update Available: ${isUpdateAvailable}`,
        );

        return {
            updateAvailable: isUpdateAvailable,
            data: isUpdateAvailable ? data : null,
            error: null
        };

    } catch (error) {
        console.error('Update check failed:', error);
        return {
            updateAvailable: false,
            data: null,
            error: error.message
        };
    }
};

const compareVersions = (v1, v2) => {
  // Basic implementation: assumes format "x.y.z"
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
};

const downloadAndInstall = async url => {
  try {
    const android = ReactNativeBlobUtil.android;
    const dirs = ReactNativeBlobUtil.fs.dirs;
    const filePath = `${dirs.DownloadDir}/app-update.apk`;

    Alert.alert(
      'Downloading',
      'Downloading update found. Please check notification bar or wait...',
    );

    const res = await ReactNativeBlobUtil.config({
      addAndroidDownloads: {
        useDownloadManager: true,
        notification: true,
        title: 'Downloading Update',
        description: 'Downloading new version of the app',
        mime: 'application/vnd.android.package-archive',
        path: filePath,
      },
    }).fetch('GET', url);

    // Trigger install
    android.actionViewIntent(
      res.path(),
      'application/vnd.android.package-archive',
    );
  } catch (error) {
    console.error('Download error:', error);
    Alert.alert('Update Failed', 'Could not download the update.');
  }
};

export default {
  checkUpdate,
  downloadAndInstall
};

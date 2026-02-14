import React, { useEffect, useState } from 'react';
import UpdateService from '../services/UpdateService';
import UpdateModal from './UpdateModal';

const AppUpdateChecker = () => {
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateData, setUpdateData] = useState(null);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const result = await UpdateService.checkUpdate();
      if (result.updateAvailable && result.data) {
        setUpdateData(result.data);
        setUpdateModalVisible(true);
      }
    } catch (error) {
      console.log('Auto update check failed:', error);
    }
  };

  const handleUpdate = () => {
    if (updateData?.downloadUrl) {
      setUpdateModalVisible(false);
      UpdateService.downloadAndInstall(updateData.downloadUrl);
    }
  };

  if (!updateData) return null;

  return (
    <UpdateModal
      visible={updateModalVisible}
      updateData={updateData}
      onUpdate={handleUpdate}
      onCancel={() => setUpdateModalVisible(false)}
    />
  );
};

export default AppUpdateChecker;

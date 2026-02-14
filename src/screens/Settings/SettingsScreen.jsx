import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAlert } from '../../context/AlertContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import {
  saveSettings,
  subscribeToSettings,
} from '../../services/FirestoreService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { checkSubscriptionStatus } from '../../services/SubscriptionService';
import UpdateService from '../../services/UpdateService';
import DeviceInfo from 'react-native-device-info';
import UpdateModal from '../../components/UpdateModal';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
  const { subscriptionStatus } = useAuth();
  const [appVersion, setAppVersion] = useState('');
  const [businessDetails, setBusinessDetails] = useState({
    businessName: '',
    ownerName: '',
    phone: '',
    email: '',
    upiId: '',
  });

  // Update Modal State
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateData, setUpdateData] = useState(null);

  useEffect(() => {
    if (!user) return;

    setAppVersion(DeviceInfo.getVersion());

    // Load subscription details
    checkSubscriptionStatus(user.uid).then(status => {
      if (status.expiryDate) {
        setExpiryDate(
          status.expiryDate.toDate
            ? status.expiryDate.toDate()
            : new Date(status.expiryDate),
        );
      }
    });

    const unsubscribe = subscribeToSettings(user.uid, settings => {
      if (settings && settings.businessDetails) {
        setBusinessDetails(prev => ({ ...prev, ...settings.businessDetails }));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await saveSettings(user.uid, {
        businessDetails: businessDetails,
      });
      showAlert('Success', 'Business details saved successfully', 'success');
      setIsEditing(false);
    } catch (error) {
      showAlert('Error', 'Failed to save settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      handleSave();
    } else {
      setIsEditing(true);
    }
  };

  const handleChange = (field, value) => {
    setBusinessDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleLogout = () => {
    showAlert('Logout', 'Are you sure you want to logout?', 'warning', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: logout, style: 'destructive' },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F7FA' }}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.header}>Settings</Text>
            <Text style={styles.subHeader}>Account Information</Text>
          </View>
        </View>

        {/* App Updates Section */}
        <Text style={styles.sectionTitle}>App Updates</Text>
        <View style={styles.section}>
          <View style={styles.accountInfoRow}>
            <View
              style={[styles.iconContainer, { backgroundColor: '#e0f2f1' }]}
            >
              <MaterialIcons name="system-update" size={20} color="#00695c" />
            </View>
            <View>
              <Text style={styles.infoText}>Current Version</Text>
              <Text style={styles.subInfoText}>v{appVersion}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.updateButton}
            onPress={async () => {
              setLoading(true);
              const result = await UpdateService.checkUpdate();
              setLoading(false);

              if (result.updateAvailable) {
                setUpdateData(result.data);
                setUpdateModalVisible(true);
              } else if (result.error) {
                showAlert('Error', 'Failed to check for updates', 'error');
              } else {
                showAlert(
                  'Up to Date',
                  'You are using the latest version.',
                  'success',
                );
              }
            }}
          >
            <Text style={styles.updateButtonText}>Check for Updates</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Business Details</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Business Name</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            placeholder="e.g. My General Store"
            selectionColor="#007bff"
            value={businessDetails.businessName}
            onChangeText={text => handleChange('businessName', text)}
            editable={isEditing}
          />

          <Text style={styles.label}>Owner Name</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            placeholder="e.g. John Doe"
            selectionColor="#007bff"
            value={businessDetails.ownerName}
            onChangeText={text => handleChange('ownerName', text)}
            editable={isEditing}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            placeholder="e.g. +91 9876543210"
            selectionColor="#007bff"
            keyboardType="phone-pad"
            value={businessDetails.phone}
            onChangeText={text => handleChange('phone', text)}
            editable={isEditing}
          />

          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            placeholder="e.g. business@example.com"
            selectionColor="#007bff"
            keyboardType="email-address"
            value={businessDetails.email}
            onChangeText={text => handleChange('email', text)}
            editable={isEditing}
          />

          <Text style={styles.label}>UPI ID</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.disabledInput]}
            placeholder="e.g. business@upi"
            selectionColor="#007bff"
            value={businessDetails.upiId}
            onChangeText={text => handleChange('upiId', text)}
            editable={isEditing}
          />

          <TouchableOpacity
            style={[styles.saveButton, !isEditing ? styles.editButton : {}]}
            onPress={toggleEdit}
          >
            <Text style={styles.saveText}>
              {isEditing ? 'Save Details' : 'Edit Details'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Premium Subscription Section */}
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View
          style={[
            styles.section,
            styles.premiumCard,
            subscriptionStatus === 'active' && styles.activeCard,
          ]}
        >
          <View style={styles.premiumHeader}>
            <View style={styles.premiumTitleRow}>
              <MaterialIcons name="diamond" size={24} color="#FFD700" />
              <Text style={styles.premiumTitle}>
                {subscriptionStatus === 'active' ? 'Premium Plan' : 'Free Plan'}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                subscriptionStatus === 'active'
                  ? styles.activeBadge
                  : styles.expiredBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  subscriptionStatus === 'active'
                    ? styles.activeText
                    : styles.expiredText,
                ]}
              >
                {subscriptionStatus === 'active' ? 'ACTIVE' : 'EXPIRED'}
              </Text>
            </View>
          </View>

          {subscriptionStatus === 'active' ? (
            <View style={styles.validityContainer}>
              <MaterialIcons name="event" size={16} color="#9CA3AF" />
              <Text style={styles.validityText}>
                Valid until{' '}
                {expiryDate
                  ? expiryDate.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      year: 'numeric',
                    })
                  : 'Unknown'}
              </Text>
            </View>
          ) : (
            <Text style={styles.premiumSubtitle}>
              Upgrade to remove limits and access all features.
            </Text>
          )}

          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() =>
              navigation.navigate('Premium', { fromSettings: true })
            }
          >
            <Text style={styles.upgradeButtonText}>
              {subscriptionStatus === 'active'
                ? 'Manage Subscription'
                : 'Upgrade Now'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.section}>
          <View style={styles.accountInfoRow}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="person" size={20} color="#007bff" />
            </View>
            <Text style={styles.infoText}>{user?.email || 'User'}</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="#fff" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Update Modal */}
        <UpdateModal
          visible={updateModalVisible}
          updateData={updateData}
          onUpdate={() => {
            setUpdateModalVisible(false);
            if (updateData?.downloadUrl) {
              UpdateService.downloadAndInstall(updateData.downloadUrl);
            }
          }}
          onCancel={() => setUpdateModalVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 10,
    paddingBottom: 0,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerContainer: {
    marginBottom: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.5,
  },
  subHeader: {
    fontSize: 15,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    paddingTop: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 10,
    marginLeft: 4,
  },
  editLink: { color: '#007bff', fontSize: 14, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 14,
    backgroundColor: '#FFFFFF',
    color: '#111827',
  },
  disabledInput: { backgroundColor: '#F9FAFB', color: '#6B7280' },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  editButton: {
    backgroundColor: '#007bff',
    shadowColor: '#007bff',
  },
  saveText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Account Section Styles
  accountInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#ebf3feff',
    padding: 12,
    borderRadius: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
  },
  subInfoText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  updateButton: {
    backgroundColor: '#00695c',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  logoutText: { color: '#fff', fontSize: 15, fontWeight: '700', marginLeft: 8 },
  premiumButton: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    elevation: 3,
  },
  premiumButtonText: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Premium Card Styles
  premiumCard: {
    backgroundColor: '#1F2937', // Dark background
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  activeCard: {
    borderColor: '#FFD700', // Gold border for active
    backgroundColor: '#111827', // Slightly darker for active
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },
  premiumTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFD700', // Gold text
    marginLeft: 10,
    marginBottom: 5,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  expiredBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  activeText: { color: '#10B981' },
  expiredText: { color: '#EF4444' },

  premiumSubtitle: {
    color: '#D1D5DB',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  validityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  validityText: {
    color: '#E5E7EB',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
});

export default SettingsScreen;

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { checkSubscriptionStatus } from '../../services/SubscriptionService';

import {
  initiatePayment,
  processSuccessfulPayment,
  getPricing,
} from '../../services/PaymentService';

const PremiumScreen = ({ navigation, route }) => {
  const { user, setSubscriptionStatus, subscriptionStatus, logout } = useAuth();
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [expiryDate, setExpiryDate] = useState(null);
  const [pricing, setPricing] = useState({
    monthly: { amount: 4900, display: '49', name: 'Monthly', currency: '₹' },
    yearly: { amount: 49000, display: '490', name: 'Yearly', currency: '₹' },
  });

  useEffect(() => {
    loadStatus();
    loadPricing();
  }, []);

  const loadPricing = () => {
    try {
      const prices = getPricing();
      setPricing({
        monthly: { ...prices.monthly, currency: prices.symbol },
        yearly: { ...prices.yearly, currency: prices.symbol },
      });
    } catch (e) {
      console.error('Failed to load pricing', e);
    }
  };

  const loadStatus = async () => {
    if (user) {
      const status = await checkSubscriptionStatus(user.uid);
      if (status.expiryDate) {
        setExpiryDate(status.expiryDate);
      }
    }
  };

  const handlePurchase = async planType => {
    setLoading(true);
    try {
      const payment = await initiatePayment(
        planType,
        user.email,
        user.phoneNumber || '9999999999',
      );
      console.log('Payment Success:', payment);

      // Verify and Upgrade
      await processSuccessfulPayment(
        user.uid,
        planType,
        payment.razorpay_payment_id,
      );

      showAlert('Success', 'Welcome to Premium!', 'success', [
        {
          text: 'OK',
          onPress: () => {
            // Update global state and navigate back
            setSubscriptionStatus('active');
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          },
        },
      ]);
    } catch (error) {
      console.log('Payment Cancelled/Failed', error);
      if (error.code !== 'PAYMENT_CANCELLED') {
        showAlert(
          'Payment Failed',
          'Something went wrong. Please try again.',
          'error',
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#111827" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <MaterialIcons name="diamond" size={60} color="#FFD700" />
          <Text style={styles.title}>Go Premium</Text>
          <Text style={styles.subtitle}>
            Unlock unlimited access to BizManager
          </Text>
          {user?.email && (
            <View style={styles.userContainer}>
              <Text style={styles.userText}>{user.email}</Text>
            </View>
          )}
        </View>

        <View
          style={[
            styles.statusContainer,
            subscriptionStatus === 'active'
              ? styles.activeStatusContainer
              : styles.expiredStatusContainer,
          ]}
        >
          {subscriptionStatus === 'active' ? (
            <View>
              <Text style={[styles.statusText, styles.activeStatusText]}>
                Your premium plan is active.
              </Text>
              {expiryDate && (
                <Text style={styles.validityText}>
                  Valid till{' '}
                  {expiryDate.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
              )}
              <Text style={styles.renewText}>You can extend it now.</Text>
            </View>
          ) : (
            <Text style={styles.statusText}>
              Your free trial has ended. Please subscribe to continue managing
              your business efficiently.
            </Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>Choose a Plan</Text>

        {/* Monthly Plan */}
        <TouchableOpacity
          style={styles.planCard}
          onPress={() => handlePurchase('monthly')}
          disabled={loading}
        >
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{pricing.monthly.name}</Text>
            <Text style={styles.planDuration}>30 Days</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>{pricing.monthly.currency}</Text>
            <Text style={styles.price}>{pricing.monthly.display}</Text>
          </View>
        </TouchableOpacity>

        {/* Yearly Plan */}
        <TouchableOpacity
          style={[styles.planCard, styles.recommendedCard]}
          onPress={() => handlePurchase('yearly')}
          disabled={loading}
        >
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>Best Value</Text>
          </View>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{pricing.yearly.name}</Text>
            <Text style={styles.planDuration}>360 Days</Text>
            <Text style={styles.discountText}>2 Months Free</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.currency}>{pricing.yearly.currency}</Text>
            <Text style={styles.price}>{pricing.yearly.display}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={async () => {
            setLoading(true);
            await loadStatus();
            setLoading(false);
            showAlert(
              'Status Refreshed',
              'Your subscription status has been updated.',
              'success',
            );
          }}
        >
          <Text style={styles.restoreText}>Refresh Subscription Status</Text>
        </TouchableOpacity>

        {!route.params?.fromSettings && (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() => {
              showAlert(
                'Logout',
                'Are you sure you want to logout?',
                'warning',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Logout', onPress: logout, style: 'destructive' },
                ],
              );
            }}
          >
            <MaterialIcons name="logout" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#FFD700" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  scrollContent: { padding: 20, paddingTop: 0, alignItems: 'center' },
  header: { alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 5,
  },
  userContainer: {
    marginTop: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  userText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '500',
  },

  statusContainer: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    width: '100%',
  },
  expiredStatusContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  activeStatusContainer: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  statusText: {
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
    color: '#F87171',
  },
  activeStatusText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  validityText: {
    color: '#D1D5DB',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 4,
  },
  renewText: {
    color: '#9CA3AF',
    textAlign: 'center',
    fontSize: 13,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#E5E7EB',
    alignSelf: 'flex-start',
    marginBottom: 15,
  },

  planCard: {
    width: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#374151',
  },
  recommendedCard: {
    borderColor: '#FFD700',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  badgeContainer: {
    position: 'absolute',
    top: -12,
    left: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: { color: '#000', fontSize: 12, fontWeight: '700' },

  planInfo: { flex: 1 },
  planName: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  planDuration: { fontSize: 14, color: '#9CA3AF', marginTop: 2 },
  discountText: {
    color: '#10B981',
    fontWeight: '700',
    marginTop: 4,
    fontSize: 13,
  },

  priceContainer: { alignItems: 'flex-end' },
  currency: { fontSize: 16, color: '#9CA3AF' },
  price: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },

  restoreButton: { marginTop: 20, padding: 15 },
  restoreText: {
    color: '#6B7280',
    fontSize: 14,
  },

  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default PremiumScreen;

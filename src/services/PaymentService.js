import RazorpayCheckout from 'react-native-razorpay';
import * as RNLocalize from 'react-native-localize';
import { upgradeSubscription } from './SubscriptionService';

// REPLACE WITH YOUR RAZORPAY LIVE KEY ID
const RAZORPAY_KEY_ID = 'rzp_live_SHFPsIE7Y1wllr'; // TODO: Replace with your actual Live Key ID

export const getPricing = () => {
  const countryCode = RNLocalize.getCountry();
  const isIndia = countryCode === 'IN';

  if (isIndia) {
    return {
      currency: 'INR',
      symbol: '₹',
      // TEST MODE PRICING (₹1)
      // monthly: { amount: 100, display: '1', name: 'Monthly Premium (Test)' }, // 100 paise = ₹1
      // yearly: { amount: 100, display: '1', name: 'Yearly Premium (Test)' }, // 100 paise = ₹1

      // REAL PRICING (Restored functionality)
      monthly: { amount: 4900, display: '49', name: 'Monthly Premium' }, // Amount in paise
      yearly: { amount: 49000, display: '490', name: 'Yearly Premium' },
    };
  } else {
    return {
      currency: 'USD',
      symbol: '$',
      monthly: { amount: 100, display: '1', name: 'Monthly Premium' }, // Amount in cents? Razorpay handles currency
      yearly: { amount: 1000, display: '10', name: 'Yearly Premium' },
    };
  }
};

export const initiatePayment = async (planType, userEmail, userContact) => {
  const pricing = getPricing();
  const plan = planType === 'monthly' ? pricing.monthly : pricing.yearly;

  const options = {
    description: `BizManager ${plan.name}`,
    image: 'app_logo', // Use app_logo from drawable
    currency: pricing.currency,
    key: RAZORPAY_KEY_ID,
    amount: plan.amount,
    name: 'BizManager',
    prefill: {
      email: userEmail,
      contact: userContact,
      name: 'User',
    },
    theme: { color: '#111827' },
  };

  return new Promise((resolve, reject) => {
    RazorpayCheckout.open(options)
      .then(data => {
        // handle success
        console.log(`Success: ${data.razorpay_payment_id}`);
        resolve(data);
      })
      .catch(error => {
        // handle failure
        console.log(`Error: ${error.code} | ${error.description}`);
        reject(error);
      });
  });
};

export const processSuccessfulPayment = async (uid, planType, paymentId) => {
  // In a real app, verify paymentId with backend before upgrading
  // For now, we trust the client (See Plan for security notes)
  await upgradeSubscription(uid, planType);
  return true;
};

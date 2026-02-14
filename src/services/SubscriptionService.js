import firestore from '@react-native-firebase/firestore';

// Collection reference
const usersCollection = firestore().collection('users');

/**
 * Initialize a new user with a 7-day free trial.
 * @param {string} uid - User ID
 */
export const startTrial = async (uid) => {
    try {
        const userDoc = usersCollection.doc(uid);
        const docSnap = await userDoc.get();

        if (!docSnap.exists) {
            // New user: Set trial
            const now = new Date();
            const expiryDate = new Date();
            expiryDate.setDate(now.getDate() + 7); // 7 Days Trial

            await userDoc.set({
                subscription: {
                    status: 'trial',
                    planType: 'trial',
                    startDate: firestore.Timestamp.fromDate(now),
                    expiryDate: firestore.Timestamp.fromDate(expiryDate),
                    isTrialUsed: true,
                    countryCode: 'IN' // Defaulting to IN, can be updated later
                },
                createdAt: firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        }
    } catch (error) {
        console.error("Error starting trial:", error);
        throw error;
    }
};

/**
 * Check the current subscription status of the user.
 * @param {string} uid - User ID
 * @returns {Promise<object>} - { status, expiryDate, daysLeft }
 */
export const checkSubscriptionStatus = async (uid) => {
    try {
        const userDoc = await usersCollection.doc(uid).get();
        if (!userDoc.exists) return { status: 'expired', daysLeft: 0 };

        const data = userDoc.data();
        const sub = data.subscription;

        if (!sub) return { status: 'expired', daysLeft: 0 };

        const now = new Date();
        const expiryDate = sub.expiryDate.toDate();
        const diffTime = expiryDate - now;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (daysLeft <= 0) {
            // Expired
            if (sub.status !== 'expired') {
                await usersCollection.doc(uid).update({
                    'subscription.status': 'expired'
                });
            }
            return { status: 'expired', daysLeft: 0, expiryDate };
        }

        return { status: sub.status, daysLeft, expiryDate, planType: sub.planType };

    } catch (error) {
        console.error("Error checking subscription:", error);
        return { status: 'error', daysLeft: 0 };
    }
};

/**
 * Upgrade the user's subscription after payment.
 * @param {string} uid 
 * @param {string} planType - 'monthly' | 'yearly'
 */
export const upgradeSubscription = async (uid, planType) => {
    try {
        const now = new Date();
        const expiryDate = new Date();

        if (planType === 'monthly') {
            expiryDate.setDate(now.getDate() + 30);
        } else if (planType === 'yearly') {
            expiryDate.setDate(now.getDate() + 360);
        }

        await usersCollection.doc(uid).update({
            'subscription.status': 'premium',
            'subscription.planType': planType,
            'subscription.startDate': firestore.Timestamp.fromDate(now),
            'subscription.expiryDate': firestore.Timestamp.fromDate(expiryDate),
        });

    } catch (error) {
        console.error("Error upgrading subscription:", error);
        throw error;
    }
};

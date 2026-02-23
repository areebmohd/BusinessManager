import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from 'react';
import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { startTrial } from '../services/SubscriptionService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState('loading');
  const isSigningUp = useRef(false);

  // Handle user state changes
  async function onAuthStateChanged(user) {
    setUser(user);

    if (user) {
      if (isSigningUp.current) {
        console.log(
          'User is signing up, skipping subscription check in onAuthStateChanged',
        );
        // We set it to active temporarily so they don't see the paywall during signup/verification
        setSubscriptionStatus('active');
        return;
      }
      try {
        // Dynamic import to avoid circular dependency if possible, though strict requirement
        const {
          checkSubscriptionStatus,
        } = require('../services/SubscriptionService');
        const status = await checkSubscriptionStatus(user.uid);
        setSubscriptionStatus(
          status.status === 'expired' ? 'expired' : 'active',
        );
      } catch (e) {
        console.error('Subscription check failed', e);
        setSubscriptionStatus('active');
      }
    } else {
      setSubscriptionStatus('active');
    }

    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = auth().onAuthStateChanged(onAuthStateChanged);

    // Configure Google Signin
    GoogleSignin.configure({
      webClientId:
        '357903569441-td2899br6rfd7hosrgdruq6nofphtli9.apps.googleusercontent.com',
    });

    return subscriber; // unsubscribe on unmount
  }, []);

  const signInWithEmail = async (email, password) => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('Error signing in with email: ', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email, password) => {
    try {
      isSigningUp.current = true;
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );

      // Initialize Subscription logic is now handled automatically
      // in checkSubscriptionStatus which is called by onAuthStateChanged.
      // We keep isSigningUp = true to ensure the user isn't blocked by a paywall
      // while the background processes finish.

      // Send verification email immediately after signup
      if (userCredential.user && !userCredential.user.emailVerified) {
        await userCredential.user.sendEmailVerification();
      }
    } catch (error) {
      console.error('Error signing up with email: ', error);
      throw error;
    } finally {
      // Small delay to ensure state settles before releasing the lock?
      // No, await startTrial and checkSubscriptionStatus should be enough.
      isSigningUp.current = false;
    }
  };

  const sendVerificationEmail = async () => {
    try {
      if (auth().currentUser) {
        console.log(
          'Attempting to send verification email to:',
          auth().currentUser.email,
        );
        await auth().currentUser.sendEmailVerification();
        console.log('Verification email sent successfully.');
      } else {
        console.warn(
          'No current user found when trying to send verification email.',
        );
      }
    } catch (error) {
      console.error('Error sending verification email: ', error);
      throw error;
    }
  };

  const checkVerification = async () => {
    try {
      if (auth().currentUser) {
        await auth().currentUser.reload();
        // Force state update by setting user again
        setUser(auth().currentUser);
      }
    } catch (error) {
      console.error('Error checking verification: ', error);
      throw error;
    }
  };

  const sendPasswordResetEmail = async email => {
    try {
      console.log('Checking sign-in methods for:', email);
      const signInMethods = await auth().fetchSignInMethodsForEmail(email);

      if (signInMethods.length === 0) {
        throw new Error('No account found with this email.');
      }

      if (signInMethods.includes('google.com')) {
        throw new Error(
          'This email uses Google Sign-In. Please sign in with Google.',
        );
      }

      console.log('Attempting to send password reset email to:', email);
      await auth().sendPasswordResetEmail(email);
      console.log('Password reset email sent successfully.');
    } catch (error) {
      console.error('Error sending password reset email: ', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      // Check for Play Services
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // Get the ID token
      const signInResult = await GoogleSignin.signIn();

      // Safe handling if signInResult is strict
      let idToken = signInResult.idToken;
      if (!idToken && signInResult.data) {
        idToken = signInResult.data.idToken;
      }

      if (!idToken) {
        throw new Error('No ID token found');
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      isSigningUp.current = true; // Use signing up flag to prevent paywall flashes for potential new users
      try {
        return await auth().signInWithCredential(googleCredential);
      } finally {
        isSigningUp.current = false;
      }
    } catch (error) {
      console.error('Google Sign-In Error Details:', {
        code: error.code,
        message: error.message,
        userInfo: error.userInfo,
        nativeStack: error.nativeStack,
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await GoogleSignin.signOut(); // Sign out from Google as well
      await auth().signOut();
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const value = React.useMemo(
    () => ({
      user,
      initializing,
      subscriptionStatus,
      setSubscriptionStatus,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      logout,
      sendVerificationEmail,
      checkVerification,
      sendPasswordResetEmail,
    }),
    [user, initializing, subscriptionStatus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

import { RAZORPAY_KEY_ID, PLANS } from '../config/razorpay';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const initiateRazorpayPayment = (plan, userEmail, onSuccess, onFailure) => {
  const options = {
    key: RAZORPAY_KEY_ID,
    amount: plan.price,
    currency: 'INR',
    name: 'RentFlow',
    description: `${plan.name} Subscription`,
    image: '/logo192.png',
    prefill: {
      email: userEmail,
    },
    config: {
      display: {
        blocks: {
          banks: {
            name: 'All payment methods',
            instruments: [
              { method: 'card' },
              { method: 'netbanking' },
              { method: 'upi' }
            ]
          }
        },
        sequence: ['block.banks'],
        preferences: {
          show_default_blocks: true
        }
      }
    },
    theme: {
      color: '#2563eb'
    },
    handler: function (response) {
      onSuccess({
        paymentId: response.razorpay_payment_id,
        planId: plan.id,
        amount: plan.price,
        duration: plan.duration
      });
    },
    modal: {
      ondismiss: function() {
        onFailure('Payment cancelled by user');
      }
    }
  };

  const razorpay = new window.Razorpay(options);
  razorpay.on('payment.failed', function (response) {
    onFailure(response.error.description);
  });
  
  razorpay.open();
};

// Save subscription to Firestore
export const saveSubscription = async (userId, subscriptionData) => {
  try {
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const subscription = {
      ...subscriptionData,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + subscriptionData.duration * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    await setDoc(subscriptionRef, subscription);
    return subscription;
  } catch (error) {
    console.error('Error saving subscription:', error);
    throw error;
  }
};

// Check if user has active subscription
export const checkSubscription = async (userId) => {
  try {
    const subscriptionRef = doc(db, 'subscriptions', userId);
    const subscriptionDoc = await getDoc(subscriptionRef);
    
    if (!subscriptionDoc.exists()) {
      return { plan: 'FREE', active: true }; // Default free plan
    }
    
    const subscription = subscriptionDoc.data();
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    if (now > endDate) {
      return { ...subscription, active: false, expired: true };
    }
    
    return { ...subscription, active: true };
  } catch (error) {
    // If permission error or any other error, default to free plan
    console.log('Subscription check skipped:', error.code);
    return { plan: 'FREE', active: true };
  }
};
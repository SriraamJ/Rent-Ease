import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { checkSubscription } from '../services/paymentGatewayService';

const SubscriptionContext = createContext();

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadSubscription();
    } else {
      setSubscription(null);
      setLoading(false);
    }
  }, [currentUser]);

  const loadSubscription = async () => {
    try {
      const sub = await checkSubscription(currentUser.uid);
      setSubscription(sub);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setSubscription({ plan: 'FREE', active: true });
    } finally {
      setLoading(false);
    }
  };

  const isPro = () => {
    return subscription?.planId && subscription.active;
  };

  const canAddProperty = async (currentCount) => {
    if (isPro()) return true;
    return currentCount < 2;
  };

  const getPropertyLimit = () => {
    return isPro() ? 'Unlimited' : '2';
  };

  const value = {
    subscription,
    loading,
    isPro,
    canAddProperty,
    getPropertyLimit,
    refreshSubscription: loadSubscription
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};
// IMPORTANT: Replace with your actual Razorpay Test Key
export const RAZORPAY_KEY_ID = 'rzp_test_RfPGRxILvRF4Jq';

// Plan prices in paise (₹1 = 100 paise)
export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: ['2 properties', 'Unlimited tenants', 'Basic features']
  },
  PRO_MONTHLY: {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    price: 29900, // ₹299
    duration: 30, // days
    features: ['Unlimited properties', 'All features', 'Priority support']
  },
  PRO_YEARLY: {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    price: 299900, // ₹2999 (save ₹588)
    duration: 365,
    features: ['Unlimited properties', 'All features', 'Priority support', 'Save 17%']
  }
};
import { useState, useEffect } from 'react';
import { CreditCard, Check, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PLANS } from '../config/razorpay';
import { initiateRazorpayPayment, saveSubscription, checkSubscription } from '../services/paymentGatewayService';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';

function Billing() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const subscription = await checkSubscription(currentUser.uid);
      setCurrentSubscription(subscription);
    } catch (error) {
      setToast({ message: 'Error loading subscription', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planKey) => {
    const plan = PLANS[planKey];
    setProcessing(true);

    initiateRazorpayPayment(
      plan,
      currentUser.email,
      async (paymentData) => {
        try {
          await saveSubscription(currentUser.uid, paymentData);
          setToast({ message: 'Subscription activated successfully!', type: 'success' });
          loadSubscription();
        } catch (error) {
          setToast({ message: 'Error activating subscription', type: 'error' });
        } finally {
          setProcessing(false);
        }
      },
      (error) => {
        setToast({ message: `Payment failed: ${error}`, type: 'error' });
        setProcessing(false);
      }
    );
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading billing..." />;
  }

  const isProActive = currentSubscription?.planId && currentSubscription.active;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Billing & Subscription</h1>
      <p className="text-gray-600 mb-6">Manage your subscription and billing</p>

      {/* Current Plan */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {isProActive ? 'Pro' : 'Free'} Plan
            </p>
            {isProActive && (
              <p className="text-sm text-gray-600 mt-1">
                Valid until: {new Date(currentSubscription.endDate).toLocaleDateString('en-IN')}
              </p>
            )}
          </div>
          {isProActive && (
            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium">
              Active
            </div>
          )}
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly Plan */}
        <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-gray-200">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Pro Monthly</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">₹299</span>
              <span className="text-gray-600">/month</span>
            </div>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <span>Unlimited properties</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <span>Unlimited tenants</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <span>Advanced reports & analytics</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <span>Expense tracking</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <span>Priority support</span>
            </li>
          </ul>

          <button
            onClick={() => handleUpgrade('PRO_MONTHLY')}
            disabled={processing || isProActive}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProActive ? (
              'Current Plan'
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                {processing ? 'Processing...' : 'Upgrade Now'}
              </>
            )}
          </button>
        </div>

        {/* Yearly Plan */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-4 right-4">
            <span className="bg-yellow-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              SAVE 17%
            </span>
          </div>

          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">Pro Yearly</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">₹2,999</span>
              <span className="text-blue-100">/year</span>
            </div>
            <p className="text-sm text-blue-100 mt-1">₹250/month when billed annually</p>
          </div>

          <ul className="space-y-3 mb-8">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-blue-200" />
              <span>Everything in Monthly</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-blue-200" />
              <span>Save ₹588 per year</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-blue-200" />
              <span>Priority feature requests</span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-blue-200" />
              <span>Dedicated account manager</span>
            </li>
          </ul>

          <button
            onClick={() => handleUpgrade('PRO_YEARLY')}
            disabled={processing || isProActive}
            className="w-full py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isProActive ? (
              'Current Plan'
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                {processing ? 'Processing...' : 'Upgrade & Save'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Test Mode Notice */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Test Mode:</strong> Use card number <code className="bg-yellow-100 px-2 py-1 rounded">4111 1111 1111 1111</code>, 
          any future CVV and expiry date for testing.
        </p>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default Billing;
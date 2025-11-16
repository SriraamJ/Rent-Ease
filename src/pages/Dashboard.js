import { useState, useEffect } from 'react';
import { Home, Users, DollarSign, AlertCircle, Receipt} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProperties } from '../services/propertyService';
import { getTenants } from '../services/tenantService';
import { getPayments } from '../services/paymentService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Crown } from 'lucide-react';

function Dashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeTenants: 0,
    totalCollected: 0,
    recentPayments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);
const { isPro } = useSubscription();
  const loadDashboardData = async () => {
    try {
      const [properties, tenants, payments] = await Promise.all([
        getProperties(currentUser.uid),
        getTenants(currentUser.uid),
        getPayments(currentUser.uid)
      ]);

      const activeTenants = tenants.filter(t => t.status === 'active');
      const currentMonth = new Date().toISOString().slice(0, 7);
      const thisMonthPayments = payments.filter(p => p.month === currentMonth);
      const totalCollected = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

      setStats({
        totalProperties: properties.length,
        activeTenants: activeTenants.length,
        totalCollected,
        recentPayments: payments.slice(0, 5)
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    { 
      label: 'Total Properties', 
      value: stats.totalProperties, 
      icon: Home, 
      color: 'blue' 
    },
    { 
      label: 'Active Tenants', 
      value: stats.activeTenants, 
      icon: Users, 
      color: 'green' 
    },
    { 
      label: 'Collected This Month', 
      value: `₹${(stats.totalCollected / 100).toLocaleString()}`, 
      icon: DollarSign, 
      color: 'orange' 
    },
    { 
      label: 'Recent Payments', 
      value: stats.recentPayments.length, 
      icon: AlertCircle, 
      color: 'purple' 
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  if (loading) {
  return <LoadingSpinner size="lg" text="Loading dashboard..." />;
}

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
  <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
  {isPro() && (
    <span className="flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-sm font-semibold">
      <Crown className="w-4 h-4" />
      PRO
    </span>
  )}
</div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsData.map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${colorClasses[stat.color]}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
  <h2 className="text-xl font-bold mb-4">Recent Payments</h2>
  {stats.recentPayments.length === 0 ? (
    <div className="text-center py-12">
      <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 mb-4">No payments recorded yet</p>
      <p className="text-sm text-gray-400">Payments will appear here once you start recording them</p>
    </div>
  ) : (
    <div className="space-y-3">
      {stats.recentPayments.map((payment) => (
        <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">{payment.tenantName}</p>
            <p className="text-sm text-gray-600">
              {payment.propertyName} • {new Date(payment.month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold text-gray-900">₹{(payment.amount / 100).toLocaleString()}</p>
            <p className="text-xs text-gray-500">{new Date(payment.paidDate).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
    </div>
  );
}

export default Dashboard;
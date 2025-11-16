import { useState, useEffect } from 'react';
import { AlertCircle, Phone, MessageCircle, IndianRupee } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTenants } from '../services/tenantService';
import { getPayments } from '../services/paymentService';
import { checkOverduePayments, getOverdueMonths } from '../utils/overdueHelper';
import { sendWhatsAppReminder } from '../utils/reminderHelper';
import LoadingSpinner from '../components/LoadingSpinner';

function Overdue() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [overdueList, setOverdueList] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [expandedTenant, setExpandedTenant] = useState(null);

  useEffect(() => {
    loadOverdueData();
  }, []);

  const loadOverdueData = async () => {
    try {
      const [tenants, payments] = await Promise.all([
        getTenants(currentUser.uid),
        getPayments(currentUser.uid)
      ]);
      
      const overdue = checkOverduePayments(tenants, payments);
      setOverdueList(overdue);
      setAllPayments(payments);
    } catch (error) {
      console.error('Error loading overdue data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalOverdue = (tenant) => {
    const months = getOverdueMonths(tenant, allPayments);
    return months.reduce((sum, m) => sum + m.amount, 0);
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading overdue payments..." />;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <AlertCircle className="w-8 h-8 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Overdue Payments</h1>
          <p className="text-gray-600">Tenants with pending rent payments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overdue Tenants</p>
              <p className="text-3xl font-bold text-red-600">{overdueList.length}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Overdue Amount</p>
              <p className="text-3xl font-bold text-red-600">
                ₹{(overdueList.reduce((sum, t) => sum + getTotalOverdue(t), 0) / 100).toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 p-3 rounded-full">
              <IndianRupee className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Days Overdue</p>
              <p className="text-3xl font-bold text-orange-600">
                {overdueList.length > 0
                  ? Math.round(overdueList.reduce((sum, t) => sum + t.daysOverdue, 0) / overdueList.length)
                  : 0} days
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded-full">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Overdue List */}
      {overdueList.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">All Caught Up!</h3>
          <p className="text-gray-500">No overdue payments at the moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {overdueList.map((tenant) => {
            const overdueMonths = getOverdueMonths(tenant, allPayments);
            const totalOverdue = getTotalOverdue(tenant);
            const isExpanded = expandedTenant === tenant.id;

            return (
              <div key={tenant.id} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{tenant.name}</h3>
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                          {tenant.daysOverdue} days overdue
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{tenant.propertyName} - Room {tenant.roomNumber}</p>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {tenant.phone}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-3">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Overdue</p>
                        <p className="text-2xl font-bold text-red-600">
                          ₹{(totalOverdue / 100).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">{overdueMonths.length} month(s)</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => setExpandedTenant(isExpanded ? null : tenant.id)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                        >
                          {isExpanded ? 'Hide Details' : 'View Details'}
                        </button>
                        <button
                          onClick={() => sendWhatsAppReminder(tenant, new Date().toISOString().slice(0, 7))}
                          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Send Reminder
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="font-semibold text-gray-700 mb-3">Overdue Months:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {overdueMonths.map((month, idx) => (
                          <div key={idx} className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <p className="font-medium text-gray-900">{month.monthName}</p>
                            <p className="text-lg font-bold text-red-600">
                              ₹{(month.amount / 100).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Overdue;
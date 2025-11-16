import { useState, useEffect } from 'react';
import { Receipt, Plus, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { recordPayment, getPayments } from '../services/paymentService';
import { getTenants } from '../services/tenantService';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import { Download } from 'lucide-react';
import { generatePaymentReceipt } from '../services/receiptService';

function Payments() {
  const { currentUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [payments, setPayments] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterMonth, setFilterMonth] = useState('all');
  const [formData, setFormData] = useState({
    tenantId: '',
    tenantName: '',
    amount: '',
    month: '',
    paidDate: new Date().toISOString().split('T')[0],
    method: 'Cash'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
  try {
    const [paymentsData, tenantsData, allTenantsData] = await Promise.all([
      getPayments(currentUser.uid),
      getTenants(currentUser.uid),
      getTenants(currentUser.uid) // For receipt generation
    ]);
    setPayments(paymentsData);
    setTenants(tenantsData.filter(t => t.status === 'active'));
    setAllTenants(allTenantsData);
  } catch (error) {
    setToast({ message: 'Error loading data', type: 'error' });
  } finally {
    setLoading(false);
  }
};
  const [allTenants, setAllTenants] = useState([]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedTenant = tenants.find(t => t.id === formData.tenantId);
      const paymentData = {
        tenantId: formData.tenantId,
        tenantName: selectedTenant.name,
        propertyName: selectedTenant.propertyName,
        amount: parseInt(formData.amount) * 100,
        month: formData.month,
        paidDate: formData.paidDate,
        method: formData.method,
        status: 'paid',
        ownerId: currentUser.uid
      };
      const newPayment = await recordPayment(paymentData);
      setPayments([newPayment, ...payments]);
      setFormData({
        tenantId: '', tenantName: '', amount: '', month: '',
        paidDate: new Date().toISOString().split('T')[0], method: 'Cash'
      });
      setShowModal(false);
      setToast({ message: 'Payment recorded successfully!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Error recording payment', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading payments..." />;
  }

  const getCurrentMonth = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };
  const handleDownloadReceipt = (payment) => {
  const tenant = allTenants.find(t => t.id === payment.tenantId);
  
  if (!tenant) {
    setToast({ message: 'Tenant information not found', type: 'error' });
    return;
  }
  
  const ownerInfo = {
    name: 'Property Owner', // You can get from user profile
    email: currentUser.email,
    phone: '' // Add if available
  };
  
  const result = generatePaymentReceipt(payment, tenant, ownerInfo);
  
  if (result.success) {
    setToast({ message: 'Receipt downloaded!', type: 'success' });
  }
};

  const filteredPayments = filterMonth === 'all' 
    ? payments 
    : payments.filter(p => p.month === filterMonth);

  const uniqueMonths = [...new Set(payments.map(p => p.month))].sort().reverse();

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Payments</h1>
          <div className="flex gap-3">
            {payments.length > 0 && (
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Months</option>
                {uniqueMonths.map(month => (
                  <option key={month} value={month}>
                    {new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowModal(true)}
              disabled={tenants.length === 0}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              Record Payment
            </button>
          </div>
        </div>
      </div>

      {tenants.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Tenants</h3>
          <p className="text-gray-500">Add tenants first to record payments</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Payments Yet</h3>
          <p className="text-gray-500 mb-6">Start recording rent payments</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Record Payment
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full min-w-max">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(payment.paidDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{payment.tenantName}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{payment.propertyName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(payment.month + '-01').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ₹{(payment.amount / 100).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{payment.method}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1 text-sm text-green-600">
                      <CheckCircle className="w-4 h-4" />
                      Paid
                    </span>
                  </td>
                  <td className="px-6 py-4">
  <button
    onClick={() => handleDownloadReceipt(payment)}
    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
    title="Download Receipt"
  >
    <Download className="w-4 h-4" />
    Receipt
  </button>
</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Record Payment</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Tenant *</label>
                <select
                  value={formData.tenantId}
                  onChange={(e) => setFormData({...formData, tenantId: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose tenant</option>
                  {tenants.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name} - {tenant.propertyName} (Room {tenant.roomNumber})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">For Month *</label>
                <input
                  type="month"
                  value={formData.month}
                  onChange={(e) => setFormData({...formData, month: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  max={getCurrentMonth()}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
                <input
                  type="date"
                  value={formData.paidDate}
                  onChange={(e) => setFormData({...formData, paidDate: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={formData.method}
                  onChange={(e) => setFormData({...formData, method: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option>Cash</option>
                  <option>UPI</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default Payments;
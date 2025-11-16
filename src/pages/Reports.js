import { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProperties } from '../services/propertyService';
import { getTenants } from '../services/tenantService';
import { getPayments } from '../services/paymentService';
import { getExpenses } from '../services/expenseService';
import LoadingSpinner from '../components/LoadingSpinner';
import { generateMonthlyReport } from '../services/receiptService';
import Toast from '../components/Toast';
function Reports() {
  const { currentUser } = useAuth();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [reportData, setReportData] = useState({
    totalProperties: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    occupancyRate: 0,
    expectedRevenue: 0,
    collectedRevenue: 0,
    pendingRevenue: 0,
    collectionRate: 0,
    totalExpenses: 0,
    netIncome: 0,
    paymentBreakdown: [],
    expenseBreakdown: []
  });

  useEffect(() => {
    loadReportData();
  }, [selectedMonth]);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const [properties, tenants, payments, expenses] = await Promise.all([
        getProperties(currentUser.uid),
        getTenants(currentUser.uid),
        getPayments(currentUser.uid),
        getExpenses(currentUser.uid)
      ]);

      // Calculate totals
      const totalRooms = properties.reduce((sum, p) => sum + p.totalRooms, 0);
      const activeTenants = tenants.filter(t => t.status === 'active');
      const occupiedRooms = activeTenants.length;
      const vacantRooms = totalRooms - occupiedRooms;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      // Expected revenue (all active tenants' rent)
      const expectedRevenue = activeTenants.reduce((sum, t) => sum + t.rentAmount, 0);

      // Collected revenue for selected month
      const monthPayments = payments.filter(p => p.month === selectedMonth);
      const collectedRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const pendingRevenue = expectedRevenue - collectedRevenue;
      const collectionRate = expectedRevenue > 0 ? (collectedRevenue / expectedRevenue) * 100 : 0;

      // Expenses for selected month
      const monthExpenses = expenses.filter(e => e.date.startsWith(selectedMonth));
      const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
      const netIncome = collectedRevenue - totalExpenses;

      // Payment breakdown by method
      const paymentMethods = {};
      monthPayments.forEach(p => {
        paymentMethods[p.method] = (paymentMethods[p.method] || 0) + p.amount;
      });
      const paymentBreakdown = Object.entries(paymentMethods).map(([method, amount]) => ({
        method,
        amount
      }));

      // Expense breakdown by category
      const expenseCategories = {};
      monthExpenses.forEach(e => {
        expenseCategories[e.category] = (expenseCategories[e.category] || 0) + e.amount;
      });
      const expenseBreakdown = Object.entries(expenseCategories).map(([category, amount]) => ({
        category,
        amount
      }));

      setReportData({
        totalProperties: properties.length,
        totalRooms,
        occupiedRooms,
        vacantRooms,
        occupancyRate,
        expectedRevenue,
        collectedRevenue,
        pendingRevenue,
        collectionRate,
        totalExpenses,
        netIncome,
        paymentBreakdown,
        expenseBreakdown
      });
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  };
  const handleDownloadReport = () => {
  const result = generateMonthlyReport(reportData, selectedMonth);
  if (result.success) {
    setToast({ message: 'Report downloaded!', type: 'success' });
  }
};

  const generateMonthOptions = () => {
    const options = [];
    const today = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = date.toISOString().slice(0, 7);
      const label = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Generating report..." />;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Monthly Report</h1>
        <div className="flex gap-3">
  <select
    value={selectedMonth}
    onChange={(e) => setSelectedMonth(e.target.value)}
    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
  >
    {generateMonthOptions().map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
  <button
    onClick={handleDownloadReport}
    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
  >
    <Download className="w-5 h-5" />
    Download PDF
  </button>
  <button
    onClick={() => window.print()}
    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
  >
    <Download className="w-5 h-5" />
    Print
  </button>
</div>
      </div>

      {/* Occupancy Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Occupancy Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Total Properties</p>
            <p className="text-2xl font-bold text-blue-600">{reportData.totalProperties}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Occupied Rooms</p>
            <p className="text-2xl font-bold text-green-600">{reportData.occupiedRooms}</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Vacant Rooms</p>
            <p className="text-2xl font-bold text-orange-600">{reportData.vacantRooms}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Occupancy Rate</p>
            <p className="text-2xl font-bold text-purple-600">{reportData.occupancyRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Revenue Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Revenue Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 border-l-4 border-blue-500 bg-gray-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Expected Revenue</p>
            <p className="text-xl font-bold">₹{(reportData.expectedRevenue / 100).toLocaleString()}</p>
          </div>
          <div className="p-4 border-l-4 border-green-500 bg-gray-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Collected</p>
            <p className="text-xl font-bold text-green-600">₹{(reportData.collectedRevenue / 100).toLocaleString()}</p>
          </div>
          <div className="p-4 border-l-4 border-red-500 bg-gray-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Pending</p>
            <p className="text-xl font-bold text-red-600">₹{(reportData.pendingRevenue / 100).toLocaleString()}</p>
          </div>
          <div className="p-4 border-l-4 border-purple-500 bg-gray-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Collection Rate</p>
            <p className="text-xl font-bold text-purple-600">{reportData.collectionRate.toFixed(1)}%</p>
          </div>
        </div>

        {reportData.paymentBreakdown.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Payment Methods</h3>
            <div className="space-y-2">
              {reportData.paymentBreakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">{item.method}</span>
                  <span className="font-bold">₹{(item.amount / 100).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expenses Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Expenses Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 border-l-4 border-red-500 bg-gray-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
            <p className="text-xl font-bold text-red-600">₹{(reportData.totalExpenses / 100).toLocaleString()}</p>
          </div>
          <div className="p-4 border-l-4 border-green-500 bg-gray-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Net Income</p>
            <p className={`text-xl font-bold ${reportData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{(reportData.netIncome / 100).toLocaleString()}
            </p>
          </div>
          <div className="p-4 border-l-4 border-blue-500 bg-gray-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Profit Margin</p>
            <p className="text-xl font-bold text-blue-600">
              {reportData.collectedRevenue > 0 
                ? ((reportData.netIncome / reportData.collectedRevenue) * 100).toFixed(1) 
                : 0}%
            </p>
          </div>
        </div>

        {reportData.expenseBreakdown.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Expense Categories</h3>
            <div className="space-y-2">
              {reportData.expenseBreakdown.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-700">{item.category}</span>
                  <span className="font-bold">₹{(item.amount / 100).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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

export default Reports;
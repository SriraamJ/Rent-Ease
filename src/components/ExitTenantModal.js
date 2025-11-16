import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { exitTenant } from '../services/tenantService';

function ExitTenantModal({ tenant, onClose, onSuccess, unpaidMonths = [] }) {
  const [formData, setFormData] = useState({
    exitDate: new Date().toISOString().split('T')[0],
    depositRefunded: tenant.depositAmount,
    deductions: 0,
    exitNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const unpaidAmount = unpaidMonths.reduce((sum, m) => sum + m.amount, 0);
  const totalDeductions = parseInt(formData.deductions || 0) * 100;
  const finalRefund = Math.max(0, tenant.depositAmount - unpaidAmount - totalDeductions);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const exitData = {
        exitDate: formData.exitDate,
        finalSettlement: {
          securityDeposit: tenant.depositAmount,
          unpaidRent: unpaidAmount,
          otherDeductions: totalDeductions,
          finalRefund: finalRefund
        },
        depositRefunded: finalRefund,
        exitNotes: formData.exitNotes
      };

      await exitTenant(tenant.id, exitData);
      onSuccess();
    } catch (error) {
      alert('Error processing tenant exit');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Exit Tenant</h2>
            <p className="text-sm text-gray-600 mt-1">{tenant.name} - {tenant.propertyName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Warning for unpaid rent */}
          {unpaidAmount > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-orange-800">Unpaid Rent Detected</p>
                <p className="text-sm text-orange-700 mt-1">
                  This tenant has {unpaidMonths.length} month(s) of unpaid rent totaling ₹{(unpaidAmount / 100).toLocaleString()}. 
                  This will be deducted from the security deposit.
                </p>
                <div className="mt-2 space-y-1">
                  {unpaidMonths.map((month, idx) => (
                    <p key={idx} className="text-xs text-orange-600">
                      • {month.monthName}: ₹{(month.amount / 100).toLocaleString()}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Settlement Calculation */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-800">Final Settlement</h3>
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Security Deposit</span>
              <span className="font-medium">₹{(tenant.depositAmount / 100).toLocaleString()}</span>
            </div>

            {unpaidAmount > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Less: Unpaid Rent</span>
                <span className="font-medium">- ₹{(unpaidAmount / 100).toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Less: Other Deductions</span>
              <span className="font-medium text-red-600">- ₹{(totalDeductions / 100).toLocaleString()}</span>
            </div>

            <div className="pt-3 border-t flex justify-between">
              <span className="font-semibold text-gray-800">Final Refund</span>
              <span className={`text-xl font-bold ${finalRefund > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{(finalRefund / 100).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Form Fields */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exit Date *</label>
            <input
              type="date"
              value={formData.exitDate}
              onChange={(e) => setFormData({...formData, exitDate: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Other Deductions (₹)
            </label>
            <input
              type="number"
              value={formData.deductions}
              onChange={(e) => setFormData({...formData, deductions: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              min="0"
              placeholder="Damages, pending bills, etc."
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter any additional deductions (damages, cleaning, pending bills)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Exit Notes</label>
            <textarea
              value={formData.exitNotes}
              onChange={(e) => setFormData({...formData, exitNotes: e.target.value})}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Reason for exit, condition of room, etc."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Processing...' : 'Complete Exit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExitTenantModal;
import { useState, useEffect } from 'react';
import { Users, Plus, Phone, Mail, MessageCircle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { addTenant, getTenants } from '../services/tenantService';
import { getProperties } from '../services/propertyService';
import { getPayments } from '../services/paymentService';
import { sendWhatsAppReminder } from '../utils/reminderHelper';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import ExitTenantModal from '../components/ExitTenantModal';
import { validatePhone, formatPhone, validateEmail } from '../utils/validation';
import { getOverdueMonths } from '../utils/overdueHelper';
import { useSubscription } from '../contexts/SubscriptionContext';
import { sendRentReminderEmail } from '../services/emailService';

function Tenants() {
  const { currentUser } = useAuth();
  const { canAddProperty, getPropertyLimit, isPro } = useSubscription();
  const [showModal, setShowModal] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [properties, setProperties] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [errors, setErrors] = useState({});
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedTenantForExit, setSelectedTenantForExit] = useState(null);
  const [selectedTenants, setSelectedTenants] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    propertyId: '',
    propertyName: '',
    roomNumber: '',
    rentAmount: '',
    depositAmount: '',
    moveInDate: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tenantsData, propertiesData, paymentsData] = await Promise.all([
        getTenants(currentUser.uid),
        getProperties(currentUser.uid),
        getPayments(currentUser.uid)
      ]);
      setTenants(tenantsData);
      setProperties(propertiesData);
      setAllPayments(paymentsData);
    } catch (error) {
      setToast({ message: 'Error loading data', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }
    
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.propertyId) {
      newErrors.propertyId = 'Please select a property';
    }
    
    if (!formData.rentAmount || parseInt(formData.rentAmount) <= 0) {
      newErrors.rentAmount = 'Rent amount must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    try {
      const selectedProperty = properties.find(p => p.id === formData.propertyId);
      const tenantData = {
        ...formData,
        propertyName: selectedProperty.name,
        rentAmount: parseInt(formData.rentAmount) * 100,
        depositAmount: parseInt(formData.depositAmount) * 100,
        ownerId: currentUser.uid
      };
      const newTenant = await addTenant(tenantData);
setTenants([...tenants, newTenant]);

setFormData({
  name: '', phone: '', email: '', propertyId: '', propertyName: '',
  roomNumber: '', rentAmount: '', depositAmount: '', moveInDate: ''
});
setShowModal(false);
setToast({ message: 'Tenant added successfully!', type: 'success' });
setFormData({
  name: '', phone: '', email: '', propertyId: '', propertyName: '',
  roomNumber: '', rentAmount: '', depositAmount: '', moveInDate: ''
});
setShowModal(false);

// Show credentials if created
setToast({ message: 'Tenant added successfully!', type: 'success' });
    } catch (error) {
    console.error('Error adding tenant:', error);
    setToast({ message: 'Error adding tenant', type: 'error' });
  } finally {
    setSubmitting(false);
  }
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading tenants..." />;
  }

  const statusFilteredTenants = tenants.filter(t => 
    statusFilter === 'all' ? true : t.status === statusFilter
  );

  const filteredTenants = statusFilteredTenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phone.includes(searchTerm) ||
    tenant.propertyName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const handleEmailReminder = async (tenant) => {
  if (!tenant.email) {
    setToast({ message: 'This tenant has no email address', type: 'error' });
    return;
  }

  setToast({ message: 'Sending email...', type: 'success' });

  try {
    const result = await sendRentReminderEmail(tenant, currentUser.email || 'Your Landlord');
    
    if (result.success) {
      setToast({ message: `✅ Email sent to ${tenant.email}`, type: 'success' });
    } else {
      setToast({ message: `❌ Failed: ${result.error}`, type: 'error' });
    }
  } catch (error) {
    setToast({ message: 'Error sending email', type: 'error' });
  }
};

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
  <h1 className="text-3xl font-bold text-gray-800">Tenants</h1>
  <button
    onClick={() => setShowModal(true)}
    disabled={properties.length === 0}
    className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Plus className="w-5 h-5" />
    Add Tenant
  </button>
</div>
        
        {tenants.length > 0 && (
          <div className="space-y-3">
            {/* Status Filter Tabs */}
            <div className="flex gap-2 border-b">
              <button
                onClick={() => {
                  setStatusFilter('active');
                  setSelectedTenants([]);
                }}
                className={`px-4 py-2 font-medium transition-colors ${
                  statusFilter === 'active'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Active ({tenants.filter(t => t.status === 'active').length})
              </button>
              <button
                onClick={() => {
                  setStatusFilter('exited');
                  setSelectedTenants([]);
                }}
                className={`px-4 py-2 font-medium transition-colors ${
                  statusFilter === 'exited'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Past Tenants ({tenants.filter(t => t.status === 'exited').length})
              </button>
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setSelectedTenants([]);
                }}
                className={`px-4 py-2 font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                All ({tenants.length})
              </button>
            </div>
            
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search by name, phone, or property..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-96 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Properties Yet</h3>
          <p className="text-gray-500">Add a property first before adding tenants</p>
        </div>
      ) : tenants.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Tenants Yet</h3>
          <p className="text-gray-500 mb-6">Start by adding your first tenant</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Tenant
          </button>
        </div>
      ) : (
        <>
          {/* Bulk Actions Bar */}
          {statusFilter === 'active' && filteredTenants.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <input
                  type="checkbox"
                  checked={selectedTenants.length === filteredTenants.length && filteredTenants.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTenants(filteredTenants.map(t => t.id));
                    } else {
                      setSelectedTenants([]);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm font-medium text-gray-700">
                  {selectedTenants.length > 0 
                    ? `${selectedTenants.length} tenant(s) selected`
                    : 'Select tenants for bulk actions'}
                </span>
              </div>
              
              {selectedTenants.length > 0 && (
                <button
                  onClick={() => {
                    const selectedTenantData = filteredTenants.filter(t => selectedTenants.includes(t.id));
                    selectedTenantData.forEach(tenant => {
                      sendWhatsAppReminder(tenant, new Date().toISOString().slice(0, 7));
                    });
                    setSelectedTenants([]);
                    setToast({ message: `Sending reminders to ${selectedTenantData.length} tenant(s)`, type: 'success' });
                  }}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  Send Bulk Reminders
                </button>
              )}
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full min-w-max">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {statusFilter === 'active' && <th className="px-6 py-3 w-12"></th>}
                  {statusFilter !== 'active' && <th className="px-6 py-3 w-12"></th>}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rent</th>
                  {statusFilter !== 'exited' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  )}
                  {statusFilter === 'exited' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exit Info</th>
                  )}
                </tr>
              </thead>
              {filteredTenants.length === 0 && searchTerm ? (
                <tbody>
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      No tenants found matching "{searchTerm}"
                    </td>
                  </tr>
                </tbody>
              ) : (
                <tbody className="divide-y">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className={`hover:bg-gray-50 ${tenant.status === 'exited' ? 'opacity-60' : ''}`}>
                      {tenant.status === 'active' && (
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={selectedTenants.includes(tenant.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTenants([...selectedTenants, tenant.id]);
                              } else {
                                setSelectedTenants(selectedTenants.filter(id => id !== tenant.id));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                        </td>
                      )}
                      {tenant.status !== 'active' && <td className="px-6 py-4"></td>}
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-gray-900">{tenant.name}</div>
                          {tenant.status === 'exited' && (
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">Exited</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          Moved in: {new Date(tenant.moveInDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{tenant.propertyName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{tenant.roomNumber}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Phone className="w-3 h-3" />
                          {tenant.phone}
                        </div>
                        {tenant.email && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="w-3 h-3" />
                            {tenant.email}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        ₹{(tenant.rentAmount / 100).toLocaleString()}
                      </td>
                      
                      {tenant.status === 'active' ? (
  <td className="px-6 py-4">
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={() => sendWhatsAppReminder(tenant, new Date().toISOString().slice(0, 7))}
          className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm font-medium"
          title="Send WhatsApp reminder"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </button>
        {tenant.email && (
          <button
            onClick={() => handleEmailReminder(tenant)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
            title="Send email reminder"
          >
            <Mail className="w-4 h-4" />
            Email
          </button>
        )}
      </div>
      <button
        onClick={() => {
          setSelectedTenantForExit(tenant);
          setShowExitModal(true);
        }}
        className="flex items-center gap-2 text-red-600 hover:text-red-700 text-sm font-medium"
        title="Mark tenant as exited"
      >
        <LogOut className="w-4 h-4" />
        Exit
      </button>
    </div>
  </td>
) : (
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {tenant.exitDate ? new Date(tenant.exitDate).toLocaleDateString() : 'N/A'}
                          </div>
                          {tenant.finalSettlement && (
                            <div className="text-xs text-gray-500">
                              Refund: ₹{(tenant.finalSettlement.finalRefund / 100).toLocaleString()}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
            </div>
          </div>
        </>
      )}

      {/* Add Tenant Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Add New Tenant</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({...formData, name: e.target.value});
                      if (errors.name) setErrors({...errors, name: ''});
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : ''
                    }`}
                    required
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const formatted = formatPhone(e.target.value);
                      setFormData({...formData, phone: formatted});
                      if (errors.phone) setErrors({...errors, phone: ''});
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.phone ? 'border-red-500' : ''
                    }`}
                    placeholder="10-digit mobile number"
                    maxLength="10"
                    required
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({...formData, email: e.target.value});
                    if (errors.email) setErrors({...errors, email: ''});
                  }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : ''
                  }`}
                  placeholder="optional"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property *</label>
                  <select
                    value={formData.propertyId}
                    onChange={(e) => {
                      setFormData({...formData, propertyId: e.target.value});
                      if (errors.propertyId) setErrors({...errors, propertyId: ''});
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.propertyId ? 'border-red-500' : ''
                    }`}
                    required
                  >
                    <option value="">Select Property</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.id}>{prop.name}</option>
                    ))}
                  </select>
                  {errors.propertyId && <p className="text-red-500 text-xs mt-1">{errors.propertyId}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({...formData, roomNumber: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent (₹) *</label>
                  <input
                    type="number"
                    value={formData.rentAmount}
                    onChange={(e) => {
                      setFormData({...formData, rentAmount: e.target.value});
                      if (errors.rentAmount) setErrors({...errors, rentAmount: ''});
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.rentAmount ? 'border-red-500' : ''
                    }`}
                    min="0"
                    required
                  />
                  {errors.rentAmount && <p className="text-red-500 text-xs mt-1">{errors.rentAmount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Security Deposit (₹) *</label>
                  <input
                    type="number"
                    value={formData.depositAmount}
                    onChange={(e) => setFormData({...formData, depositAmount: e.target.value})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Move-in Date *</label>
                <input
                  type="date"
                  value={formData.moveInDate}
                  onChange={(e) => setFormData({...formData, moveInDate: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setErrors({});
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Adding...' : 'Add Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exit Tenant Modal */}
      {showExitModal && selectedTenantForExit && (
        <ExitTenantModal
          tenant={selectedTenantForExit}
          unpaidMonths={getOverdueMonths(selectedTenantForExit, allPayments)}
          onClose={() => {
            setShowExitModal(false);
            setSelectedTenantForExit(null);
          }}
          onSuccess={() => {
            setShowExitModal(false);
            setSelectedTenantForExit(null);
            setToast({ message: 'Tenant exit completed successfully', type: 'success' });
            loadData();
          }}
        />
      )}
      
    </div>
  );
}

export default Tenants;
import { useState, useEffect } from 'react';
import { Building2, Plus, MapPin, Receipt } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { addProperty, getProperties } from '../services/propertyService';
import { addExpense, getExpenses } from '../services/expenseService';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import { useSubscription } from '../contexts/SubscriptionContext';


function Properties() {
  const { currentUser } = useAuth();
  const { canAddProperty, getPropertyLimit, isPro } = useSubscription();
  const [showModal, setShowModal] = useState(false);
  const [properties, setProperties] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    type: 'PG',
    totalRooms: ''
  });
  
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Electricity',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      const data = await getProperties(currentUser.uid);
      setProperties(data);
    } catch (error) {
      alert('Error loading properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
  const canAdd = await canAddProperty(properties.length);
  
  if (!canAdd) {
    setToast({ 
      message: `Free plan limited to 2 properties. Upgrade to Pro for unlimited!`, 
      type: 'error' 
    });
    return;
  }
  
  const propertyData = {
    name: formData.name,
    address: formData.address,
    type: formData.type,
    totalRooms: parseInt(formData.totalRooms)
  };
  const newProperty = await addProperty(propertyData, currentUser.uid);
  setProperties([...properties, newProperty]);
  setFormData({ name: '', address: '', type: 'PG', totalRooms: '' });
  setShowModal(false);
  setToast({ message: 'Property added successfully!', type: 'success' });
} catch (error) {
  setToast({ message: 'Error adding property', type: 'error' });
}
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      const expenseData = {
        propertyId: selectedProperty.id,
        propertyName: selectedProperty.name,
        category: expenseForm.category,
        amount: parseInt(expenseForm.amount) * 100,
        date: expenseForm.date,
        description: expenseForm.description,
        ownerId: currentUser.uid
      };
      await addExpense(expenseData);
      setToast({ message: 'Expense added successfully!', type: 'success' });
      setExpenseForm({
        category: 'Electricity',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      setShowExpenseModal(false);
    } catch (error) {
      setToast({ message: 'Error adding expense', type: 'error' });
    }
  };

  if (loading) {
  return <LoadingSpinner size="lg" text="Loading properties..." />;
}

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
  <div>
    <h1 className="text-3xl font-bold text-gray-800">Properties</h1>
    <p className="text-sm text-gray-600 mt-1">
      {properties.length} of {getPropertyLimit()} properties used
      {!isPro() && properties.length >= 2 && (
        <span className="ml-2 text-orange-600 font-medium">
          • Upgrade to add more
        </span>
      )}
    </p>
  </div>
  <button
    onClick={() => setShowModal(true)}
    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
  >
    <Plus className="w-5 h-5" />
    Add Property
  </button>
</div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Properties Yet</h3>
          <p className="text-gray-500 mb-6">Start by adding your first property</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Property
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-600 rounded">
                  {property.type}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{property.name}</h3>
              <div className="flex items-start gap-2 text-gray-600 text-sm mb-4">
                <MapPin className="w-4 h-4 mt-0.5" />
                <p>{property.address}</p>
              </div>
              <div className="flex items-center justify-between pt-4 border-t mb-3">
                <span className="text-sm text-gray-600">Total Rooms</span>
                <span className="text-lg font-bold text-gray-800">{property.totalRooms}</span>
              </div>
              <button
                onClick={() => {
                  setSelectedProperty(property);
                  setShowExpenseModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                <Receipt className="w-4 h-4" />
                Add Expense
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Property Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Add New Property</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>PG</option>
                  <option>Apartment</option>
                  <option>Hostel</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Rooms</label>
                <input
                  type="number"
                  value={formData.totalRooms}
                  onChange={(e) => setFormData({...formData, totalRooms: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b">
              <h2 className="text-2xl font-bold">Add Expense</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedProperty?.name}</p>
            </div>
            <form onSubmit={handleExpenseSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option>Electricity</option>
                  <option>Water</option>
                  <option>Gas</option>
                  <option>Internet</option>
                  <option>Maintenance</option>
                  <option>Repairs</option>
                  <option>Cleaning</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Optional notes..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Expense
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

export default Properties;
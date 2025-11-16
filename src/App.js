import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './components/DashboardLayout';
import Properties from './pages/Properties';
import Tenants from './pages/Tenants';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Overdue from './pages/Overdue';
import Landing from './pages/Landing';
import Billing from './pages/Billing';

function App() {
  const { currentUser } = useAuth();

  return (
    <BrowserRouter>
        <Routes>
  <Route path="/landing" element={<Landing />} />
  
  <Route path="/" element={
    currentUser ? <Navigate to="/dashboard" /> : <Login />
  } />
  
  <Route path="/dashboard" element={
    currentUser ? (<DashboardLayout><Dashboard /></DashboardLayout>) : <Navigate to="/" />
  } />

  <Route path="/properties" element={
    currentUser ? (<DashboardLayout><Properties /></DashboardLayout>) : <Navigate to="/" />
  } />

  <Route path="/tenants" element={
    currentUser ? (<DashboardLayout><Tenants /></DashboardLayout>) : <Navigate to="/" />
  } />

  <Route path="/payments" element={
    currentUser ? (<DashboardLayout><Payments /></DashboardLayout>) : <Navigate to="/" />
  } />

  <Route path="/overdue" element={
    currentUser ? (<DashboardLayout><Overdue /></DashboardLayout>) : <Navigate to="/" />
  } />

  <Route path="/reports" element={
    currentUser ? (<DashboardLayout><Reports /></DashboardLayout>) : <Navigate to="/" />
  } />

  <Route path="/billing" element={
    currentUser ? (<DashboardLayout><Billing /></DashboardLayout>) : <Navigate to="/" />
  } />
</Routes>
    </BrowserRouter>
  );
}

export default App;
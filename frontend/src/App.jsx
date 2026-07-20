import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Products from './pages/Products';
import ReorderList from './pages/ReorderList';
import Suppliers from './pages/Suppliers';
import PurchaseOrders from './pages/PurchaseOrders';
import RegisteredStores from './pages/RegisteredStores';
import NotAuthorized from './pages/NotAuthorized';

import RegisterStorePage from './pages/RegisterStorePage';

// Protected Route Guard Wrapper enforcing authentication and role limits
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 border-4 border-indigo-650 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public landing home */}
          <Route path="/" element={<Home />} />
          
          {/* Public auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterStorePage />} />

          {/* Protected routes wrapped in Main Layout */}
          <Route element={<Layout />}>
            <Route 
              path="/admin/stores" 
              element={
                <ProtectedRoute allowedRoles={['System Admin']}>
                  <RegisteredStores />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['System Admin', 'Owner', 'Manager', 'Cashier', 'Inventory Staff']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/pos" 
              element={
                <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Cashier']}>
                  <POS />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/products" 
              element={
                <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Inventory Staff']}>
                  <Products />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reorder-list" 
              element={
                <ProtectedRoute allowedRoles={['Owner', 'Manager', 'Inventory Staff']}>
                  <ReorderList />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/suppliers" 
              element={
                <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
                  <Suppliers />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/purchase-orders" 
              element={
                <ProtectedRoute allowedRoles={['Owner', 'Manager']}>
                  <PurchaseOrders />
                </ProtectedRoute>
              } 
            />

            <Route path="/not-authorized" element={<NotAuthorized />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

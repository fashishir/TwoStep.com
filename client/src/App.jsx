import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import PromoBar from './components/layout/PromoBar';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import Account from './pages/Account';
import OrderTracking from './pages/OrderTracking';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCategories from './pages/admin/AdminCategories';
import './App.scss';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <div className="app">
            <PromoBar />
            <Navbar />
            <CartDrawer />

            <main className="main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<ProductList />} />
                <Route path="/products/:slug" element={<ProductDetail />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                <Route path="/account" element={<Account />} />
                <Route path="/track-order" element={<OrderTracking />} />
                <Route
                  path="/admin"
                  element={
                    <AdminLayout>
                      <Dashboard />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/products"
                  element={
                    <AdminLayout>
                      <AdminProducts />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <AdminLayout>
                      <AdminOrders />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminLayout>
                      <AdminUsers />
                    </AdminLayout>
                  }
                />
                <Route
                  path="/admin/categories"
                  element={
                    <AdminLayout>
                      <AdminCategories />
                    </AdminLayout>
                  }
                />
              </Routes>
            </main>

            <Footer />
          </div>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Check, 
  Receipt, 
  Printer,
  Package,
  AlertTriangle,
  Barcode,
  CreditCard,
  DollarSign,
  Smartphone,
  Info
} from 'lucide-react';

const POS = () => {
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [invoice, setInvoice] = useState(null);

  // Fetch products on mount
  const fetchProducts = async () => {
    try {
      const res = await API.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products by search query
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add to cart
  const addToCart = (product) => {
    const existing = cart.find((item) => item.product._id === product._id);
    if (existing) {
      if (existing.quantity >= product.currentStock) {
        alert(`Cannot add more. Only ${product.currentStock} units are available in stock.`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      if (product.currentStock <= 0) {
        alert('This product is out of stock.');
        return;
      }
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  // Adjust quantity
  const updateQuantity = (productId, delta) => {
    const item = cart.find((i) => i.product._id === productId);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      setCart(cart.filter((i) => i.product._id !== productId));
      return;
    }

    if (newQty > item.product.currentStock) {
      alert(`Only ${item.product.currentStock} units are available in stock.`);
      return;
    }

    setCart(
      cart.map((i) => (i.product._id === productId ? { ...i, quantity: newQty } : i))
    );
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(cart.filter((item) => item.product._id !== productId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
  const total = subtotal;

  // Checkout submission
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    setMessage(null);

    const salePayload = {
      cashierId: currentUser._id,
      items: cart.map((item) => ({
        productId: item.product._id,
        quantity: item.quantity,
      })),
      paymentMethod,
      paymentStatus: 'Paid',
    };

    try {
      const res = await API.post('/sales', salePayload);
      setInvoice(res.data);
      setMessage({ type: 'success', text: 'Checkout completed successfully!' });
      setCart([]);
      fetchProducts(); // Refresh stocks list
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Failed to process checkout transaction.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8.5rem)] animate-[pulse-subtle_2s_ease-out_1]">
      {/* Left side - Product Selection */}
      <div className="lg:col-span-7 flex flex-col space-y-4 h-full">
        {/* Search */}
        <div className="glass-panel p-4 rounded-2xl shadow-sm flex items-center space-x-3 transition-all duration-300 focus-within:ring-2 focus-within:ring-indigo-500/25">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search products by name or SKU/barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm bg-transparent focus:outline-none dark:text-white"
          />
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.currentStock <= 0;
            const isLowStock = product.currentStock <= product.minStockThreshold;
            
            // Calculate Stock Percentage for bar
            const stockPct = Math.min((product.currentStock / (product.minStockThreshold * 2 || 10)) * 100, 100);
            const stockBarColor = isOutOfStock 
              ? 'bg-slate-300 dark:bg-slate-800' 
              : isLowStock 
                ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' 
                : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]';

            return (
              <button
                key={product._id}
                disabled={isOutOfStock}
                onClick={() => addToCart(product)}
                className={`glass-panel p-4.5 rounded-2xl shadow-sm text-left flex flex-col justify-between h-40 cursor-pointer transition-all duration-300 relative overflow-hidden transform active:scale-97 border border-slate-200/40 dark:border-slate-800/40 ${
                  isOutOfStock 
                    ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-900/10' 
                    : 'hover:-translate-y-1 hover:shadow-neon-indigo hover:border-indigo-500/40'
                }`}
              >
                <div className="space-y-1.5 w-full">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase font-black tracking-wider text-indigo-500 dark:text-indigo-400">
                      {product.category}
                    </span>
                    {isLowStock && !isOutOfStock && (
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm line-clamp-2 dark:text-white leading-snug">
                    {product.name}
                  </h4>
                </div>

                <div className="mt-auto w-full space-y-2">
                  {/* Stock safety bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-405 dark:text-slate-500">
                      <span>Stock level</span>
                      <span>{product.currentStock} units</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                      <div className={`h-full ${stockBarColor} rounded-full`} style={{ width: `${stockPct}%` }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-black text-base text-indigo-650 dark:text-indigo-400">
                      ৳{product.sellingPrice.toFixed(2)}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">SKU: {product.sku}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right side - Cart & Checkout */}
      <div className="lg:col-span-5 flex flex-col glass-panel rounded-3xl shadow-sm h-full overflow-hidden">
        <div className="p-4.5 bg-slate-50/50 border-b border-slate-200/40 flex items-center justify-between dark:bg-slate-950/20 dark:border-slate-800/40">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-indigo-500" />
            <h2 className="font-black text-slate-800 dark:text-white text-sm tracking-wide">Current Cart</h2>
          </div>
          <span className="bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs px-2.5 py-1 rounded-lg border border-indigo-200/10 font-bold">
            {cart.reduce((sum, item) => sum + item.quantity, 0)} items
          </span>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-3 py-16">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-full border border-slate-100 dark:border-slate-850">
                <ShoppingCart className="w-10 h-10 stroke-1" />
              </div>
              <p className="text-xs font-bold uppercase tracking-wider">Your cart is empty.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product._id} className="flex items-center justify-between p-3.5 border border-slate-150/40 dark:border-slate-850/40 rounded-2xl bg-white dark:bg-slate-900/30 hover:border-indigo-500/20 transition-all duration-200 shadow-sm">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-bold text-slate-800 text-xs truncate dark:text-white">
                    {item.product.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold mt-1 inline-block">
                    ৳{item.product.sellingPrice.toFixed(2)} / unit
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border border-slate-200/50 dark:border-slate-800/60 rounded-xl bg-white dark:bg-slate-950 overflow-hidden shadow-inner">
                    <button
                      onClick={() => updateQuantity(item.product._id, -1)}
                      className="p-2 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-black text-slate-800 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product._id, 1)}
                      className="p-2 text-slate-400 hover:text-indigo-650 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product._id)}
                    className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Total & Checkout inputs */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-slate-200/40 bg-slate-50/40 dark:bg-slate-950/20 space-y-4">
            {message && (
              <div className={`p-3.5 rounded-2xl text-xs font-bold border ${
                message.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-300' 
                  : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-300'
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex flex-col space-y-2 border-b border-slate-200/40 pb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Payment Method</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: 'Cash', icon: DollarSign },
                  { name: 'Card', icon: CreditCard },
                  { name: 'Mobile Pay', icon: Smartphone }
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.name;
                  return (
                    <button
                      key={item.name}
                      onClick={() => setPaymentMethod(item.name)}
                      className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center space-x-1.5 transform active:scale-97 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-650 shadow-md shadow-indigo-600/10 dark:bg-indigo-500 dark:border-indigo-500'
                          : 'bg-white text-slate-655 border-slate-200/50 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-350 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-slate-450 dark:text-slate-400 font-bold text-xs uppercase tracking-wider">Total Amount</span>
              <span className="text-3xl font-black text-slate-805 dark:text-white tracking-tight">
                ৳{total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer flex items-center justify-center text-sm transform active:scale-98"
            >
              {loading ? (
                <div className="w-5 h-5 border-2.5 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-4.5 h-4.5 mr-2" />
                  Checkout Transaction
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Invoice receipt modal dialog */}
      {invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-slate-900 rounded-3xl max-w-sm w-full p-1 shadow-2xl border border-slate-800">
            {/* The Thermal Receipt paper background container */}
            <div className="bg-white text-slate-900 p-6 rounded-[22px] space-y-6 receipt-edge relative">
              <div className="flex flex-col items-center text-center space-y-2 border-b border-slate-200 border-dashed pb-5">
                <div className="p-3.5 bg-indigo-50 text-indigo-650 rounded-2xl">
                  <Receipt className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-slate-950">SIBIS RETAIL STORE</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{invoice.invoiceNumber}</p>
                <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-black tracking-wide">
                  OFFICIAL INVOICE
                </span>
              </div>

              <div className="space-y-4 text-xs font-bold">
                <div className="grid grid-cols-2 gap-y-1.5 text-slate-650 font-medium">
                  <span>Cashier:</span>
                  <span className="text-right text-slate-950 font-bold">{currentUser.name}</span>
                  <span>Payment Status:</span>
                  <span className="text-right text-emerald-600 font-bold">PAID</span>
                  <span>Payment Mode:</span>
                  <span className="text-right text-slate-950 font-bold">{invoice.paymentMethod}</span>
                  <span>Timestamp:</span>
                  <span className="text-right text-slate-950 font-bold">
                    {new Date(invoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                {/* Items layout */}
                <div className="border-t border-b border-slate-200 border-dashed py-4 space-y-2.5">
                  {invoice.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-xs">
                      <div className="max-w-[170px] pr-2">
                        <p className="font-bold text-slate-950 truncate">
                          {products.find(p => p._id === item.productId)?.name || 'Catalog Item'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {item.quantity} units x ৳{item.priceAtSale.toFixed(2)}
                        </p>
                      </div>
                      <span className="font-black text-slate-950 self-center">
                        ৳{(item.priceAtSale * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between text-base font-black pt-2 text-slate-950">
                  <span>TOTAL AMOUNT:</span>
                  <span className="text-indigo-650 text-lg">৳{invoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center space-y-1.5 border-t border-slate-200 border-dashed pt-5 pb-2 text-center text-slate-400">
                <Barcode className="w-16 h-8 text-slate-900" />
                <p className="text-[9px] font-bold tracking-wider">THANK YOU FOR YOUR PATRONAGE</p>
              </div>
            </div>

            {/* Print & Action buttons positioned below the paper receipt */}
            <div className="flex space-x-3 p-4 bg-slate-900 rounded-b-3xl">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center border border-slate-700/50"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
              <button
                onClick={() => setInvoice(null)}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;

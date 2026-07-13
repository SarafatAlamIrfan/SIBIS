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
  Printer 
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
      // Only show products that have a stock > 0
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-8rem)]">
      {/* Left side - Product Selection */}
      <div className="lg:col-span-7 flex flex-col space-y-4 h-full">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3 dark:bg-slate-900 dark:border-slate-800">
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
            return (
              <button
                key={product._id}
                disabled={isOutOfStock}
                onClick={() => addToCart(product)}
                className={`bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow transition-all duration-200 text-left flex flex-col justify-between h-36 cursor-pointer dark:bg-slate-900 dark:border-slate-800 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {product.category}
                  </span>
                  <h4 className="font-semibold text-slate-800 text-sm line-clamp-2 dark:text-white">
                    {product.name}
                  </h4>
                </div>
                <div className="flex items-center justify-between mt-2 w-full">
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    ${product.sellingPrice.toFixed(2)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.currentStock <= product.minStockThreshold ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                    Stock: {product.currentStock}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right side - Cart & Checkout */}
      <div className="lg:col-span-5 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm h-full overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center space-x-2 dark:bg-slate-950 dark:border-slate-800">
          <ShoppingCart className="w-5 h-5 text-indigo-500" />
          <h2 className="font-bold text-slate-800 dark:text-white">Current Cart</h2>
        </div>

        {/* Cart items list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 py-16">
              <ShoppingCart className="w-12 h-12 stroke-1" />
              <p className="text-sm font-medium">Your cart is empty.</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product._id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50 dark:bg-slate-950 dark:border-slate-850">
                <div className="flex-1 min-w-0 pr-4">
                  <h4 className="font-semibold text-slate-800 text-sm truncate dark:text-white">
                    {item.product.name}
                  </h4>
                  <span className="text-xs text-slate-400">
                    ${item.product.sellingPrice.toFixed(2)} / unit
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center border border-slate-200 rounded-lg dark:border-slate-700 bg-white dark:bg-slate-900">
                    <button
                      onClick={() => updateQuantity(item.product._id, -1)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-2 text-sm font-semibold text-slate-800 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product._id, 1)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product._id)}
                    className="p-2 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
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
          <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-4 dark:bg-slate-950 dark:border-slate-800">
            {message && (
              <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
                {message.text}
              </div>
            )}

            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-500">Payment Method</span>
              <div className="flex space-x-2">
                {['Cash', 'Card', 'Mobile Pay'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      paymentMethod === method
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Total Amount</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">
                ${total.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Checkout Transaction
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Invoice receipt modal dialog */}
      {invoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-6 shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex flex-col items-center text-center space-y-2 border-b border-slate-100 pb-4 dark:border-slate-800">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full dark:bg-indigo-950 dark:text-indigo-400">
                <Receipt className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Sale Invoice</h3>
              <p className="text-xs text-slate-400">{invoice.invoiceNumber}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Cashier:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{currentUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-200">{invoice.paymentMethod}</span>
              </div>
              <div className="border-t border-slate-100 py-3 space-y-1.5 dark:border-slate-800">
                {invoice.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-slate-500 truncate max-w-[150px]">
                      {products.find(p => p._id === item.productId)?.name || 'Product'} x{item.quantity}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-350">
                      ${(item.priceAtSale * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold dark:border-slate-800">
                <span className="text-slate-800 dark:text-white">Total:</span>
                <span className="text-indigo-600 dark:text-indigo-400">${invoice.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center dark:bg-slate-800 dark:text-slate-350 dark:hover:bg-slate-750"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print
              </button>
              <button
                onClick={() => setInvoice(null)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center"
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

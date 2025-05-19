import { useCartStore } from '@/store/cartStore';
import CartItem from './CartItem';
import { CartItemType } from '../types';
import { useOrderStore } from '../store/orderStore';
import OrderConfirmationModal from './OrderConfirmationModal';
import { useLanguageStore } from '@/store/languageStore';

const Cart = () => {
  const cartItems = useCartStore((state) => state.cartItems);
  const { setShowOrderModal } = useOrderStore();
  const { language } = useLanguageStore();

  const t = {
    cartTitle: language === 'ko' ? '장바구니' : 'Cart',
    emptyMessage: language === 'ko' ? '장바구니가 비어 있어요' : 'Your cart is empty',
    guideMessage: language === 'ko' ? '원하는 메뉴를 먼저 골라주세요' : 'Please select a menu first',
    totalLabel: language === 'ko' ? '총 주문 금액:' : 'Total:',
    orderButton: language === 'ko' ? '주문하기' : 'Place Order',
  };

  const totalPrice = cartItems.reduce(
    (total: number, item: CartItemType) =>
      total + item.menu.price * item.quantity,
    0
  );

  const handlePlaceOrder = () => {
    setShowOrderModal(true);
  };

  return (
    <>
      <aside className="w-65 bg-slate-50 rounded-xl shadow-lg p-6 mt-4 mb-6 mr-6 ml-4 flex flex-col">
        {/* Header */}
        <div className="mb-3">
          <h2 className="text-2xl font-semibold text-gray-800 text-center tracking-wide">
            {t.cartTitle}
          </h2>
        </div>

        {/* 카트 리스트 */}
        <div className="flex-1 overflow-y-auto pr-1">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center mt-16 text-slate-400 select-none">
              <img
                src="/public/basket.png"
                alt="empty cart"
                className="w-12 h-12 mb-4"
              />
              <p className="text-center text-slate-600 text-base font-medium">
                {t.emptyMessage}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {t.guideMessage}
              </p>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <CartItem
                key={item.menu.id}
                item={item}
                isLast={idx === cartItems.length - 1}
              />
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="pt-4 mt-4 bg-slate-50 border-t border-indigo-100">
            <div className="flex justify-between items-center mb-4">
              <span className="text-base font-medium text-slate-700">{t.totalLabel}</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
                {totalPrice.toLocaleString()}\
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="w-full bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800
                         text-white font-semibold py-4 rounded-xl shadow-md transition duration-300 ease-in-out
                         focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
              {t.orderButton}
            </button>
          </div>
        )}
      </aside>

      <OrderConfirmationModal />
    </>
  );
};

export default Cart;

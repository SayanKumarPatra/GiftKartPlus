import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AppRouter } from './routes/AppRouter';
import { ensureDemoSeedHydrated } from './data/seedData';

ensureDemoSeedHydrated();

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

import { useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { AppRouter } from './routes/AppRouter';
import { startLiveStoreSync } from './storage/serverSync';

export default function App() {
  useEffect(() => {
    startLiveStoreSync();
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            <AppRouter />
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

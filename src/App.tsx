import { useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { AppRouter } from './routes/AppRouter';
import { LiveNotificationHost } from './components/storefront/LiveNotificationHost';
import { startLiveStoreSync } from './storage/serverSync';
import { startSupabaseRealtimeSync } from './services/supabase/supabaseRealtime';

export default function App() {
  useEffect(() => {
    startLiveStoreSync();
    startSupabaseRealtimeSync();
  }, []);

  return (
    <ToastProvider>
      <AuthProvider>
        <LanguageProvider>
          <CartProvider>
            <LiveNotificationHost />
            <AppRouter />
          </CartProvider>
        </LanguageProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

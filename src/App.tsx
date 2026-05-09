import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ReadersPage } from './pages/ReadersPage';
import { LoansPage } from './pages/LoansPage';
import { OverduePage } from './pages/OverduePage';
import { IntegrationPage } from './pages/IntegrationPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

type Page = 'home' | 'catalog' | 'readers' | 'loans' | 'overdue' | 'integration' | 'profile' | 'settings';

function AppContent() {
  const { currentUser } = useApp();
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
  };

  if (!currentUser) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;
      case 'catalog':
        return <CatalogPage />;
      case 'readers':
        return <ReadersPage />;
      case 'loans':
        return <LoansPage />;
      case 'overdue':
        return <OverduePage />;
      case 'integration':
        return <IntegrationPage />;
      case 'profile':
        return <ProfilePage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar 
        onMenuClick={() => setSidebarOpen(true)} 
        onNavigate={handleNavigate} 
      />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNavigate={handleNavigate}
        currentPage={currentPage}
      />
      <main className="animate-fade-in">
        {renderPage()}
      </main>
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}

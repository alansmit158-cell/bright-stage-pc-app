import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import LoginView from './components/LoginView';
import InventoryList from './components/InventoryList';
import InventoryForm from './components/InventoryForm';
import ClientView from './components/ClientView';
import ProjectList from './components/ProjectList';
import ProjectEditor from './components/ProjectEditor';
import MaintenanceView from './components/MaintenanceView';
import TransferView from './components/TransferView';
import HRView from './components/HRView';
import DashboardView from './components/DashboardView';
import DriverView from './components/DriverView';
import FreelancerView from './components/FreelancerView';
import WorkersView from './components/WorkersView';
import VehicleView from './components/VehicleView';
import CarrierView from './components/CarrierView';
import DeliveryNoteList from './components/DeliveryNoteList';
import DeliveryNoteForm from './components/DeliveryNoteForm';
import CalendarView from './components/CalendarView';
import AuditListView from './components/AuditListView';
import AuditDetailView from './components/AuditDetailView';
import QRCodeScreen from './components/QRCodeScreen';
import QuotesList from './components/QuotesList';
import QuoteBuilder from './components/QuoteBuilder';
import InvoiceList from './components/InvoiceList';
import InvoiceBuilder from './components/InvoiceBuilder';
import ReconciliationView from './components/ReconciliationView';
import FinancialReportsView from './components/FinancialReportsView';
import PaymentEntry from './components/PaymentEntry';
import OverdueInvoices from './components/OverdueInvoices';
import SettingsView from './components/SettingsView';
import AddressAutocomplete from './components/AddressAutocomplete';
import FiscalDashboard from './components/FiscalDashboard';
import StructureCalcView from './components/StructureCalcView';
import SubcontractedManagement from './components/SubcontractedManagement';
import LedConfigurator from './components/LedConfigurator';
import StageConfigurator from './components/StageConfigurator';
import FlycaseScanner from './components/FlycaseScanner';
import ChatWidget from './components/ChatWidget';
import './index.css';

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

const SidebarItem = ({ icon, label, path }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div
      onClick={() => navigate(path)}
      className={`nav-item ${active ? 'active' : ''}`}
      style={{ cursor: 'pointer' }}
    >
      <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      <span>{label}</span>
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white' }}>
          <h1>Something went wrong.</h1>
          <pre>{this.state.error && this.state.error.toString()}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

const AuthenticatedApp = () => {
  const { user, login, logout, loading } = useAuth();
  const { t, changeLanguage, language } = useLanguage();
  const [activeModule, setActiveModule] = useState('operations'); // 'operations' or 'finance'

  if (loading) return <div className="text-white text-center mt-20">{t('loading')}</div>;
  if (!user) return <LoginView onLogin={login} />;

  const hasAccess = (roles) => {
    return roles.some(r => r.toLowerCase() === user.role?.toLowerCase());
  };

  const isWorker = user?.role === 'Worker';

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-container" style={{ padding: '20px 0', textAlign: 'center' }}>
          <img src="/logo.png" alt="Bright Stage" style={{ maxWidth: '80%', height: 'auto' }} />
        </div>


        {/* Module Switcher - NEW */}
        <div style={{ padding: '0 10px 20px 10px', display: 'flex', gap: '5px' }}>
          <button
            onClick={() => setActiveModule('operations')}
            style={{
              flex: 1,
              padding: '8px',
              background: activeModule === 'operations' ? '#3b82f6' : '#333',
              color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
            }}
          >
            🔌 OPS
          </button>
          {hasAccess(['Founder', 'Manager']) && (
            <button
              onClick={() => setActiveModule('finance')}
              style={{
                flex: 1,
                padding: '8px',
                background: activeModule === 'finance' ? '#ca8a04' : '#333', // Gold/DarkYellow
                color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold'
              }}
            >
              💰 FINANCE
            </button>
          )}
        </div>

        {/* Language Switcher - Disabled for French-only mode */}
        {/* <div style={{ display: 'flex', justifyContent: 'center', gap: '5px', marginBottom: '10px' }}>
          {['en', 'fr', 'ar'].map(lang => (
            <button
              key={lang}
              onClick={() => changeLanguage(lang)}
              style={{
                background: language === lang ? '#FFD700' : '#333',
                color: language === lang ? 'black' : 'gray',
                border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold'
              }}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div> */}

        <nav style={{ flex: 1, overflowY: 'auto' }}>


          {/* OPERATIONS MODULE ITEMS */}
          {activeModule === 'operations' && (
            <>
              {!isWorker && <SidebarItem icon="📊" label={t('dashboard')} path="/" />}

              {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                <SidebarItem icon="📅" label={t('projects')} path="/projects" />
              )}

              <SidebarItem icon="📆" label={t('calendar')} path="/calendar" />
              <SidebarItem icon="👤" label="Human Resources" path="/hr" />

              {hasAccess(['Founder', 'Manager', 'Storekeeper']) && (
                <SidebarItem icon="📦" label={t('inventory')} path="/inventory" />
              )}

              {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                <SidebarItem icon="👥" label={t('clients')} path="/clients" />
              )}

              {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                <SidebarItem icon="👷" label={t('workers')} path="/workers" />
              )}

              {!isWorker && <SidebarItem icon="🔧" label={t('maintenance')} path="/maintenance" />}

              {hasAccess(['Founder', 'Manager', 'Storekeeper']) && (
                <SidebarItem icon="🚚" label={t('transfers')} path="/transfers" />
              )}

              {!isWorker && (
                <>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '15px 10px' }}></div>
                  <div style={{ padding: '0 15px', marginBottom: '10px', fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>{t('logistics')}</div>
                </>
              )}

              {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                <SidebarItem icon="🆔" label={t('drivers')} path="/drivers" />
              )}
              {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                <SidebarItem icon="🚚" label="Transporteurs" path="/carriers" />
              )}
              {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                <SidebarItem icon="📝" label="Bons de Livraison" path="/delivery-notes" />
              )}
              {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                <SidebarItem icon="👷" label={t('freelancers')} path="/freelancers" />
              )}
              {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                <SidebarItem icon="🚐" label={t('vehicles')} path="/vehicles" />
              )}
              {hasAccess(['Founder', 'Manager', 'Storekeeper']) && (
                <SidebarItem icon="🤝" label={t('subcontracting')} path="/subcontracting" />
              )}
              {!isWorker && <SidebarItem icon="🧮" label={t('structure_calc')} path="/calculator" />}
              {!isWorker && <SidebarItem icon="📺" label="LED Screen System" path="/led-config" />}
              {!isWorker && <SidebarItem icon="🏗️" label="Stage Calculator" path="/stage-calc" />}
              <SidebarItem icon="📦" label="Flycase Scanner" path="/flycases" />

              {!isWorker && (
                <>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '15px 10px' }}></div>
                  <div style={{ padding: '0 15px', marginBottom: '10px', fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Admin</div>
                </>
              )}
              {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                <SidebarItem icon="📶" label={t('qr_codes') || 'QR Codes'} path="/qr-codes" />
              )}
            </>
          )}

          {/* FINANCE MODULE ITEMS - RESTRICTED TO FOUNDER & MANAGER */}
          {activeModule === 'finance' && hasAccess(['Founder', 'Manager']) && (
            <>
              <SidebarItem icon="📝" label="Quotes" path="/quotes" />
              <SidebarItem icon="✨" label="New Quote" path="/quote-builder" />

              <SidebarItem icon="💶" label="Invoices" path="/invoices" />
              <SidebarItem icon="⏰" label="Overdue" path="/overdue" />
              <SidebarItem icon="💰" label="Payment Entry" path="/payments" />
              <SidebarItem icon="🏦" label="Bank Recon" path="/reconciliation" />

              <SidebarItem icon="📅" label="Projects (All)" path="/projects" />
              <SidebarItem icon="👥" label={t('clients')} path="/clients" />
              <SidebarItem icon="👥" label={t('clients')} path="/clients" />

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '15px 10px' }}></div>
              <div style={{ padding: '0 15px', marginBottom: '10px', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Reports</div>
              <SidebarItem icon="📈" label="Financial Reports" path="/reports" />
              <SidebarItem icon="⚖️" label="Fiscal Dashboard" path="/fiscal" />
              <SidebarItem icon="📆" label={t('calendar')} path="/calendar" />

              <SidebarItem icon="📋" label={t('audits')} path="/audits" />
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '15px 10px' }}></div>
              <div style={{ padding: '0 15px', marginBottom: '10px', fontSize: '11px', color: '#a3a3a3', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Admin</div>
              <SidebarItem icon="⚙️" label="Settings" path="/settings" />
            </>
          )}

        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', padding: '0 10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user.name.charAt(0)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase' }}>{user.role}</div>
            </div>
          </div>
          <button onClick={logout} style={{ width: '100%', background: '#ef4444', color: 'white', padding: '8px', borderRadius: '5px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontWeight: 'bold' }}>
            <span>🚪</span> {t('logout')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/clients" element={<ClientView />} />
          <Route path="/workers" element={<WorkersView />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/maintenance" element={<MaintenanceView />} />
          <Route path="/transfers" element={<TransferView />} />
          <Route path="/hr" element={<HRView />} />
          <Route path="/drivers" element={<DriverView />} />
          <Route path="/carriers" element={<CarrierView />} />
          <Route path="/delivery-notes" element={<DeliveryNoteList />} />
          <Route path="/delivery-notes/new" element={<DeliveryNoteForm />} />
          <Route path="/delivery-notes/edit/:id" element={<DeliveryNoteForm />} />
          <Route path="/freelancers" element={<FreelancerView />} />
          <Route path="/vehicles" element={<VehicleView />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/audits" element={<AuditListView />} />
          <Route path="/audits/:id" element={<AuditDetailView />} />
          <Route path="/qr-codes" element={<QRCodeScreen />} />
          <Route path="/quotes" element={<QuotesList />} />
          <Route path="/quote-builder" element={<QuoteBuilder />} />
          <Route path="/invoices" element={<InvoiceList />} />
          <Route path="/invoice-builder" element={<InvoiceBuilder />} />
          <Route path="/reconciliation" element={<ReconciliationView />} />
          <Route path="/payments" element={<PaymentEntry />} />
          <Route path="/overdue" element={<OverdueInvoices />} />
          <Route path="/reports" element={<FinancialReportsView />} />
          <Route path="/fiscal" element={<FiscalDashboard />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/calculator" element={<StructureCalcView />} />
          <Route path="/subcontracting" element={<SubcontractedManagement />} />
          <Route path="/subcontracting" element={<SubcontractedManagement />} />
          <Route path="/led-config" element={<LedConfigurator />} />
          <Route path="/stage-calc" element={<StageConfigurator />} />
          <Route path="/flycases" element={<FlycaseScanner />} />
          {/* Catch all */}
          <Route path="*" element={<InventoryList />} />
        </Routes>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <ErrorBoundary>
            <AuthenticatedApp />
            <ChatWidget />
          </ErrorBoundary>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

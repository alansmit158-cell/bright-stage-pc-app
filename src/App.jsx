import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { ConfirmProvider } from './context/ConfirmContext';

// View Components
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
import FinancialReportsView from './components/FinancialReportsView';
import OverdueInvoices from './components/OverdueInvoices';
import SettingsView from './components/SettingsView';
import FiscalDashboard from './components/FiscalDashboard';
import StructureCalcView from './components/StructureCalcView';
import SubcontractedManagement from './components/SubcontractedManagement';
import LedConfigurator from './components/LedConfigurator';
import StageConfigurator from './components/StageConfigurator';
import FlycaseScanner from './components/FlycaseScanner';
import ChatWidget from './components/ChatWidget';

import './index.css';

// --- Shared Components ---

const SidebarItem = ({ icon, label, path, active }) => {
  const navigate = useNavigate();
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

const SectionHeader = ({ label }) => (
  <>
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '15px 10px' }}></div>
    <div style={{ padding: '0 15px', marginBottom: '10px', fontSize: '11px', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>{label}</div>
  </>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) {
    console.log('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white', background: '#330000', borderRadius: '8px', margin: '20px' }}>
          <h1>System Encountered an Error</h1>
          <pre>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()} className="btn" style={{ marginTop: '10px' }}>Reload Application</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Main Application Components ---

const AuthenticatedApp = () => {
  const { user, login, logout, loading } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [activeModule, setActiveModule] = useState('operations');

  const userRole = useMemo(() => user?.role?.toLowerCase(), [user]);
  const hasAccess = (roles) => roles.some(r => r.toLowerCase() === userRole);
  const isWorker = userRole === 'worker';

  if (loading) return <div className="loading-screen text-white text-center mt-20">Securely loading Bright Stage...</div>;
  if (!user) return <LoginView onLogin={login} />;

  const isPathActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path));

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar shadow-xl">
        <div className="logo-container" style={{ padding: '20px 0', textAlign: 'center' }}>
          <img src="/logo.png" alt="Bright Stage" style={{ maxWidth: '80%', height: 'auto', filter: 'drop-shadow(0 0 10px rgba(99, 102, 241, 0.4))' }} />
        </div>

        {/* Module Switcher */}
        {hasAccess(['Founder', 'Manager']) && (
          <div className="module-switcher" style={{ padding: '0 10px 20px 10px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveModule('operations')}
              className={`module-btn ${activeModule === 'operations' ? 'ops-active' : ''}`}
            >
              ⚡ OPS
            </button>
            <button
              onClick={() => setActiveModule('finance')}
              className={`module-btn ${activeModule === 'finance' ? 'fin-active' : ''}`}
            >
              💰 FINANCE
            </button>
          </div>
        )}

        <nav style={{ flex: 1, overflowY: 'auto', paddingRight: '5px' }}>
          {/* OPERATIONS MODULE */}
          {activeModule === 'operations' && (
            <>
              {!isWorker && <SidebarItem icon="📊" label={t('dashboard')} path="/" active={isPathActive('/')} />}
              {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                <SidebarItem icon="📅" label={t('projects')} path="/projects" active={isPathActive('/projects')} />
              )}
              <SidebarItem icon="📆" label={t('calendar')} path="/calendar" active={isPathActive('/calendar')} />
              <SidebarItem icon="👤" label="Human Resources" path="/hr" active={isPathActive('/hr')} />

              {hasAccess(['Founder', 'Manager', 'Storekeeper']) && (
                <SidebarItem icon="📦" label={t('inventory')} path="/inventory" active={isPathActive('/inventory')} />
              )}

              {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                <>
                  <SectionHeader label="Contacts & Staff" />
                  <SidebarItem icon="👥" label={t('clients')} path="/clients" active={isPathActive('/clients')} />
                  <SidebarItem icon="👷" label={t('workers')} path="/workers" active={isPathActive('/workers')} />
                  <SidebarItem icon="👷" label={t('freelancers')} path="/freelancers" active={isPathActive('/freelancers')} />
                </>
              )}

              <SectionHeader label={t('logistics')} />
              {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                <>
                  <SidebarItem icon="🆔" label={t('drivers')} path="/drivers" active={isPathActive('/drivers')} />
                  <SidebarItem icon="🚚" label="Transporteurs" path="/carriers" active={isPathActive('/carriers')} />
                  <SidebarItem icon="🚐" label={t('vehicles')} path="/vehicles" active={isPathActive('/vehicles')} />
                </>
              )}
              <SidebarItem icon="📦" label="Flycase Scanner" path="/flycases" active={isPathActive('/flycases')} />
              <SidebarItem icon="📝" label="Bons de Livraison" path="/delivery-notes" active={isPathActive('/delivery-notes')} />

              <SectionHeader label="Equipment Operations" />
              {!isWorker && (
                <>
                  <SidebarItem icon="🔧" label={t('maintenance')} path="/maintenance" active={isPathActive('/maintenance')} />
                  <SidebarItem icon="🚚" label={t('transfers')} path="/transfers" active={isPathActive('/transfers')} />
                  <SidebarItem icon="🤝" label={t('subcontracting')} path="/subcontracting" active={isPathActive('/subcontracting')} />
                </>
              )}

              <SectionHeader label="System Tools" />
              {!isWorker && (
                <>
                  <SidebarItem icon="🧮" label={t('structure_calc')} path="/calculator" active={isPathActive('/calculator')} />
                  <SidebarItem icon="📺" label="LED Configurator" path="/led-config" active={isPathActive('/led-config')} />
                  <SidebarItem icon="🏗️" label="Stage Calculator" path="/stage-calc" active={isPathActive('/stage-calc')} />
                </>
              )}
              {hasAccess(['Founder', 'Manager', 'Storekeeper', 'Site Manager']) && (
                <SidebarItem icon="📶" label={t('qr_codes') || 'Global QR Export'} path="/qr-codes" active={isPathActive('/qr-codes')} />
              )}
            </>
          )}

          {/* FINANCE MODULE */}
          {activeModule === 'finance' && hasAccess(['Founder', 'Manager']) && (
            <>
              <SidebarItem icon="📝" label="Quotes / Devis" path="/quotes" active={isPathActive('/quotes')} />
              <SidebarItem icon="✨" label="Quote Builder" path="/quote-builder" active={isPathActive('/quote-builder')} />
              <SidebarItem icon="💶" label="Invoice Management" path="/invoices" active={isPathActive('/invoices')} />
              <SidebarItem icon="⏰" label="Overdue Invoices" path="/overdue" active={isPathActive('/overdue')} />

              <SectionHeader label="Analytics & Reporting" />
              <SidebarItem icon="📈" label="Financial Reports" path="/reports" active={isPathActive('/reports')} />
              <SidebarItem icon="⚖️" label="Fiscal Dashboard" path="/fiscal" active={isPathActive('/fiscal')} />
              <SidebarItem icon="📋" label={t('audits')} path="/audits" active={isPathActive('/audits')} />

              <SectionHeader label="Administration" />
              <SidebarItem icon="⚙️" label="Settings" path="/settings" active={isPathActive('/settings')} />
            </>
          )}
        </nav>

        {/* User Profile & Logout */}
        <div className="sidebar-footer">
          <div className="user-profile-summary">
            <div className="user-avatar">
              {user.name.charAt(0)}
            </div>
            <div className="user-info">
              <div className="user-name">{user.name}</div>
              <div className="user-role-label">{user.role}</div>
            </div>
          </div>
          <button onClick={logout} className="logout-btn">
            <span>🚪</span> {t('logout')}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="main-content-wrapper">
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
          <Route path="/overdue" element={<OverdueInvoices />} />
          <Route path="/reports" element={<FinancialReportsView />} />
          <Route path="/fiscal" element={<FiscalDashboard />} />
          <Route path="/settings" element={<SettingsView />} />
          <Route path="/calculator" element={<StructureCalcView />} />
          <Route path="/subcontracting" element={<SubcontractedManagement />} />
          <Route path="/led-config" element={<LedConfigurator />} />
          <Route path="/stage-calc" element={<StageConfigurator />} />
          <Route path="/flycases" element={<FlycaseScanner />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <NotificationProvider>
        <ConfirmProvider>
          <AuthProvider>
            <LanguageProvider>
              <ErrorBoundary>
                <AuthenticatedApp />
                <ChatWidget />
              </ErrorBoundary>
            </LanguageProvider>
          </AuthProvider>
        </ConfirmProvider>
      </NotificationProvider>
    </Router>
  );
}

export default App;

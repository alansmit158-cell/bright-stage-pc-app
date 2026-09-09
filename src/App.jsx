import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { ConfirmProvider } from './context/ConfirmContext';

// View Components
import LoginView from './components/LoginView';
import DashboardView from './components/DashboardView';
import ComingSoon from './components/ComingSoon';
import ChatWidget from './components/ChatWidget';

// ✅ Magasin (Inventory / Store)
import InventoryList from './components/InventoryList';
import InventoryForm from './components/InventoryForm';
import FlycaseScanner from './components/FlycaseScanner';
import QRCodeScreen from './components/QRCodeScreen';

// ✅ Logistique
import DriverView from './components/DriverView';
import CarrierView from './components/CarrierView';
import VehicleView from './components/VehicleView';
import DeliveryNoteList from './components/DeliveryNoteList';
import DeliveryNoteForm from './components/DeliveryNoteForm';
import TransferView from './components/TransferView';

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

          {/* ── OPERATIONS MODULE ── */}
          <Route path="/projects" element={<ComingSoon icon="📅" featureName="Gestion des Projets" description="Créez, planifiez et suivez tous vos projets événementiels en temps réel." />} />
          <Route path="/calendar" element={<ComingSoon icon="📆" featureName="Calendrier" description="Vue calendrier unifiée de tous vos événements, réservations et plannings d'équipe." />} />
          <Route path="/hr" element={<ComingSoon icon="👤" featureName="Ressources Humaines" description="Gérez les contrats, congés, paies et dossiers de tous vos employés." />} />
          {/* ✅ MAGASIN / INVENTAIRE — ACTIF */}
          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/inventory/new" element={<InventoryForm />} />
          <Route path="/inventory/edit/:id" element={<InventoryForm />} />
          <Route path="/flycases" element={<FlycaseScanner />} />
          <Route path="/qr-codes" element={<QRCodeScreen />} />

          {/* Contacts & Staff — Coming Soon */}
          <Route path="/clients" element={<ComingSoon icon="👥" featureName="Clients" description="Base de données clients, historique des projets et gestion des contacts." />} />
          <Route path="/workers" element={<ComingSoon icon="👷" featureName="Techniciens" description="Annuaire complet de vos techniciens avec compétences et disponibilités." />} />
          <Route path="/freelancers" element={<ComingSoon icon="🎭" featureName="Freelancers" description="Gestion des prestataires indépendants, contrats et fiches de paie." />} />

          {/* ✅ LOGISTIQUE — ACTIF */}
          <Route path="/drivers" element={<DriverView />} />
          <Route path="/carriers" element={<CarrierView />} />
          <Route path="/vehicles" element={<VehicleView />} />
          <Route path="/delivery-notes" element={<DeliveryNoteList />} />
          <Route path="/delivery-notes/new" element={<DeliveryNoteForm />} />
          <Route path="/delivery-notes/edit/:id" element={<DeliveryNoteForm />} />

          {/* Equipment Operations */}
          <Route path="/maintenance" element={<ComingSoon icon="🔧" featureName="Maintenance" description="Planification des maintenances préventives et correctives de votre matériel." />} />
          <Route path="/transfers" element={<TransferView />} />
          <Route path="/subcontracting" element={<ComingSoon icon="🤝" featureName="Sous-traitance" description="Gestion des prestataires externes et du matériel sous-traité." />} />

          {/* System Tools */}
          <Route path="/calculator" element={<ComingSoon icon="🧮" featureName="Calcul de Structure" description="Calculateur de charges et résistances pour vos structures scéniques." />} />
          <Route path="/led-config" element={<ComingSoon icon="📺" featureName="Configurateur LED" description="Configurez et visualisez en 3D vos murs et scènes LED." />} />
          <Route path="/stage-calc" element={<ComingSoon icon="🏗️" featureName="Stage Calculator" description="Calculateur de dimensions et de capacité pour vos scènes et podiums." />} />

          {/* ── FINANCE MODULE ── */}
          <Route path="/quotes" element={<ComingSoon icon="📝" featureName="Devis" description="Créez des devis professionnels et suivez leur validation par vos clients." />} />
          <Route path="/quote-builder" element={<ComingSoon icon="✨" featureName="Quote Builder" description="Constructeur de devis avancé avec catalogue de prestations et tarifs." />} />
          <Route path="/invoices" element={<ComingSoon icon="💶" featureName="Facturation" description="Émettez, envoyez et suivez toutes vos factures clients en quelques clics." />} />
          <Route path="/invoice-builder" element={<ComingSoon icon="💶" featureName="Invoice Builder" description="Constructeur de factures avec personnalisation et calcul TVA automatique." />} />
          <Route path="/overdue" element={<ComingSoon icon="⏰" featureName="Factures Impayées" description="Tableau de bord des factures en retard avec relances automatiques." />} />
          <Route path="/reports" element={<ComingSoon icon="📈" featureName="Rapports Financiers" description="Analyses détaillées de votre chiffre d'affaires, marges et rentabilité." />} />
          <Route path="/fiscal" element={<ComingSoon icon="⚖️" featureName="Tableau de Bord Fiscal" description="Suivi de votre situation fiscale, TVA collectée et déclarations." />} />
          <Route path="/audits" element={<ComingSoon icon="📋" featureName="Audits" description="Journal d'audit complet de toutes les actions effectuées dans le système." />} />
          <Route path="/audits/:id" element={<ComingSoon icon="📋" featureName="Détail Audit" description="Détails complets d'un événement d'audit spécifique." />} />
          <Route path="/settings" element={<ComingSoon icon="⚙️" featureName="Paramètres" description="Configuration générale, utilisateurs, rôles et préférences de l'application." />} />

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

import { useState } from 'react';
import LoginScreen from './components/LoginScreen';
import SignUpScreen from './components/SignUpScreen';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); // 'login' or 'signup'

  if (!user) {
    if (currentView === 'signup') {
      return <SignUpScreen onNavigate={setCurrentView} />;
    }
    return <LoginScreen onLogin={setUser} onNavigate={setCurrentView} />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard user={user} onLogout={() => setUser(null)} />;
  }

  if (user.role === 'employee') {
    return <EmployeeDashboard user={user} onLogout={() => setUser(null)} />;
  }
}
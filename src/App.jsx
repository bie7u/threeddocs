import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './i18n';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import GuestDashboard from './pages/GuestDashboard';
import SharedView from './pages/SharedView';

function App() {
  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/guest" element={<GuestDashboard />} />
          <Route path="/view/:shareToken" element={<SharedView />} />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;

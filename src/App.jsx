import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import GuestDashboard from './pages/GuestDashboard';
import SharedView from './pages/SharedView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/guest" element={<GuestDashboard />} />
        <Route path="/view/:shareToken" element={<SharedView />} />
      </Routes>
    </Router>
  );
}

export default App;

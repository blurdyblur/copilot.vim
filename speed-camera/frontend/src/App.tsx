import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DisclaimerPage from './pages/DisclaimerPage';
import MapPage from './pages/MapPage';
import SettingsPage from './pages/SettingsPage';
import SuccessPage from './pages/SuccessPage';
import './index.css';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/" element={isAuthenticated ? <Navigate to="/map" /> : <LoginPage />} />
      <Route
        path="/disclaimer"
        element={
          <ProtectedRoute>
            <DisclaimerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <MapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/success"
        element={
          <ProtectedRoute>
            <SuccessPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;

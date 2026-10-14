import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LangProvider } from './context/LangContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import StationPage from './pages/StationPage';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter>
          {/* Navbar is rendered at root so it's outside each page's flex layout */}
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  );
}

/**
 * AppShell renders Navbar + Routes together so Navbar can read router location.
 * StationPage passes its loaded station up to Navbar via window.__railnavStation.
 */
function AppShell() {
  return (
    <div id="app-shell">
      <Navbar station={typeof window !== 'undefined' ? window.__railnavStation : null} />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/station/:id" element={<StationPage />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*"            element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import BACommandApp from './components/BACommandApp';
import { authService } from './services/authService';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user && authService.isAuthenticated()) {
      console.log('✅ Utilisateur déjà connecté:', user);
      setIsAuthenticated(true);
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  const handleLoginSuccess = (user) => {
    console.log('🎉 Connexion réussie ! User:', user);
    setIsAuthenticated(true);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    console.log('👋 Déconnexion...');
    authService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🚕</div>
          <div className="text-xl font-semibold text-gray-700">TaxiConnect</div>
          <div className="text-sm text-gray-500 mt-2">Chargement...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthenticated ? (
        <BACommandApp 
          user={currentUser} 
          onLogout={handleLogout}
        />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;

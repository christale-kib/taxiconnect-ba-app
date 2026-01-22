import React, { useState } from 'react';
import { UserPlus, LogIn, Lock, Mail, Phone, MapPin } from 'lucide-react';
import { authService } from '../services/authService';

export default function LoginPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Formulaire de connexion
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Formulaire d'inscription
  const [registerData, setRegisterData] = useState({
    nom: '',
    prenom: '',
    telephone: '',
    email: '',
    password: ''
  });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('📝 Tentative de connexion...');
      const response = await authService.login(loginData);
      
      console.log('✅ Connexion réussie !', response);
      
      if (response.success) {
        onLoginSuccess(response.user);
      } else {
        setError(response.message || 'Erreur de connexion');
      }
    } catch (err) {
      console.error('❌ Erreur login:', err);
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('📝 Tentative d\'inscription...');
      const response = await authService.register(registerData);
      
      console.log('✅ Inscription réussie !', response);
      
      if (response.success) {
        onLoginSuccess(response.user);
      } else {
        setError(response.message || 'Erreur d\'inscription');
      }
    } catch (err) {
      console.error('❌ Erreur register:', err);
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center">
            <span className="text-4xl">🚕</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">TaxiConnect</h1>
          <p className="text-gray-600">Espace Brand Ambassador</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-2 mb-6 flex">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              isLogin 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md' 
                : 'text-gray-600'
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              !isLogin 
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-md' 
                : 'text-gray-600'
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {isLogin ? (
            /* FORMULAIRE DE CONNEXION */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={loginData.email}
                  onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                  placeholder="exemple@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock size={16} className="inline mr-2" />
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>🔄 Connexion...</span>
                ) : (
                  <span className="flex items-center justify-center">
                    <LogIn size={20} className="mr-2" />
                    Se connecter
                  </span>
                )}
              </button>
            </form>
          ) : (
            /* FORMULAIRE D'INSCRIPTION */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.nom}
                    onChange={(e) => setRegisterData({...registerData, nom: e.target.value})}
                    placeholder="Dupont"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    value={registerData.prenom}
                    onChange={(e) => setRegisterData({...registerData, prenom: e.target.value})}
                    placeholder="Jean"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Téléphone
                </label>
                <input
                  type="tel"
                  required
                  value={registerData.telephone}
                  onChange={(e) => setRegisterData({...registerData, telephone: e.target.value})}
                  placeholder="+242 06 XXX XXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  placeholder="exemple@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock size={16} className="inline mr-2" />
                  Mot de passe
                </label>
                <input
                  type="password"
                  required
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  placeholder="Min. 6 caractères"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-4 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>🔄 Inscription...</span>
                ) : (
                  <span className="flex items-center justify-center">
                    <UserPlus size={20} className="mr-2" />
                    S'inscrire
                  </span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>© 2026 TaxiConnect - Tous droits réservés</p>
        </div>
      </div>
    </div>
  );
}
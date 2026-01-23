import React, { useEffect, useMemo, useCallback, useState } from "react";
import {
  Award,
  Bell,
  Home,
  Users,
  UserPlus,
  TrendingUp,
  Target,
  Search,
  Filter,
  ChevronRight,
  QrCode,
  Plus,
  Gift,
  Camera,
  Check,
  RefreshCw
} from "lucide-react";
import api from "../config/api"; // ⚠️ Assure-toi que ce fichier existe et exporte un axios instance
// -------------------------
// Helpers (mapping backend → UI)
// -------------------------
function safeNumber(v, d = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function buildFullName(raw) {
  const prenom = raw?.prenom ?? raw?.firstName ?? "";
  const nom = raw?.nom ?? raw?.lastName ?? "";
  const name = raw?.name ?? "";
  const full = [prenom, nom].filter(Boolean).join(" ").trim();
  return full || name || "Brand Ambassador";
}
function normalizeBaStats(raw = {}) {
  return {
    name: buildFullName(raw),
    level: raw?.niveau ?? raw?.level ?? "BA",
    rank: safeNumber(raw?.rang ?? raw?.rank, 0),
    totalDrivers: safeNumber(raw?.total_chauffeurs ?? raw?.totalDrivers, 0),
    activeDrivers: safeNumber(raw?.chauffeurs_actifs ?? raw?.activeDrivers, 0),
    totalPassengers: safeNumber(raw?.total_passagers ?? raw?.totalPassengers, 0),
    monthlyCommission: safeNumber(raw?.commission_mois ?? raw?.monthlyCommission, 0),
    pendingCommission: safeNumber(raw?.commission_en_attente ?? raw?.pendingCommission, 0),
    streak: safeNumber(raw?.serie_jours ?? raw?.streak, 0),
    targetProgress: safeNumber(raw?.targetProgress ?? raw?.progress, 0)
  };
}
function splitName(fullName) {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { prenom: "", nom: "" };
  if (parts.length === 1) return { prenom: parts[0], nom: parts[0] };
  const prenom = parts.shift();
  const nom = parts.join(" ");
  return { prenom, nom };
}
// -------------------------
// Component
// -------------------------
export default function BACommandApp() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNotifications, setShowNotifications] = useState(false);
  const [enrollmentStep, setEnrollmentStep] = useState(1); // 1 | 2 | 3 | 4 | 5 | 6 | 'qr'
  const [enrollmentData, setEnrollmentData] = useState({
    type: "chauffeur",
    name: "",
    phone: "",
    station: "",
    vehicleNumber: "",
    vehicleModel: "",
    photoTaken: false,
    idPhotoTaken: false
  });
  const [baStats, setBaStats] = useState(null);
  const [recentRecruits, setRecentRecruits] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submittingEnroll, setSubmittingEnroll] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  // Fallback UI data (ne contient plus les noms “Jean-Paul / Marcel…”)
  const defaultChallenges = useMemo(
    () => [
      { id: 1, title: "Objectif Semaine", description: "Atteindre 5 enrôlements", progress: 0, reward: "Bonus", endsIn: "—" },
      { id: 2, title: "Sprint 24h", description: "2 enrôlements en 24h", progress: 0, reward: "Bonus x2", endsIn: "—" }
    ],
    []
  );
  const safeLeaderboard = useMemo(() => {
    if (Array.isArray(leaderboard) && leaderboard.length >= 3) return leaderboard;
    const meName = baStats?.name || "Vous";
    const meDrivers = baStats?.totalDrivers || 0;
    return [
      { rank: 1, name: "—", drivers: 0, badge: "🏆" },
      { rank: 2, name: "—", drivers: 0, badge: "🥈" },
      { rank: 3, name: meName, drivers: meDrivers, badge: "🥉", isMe: true }
    ];
  }, [leaderboard, baStats]);
  const safeChallenges = useMemo(() => {
    if (Array.isArray(challenges) && challenges.length > 0) return challenges;
    return defaultChallenges;
  }, [challenges, defaultChallenges]);
  // -------------------------
  // Load dashboard from API
  // -------------------------
  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError("");
      // ⚠️ Ton backend confirme /stats/dashboard.
      // Les autres endpoints sont optionnels : on les tente sans casser l’UI.
      const results = await Promise.allSettled([
        api.get("/stats/dashboard"),
        api.get("/stats/recent"),
        api.get("/stats/challenges"),
        api.get("/stats/leaderboard")
      ]);
      const statsRes = results[0];
      if (statsRes.status !== "fulfilled") {
        throw statsRes.reason;
      }
      const rawStats = statsRes.value?.data?.data ?? statsRes.value?.data ?? {};
      setBaStats(normalizeBaStats(rawStats));
      const recentRes = results[1];
      if (recentRes.status === "fulfilled") {
        setRecentRecruits(recentRes.value?.data?.data ?? []);
      } else {
        setRecentRecruits([]);
      }
      const challengesRes = results[2];
      if (challengesRes.status === "fulfilled") {
        setChallenges(challengesRes.value?.data?.data ?? []);
      } else {
        setChallenges([]);
      }
      const leaderboardRes = results[3];
      if (leaderboardRes.status === "fulfilled") {
        setLeaderboard(leaderboardRes.value?.data?.data ?? []);
      } else {
        setLeaderboard([]);
      }
    } catch (err) {
      console.error("Erreur chargement dashboard", err);
      setLoadError("Impossible de charger les statistiques (API).");
      setBaStats(null);
      setRecentRecruits([]);
      setChallenges([]);
      setLeaderboard([]);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  // -------------------------
  // Enrollment submit (API)
  // -------------------------
  const submitEnrollment = useCallback(async () => {
    setEnrollError("");
    const isDriver = enrollmentData.type === "chauffeur";
    // validations UI rapides
    if (!enrollmentData.name || !enrollmentData.phone) {
      setEnrollError("Nom et téléphone requis.");
      return;
    }
    if (isDriver && !enrollmentData.station) {
      setEnrollError("Station requise pour un chauffeur.");
      return;
    }
    if (isDriver && (!enrollmentData.vehicleNumber || !enrollmentData.vehicleModel)) {
      setEnrollError("Immatriculation et modèle requis.");
      return;
    }
    if (!enrollmentData.photoTaken || !enrollmentData.idPhotoTaken) {
      setEnrollError("Photos requises.");
      return;
    }
    setSubmittingEnroll(true);
    try {
      const { prenom, nom } = splitName(enrollmentData.name);
      if (isDriver) {
        // Payload "tolérant" (on envoie plusieurs clés possibles)
        await api.post("/chauffeurs/enroll", {
          // champs "frontend"
          name: enrollmentData.name,
          phone: enrollmentData.phone,
          station: enrollmentData.station,
          vehicleNumber: enrollmentData.vehicleNumber,
          vehicleModel: enrollmentData.vehicleModel,
          // champs "backend classiques"
          prenom,
          nom,
          telephone: enrollmentData.phone,
          immatriculation: enrollmentData.vehicleNumber,
          modele: enrollmentData.vehicleModel
        });
      } else {
        await api.post("/passagers/enroll", {
          name: enrollmentData.name,
          phone: enrollmentData.phone,
          prenom,
          nom,
          telephone: enrollmentData.phone
        });
      }
      // refresh stats après insertion
      await loadDashboard();
      // success screen
      setEnrollmentStep(6);
    } catch (err) {
      console.error("Erreur enrôlement", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Erreur lors de l’enrôlement";
      setEnrollError(msg);
    } finally {
      setSubmittingEnroll(false);
    }
  }, [enrollmentData, loadDashboard]);
  // -------------------------
  // Loading / Error screens
  // -------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Chargement du dashboard...
      </div>
    );
  }
  if (loadError || !baStats) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-600 p-6">
        <div className="font-semibold mb-2">Dashboard indisponible</div>
        <div className="text-sm mb-4">{loadError || "baStats vide"}</div>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold"
        >
          Réessayer
        </button>
      </div>
    );
  }
  // -------------------------
  // UI sections (design conservé)
  // -------------------------
  const renderDashboard = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={loadDashboard}
          className="text-xs font-semibold text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-xl flex items-center gap-2 hover:border-orange-400"
          title="Rafraîchir"
        >
          <RefreshCw size={14} />
          Rafraîchir
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl p-4 text-white">
          <div className="text-sm opacity-90">Chauffeurs Actifs</div>
          <div className="text-3xl font-bold mt-1">{baStats.activeDrivers}</div>
          <div className="text-xs mt-1 opacity-80">sur {baStats.totalDrivers} recrutés</div>
        </div>
        <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl p-4 text-white">
          <div className="text-sm opacity-90">Commissions Mois</div>
          <div className="text-2xl font-bold mt-1">{baStats.monthlyCommission.toLocaleString()}</div>
          <div className="text-xs mt-1 opacity-80">XAF</div>
        </div>
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-4 text-white">
          <div className="text-sm opacity-90">Passagers</div>
          <div className="text-3xl font-bold mt-1">{baStats.totalPassengers}</div>
          <div className="text-xs mt-1 opacity-80">total enrôlés</div>
        </div>
        <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-4 text-white">
          <div className="text-sm opacity-90">Série en cours</div>
          <div className="text-3xl font-bold mt-1">{baStats.streak} 🔥</div>
          <div className="text-xs mt-1 opacity-80">jours consécutifs</div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-gray-800">Objectif Mensuel</div>
          <div className="text-sm text-gray-500">{baStats.targetProgress}%</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          <div
            className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, baStats.targetProgress))}%` }}
          />
        </div>
        <div className="text-xs text-gray-600">Suivi automatique (basé sur l’activité)</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => {
            setActiveTab("enroll");
            setEnrollmentStep("qr");
          }}
          className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl p-4 flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-transform"
        >
          <QrCode size={24} />
          <span className="font-semibold">Scanner QR</span>
        </button>
        <button
          onClick={() => {
            setActiveTab("enroll");
            setEnrollmentStep(2);
          }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-4 flex items-center justify-center space-x-2 shadow-lg active:scale-95 transition-transform"
        >
          <Plus size={24} />
          <span className="font-semibold">Ajout Manuel</span>
        </button>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-gray-800 flex items-center">
            <Gift className="mr-2 text-purple-500" size={20} />
            Challenges Actifs
          </div>
          <ChevronRight size={18} className="text-gray-400" />
        </div>
        <div className="space-y-2">
          {safeChallenges.map((challenge) => (
            <div key={challenge.id} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
              <div className="flex justify-between items-start mb-1">
                <div className="font-medium text-sm text-gray-800">{challenge.title}</div>
                <div className="text-xs text-purple-600 font-semibold">{challenge.endsIn}</div>
              </div>
              <div className="text-xs text-gray-600 mb-2">{challenge.description}</div>
              <div className="flex items-center justify-between">
                <div className="flex-1 bg-white rounded-full h-2 mr-2">
                  <div
                    className="bg-gradient-to-r from-purple-400 to-pink-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, safeNumber(challenge.progress, 0)))}%` }}
                  />
                </div>
                <div className="text-xs font-semibold text-purple-600">
                  {safeNumber(challenge.progress, 0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold text-gray-800">Recrues Récentes</div>
          <ChevronRight size={18} className="text-gray-400" />
        </div>
        {recentRecruits.length === 0 ? (
          <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
            Aucune recrue récente (ou endpoint /stats/recent non activé).
          </div>
        ) : (
          <div className="space-y-2">
            {recentRecruits.map((recruit) => (
              <div key={recruit.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      recruit.type === "chauffeur" || recruit.type === "Chauffeur" ? "bg-yellow-500" : "bg-blue-500"
                    }`}
                  >
                    {(recruit.name || recruit.nom || "?").charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-800">
                      {recruit.name || `${recruit.prenom || ""} ${recruit.nom || ""}`.trim() || "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {recruit.type || "—"} • {recruit.date || recruit.created_at || "—"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {recruit.status || "—"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  const renderEnrollment = () => {
    const isDriver = enrollmentData.type === "chauffeur";
    if (enrollmentStep === "qr") {
      return (
        <div className="space-y-4">
          <button onClick={() => setEnrollmentStep(1)} className="text-orange-500 flex items-center text-sm font-medium">
            ← Retour aux options
          </button>
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <QrCode size={48} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Scanner le QR Code</h3>
            <p className="text-sm text-gray-600 mb-6">Demandez au chauffeur de présenter son QR Code TaxiConnect</p>
            <div className="bg-gray-900 rounded-xl p-8 mb-4 relative overflow-hidden">
              <div className="absolute inset-0 border-4 border-yellow-400 animate-pulse" />
              <div className="text-white text-sm mb-2">Cadrez le QR Code</div>
              <div className="w-48 h-48 mx-auto bg-white/10 rounded-lg flex items-center justify-center">
                <div className="w-40 h-40 border-2 border-yellow-400 rounded-lg" />
              </div>
            </div>
            <button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-4 rounded-xl shadow-lg">
              Activer la Caméra
            </button>
          </div>
        </div>
      );
    }
    if (enrollmentStep === 1) {
      return (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white text-center">
            <UserPlus size={48} className="mx-auto mb-3" />
            <h2 className="text-2xl font-bold mb-2">Nouvel Enrôlement</h2>
            <p className="text-sm opacity-90">Choisissez la méthode d'enregistrement</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setEnrollmentStep("qr")}
              className="w-full bg-white border-2 border-gray-200 rounded-xl p-6 text-left hover:border-orange-500 transition-all active:scale-95"
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                  <QrCode size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800 text-lg">Scanner QR Code</div>
                  <div className="text-sm text-gray-600">Méthode rapide</div>
                </div>
                <ChevronRight className="text-gray-400" />
              </div>
            </button>
            <button
              onClick={() => setEnrollmentStep(2)}
              className="w-full bg-white border-2 border-gray-200 rounded-xl p-6 text-left hover:border-orange-500 transition-all active:scale-95"
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                  <UserPlus size={32} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-800 text-lg">Enrôlement Manuel</div>
                  <div className="text-sm text-gray-600">Saisie complète</div>
                </div>
                <ChevronRight className="text-gray-400" />
              </div>
            </button>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-800 font-semibold">Aujourd'hui</div>
                <div className="text-xs text-green-600">Suivi via statistiques</div>
              </div>
              <div className="text-3xl font-bold text-green-700">{baStats.totalDrivers + baStats.totalPassengers}</div>
            </div>
          </div>
        </div>
      );
    }
    if (enrollmentStep === 2) {
      return (
        <div className="space-y-4">
          <button onClick={() => setEnrollmentStep(1)} className="text-orange-500 flex items-center text-sm font-medium">
            ← Retour
          </button>
          <div className="bg-white rounded-xl p-6">
            <div className="text-center mb-6">
              <div className="text-lg font-bold text-gray-800">Type d'Utilisateur</div>
              <div className="text-sm text-gray-600">Qui souhaitez-vous enregistrer ?</div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setEnrollmentData((s) => ({ ...s, type: "chauffeur" }));
                  setEnrollmentStep(3);
                }}
                className="w-full border-2 border-gray-200 rounded-xl p-6 text-left hover:border-orange-500 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white text-2xl">
                    🚕
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 text-lg">Chauffeur de Taxi</div>
                    <div className="text-sm text-gray-600">Enrôlement + suivi d’activité</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => {
                  setEnrollmentData((s) => ({ ...s, type: "passager" }));
                  setEnrollmentStep(3);
                }}
                className="w-full border-2 border-gray-200 rounded-xl p-6 text-left hover:border-blue-500 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center text-white text-2xl">
                    👤
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-gray-800 text-lg">Passager</div>
                    <div className="text-sm text-gray-600">Inscription + activation</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      );
    }
    if (enrollmentStep === 3) {
      return (
        <div className="space-y-4">
          <button onClick={() => setEnrollmentStep(2)} className="text-orange-500 flex items-center text-sm font-medium">
            ← Retour
          </button>
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-lg font-bold text-gray-800">Informations</div>
                <div className="text-sm text-gray-600">Étape 1 sur {isDriver ? "3" : "2"}</div>
              </div>
              <div className="text-2xl">{isDriver ? "🚕" : "👤"}</div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom Complet *</label>
                <input
                  type="text"
                  value={enrollmentData.name}
                  onChange={(e) => setEnrollmentData((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Ex: Jean-Paul Mbemba"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de Téléphone *</label>
                <input
                  type="tel"
                  value={enrollmentData.phone}
                  onChange={(e) => setEnrollmentData((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="Ex: +242 06 XXX XXXX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              {isDriver && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Station Principale *</label>
                  <select
                    value={enrollmentData.station}
                    onChange={(e) => setEnrollmentData((s) => ({ ...s, station: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Sélectionner une station</option>
                    <option value="Station Aéroport">Station Aéroport</option>
                    <option value="Station Marché Central">Station Marché Central</option>
                    <option value="Station Gare Routière">Station Gare Routière</option>
                    <option value="Station Moungali">Station Moungali</option>
                  </select>
                </div>
              )}
            </div>
            <button
              onClick={() => setEnrollmentStep(4)}
              disabled={!enrollmentData.name || !enrollmentData.phone || (isDriver && !enrollmentData.station)}
              className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer
            </button>
          </div>
        </div>
      );
    }
    if (enrollmentStep === 4 && isDriver) {
      return (
        <div className="space-y-4">
          <button onClick={() => setEnrollmentStep(3)} className="text-orange-500 flex items-center text-sm font-medium">
            ← Retour
          </button>
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-lg font-bold text-gray-800">Véhicule</div>
                <div className="text-sm text-gray-600">Étape 2 sur 3</div>
              </div>
              <div className="text-2xl">🚗</div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Numéro d'Immatriculation *</label>
                <input
                  type="text"
                  value={enrollmentData.vehicleNumber}
                  onChange={(e) =>
                    setEnrollmentData((s) => ({ ...s, vehicleNumber: e.target.value.toUpperCase() }))
                  }
                  placeholder="Ex: AB-123-CD"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marque et Modèle *</label>
                <input
                  type="text"
                  value={enrollmentData.vehicleModel}
                  onChange={(e) => setEnrollmentData((s) => ({ ...s, vehicleModel: e.target.value }))}
                  placeholder="Ex: Toyota Corolla"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <button
              onClick={() => setEnrollmentStep(5)}
              disabled={!enrollmentData.vehicleNumber || !enrollmentData.vehicleModel}
              className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continuer
            </button>
          </div>
        </div>
      );
    }
    if (enrollmentStep === 5 || (enrollmentStep === 4 && !isDriver)) {
      return (
        <div className="space-y-4">
          <button
            onClick={() => setEnrollmentStep(isDriver ? 4 : 3)}
            className="text-orange-500 flex items-center text-sm font-medium"
          >
            ← Retour
          </button>
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-lg font-bold text-gray-800">Photos</div>
                <div className="text-sm text-gray-600">Étape {isDriver ? "3 sur 3" : "2 sur 2"}</div>
              </div>
              <div className="text-2xl">📸</div>
            </div>
            {enrollError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {enrollError}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photo de Profil *</label>
                <button
                  type="button"
                  onClick={() => setEnrollmentData((s) => ({ ...s, photoTaken: true }))}
                  className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${
                    enrollmentData.photoTaken ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-orange-500"
                  }`}
                >
                  {enrollmentData.photoTaken ? (
                    <>
                      <Check className="text-green-500 mb-2" size={48} />
                      <div className="text-green-700 font-medium">Photo capturée ✓</div>
                    </>
                  ) : (
                    <>
                      <Camera className="text-gray-400 mb-2" size={48} />
                      <div className="text-gray-700 font-medium">Prendre la photo</div>
                    </>
                  )}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pièce d'Identité *</label>
                <button
                  type="button"
                  onClick={() => setEnrollmentData((s) => ({ ...s, idPhotoTaken: true }))}
                  className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${
                    enrollmentData.idPhotoTaken ? "border-green-500 bg-green-50" : "border-gray-300 hover:border-orange-500"
                  }`}
                >
                  {enrollmentData.idPhotoTaken ? (
                    <>
                      <Check className="text-green-500 mb-2" size={48} />
                      <div className="text-green-700 font-medium">Document capturé ✓</div>
                    </>
                  ) : (
                    <>
                      <Camera className="text-gray-400 mb-2" size={48} />
                      <div className="text-gray-700 font-medium">Photographier la pièce</div>
                    </>
                  )}
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={submitEnrollment}
              disabled={submittingEnroll || !enrollmentData.photoTaken || !enrollmentData.idPhotoTaken}
              className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-4 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingEnroll ? "Enregistrement..." : "Terminer l'Enrôlement"}
            </button>
          </div>
        </div>
      );
    }
    if (enrollmentStep === 6) {
      const commission = enrollmentData.type === "chauffeur" ? 5000 : 500;
      return (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-8 text-center">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center">
              <Check size={48} className="text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Enrôlement Réussi ! 🎉</h3>
            <p className="text-gray-600 mb-6">{enrollmentData.name} a été enregistré avec succès</p>
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white mb-6">
              <div className="text-sm opacity-90 mb-1">Commission d'Enrôlement</div>
              <div className="text-3xl font-bold">+{commission.toLocaleString()} XAF</div>
              <div className="text-xs opacity-90 mt-1">Suivi automatique dans le dashboard</div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => {
                  setEnrollmentStep(1);
                  setEnrollmentData({
                    type: "chauffeur",
                    name: "",
                    phone: "",
                    station: "",
                    vehicleNumber: "",
                    vehicleModel: "",
                    photoTaken: false,
                    idPhotoTaken: false
                  });
                  setEnrollError("");
                }}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-4 rounded-xl shadow-lg"
              >
                Enrôler un Nouveau
              </button>
              <button
                onClick={() => setActiveTab("dashboard")}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-4 rounded-xl"
              >
                Retour au Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  const renderRecruits = () => (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
        <button className="bg-gray-100 p-3 rounded-xl">
          <Filter size={20} className="text-gray-600" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-700">{baStats.activeDrivers}</div>
          <div className="text-xs text-green-600">Chauffeurs actifs</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-700">{baStats.totalPassengers}</div>
          <div className="text-xs text-blue-600">Passagers</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-700">{baStats.totalDrivers}</div>
          <div className="text-xs text-yellow-700">Chauffeurs total</div>
        </div>
      </div>
      <div className="space-y-2">
        {recentRecruits.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-500">
            Liste des recrues : indisponible (active /stats/recent côté API pour l’alimenter).
          </div>
        ) : (
          recentRecruits.map((recruit) => (
            <div key={recruit.id} className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                      recruit.type === "chauffeur" || recruit.type === "Chauffeur"
                        ? "bg-gradient-to-br from-yellow-400 to-orange-500"
                        : "bg-gradient-to-br from-blue-400 to-blue-600"
                    }`}
                  >
                    {(recruit.name || recruit.nom || "?").charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">
                      {recruit.name || `${recruit.prenom || ""} ${recruit.nom || ""}`.trim() || "—"}
                    </div>
                    <div className="text-xs text-gray-500">{recruit.type || "—"}</div>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
  const renderLeaderboard = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
        <div className="text-center mb-4">
          <div className="text-lg font-bold text-gray-800">🏆 Classement National</div>
          <div className="text-xs text-gray-600">Temps réel</div>
        </div>
        <div className="flex justify-center items-end space-x-2 mb-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
              {safeLeaderboard[1].name.charAt(0)}
            </div>
            <div className="text-3xl mb-1">🥈</div>
            <div className="text-xs font-semibold text-gray-700">{safeLeaderboard[1].name.split(" ")[0]}</div>
            <div className="text-xs text-gray-600">{safeLeaderboard[1].drivers} recrues</div>
          </div>
          <div className="text-center -mt-4">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-2 border-4 border-yellow-300">
              {safeLeaderboard[0].name.charAt(0)}
            </div>
            <div className="text-4xl mb-1">🏆</div>
            <div className="text-sm font-bold text-gray-800">{safeLeaderboard[0].name.split(" ")[0]}</div>
            <div className="text-xs text-gray-600 font-semibold">{safeLeaderboard[0].drivers} recrues</div>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-300 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-2">
              {safeLeaderboard[2].name.charAt(0)}
            </div>
            <div className="text-3xl mb-1">🥉</div>
            <div className="text-xs font-semibold text-gray-700">{safeLeaderboard[2].name.split(" ")[0]}</div>
            <div className="text-xs text-gray-600">{safeLeaderboard[2].drivers} recrues</div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
        {safeLeaderboard.map((ba) => (
          <div key={ba.rank} className={`p-4 flex items-center justify-between ${ba.isMe ? "bg-yellow-50" : ""}`}>
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  ba.rank <= 3
                    ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {ba.rank}
              </div>
              <div>
                <div className={`font-semibold ${ba.isMe ? "text-orange-600" : "text-gray-800"}`}>
                  {ba.name} {ba.isMe ? "(Vous)" : ""}
                </div>
                <div className="text-xs text-gray-600">{ba.drivers} chauffeurs</div>
              </div>
            </div>
            {ba.badge ? <div className="text-2xl">{ba.badge}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
  const renderCommissions = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <div className="text-sm opacity-90 mb-1">Total ce Mois</div>
        <div className="text-4xl font-bold mb-3">{baStats.monthlyCommission.toLocaleString()} XAF</div>
        <div className="flex items-center justify-between text-sm">
          <div className="opacity-90">En attente: {baStats.pendingCommission.toLocaleString()} XAF</div>
          <div className="bg-white/20 px-3 py-1 rounded-full">Live</div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="font-semibold text-gray-800 mb-3">Historique</div>
        <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
          (Optionnel) Ajoute un endpoint /stats/commissions pour afficher l’historique réel.
        </div>
      </div>
    </div>
  );
  // -------------------------
  // Main layout (design conservé)
  // -------------------------
  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen pb-20">
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white p-4 pb-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
              <Award className="text-white" size={24} />
            </div>
            <div>
              <div className="font-bold text-lg">{baStats.name}</div>
              <div className="text-xs opacity-90 flex items-center">
                <span className="bg-white/20 px-2 py-0.5 rounded-full mr-2">{baStats.level}</span>
                Rang #{baStats.rank}
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative bg-white/20 backdrop-blur p-2 rounded-full"
          >
            <Bell size={20} />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
              3
            </div>
          </button>
        </div>
      </div>
      {showNotifications && (
        <div className="absolute top-20 right-4 left-4 bg-white rounded-xl shadow-2xl p-4 z-50 border border-gray-200">
          <div className="font-semibold mb-3 text-gray-800">Notifications</div>
          <div className="space-y-2">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-sm text-gray-800">Info</div>
              <div className="text-xs text-gray-600 mt-1">Notifications à connecter à ton backend (optionnel).</div>
            </div>
          </div>
        </div>
      )}
      <div className="p-4">
        {activeTab === "dashboard" && renderDashboard()}
        {activeTab === "enroll" && renderEnrollment()}
        {activeTab === "recruits" && renderRecruits()}
        {activeTab === "leaderboard" && renderLeaderboard()}
        {activeTab === "commissions" && renderCommissions()}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-5">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`p-3 flex flex-col items-center space-y-1 ${
              activeTab === "dashboard" ? "text-orange-500" : "text-gray-400"
            }`}
          >
            <Home size={22} />
            <span className="text-xs font-medium">Accueil</span>
          </button>
          <button
            onClick={() => setActiveTab("recruits")}
            className={`p-3 flex flex-col items-center space-y-1 ${
              activeTab === "recruits" ? "text-orange-500" : "text-gray-400"
            }`}
          >
            <Users size={22} />
            <span className="text-xs font-medium">Recrues</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("enroll");
              setEnrollmentStep(1);
            }}
            className="relative -mt-4"
          >
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ${
                activeTab === "enroll"
                  ? "bg-gradient-to-br from-orange-500 to-red-500"
                  : "bg-gradient-to-br from-yellow-500 to-orange-500"
              }`}
            >
              <UserPlus size={28} className="text-white" />
            </div>
            <div className={`text-xs font-medium mt-1 ${activeTab === "enroll" ? "text-orange-500" : "text-gray-700"}`}>
              Enrôler
            </div>
          </button>
          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`p-3 flex flex-col items-center space-y-1 ${
              activeTab === "leaderboard" ? "text-orange-500" : "text-gray-400"
            }`}
          >
            <TrendingUp size={22} />
            <span className="text-xs font-medium">Ranking</span>
          </button>
          <button
            onClick={() => setActiveTab("commissions")}
            className={`p-3 flex flex-col items-center space-y-1 ${
              activeTab === "commissions" ? "text-orange-500" : "text-gray-400"
            }`}
          >
            <Target size={22} />
            <span className="text-xs font-medium">Gains</span>
          </button>
        </div>
      </div>
    </div>
  );
}
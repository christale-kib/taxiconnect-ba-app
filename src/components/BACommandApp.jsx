import React, { useEffect, useState } from "react";
import axios from "axios";

const BACommandApp = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  /* =========================
     FETCH DASHBOARD STATS
     ========================= */
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get("/api/stats/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.success) {
          setStats(res.data.data);
        } else {
          setError("Impossible de charger les statistiques");
        }
      } catch (err) {
        console.error("Erreur dashboard:", err);
        setError("Erreur serveur");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return <div className="p-6">Chargement du dashboard…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  /* =========================
     DESTRUCTURATION API
     ========================= */
  const {
    total_chauffeurs,
    chauffeurs_actifs,
    total_passagers,
    commission_mois,
    commission_totale,
    serie_jours,
    rang,
    niveau,
    progression,
  } = stats;

  return (
    <div className="p-6 space-y-6">

      {/* =====================
          HEADER BA
         ===================== */}
      <div className="bg-white rounded-xl p-4 shadow">
        <h1 className="text-xl font-bold">Tableau de bord</h1>
        <p className="text-gray-600">
          Rang #{rang} • {niveau}
        </p>
      </div>

      {/* =====================
          STATS PRINCIPALES
         ===================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <StatCard
          title="Chauffeurs actifs"
          value={chauffeurs_actifs}
          sub={`${chauffeurs_actifs} sur ${total_chauffeurs} recrutés`}
        />

        <StatCard
          title="Passagers"
          value={total_passagers}
          sub="Total recrutés"
        />

        <StatCard
          title="Commissions mois"
          value={`${commission_mois.toLocaleString()} XAF`}
        />

        <StatCard
          title="Série en cours"
          value={`${serie_jours} 🔥`}
          sub="jours consécutifs"
        />
      </div>

      {/* =====================
          OBJECTIF MENSUEL
         ===================== */}
      <div className="bg-white rounded-xl p-4 shadow">
        <h2 className="font-semibold mb-2">Objectif mensuel</h2>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full"
            style={{ width: `${progression}%` }}
          />
        </div>
        <p className="text-sm mt-2">{progression}% atteint</p>
      </div>

      {/* =====================
          COMMISSIONS TOTALES
         ===================== */}
      <div className="bg-white rounded-xl p-4 shadow">
        <h2 className="font-semibold">Commissions totales</h2>
        <p className="text-2xl font-bold text-green-600">
          {commission_totale.toLocaleString()} XAF
        </p>
      </div>

    </div>
  );
};

/* =========================
   COMPONENT : STAT CARD
   ========================= */
const StatCard = ({ title, value, sub }) => (
  <div className="bg-white rounded-xl p-4 shadow">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

export default BACommandApp;

  );
}
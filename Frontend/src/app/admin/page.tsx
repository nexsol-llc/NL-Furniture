"use client";

import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Activity,
  Mail,
  Cookie,
  Users,
  Store,
  Tag,
  FolderTree,
  UserCheck,
  Package,
  UploadCloud,
  Download,
  Search,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { getAdminUser, adminFetch, type AdminPayload } from "@/lib/adminAuth";

type Stats = {
  totalBrands: number;
  activeCouponStores: number;
  totalCoupons: number;
  totalUsers: number;
  totalCategories: number;
  totalInfluencers: number;
  totalProducts: number;
  totalCsvUploads: number;
  cookieAccepted: number;
  cookieRefused: number;
  totalNewsletter: number;
};

type ActivityLog = {
  _id: string;
  userEmail: string;
  action: string;
  details: string;
  createdAt: string;
};

type Subscriber = {
  _id: string;
  email: string;
  createdAt: string;
};

type CookieLog = {
  _id: string;
  ip: string;
  userAgent: string;
  choice: "accepted" | "refused";
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  gclid?: string;
  fbclid?: string;
  createdAt: string;
};

export default function AdminDashboardPage() {
  const [adminUser, setAdminUser] = useState<AdminPayload | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "activity" | "newsletter" | "cookies">("overview");

  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [cookieLogs, setCookieLogs] = useState<CookieLog[]>([]);
  const [subSearch, setSubSearch] = useState("");
  const [cookieSearch, setCookieSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAdminUser(getAdminUser());
  }, []);

  const fetchStats = async () => {
    try {
      const res = await adminFetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await adminFetch("/api/admin/activity-log");
      if (res.ok) {
        const data = await res.json();
        setActivities(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const res = await adminFetch("/api/newsletter");
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data.subscribers || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCookieLogs = async () => {
    try {
      const res = await adminFetch("/api/cookie-consent/log/list");
      if (res.ok) {
        const data = await res.json();
        setCookieLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchActivities(), fetchSubscribers(), fetchCookieLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    if (adminUser) loadData();
  }, [adminUser]);

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm("Really delete this subscriber?")) return;
    try {
      const res = await adminFetch(`/api/newsletter?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Subscriber deleted");
        setSubscribers((prev) => prev.filter((s) => s._id !== id));
        fetchStats();
      } else {
        toast.error("Delete failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  };

  const handleExportNewsletter = async () => {
    try {
      const res = await adminFetch("/api/newsletter?export=csv");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "newsletter.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export fehlgeschlagen");
    }
  };

  const handleExportCookieLogs = async () => {
    try {
      const res = await adminFetch("/api/cookie-consent/log/export");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cookie-logs.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export fehlgeschlagen");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) return null;

  const filteredSubscribers = subscribers.filter((s) =>
    s.email.toLowerCase().includes(subSearch.toLowerCase())
  );

  const filteredCookieLogs = cookieLogs.filter((c) =>
    c.ip.includes(cookieSearch) ||
    c.userAgent.toLowerCase().includes(cookieSearch.toLowerCase()) ||
    (c.utmSource && c.utmSource.toLowerCase().includes(cookieSearch.toLowerCase())) ||
    (c.choice && c.choice.toLowerCase().includes(cookieSearch.toLowerCase()))
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <Toaster position="top-center" />

      {/* DASHBOARD HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Overview of statistics, newsletter subscribers, cookie retargeting and user activity.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 hover:shadow transition"
        >
          Daten aktualisieren
        </button>
      </div>

      {/* TAB NAVIGATION */}
      <div className="border-b border-slate-200 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === "overview"
              ? "border-primary-600 text-primary-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <LayoutDashboard size={18} /> Overview
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === "activity"
              ? "border-primary-600 text-primary-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Activity size={18} /> Activity Log
        </button>
        <button
          onClick={() => setActiveTab("newsletter")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === "newsletter"
              ? "border-primary-600 text-primary-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Mail size={18} /> Newsletter ({subscribers.length})
        </button>
        <button
          onClick={() => setActiveTab("cookies")}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === "cookies"
              ? "border-primary-600 text-primary-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
          }`}
        >
          <Cookie size={18} /> Cookie Consent ({cookieLogs.length})
        </button>
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" && stats && (
        <div className="space-y-8 animate-fadeIn">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white border border-slate-200/80 p-6 rounded-lg shadow-sm flex items-center gap-4 hover:shadow transition duration-200">
              <div className="p-3.5 bg-primary-50 text-primary-600 rounded-xl"><Store size={22} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Coupon Stores</p>
                <h3 className="text-2xl font-semibold text-slate-850 mt-1">{stats.totalBrands}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{stats.activeCouponStores} stores with coupons</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-lg shadow-sm flex items-center gap-4 hover:shadow transition duration-200">
              <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl"><Tag size={22} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Coupons</p>
                <h3 className="text-2xl font-semibold text-slate-850 mt-1">{stats.totalCoupons}</h3>
                <p className="text-[11px] text-rose-500 mt-0.5">Active saving coupons</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-lg shadow-sm flex items-center gap-4 hover:shadow transition duration-200">
              <div className="p-3.5 bg-primary-50 text-primary-600 rounded-xl"><Users size={22} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Users</p>
                <h3 className="text-2xl font-semibold text-slate-850 mt-1">{stats.totalUsers}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Kunden & Admins</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-lg shadow-sm flex items-center gap-4 hover:shadow transition duration-200">
              <div className="p-3.5 bg-primary-50 text-primary-600 rounded-xl"><FolderTree size={22} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Catalog Categories</p>
                <h3 className="text-2xl font-semibold text-slate-850 mt-1">{stats.totalCategories}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Main & subcategories</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-lg shadow-sm flex items-center gap-4 hover:shadow transition duration-200">
              <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl"><UserCheck size={22} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Influencer Profiles</p>
                <h3 className="text-2xl font-semibold text-slate-850 mt-1">{stats.totalInfluencers}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Stile & Lookbooks</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-lg shadow-sm flex items-center gap-4 hover:shadow transition duration-200">
              <div className="p-3.5 bg-primary-50 text-primary-600 rounded-xl"><Package size={22} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CSV Products</p>
                <h3 className="text-2xl font-semibold text-slate-850 mt-1">{stats.totalProducts}</h3>
                <p className="text-[11px] text-primary-500 mt-0.5">Importiert im Katalog</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-lg shadow-sm flex items-center gap-4 hover:shadow transition duration-200">
              <div className="p-3.5 bg-primary-50 text-primary-600 rounded-xl"><UploadCloud size={22} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CSV Uploads</p>
                <h3 className="text-2xl font-semibold text-slate-850 mt-1">{stats.totalCsvUploads}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Erfolgreiche Datenfeeds</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/80 p-6 rounded-lg shadow-sm flex items-center gap-4 hover:shadow transition duration-200">
              <div className="p-3.5 bg-orange-50 text-orange-600 rounded-xl"><Mail size={22} /></div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Newsletter Subscribers</p>
                <h3 className="text-2xl font-semibold text-slate-850 mt-1">{stats.totalNewsletter}</h3>
                <p className="text-[11px] text-orange-500 mt-0.5">Emails in Datenbank</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 text-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              Retargeting & Pixel Tracking Status
              <Cookie size={22} className="text-primary-600" />
            </h2>
            <p className="text-gray-500 text-sm mt-1 max-w-2xl">
              Analysis of visitor decisions on Google Ads & Meta Pixel consent.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-8">
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-lg">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Total Decisions</p>
                <h4 className="text-2xl font-semibold mt-1">{stats.cookieAccepted + stats.cookieRefused}</h4>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-lg">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Accepted</p>
                <h4 className="text-2xl font-semibold text-emerald-600 mt-1">{stats.cookieAccepted}</h4>
                <p className="text-[11px] text-gray-400 mt-1">
                  {stats.cookieAccepted + stats.cookieRefused > 0
                    ? Math.round((stats.cookieAccepted / (stats.cookieAccepted + stats.cookieRefused)) * 100)
                    : 0}% Conversion-Rate
                </p>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-lg">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Rejected</p>
                <h4 className="text-2xl font-semibold text-rose-600 mt-1">{stats.cookieRefused}</h4>
              </div>
              <div className="bg-gray-50 border border-gray-100 p-5 rounded-lg flex flex-col justify-center">
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">Pixel Tracking</p>
                <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-600 text-xs font-semibold w-fit">
                  <CheckCircle size={14} /> Enabled
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-950 flex items-center gap-2">
                <Activity size={20} className="text-primary-600" /> Recent admin activity
              </h2>
              <button
                onClick={() => setActiveTab("activity")}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition"
              >
                Alle anzeigen →
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {activities.slice(0, 5).length === 0 ? (
                <p className="text-slate-400 text-sm py-4">No activity recorded.</p>
              ) : (
                activities.slice(0, 5).map((log) => (
                  <div key={log._id} className="py-3 flex justify-between items-start gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {log.action}
                        <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded ml-2">
                          {log.userEmail}
                        </span>
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">{log.details}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("de-DE")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: ACTIVITY LOG */}
      {activeTab === "activity" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div>
            <h2 className="text-xl font-semibold text-slate-950 flex items-center gap-2">
              <Activity size={20} className="text-primary-600" /> Recent admin activity
            </h2>
            <p className="text-slate-500 text-sm mt-1">Verlauf von Hinzufügungen, Löschungen und CSV-Importen.</p>
          </div>

          <div className="flow-root">
            {activities.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No activity recorded.</p>
            ) : (
              <ul className="-mb-8">
                {activities.map((log, logIdx) => (
                  <li key={log._id}>
                    <div className="relative pb-8">
                      {logIdx !== activities.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-primary-50 text-primary-600 border border-primary-200 flex items-center justify-center">
                            <Activity size={16} />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-slate-800 font-semibold">
                              {log.action}{" "}
                              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded ml-2">
                                {log.userEmail}
                              </span>
                            </p>
                            <p className="text-xs text-slate-600 mt-1">{log.details}</p>
                          </div>
                          <div className="text-right text-xs whitespace-nowrap text-slate-400">
                            {new Date(log.createdAt).toLocaleString("de-DE")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: NEWSLETTER LIST */}
      {activeTab === "newsletter" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 flex items-center gap-2">
                <Mail size={20} className="text-primary-600" /> Newsletter Subscribers
              </h2>
              <p className="text-slate-500 text-sm mt-1">Manage your subscriber list and export emails.</p>
            </div>

            <button
              onClick={handleExportNewsletter}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition shadow"
            >
              <Download size={16} /> Download list as CSV
            </button>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search subscribers by email..."
              className="w-full pl-10 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-slate-50/50"
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full table-auto border-collapse text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-xs border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Subscribed On</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-400">
                      No subscribers found.
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((sub) => (
                    <tr key={sub._id} className="hover:bg-slate-50/40 transition">
                      <td className="px-6 py-4 font-semibold text-slate-900">{sub.email}</td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(sub.createdAt).toLocaleString("de-DE")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {adminUser.role !== "editor" && (
                          <button
                            onClick={() => handleDeleteSubscriber(sub._id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: COOKIE LOGS */}
      {activeTab === "cookies" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-950 flex items-center gap-2">
                <Cookie size={20} className="text-primary-600" /> Cookie Consent Visitor Logs
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                Recorded cookie consents for retargeting optimization (Google Ads & Meta Pixel).
              </p>
            </div>

            <button
              onClick={handleExportCookieLogs}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition shadow"
            >
              <Download size={16} /> Download cookie logs as CSV
            </button>
          </div>

          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="Search logs by IP, browser, UTM source, decision..."
              className="w-full pl-10 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 bg-slate-50/50"
              value={cookieSearch}
              onChange={(e) => setCookieSearch(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full table-auto border-collapse text-left text-xs text-slate-700 min-w-[1000px]">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3">Date/Time</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">IP-Adresse</th>
                  <th className="px-4 py-3">Referrer</th>
                  <th className="px-4 py-3">UTM Source / Campaign</th>
                  <th className="px-4 py-3">GCLID (Google) / FBCLID (Meta)</th>
                  <th className="px-4 py-3">Browser / User-Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCookieLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">
                      No cookie logs found.
                    </td>
                  </tr>
                ) : (
                  filteredCookieLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/40 transition">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                        {new Date(log.createdAt).toLocaleString("de-DE")}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.choice === "accepted" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold text-[10px]">
                            <CheckCircle size={10} /> ASSUME
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 font-semibold text-[10px]">
                            <XCircle size={10} /> REFUSE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-800">{log.ip}</td>
                      <td className="px-4 py-3 truncate max-w-[150px] text-slate-500" title={log.referrer}>
                        {log.referrer || <span className="text-slate-350 italic">Keiner</span>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {log.utmSource ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-primary-700">Source: {log.utmSource}</span>
                            {log.utmCampaign && <span className="text-[9px] text-slate-400">Campaign: {log.utmCampaign}</span>}
                          </div>
                        ) : (
                          <span className="text-slate-350 italic">Keine Kampagne</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 font-mono text-[9px]">
                          {log.gclid && <span className="text-primary-600">G: {log.gclid.substring(0, 15)}...</span>}
                          {log.fbclid && <span className="text-primary-600">M: {log.fbclid.substring(0, 15)}...</span>}
                          {!log.gclid && !log.fbclid && <span className="text-slate-350 italic text-xs">Keine IDs</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 truncate max-w-[180px] text-slate-400" title={log.userAgent}>
                        {log.userAgent}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { getAdminUser, clearAdminToken, type AdminPayload } from "@/lib/adminAuth";
import { ThemeProvider } from "@/providers/themeContext";
import {
  LayoutDashboard,
  HardDrive,
  Image,
  Home,
  Sparkles,
  Megaphone,
  Zap,
  Star,
  FolderOpen,
  Building2,
  Package,
  FileText,
  Percent,
  Store,
  Tag,
  Camera,
  UserCircle,
  Cookie,
  Globe,
  Mail,
  Users,
  ShieldCheck,
  Palette,
  LogOut,
  ChevronLeft,
  PanelLeft,
} from "lucide-react";

type MenuItem = { name: string; href: string; icon: React.ReactNode };
type MenuGroup = { label: string | null; items: MenuItem[] };

function NavItem({
  href,
  icon,
  label,
  active,
  collapsed,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={`flex items-center gap-3 rounded-lg transition-all duration-150 ${
        collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"
      } ${
        active
          ? "bg-primary-600 text-white shadow-sm"
          : "text-gray-500 hover:bg-primary-50 hover:text-primary-700"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span className="text-sm font-medium truncate">{label}</span>}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminPayload | null | undefined>(undefined);
  const [collapsed, setCollapsed] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    const user = getAdminUser();
    if (!user) {
      router.push("/admin/login");
    } else {
      setAdmin(user);
    }
  }, [router, isLoginPage]);

  const handleLogout = () => {
    clearAdminToken();
    router.push("/admin/login");
  };

  // Render login page directly without sidebar/auth check (theme still applies)
  if (isLoginPage) return <ThemeProvider>{children}</ThemeProvider>;

  // Still checking auth
  if (admin === undefined) {
    return (
      <ThemeProvider>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gray-50">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
        </div>
      </ThemeProvider>
    );
  }

  if (!admin) return null;

  const role = admin.role;
  const isSuperAdmin = role === "super_admin";
  const isAdmin = role === "super_admin" || role === "admin";

  const groups: MenuGroup[] = [
    {
      label: null,
      items: [
        { name: "Dashboard", href: "/admin", icon: <LayoutDashboard size={16} /> },
        { name: "Media Library", href: "/admin/media", icon: <HardDrive size={16} /> },
      ],
    },
    {
      label: "Content",
      items: [
        { name: "Hero Section", href: "/admin/hero", icon: <Image size={16} /> },
        { name: "Indoor/Outdoor", href: "/admin/indoor-outdoor", icon: <Home size={16} /> },
        { name: "Home Influencer", href: "/admin/home-influencer", icon: <Sparkles size={16} /> },
        { name: "Sponsors", href: "/admin/sponsors", icon: <Megaphone size={16} /> },
        { name: "Gadgets", href: "/admin/gadgets", icon: <Zap size={16} /> },
        { name: "Top Angebote", href: "/admin/top-angebote", icon: <Star size={16} /> },
        { name: "Blog/Magazine", href: "/admin/blog", icon: <FileText size={16} /> },
        { name: "Influencers", href: "/admin/influencers", icon: <Camera size={16} /> },
        { name: "Newsletter", href: "/admin/newsletter", icon: <Mail size={16} /> },
        { name: "Authors", href: "/admin/authors", icon: <UserCircle size={16} /> },
      ],
    },
    {
      label: "Coupons",
      items: [
        { name: "Coupons Home", href: "/admin/coupons-home", icon: <Home size={16} /> },
        { name: "Coupon Stores", href: "/admin/coupon-stores", icon: <Store size={16} /> },
        { name: "Coupons", href: "/admin/coupons", icon: <Percent size={16} /> },
        { name: "Special Offers", href: "/admin/sonderangebote", icon: <Tag size={16} /> },
      ],
    },
    {
      label: "Furniture",
      items: [
        { name: "Categories Manager", href: "/admin/categories", icon: <FolderOpen size={16} /> },
        { name: "Brands", href: "/admin/furniture-brands", icon: <Building2 size={16} /> },
        { name: "Products", href: "/admin/furniture-products", icon: <Package size={16} /> },
      ],
    },
    {
      label: "Settings",
      items: [
        { name: "Cookie Consent", href: "/admin/cookie-consent", icon: <Cookie size={16} /> },
        { name: "SEO Content", href: "/admin/settings", icon: <Globe size={16} /> },
        ...(isAdmin
          ? [{ name: "Theme", href: "/admin/theme", icon: <Palette size={16} /> }]
          : []),
        ...(isAdmin ? [{ name: "Users", href: "/admin/users", icon: <Users size={16} /> }] : []),
        ...(isAdmin
          ? [{ name: "Staff Management", href: "/admin/staff", icon: <ShieldCheck size={16} /> }]
          : []),
      ],
    },
  ];

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin" || pathname === "/admin/"
      : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <ThemeProvider>
      {/* Height = viewport minus the sticky admin toolbar (h-16) rendered above this layout */}
      <div className={`flex h-[calc(100vh-4rem)] overflow-hidden bg-gray-50 ${role === "editor" ? "is-editor" : ""}`}>
        {/* SIDEBAR */}
        <aside
          className={`${
            collapsed ? "w-16" : "w-60"
          } h-full bg-white border-r border-gray-100 flex flex-col transition-all duration-200 shrink-0`}
        >
          {/* Header */}
          <div
            className={`flex items-center border-b border-gray-100 h-14 shrink-0 ${
              collapsed ? "justify-center px-2" : "justify-between px-4"
            }`}
          >
            {!collapsed && (
              <div>
                <p className="font-semibold text-gray-900 text-sm tracking-tight">NL FURNITURE</p>
                <p className="text-[10px] text-primary-600 font-semibold uppercase tracking-widest">Admin</p>
              </div>
            )}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeft size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
            {groups.map((group, gi) =>
              group.items.length === 0 ? null : (
                <React.Fragment key={group.label ?? `group-${gi}`}>
                  {group.label && !collapsed && (
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-300 px-3 pt-4 pb-1">
                      {group.label}
                    </p>
                  )}
                  {group.label && collapsed && <div className="h-3" />}
                  {group.items.map((item) => (
                    <NavItem
                      key={item.href}
                      href={item.href}
                      icon={item.icon}
                      label={item.name}
                      active={isActive(item.href)}
                      collapsed={collapsed}
                    />
                  ))}
                </React.Fragment>
              )
            )}
          </nav>

          {/* User Footer */}
          <div className={`border-t border-gray-100 shrink-0 ${collapsed ? "p-2" : "p-3"}`}>
            {!collapsed && (
              <div className="px-1 mb-2">
                <p className="text-xs font-semibold text-gray-800 truncate">{admin.name}</p>
                <span
                  className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isSuperAdmin
                      ? "bg-primary-100 text-primary-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {role.replace("_", " ")}
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Abmelden"
              className={`flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg w-full ${
                collapsed ? "justify-center p-2" : "px-3 py-2 text-xs font-medium hover:bg-red-50"
              }`}
            >
              <LogOut size={14} />
              {!collapsed && "Abmelden"}
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto min-w-0 p-6">{children}</main>
      </div>
    </ThemeProvider>
  );
}

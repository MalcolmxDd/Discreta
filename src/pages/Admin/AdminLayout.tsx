import { useState } from "react";
import { LayoutDashboard, Package, PlusCircle, Tags, ClipboardList, Ticket, LogOut, Menu, X } from "lucide-react";
import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAdmin } from "../../context/AdminContext";

export default function AdminLayout() {
  const { isAdmin, logout } = useAdmin();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return (
    <div className="admin-layout">
      {!sidebarOpen && (
        <button className="admin-mobile-toggle" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
          <Menu size={20} />
        </button>
      )}

      {sidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-header-inner">
            <div>
              <h3>DiscretaStore</h3>
              <span className="admin-sidebar-role">Admin</span>
            </div>
            <button className="admin-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú">
              <X size={18} />
            </button>
          </div>
        </div>
        <nav className="admin-sidebar-nav">
          <NavLink to="/admin" end className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>
          <NavLink to="/admin/productos" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
            <Package size={16} />
            Productos
          </NavLink>
          <NavLink to="/admin/productos/nuevo" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
            <PlusCircle size={16} />
            + Nuevo Producto
          </NavLink>
          <NavLink to="/admin/categorias" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
            <Tags size={16} />
            Categorías
          </NavLink>
          <NavLink to="/admin/pedidos" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
            <ClipboardList size={16} />
            Pedidos
          </NavLink>
          <NavLink to="/admin/cupones" className="admin-nav-link" onClick={() => setSidebarOpen(false)}>
            <Ticket size={16} />
            Cupones
          </NavLink>
        </nav>
        <div className="admin-sidebar-footer">
          <button className="btn-logout" onClick={logout}>
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

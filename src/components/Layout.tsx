import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Users,
    KanbanSquare,
    CheckSquare,
    LogOut,
    Menu,
    Settings,
    ChevronLeft,
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', to: '/', icon: LayoutDashboard },
        { name: 'Leads', to: '/leads', icon: Users },
        { name: 'Pipeline', to: '/pipeline', icon: KanbanSquare },
        { name: 'Tareas', to: '/tasks', icon: CheckSquare },
        { name: 'Agentes', to: '/agentes', icon: Users },
        { name: 'Integraciones', to: '/integrations', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-brand-bg">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-30 transform bg-brand-primary shadow-xl transition-all duration-300 lg:static lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full",
                isCollapsed ? "w-20" : "w-64"
            )}>
                <div className={cn(
                    "flex h-16 items-center border-b border-white/10 px-4",
                    isCollapsed ? "justify-center" : "justify-between"
                )}>
                    {!isCollapsed && <h1 className="text-xl font-bold text-white tracking-tight">CRM Seguros</h1>}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="p-1.5 rounded-lg hover:bg-white/10 hidden lg:block text-white/70 hover:text-white transition-colors"
                    >
                        {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                    </button>
                    {/* Mobile close button */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/70"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                </div>

                <nav className="mt-6 flex-1 space-y-1 px-3">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.to}
                            onClick={() => setSidebarOpen(false)}
                            title={isCollapsed ? item.name : undefined}
                            className={({ isActive }) => cn(
                                "flex items-center rounded-lg py-3 text-sm font-medium transition-all duration-200",
                                isCollapsed ? "justify-center px-2" : "px-4",
                                isActive
                                    ? "bg-brand-accent text-brand-primary shadow-md font-bold"
                                    : "text-white/70 hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isCollapsed ? "mr-0" : "mr-3")} />
                            {!isCollapsed && item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t border-white/10 p-4">
                    {!isCollapsed && (
                        <div className="flex items-center px-4 py-3 mb-2 bg-white/5 rounded-lg border border-white/5">
                            <div>
                                <p className="text-sm font-medium text-white truncate max-w-[160px]">{user?.email}</p>
                                <p className="text-xs text-white/50">Admin</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleSignOut}
                        title={isCollapsed ? "Cerrar Sesión" : undefined}
                        className={cn(
                            "flex w-full items-center rounded-lg py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors",
                            isCollapsed ? "justify-center px-2" : "px-4"
                        )}
                    >
                        <LogOut className={cn("h-5 w-5", isCollapsed ? "mr-0" : "mr-3")} />
                        {!isCollapsed && "Cerrar Sesión"}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden transition-all duration-300">
                <header className="flex h-16 items-center border-b bg-white px-6 lg:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-gray-500 focus:outline-none"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <span className="ml-4 text-lg font-semibold text-gray-800">Menu</span>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

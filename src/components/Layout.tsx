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
    Settings
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Layout() {
    const { signOut, user } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', to: '/', icon: LayoutDashboard },
        { name: 'Leads', to: '/leads', icon: Users },
        { name: 'Pipeline', to: '/pipeline', icon: KanbanSquare },
        { name: 'Tareas', to: '/tasks', icon: CheckSquare },
        { name: 'Integraciones', to: '/integrations', icon: Settings },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-20 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-30 w-64 transform bg-white shadow-lg transition-transform duration-200 lg:static lg:translate-x-0",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-center border-b px-6">
                    <h1 className="text-xl font-bold text-gray-800">CRM Seguros</h1>
                </div>

                <nav className="mt-6 flex-1 space-y-1 px-4">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) => cn(
                                "flex items-center rounded-md px-4 py-3 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-gray-700 hover:bg-gray-100"
                            )}
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                        </NavLink>
                    ))}
                </nav>

                <div className="border-t p-4">
                    <div className="flex items-center px-4 py-3">
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-700">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="mt-2 flex w-full items-center rounded-md px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
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

import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo-financiegroup.png';

export default function Login() {
    // Force re-render with new colors
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            loading && setLoading(false);
            navigate('/');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4 font-sans text-brand-text">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl border border-brand-border">
                <div className="p-8 sm:p-10">
                    <div className="mb-10 flex flex-col items-center">
                        <img src={logo} alt="Financie Group" className="h-20 w-auto object-contain mb-4" />
                        <h1 className="text-3xl font-bold text-brand-primary tracking-tight">Bienvenido</h1>
                        <p className="mt-2 text-center text-sm text-gray-500">Gestiona tus seguros con eficiencia</p>
                    </div>

                    {error && (
                        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center justify-center animate-in fade-in slide-in-from-top-2">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-brand-text">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full rounded-lg border border-brand-border bg-white px-4 py-3 text-brand-text placeholder:text-gray-400 focus:border-brand-secondary focus:outline-none focus:ring-4 focus:ring-brand-secondary/10 transition-all duration-200"
                                placeholder="tu@email.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" title="password" className="block text-sm font-medium text-brand-text">
                                    Contraseña
                                </label>
                            </div>
                            <input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-lg border border-brand-border bg-white px-4 py-3 text-brand-text placeholder:text-gray-400 focus:border-brand-secondary focus:outline-none focus:ring-4 focus:ring-brand-secondary/10 transition-all duration-200"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-brand-primary py-3.5 text-sm font-semibold text-white shadow-md hover:bg-[#08224d] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Ingresando...
                                </span>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </button>
                    </form>
                </div>
                <div className="bg-brand-bg/50 px-8 py-5 text-center border-t border-brand-border">
                    <p className="text-xs text-gray-500">
                        &copy; {new Date().getFullYear()} Berion Company. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}

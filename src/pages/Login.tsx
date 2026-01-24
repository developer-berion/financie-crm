import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo-financiegroup.png';

export default function Login() {
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
        <div className="flex min-h-screen items-center justify-center bg-[#0f171a] bg-gradient-to-br from-[#0f171a] to-[#19272b] p-4">
            <div className="w-full max-w-sm rounded-[2rem] bg-[#ffffff] p-10 shadow-xl border border-[#d9d9d9]">
                <div className="mb-8 flex flex-col items-center">
                    <img src={logo} alt="Financie Group" className="h-16 w-auto object-contain mb-6" />
                    <h1 className="text-2xl font-bold text-[#414042]">Iniciar sesión</h1>
                    <p className="mt-2 text-sm text-[#414042]/60">Gestiona tus seguros con eficiencia</p>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-[#414042] mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-[#d9d9d9] bg-white px-4 py-3 text-[#414042] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f6c71e] focus:border-transparent transition-all"
                            placeholder="tu@email.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" title="password" className="block text-sm font-semibold text-[#414042] mb-2">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-xl border border-[#d9d9d9] bg-white px-4 py-3 text-[#414042] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f6c71e] focus:border-transparent transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-[#f6c71e] py-3.5 text-sm font-bold text-[#0f171a] uppercase tracking-wider hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#f6c71e]/20"
                    >
                        {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-[#d9d9d9] text-center">
                    <p className="text-xs text-[#414042]/40">
                        &copy; {new Date().getFullYear()} Berion Company
                    </p>
                </div>
            </div>
        </div>
    );
}

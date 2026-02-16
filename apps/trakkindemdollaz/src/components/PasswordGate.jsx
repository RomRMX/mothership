import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

const PasswordGate = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        const auth = localStorage.getItem('trakkindemdollaz_auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === '4321') {
            localStorage.setItem('trakkindemdollaz_auth', 'true');
            setIsAuthenticated(true);
            setError(false);
        } else {
            setError(true);
            setPassword('');
            setTimeout(() => setError(false), 2000); // Reset error after shake animation
        }
    };

    if (isAuthenticated) {
        return <>{children}</>;
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-black text-white p-4" style={{
            background: 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)'
        }}>
            <div className="w-full max-w-md p-8 rounded-2xl bg-zinc-900/50 backdrop-blur-xl border border-white/10 shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-emerald-500/20">
                        <Lock className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-center">Restricted Access</h1>
                    <p className="text-zinc-400 text-center mt-2">Enter access code to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full bg-black/50 border ${error ? 'border-red-500 animate-shake' : 'border-white/10 focus:border-emerald-500'} rounded-lg px-4 py-3 outline-none transition-all placeholder-zinc-600 text-center text-2xl tracking-widest`}
                            placeholder="••••"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 rounded-lg transition-colors duration-200 shadow-lg shadow-emerald-900/20"
                    >
                        Authenticate
                    </button>
                </form>
            </div>

            <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
        </div>
    );
};

export default PasswordGate;

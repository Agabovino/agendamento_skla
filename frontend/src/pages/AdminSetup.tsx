import React, { useState, useEffect } from 'react';

const AdminSetup: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState<{ connected: boolean; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/admin/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    if (res.ok) {
      setIsLoggedIn(true);
      checkStatus();
    } else {
      alert('Senha incorreta');
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/google';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-negroni">Carregando...</div>;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9] font-negroni">
        <div className="max-w-md w-full bg-white border-2 border-brand-black rounded-2xl p-12 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl font-bold mb-6 text-primary">Acesso Restrito</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              placeholder="Senha do Administrador" 
              className="w-full h-12 px-4 border-2 border-brand-black rounded-lg focus:ring-0 focus:border-primary outline-none"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button className="w-full h-12 bg-primary text-white border-2 border-brand-black rounded-full font-bold hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9] font-negroni">
      <div className="max-w-md w-full bg-white border-2 border-brand-black rounded-2xl p-12 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-center space-y-8">
        <h1 className="text-3xl font-bold text-primary">Configuração</h1>
        
        <div className="p-6 bg-gray-50 border-2 border-brand-black rounded-xl space-y-2">
          <p className="text-xs font-bold uppercase text-gray-400">Status da Conexão</p>
          {status?.connected ? (
            <div className="space-y-1">
              <p className="text-green-600 font-bold flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">check_circle</span>
                Conectado
              </p>
              <p className="text-sm text-gray-600">{status.email}</p>
            </div>
          ) : (
            <p className="text-red-500 font-bold flex items-center justify-center gap-2">
              <span className="material-symbols-outlined">error</span>
              Desconectado
            </p>
          )}
        </div>

        <button 
          onClick={handleConnect}
          className="w-full h-14 bg-secondary text-brand-black border-2 border-brand-black rounded-full font-bold flex items-center justify-center gap-3 hover:-translate-y-1 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          <span className="material-symbols-outlined">sync</span>
          {status?.connected ? 'Reconectar Google Agenda' : 'Conectar Google Agenda Principal'}
        </button>

        <p className="text-[10px] text-gray-400 uppercase font-bold leading-tight">
          Ao conectar, o sistema usará esta conta para gerenciar todos os agendamentos públicos.
        </p>
      </div>
    </div>
  );
};

export default AdminSetup;

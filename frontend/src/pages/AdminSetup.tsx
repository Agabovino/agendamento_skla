import React, { useState, useEffect } from 'react';

const AdminSetup: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState<{ connected: boolean; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockEveningSlots, setBlockEveningSlots] = useState(false);
  const [eveningStart, setEveningStart] = useState("17:30");
  const [eveningEnd, setEveningEnd] = useState("22:00");
  const [showCustomTimes, setShowCustomTimes] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setBlockEveningSlots(data.blockEveningSlots);
        setEveningStart(data.eveningStartCustom || "17:30");
        setEveningEnd(data.eveningEndCustom || "22:00");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/admin/status');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        setIsLoggedIn(true);
        fetchSettings();
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

  const saveSettings = async (block: boolean, start: string, end: string) => {
    try {
      await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          blockEveningSlots: block,
          eveningStartCustom: start,
          eveningEndCustom: end
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleEvening = () => {
    const newValue = !blockEveningSlots;
    setBlockEveningSlots(newValue);
    saveSettings(newValue, eveningStart, eveningEnd);
  };

  const handleTimeChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setEveningStart(value);
      saveSettings(blockEveningSlots, value, eveningEnd);
    } else {
      setEveningEnd(value);
      saveSettings(blockEveningSlots, eveningStart, value);
    }
  };

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

        <div className="p-6 bg-gray-50 border-2 border-brand-black rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-xs font-bold uppercase text-gray-400">Horários Especiais</p>
              <div className="flex items-center gap-2">
                <p className="font-bold text-brand-black">Noite ({eveningStart} - {eveningEnd})</p>
                <button 
                  onClick={() => setShowCustomTimes(!showCustomTimes)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors"
                  title="Personalizar intervalo"
                >
                  <span className="material-symbols-outlined text-sm">settings_suggest</span>
                </button>
              </div>
            </div>
            <button 
              onClick={handleToggleEvening}
              className={`w-14 h-8 rounded-full border-2 border-brand-black relative transition-colors ${blockEveningSlots ? 'bg-red-500' : 'bg-green-500'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white border-2 border-brand-black rounded-full transition-all ${blockEveningSlots ? 'left-8' : 'left-1'}`} />
            </button>
          </div>

          {showCustomTimes && (
            <div className="grid grid-cols-2 gap-4 pt-2 animate-in fade-in slide-in-from-top-1">
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold uppercase text-gray-400">Início</label>
                <input 
                  type="time" 
                  value={eveningStart}
                  onChange={(e) => handleTimeChange('start', e.target.value)}
                  className="w-full h-10 px-2 border-2 border-brand-black rounded-lg text-sm font-bold outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold uppercase text-gray-400">Fim</label>
                <input 
                  type="time" 
                  value={eveningEnd}
                  onChange={(e) => handleTimeChange('end', e.target.value)}
                  className="w-full h-10 px-2 border-2 border-brand-black rounded-lg text-sm font-bold outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          <p className="text-[10px] text-gray-500 text-left leading-tight">
            {blockEveningSlots 
              ? `Os horários entre ${eveningStart} e ${eveningEnd} estão BLOQUEADOS.` 
              : `Os horários entre ${eveningStart} e ${eveningEnd} estão LIBERADOS.`}
          </p>
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

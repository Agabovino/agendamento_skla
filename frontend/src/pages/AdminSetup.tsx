import React, { useState, useEffect } from 'react';

const AdminSetup: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [status, setStatus] = useState<{ 
    admin: { connected: boolean; email?: string } | null;
    employee: { connected: boolean; email?: string } | null;
    connected: boolean; // Legacy
  } | null>(null);
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

  const handleConnect = (role: 'admin' | 'employee') => {
    window.location.href = `/api/auth/google?role=${role}`;
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
    <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9] font-negroni py-12">
      <div className="max-w-xl w-full bg-white border-2 border-brand-black rounded-2xl p-12 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] text-center space-y-8">
        <h1 className="text-3xl font-bold text-primary">Configuração</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-gray-50 border-2 border-brand-black rounded-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-gray-400">Agenda Principal</p>
              {status?.admin?.connected ? (
                <div className="space-y-1">
                  <p className="text-green-600 font-bold flex items-center justify-center gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-60-240 254-254-56-56-198 198-90-90-56 56 146 146Z"/></svg>
                    Conectado
                  </p>
                  <p className="text-[10px] text-gray-600 truncate">{status.admin.email}</p>
                </div>
              ) : (
                <p className="text-red-500 font-bold flex items-center justify-center gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>
                  Desconectado
                </p>
              )}
            </div>
            <button 
              onClick={() => handleConnect('admin')}
              className="w-full h-10 bg-secondary text-brand-black border-2 border-brand-black rounded-full text-xs font-bold flex items-center justify-center gap-2 hover:-translate-y-1 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
              {status?.admin?.connected ? 'Reconectar' : 'Conectar Principal'}
            </button>
          </div>

          <div className="p-6 bg-gray-50 border-2 border-brand-black rounded-xl space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-gray-400">Agenda Funcionário</p>
              {status?.employee?.connected ? (
                <div className="space-y-1">
                  <p className="text-green-600 font-bold flex items-center justify-center gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-60-240 254-254-56-56-198 198-90-90-56 56 146 146Z"/></svg>
                    Conectado
                  </p>
                  <p className="text-[10px] text-gray-600 truncate">{status.employee.email}</p>
                </div>
              ) : (
                <p className="text-gray-400 font-bold flex items-center justify-center gap-2 text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor"><path d="M480-480q33 0 56.5-23.5T560-560q0-33-23.5-56.5T480-640q-33 0-56.5 23.5T400-560q0 33 23.5 56.5T480-480Zm0 80q-83 0-156-31.5T197-317q-54-54-85.5-127T80-524q0-83 31.5-156T197-807q54-54 127-85.5T480-924q83 0 156 31.5T763-807q54 54 85.5 127T880-524q0 83-31.5 156T763-317q-54 54-127 85.5T480-400Z"/></svg>
                  Opcional
                </p>
              )}
            </div>
            <button 
              onClick={() => handleConnect('employee')}
              className="w-full h-10 bg-brand-white text-brand-black border-2 border-brand-black rounded-full text-xs font-bold flex items-center justify-center gap-2 hover:-translate-y-1 transition-all shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor"><path d="M720-400v-120H600v-80h120v-120h80v120h120v80H800v120h-80Zm-440-40q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM0-160v-64q0-37 19-68.5t53-48.5q58-28 121.5-43.5T320-400q9 0 17.5.5t17.5 1.5q-15 15-25 32.5T312-328q-11-1-21-1.5t-21-.5q-54 0-104 13t-95 40q-14 8-21.5 21T43-224v21h257q5 19 14 36t21 32l-335-5Z"/></svg>
              {status?.employee?.connected ? 'Reconectar' : 'Conectar Funcionário'}
            </button>
          </div>
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
                  <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor"><path d="M480-160q-134 0-227-93t-93-227q0-134 93-227t227-93q69 0 132 28.5T720-690v-110h80v280H520v-80h168q-32-56-87.5-88T480-720q-100 0-170 70t-70 170q0 100 70 170t170 70q77 0 139-44t87-116h84q-28 106-114 173t-196 67Z"/></svg>
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

        <div className="text-[10px] text-gray-400 uppercase font-bold leading-tight space-y-2">
          <p>A agenda principal é usada para os agendamentos públicos.</p>
          <p>A agenda do funcionário é usada para bloquear horários adicionais e receber cópias dos agendamentos.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;

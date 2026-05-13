import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Calendar from './components/Calendar';
import TimeSlots from './components/TimeSlots';
import RegistrationForm from './components/RegistrationForm';
import Login from './pages/Login';
import { useScheduling } from './hooks/useScheduling';

const App: React.FC = () => {
  const [user, setUser] = useState<{ id: number; email: string; name: string } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const {
    selectedDate,
    setSelectedDate,
    availableSlots,
    selectedSlots,
    toggleSlot,
    schedulingPreview,
    isRegistering,
    setIsRegistering,
  } = useScheduling();

  const [isSuccess, setIsSuccess] = useState(false);

  // 1. Verificar se o usuário está logado ao carregar
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user);
        setAuthLoading(false);
      })
      .catch(() => setAuthLoading(false));
  }, []);

  const handleBookingConfirm = () => {
    setIsRegistering(true);
  };

  const handleFormSubmit = async (formData: any) => {
    if (!user) return;

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hostId: user.id, // Agora usa o ID do usuário logado!
          clientEmail: formData.email,
          startTime: schedulingPreview?.start.toISOString(),
          // Outros campos do form...
          clientName: formData.name,
          location: formData.location,
          service: formData.service
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        alert('Erro ao realizar agendamento.');
      }
    } catch (err) {
      alert('Erro de conexão com o servidor.');
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.reload();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F9]">
        <div className="animate-spin material-symbols-outlined text-4xl text-primary">sync</div>
      </div>
    );
  }

  // 2. Se não houver usuário, mostra APENAS a tela de login
  if (!user) {
    return <Login />;
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white border-2 border-brand-black rounded-2xl p-12 text-center space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto border-2 border-brand-black">
            <span className="material-symbols-outlined text-4xl text-brand-black font-fill">check_circle</span>
          </div>
          <h1 className="text-3xl font-bold">Agendamento Confirmado!</h1>
          <p className="text-gray-600">
            Enviamos um convite para o seu e-mail e o evento foi sincronizado com sua Google Agenda.
          </p>
          <div className="pt-8">
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-primary text-white border-2 border-brand-black rounded-full font-bold hover:-translate-y-1 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0"
            >
              Novo Agendamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 font-negroni">
      <div className="w-full max-w-[1100px] flex justify-end mb-4">
        <div className="flex items-center gap-4 bg-white p-2 px-4 border-2 border-brand-black rounded-full shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-xs font-bold uppercase tracking-widest">{user.name || user.email}</span>
          <button 
            onClick={handleLogout}
            className="material-symbols-outlined text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
          >
            logout
          </button>
        </div>
      </div>

      <main className="w-full max-w-[1100px] min-h-[600px] bg-white border-2 border-brand-black rounded-2xl flex flex-col md:flex-row overflow-hidden relative shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        
        <Sidebar 
          duration="1 h"
          description="Reserve seu horário para gravação ou consultoria técnica. Por favor, escolha a data que melhor se adapta à sua agenda."
          preview={schedulingPreview}
          isRegistering={isRegistering}
          onBack={() => setIsRegistering(false)}
        />

        {!isRegistering ? (
          <>
            <Calendar 
              selectedDate={selectedDate}
              onDateChange={(date) => setSelectedDate(date)}
            />
            <TimeSlots 
              slots={availableSlots}
              selectedSlots={selectedSlots}
              onToggleSlot={toggleSlot}
              onConfirm={handleBookingConfirm}
              selectedDate={selectedDate}
            />
          </>
        ) : (
          <RegistrationForm onSubmit={handleFormSubmit} />
        )}

        {/* Branding Ribbon */}
        <div className="absolute top-0 right-0 overflow-hidden w-40 h-40 pointer-events-none hidden md:block">
          <div className="absolute top-8 right-[-40px] bg-secondary text-brand-black text-[10px] py-1 px-12 transform rotate-45 border-b-2 border-brand-black font-bold uppercase tracking-widest shadow-md">
            Desenvolvido por Skla
          </div>
        </div>
      </main>

      <footer className="w-full max-w-[1100px] mt-8 flex flex-col md:flex-row justify-between items-center px-4 md:px-0 text-gray-500 text-xs font-bold uppercase tracking-wider">
        <p>© 2026 Produtora Skla. Powered by the Solid Edge.</p>
        <nav className="flex gap-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary transition-colors">Accessibility</a>
        </nav>
      </footer>
    </div>
  );
};

export default App;

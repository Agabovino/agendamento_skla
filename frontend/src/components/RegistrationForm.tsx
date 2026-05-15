import React, { useState } from 'react';

interface RegistrationFormProps {
  onSubmit: (data: any) => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: 'skla',
    service: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Mock API call
    setTimeout(() => {
      onSubmit(formData);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <section className="flex-1 p-6 md:p-10 bg-white relative overflow-y-auto custom-scrollbar">
      <div className="max-w-xl">
        <h2 className="text-2xl font-bold mb-8">Preencha os Campos</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase" htmlFor="name">Nome *</label>
            <input 
              className="w-full h-12 px-4 border-2 border-brand-black rounded-lg focus:ring-0 focus:border-primary transition-all outline-none"
              id="name"
              required
              type="text"
              placeholder="Seu nome completo"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase" htmlFor="email">E-mail *</label>
            <input 
              className="w-full h-12 px-4 border-2 border-brand-black rounded-lg focus:ring-0 focus:border-primary transition-all outline-none"
              id="email"
              required
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <button type="button" className="px-6 py-2 border-2 border-brand-black rounded-full text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">group_add</span>
              Adicionar convidados
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-xs font-bold uppercase">Local *</label>
            <div className="flex flex-col gap-3">
              {[
                { id: 'skla', label: 'Produtora SKLA', icon: 'location_on', iconColor: 'text-pink-500' },
                { id: 'meet', label: 'Google Meet', icon: 'videocam', iconColor: 'text-blue-500' },
                { id: 'other', label: 'Outro local', icon: 'chat_bubble', iconColor: 'text-green-500' }
              ].map(loc => (
                <label key={loc.id} className="flex items-center gap-3 p-3 border-2 border-brand-black rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input 
                    className="w-5 h-5 text-primary border-2 border-brand-black focus:ring-0" 
                    name="location" 
                    type="radio" 
                    checked={formData.location === loc.id}
                    onChange={() => setFormData({...formData, location: loc.id})}
                  />
                  <span className={`material-symbols-outlined ${loc.iconColor}`}>{loc.icon}</span>
                  <span className="font-bold">{loc.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase" htmlFor="service">Qual serviço você está agendando? *</label>
            <textarea 
              className="w-full p-4 border-2 border-brand-black rounded-lg focus:ring-0 focus:border-primary transition-all outline-none resize-none"
              id="service"
              required
              rows={3}
              placeholder="Descreva brevemente o serviço desejado..."
              value={formData.service}
              onChange={e => setFormData({...formData, service: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <p className="text-[10px] text-gray-500 leading-relaxed uppercase font-bold">
              Ao prosseguir, você confirma que leu e concorda com os 
              <a className="text-primary mx-1 hover:underline" href="#">Termos do agendamento</a> e 
              <a className="text-primary mx-1 hover:underline" href="#">Aviso de Privacidade</a>.
            </p>
          </div>

          <div className="pt-6">
            <button 
              disabled={isLoading}
              className={`w-full md:w-auto px-12 h-14 bg-primary text-white border-2 border-brand-black rounded-full font-bold text-lg hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:translate-x-0 flex items-center justify-center gap-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              type="submit"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin material-symbols-outlined">sync</span>
                  Sincronizando...
                </>
              ) : 'Agendar Evento'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default RegistrationForm;

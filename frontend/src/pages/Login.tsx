import React from 'react';

const Login: React.FC = () => {
  const handleGoogleLogin = () => {
    // Redireciona diretamente para a rota do backend que inicia o OAuth2
    const apiUrl = import.meta.env.VITE_API_URL || '';
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F9F9F9] p-8 font-negroni">
      <div className="max-w-md w-full bg-white border-2 border-brand-black rounded-2xl p-12 text-center space-y-8 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        
        {/* Logo/Identity */}
        <div className="flex flex-col items-center space-y-4">
          <div className="w-20 h-20 rounded-xl bg-white flex items-center justify-center border-2 border-brand-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
             <img 
              alt="Logo" 
              className="w-full h-full object-cover" 
              src="/skla_logo.png"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary">SKLA</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Produtora Skla</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold">Gerencie sua agenda com facilidade</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Conecte sua conta do Google para sincronizar seus agendamentos automaticamente.
          </p>
        </div>

        {/* Google Login Button */}
        <button 
          onClick={handleGoogleLogin}
          className="w-full h-14 bg-white border-2 border-brand-black rounded-full font-bold flex items-center justify-center gap-4 hover:-translate-y-1 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0"
        >
          <img 
            src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" 
            alt="Google" 
            className="w-6 h-6"
          />
          <span className="text-lg">Entrar com o Google</span>
        </button>

        <div className="pt-4">
          <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tighter">
            Ao entrar, você permite que o SKLA gerencie eventos em sua agenda.
          </p>
        </div>
      </div>

      <footer className="mt-8 text-gray-400 text-xs font-bold uppercase tracking-widest">
        © 2026 Produtora Skla
      </footer>
    </div>
  );
};

export default Login;

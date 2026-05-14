import React, { useState } from 'react';

interface CalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateChange }) => {
  const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  
  // State to track which month is currently being viewed
  const [viewDate, setViewDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const [timezone, setTimezone] = useState('America/Sao_Paulo');
  const [showTimezoneMenu, setShowTimezoneMenu] = useState(false);

  const timezones = [
    { id: 'America/Sao_Paulo', label: 'Horário de Brasília' },
    { id: 'UTC', label: 'Horário UTC' },
  ];

  const currentTime = new Date().toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: timezone 
  });

  const days = [];
  // Empty slots for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-12"></div>);
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(currentYear, currentMonth, d);
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today;

    days.push(
      <button
        key={d}
        disabled={isPast}
        onClick={() => onDateChange(date)}
        className={`h-12 w-full flex items-center justify-center rounded-full transition-all border-2 border-transparent ${
          isSelected 
            ? "bg-primary text-white border-brand-black font-bold shadow-sm" 
            : isPast
              ? "text-gray-300 cursor-not-allowed"
              : "hover:bg-secondary/20 text-brand-black font-medium"
        } ${isToday && !isSelected ? "text-primary border-primary/30" : ""}`}
      >
        {d}
      </button>
    );
  }

  return (
    <section className="flex-1 p-8 flex flex-col justify-start">
      <header className="mb-8">
        <h2 className="text-xl font-bold text-brand-black">Escolha uma data e horário</h2>
      </header>

      <div className="flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-8 max-w-sm">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="text-lg font-bold capitalize">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-all"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div className="w-full max-w-sm">
          <div className="grid grid-cols-7 mb-4 text-center">
            {["DOM.", "SEG.", "TER.", "QUA.", "QUI.", "SEX.", "SÁB."].map(day => (
              <div key={day} className="text-[10px] font-bold text-gray-400 pb-4">{day}</div>
            ))}
            {days}
          </div>
        </div>

        <div className="w-full max-w-sm mt-8 border-t pt-6 relative">
          <p className="text-xs font-bold mb-3">Fuso horário</p>
          <div 
            onClick={() => setShowTimezoneMenu(!showTimezoneMenu)}
            className="flex items-center gap-2 text-gray-500 text-sm cursor-pointer hover:text-brand-black transition-colors"
          >
            <span className="material-symbols-outlined text-lg">public</span>
            <span>{timezones.find(tz => tz.id === timezone)?.label} ({currentTime})</span>
            <span className={`material-symbols-outlined text-lg transition-transform ${showTimezoneMenu ? 'rotate-180' : ''}`}>arrow_drop_down</span>
          </div>

          {showTimezoneMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-full bg-white border-2 border-brand-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden z-10">
              {timezones.map((tz) => (
                <button
                  key={tz.id}
                  onClick={() => {
                    setTimezone(tz.id);
                    setShowTimezoneMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-secondary/20 transition-colors ${timezone === tz.id ? 'bg-primary/10 text-primary' : 'text-brand-black'}`}
                >
                  {tz.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Calendar;

import React from 'react';

interface CalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ selectedDate, onDateChange }) => {
  const monthNames = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  
  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = [];
  // Empty slots for previous month
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-12"></div>);
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(currentYear, currentMonth, d);
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const isToday = date.toDateString() === new Date().toDateString();

    days.push(
      <button
        key={d}
        onClick={() => onDateChange(date)}
        className={`h-12 w-full flex items-center justify-center rounded-full transition-all border-2 border-transparent ${
          isSelected 
            ? "bg-primary text-white border-brand-black font-bold shadow-sm" 
            : "hover:bg-secondary/20 text-brand-black font-medium"
        } ${isToday && !isSelected ? "text-primary border-primary/30" : ""}`}
      >
        {d}
      </button>
    );
  }

  return (
    <section className="flex-1 p-8 flex flex-col justify-center">
      <header className="mb-8">
        <h2 className="text-xl font-bold text-brand-black">Escolha uma data e horário</h2>
      </header>

      <div className="flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-8 max-w-sm">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="text-lg font-bold capitalize">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-all">
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

        <div className="w-full max-w-sm mt-8 border-t pt-6">
          <p className="text-xs font-bold mb-3">Fuso horário</p>
          <div className="flex items-center gap-2 text-gray-500 text-sm cursor-pointer hover:text-brand-black transition-colors">
            <span className="material-symbols-outlined text-lg">public</span>
            <span>Horário de Brasília ({new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})</span>
            <span className="material-symbols-outlined text-lg">arrow_drop_down</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Calendar;

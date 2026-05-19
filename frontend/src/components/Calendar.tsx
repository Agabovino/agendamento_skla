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
    
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 90);
    maxDate.setHours(23, 59, 59, 999);

    const isToday = date.toDateString() === today.toDateString();
    const isPast = date < today;
    const isTooFar = date > maxDate;

    days.push(
      <button
        key={d}
        disabled={isPast || isTooFar}
        onClick={() => onDateChange(date)}
        className={`h-11 w-full flex items-center justify-center rounded-full transition-all border-2 border-transparent ${
          isSelected 
            ? "bg-primary text-white border-brand-black font-bold shadow-sm" 
            : (isPast || isTooFar)
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
      <header className="mb-6">
        <h2 className="text-xl font-bold text-brand-black">Escolha uma data e horário</h2>
      </header>

      <div className="flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-6 max-w-sm">
          <button 
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-all flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/>
            </svg>
          </button>
          <span className="text-lg font-bold capitalize">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button 
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full transition-all flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/>
            </svg>
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

      </div>
    </section>
  );
};

export default Calendar;

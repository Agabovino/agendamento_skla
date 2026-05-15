import React from 'react';
import type { Slot } from '../hooks/useScheduling';

interface TimeSlotsProps {
  slots: Slot[];
  selectedSlots: string[];
  onToggleSlot: (id: string) => void;
  onConfirm: () => void;
  selectedDate: Date;
}

const TimeSlots: React.FC<TimeSlotsProps> = ({ slots, selectedSlots, onToggleSlot, onConfirm, selectedDate }) => {
  const dateLabel = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <section className="w-full md:w-80 border-t-2 md:border-t-0 md:border-l-2 border-brand-black p-6 flex flex-col overflow-hidden bg-[#F9F9F9] h-[350px] md:h-auto">
      <header className="mb-4">
        <p className="text-lg font-bold text-brand-black capitalize">{dateLabel}</p>
      </header>

      <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2">
        {slots.map((slot) => {
          const isSelected = selectedSlots.includes(slot.id);
          
          if (!slot.isAvailable) {
            return (
              <button
                key={slot.id}
                disabled
                className="w-full py-4 border-2 border-gray-200 rounded-lg font-bold text-gray-300 cursor-not-allowed text-sm bg-gray-50/50"
              >
                {slot.time}
              </button>
            );
          }

          if (isSelected) {
            return (
              <div key={slot.id} className="flex gap-2">
                <button 
                  onClick={() => onToggleSlot(slot.id)}
                  className="flex-1 py-4 bg-gray-600 text-white border-2 border-brand-black rounded-lg font-bold text-sm"
                >
                  {slot.time}
                </button>
                <button 
                  onClick={onConfirm}
                  className="flex-1 py-4 bg-primary text-white border-2 border-brand-black rounded-lg font-bold text-sm hover:-translate-y-0.5 hover:-translate-x-0.5 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:translate-x-0"
                >
                  Avançar
                </button>
              </div>
            );
          }

          return (
            <button
              key={slot.id}
              onClick={() => onToggleSlot(slot.id)}
              className="w-full py-4 border-2 border-brand-black rounded-lg font-bold text-primary hover:border-primary hover:bg-secondary/10 transition-all text-sm"
            >
              {slot.time}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default TimeSlots;

import { useState, useMemo } from 'react';

export interface Slot {
  id: string;
  time: string; // HH:mm format
  start: Date;
  end: Date;
  isAvailable: boolean;
}

export const useScheduling = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);

  // Generate slots for the selected date
  // Fixed 1-hour slots, but they can start every 30 mins to allow flexibility
  // Prompt says: "Blocos fixos de 1 hora"
  const availableSlots = useMemo(() => {
    const slots: Slot[] = [];
    const startHour = 9;
    const endHour = 18;
    const now = new Date();

    for (let hour = startHour; hour < endHour; hour++) {
      // Slot at :00
      const s1 = new Date(selectedDate);
      s1.setHours(hour, 0, 0, 0);
      slots.push({
        id: s1.toISOString(),
        time: `${hour.toString().padStart(2, '0')}:00`,
        start: s1,
        end: new Date(s1.getTime() + 60 * 60 * 1000),
        isAvailable: s1 > now, // Only available if in the future
      });

      // Slot at :30
      const s2 = new Date(selectedDate);
      s2.setHours(hour, 30, 0, 0);
      slots.push({
        id: s2.toISOString(),
        time: `${hour.toString().padStart(2, '0')}:30`,
        start: s2,
        end: new Date(s2.getTime() + 60 * 60 * 1000),
        isAvailable: s2 > now, // Only available if in the future
      });
    }
    return slots;
  }, [selectedDate]);

  const toggleSlot = (slotId: string) => {
    setSelectedSlots((prev) => {
      if (prev.includes(slotId)) {
        return prev.filter((id) => id !== slotId);
      } else {
        const newSelection = [...prev, slotId].sort();
        
        // Validate contiguity
        if (newSelection.length > 1) {
          const sorted = newSelection.map(id => new Date(id).getTime());
          for (let i = 0; i < sorted.length - 1; i++) {
            const diff = sorted[i+1] - sorted[i];
            // 60 minutes = 1 hour in ms
            if (diff > 60 * 60 * 1000) {
              // Not contiguous, allow only single or previous valid contiguous block?
              // For better UX, let's just allow it but the preview handles it as one block.
              // Or better: clear previous and select new if not contiguous.
              return [slotId];
            }
          }
        }
        return newSelection;
      }
    });
  };

  const clearSelection = () => {
    setSelectedSlots([]);
  };

  const schedulingPreview = useMemo(() => {
    if (selectedSlots.length === 0) return null;

    const sortedSlots = [...selectedSlots].sort().map(id => {
      const slot = availableSlots.find(s => s.id === id);
      return slot!;
    });

    const firstSlot = sortedSlots[0];
    const lastSlot = sortedSlots[sortedSlots.length - 1];
    
    // Check for contiguity to calculate total duration correctly
    // If contiguous, end is the end of the last slot.
    // Otherwise, it's a bit ambiguous how to display multiple separate slots.
    // Usually, these systems allow one contiguous block.
    // Let's assume contiguous for the preview.
    
    const start = firstSlot.start;
    const end = lastSlot.end;

    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);

    return {
      start,
      end,
      durationMinutes,
      bufferBeforeMinutes: 30,
      bufferAfterMinutes: 30,
      formattedTime: `${firstSlot.time} - ${lastSlot.end.getHours().toString().padStart(2, '0')}:${lastSlot.end.getMinutes().toString().padStart(2, '0')}`,
      dateLabel: selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    };
  }, [selectedSlots, availableSlots, selectedDate]);

  return {
    selectedDate,
    setSelectedDate,
    availableSlots,
    selectedSlots,
    toggleSlot,
    clearSelection,
    schedulingPreview,
    isRegistering,
    setIsRegistering,
  };
};

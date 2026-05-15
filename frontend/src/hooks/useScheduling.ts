import { useState, useMemo, useEffect } from 'react';

export interface Slot {
  id: string;
  time: string; // HH:mm format
  start: Date;
  end: Date;
  isAvailable: boolean;
}

interface BusyInterval {
  start: string;
  end: string;
}

export const useScheduling = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [busyIntervals, setBusyIntervals] = useState<BusyInterval[]>([]);
  const [blockEveningSlots, setBlockEveningSlots] = useState(false);
  const [eveningSettings, setEveningSettings] = useState({ start: "17:30", end: "22:00" });

  // Fetch busy intervals from Google Calendar via Backend
  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        // Adiciona um timestamp para evitar cache do navegador/proxy
        const response = await fetch(`/api/availability?date=${selectedDate.toISOString()}&t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          setBusyIntervals(data.busy || []);
          setBlockEveningSlots(data.settings?.blockEveningSlots || false);
          setEveningSettings({
            start: data.settings?.eveningStartCustom || "17:30",
            end: data.settings?.eveningEndCustom || "22:00"
          });
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error);
      }
    };

    fetchAvailability();
    setSelectedSlots([]); // Limpa seleção ao mudar de data
  }, [selectedDate]);

  // Generate slots for the selected date
  const availableSlots = useMemo(() => {
    const slots: Slot[] = [];
    const startHour = 9;
    const endHour = 22;
    const now = new Date();
    const bufferMs = 30 * 60 * 1000;

    const [eStartH, eStartM] = eveningSettings.start.split(':').map(Number);
    const [eEndH, eEndM] = eveningSettings.end.split(':').map(Number);

    for (let hour = startHour; hour < endHour; hour++) {
      // Possible start times
      [0, 30].forEach(minutes => {
        const slotStart = new Date(selectedDate);
        slotStart.setHours(hour, minutes, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

        // Basic availability (future only)
        let isAvailable = slotStart > now;

        // Block Evening Slots Rule: Custom Range
        const eveningStart = new Date(selectedDate);
        eveningStart.setHours(eStartH, eStartM, 0, 0);
        
        const eveningEnd = new Date(selectedDate);
        eveningEnd.setHours(eEndH, eEndM, 0, 0);

        if (blockEveningSlots && slotStart >= eveningStart && slotStart < eveningEnd) {
          isAvailable = false;
        }

        // Check against busy intervals and 30min buffer
        if (isAvailable) {
          for (const busy of busyIntervals) {
            const busyStart = new Date(busy.start).getTime();
            const busyEnd = new Date(busy.end).getTime();
            const sStart = slotStart.getTime();
            const sEnd = slotEnd.getTime();

            // The forbidden zone for a new slot is [busyStart - 30m, busyEnd + 30m]
            // If the slot intersects this zone, it's unavailable.
            const forbiddenStart = busyStart - bufferMs;
            const forbiddenEnd = busyEnd + bufferMs;

            const overlapsForbiddenZone = sStart < forbiddenEnd && sEnd > forbiddenStart;
            
            if (overlapsForbiddenZone) {
              isAvailable = false;
              break;
            }
          }
        }

        slots.push({
          id: slotStart.toISOString(),
          time: `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
          start: slotStart,
          end: slotEnd,
          isAvailable,
        });
      });
    }
    return slots;
  }, [selectedDate, busyIntervals, blockEveningSlots]);

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

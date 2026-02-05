// Hook para Countdown de Viagem

import { useState, useEffect } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

interface CountdownData {
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  isUrgent: boolean;
  isPast: boolean;
}

export const useCountdown = (departureDate: Date | string | null): CountdownData => {
  const [countdown, setCountdown] = useState<CountdownData>({
    daysLeft: 0,
    hoursLeft: 0,
    minutesLeft: 0,
    isUrgent: false,
    isPast: false
  });

  useEffect(() => {
    if (!departureDate) return;

    const calculateCountdown = () => {
      const departure = new Date(departureDate);
      const now = new Date();
      
      const daysLeft = differenceInDays(departure, now);
      const hoursLeft = differenceInHours(departure, now) % 24;
      const minutesLeft = differenceInMinutes(departure, now) % 60;
      
      setCountdown({
        daysLeft: Math.max(0, daysLeft),
        hoursLeft: Math.max(0, hoursLeft),
        minutesLeft: Math.max(0, minutesLeft),
        isUrgent: daysLeft >= 0 && daysLeft < 7,
        isPast: daysLeft < 0
      });
    };

    calculateCountdown();
    
    // Atualiza a cada minuto
    const interval = setInterval(calculateCountdown, 60000);
    
    return () => clearInterval(interval);
  }, [departureDate]);

  return countdown;
};

export default useCountdown;

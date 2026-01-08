'use client';

import { useEffect, useState } from 'react';

export function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();

            if (difference > 0) {
                const days = Math.floor(difference / (1000 * 60 * 60 * 24));
                const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((difference / 1000 / 60) % 60);
                const seconds = Math.floor((difference / 1000) % 60);

                if (days > 0) {
                    setTimeLeft(`${days}d ${hours}h left`);
                } else if (hours > 0) {
                    setTimeLeft(`${hours}h ${minutes}m left`);
                } else if (minutes > 0) {
                    setTimeLeft(`${minutes}m ${seconds}s left`);
                } else {
                    setTimeLeft(`${seconds}s left`);
                }
            } else {
                setTimeLeft('Closed');
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000); // Update every second

        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <span>{timeLeft}</span>
    );
}


import { describe, it, expect } from 'vitest';

describe('Booking Date Logic', () => {
    it('parses YYYY-MM-DD as local start of day', () => {
        const inputString = '2026-01-28';
        const parsed = new Date(`${inputString}T00:00:00`);

        expect(parsed.getFullYear()).toBe(2026);
        expect(parsed.getMonth()).toBe(0); // January
        expect(parsed.getDate()).toBe(28);
        expect(parsed.getHours()).toBe(0);
        expect(parsed.getMinutes()).toBe(0);
    });

    it('calculates diffDays correctly for today and tomorrow', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const toDateString = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const startDateStr = toDateString(tomorrow);
        const requestedStart = new Date(`${startDateStr}T00:00:00`);
        requestedStart.setHours(0, 0, 0, 0);

        const diffTime = requestedStart.getTime() - today.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        expect(diffDays).toBe(1);
    });

    it('rejects past dates', () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const toDateString = (d: Date) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const startDateStr = toDateString(yesterday);
        const requestedStart = new Date(`${startDateStr}T00:00:00`);
        requestedStart.setHours(0, 0, 0, 0);

        expect(requestedStart.getTime()).toBeLessThan(today.getTime());
    });
});

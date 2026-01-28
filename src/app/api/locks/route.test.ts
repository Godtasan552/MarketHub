
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/locks/route';
import Lock from '@/models/Lock';
import Booking from '@/models/Booking';
import { NextRequest } from 'next/server';

// Mock Dependencies
vi.mock('@/lib/db/mongoose', () => ({
    default: vi.fn(),
}));

vi.mock('@/models/Lock', () => ({
    default: {
        find: vi.fn(),
    },
}));

vi.mock('@/models/Booking', () => ({
    default: {
        find: vi.fn(),
    },
}));

// Helper for Mongoose Chain Mocking
// Helper for Mongoose Chain Mocking
const createMockQuery = (result: unknown) => ({
    populate: vi.fn().mockReturnThis(),
    sort: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue(result),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    then: (resolve: (arg: any) => void) => resolve(result),
});

describe('GET /api/locks', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should show lock as booked if it has an overlapping booking for the requested date', async () => {
        const mockLockId = 'lock-1';
        const mockLocks = [
            {
                _id: mockLockId,
                status: 'available', // Database status says available
                toObject: function () { return { _id: this._id, status: this.status }; }
            }
        ];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Lock.find as any).mockReturnValue(createMockQuery(mockLocks));

        // Mock a booking that overlaps with "tomorrow"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Booking.find as any).mockReturnValue(createMockQuery([
            { lock: mockLockId }
        ]));

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dateStr = tomorrow.toISOString().split('T')[0];

        const req = new NextRequest(`http://localhost:3000/api/locks?date=${dateStr}`);
        const res = await GET(req);
        const data = await res.json();

        expect(data[0].status).toBe('booked');
    });

    it('should show lock as available for future date even if rented today', async () => {
        const mockLockId = 'lock-1';
        const mockLocks = [
            {
                _id: mockLockId,
                status: 'rented', // Database status says rented (today)
                toObject: function () { return { _id: this._id, status: this.status }; }
            }
        ];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Lock.find as any).mockReturnValue(createMockQuery(mockLocks));

        // No bookings for "next week"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Booking.find as any).mockReturnValue(createMockQuery([]));

        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        const dateStr = nextWeek.toISOString().split('T')[0];

        const req = new NextRequest(`http://localhost:3000/api/locks?date=${dateStr}`);
        const res = await GET(req);
        const data = await res.json();

        // Should be 'available' because we reset temporal status and no bookings found for that date
        expect(data[0].status).toBe('available');
    });
});

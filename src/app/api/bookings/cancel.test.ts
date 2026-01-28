
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from '@/app/api/bookings/[id]/route';
import Booking from '@/models/Booking';
import Lock from '@/models/Lock';
import { NextRequest } from 'next/server';

// Mock Dependencies
vi.mock('@/lib/auth/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/lib/db/mongoose', () => ({
    default: vi.fn(),
}));

// Mock Mongoose Transaction
const mockSession = {
    startTransaction: vi.fn(),
    commitTransaction: vi.fn(),
    abortTransaction: vi.fn(),
    endSession: vi.fn(),
    inTransaction: vi.fn().mockReturnValue(true)
};

vi.mock('mongoose', () => ({
    default: {
        startSession: vi.fn().mockResolvedValue(mockSession),
    }
}));

vi.mock('@/models/Booking', () => ({
    default: {
        findOne: vi.fn(),
    },
}));

vi.mock('@/models/Lock', () => ({
    default: {
        findByIdAndUpdate: vi.fn(),
    },
}));

vi.mock('@/models/AuditLog', () => ({
    default: {
        create: vi.fn(),
    },
}));

describe('DELETE /api/bookings/[id]', () => {
    const mockUserId = 'user-1';
    const mockBookingId = 'booking-1';

    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth } = await import('@/lib/auth/auth');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (auth as any).mockResolvedValue({ user: { id: mockUserId } });
    });

    it('should allow cancellation of an ACTIVE booking if it starts in the future', async () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);

        const mockBooking = {
            _id: mockBookingId,
            user: mockUserId,
            status: 'active',
            startDate: futureDate,
            lock: 'lock-1',
            save: vi.fn().mockResolvedValue(true)
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Booking.findOne as any).mockResolvedValue(mockBooking);

        const req = new NextRequest(`http://localhost:3000/api/bookings/${mockBookingId}`, {
            method: 'DELETE'
        });
        const res = await DELETE(req, { params: Promise.resolve({ id: mockBookingId }) });

        expect(res.status).toBe(200);
        expect(mockBooking.status).toBe('cancelled');
    });

    it('should reject cancellation of an ACTIVE booking if it has already started', async () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);

        const mockBooking = {
            _id: mockBookingId,
            user: mockUserId,
            status: 'active',
            startDate: pastDate,
            lock: 'lock-1'
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Booking.findOne as any).mockResolvedValue(mockBooking);

        const req = new NextRequest(`http://localhost:3000/api/bookings/${mockBookingId}`, {
            method: 'DELETE'
        });
        const res = await DELETE(req, { params: Promise.resolve({ id: mockBookingId }) });
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toMatch(/ไม่สามารถยกเลิกการเช่าที่เริ่มขึ้นแล้ว/);
    });
});

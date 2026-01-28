
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '@/app/api/bookings/route';
import Booking from '@/models/Booking';
import Lock from '@/models/Lock';
import { NextRequest, NextResponse } from 'next/server';

// Mock Dependencies
vi.mock('@/lib/auth/auth', () => ({
    auth: vi.fn(),
}));

vi.mock('@/lib/db/mongoose', () => ({
    default: vi.fn(),
}));

// Mock Models
// Helper for Mongoose Chain Mocking
// Helper for Mongoose Chain Mocking
const createMockQuery = (result: unknown) => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    then: (resolve: (arg: any) => void) => resolve(result), // Acts as promise for direct await
    sort: vi.fn().mockResolvedValue(result), // Acts as chain for .sort()
    select: vi.fn().mockResolvedValue(result) // Acts as chain for .select()
});

vi.mock('@/models/Booking', () => ({
    default: {
        findOne: vi.fn(),
        find: vi.fn(),
        create: vi.fn(),
        startSession: vi.fn(),
    },
}));

vi.mock('@/models/Lock', () => ({
    default: {
        findById: vi.fn(),
        findOneAndUpdate: vi.fn(),
    },
}));

vi.mock('@/lib/notification/service', () => ({
    NotificationService: {
        send: vi.fn(),
    },
}));

// Mock Mongoose Transaction
const mockSession = {
    startTransaction: vi.fn(),
    commitTransaction: vi.fn(),
    abortTransaction: vi.fn(),
    endSession: vi.fn(),
    inTransaction: vi.fn().mockReturnValue(true)
};

vi.mock('mongoose', () => {
    return {
        default: {
            startSession: vi.fn(),
        }
    };
});

describe('POST /api/bookings', () => {
    const mockLockId = 'lock-123';
    const mockUserId = 'user-001';

    // Default Helper to create request
    const createRequest = (body: unknown) => {
        return new NextRequest('http://localhost:3000/api/bookings', {
            method: 'POST',
            body: JSON.stringify(body),
        });
    };

    beforeEach(async () => {
        vi.clearAllMocks();
        const { auth } = await import('@/lib/auth/auth');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (auth as any).mockResolvedValue({ user: { id: mockUserId } });

        const mongoose = (await import('mongoose')).default;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (mongoose.startSession as any).mockResolvedValue(mockSession);
    });

    it('should allow advance booking if date is within limit (14 days)', async () => {
        // Setup Date: Tommorow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startDate = tomorrow.toISOString();

        // Mock Lock
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Lock.findById as any).mockResolvedValue({
            _id: mockLockId,
            isActive: true,
            status: 'available',
            pricing: { daily: 100 }
        });

        // Mock No Overlap
        // Mock No Overlap (use helper to support chain calls if any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Booking.findOne as any).mockReturnValue(createMockQuery(null));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Booking.create as any).mockResolvedValue([{ _id: 'booking-new' }]);

        const req = createRequest({
            lockId: mockLockId,
            startDate,
            rentalType: 'daily'
        });

        const res = await POST(req);
        // Note: Actual implementation returns NextResponse, need to parse if possible or check call args
        // Since we mocked responses, we check flow.

        expect(res.status).not.toBe(400);
        expect(Booking.create).toHaveBeenCalled(); // Should proceed to create
    });

    it('should reject booking if more than 14 days in advance', async () => {
        // Setup Date: 15 days later
        const farFuture = new Date();
        farFuture.setDate(farFuture.getDate() + 15);
        const startDate = farFuture.toISOString();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Lock.findById as any).mockResolvedValue({
            _id: mockLockId,
            isActive: true,
            pricing: { daily: 100 }
        });

        const req = createRequest({ lockId: mockLockId, startDate, rentalType: 'daily' });
        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toMatch(/สามารถจองล่วงหน้าได้ไม่เกิน/);
    });

    it('should reject rapid renewal (Fairness Policy) if consecutive stay > 28 days', async () => {
        // Setup Date: Tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const startDate = tomorrow.toISOString();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Lock.findById as any).mockResolvedValue({
            _id: mockLockId,
            isActive: true,
            pricing: { daily: 100 }
        });

        // Mock Last Booking (ending just before this new one)
        const lastEndDate = new Date(tomorrow);
        lastEndDate.setDate(lastEndDate.getDate() - 1); // Ended yesterday

        const mockLastBooking = {
            startDate: new Date(lastEndDate.getTime() - (28 * 24 * 60 * 60 * 1000)), // Started 28 days ago
            endDate: lastEndDate,
            status: 'active'
        };

        // Mock Chainable Mongoose Query: findOne -> sort -> exec/then
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (Booking.findOne as any)
            .mockReturnValueOnce(createMockQuery(null)) // Overlap check (no sort)
            .mockReturnValueOnce(createMockQuery(mockLastBooking)) // Fairness check (lastBooking)
            .mockReturnValueOnce(createMockQuery(null)); // Fairness check (prev loop basic)

        const req = createRequest({ lockId: mockLockId, startDate, rentalType: 'daily' });
        const res = await POST(req);
        const json = await res.json();

        expect(res.status).toBe(400);
        expect(json.error).toMatch(/คุณเช่าล็อกนี้ต่อเนื่องครบ 28 วันแล้ว/);
    });
});

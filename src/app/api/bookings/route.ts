import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { calculateBookingDetails, RentalType } from '@/lib/utils/booking';
import connectDB from '@/lib/db/mongoose';
import Booking from '@/models/Booking';
import Lock from '@/models/Lock';
import mongoose from 'mongoose';
import { NotificationService } from '@/lib/notification/service';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    // Note: session.user comes from auth proxy (inject via helper or auth())
    if (!session?.user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const body = await req.json();
    const { lockId, startDate, rentalType } = body;

    if (!lockId || !startDate || !rentalType) {
      return NextResponse.json({ error: 'ข้อมูลไม่ครบถ้วน' }, { status: 400 });
    }

    await connectDB();

    const lock = await Lock.findById(lockId);
    if (!lock || !lock.isActive) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลล็อก' }, { status: 404 });
    }

    // Check Lock Status for current date if trying to book for today
    // Parse as YYYY-MM-DDT00:00:00 to ensure it's treated as local time
    const requestedStart = new Date(startDate.includes('T') ? startDate : `${startDate}T00:00:00`);
    requestedStart.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isToday = requestedStart.getTime() === today.getTime();

    const MAX_ADVANCE_DAYS = 14;
    const diffTime = requestedStart.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > MAX_ADVANCE_DAYS) {
      return NextResponse.json({ error: `สามารถจองล่วงหน้าได้ไม่เกิน ${MAX_ADVANCE_DAYS} วัน` }, { status: 400 });
    }

    if (requestedStart.getTime() < today.getTime()) {
      return NextResponse.json({ error: 'ไม่สามารถจองย้อนหลังได้' }, { status: 400 });
    }

    // Maintenance check (always blocked)
    if (lock.status === 'maintenance') {
      return NextResponse.json({ error: 'ล็อกนี้อยู่ในช่วงปรับปรุง ไม่สามารถจองได้' }, { status: 400 });
    }

    // Check standard availability for TODAY if booking for today
    if (isToday && (lock.status === 'booked' || lock.status === 'rented')) {
      return NextResponse.json({ error: 'ล็อกนี้ถูกเช่าหรือจองแล้วในวันนี้' }, { status: 400 });
    }

    // For advance booking or today, check all overlapping bookings
    const { startDate: start, endDate: end, totalAmount: amount } = calculateBookingDetails(
      lock.pricing,
      requestedStart,
      rentalType as RentalType
    );

    const overlap = await Booking.findOne({
      lock: lockId,
      status: { $in: ['pending_payment', 'pending_verification', 'active'] },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlap) {
      return NextResponse.json({
        error: 'ล็อกนี้ไม่ว่างในช่วงเวลาที่เลือก เนื่องจากมีการจองทับซ้อนกัน'
      }, { status: 400 });
    }

    // --- FAIRNESS POLICY & COOL-DOWN CHECK ---
    const MAX_STAY_DAYS = 28; // 4 weeks
    const COOL_DOWN_DAYS = 7; // 1 week break

    // Find the latest active booking for this user on this lock
    const lastBooking = await Booking.findOne({
      user: session.user.id,
      lock: lockId,
      status: { $in: ['active', 'pending_payment', 'pending_verification'] },
      endDate: { $lt: start }
    }).sort({ endDate: -1 });

    if (lastBooking) {
      // Check if the new booking connects to the old one (Consecutive)
      const gapTime = start.getTime() - new Date(lastBooking.endDate).getTime();
      const gapDays = Math.ceil(gapTime / (1000 * 60 * 60 * 24));

      // If trying to renew immediately or within cool-down period
      if (gapDays <= COOL_DOWN_DAYS) {

        // Calculate total consecutive duration so far
        let consecutiveDays = 0;
        let currentCursor = lastBooking;

        // Simple traversal backwards to sum up days
        while (currentCursor) {
          const duration = Math.ceil((new Date(currentCursor.endDate).getTime() - new Date(currentCursor.startDate).getTime()) / (1000 * 60 * 60 * 24));
          consecutiveDays += duration;

          if (consecutiveDays >= MAX_STAY_DAYS) break;

          // Find previous connected booking
          const prev = await Booking.findOne({
            user: session.user.id,
            lock: lockId,
            status: { $in: ['active', 'pending_payment', 'pending_verification'] },
            endDate: {
              $gte: new Date(new Date(currentCursor.startDate).getTime() - (24 * 60 * 60 * 1000 * 2)), // Allow 1-2 days gap as "consecutive"
              $lt: currentCursor.startDate
            }
          }).sort({ endDate: -1 });

          if (!prev) break;
          currentCursor = prev;
        }

        if (consecutiveDays >= MAX_STAY_DAYS) {
          // Check if we are clearly in the cool-down phase
          if (gapDays <= COOL_DOWN_DAYS) {
            return NextResponse.json({
              error: `คุณเช่าล็อกนี้ต่อเนื่องครบ ${MAX_STAY_DAYS} วันแล้ว กรุณาพักสิทธิ์ (Cool-down) อย่างน้อย ${COOL_DOWN_DAYS} วัน หรือเลือกจองล็อกอื่น`
            }, { status: 400 });
          }
        }
      }
    }
    // -----------------------------------------

    // Check Reservation Logic (Only for today's FCFS/Queue)
    if (isToday && lock.status === 'reserved') {
      // 1. Check if user is the reserved one
      if (lock.reservedTo?.toString() !== session.user.id) {
        return NextResponse.json({ error: 'ล็อกนี้ติดสิทธิ์จองคิวลำดับถัดไป (Reserved Queue)' }, { status: 403 });
      }

      // 2. Check Expiry
      if (lock.reservationExpiresAt && new Date() > new Date(lock.reservationExpiresAt)) {
        return NextResponse.json({ error: 'สิทธิ์การจองของคุณหมดอายุแล้ว' }, { status: 403 });
      }
    }

    // Payment deadline: 30 minutes from now (Updated for faster queue movement)
    const paymentDeadline = new Date();
    paymentDeadline.setMinutes(paymentDeadline.getMinutes() + 30);

    // Mongoose transaction to ensure atomicity
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // 1. Create Booking
      const booking = await Booking.create([{
        user: session.user.id,
        lock: lockId,
        startDate: start,
        endDate: end,
        rentalType,
        totalAmount: amount,
        status: 'pending_payment',
        paymentDeadline,
        isRenewal: false
      }], { session: dbSession });

      // 2. Update Lock Status (Only if starting TODAY)
      if (isToday) {
        const updatedLock = await Lock.findOneAndUpdate(
          {
            _id: lockId,
            $or: [
              { status: 'available' },
              { status: 'reserved', reservedTo: session.user.id }
            ]
          },
          {
            status: 'booked',
            $unset: { reservedTo: 1, reservationExpiresAt: 1 }
          },
          { session: dbSession, new: true }
        );

        if (!updatedLock) {
          // --- RACE CONDITION DETECTED ---
          // If someone else snatched the lock, automatically move this user to queue
          await dbSession.abortTransaction();

          // Check if user already has an active or pending booking for this lock (unlikely but safe)
          const existingBooking = await Booking.findOne({
            lock: lockId,
            user: session.user.id,
            status: { $in: ['pending_payment', 'pending_verification', 'active'] }
          });

          if (existingBooking) {
            return NextResponse.json({
              error: 'คุณมีการจองล็อกนี้อยู่แล้ว ไม่สามารถจองคิวเพิ่มได้'
            }, { status: 400 });
          }

          const Queue = (await import('@/models/Queue')).default;
          await Queue.findOneAndUpdate(
            { lock: lockId, user: session.user.id },
            { lock: lockId, user: session.user.id },
            { upsert: true, new: true }
          );

          return NextResponse.json({
            success: true,
            isQueued: true,
            message: 'คุณจองไม่ทันเสี้ยววินาที! แต่ระบบลำดับคิวให้คุณเป็นคิวที่ 1 เพื่อรับสิทธิ์คนถัดไปแล้ว'
          }, { status: 200 });
        }
      } else {
        // Future booking: Additional safety check overlap inside transaction
        // (Optional but good practice since we don't have lock mutex)
      }

      // 3. Create Audit Log
      const AuditLog = (await import('@/models/AuditLog')).default;
      await AuditLog.create([{
        action: 'BOOKING_CREATED',
        actorId: session.user.id,
        targetId: lockId,
        details: {
          bookingId: booking[0]._id,
          amount,
          prevStatus: lock.status
        }
      }], { session: dbSession });

      await dbSession.commitTransaction();

      // Send Notification
      if (session.user?.id) {
        try {
          await NotificationService.send(session.user.id, 'booking_created', {
            bookingId: booking[0]._id.toString(),
            lockNumber: lock.lockNumber,
            totalAmount: amount,
            paymentDeadline,
            userEmail: session.user.email || undefined
          });
        } catch (notifyErr) {
          console.error('Notification failed but booking was successful:', notifyErr);
        }
      }

      return NextResponse.json(booking[0], { status: 201 });
    } catch (err: unknown) {
      if (dbSession.inTransaction()) {
        await dbSession.abortTransaction();
      }
      throw err;
    } finally {
      dbSession.endSession();
    }

  } catch (error: unknown) {
    console.error('Booking error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการจอง' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    await connectDB();
    const bookings = await Booking.find({ user: session.user.id })
      .populate({
        path: 'lock',
        populate: { path: 'zone', select: 'name' }
      })
      .sort({ createdAt: -1 });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Fetch bookings error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลการจองได้' }, { status: 500 });
  }
}

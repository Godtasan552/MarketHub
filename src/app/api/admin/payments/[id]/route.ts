import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { hasPermission } from '@/lib/auth/permissions';
import connectDB from '@/lib/db/mongoose';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';
import Lock from '@/models/Lock';
import mongoose from 'mongoose';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !hasPermission(session?.user?.role, 'manage_bookings')) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    const { status, rejectionReason } = await req.json();
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'สถานะไม่ถูกต้อง' }, { status: 400 });
    }

    await connectDB();
    
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      const payment = await Payment.findById(id).session(dbSession);
      if (!payment) throw new Error('ไม่พบข้อมูลการชำระเงิน');

      payment.status = status;
      payment.verifiedBy = session.user!.id;
      payment.verifiedAt = new Date();
      if (rejectionReason) payment.rejectionReason = rejectionReason;
      await payment.save({ session: dbSession });

      if (status === 'approved') {
        // Update Booking to active
        await Booking.findByIdAndUpdate(
          payment.booking,
          { status: 'active' },
          { session: dbSession }
        );
        
        // Update Lock to rented
        const booking = await Booking.findById(payment.booking).session(dbSession);
        await Lock.findByIdAndUpdate(
          booking.lock,
          { status: 'rented' },
          { session: dbSession }
        );
      } else {
        // If rejected, booking goes back to pending_payment
        await Booking.findByIdAndUpdate(
          payment.booking,
          { status: 'pending_payment' },
          { session: dbSession }
        );
      }

      await dbSession.commitTransaction();
      dbSession.endSession();

      return NextResponse.json({ message: 'ดำเนินการเรียบร้อยแล้ว' });
    } catch (err: unknown) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw err;
    }

  } catch (error: unknown) {
    console.error('Admin Payment Update Error:', error);
    const message = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการดำเนินการ';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

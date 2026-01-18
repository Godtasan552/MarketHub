import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { hasPermission } from '@/lib/auth/permissions';
import connectDB from '@/lib/db/mongoose';
import Payment from '@/models/Payment';
import Booking from '@/models/Booking';
import Lock from '@/models/Lock';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!hasPermission(session?.user?.role, 'manage_bookings')) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    const payments = await Payment.find({ status })
      .populate('user', 'name email')
      .populate({
        path: 'booking',
        populate: { path: 'lock' }
      })
      .sort({ createdAt: -1 });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Admin Fetch Payments Error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลได้' }, { status: 500 });
  }
}

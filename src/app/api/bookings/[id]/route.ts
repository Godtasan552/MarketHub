import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Booking from '@/models/Booking';
import Lock from '@/models/Lock';
import Zone from '@/models/Zone';
import Payment from '@/models/Payment';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    await connectDB();
    
    // Booking should belong to the user
    const booking = await Booking.findOne({ _id: id, user: session.user.id })
      .populate({
        path: 'lock',
        populate: { path: 'zone' }
      })
      .populate('payment');

    if (!booking) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Fetch booking detail error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลได้' }, { status: 500 });
  }
}

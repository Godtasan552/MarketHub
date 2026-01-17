import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Lock from '@/models/Lock';
import User from '@/models/User';
import { canAccessAdminPanel } from '@/lib/auth/permissions';

export async function GET() {
  try {
    const session = await auth();
    if (!canAccessAdminPanel(session?.user?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const [totalLocks, availableLocks, totalStaff] = await Promise.all([
      Lock.countDocuments(),
      Lock.countDocuments({ status: 'available' }),
      User.countDocuments({ role: { $in: ['staff', 'admin', 'superadmin'] } }),
    ]);

    return NextResponse.json({
      totalLocks,
      availableLocks,
      totalStaff,
      bookedLocks: totalLocks - availableLocks,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}

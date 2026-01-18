import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Lock from '@/models/Lock';
import Zone from '@/models/Zone';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const lock = await Lock.findById(id).populate('zone');
    
    if (!lock || !lock.isActive) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลล็อก' }, { status: 404 });
    }
    
    return NextResponse.json(lock);
  } catch (error) {
    console.error('Error fetching lock detail:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลได้' }, { status: 500 });
  }
}

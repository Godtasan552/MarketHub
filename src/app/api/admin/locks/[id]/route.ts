import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Lock from '@/models/Lock';
import { lockSchema } from '@/lib/validations/lock';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const lock = await Lock.findById(id).populate('zone');
    if (!lock) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลล็อก' }, { status: 404 });
    }
    return NextResponse.json(lock);
  } catch (error) {
    console.error('Error fetching lock:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลล็อกได้' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!hasPermission(session?.user?.role, 'manage_locks')) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    const body = await req.json();
    const validationResult = lockSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'ข้อมูลไม่ถูกต้อง', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    await connectDB();
    
    // Check if lock number is being changed and if it conflicts with an existing lock
    const existingLockWithNumber = await Lock.findOne({ 
      lockNumber: validationResult.data.lockNumber,
      _id: { $ne: id }
    });
    
    if (existingLockWithNumber) {
      return NextResponse.json({ error: 'รหัสล็อกนี้มีอยู่ในระบบแล้ว' }, { status: 409 });
    }

    const updatedLock = await Lock.findByIdAndUpdate(
      id,
      validationResult.data,
      { new: true, runValidators: true }
    );

    if (!updatedLock) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลล็อก' }, { status: 404 });
    }
    
    return NextResponse.json(updatedLock);
  } catch (error) {
    console.error('Error updating lock:', error);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตข้อมูลล็อกได้' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!hasPermission(session?.user?.role, 'manage_locks')) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();
    // In a real system, you might want to check for active bookings before deleting
    const deletedLock = await Lock.findByIdAndDelete(id);

    if (!deletedLock) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลล็อก' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'ลบข้อมูลล็อกเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error deleting lock:', error);
    return NextResponse.json({ error: 'ไม่สามารถลบข้อมูลล็อกได้' }, { status: 500 });
  }
}

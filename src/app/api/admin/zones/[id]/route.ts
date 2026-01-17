import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Zone from '@/models/Zone';
import Lock from '@/models/Lock';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectDB();
    const zone = await Zone.findById(id);
    if (!zone) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลโซน' }, { status: 404 });
    }
    return NextResponse.json(zone);
  } catch (error) {
    console.error('Error fetching zone:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลโซนได้' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!hasPermission(session?.user?.role, 'manage_zones')) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.name) {
      return NextResponse.json({ error: 'ชื่อโซนจำเป็นต้องระบุ' }, { status: 400 });
    }

    await connectDB();
    const updatedZone = await Zone.findByIdAndUpdate(
      id,
      body,
      { new: true, runValidators: true }
    );

    if (!updatedZone) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลโซน' }, { status: 404 });
    }
    
    return NextResponse.json(updatedZone);
  } catch (error) {
    console.error('Error updating zone:', error);
    return NextResponse.json({ error: 'ไม่สามารถอัปเดตข้อมูลโซนได้' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!hasPermission(session?.user?.role, 'manage_zones')) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง' }, { status: 403 });
    }

    await connectDB();
    
    // Check if there are locks in this zone
    const locksCount = await Lock.countDocuments({ zone: id });
    if (locksCount > 0) {
      return NextResponse.json({ 
        error: 'ไม่สามารถลบโซนได้เนื่องจากยังมีล็อกอยู่ในโซนนี' 
      }, { status: 400 });
    }

    const deletedZone = await Zone.findByIdAndDelete(id);

    if (!deletedZone) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลโซน' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'ลบข้อมูลโซนเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error deleting zone:', error);
    return NextResponse.json({ error: 'ไม่สามารถลบข้อมูลโซนได้' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import User from '@/models/User';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET() {
  try {
    const session = await auth();
    if (!hasPermission(session?.user?.role, 'manage_staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();
    const staff = await User.find({ 
      role: { $in: ['staff', 'admin'] } 
    }).select('-password').sort({ createdAt: -1 });

    return NextResponse.json(staff);
  } catch (error) {
    console.error('Error fetching staff:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!hasPermission(session?.user?.role, 'manage_staff')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['staff', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    await connectDB();
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    const newStaff = await User.create({
      email,
      password,
      name,
      role,
      isActive: true,
      emailVerified: true,
    });

    const staffWithoutPassword = newStaff.toObject();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (staffWithoutPassword as any).password;
    
    return NextResponse.json(staffWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating staff:', error);
    return NextResponse.json({ error: 'Failed to create staff' }, { status: 500 });
  }
}

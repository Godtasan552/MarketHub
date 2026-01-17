import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Lock from '@/models/Lock';
import { lockSchema } from '@/lib/validations/lock';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const zone = searchParams.get('zone');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const query: Record<string, unknown> = {};
    if (zone) query.zone = zone;
    if (status) query.status = status;
    if (search) {
      query.lockNumber = { $regex: search, $options: 'i' };
    }

    const locks = await Lock.find(query).populate('zone').sort({ lockNumber: 1 });
    return NextResponse.json(locks);
  } catch (error) {
    console.error('Error fetching locks:', error);
    return NextResponse.json({ error: 'Failed to fetch locks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!hasPermission(session?.user?.role, 'manage_locks')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validationResult = lockSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    await connectDB();
    
    // Check for duplicate lock number
    const existingLock = await Lock.findOne({ lockNumber: validationResult.data.lockNumber });
    if (existingLock) {
      return NextResponse.json({ error: 'Lock number already exists' }, { status: 409 });
    }

    const newLock = await Lock.create(validationResult.data);
    
    return NextResponse.json(newLock, { status: 201 });
  } catch (error) {
    console.error('Error creating lock:', error);
    return NextResponse.json({ error: 'Failed to create lock' }, { status: 500 });
  }
}

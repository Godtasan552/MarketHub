import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Zone from '@/models/Zone';
import { hasPermission } from '@/lib/auth/permissions';

export async function GET() {
  try {
    await connectDB();
    const zones = await Zone.find({ isActive: true }).sort({ name: 1 });
    return NextResponse.json(zones);
  } catch (error) {
    console.error('Error fetching zones:', error);
    return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!hasPermission(session?.user?.role, 'manage_zones')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    if (!body.name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    await connectDB();
    const newZone = await Zone.create(body);
    return NextResponse.json(newZone, { status: 201 });
  } catch (error) {
    console.error('Error creating zone:', error);
    return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 });
  }
}

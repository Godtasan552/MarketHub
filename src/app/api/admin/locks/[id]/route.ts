import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import connectDB from '@/lib/db/mongoose';
import Lock from '@/models/Lock';
import { lockSchema } from '@/lib/validations/lock';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // In Next.js 15+, params is a Promise
) {
  try {
    const { id } = await params;
    await connectDB();
    const lock = await Lock.findById(id).populate('zone');
    
    if (!lock) {
      return NextResponse.json({ error: 'Lock not found' }, { status: 404 });
    }
    
    return NextResponse.json(lock);
  } catch (error) {
    console.error('Error fetching lock:', error);
    return NextResponse.json({ error: 'Failed to fetch lock' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    
    // Partial validation for updates (optional fields allowed)
    // We reuse the schema but might need adjustments if we allow partial updates of nested objects easily
    // For now, let's validate the whole body against schema (assuming full update or consistent partial structure)
    // To allow partial updates strictly, we'd use .partial() on schema, but let's stick to full validation for data integrity on major edits
    const validationResult = lockSchema.partial().safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }

    await connectDB();
    
    // Check uniqueness if lockNumber is being updated
    if (validationResult.data.lockNumber) {
        const existingLock = await Lock.findOne({ 
            lockNumber: validationResult.data.lockNumber, 
            _id: { $ne: id } 
        });
        if (existingLock) {
            return NextResponse.json({ error: 'Lock number already exists' }, { status: 409 });
        }
    }

    const updatedLock = await Lock.findByIdAndUpdate(
      id,
      { $set: validationResult.data },
      { new: true, runValidators: true }
    );

    if (!updatedLock) {
      return NextResponse.json({ error: 'Lock not found' }, { status: 404 });
    }

    return NextResponse.json(updatedLock);
  } catch (error) {
    console.error('Error updating lock:', error);
    return NextResponse.json({ error: 'Failed to update lock' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectDB();
    
    const deletedLock = await Lock.findByIdAndDelete(id);

    if (!deletedLock) {
      return NextResponse.json({ error: 'Lock not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Lock deleted successfully' });
  } catch (error) {
    console.error('Error deleting lock:', error);
    return NextResponse.json({ error: 'Failed to delete lock' }, { status: 500 });
  }
}


import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongoose';
import InterestList from '@/models/InterestList';
import { auth } from '@/lib/auth/auth';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const expanded = searchParams.get('expanded') === 'true';

    await connectDB();
    
    if (expanded) {
      const interests = await InterestList.find({ user: session.user.id })
        .populate({
          path: 'lock',
          populate: { path: 'zone' }
        });
        
      // Filter out any interests where the lock might have been deleted
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const locks = interests.map((i: any) => i.lock).filter((l: any) => l);
      return NextResponse.json(locks);
    } else {
      const interests = await InterestList.find({ user: session.user.id }).select('lock');
      const lockIds = interests
        .map(i => i.lock?.toString())
        .filter((id): id is string => Boolean(id));
      return NextResponse.json(lockIds);
    }
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { lockId } = await req.json();
    if (!lockId) {
      return NextResponse.json({ error: 'Lock ID is required' }, { status: 400 });
    }

    if (typeof lockId !== 'string' || !mongoose.Types.ObjectId.isValid(lockId)) {
      return NextResponse.json({ error: 'Invalid Lock ID' }, { status: 400 });
    }

    await connectDB();

    const deleted = await InterestList.findOneAndDelete({ user: session.user.id, lock: lockId });
    if (deleted) {
      return NextResponse.json({ bookmarked: false });
    }

    try {
      await InterestList.create({
        user: session.user.id,
        lock: lockId,
      });
      return NextResponse.json({ bookmarked: true });
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      if (mongoErr?.code === 11000) {
        return NextResponse.json({ bookmarked: true });
      }
      throw err;
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { Metadata } from 'next';
import LockDetailClient from './LockDetailClient';
import connectDB from '@/lib/db/mongoose';
import Lock from '@/models/Lock';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  await connectDB();
  const lock = await Lock.findById(id).populate('zone');

  if (!lock) {
    return {
      title: 'ไม่พบข้อมูลล็อก',
    };
  }

  return {
    title: `ล็อก ${lock.lockNumber} | ${lock.zone?.name || 'ทั่วไป'}`,
    description: `ข้อมูลและจองพื้นที่ ล็อก ${lock.lockNumber} โซน ${lock.zone?.name || 'ไม่บุร'} ขนาด ${lock.size.width}x${lock.size.length} เมตร`,
  };
}

export default function Page() {
  return <LockDetailClient />;
}

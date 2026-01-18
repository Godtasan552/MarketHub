import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'จองล็อกตลาด | ค้นหาทำเลขายของที่ดีที่สุด',
  description: 'ค้นหาและจองล็อกตลาดออนไลน์ตามโซนที่คุณต้องการ ตรวจสอบสถานะความว่างและราคาได้ทันที',
  keywords: ['จองล็อกตลาด', 'ทำเลขายของ', 'พื้นที่ตลาดนัด'],
};

export default function LocksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'การจองของฉัน | Market Hub',
  description: 'ตรวจสอบสถานะการจอง แจ้งชำระเงิน และดูประวัติการเช่าล็อกตลาดของคุณ',
};

export default function MyBookingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

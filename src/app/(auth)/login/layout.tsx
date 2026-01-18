import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | Market Hub',
  description: 'เข้าสู่ระบบ Market Hub เพื่อเริ่มจองล็อกตลาดและจัดการการเช่าพื้นที่ของคุณ',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

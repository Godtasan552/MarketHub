import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ลงทะเบียน | Market Hub',
  description: 'สมัครสมาชิก Market Hub เพื่อรับสิทธิ์จองล็อกตลาดออนไลน์ได้รวดเร็วและสะดวกยิ่งขึ้น',
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

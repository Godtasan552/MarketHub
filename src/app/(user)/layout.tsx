'use client';



import { Container, Nav, Navbar, NavDropdown, Button, Row, Col } from 'react-bootstrap';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import NotificationBell from '@/components/notification/NotificationBell';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LinkAny = Link as any;

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--background)' }}>
      <Navbar expand="lg" className="glass-panel sticky-top py-3 border-bottom shadow-sm" style={{ zIndex: 1030 }}>
        <Container>
          <Navbar.Brand as={LinkAny} href="/" className="fw-bold d-flex align-items-center" style={{ color: 'var(--primary)', letterSpacing: '-0.5px' }}>
              <i className="bi bi-cart4 me-2 fs-3"></i>
              MARKET HUB
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="user-navbar-nav" className="border-0 shadow-none" />
          <Navbar.Collapse id="user-navbar-nav">
            <Nav className="ms-auto align-items-center gap-2">
              <Nav.Link as={LinkAny} href="/locks" active={pathname === '/locks'} className={`fw-semibold px-3 ${pathname === '/locks' ? '' : 'text-muted'}`}>
                  จองล็อก
              </Nav.Link>
              {session ? (
                <>
                  <Nav.Link as={LinkAny} href="/my-bookings" active={pathname === '/my-bookings'} className={`fw-semibold px-3 ${pathname === '/my-bookings' ? '' : 'text-muted'}`}>
                      การจองและคิวของฉัน
                  </Nav.Link>
                  <Nav.Link as={LinkAny} href="/bookmarks" active={pathname === '/bookmarks'} className={`fw-semibold px-3 ${pathname === '/bookmarks' ? '' : 'text-muted'}`}>
                      รายการที่บันทึก
                  </Nav.Link>
                  <div className="mx-2 d-none d-lg-block">
                    <NotificationBell />
                  </div>
                  <NavDropdown 
                    title={
                      <div className="d-inline-flex align-items-center bg-light px-3 py-1 rounded-pill border">
                        <i className="bi bi-person-circle me-2 text-primary"></i>
                        <span className="fw-semibold text-dark">{session.user?.name || 'บัญชีของฉัน'}</span>
                      </div>
                    } 
                    id="user-nav-dropdown"
                    align="end"
                    className="ms-lg-2"
                  >
                    {session.user?.role !== 'user' && (
                      <NavDropdown.Item as={LinkAny} href="/admin/dashboard" className="py-2">
                          <i className="bi bi-speedometer2 me-2"></i> หน้าจัดการ (Admin)
                      </NavDropdown.Item>
                    )}
                    <NavDropdown.Item as={LinkAny} href="/profile" className="py-2">
                        <i className="bi bi-person me-2"></i> ข้อมูลส่วนตัว
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={() => signOut({ callbackUrl: '/' })} className="text-danger py-2">
                      <i className="bi bi-box-arrow-right me-2"></i> ออกจากระบบ
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <div className="d-flex gap-2 ms-lg-3 mt-3 mt-lg-0">
                  <Button as={LinkAny} href="/login" variant="outline-primary" className="px-4 rounded-pill">
                      เข้าสู่ระบบ
                  </Button>
                  <Button as={LinkAny} href="/register" variant="primary" className="px-4 rounded-pill shadow-sm">
                      สมัครสมาชิก
                  </Button>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <main className="flex-grow-1 py-5">
        {children}
      </main>

      <footer className="bg-white border-top py-5 mt-auto">
        <Container>
          <Row className="g-4 mb-4">
            <Col md={6}>
              <div className="fw-bold fs-4 mb-3" style={{ color: 'var(--primary)' }}>
                <i className="bi bi-cart4 me-2"></i>
                MARKET HUB
              </div>
              <p className="text-muted small pr-md-5" style={{ maxWidth: '400px' }}>
                แพลตฟอร์มจัดการและเช่พื้นที่ตลาดออนไลน์ที่ครบวงจรที่สุด 
                ช่วยให้การจองล็อกเป็นเรื่องง่าย สะดวก และรวดเร็วสำหรับทุกคน
              </p>
            </Col>
            <Col md={3}>
              <h6 className="fw-bold mb-3 text-dark">เมนูหลัก</h6>
              <Nav className="flex-column gap-2">
                <Link href="/locks" className="text-decoration-none text-muted small hover-primary">ค้นหาทำเล</Link>
                <Link href="/my-bookings" className="text-decoration-none text-muted small hover-primary">การจองของฉัน</Link>
                <Link href="/manual" className="text-decoration-none text-muted small hover-primary">คู่มือการใช้งาน</Link>
              </Nav>
            </Col>
            <Col md={3}>
              <h6 className="fw-bold mb-3 text-dark">ช่วยเหลือ</h6>
              <Nav className="flex-column gap-2">
                <Link href="/faq" className="text-decoration-none text-muted small hover-primary">คำถามที่พบบ่อย</Link>
                <Link href="/contact" className="text-decoration-none text-muted small hover-primary">ติดต่อเรา</Link>
                <Link href="/privacy" className="text-decoration-none text-muted small hover-primary">นโยบายความเป็นส่วนตัว</Link>
              </Nav>
            </Col>
          </Row>
          <hr className="my-4 opacity-10" />
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-4">
            <div className="text-muted small">
              © {new Date().getFullYear()} Market Hub. All rights reserved.
            </div>
            <div className="d-flex gap-3 text-muted fs-5">
              <i className="bi bi-facebook cursor-pointer"></i>
              <i className="bi bi-line cursor-pointer"></i>
              <i className="bi bi-instagram cursor-pointer"></i>
            </div>
          </div>
        </Container>
      </footer>

      <style jsx>{`
        .hover-primary:hover {
          color: var(--primary) !important;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .cursor-pointer:hover {
          color: var(--primary);
        }
      `}</style>
    </div>
  );
}

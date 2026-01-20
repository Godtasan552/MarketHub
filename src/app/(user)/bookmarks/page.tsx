
'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Form, InputGroup } from 'react-bootstrap';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LinkAny = Link as any;

interface Lock {
  _id: string;
  lockNumber: string;
  zone: { _id: string; name: string; description?: string };
  size: { width: number; length: number; unit: string };
  pricing: { daily: number; weekly?: number; monthly?: number };
  status: 'available' | 'booked' | 'rented' | 'maintenance';
  images: string[];
}

export default function BookmarksPage() {
  const [locks, setLocks] = useState<Lock[]>([]);
  const [zones, setZones] = useState<{_id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedZone, setSelectedZone] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const router = useRouter();
  const { data: session, status } = useSession();

  const fetchZones = async () => {
    try {
      const res = await fetch('/api/admin/zones');
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      }
    } catch (e) {
      console.error('Failed to fetch zones', e);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/wishlist?expanded=true');
      if (res.ok) {
        const data = await res.json();
        setLocks(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks', error);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (e: React.MouseEvent, lockId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Optimistic update
    setLocks(prev => prev.filter(l => l._id !== lockId));

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockId })
      });
      
      if (!res.ok) {
        // Use a more robust revert strategy if needed, but for now just fetching again is simplest if it fails
        fetchBookmarks(); 
        return;
      }

      const data = await res.json();
      if (typeof data?.bookmarked === 'boolean' && data.bookmarked) {
        fetchBookmarks();
      }
    } catch (error) {
      console.error('Error removing bookmark', error);
      fetchBookmarks();
    }
  };

  useEffect(() => {
    if (session) {
      fetchBookmarks();
      fetchZones();
    }
  }, [session]);

  const displayedLocks = locks.filter(lock => {
    const matchesSearch = lock.lockNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lock.zone?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesZone = !selectedZone || lock.zone?._id === selectedZone;
    const matchesStatus = !statusFilter || lock.status === statusFilter;
    
    return matchesSearch && matchesZone && matchesStatus;
  });

  if (status === 'loading' || loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge bg="success">ว่าง</Badge>;
      case 'booked': return <Badge bg="warning" text="dark">จองแล้ว</Badge>;
      case 'rented': return <Badge bg="danger">เช่าแล้ว</Badge>;
      case 'maintenance': return <Badge bg="secondary">ปิดปรับปรุง</Badge>;
      default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  return (
    <Container className="py-4">
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <i className="bi bi-bookmark-fill text-primary me-2"></i>
            รายการที่บันทึกไว้
          </h2>
          <p className="text-muted mb-0">ล็อกที่คุณสนใจและบันทึกข้อมูลไว้</p>
        </div>
        <LinkAny href="/locks" className="btn btn-outline-primary fw-bold">
            ดูทั้งหมด
        </LinkAny>
      </div>

      {locks.length > 0 && (
        <Card className="border shadow-sm mb-4 border-start-0 border-top-0 border-bottom-0 border-end-0" style={{ borderLeft: '4px solid var(--bs-primary)', boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.08)' }}>
          <Card.Body className="p-3 border rounded shadow-sm">
            <Row className="g-2">
              <Col xs={12} md={5}>
                <InputGroup size="sm" className="border rounded overflow-hidden">
                  <InputGroup.Text className="bg-light border-0 border-end"><i className="bi bi-search text-muted"></i></InputGroup.Text>
                  <Form.Control 
                    placeholder="ค้นหารหัสล็อก หรือชื่อโซน..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-light border-0 shadow-none fw-medium"
                  />
                </InputGroup>
              </Col>
              <Col xs={6} md={3}>
                <Form.Select 
                  size="sm"
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="bg-light border rounded shadow-none fw-medium"
                >
                  <option value="">ทุกโซน</option>
                  {zones.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
                </Form.Select>
              </Col>
              <Col xs={6} md={4}>
                <Form.Select 
                  size="sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-light border rounded shadow-none fw-medium"
                >
                  <option value="">ทุกสถานะ</option>
                  <option value="available">ว่าง</option>
                  <option value="booked">จองแล้ว</option>
                  <option value="rented">เช่าแล้ว</option>
                  <option value="maintenance">ปิดปรับปรุง</option>
                </Form.Select>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}

      {locks.length === 0 ? (
        <div className="text-center py-5 bg-white rounded shadow-sm">
          <i className="bi bi-bookmark display-1 text-secondary mb-3 d-block opacity-25"></i>
          <h3>ยังไม่มีรายการที่บันทึก</h3>
          <p className="text-muted">คุณยังไม่ได้บันทึกล็อกใดๆ</p>
          <LinkAny href="/locks" className="btn btn-primary fw-bold mt-2">
            ไปเลือกดูและจองล็อก
          </LinkAny>
        </div>
      ) : displayedLocks.length === 0 ? (
        <div className="text-center py-5 bg-white rounded shadow-sm border">
          <i className="bi bi-search display-3 text-light mb-3 d-block"></i>
          <h4 className="text-muted">ไม่พบข้อมูลที่ตรงกับตัวกรอง</h4>
          <Button 
            variant="link" 
            onClick={() => { setSearchTerm(''); setSelectedZone(''); setStatusFilter(''); }}
          >
            ล้างตัวกรองทั้งหมด
          </Button>
        </div>
      ) : (
        <Row xs={1} md={2} xl={3} className="g-4">
          {displayedLocks.map((lock) => (
            <Col key={lock._id}>
              <Card className="border-0 shadow-sm h-100 overflow-hidden hover-lift card-hover transition-300 position-relative">
                <button
                  className="btn btn-light rounded-circle shadow-sm position-absolute top-0 start-0 m-3 p-0 d-flex align-items-center justify-content-center"
                  style={{ width: '40px', height: '40px', zIndex: 10, border: 'none' }}
                  onClick={(e) => removeBookmark(e, lock._id)}
                  title="ยกเลิกการบันทึก"
                >
                  <i className="bi bi-bookmark-fill text-primary fs-5"></i>
                </button>
                <LinkAny href={`/locks/${lock._id}`} className="text-decoration-none text-dark">
                  <div className="position-relative">
                    {lock.images?.[0] ? (
                      <Card.Img 
                        variant="top" 
                        src={lock.images[0]} 
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div 
                        className="bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center"
                        style={{ height: '200px' }}
                      >
                        <i className="bi bi-image text-muted fs-1"></i>
                      </div>
                    )}
                    <div className="position-absolute top-0 end-0 m-3">
                      {getStatusBadge(lock.status)}
                    </div>
                    <div className="position-absolute bottom-0 start-0 m-3">
                      <Badge bg="dark" className="bg-opacity-75 backdrop-blur px-3 py-2">
                        <i className="bi bi-geo-alt me-1"></i> {lock.zone?.name}
                      </Badge>
                    </div>
                  </div>
                  <Card.Body className="p-4 pb-0">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="fw-bold h4 mb-0">{lock.lockNumber}</Card.Title>
                      <div className="text-end">
                        <div className="text-muted small fw-normal" style={{ fontSize: '0.75rem', marginBottom: '-2px' }}>เริ่มต้น</div>
                        <div className="text-primary fw-bold fs-5">
                          ฿{lock.pricing.daily.toLocaleString()} <span className="text-muted small fw-normal">/วัน</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-muted small mb-0">
                      <i className="bi bi-aspect-ratio me-1"></i> {lock.size.width} x {lock.size.length} เมตร
                    </p>
                  </Card.Body>
                </LinkAny>
                <Card.Body className="p-4 pt-0">
                  <hr className="my-3 opacity-10" />
                  <div className="d-grid">
                      <Button 
                        as={LinkAny}
                        href={`/locks/${lock._id}`}
                        variant={lock.status === 'available' ? 'primary' : 'outline-secondary'}
                        className="fw-bold py-2 rounded-3"
                        disabled={lock.status !== 'available'}
                      >
                        {lock.status === 'available' ? 'จองทันที' : 'จองแล้ว'}
                      </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
      
      <style jsx global>{`
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 1rem 3rem rgba(0,0,0,0.1) !important;
        }
        .transition-300 {
          transition: all 0.3s ease;
        }
        .backdrop-blur {
          backdrop-filter: blur(5px);
        }
      `}</style>
    </Container>
  );
}

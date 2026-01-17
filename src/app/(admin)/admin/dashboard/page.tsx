'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';

interface Stats {
  totalLocks: number;
  availableLocks: number;
  bookedLocks: number;
  totalStaff: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (!res.ok) throw new Error('Failed to fetch statistics');
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
        setError('ไม่สามารถโหลดข้อมูลสถิติได้');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  return (
    <Container fluid>
      <div className="mb-4">
        <h2 className="fw-bold">Dashboard</h2>
        <p className="text-muted">ยินดีต้อนรับสู่ระบบจัดการตลาด MarketHub</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-primary text-white">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase mb-2 opacity-75">ล็อคทั้งหมด</h6>
                  <h2 className="mb-0 fw-bold">{stats?.totalLocks}</h2>
                </div>
                <i className="bi bi-shop display-5 opacity-50"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm bg-success text-white">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase mb-2 opacity-75">ล็อคว่าง</h6>
                  <h2 className="mb-0 fw-bold">{stats?.availableLocks}</h2>
                </div>
                <i className="bi bi-check-circle display-5 opacity-50"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm bg-warning text-dark">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase mb-2 opacity-75">จองแล้ว</h6>
                  <h2 className="mb-0 fw-bold">{stats?.bookedLocks}</h2>
                </div>
                <i className="bi bi-calendar-check display-5 opacity-50"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card className="border-0 shadow-sm bg-info text-white">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-uppercase mb-2 opacity-75">พนักงาน</h6>
                  <h2 className="mb-0 fw-bold">{stats?.totalStaff}</h2>
                </div>
                <i className="bi bi-people display-5 opacity-50"></i>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={8}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">Recent Activities</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-center py-5 text-muted">เร็วๆ นี้...</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-0 py-3">
              <h5 className="mb-0 fw-bold">System Status</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between mb-2">
                <span>API Status</span>
                <Badge bg="success">Online</Badge>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Database</span>
                <Badge bg="success">Connected</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

// Helper to make the export cleaner
import { Badge } from 'react-bootstrap';

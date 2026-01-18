'use client';

import { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Modal, Form, Spinner, Alert, Row, Col } from 'react-bootstrap';

interface Payment {
  _id: string;
  user: { name: string; email: string };
  booking: { 
    lock: { lockNumber: string };
    startDate: string;
    endDate: string;
  };
  amount: number;
  slipImage: string;
  ocrResult?: {
    amount?: number;
    confidence?: number;
    referenceNumber?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments?status=pending');
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      setError('ไม่สามารถดึงข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!selectedPayment) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/payments/${selectedPayment._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason })
      });

      if (res.ok) {
        setShowModal(false);
        fetchPayments();
      } else {
        const result = await res.json();
        alert(result.error || 'การดำเนินการล้มเหลว');
      }
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Container fluid className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold m-0 text-dark">ตรวจสอบการชำระเงิน</h2>
        <Button variant="outline-primary" onClick={fetchPayments} disabled={loading}>
          <i className="bi bi-arrow-clockwise"></i> รีเฟรช
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : payments.length === 0 ? (
        <div className="text-center py-5 bg-white rounded shadow-sm border">
          <i className="bi bi-check2-circle display-1 text-success opacity-25 mb-3 d-block"></i>
          <h4 className="text-muted">ไม่มีรายการที่รอตรวจสอบในขณะนี้</h4>
        </div>
      ) : (
        <div className="bg-white rounded shadow-sm border overflow-hidden">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th className="py-3 ps-4">วันที่แจ้ง</th>
                <th className="py-3">ผู้เช่า</th>
                <th className="py-3">ล็อก</th>
                <th className="py-3 text-end">จำนวนเงิน</th>
                <th className="py-3 text-center">หลักฐาน</th>
                <th className="py-3 text-end pe-4">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="align-middle">
                  <td className="ps-4">{new Date(p.createdAt).toLocaleString('th-TH')}</td>
                  <td>
                    <div className="fw-bold">{p.user?.name}</div>
                    <div className="small text-muted">{p.user?.email}</div>
                  </td>
                  <td>
                    <Badge bg="primary">ล็อก {p.booking?.lock?.lockNumber}</Badge>
                    <div className="small mt-1 text-muted">
                        {new Date(p.booking.startDate).toLocaleDateString()} - {new Date(p.booking.endDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="text-end fw-bold">฿{p.amount.toLocaleString()}</td>
                  <td className="text-center">
                    <Button 
                      variant="link" 
                      className="p-0 text-decoration-none"
                      onClick={() => { setSelectedPayment(p); setShowModal(true); }}
                    >
                      <i className="bi bi-image fs-4"></i>
                    </Button>
                  </td>
                  <td className="text-end pe-4">
                    <Button 
                      variant="outline-primary" 
                      onClick={() => { setSelectedPayment(p); setShowModal(true); }}
                    >
                      ตรวจสอบ
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Verification Modal */}
      <Modal show={showModal} onHide={() => !actionLoading && setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>ตรวจสอบหลักฐานการชำระเงิน</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          <Row className="g-0">
            <Col md={7} className="bg-dark d-flex align-items-center justify-content-center p-3" style={{ minHeight: '500px' }}>
              {selectedPayment && (
                <img 
                  src={selectedPayment.slipImage} 
                  alt="Payment Slip" 
                  className="img-fluid shadow"
                  style={{ maxHeight: '600px', objectFit: 'contain' }}
                />
              )}
            </Col>
            <Col md={5} className="p-4 bg-light">
              <h5 className="fw-bold mb-4">ข้อมูลการจอง</h5>
              <div className="mb-4">
                <div className="small text-muted mb-1">ผู้แจ้ง:</div>
                <div className="fw-bold">{selectedPayment?.user?.name}</div>
                <div className="small text-muted">({selectedPayment?.user?.email})</div>
              </div>
              <div className="mb-4">
                <div className="small text-muted mb-1">ล็อก:</div>
                <div className="fw-bold h5 mb-0 text-primary">ล็อก {selectedPayment?.booking?.lock?.lockNumber}</div>
              </div>
              <div className="mb-4">
                <div className="small text-muted mb-1">ยอดเงินตามสลิป:</div>
                <div className="fw-bold h4 text-success">฿{selectedPayment?.amount.toLocaleString()}</div>
                {selectedPayment?.ocrResult?.amount && (
                  <div className="alert alert-info py-2 mt-2 border-0 small">
                    <i className="bi bi-robot me-2"></i>
                    OCR ตรวจพบยอดเงิน: <strong>฿{selectedPayment.ocrResult.amount.toLocaleString()}</strong>
                    <div className="text-muted mt-1">ความมั่นใจ: {(selectedPayment.ocrResult.confidence || 0).toFixed(1)}%</div>
                  </div>
                )}
              </div>
              
              <hr />
              
              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold">หมายเหตุ (ถ้ามี)</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={2} 
                  placeholder="เช่น สาเหตุการปฏิเสธ หรือข้อมูลเพิ่มเติม..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </Form.Group>
              
              <div className="d-grid gap-2">
                <Button 
                  variant="success" 
                  size="lg" 
                  onClick={() => handleAction('approved')}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Spinner animation="border" size="sm" /> : 'อนุมัติการชำระเงิน'}
                </Button>
                <Button 
                  variant="outline-danger" 
                  onClick={() => handleAction('rejected')}
                  disabled={actionLoading}
                >
                  ปฏิเสธ (ไม่อนุมัติ)
                </Button>
              </div>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    </Container>
  );
}

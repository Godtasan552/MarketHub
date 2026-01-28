'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Modal, Form, Badge, Card, Alert } from 'react-bootstrap';
import { useForm, FieldValues } from 'react-hook-form';
import { showAlert } from '@/lib/swal';
import * as XLSX from 'xlsx';

interface Staff {
  _id: string;
  email: string;
  name: string;
  role: 'staff' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/staff');
      if (!res.ok) throw new Error('Failed to fetch staff');
      const data = await res.json();
      setStaff(data);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดรายชื่อพนักงานได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const onSubmit = async (data: FieldValues) => {
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Failed to create staff');
      }

      setShowModal(false);
      reset();
      fetchStaff();
    } catch (err: unknown) {
      if (err instanceof Error) {
        showAlert('เกิดข้อผิดพลาด', err.message, 'error');
      } else {
        showAlert('เกิดข้อผิดพลาด', 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง', 'error');
      }
    }
  };

  const handleExportExcel = () => {
    if (staff.length === 0) return;

    const dataToExport = staff.map(s => ({
      'ชื่อ-นามสกุล': s.name,
      'อีเมล': s.email,
      'บทบาท': s.role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'พนักงาน (Staff)',
      'สถานะ': s.isActive ? 'ใช้งานปกติ (Active)' : 'ระงับการใช้งาน (Inactive)',
      'วันที่สร้าง': new Date(s.createdAt).toLocaleString('th-TH'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อพนักงาน');

    const maxWidths = [
      { wch: 20 }, // Name
      { wch: 25 }, // Email
      { wch: 20 }, // Role
      { wch: 20 }, // Status
      { wch: 20 }, // Date
    ];
    worksheet['!cols'] = maxWidths;

    XLSX.writeFile(workbook, `รายชื่อพนักงาน_MarketHub_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Staff Management</h2>
          <p className="text-muted">จัดการรายชื่อผู้เรียกดูและดูแลระบบ</p>
        </div>
        <div className="d-flex gap-2">
          <Button variant="success" onClick={handleExportExcel} disabled={loading || staff.length === 0}>
            <i className="bi bi-file-earmark-excel me-2"></i>ส่งออก Excel
          </Button>
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <i className="bi bi-person-plus-fill me-2"></i>
            เพิ่มพนักงานใหม่
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card className="shadow-sm border-0">
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th className="px-4 py-3">ชื่อ</th>
                <th className="py-3">อีเมล</th>
                <th className="py-3">บทบาท</th>
                <th className="py-3 text-center">สถานะ</th>
                <th className="py-3 px-4 text-end">ดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">กำลังโหลดข้อมูล...</td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">ไม่มีรายชื่อพนักงาน</td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr key={s._id}>
                    <td className="px-4 fw-medium">{s.name}</td>
                    <td className="text-muted small">{s.email}</td>
                    <td>
                      <Badge bg={s.role === 'admin' ? 'danger' : 'info'} className="fw-normal">
                        {s.role.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="text-center">
                      <Badge pill bg={s.isActive ? 'success' : 'secondary'}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 text-end">
                      <Button variant="outline-primary" size="sm" className="me-2">
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button variant="outline-danger" size="sm">
                        <i className="bi bi-trash"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>เพิ่มพนักงาน</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit(onSubmit)}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>ชื่อ-นามสกุล</Form.Label>
              <Form.Control
                type="text"
                placeholder="สมชาย ใจดี"
                {...register('name', { required: 'กรุณาระบุชื่อ' })}
                isInvalid={!!errors.name}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>อีเมล</Form.Label>
              <Form.Control
                type="email"
                placeholder="staff@example.com"
                {...register('email', { required: 'กรุณาระบุอีเมล' })}
                isInvalid={!!errors.email}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>รหัสผ่าน</Form.Label>
              <Form.Control
                type="password"
                placeholder="••••••••"
                {...register('password', { required: 'กรุณาระบุรหัสผ่าน', minLength: 8 })}
                isInvalid={!!errors.password}
              />
            </Form.Group>
            <Form.Group className="mb-0">
              <Form.Label>บทบาท</Form.Label>
              <Form.Select {...register('role', { required: true })}>
                <option value="staff">Staff (จัดการล็อค/การจอง)</option>
                <option value="admin">Admin (จัดการระบบ/Staff)</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="link" onClick={() => setShowModal(false)} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

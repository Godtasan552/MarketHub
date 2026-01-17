'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Button, Modal, Spinner, Alert } from 'react-bootstrap';
import ZoneList, { Zone } from '@/components/admin/ZoneList';
import ZoneForm from '@/components/admin/ZoneForm';

export default function ZoneManagementPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/zones');
      if (res.ok) {
        const data = await res.json();
        setZones(data);
      } else {
        setError('ไม่สามารถโหลดข้อมูลโซนได้');
      }
    } catch (error) {
      console.error('Failed to fetch zones', error);
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleCreate = () => {
    setEditingZone(null);
    setShowModal(true);
  };

  const handleEdit = (zone: Zone) => {
    setEditingZone(zone);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโซนนี้? การลบจะทำได้เมื่อไม่มีล็อกอยู่ในโซนนี้เท่านั้น')) return;

    try {
      const res = await fetch(`/api/admin/zones/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        fetchZones();
      } else {
        alert(data.error || 'ไม่สามารถลบโซนได้');
      }
    } catch (error) {
      console.error('Error deleting zone', error);
      alert('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleSubmit = async (data: { name: string; description?: string }) => {
    try {
      const url = editingZone 
        ? `/api/admin/zones/${editingZone._id}` 
        : '/api/admin/zones';
        
      const method = editingZone ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'การดำเนินการล้มเหลว');
      }

      setShowModal(false);
      fetchZones();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Submit error:', error.message);
        throw error;
      }
      throw new Error('เกิดข้อผิดพลาดที่ไม่คาดคิด');
    }
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold mb-0">จัดการโซนตลาด</h2>
        <Button variant="primary" onClick={handleCreate} className="fw-bold shadow-sm">
          <i className="bi bi-plus-lg me-2"></i>
          เพิ่มโซนใหม่
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">กำลังโหลดข้อมูลโซน...</p>
        </div>
      ) : (
        <ZoneList 
          zones={zones} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="fw-bold">{editingZone ? 'แก้ไขข้อมูลโซน' : 'เพิ่มโซนใหม่'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ZoneForm 
            initialData={editingZone || undefined} 
            onSubmit={handleSubmit} 
            onCancel={() => setShowModal(false)} 
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
}

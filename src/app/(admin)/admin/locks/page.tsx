'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Modal, Spinner, Form, InputGroup } from 'react-bootstrap';
import LockList, { Lock as LockListType } from '@/components/admin/LockList';
import LockForm from '@/components/admin/LockForm';
import { LockFormData } from '@/lib/validations/lock';

interface Lock extends Omit<LockFormData, 'zone'> {
  _id: string;
  zone: string | { _id: string; name: string };
}


export default function LockManagementPage() {
  const [locks, setLocks] = useState<LockListType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLock, setEditingLock] = useState<Lock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLocks = useCallback(async () => {
    setLoading(true);
    try {
      const qs = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : '';
      const res = await fetch(`/api/admin/locks${qs}`);
      if (res.ok) {
        const data = await res.json();
        setLocks(data);
      }
    } catch (error) {
      console.error('Failed to fetch locks', error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchLocks();
  }, [fetchLocks]);

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      fetchLocks();
  };

  const handleCreate = () => {
    setEditingLock(null);
    setShowModal(true);
  };

  const handleEdit = (lock: LockListType) => {
    // Transform lock data to match form structure if needed
    setEditingLock(lock as unknown as Lock);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lock?')) return;

    try {
      const res = await fetch(`/api/admin/locks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchLocks();
      } else {
        alert('Failed to delete lock');
      }
    } catch (error) {
      console.error('Error deleting lock', error);
      alert('Error deleting lock');
    }
  };

  const handleSubmit = async (data: LockFormData) => {
    try {
      const url = editingLock 
        ? `/api/admin/locks/${editingLock._id}` 
        : '/api/admin/locks';
        
      const method = editingLock ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Operation failed');
      }

      setShowModal(false);
      fetchLocks();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Submit error:', error.message);
        throw error; // Propagate to form
      }
      throw new Error('An unexpected error occurred');
    }
  };

  return (
    <Container fluid>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Lock Management</h2>
        <Button variant="primary" onClick={handleCreate}>
          <i className="bi bi-plus-lg me-2"></i>
          Add New Lock
        </Button>
      </div>

      <Row className="mb-4">
        <Col md={4}>
            <Form onSubmit={handleSearch}>
                <InputGroup>
                    <Form.Control
                        placeholder="Search by Lock Number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button variant="outline-secondary" type="submit">
                        <i className="bi bi-search"></i>
                    </Button>
                </InputGroup>
            </Form>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <LockList 
          locks={locks} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} backdrop="static" size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingLock ? 'Edit Lock' : 'Create New Lock'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <LockForm 
            initialData={editingLock || undefined} 
            onSubmit={handleSubmit} 
            onCancel={() => setShowModal(false)} 
          />
        </Modal.Body>
      </Modal>
    </Container>
  );
}

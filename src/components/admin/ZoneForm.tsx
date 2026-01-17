'use client';

import { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';

interface ZoneFormData {
  name: string;
  description?: string;
  images?: string[];
}

interface ZoneFormProps {
  initialData?: ZoneFormData & { _id?: string };
  onSubmit: (data: ZoneFormData) => Promise<void>;
  onCancel: () => void;
}

export default function ZoneForm({ initialData, onSubmit, onCancel }: ZoneFormProps) {
  const [formData, setFormData] = useState<ZoneFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('กรุณาระบุชื่อโซน');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onSubmit(formData);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      {error && <Alert variant="danger" className="text-center">{error}</Alert>}

      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">ชื่อโซน (Zone Name)</Form.Label>
        <Form.Control
          type="text"
          placeholder="เช่น โซน A, โซนอาหาร"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label className="fw-bold">รายละเอียด (Description)</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          placeholder="ระบุรายละเอียดเพิ่มเติมเกี่ยวกับโซนนี้"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </Form.Group>

      <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-4">
        <Button variant="light" onClick={onCancel} disabled={loading} className="px-4">
          ยกเลิก
        </Button>
        <Button variant="primary" type="submit" disabled={loading} className="px-5 fw-bold">
          {loading ? 'กำลังบันทึก...' : (initialData ? 'อัปเดตข้อมูล' : 'เพิ่มโซนใหม่')}
        </Button>
      </div>
    </Form>
  );
}

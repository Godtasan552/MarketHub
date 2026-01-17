'use client';

import { Table, Button, ButtonGroup } from 'react-bootstrap';

export interface Zone {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface ZoneListProps {
  zones: Zone[];
  onEdit: (zone: Zone) => void;
  onDelete: (id: string) => void;
}

export default function ZoneList({ zones, onEdit, onDelete }: ZoneListProps) {
  return (
    <Table responsive hover className="align-middle border shadow-sm">
      <thead className="table-light">
        <tr>
          <th className="py-3">ชื่อโซน</th>
          <th className="py-3">รายละเอียด</th>
          <th className="py-3 text-end">จัดการ</th>
        </tr>
      </thead>
      <tbody>
        {zones.length === 0 ? (
          <tr>
            <td colSpan={3} className="text-center py-5 text-muted">
              ไม่พบข้อมูลโซนในขณะนี้
            </td>
          </tr>
        ) : (
          zones.map((zone) => (
            <tr key={zone._id}>
              <td className="fw-bold">{zone.name}</td>
              <td className="text-muted small">{zone.description || '-'}</td>
              <td className="text-end">
                <ButtonGroup size="sm">
                  <Button variant="outline-primary" onClick={() => onEdit(zone)} title="แก้ไข">
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button variant="outline-danger" onClick={() => onDelete(zone._id)} title="ลบ">
                    <i className="bi bi-trash"></i>
                  </Button>
                </ButtonGroup>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}

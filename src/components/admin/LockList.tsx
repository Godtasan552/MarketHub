'use client';

import { Table, Badge, Button, ButtonGroup } from 'react-bootstrap';

export interface Lock {
  _id: string;
  lockNumber: string;
  zone: { name: string; _id: string } | string; // Populated or ID
  size: { width: number; length: number; unit: 'm' | 'sqm' };
  pricing: { daily: number; weekly?: number; monthly?: number };
  status: string;
  isActive: boolean;
}

interface LockListProps {
  locks: Lock[];
  onEdit: (lock: Lock) => void;
  onDelete: (id: string) => void;
}

export default function LockList({ locks, onEdit, onDelete }: LockListProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge bg="success">Available</Badge>;
      case 'booked': return <Badge bg="warning" text="dark">Booked</Badge>;
      case 'rented': return <Badge bg="danger">Rented</Badge>;
      case 'maintenance': return <Badge bg="secondary">Maintenance</Badge>;
      default: return <Badge bg="light" text="dark">{status}</Badge>;
    }
  };

  const getZoneName = (zone: { name: string } | string | null | undefined) => {
      if (typeof zone === 'object' && zone !== null && 'name' in zone) {
        return (zone as { name: string }).name;
      }
      return 'Unknown Zone';
  };

  return (
    <Table responsive hover className="align-middle">
      <thead className="table-light">
        <tr>
          <th>#</th>
          <th>Zone</th>
          <th>Size</th>
          <th>Price (Daily)</th>
          <th>Status</th>
          <th className="text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
        {locks.length === 0 ? (
          <tr>
            <td colSpan={6} className="text-center py-4 text-muted">
              No locks found.
            </td>
          </tr>
        ) : (
          locks.map((lock) => (
            <tr key={lock._id}>
              <td className="fw-bold">{lock.lockNumber}</td>
              <td>{getZoneName(lock.zone)}</td>
              <td>
                {lock.size.width} x {lock.size.length} {lock.size.unit}
              </td>
              <td>฿{lock.pricing.daily.toLocaleString()}</td>
              <td>{getStatusBadge(lock.status)}</td>
              <td className="text-end">
                <ButtonGroup size="sm">
                  <Button variant="outline-primary" onClick={() => onEdit(lock)}>
                    <i className="bi bi-pencil"></i>
                  </Button>
                  <Button variant="outline-danger" onClick={() => onDelete(lock._id)}>
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

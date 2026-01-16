'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { lockSchema, LockFormData } from '@/lib/validations/lock';

interface Zone {
  _id: string;
  name: string;
}

interface LockFormProps {
  initialData?: Omit<Partial<LockFormData>, 'zone'> & { _id?: string, zone?: string | { _id: string } }; 
  onSubmit: (data: LockFormData) => Promise<void>;
  onCancel: () => void;
}

export default function LockForm({ initialData, onSubmit, onCancel }: LockFormProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<LockFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(lockSchema) as any,
    defaultValues: initialData ? {
      ...initialData,
      zone: typeof initialData.zone === 'object' && initialData.zone !== null ? (initialData.zone as { _id: string })._id : initialData.zone
    } : {
      lockNumber: '',
      zone: '',
      size: { width: 2, length: 2, unit: 'm' },
      pricing: { daily: 100 },
      status: 'available',
      isActive: true,
    },
  });

  useEffect(() => {
    // Fetch zones for dropdown
    const fetchZones = async () => {
      try {
        const res = await fetch('/api/admin/zones');
        if (res.ok) {
          const data = await res.json();
          setZones(data);
        }
      } catch (err) {
        console.error('Failed to fetch zones', err);
        setError('Failed to load zones');
      } finally {
        setLoadingZones(false);
      }
    };
    fetchZones();
  }, []);

  // Pre-fill form if initialData changes (e.g. edit mode)
  useEffect(() => {
    if (initialData) {
        reset({
          ...initialData,
          zone: typeof initialData.zone === 'object' && initialData.zone !== null ? (initialData.zone as { _id: string })._id : initialData.zone
        }); 
    }
  }, [initialData, reset]);

  const onFormSubmit = async (data: LockFormData) => {
    setError(null);
    try {
      await onSubmit(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An error occurred');
      }
    }
  };

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <Form onSubmit={handleSubmit(onFormSubmit as any)}>
      {error && <Alert variant="danger">{error}</Alert>}

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Lock Number</Form.Label>
            <Form.Control
              type="text"
              {...register('lockNumber')}
              isInvalid={!!errors.lockNumber}
              disabled={!!initialData} // Lock number usually shouldn't change
            />
            <Form.Control.Feedback type="invalid">{errors.lockNumber?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Zone</Form.Label>
            <Form.Select
              {...register('zone')}
              isInvalid={!!errors.zone}
              disabled={loadingZones}
            >
              <option value="">Select Zone</option>
              {zones.map((zone) => (
                <option key={zone._id} value={zone._id}>
                  {zone.name}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.zone?.message}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <div className="mb-3">
        <h6 className="text-secondary">Size</h6>
        <Row>
          <Col md={4}>
             <Form.Group>
                <Form.Label>Width</Form.Label>
                <Form.Control 
                    type="number" step="0.01" 
                    {...register('size.width', { valueAsNumber: true })} 
                    isInvalid={!!errors.size?.width}
                />
             </Form.Group>
          </Col>
          <Col md={4}>
             <Form.Group>
                <Form.Label>Length</Form.Label>
                <Form.Control 
                    type="number" step="0.01" 
                    {...register('size.length', { valueAsNumber: true })} 
                    isInvalid={!!errors.size?.length}
                />
             </Form.Group>
          </Col>
           <Col md={4}>
             <Form.Group>
                <Form.Label>Unit</Form.Label>
                <Form.Select
                    {...register('size.unit')}
                >
                    <option value="m">Meters (m)</option>
                    <option value="sqm">Square Meters (sqm)</option>
                </Form.Select>
             </Form.Group>
          </Col>
        </Row>
      </div>

      <div className="mb-3">
         <h6 className="text-secondary">Pricing</h6>
         <Row>
            <Col md={4}>
                <Form.Group>
                    <Form.Label>Daily (฿)</Form.Label>
                    <Form.Control
                        type="number" step="1"
                        {...register('pricing.daily', { valueAsNumber: true })}
                        isInvalid={!!errors.pricing?.daily}
                    />
                </Form.Group>
            </Col>
            <Col md={4}>
                <Form.Group>
                    <Form.Label>Weekly (฿)</Form.Label>
                    <Form.Control
                        type="number" step="1"
                        {...register('pricing.weekly', { valueAsNumber: true })}
                        isInvalid={!!errors.pricing?.weekly}
                    />
                </Form.Group>
            </Col>
            <Col md={4}>
                <Form.Group>
                    <Form.Label>Monthly (฿)</Form.Label>
                    <Form.Control
                        type="number" step="1"
                        {...register('pricing.monthly', { valueAsNumber: true })}
                        isInvalid={!!errors.pricing?.monthly}
                    />
                </Form.Group>
            </Col>
         </Row>
      </div>
      
      <Row className="mb-3">
          <Col md={6}>
            <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select {...register('status')}>
                    <option value="available">Available</option>
                    <option value="booked">Booked</option>
                    <option value="rented">Rented</option>
                    <option value="maintenance">Maintenance</option>
                </Form.Select>
            </Form.Group>
          </Col>
      </Row>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (initialData ? 'Update Lock' : 'Create Lock')}
        </Button>
      </div>
    </Form>
  );
}

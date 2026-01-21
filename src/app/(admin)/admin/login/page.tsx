'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { Form, Button, Alert, Container, Card } from 'react-bootstrap';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: z.string().min(1, 'กรุณาระบุรหัสผ่าน'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);
    console.log('[Login Page] Submitting credentials for:', data.email);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      console.log('[Login Page] SignIn result:', result);

      if (result?.error) {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือคุณไม่มีสิทธิ์ผู้ดูแลระบบ');
      } else {
        // Successful login
        console.log('[Login Page] Login success, pushing to dashboard');
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch (err) {
      console.error('[Login Page] Error during signIn:', err);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center min-vh-100 bg-secondary">
      <Card className="shadow-lg border-0" style={{ maxWidth: '400px', width: '100%' }}>
        <Card.Body className="p-5">
          <div className="text-center mb-5">
            <i className="bi bi-shield-lock-fill text-warning display-4 mb-3"></i>
            <h2 className="fw-bold text-dark">ระบบจัดการตลาด</h2>
            <p className="text-muted small">สำหรับเจ้าหน้าที่และผู้ดูแลระบบเท่านั้น</p>
          </div>

          {error && <Alert variant="danger" className="text-center small">{error}</Alert>}

          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-3">
              <Form.Label>อีเมล (Email)</Form.Label>
              <Form.Control 
                type="email" 
                placeholder="เช่น admin@market.com"
                {...register('email')} 
                isInvalid={!!errors.email}
              />
              <Form.Control.Feedback type="invalid">
                {errors.email?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>รหัสผ่าน (Password)</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="กรอกรหัสผ่านของคุณ"
                {...register('password')} 
                isInvalid={!!errors.password}
              />
              <Form.Control.Feedback type="invalid">
                {errors.password?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Button variant="dark" type="submit" className="w-100 py-2 fw-bold" disabled={loading}>
              {loading ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบ'}
            </Button>
          </Form>
        </Card.Body>
        <Card.Footer className="text-center py-3 bg-light border-0">
          <small className="text-muted">ระบบจองแผงตลาด MarketHub &copy; 2026</small>
        </Card.Footer>
      </Card>
    </Container>
  );
}

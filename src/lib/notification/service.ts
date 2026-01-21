import connectDB from '@/lib/db/mongoose';
import Notification from '@/models/Notification';

// Define Notification Types
export type NotificationType = 
  | 'booking_created' 
  | 'payment_uploaded' 
  | 'booking_approved' 
  | 'booking_rejected' 
  | 'booking_cancelled' 
  | 'booking_expiring' 
  | 'queue_cancelled'
  | 'system';

interface NotificationData {
  // Booking Data
  bookingId?: string;
  lockNumber?: string;
  totalAmount?: number;
  paymentDeadline?: Date;
  startDate?: Date;
  endDate?: Date;
  receiptUrl?: string;
  rejectionReason?: string;
  
  // User Data (for email)
  userEmail?: string;
  userName?: string;
  
  // Generic
  title?: string;
  message?: string;
  link?: string;
}

export const NotificationService = {
  /**
   * Send a notification (In-App + Email based on policy)
   */
  async send(userId: string, type: NotificationType, data: NotificationData) {
    try {
      await connectDB();
      
      // 1. Create In-App Notification (Conditional based on policy)
      if (this.shouldSendInApp(type)) {
        await this.createInAppNotification(userId, type, data);
      }

// 2. Send Email (Disabled)
      // if (this.shouldSendEmail(type) && data.userEmail) {
      //   await this.sendEmailNotification(type, data);
      // }
    } catch (error) {
      console.error('NotificationService Error:', error);
      // Don't throw error to prevent blocking the main flow
    }
  },

  /**
   * Policy: Which events trigger In-App notifications?
   */
  shouldSendInApp(type: NotificationType): boolean {
    const inAppPolicy: Record<NotificationType, boolean> = {
      booking_created: true,
      payment_uploaded: false, // User already knows they uploaded
      booking_approved: true,
      booking_rejected: true,
      booking_cancelled: true,
      booking_expiring: true,
      queue_cancelled: true,
      system: true
    };
    return inAppPolicy[type] ?? true;
  },

  /**
   * Logic to determine title and message for In-App notifications
   */
  async createInAppNotification(userId: string, type: NotificationType, data: NotificationData) {
    let title = data.title || 'แจ้งเตือนระบบ';
    let message = data.message || 'คุณมีการแจ้งเตือนใหม่';
    let link = data.link || '/notifications';

    switch (type) {
      case 'booking_created':
        title = 'จองล็อคสำเร็จ';
        message = `คุณได้จองล็อค #${data.lockNumber} เรียบร้อยแล้ว กรุณาชำระเงินภายในเวลาที่กำหนด`;
        link = `/my-bookings/${data.bookingId}`;
        break;
      case 'payment_uploaded':
        title = 'ได้รับสลิปแล้ว';
        message = 'ระบบได้รับหลักฐานการชำระเงินของคุณแล้ว กำลังดำเนินการตรวจสอบ';
        link = `/my-bookings/${data.bookingId}`;
        break;
      case 'booking_approved':
        title = 'การจองได้รับการอนุมัติ';
        message = `การชำระเงินสำหรับล็อค #${data.lockNumber} ได้รับการอนุมัติแล้ว`;
        link = `/my-bookings/${data.bookingId}`;
        break;
      case 'booking_rejected':
        title = 'การชำระเงินถูกปฏิเสธ';
        message = `เหตุผล: ${data.rejectionReason || 'ไม่ระบุ'} กรุณาตรวจสอบและดำเนินการใหม่`;
        link = `/my-bookings/${data.bookingId}`;
        break;
      case 'booking_cancelled':
        title = 'การจองถูกยกเลิก';
        message = `รายการจอง #${data.lockNumber} ถูกยกเลิกเนื่องจากหมดเวลาชำระเงิน`;
        break;
      case 'booking_expiring':
        title = 'สัญญาใกล้หมดอายุ';
        message = data.message || `การเช่าล็อค #${data.lockNumber} จะหมดอายุในเร็วๆ นี้`;
        break;
      case 'queue_cancelled':
        title = 'คิวได้รับการยกเลิก';
        message = `คิวสำหรับล็อค #${data.lockNumber} ถูกยกเลิกเนื่องจากมีผู้เช่ารายอื่นชำระเงินเรียบร้อยแล้ว`;
        link = '/locks'; // Or browse locks
        break;
    }

    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
      isRead: false
    });

    // Emit event for real-time SSE
    const { getNotificationEmitter, NOTIFICATION_EVENT } = await import('@/lib/notification/events');
    getNotificationEmitter().emit(NOTIFICATION_EVENT, { userId, notification });
  },

  shouldSendEmail(): boolean {
    return false;
  }
};

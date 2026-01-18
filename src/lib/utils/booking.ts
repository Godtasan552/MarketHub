export type RentalType = 'daily' | 'weekly' | 'monthly';

interface LockPricing {
  daily: number;
  weekly?: number;
  monthly?: number;
}

export function calculateBookingDetails(lockPricing: LockPricing, startDate: Date, rentalType: RentalType) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  let end = new Date(start);
  let amount = 0;

  if (rentalType === 'daily') {
    end = new Date(start);
    amount = lockPricing.daily;
  } else if (rentalType === 'weekly') {
    end.setDate(start.getDate() + 6);
    amount = lockPricing.weekly || (lockPricing.daily * 7);
  } else if (rentalType === 'monthly') {
    end.setDate(start.getDate() + 29);
    amount = lockPricing.monthly || (lockPricing.daily * 30);
  } else {
    throw new Error('รูปแบบการเช่าไม่ถูกต้อง');
  }

  return {
    startDate: start,
    endDate: end,
    totalAmount: amount,
  };
}

import { createWorker } from 'tesseract.js';

export interface OCRResult {
  amount?: number;
  date?: Date;
  referenceNumber?: string;
  confidence: number;
}

export async function processSlipOCR(imageBuffer: Buffer): Promise<OCRResult> {
  const worker = await createWorker('tha+eng');
  
  try {
    const { data: { text, confidence } } = await worker.recognize(imageBuffer);
    
    // Simple regex to find amount (e.g., 100.00 or 1,000.00)
    const amountRegex = /([0-9,]+\.[0-9]{2})/g;
    const matches = text.match(amountRegex);
    
    let amount: number | undefined;
    if (matches) {
       // Take the largest number which is likely the total amount
       const amounts = matches.map(m => parseFloat(m.replace(/,/g, '')));
       amount = Math.max(...amounts);
    }

    // Try to find reference number (usually 18+ digits)
    const refRegex = /\d{18,}/;
    const refMatch = text.match(refRegex);
    const referenceNumber = refMatch ? refMatch[0] : undefined;

    return {
      amount,
      referenceNumber,
      confidence
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return { confidence: 0 };
  } finally {
    await worker.terminate();
  }
}

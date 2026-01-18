import Tesseract from 'tesseract.js';

export interface OCRResult {
  amount?: number;
  fee?: number;
  date?: string;
  time?: string;
  referenceNumber?: string;
  fromAccount?: string;
  toAccount?: string;
  transferType?: string;
  confidence: number;
  rawText?: string;
}

/**
 * 🛠️ Enhanced Slip OCR Processor 
 * Strengthened with robust Thai/English patterns for bank slips
 */
export async function processSlipOCR(imageBuffer: Buffer): Promise<OCRResult> {
  try {
    const { data: { text, confidence } } = await Tesseract.recognize(
      imageBuffer,
      'tha+eng'
    );

    const cleanText = text
      .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s\.\,\:\-\/\(\)\฿]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const info: Partial<OCRResult> = {
      confidence,
      rawText: text
    };

    // --- 1. Amount Detection ---
    const amountPatterns = [
      /(?:จำนวนเงิน|จ่าย|ยอดเงิน|โอน)[:\s]+([0-9]{1,3}(?:,?[0-9]{3})*\.[0-9]{2})/i,
      /(?:Amount|Total|Pay)[:\s]+([0-9]{1,3}(?:,?[0-9]{3})*\.[0-9]{2})/i,
      /THB[:\s]+([0-9]{1,3}(?:,?[0-9]{3})*\.[0-9]{2})/i,
      /฿[:\s]*([0-9]{1,3}(?:,?[0-9]{3})*\.[0-9]{2})/,
      /([0-9]{1,3}(?:,?[0-9]{3})*\.[0-9]{2})\s*(?:บาท|Baht)/i,
      /\b([1-9][0-9]{0,2}(?:,?[0-9]{3})*\.[0-9]{2})\b/,
    ];

    for (const pattern of amountPatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val) && val >= 0.01) {
          info.amount = val;
          break;
        }
      }
    }

    // --- 2. Fee Detection ---
    const feePatterns = [
      /(?:ค่าธรรมเนียม|ค่าบริการ)[:\s]+([0-9]+(?:\.[0-9]{2})?)/i,
      /(?:Fee|Service\s*Charge)[:\s]+([0-9]+(?:\.[0-9]{2})?)/i,
    ];

    for (const pattern of feePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val)) {
          info.fee = val;
          break;
        }
      }
    }

    // --- 3. Date & Time Detection ---
    const datePatterns = [
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4})/i,
      /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/,
      /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        info.date = match[1];
        break;
      }
    }

    const timePatterns = [
      /(\d{1,2}:\d{2}:\d{2}(?:\s*(?:AM|PM|น\.|am|pm))?)/i,
      /(\d{1,2}:\d{2}(?:\s*(?:AM|PM|น\.|am|pm))?)/i,
    ];

    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        info.time = match[1];
        break;
      }
    }

    // --- 4. Reference Number Detection ---
    const refPatterns = [
      /(?:เลขที่อ้างอิง|หมายเลขอ้างอิง|อ้างอิง|Reference|Ref\s*No\.?|Ref\.?)[:\s]*([A-Z0-9]{10,})/i,
      /(?:Transaction\s*(?:ID|No|Number))[:\s]*([A-Z0-9]{10,})/i,
      /\b([A-Z]{3,6}[0-9]{8,})\b/,
      /\b\d{18,}\b/ // Ref number often 18+ digits
    ];

    for (const pattern of refPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        info.referenceNumber = match[1].trim();
        break;
      } else if (match && !match[1]) {
        // Handle case where pattern doesn't have a group (like \b\d{18,}\b)
        info.referenceNumber = match[0].trim();
        break;
      }
    }

    // --- 5. Account Numbers ---
    const accountPattern = /\b(\d{3}-?\d{1}-?\d{5}-?\d{1})\b/g;
    const accounts = text.match(accountPattern);
    if (accounts && accounts.length >= 1) {
      info.fromAccount = accounts[0];
      if (accounts.length >= 2) {
        info.toAccount = accounts[1];
      }
    }

    // --- 6. Transfer Type ---
    const lowerText = text.toLowerCase();
    if (lowerText.includes('promptpay') || text.includes('พร้อมเพย์')) {
      info.transferType = 'PromptPay';
    } else if (text.includes('โอน') || lowerText.includes('transfer')) {
      info.transferType = 'Bank Transfer';
    }

    return info as OCRResult;

  } catch (error) {
    console.error('OCR Error:', error);
    return { confidence: 0 };
  }
}

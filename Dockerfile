# --- 1. ขั้นตอนการติดตั้ง Dependencies ---
FROM node:20-alpine AS deps
# ติดตั้ง libc6-compat เพื่อให้รองรับบาง library ที่ต้องการไลบรารีมาตรฐานของระบบ
RUN apk add --no-cache libc6-compat
WORKDIR /app

# คัดลอกไฟล์จัดการ package และติดตั้งแบบ Clean Install (npm ci)
COPY package.json package-lock.json* ./
RUN npm ci

# --- 2. ขั้นตอนการ Build Source Code ---
FROM node:20-alpine AS builder
WORKDIR /app
# คัดลอก node_modules จากขั้นตอนที่แล้วมาใช้งาน
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ปิดการรวบรวมข้อมูล Telemetry ของ Next.js ระหว่าง Build (ถ้าต้องการ)
# ENV NEXT_TELEMETRY_DISABLED 1

# รันคำสั่ง Build เพื่อสร้างไฟล์สำหรับ Production (จะรวมไฟล์ออกเป็น standalone)
RUN npm run build

# --- 3. ขั้นตอนการเตรียม Production Environment (Runner) ---
FROM node:20-alpine AS runner
WORKDIR /app

# กำหนดโหมดการทำงานเป็น production
ENV NODE_ENV=production

# สร้าง User และ Group พิเศษเพื่อความปลอดภัย (ไม่รันด้วย root)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# คัดลอกไฟล์ที่จำเป็นสำหรับการแสดงผลหน้าบ้าน
COPY --from=builder /app/public ./public

# สร้างโฟลเดอร์ .next และตั้งค่าสิทธิ์ให้ User ที่สร้างขึ้น
RUN mkdir .next
RUN chown nextjs:nodejs .next

# คัดลอกไฟล์ที่ถูก Build แบบ standalone มาใช้งาน เพื่อลดขนาด Docker Image
# ดูข้อมูลเพิ่มเติม: https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# คัดลอกไฟล์ข้อมูลสำหรับระบบ OCR (Tesseract) เข้ามาที่ Root ของแอพ
COPY --from=builder /app/eng.traineddata ./
COPY --from=builder /app/tha.traineddata ./

# เปลี่ยนไปใช้ User ที่มีความปลอดภัยสูง
USER nextjs

# เปิดพอร์ต 3000 สำหรับการเชื่อมต่อ
EXPOSE 3000

ENV PORT=3000
# กำหนด Hostname ให้เข้าถึงได้จากภายนอกผ่านคอนเทนเนอร์
ENV HOSTNAME="0.0.0.0"

# เริ่มต้นการทำงานของแอพโดยใช้ไฟล์ server.js (สร้างอัตโนมัติจากโหมด standalone)
CMD ["node", "server.js"]

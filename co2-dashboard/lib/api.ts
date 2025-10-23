// lib/api.ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  timeout: 10_000,
});

// ✅ ตัว fetcher สำหรับ SWR (ต้อง export แบบ named)
export const axiosFetcher = (url: string) =>
  api.get(url).then((res) => res.data);

// (ออปชัน) ใช้ที่อื่นได้
export async function getRealtime(key: string): Promise<number> {
  try {
    const { data } = await api.get(`/realtime`, { params: { key } });
    return Number(data?.value ?? 0);
  } catch {
    return Math.round(Math.random() * 1000) / 10; // mock ระหว่างพัฒนา
  }
}


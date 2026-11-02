# 🏢 SICorp - HRIS & Leave Management Portal

**SICorp** adalah portal Sistem Informasi Corporate (*Human Resource Information System*) modern berbasis web untuk mengelola master data karyawan, struktur departemen, dan pengajuan serta persetujuan cuti secara *real-time*.

---

## 🚀 Fitur Utama

- **Role-Based Access Control (RBAC)**:
  - 👑 **HRD**: Kelola Master Data (tambah/edit karyawan, buat departemen baru), pantau statistik cuti perusahaan, dan persetujuan cuti.
  - 👔 **Manager**: Persetujuan (*Approve / Reject*) cuti khusus bawahan langsung disertai catatan manajer.
  - 👤 **Employee**: Portal karyawan untuk cek saldo cuti tahunan & cuti sakit, formulir pengajuan cuti, dan upload dokumen pendukung.
- **Real-Time Data Sync**: Auto-refresh instan saat ada aksi lokal maupun perubahan data via Supabase Realtime WebSocket.
- **Keamanan Data Berlapis**:
  - PostgreSQL Row Level Security (RLS) di semua tabel.
  - Isolasi Service Role Key di server (tidak terekspos ke browser).
  - Validasi ketat pada file upload (ekstensi `.pdf`, `.jpg`, `.png`, `.webp`, maksimal 5 MB).
  - HTTP Security Headers standar OWASP (*anti-Clickjacking, anti-MIME sniffing*).
- **Desain Modern & Bersih**: Tampilan antarmuka solid (tanpa gradient) yang responsif di desktop maupun perangkat mobile.
- **Mode Dual (Hybrid)**: Mendukung mode *Live Database Supabase* dan mode *Mock Data Dummy* untuk demonstrasi instan tanpa database.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack, React 19)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL, Supabase Auth, Storage, Realtime)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

---

## 🏁 Memulai Pengembangan Lokal (Getting Started)

### 1. Clone Repository
```bash
git clone https://github.com/akakaraga/SICorp.git
cd SICorp
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Isi konfigurasi di `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Set 'false' untuk menggunakan Supabase asli, atau 'true' untuk mode dummy
USE_DUMMY_DATA=false

# Service Role Key (wajib untuk fitur tambah karyawan oleh HRD)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. Setup Database Supabase
Jalankan skrip SQL di file [`supabase_schema.sql`](supabase_schema.sql) pada menu **SQL Editor** di dashboard Supabase Anda.

### 5. Jalankan Development Server
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 🌐 Deployment ke Vercel

1. Push repository ini ke GitHub.
2. Buka [Vercel](https://vercel.com/) dan import repository **SICorp**.
3. Masukkan Environment Variables di Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `USE_DUMMY_DATA` = `false`
4. Di Supabase Dashboard (**Authentication > URL Configuration**), tambahkan domain Vercel Anda ke **Redirect URLs**.
5. Klik **Deploy**!

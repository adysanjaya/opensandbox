'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useSimpleToast } from '@/hooks/useToast';
import {
  BookOpenIcon,
  CodeBracketIcon,
  GlobeAltIcon,
  BoltIcon,
  CubeIcon,
  ShieldCheckIcon,
  SparklesIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  ArrowRightIcon,
  CommandLineIcon,
  DocumentTextIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  PlayIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';

const SECTIONS = [
  { id: 'intro', label: '1. Pengenalan Platform' },
  { id: 'architecture', label: '2. Format & Struktur URL' },
  { id: 'create-endpoint', label: '3. Membuat Endpoint Baru' },
  { id: 'nodes-guide', label: '4. Panduan Node Visual Flow' },
  { id: 'shared-functions', label: '5. Shared Functions' },
  { id: 'code-examples', label: '6. Contoh Integrasi Kode' },
  { id: 'metrics-monitoring', label: '7. Monitoring & Metrik' },
  { id: 'faq', label: '8. Tanya Jawab (FAQ)' },
];

export default function DocsPage() {
  const router = useRouter();
  const toast = useSimpleToast();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python' | 'php'>('curl');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      auth
        .me()
        .then((res) => setUser(res.data))
        .catch(() => {
          // guest mode
        });
    }
  }, []);

  const userHash = user?.userHash || 'demo_user123';
  const sampleSlug = 'cek-status';
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'https://api-sandbox.adysanjaya.my.id';
  const sampleUrl = `${apiBase}/${userHash}/${sampleSlug}`;

  const copyToClipboard = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success('Cuplikan kode berhasil disalin!');
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const codeSnippets: Record<string, string> = {
    curl: `curl -X POST "${sampleUrl}" \\
  -H "Content-Type: application/json" \\
  -d '{"order_id": "ORD-9921", "amount": 150000}'`,
    js: `// Menggunakan Fetch API (Browser / Node.js)
const response = await fetch("${sampleUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    order_id: "ORD-9921",
    amount: 150000,
  }),
});

const data = await response.json();
console.log("Response:", data);`,
    python: `# Menggunakan library requests
import requests

url = "${sampleUrl}"
payload = {
    "order_id": "ORD-9921",
    "amount": 150000
}
headers = {
    "Content-Type": "application/json"
}

response = requests.post(url, json=payload, headers=headers)
print("Status Code:", response.status_code)
print("Response JSON:", response.json())`,
    php: `<?php
// Menggunakan cURL PHP
$ch = curl_init("${sampleUrl}");

$payload = json_encode([
    "order_id" => "ORD-9921",
    "amount" => 150000
]);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Content-Length: " . strlen($payload)
]);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`,
  };

  const content = (
    <div className="max-w-6xl mx-auto space-y-12 pb-16">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-background border border-primary/20 p-8 sm:p-10">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary mb-4">
            <BookOpenIcon className="w-4 h-4" />
            Dokumentasi Resmi OpenSandbox
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Panduan Lengkap Membangun & Mengintegrasikan REST API Visual
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-3 leading-relaxed">
            Pelajari cara membuat endpoint REST API dinamis, merancang alur logika percabangan,
            menghubungkan external service, serta mengintegrasikannya ke dalam aplikasi web & mobile Anda.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => router.push('/endpoints/new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Coba Buat Endpoint Baru</span>
            </button>
            <a
              href="#code-examples"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-card border border-border hover:bg-muted text-foreground rounded-xl text-xs font-medium transition-all"
            >
              <CodeBracketIcon className="w-4 h-4 text-primary" />
              <span>Lihat Contoh Kode</span>
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Sticky Table of Contents (Desktop Sidebar) */}
        <aside className="hidden lg:block lg:sticky lg:top-24 space-y-1 p-4 rounded-2xl bg-card border border-border">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-3 mb-2">
            Daftar Isi
          </p>
          {SECTIONS.map((sec) => (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              className="block px-3 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted hover:text-primary transition-colors truncate"
            >
              {sec.label}
            </a>
          ))}
        </aside>

        {/* Main Documentation Articles */}
        <div className="lg:col-span-3 space-y-12">
          {/* 1. Pengenalan Platform */}
          <section id="intro" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5 border-b border-border pb-3">
              <SparklesIcon className="w-6 h-6 text-primary" />
              1. Pengenalan Platform OpenSandbox
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>OpenSandbox</strong> adalah visual backend platform yang dirancang untuk
              memudahkan software engineer, frontend developer, mobile engineer, dan tester dalam
              membuat, menguji, dan mendeploy endpoint REST API nyata tanpa perlu mengelola server backend atau menulis kode boilerplate.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
                  <BoltIcon className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">Instan Tanpa Deploy</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Setiap perubahan alur logika langsung aktif seketika di endpoint publik Anda.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-2">
                  <ShieldCheckIcon className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">Validasi & Keamanan</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Dukungan validasi skema body, query parameter, dan otorisasi API key.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center mb-2">
                  <CubeIcon className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">Reusable Logic</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Shared functions memungkinkan Anda mendaur ulang logika antar puluhan endpoint.
                </p>
              </div>
            </div>
          </section>

          {/* 2. Format & Struktur URL */}
          <section id="architecture" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5 border-b border-border pb-3">
              <GlobeAltIcon className="w-6 h-6 text-primary" />
              2. Format & Struktur URL Endpoint
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Setiap endpoint yang Anda buat pada OpenSandbox memiliki alamat URL publik unik berformat:
            </p>

            <div className="p-4 rounded-2xl bg-card border border-border font-mono text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="text-primary font-semibold truncate">
                {apiBase}/<span className="text-amber-500">{userHash}</span>/
                <span className="text-emerald-500">{sampleSlug}</span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(sampleUrl, 'sample-url')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-xs font-sans text-foreground transition-all shrink-0"
              >
                {copiedKey === 'sample-url' ? (
                  <>
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-emerald-500">Tersalin</span>
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                    <span>Salin Contoh URL</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <p>
                ● <strong className="text-foreground">Host API:</strong>{' '}
                <code className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">
                  {apiBase}
                </code>{' '}
                — Server eksekusi REST API berkecepatan tinggi dengan reverse proxy SSL.
              </p>
              <p>
                ● <strong className="text-foreground">User Hash:</strong>{' '}
                <code className="font-mono text-amber-500 bg-amber-500/10 px-1 py-0.5 rounded">
                  {userHash}
                </code>{' '}
                — Pengenal unik workspace akun Anda agar tidak terjadi bentrok nama slug dengan pengguna lain.
              </p>
              <p>
                ● <strong className="text-foreground">Slug:</strong>{' '}
                <code className="font-mono text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded">
                  {sampleSlug}
                </code>{' '}
                — Path kustom yang Anda tentukan sendiri saat membuat endpoint (misal: <code>users</code>, <code>checkout</code>, <code>trx</code>).
              </p>
            </div>
          </section>

          {/* 3. Membuat Endpoint Baru */}
          <section id="create-endpoint" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5 border-b border-border pb-3">
              <DocumentTextIcon className="w-6 h-6 text-primary" />
              3. Cara Membuat Endpoint Baru
            </h2>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-foreground">Buka Menu Endpoints:</strong> Klik tombol{' '}
                  <span className="text-primary font-semibold">+ New Endpoint</span> pada dashboard atau navigasi sidebar.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-foreground">Tentukan Nama & Method:</strong> Masukkan nama deskriptif (contoh: <code>Cek Saldo Member</code>) dan pilih HTTP Method yang sesuai:
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">GET</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">POST</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20">PUT</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-red-500/10 text-red-400 border border-red-500/20">DELETE</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-pink-500/10 text-pink-400 border border-pink-500/20">PATCH</span>
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-foreground">Tentukan Slug:</strong> Gunakan karakter huruf kecil, angka, dan strip (contoh: <code>cek-saldo</code>).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-foreground">Rancang Alur Node:</strong> Susun node pada Flow Builder kanvas, lalu hubungkan garis konektor dari Trigger hingga ke Response.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  5
                </span>
                <div>
                  <strong className="text-foreground">Simpan & Uji:</strong> Klik tombol <strong>Save</strong> dan lakukan pengujian langsung menggunakan tombol <strong>Test</strong> atau tombol <strong>Salin URL</strong> untuk diuji melalui Postman atau cURL.
                </div>
              </li>
            </ol>
          </section>

          {/* 4. Panduan Node Visual Flow */}
          <section id="nodes-guide" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5 border-b border-border pb-3">
              <CodeBracketIcon className="w-6 h-6 text-primary" />
              4. Panduan Node pada Visual Flow Builder
            </h2>
            <div className="space-y-4">
              {/* Trigger */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
                <div className="flex items-center gap-2 text-primary font-bold text-base">
                  <PlayIcon className="w-5 h-5" />
                  <span>Trigger Node (Input Request)</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Node awal yang bertindak sebagai gerbang masuk ketika klien memanggil API. Menangkap seluruh payload request:
                </p>
                <div className="p-3 bg-muted/40 rounded-xl font-mono text-xs text-foreground/90 space-y-1">
                  <p><code>request.headers</code> — Header HTTP dari klien (misal: Authorization, User-Agent)</p>
                  <p><code>request.query</code> — Query string URL (misal: ?status=active&limit=10)</p>
                  <p><code>request.body</code> — Objek JSON atau teks yang dikirimkan klien</p>
                </div>
              </div>

              {/* Condition */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-base">
                  <ArrowsRightLeftIcon className="w-5 h-5" />
                  <span>Condition / Branching Node (Logika Percabangan)</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mengevaluasi kondisi if-else. Memiliki dua jalur output: <strong>True</strong> dan <strong>False</strong>.
                  Contoh: Memeriksa apakah saldo cukup, apakah role pengguna adalah admin, atau apakah parameter wajib sudah disertakan.
                </p>
              </div>

              {/* HTTP Request */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
                <div className="flex items-center gap-2 text-blue-500 font-bold text-base">
                  <GlobeAltIcon className="w-5 h-5" />
                  <span>HTTP Request Node (Eksternal API)</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Melakukan panggilan HTTP ke layanan pihak ketiga (misal: WhatsApp Gateway, Payment Gateway, Database REST API).
                  Data respons dapat ditangkap dan diteruskan ke node berikutnya.
                </p>
              </div>

              {/* Response */}
              <div className="p-5 rounded-2xl border border-border bg-card space-y-2">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-base">
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Response Node (Output Akhir)</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Menghasilkan respons HTTP final yang dikembalikan ke pemanggil API. Anda dapat menentukan:
                </p>
                <div className="p-3 bg-muted/40 rounded-xl font-mono text-xs text-foreground/90 space-y-1">
                  <p><code>HTTP Status Code</code> — 200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Error</p>
                  <p><code>Content-Type</code> — application/json, text/plain, text/html, application/xml</p>
                  <p><code>Response Body</code> — JSON kustom atau variabel hasil pemrosesan node sebelumnya</p>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Shared Functions */}
          <section id="shared-functions" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5 border-b border-border pb-3">
              <CubeIcon className="w-6 h-6 text-primary" />
              5. Fungsi Logika Bersama (Shared Functions)
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Jika Anda memiliki alur logika yang sering digunakan di banyak endpoint (misalnya verifikasi API Token, pengecekan waktu operasional, atau validasi format nomor telepon), Anda dapat membuatnya sekali di menu <strong>Shared Functions</strong> dan memasukkannya ke berbagai flow endpoint menggunakan node <strong>Shared Function</strong>.
            </p>
          </section>

          {/* 6. Contoh Integrasi Kode */}
          <section id="code-examples" className="scroll-mt-24 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
                <CommandLineIcon className="w-6 h-6 text-primary" />
                6. Contoh Integrasi Kode Multibahasa
              </h2>
              <span className="text-xs text-muted-foreground">
                Gunakan URL endpoint Anda yang telah disalin
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              {/* Tab Selector */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-muted/40 border-b border-border overflow-x-auto">
                <div className="flex items-center gap-2">
                  {(['curl', 'js', 'python', 'php'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase font-mono transition-all ${
                        activeTab === tab
                          ? 'bg-primary text-primary-foreground shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab === 'curl'
                        ? 'cURL'
                        : tab === 'js'
                        ? 'JavaScript'
                        : tab === 'python'
                        ? 'Python'
                        : 'PHP'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => copyToClipboard(codeSnippets[activeTab], `code-${activeTab}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium text-foreground bg-card hover:bg-muted border border-border transition-all"
                >
                  {copiedKey === `code-${activeTab}` ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code display */}
              <pre className="p-5 font-mono text-xs sm:text-sm text-foreground overflow-x-auto leading-relaxed bg-background/50">
                <code>{codeSnippets[activeTab]}</code>
              </pre>
            </div>
          </section>

          {/* 7. Monitoring & Metrik */}
          <section id="metrics-monitoring" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5 border-b border-border pb-3">
              <BoltIcon className="w-6 h-6 text-primary" />
              7. Monitoring & Metrik Hit API
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Pada halaman <strong>Dashboard</strong>, sistem secara otomatis merekam dan memvisualisasikan seluruh panggilan API yang masuk ke endpoint Anda secara real-time:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground list-disc pl-5">
              <li>
                <strong className="text-foreground">Total Panggilan:</strong> Jumlah akumulatif hit dalam rentang waktu 24 jam, 7 hari, atau 30 hari.
              </li>
              <li>
                <strong className="text-foreground">Success Rate (%):</strong> Rasio respons sukses (HTTP 2xx) dibanding total request.
              </li>
              <li>
                <strong className="text-foreground">Rata-rata Latensi (ms):</strong> Kecepatan eksekusi pemrosesan flow visual dalam milidetik.
              </li>
              <li>
                <strong className="text-foreground">Top Endpoint:</strong> Peringkat endpoint yang paling banyak diakses beserta persentase traffic share.
              </li>
            </ul>
          </section>

          {/* 8. Tanya Jawab (FAQ) */}
          <section id="faq" className="scroll-mt-24 space-y-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2.5 border-b border-border pb-3">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-primary" />
              8. Tanya Jawab (FAQ) & Bantuan
            </h2>
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-border bg-card">
                <h4 className="text-sm font-semibold text-foreground">
                  Apakah endpoint OpenSandbox mendukung CORS?
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Ya. Semua endpoint secara default telah menyertakan header CORS lengkap sehingga dapat langsung dipanggil dari browser (React, Vue, Angular, mobile app, dll).
                </p>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card">
                <h4 className="text-sm font-semibold text-foreground">
                  Bagaimana jika saya membutuhkan bantuan teknis khusus?
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Anda dapat menggunakan tombol <strong>Kontak Bantuan</strong> di sidebar atau header dashboard untuk menghubungi tim pengembang kami langsung via WhatsApp atau Email.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );

  // If user is logged in, wrap with DashboardLayout for seamless continuity
  if (user) {
    return (
      <DashboardLayout
        activeNav="docs"
        title="Dokumentasi & Panduan"
        subtitle="Panduan komprehensif cara menggunakan visual flow builder dan mengintegrasikan REST API OpenSandbox."
        user={user}
      >
        {content}
      </DashboardLayout>
    );
  }

  // If guest / logged out, render clean standalone layout with top header
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div
            onClick={() => router.push('/')}
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-border/50 shrink-0 bg-[#160324] flex items-center justify-center p-1">
              <img src="/logo.svg" alt="OpenSandbox" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-foreground">OpenSandbox</span>
              <span className="block text-[10px] text-muted-foreground font-mono -mt-1">
                Dokumentasi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => router.push('/login')}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-all shadow-xs"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 px-4 sm:px-6 py-8">{content}</main>
    </div>
  );
}

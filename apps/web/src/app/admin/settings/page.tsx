'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, admin } from '@/lib/api';
import { isSuperAdmin } from '@/lib/auth-helpers';
import DashboardLayout from '@/components/DashboardLayout';
import ContactSupportModal from '@/components/ContactSupportModal';
import { useSimpleToast } from '@/hooks/useToast';
import {
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  CheckIcon,
  ArrowPathIcon,
  EyeIcon,
  ServerStackIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export default function AdminSettingsPage() {
  const router = useRouter();
  const toast = useSimpleToast();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingSupport, setSavingSupport] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [activeTab, setActiveTab] = useState<'support' | 'general'>('support');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  // Form states
  const [supportForm, setSupportForm] = useState({
    whatsapp: '6281234567890',
    whatsappMessage: 'Halo Admin OpenSandbox, saya ingin menanyakan perihal layanan Sandbox API.',
    email: 'adysanjaya013@gmail.com',
    telegram: 'adysanjaya',
    documentationUrl: 'https://sandbox.adysanjaya.my.id',
    supportHours: 'Senin - Jumat: 09:00 - 18:00 WIB',
    welcomeMessage: 'Butuh bantuan atau panduan teknis seputar OpenSandbox? Kami siap membantu Anda!',
  });

  const [generalForm, setGeneralForm] = useState({
    appName: 'OpenSandbox',
    allowRegistration: true,
    maintenanceMode: false,
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    Promise.all([auth.me(), admin.getSettings()])
      .then(([userRes, settingsRes]) => {
        const user = userRes.data;
        const hasAdminAccess = isSuperAdmin(user);

        if (!hasAdminAccess) {
          toast.error('Akses ditolak: Hanya Superadmin yang dapat membuka Pengaturan');
          router.push('/dashboard');
          return;
        }

        setCurrentUser(user);

        const settingsData = settingsRes.data || {};
        if (settingsData.support) {
          setSupportForm((prev) => ({ ...prev, ...settingsData.support }));
        }
        if (settingsData.general) {
          setGeneralForm((prev) => ({ ...prev, ...settingsData.general }));
        }
      })
      .catch((err) => {
        toast.error(err.message || 'Gagal memuat pengaturan admin');
        router.push('/dashboard');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSaveSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSupport(true);
    try {
      await admin.updateSetting('support', supportForm);
      toast.success('Pengaturan Kontak Bantuan berhasil disimpan');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan kontak bantuan');
    } finally {
      setSavingSupport(false);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      await admin.updateSetting('general', generalForm);
      toast.success('Pengaturan Sistem Platform berhasil disimpan');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan pengaturan umum');
    } finally {
      setSavingGeneral(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout
      activeNav="settings"
      title="Pengaturan Sistem & Kontak"
      subtitle="Kelola saluran kontak bantuan pengguna, jam operasional, serta konfigurasi platform OpenSandbox."
      user={currentUser}
    >
      <div className="space-y-6 max-w-4xl">
        {/* Tabs navigation */}
        <div className="flex border-b border-border gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('support')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'support'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            <span>Kontak Bantuan & Support</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'general'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Cog6ToothIcon className="w-4 h-4" />
            <span>Pengaturan Platform & Sistem</span>
          </button>
        </div>

        {/* Tab 1: Support Settings */}
        {activeTab === 'support' && (
          <form onSubmit={handleSaveSupport} className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Konfigurasi Saluran Bantuan Pengguna
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Informasi ini ditampilkan di modal bantuan saat pengguna mengklik tombol Kontak Bantuan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-foreground text-xs font-medium transition-all shadow-xs"
                >
                  <EyeIcon className="w-3.5 h-3.5 text-primary" />
                  <span>Tes Pratinjau Modal</span>
                </button>
              </div>

              {/* Welcome Message */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Pesan Pengantar / Sambutan Modal
                </label>
                <textarea
                  rows={2}
                  value={supportForm.welcomeMessage}
                  onChange={(e) =>
                    setSupportForm({ ...supportForm, welcomeMessage: e.target.value })
                  }
                  placeholder="Tulis pesan sambutan bantuan..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* WhatsApp Number & Template */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Nomor WhatsApp Resmi
                  </label>
                  <input
                    type="text"
                    value={supportForm.whatsapp}
                    onChange={(e) =>
                      setSupportForm({ ...supportForm, whatsapp: e.target.value })
                    }
                    placeholder="Contoh: 6281234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground font-mono focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Gunakan kode negara tanpa spasi (misal: 62812...)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Email Dukungan Teknis
                  </label>
                  <input
                    type="email"
                    value={supportForm.email}
                    onChange={(e) =>
                      setSupportForm({ ...supportForm, email: e.target.value })
                    }
                    placeholder="Contoh: support@adysanjaya.my.id"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground font-mono focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* WhatsApp Default Template */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Template Pesan Otomatis WhatsApp
                </label>
                <input
                  type="text"
                  value={supportForm.whatsappMessage}
                  onChange={(e) =>
                    setSupportForm({ ...supportForm, whatsappMessage: e.target.value })
                  }
                  placeholder="Pesan yang otomatis terisi saat user membuka link chat..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Telegram & Docs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Username / Channel Telegram
                  </label>
                  <input
                    type="text"
                    value={supportForm.telegram}
                    onChange={(e) =>
                      setSupportForm({ ...supportForm, telegram: e.target.value })
                    }
                    placeholder="Contoh: adysanjaya atau @adysanjaya"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground font-mono focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                    Jam Operasional Dukungan
                  </label>
                  <input
                    type="text"
                    value={supportForm.supportHours}
                    onChange={(e) =>
                      setSupportForm({ ...supportForm, supportHours: e.target.value })
                    }
                    placeholder="Contoh: Senin - Jumat: 09:00 - 18:00 WIB"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Documentation URL */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  URL Dokumentasi / Panduan API
                </label>
                <input
                  type="url"
                  value={supportForm.documentationUrl}
                  onChange={(e) =>
                    setSupportForm({ ...supportForm, documentationUrl: e.target.value })
                  }
                  placeholder="Contoh: https://sandbox.adysanjaya.my.id"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground font-mono focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={savingSupport}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm active:scale-98 disabled:opacity-60"
                >
                  {savingSupport ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>Simpan Pengaturan Kontak</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: General Platform Settings */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral} className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <div className="border-b border-border pb-4">
                <h3 className="text-base font-bold text-foreground">Pengaturan Platform OpenSandbox</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pengaturan kebijakan operasional platform dan status sistem.
                </p>
              </div>

              {/* Platform Name */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Nama Aplikasi / Brand Platform
                </label>
                <input
                  type="text"
                  value={generalForm.appName}
                  onChange={(e) => setGeneralForm({ ...generalForm, appName: e.target.value })}
                  placeholder="OpenSandbox"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary/40 focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Registration Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Izinkan Registrasi Pengguna Baru</h4>
                  <p className="text-xs text-muted-foreground">
                    Pengguna baru dapat membuat akun dan login melalui Google OAuth atau form pendaftaran.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={generalForm.allowRegistration}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, allowRegistration: e.target.checked })
                  }
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </div>

              {/* Maintenance Mode Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-background">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Mode Pemeliharaan (Maintenance)</h4>
                  <p className="text-xs text-muted-foreground">
                    Nonaktifkan akses umum untuk sementara saat melakukan maintenance besar.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={generalForm.maintenanceMode}
                  onChange={(e) =>
                    setGeneralForm({ ...generalForm, maintenanceMode: e.target.checked })
                  }
                  className="w-5 h-5 accent-primary rounded cursor-pointer"
                />
              </div>

              {/* System Diagnostics Box */}
              <div className="p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                <div className="flex items-center gap-2">
                  <ServerStackIcon className="w-4 h-4 text-primary" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                    Informasi Runtime Server
                  </h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Environment</span>
                    <strong className="text-foreground">Production</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Database</span>
                    <strong className="text-emerald-500">PostgreSQL (Connected)</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Reverse Proxy</span>
                    <strong className="text-foreground">OpenResty / SSL</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Role Saat Ini</span>
                    <strong className="text-primary flex items-center gap-1">
                      <ShieldCheckIcon className="w-3.5 h-3.5" />
                      Superadmin
                    </strong>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={savingGeneral}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm active:scale-98 disabled:opacity-60"
                >
                  {savingGeneral ? (
                    <>
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>Simpan Pengaturan Sistem</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Live Preview Modal */}
      <ContactSupportModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        customData={supportForm}
      />
    </DashboardLayout>
  );
}

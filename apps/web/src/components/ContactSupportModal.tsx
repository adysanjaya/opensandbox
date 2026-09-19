'use client';

import React, { useState, useEffect } from 'react';
import { settings } from '@/lib/api';
import { useSimpleToast } from '@/hooks/useToast';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/modal';
import {
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  BookOpenIcon,
  ClockIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

interface ContactSupportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customData?: any; // For preview mode in admin settings
}

export default function ContactSupportModal({
  open,
  onOpenChange,
  customData,
}: ContactSupportModalProps) {
  const toast = useSimpleToast();
  const [supportInfo, setSupportInfo] = useState<any>({
    whatsapp: '6281234567890',
    whatsappMessage: 'Halo Tim OpenSandbox, saya butuh bantuan mengenai penggunaan visual flow API.',
    email: 'adysanjaya013@gmail.com',
    telegram: 'adysanjaya',
    documentationUrl: 'https://sandbox.adysanjaya.my.id',
    supportHours: 'Senin - Jumat: 09:00 - 18:00 WIB',
    welcomeMessage: 'Butuh bantuan atau memiliki kendala seputar konfigurasi API? Tim kami siap membantu Anda!',
  });
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customData) {
      setSupportInfo((prev: any) => ({ ...prev, ...customData }));
      return;
    }

    if (open) {
      setLoading(true);
      settings
        .getSupport()
        .then((res) => {
          if (res.data) {
            setSupportInfo(res.data);
          }
        })
        .catch(() => {
          // fallback to defaults silently
        })
        .finally(() => setLoading(false));
    }
  }, [open, customData]);

  const handleCopyEmail = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(supportInfo.email || 'adysanjaya013@gmail.com');
      setCopied(true);
      toast.success('Email berhasil disalin ke clipboard');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const cleanWhatsapp = (supportInfo.whatsapp || '').replace(/[^0-9]/g, '');
  const waUrl = cleanWhatsapp
    ? `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
        supportInfo.whatsappMessage || 'Halo Admin OpenSandbox, saya butuh bantuan mengenai API.'
      )}`
    : '#';

  const telegramUrl = supportInfo.telegram
    ? supportInfo.telegram.startsWith('http')
      ? supportInfo.telegram
      : `https://t.me/${supportInfo.telegram.replace('@', '')}`
    : '#';

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="max-w-xl p-0 overflow-hidden">
        {/* Header with decorative background */}
        <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0 ring-1 ring-primary/30">
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
            </div>
            <div>
              <ModalTitle className="text-xl font-bold text-foreground">
                Pusat Kontak & Bantuan
              </ModalTitle>
              <ModalDescription className="text-xs text-muted-foreground mt-0.5">
                Hubungi pengembang & tim support OpenSandbox untuk konsultasi dan bantuan teknis.
              </ModalDescription>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Welcome Message Box */}
          {supportInfo.welcomeMessage && (
            <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-2.5">
              <SparklesIcon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/90 leading-relaxed">
                {supportInfo.welcomeMessage}
              </p>
            </div>
          )}

          {/* Support Channels List */}
          <div className="space-y-3">
            {/* WhatsApp */}
            <div className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c4.54 0 8.24 3.7 8.24 8.24 0 2.2-.86 4.27-2.42 5.82a8.196 8.196 0 0 1-5.82 2.42c-1.47 0-2.91-.39-4.18-1.14l-.3-.18-3.12.82.83-3.04-.2-.31a8.216 8.216 0 0 1-1.26-4.39c0-4.54 3.7-8.24 8.25-8.24zm4.52 11.59c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.65.81-.8 1-.15.19-.3.21-.55.08-.25-.12-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.12.17 1.77 2.7 4.29 3.78.6.26 1.07.41 1.44.53.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.48-.29z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">WhatsApp Chat</h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    {supportInfo.whatsapp || 'Belum diatur'}
                  </p>
                </div>
              </div>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-all shrink-0 shadow-sm"
              >
                <span>Chat Sekarang</span>
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Email */}
            <div className="p-4 rounded-xl border border-border bg-card hover:border-blue-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <EnvelopeIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Email Bantuan</h4>
                  <p className="text-xs text-muted-foreground font-mono">
                    {supportInfo.email || 'adysanjaya013@gmail.com'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border bg-muted/50 hover:bg-muted text-foreground text-xs font-medium transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
                <a
                  href={`mailto:${supportInfo.email || 'adysanjaya013@gmail.com'}?subject=Bantuan%20OpenSandbox%20API`}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-all shadow-sm"
                >
                  <span>Kirim Email</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Telegram */}
            {supportInfo.telegram && (
              <div className="p-4 rounded-xl border border-border bg-card hover:border-sky-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Telegram</h4>
                    <p className="text-xs text-muted-foreground font-mono">
                      {supportInfo.telegram.startsWith('@')
                        ? supportInfo.telegram
                        : `@${supportInfo.telegram}`}
                    </p>
                  </div>
                </div>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-all shrink-0 shadow-sm"
                >
                  <span>Buka Telegram</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Documentation */}
            <div className="p-4 rounded-xl border border-border bg-card hover:border-purple-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <BookOpenIcon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Dokumentasi & Tutorial</h4>
                  <p className="text-xs text-muted-foreground">
                    Panduan visual flow builder, integrasi API, dan shared functions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  window.location.href = '/docs';
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground text-xs font-medium transition-all shrink-0"
              >
                <span>Buka Panduan</span>
                <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
              </button>

            </div>
          </div>

          {/* Working Hours Info Box */}
          <div className="p-3 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4 text-primary shrink-0" />
              <span>Jam Operasional:</span>
              <strong className="text-foreground font-medium">
                {supportInfo.supportHours || 'Senin - Jumat: 09:00 - 18:00 WIB'}
              </strong>
            </div>
            <span className="hidden sm:inline-block text-[11px] text-emerald-500 font-medium">
              ● Tim Aktif
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-card/60 flex justify-end">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </ModalContent>
    </Modal>
  );
}

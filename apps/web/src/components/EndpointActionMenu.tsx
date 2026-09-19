'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  EllipsisVerticalIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  LinkIcon,
  CheckIcon,
  TagIcon,
  LockClosedIcon,
  LockOpenIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { useSimpleToast } from '@/hooks/useToast';

export interface EndpointActionMenuProps {
  endpoint: {
    id: string;
    name: string;
    slug: string;
    method: string;
    isActive: boolean;
    groupId?: string | null;
  };
  userHash?: string;
  onDuplicate?: (id: string) => void;
  onToggleActive?: (id: string, currentStatus: boolean) => void;
  onDelete?: (id: string, name: string) => void;
  groups?: Array<{ id: string; name: string; color?: string }>;
  onAssignGroup?: (endpointId: string, groupId: string | null) => void;
}

export default function EndpointActionMenu({
  endpoint,
  userHash,
  onDuplicate,
  onToggleActive,
  onDelete,
  groups,
  onAssignGroup,
}: EndpointActionMenuProps) {
  const router = useRouter();
  const toast = useSimpleToast();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showGroupSubmenu, setShowGroupSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowGroupSubmenu(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowGroupSubmenu(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || 'https://api-sandbox.adysanjaya.my.id';
  const publicUrl = `${apiBase}/${userHash || ''}/${endpoint.slug}`;

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('URL endpoint disalin ke clipboard');
    setTimeout(() => {
      setCopied(false);
      setIsOpen(false);
    }, 800);
  }

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
          setShowGroupSubmenu(false);
        }}
        className={`p-1.5 rounded-lg border transition-all ${
          isOpen
            ? 'bg-muted text-foreground border-border shadow-inner'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/70 border-transparent hover:border-border/60'
        }`}
        title="Daftar Aksi"
        aria-expanded={isOpen}
        aria-label="Aksi Endpoint"
      >
        <EllipsisVerticalIcon className="w-4 h-4" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-full mt-1.5 w-56 rounded-xl bg-card border border-border shadow-xl z-50 py-1.5 text-xs focus:outline-none animate-in fade-in zoom-in-95 duration-100"
          style={{ minWidth: '13rem' }}
        >
          {/* Header info */}
          <div className="px-3 py-1.5 border-b border-border mb-1">
            <p className="font-semibold text-foreground truncate">{endpoint.name}</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate">
              /{endpoint.slug}
            </p>
          </div>

          {/* Action: Copy URL */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-2">
              {copied ? (
                <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <LinkIcon className="w-4 h-4 shrink-0" />
              )}
              <span>{copied ? 'Tersalin ke Clipboard' : 'Salin Public URL'}</span>
            </span>
            <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              cURL
            </span>
          </button>

          {/* Action: Edit in Builder */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              router.push(`/endpoints/${endpoint.id}`);
            }}
            className="w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
          >
            <PencilIcon className="w-4 h-4 shrink-0" />
            <span>Edit di Flow Builder</span>
          </button>

          {/* Action: Duplicate */}
          {onDuplicate && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onDuplicate(endpoint.id);
              }}
              className="w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-2"
            >
              <DocumentDuplicateIcon className="w-4 h-4 shrink-0" />
              <span>Duplikasi Endpoint</span>
            </button>
          )}

          {/* Action: Toggle Active */}
          {onToggleActive && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onToggleActive(endpoint.id, endpoint.isActive);
              }}
              className="w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-between gap-2"
            >
              <span className="flex items-center gap-2">
                {endpoint.isActive ? (
                  <LockOpenIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <LockClosedIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span>{endpoint.isActive ? 'Nonaktifkan Endpoint' : 'Aktifkan Endpoint'}</span>
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  endpoint.isActive
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {endpoint.isActive ? 'Active' : 'Inactive'}
              </span>
            </button>
          )}

          {/* Optional Action: Assign Group */}
          {groups && onAssignGroup && (
            <div className="relative border-t border-border mt-1 pt-1">
              <button
                type="button"
                onClick={() => setShowGroupSubmenu((prev) => !prev)}
                className="w-full text-left px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center justify-between gap-2"
              >
                <span className="flex items-center gap-2">
                  <TagIcon className="w-4 h-4 shrink-0" />
                  <span>Pindahkan ke Group</span>
                </span>
                <ChevronRightIcon
                  className={`w-3.5 h-3.5 transition-transform ${
                    showGroupSubmenu ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {showGroupSubmenu && (
                <div className="bg-muted/40 rounded-lg mx-1.5 my-1 p-1 max-h-40 overflow-y-auto space-y-0.5 border border-border/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      setShowGroupSubmenu(false);
                      onAssignGroup(endpoint.id, null);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] flex items-center justify-between transition-colors ${
                      !endpoint.groupId
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    <span>Tanpa Group (Ungrouped)</span>
                    {!endpoint.groupId && <CheckIcon className="w-3.5 h-3.5" />}
                  </button>

                  {groups.map((g) => {
                    const isCurrent = endpoint.groupId === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setIsOpen(false);
                          setShowGroupSubmenu(false);
                          onAssignGroup(endpoint.id, g.id);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded text-[11px] flex items-center justify-between transition-colors ${
                          isCurrent
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'hover:bg-muted text-foreground'
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: g.color || '#3b82f6' }}
                          />
                          <span className="truncate">{g.name}</span>
                        </span>
                        {isCurrent && <CheckIcon className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Action: Delete (Danger) */}
          {onDelete && (
            <div className="border-t border-border mt-1 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onDelete(endpoint.id, endpoint.name);
                }}
                className="w-full text-left px-3 py-2 text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2 rounded-b-lg font-medium"
              >
                <TrashIcon className="w-4 h-4 shrink-0 text-destructive" />
                <span>Hapus Endpoint</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

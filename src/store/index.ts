import { create } from 'zustand';
import type { Audit, AppConfig } from '../types';
import {
  getAllAudits,
  getAuditById,
  createAudit,
  updateAudit,
  deleteAudit,
  getConfig,
  saveConfig,
  getDashboardStats,
} from '../services/auditService';
import type { DashboardStats } from '../types';

// ─── Audit Store ──────────────────────────────────────────────────────────────

interface AuditState {
  audits:    Audit[];
  current:   Audit | null;
  stats:     DashboardStats | null;
  loading:   boolean;

  loadAll:    () => void;
  loadById:   (id: string) => void;
  loadStats:  () => void;
  create:     (data: Partial<Audit>) => Audit;
  update:     (id: string, changes: Partial<Audit>) => Audit | null;
  remove:     (id: string) => void;
  setCurrent: (audit: Audit | null) => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  audits:  [],
  current: null,
  stats:   null,
  loading: false,

  loadAll: () => {
    set({ loading: true });
    const audits = getAllAudits();
    set({ audits, loading: false });
  },

  loadById: (id) => {
    const current = getAuditById(id) ?? null;
    set({ current });
  },

  loadStats: () => {
    const stats = getDashboardStats();
    set({ stats });
  },

  create: (data) => {
    const audit = createAudit(data);
    set(s => ({ audits: [audit, ...s.audits], current: audit }));
    return audit;
  },

  update: (id, changes) => {
    const updated = updateAudit(id, changes);
    if (!updated) return null;
    set(s => ({
      audits:  s.audits.map(a => a.id === id ? updated : a),
      current: s.current?.id === id ? updated : s.current,
    }));
    return updated;
  },

  remove: (id) => {
    deleteAudit(id);
    set(s => ({
      audits:  s.audits.filter(a => a.id !== id),
      current: s.current?.id === id ? null : s.current,
    }));
  },

  setCurrent: (audit) => set({ current: audit }),
}));

// ─── Config Store ─────────────────────────────────────────────────────────────

interface ConfigState {
  config: AppConfig;
  loadConfig:  () => void;
  updateConfig: (cfg: AppConfig) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: getConfig(),

  loadConfig: () => {
    set({ config: getConfig() });
  },

  updateConfig: (cfg) => {
    saveConfig(cfg);
    set({ config: cfg });
  },
}));

// ─── UI / Navigation store ────────────────────────────────────────────────────

interface UIState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebar: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebar:    (open) => set({ sidebarOpen: open }),
}));

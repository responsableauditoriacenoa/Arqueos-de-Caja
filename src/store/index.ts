import { create } from 'zustand';
import type { Audit, AppConfig } from '../types';
import { DEFAULT_CONFIG } from '../constants';
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
  error:     string | null;

  loadAll:    () => Promise<void>;
  loadById:   (id: string) => Promise<void>;
  loadStats:  () => Promise<void>;
  create:     (data: Partial<Audit>) => Promise<Audit>;
  update:     (id: string, changes: Partial<Audit>) => Promise<Audit | null>;
  remove:     (id: string) => Promise<void>;
  setCurrent: (audit: Audit | null) => void;
}

export const useAuditStore = create<AuditState>((set) => ({
  audits:  [],
  current: null,
  stats:   null,
  loading: false,
  error:   null,

  loadAll: async () => {
    set({ loading: true, error: null });
    try {
      const audits = await getAllAudits();
      set({ audits, loading: false });
    } catch (error) {
      set({ loading: false, error: error instanceof Error ? error.message : 'Error al cargar auditorias.' });
    }
  },

  loadById: async (id) => {
    set({ loading: true, error: null });
    try {
      const current = await getAuditById(id);
      set({ current: current ?? null, loading: false });
    } catch (error) {
      set({ current: null, loading: false, error: error instanceof Error ? error.message : 'Error al cargar auditoria.' });
    }
  },

  loadStats: async () => {
    try {
      const stats = await getDashboardStats();
      set({ stats, error: null });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Error al cargar estadisticas.' });
    }
  },

  create: async (data) => {
    const audit = await createAudit(data);
    set((state) => ({ audits: [audit, ...state.audits], current: audit, error: null }));
    return audit;
  },

  update: async (id, changes) => {
    const updated = await updateAudit(id, changes);
    if (!updated) return null;
    set((state) => ({
      audits:  state.audits.map((audit) => audit.id === id ? updated : audit),
      current: state.current?.id === id ? updated : state.current,
      error: null,
    }));
    return updated;
  },

  remove: async (id) => {
    await deleteAudit(id);
    set((state) => ({
      audits:  state.audits.filter((audit) => audit.id !== id),
      current: state.current?.id === id ? null : state.current,
      error: null,
    }));
  },

  setCurrent: (audit) => set({ current: audit }),
}));

// ─── Config Store ─────────────────────────────────────────────────────────────

interface ConfigState {
  config: AppConfig;
  loading: boolean;
  loadConfig:  () => Promise<void>;
  updateConfig: (cfg: AppConfig) => Promise<void>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: DEFAULT_CONFIG,
  loading: false,

  loadConfig: async () => {
    set({ loading: true });
    const config = await getConfig();
    set({ config, loading: false });
  },

  updateConfig: async (cfg) => {
    const config = await saveConfig(cfg);
    set({ config, loading: false });
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

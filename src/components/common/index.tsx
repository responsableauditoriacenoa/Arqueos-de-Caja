import React from 'react';
import { clsx } from '../../utils/formatters';

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  className?: string;
  children: React.ReactNode;
  padding?: boolean;
}
export function Card({ className, children, padding = true }: CardProps) {
  return (
    <div className={clsx('card', padding && 'p-5', className)}>
      {children}
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

import type { AuditStatus } from '../../types';
import { STATUS_LABEL } from '../../constants';

const STATUS_CLASS: Record<AuditStatus, string> = {
  borrador: 'badge-draft',
  abierta:  'badge-open',
  revision: 'badge-review',
  cerrada:  'badge-closed',
};

export function StatusBadge({ status }: { status: AuditStatus }) {
  return (
    <span className={STATUS_CLASS[status]}>
      {STATUS_LABEL[status]}
    </span>
  );
}

// ─── Compliance Bar ───────────────────────────────────────────────────────────

import { getComplianceBarColor, getComplianceColor } from '../../constants';
import { formatPercent } from '../../utils/formatters';

interface ComplianceBarProps {
  value: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}
export function ComplianceBar({ value, showLabel = true, size = 'md' }: ComplianceBarProps) {
  const h = size === 'sm' ? 'h-1.5' : 'h-2';
  return (
    <div className="flex items-center gap-2">
      <div className={clsx('flex-1 bg-surface-100 rounded-full', h)}>
        <div
          className={clsx('rounded-full transition-all duration-500', h, getComplianceBarColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
      {showLabel && (
        <span className={clsx('text-xs font-semibold w-9 text-right', getComplianceColor(value))}>
          {formatPercent(value)}
        </span>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-surface-300 mb-4">{icon}</div>}
      <p className="text-surface-700 font-semibold text-base">{title}</p>
      {description && <p className="text-surface-400 text-sm mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}
export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="page-title">{title}</h2>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string; // tailwind bg color class
  change?: string;
}
export function StatCard({ label, value, icon, color, change }: StatCardProps) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', color)}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-surface-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-surface-900 mt-0.5">{value}</p>
        {change && <p className="text-xs text-surface-400 mt-0.5">{change}</p>}
      </div>
    </div>
  );
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────

export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12';
  return (
    <div className="flex items-center justify-center py-8">
      <div className={clsx('animate-spin rounded-full border-2 border-surface-200 border-t-brand-600', s)} />
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────

type AlertVariant = 'info' | 'success' | 'warning' | 'error';
const ALERT_CLASSES: Record<AlertVariant, string> = {
  info:    'bg-brand-50 text-brand-700 border-brand-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error:   'bg-red-50 text-red-700 border-red-200',
};

interface AlertProps {
  variant?: AlertVariant;
  children: React.ReactNode;
  className?: string;
}
export function Alert({ variant = 'info', children, className }: AlertProps) {
  return (
    <div className={clsx('flex gap-3 p-4 rounded-xl border text-sm', ALERT_CLASSES[variant], className)}>
      {children}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="divider" />;
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-surface-100" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-surface-50 px-3 text-xs text-surface-400 font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Page Wrapper ─────────────────────────────────────────────────────────────

export function PageWrapper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('max-w-7xl mx-auto', className)}>
      {children}
    </div>
  );
}

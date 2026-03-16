import { useForm, useFieldArray } from 'react-hook-form';
import {
  Building2, Plus, Trash2, Save, Sliders,
  FileText, Percent,
} from 'lucide-react';
import { useConfigStore } from '../store';
import { useToast } from '../components/common/Toast';
import { PageWrapper, SectionHeader, Card, Alert } from '../components/common';
import type { AppConfig } from '../types';

// ─── Section: Companies ───────────────────────────────────────────────────────

function CompaniesSection() {
  const { config, updateConfig } = useConfigStore();
  const { addToast } = useToast();
  const { register, control, handleSubmit } = useForm({
    defaultValues: {
      empresas: config.empresas.map(nombre => ({ nombre })),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'empresas' });

  const onSubmit = (data: { empresas: { nombre: string }[] }) => {
    const empresas = Array.from(
      new Set(data.empresas.map(e => e.nombre.trim()).filter(Boolean))
    );

    if (empresas.length === 0) {
      addToast('Debe haber al menos una empresa activa', 'error');
      return;
    }

    const empresa = empresas.includes(config.empresa) ? config.empresa : empresas[0];
    updateConfig({ ...config, empresas, empresa });
    addToast('Empresas guardadas', 'success');
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={18} className="text-brand-500" />
        <h3 className="section-title">Empresas</h3>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-surface-400">No hay empresas cargadas</p>
        )}
        {fields.map((f, i) => (
          <div key={f.id} className="flex items-center gap-2">
            <input
              type="text"
              className="form-input flex-1"
              placeholder="Nombre de empresa"
              {...register(`empresas.${i}.nombre`)}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            className="btn-ghost btn btn-sm"
            onClick={() => append({ nombre: '' })}
          >
            <Plus size={13} /> Agregar Empresa
          </button>
          <button type="submit" className="btn-primary btn btn-sm">
            <Save size={13} /> Guardar
          </button>
        </div>
      </form>
    </Card>
  );
}

// ─── Section: Branches ────────────────────────────────────────────────────────

function BranchesSection() {
  const { config, updateConfig } = useConfigStore();
  const { addToast } = useToast();
  const companyBranches = config.sucursales.filter(s => s.empresa === config.empresa);
  const { register, control, handleSubmit } = useForm({
    defaultValues: { sucursales: companyBranches },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'sucursales' });

  const onSubmit = (data: { sucursales: AppConfig['sucursales'] }) => {
    const others = config.sucursales.filter(s => s.empresa !== config.empresa);
    const current = data.sucursales.map((s, idx) => ({
      ...s,
      id: s.id || `suc-${Date.now()}-${idx}`,
      empresa: config.empresa,
      nombre: s.nombre.trim(),
      codigo: s.codigo.trim(),
      activa: s.activa ?? true,
    })).filter(s => s.nombre);

    updateConfig({ ...config, sucursales: [...others, ...current] });
    addToast('Sucursales guardadas', 'success');
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Building2 size={18} className="text-brand-500" />
        <h3 className="section-title">Sucursales / Unidades · {config.empresa}</h3>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {fields.length === 0 && (
          <p className="text-sm text-surface-400">No hay sucursales cargadas para esta empresa</p>
        )}
        {fields.map((f, i) => (
          <div key={f.id} className="flex items-center gap-2">
            <input type="hidden" {...register(`sucursales.${i}.id`)} />
            <input type="hidden" {...register(`sucursales.${i}.empresa`)} />
            <input
              type="text"
              className="form-input flex-1"
              placeholder="Nombre de sucursal"
              {...register(`sucursales.${i}.nombre`)}
            />
            <input
              type="text"
              className="form-input w-20"
              placeholder="Código"
              {...register(`sucursales.${i}.codigo`)}
            />
            <label className="flex items-center gap-1.5 text-xs text-surface-600 whitespace-nowrap">
              <input type="checkbox" className="rounded" {...register(`sucursales.${i}.activa`)} />
              Activa
            </label>
            <button
              type="button"
              onClick={() => remove(i)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            className="btn-ghost btn btn-sm"
            onClick={() => append({ id: `suc-${Date.now()}`, empresa: config.empresa, nombre: '', codigo: '', activa: true })}
          >
            <Plus size={13} /> Agregar Sucursal
          </button>
          <button type="submit" className="btn-primary btn btn-sm">
            <Save size={13} /> Guardar
          </button>
        </div>
      </form>
    </Card>
  );
}

// ─── Section: Rubric weights ──────────────────────────────────────────────────

function RubricWeightsSection() {
  const { config, updateConfig } = useConfigStore();
  const { addToast } = useToast();
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      rubros: config.rubros.map(r => ({ ...r, peso: String(r.peso) })),
    },
  });

  const rubros = watch('rubros');
  const totalPeso = rubros.reduce((s, r) => s + (parseInt(r.peso) || 0), 0);

  const onSubmit = (data: { rubros: { key: string; nombre: string; peso: string; orden: number }[] }) => {
    if (totalPeso !== 100) {
      addToast('Los pesos deben sumar exactamente 100%', 'error');
      return;
    }
    updateConfig({
      ...config,
      rubros: data.rubros.map(r => ({
        ...r,
        peso: parseInt(r.peso) || 0,
        key: r.key as any,
      })),
    });
    addToast('Ponderaciones guardadas', 'success');
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Percent size={18} className="text-amber-500" />
        <h3 className="section-title">Ponderaciones por Rubro</h3>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {config.rubros.map((r, i) => (
          <div key={r.key} className="flex items-center gap-3">
            <input type="hidden" {...register(`rubros.${i}.key`)} />
            <input type="hidden" {...register(`rubros.${i}.orden`)} />
            <div className="flex-1">
              <input
                type="text"
                className="form-input"
                {...register(`rubros.${i}.nombre`)}
              />
            </div>
            <div className="w-24 relative">
              <input
                type="number"
                min={0}
                max={100}
                className="form-input pr-7"
                {...register(`rubros.${i}.peso`)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 text-sm">%</span>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between pt-2 border-t border-surface-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-surface-500">Total:</span>
            <span className={`text-sm font-bold ${totalPeso === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
              {totalPeso}%
            </span>
            {totalPeso !== 100 && (
              <span className="text-xs text-red-500">Debe ser exactamente 100%</span>
            )}
          </div>
          <button type="submit" className="btn-primary btn btn-sm" disabled={totalPeso !== 100}>
            <Save size={13} /> Guardar
          </button>
        </div>
      </form>
    </Card>
  );
}

// ─── Section: General ─────────────────────────────────────────────────────────

function GeneralSection() {
  const { config, updateConfig } = useConfigStore();
  const { addToast } = useToast();
  const { register, handleSubmit } = useForm({
    defaultValues: {
      empresa: config.empresa,
      pieDeInforme: config.pieDeInforme,
    },
  });

  const onSubmit = (data: { empresa: string; pieDeInforme: string }) => {
    updateConfig({ ...config, ...data });
    addToast('Parámetros generales guardados', 'success');
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Sliders size={18} className="text-surface-500" />
        <h3 className="section-title">Parámetros Generales</h3>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="form-label">Empresa Activa</label>
          <select className="form-select" {...register('empresa')}>
            {config.empresas.map(nombre => (
              <option key={nombre} value={nombre}>{nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label">Pie de Informe</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Texto de confidencialidad o nota al pie del informe"
            {...register('pieDeInforme')}
          />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="btn-primary btn btn-sm">
            <Save size={13} /> Guardar
          </button>
        </div>
      </form>
    </Card>
  );
}

// ─── Main Settings Page ───────────────────────────────────────────────────────

export default function Settings() {
  const { config } = useConfigStore();

  return (
    <PageWrapper className="max-w-3xl">
      <SectionHeader
        title="Configuración"
        subtitle="Administrá los parámetros del sistema de auditorías"
      />

      <div className="space-y-5">
        <GeneralSection />
        <CompaniesSection />
        <BranchesSection key={config.empresa} />
        <RubricWeightsSection />

        <Alert variant="info">
          <FileText size={14} />
          <span className="text-xs">
            Los cambios de ponderación afectarán el cálculo de nuevas auditorías. Las auditorías ya cerradas mantienen su resultado original.
          </span>
        </Alert>
      </div>
    </PageWrapper>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { useForm } from 'react-hook-form';
import {
  PenLine, RotateCcw, CheckCircle2, Lock, AlertTriangle,
  User, Users, Save,
} from 'lucide-react';
import { useAuditStore } from '../store';
import { useToast } from '../components/common/Toast';
import { Card, Alert } from '../components/common';
import { clsx, formatDate } from '../utils/formatters';
import type { Signature, SignatureType } from '../types';

function nextId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

interface SignaturePanelProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tipo: SignatureType;
  savedSignature?: Signature;
  defaultNombre?: string;
  onSave: (tipo: SignatureType, img: string, nombre: string, cargo: string) => void;
  onClear: (tipo: SignatureType) => void;
}

function SignaturePanel({
  title, subtitle, icon, tipo, savedSignature, defaultNombre, onSave, onClear,
}: SignaturePanelProps) {
  const sigRef = React.useRef<SignatureCanvas>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<{ nombre: string; cargo: string }>({
    defaultValues: {
      nombre: savedSignature?.nombreAclaratorio ?? defaultNombre ?? '',
      cargo:  savedSignature?.cargo ?? '',
    },
  });

  const submit = (data: { nombre: string; cargo: string }) => {
    if (sigRef.current?.isEmpty()) {
      return;
    }
    const img = sigRef.current!.toDataURL('image/png');
    onSave(tipo, img, data.nombre, data.cargo);
  };

  const clearCanvas = () => {
    sigRef.current?.clear();
  };

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-surface-800">{title}</h3>
          <p className="text-xs text-surface-500">{subtitle}</p>
        </div>
        {savedSignature && (
          <div className="ml-auto flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
            <CheckCircle2 size={14} /> Firmado
          </div>
        )}
      </div>

      {/* If already signed, show preview */}
      {savedSignature ? (
        <div className="space-y-3">
          <div className="border border-surface-200 rounded-xl p-3 bg-surface-50 flex flex-col items-center">
            <img
              src={savedSignature.imagen}
              alt="Firma"
              className="max-h-24 object-contain"
            />
            <div className="mt-2 text-center">
              <p className="text-sm font-semibold text-surface-800">{savedSignature.nombreAclaratorio}</p>
              <p className="text-xs text-surface-500">{savedSignature.cargo}</p>
              <p className="text-xs text-surface-400 mt-0.5">Firmado el {formatDate(savedSignature.fecha, 'd MMM yyyy HH:mm')}</p>
            </div>
          </div>
          <button
            className="btn-ghost btn btn-sm w-full text-red-500 hover:bg-red-50"
            onClick={() => onClear(tipo)}
          >
            <RotateCcw size={13} /> Rehacer firma
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(submit)} className="space-y-3">
          {/* Signature canvas */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="form-label mb-0">Firma digital *</label>
              <button
                type="button"
                className="text-xs text-surface-400 hover:text-surface-600 flex items-center gap-1"
                onClick={clearCanvas}
              >
                <RotateCcw size={11} /> Limpiar
              </button>
            </div>
            <div className="border-2 border-dashed border-surface-300 rounded-xl overflow-hidden bg-white hover:border-brand-400 transition-colors">
              <SignatureCanvas
                ref={sigRef}
                canvasProps={{
                  className: 'w-full',
                  style: { height: 140, display: 'block' },
                }}
                backgroundColor="transparent"
                penColor="#1e293b"
              />
            </div>
            <p className="text-xs text-surface-400 mt-1">Dibuje su firma en el área punteada</p>
          </div>

          {/* Name & role */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Nombre Aclaratorio *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nombre y apellido"
                {...register('nombre', { required: 'Requerido' })}
              />
              {errors.nombre && <p className="form-error">{errors.nombre.message}</p>}
            </div>
            <div>
              <label className="form-label">Cargo / Función</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Auditor Interno"
                {...register('cargo')}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary btn w-full">
            <Save size={14} /> Confirmar Firma
          </button>
        </form>
      )}
    </Card>
  );
}

// ─── Main Signatures Page ─────────────────────────────────────────────────────

export default function AuditSignatures() {
  const navigate  = useNavigate();
  const { current, update } = useAuditStore();
  const { addToast } = useToast();

  if (!current) return null;

  const sigAuditor      = current.firmas.find(f => f.tipo === 'auditor');
  const sigResponsable  = current.firmas.find(f => f.tipo === 'responsable');
  const bothSigned      = !!sigAuditor && !!sigResponsable;

  const handleSave = (tipo: SignatureType, img: string, nombre: string, cargo: string) => {
    const sig: Signature = {
      id: nextId(),
      auditoriaId: current.id,
      tipo,
      imagen: img,
      nombreAclaratorio: nombre,
      cargo,
      fecha: new Date().toISOString(),
    };
    const others = current.firmas.filter(f => f.tipo !== tipo);
    update(current.id, { firmas: [...others, sig] });
    addToast(`Firma de ${tipo === 'auditor' ? 'auditor' : 'responsable'} registrada`, 'success');
  };

  const handleClear = (tipo: SignatureType) => {
    update(current.id, { firmas: current.firmas.filter(f => f.tipo !== tipo) });
  };

  const closeAudit = () => {
    if (!bothSigned) {
      addToast('Ambas firmas son necesarias para cerrar la auditoría', 'error');
      return;
    }
    const rubros = current.rubros;
    if (rubros.length === 0) {
      addToast('Debe completar al menos un rubro antes de cerrar', 'error');
      return;
    }
    update(current.id, { estado: 'cerrada' });
    addToast('Auditoría cerrada exitosamente', 'success');
    navigate(`/auditoria/${current.id}/informe`);
  };

  return (
    <div className="space-y-5">
      {/* Status bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-surface-700">Estado de Firmas</span>
          <div className="flex items-center gap-3">
            <div className={clsx('flex items-center gap-1.5 text-xs font-medium', sigAuditor ? 'text-emerald-600' : 'text-surface-400')}>
              {sigAuditor ? <CheckCircle2 size={13} /> : <PenLine size={13} />}
              Auditor
            </div>
            <div className={clsx('flex items-center gap-1.5 text-xs font-medium', sigResponsable ? 'text-emerald-600' : 'text-surface-400')}>
              {sigResponsable ? <CheckCircle2 size={13} /> : <PenLine size={13} />}
              Responsable
            </div>
          </div>
        </div>
      </div>

      {!bothSigned && (
        <Alert variant="warning">
          <AlertTriangle size={15} />
          <span className="text-xs">
            Ambas firmas son <strong>obligatorias</strong> para poder cerrar la auditoría y generar el informe final.
          </span>
        </Alert>
      )}

      {/* Signature panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <SignaturePanel
          title="Firma del Auditor"
          subtitle="Responsable que ejecutó la auditoría"
          icon={<User size={18} className="text-brand-600" />}
          tipo="auditor"
          savedSignature={sigAuditor}
          defaultNombre={current.auditor}
          onSave={handleSave}
          onClear={handleClear}
        />
        <SignaturePanel
          title="Firma del Responsable"
          subtitle="Titular del sector auditado"
          icon={<Users size={18} className="text-brand-600" />}
          tipo="responsable"
          savedSignature={sigResponsable}
          defaultNombre={current.responsable}
          onSave={handleSave}
          onClear={handleClear}
        />
      </div>

      {/* Close audit button */}
      {current.estado !== 'cerrada' && (
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-surface-800">Cerrar Auditoría</h3>
              <p className="text-xs text-surface-500 mt-0.5">
                Cierra el proceso y genera el resultado final.
                {!bothSigned && ' Requiere ambas firmas.'}
              </p>
            </div>
            <button
              className={clsx('btn btn-lg', bothSigned ? 'btn-primary' : 'btn-secondary opacity-60')}
              onClick={closeAudit}
              disabled={!bothSigned}
            >
              <Lock size={15} /> Cerrar y Finalizar
            </button>
          </div>
        </div>
      )}

      {current.estado === 'cerrada' && (
        <Alert variant="success">
          <CheckCircle2 size={15} />
          <span className="text-xs font-medium">
            Auditoría cerrada. Cumplimiento final: <strong>{current.cumplimientoTotal}%</strong> — {current.resultadoFinal}
          </span>
        </Alert>
      )}
    </div>
  );
}

import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, Plus, Search, ChevronDown, ChevronUp,
  Trash2, Edit2, X, Check, AlertCircle, Rocket,
  Megaphone, Package, Gift, BarChart2, Layers,
  ExternalLink, Clock,
} from 'lucide-react';

import {
  MoldeyTask, MoldeyLaunch, MoldeyCampaign, MoldeyCustomOrder, MoldeyFreeProduct,
  KanbanColumn, Priority, TaskType, Category, PaymentStatus, DeliveryStatus,
  MarketingChannel, SaleChannel,
  KANBAN_COLUMNS, PRIORITY_CONFIG, TASK_TYPE_LABELS, CATEGORY_LABELS,
  MARKETING_CHANNELS, SALE_CHANNELS, EMPTY_CHECKLIST, EMPTY_TASK, CHECKLIST_LABELS,
  ProductionChecklist,
} from '../lib/agendaMoldeyTypes';

import {
  getTasks, createTask, updateTask, deleteTask,
  getLaunches, createLaunch, updateLaunch, deleteLaunch,
  getCampaigns, createCampaign, updateCampaign, deleteCampaign,
  getCustomOrders, createCustomOrder, updateCustomOrder, deleteCustomOrder,
  getFreeProducts, createFreeProduct, updateFreeProduct, deleteFreeProduct,
} from '../lib/agendaMoldey';

// ─── Types ────────────────────────────────────────────────────────────────────
type ActiveView = 'kanban' | 'kanban-op' | 'lista' | 'lanzamientos' | 'campanas' | 'produccion' | 'pedidos' | 'gratis' | 'ventas';

// ─── KANBAN OP Types ──────────────────────────────────────────────────────────
type OpStatus = 'pendiente' | 'en_proceso' | 'en_revision' | 'esperando' | 'terminado';
type OpType = 'tarea_interna' | 'seguimiento' | 'correccion' | 'pedido_rapido' | 'administracion' | 'cliente' | 'producto' | 'publicacion' | 'otro';

interface OpTask {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: OpStatus;
  due_date: string | null;
  responsible: string;
  simple_type: OpType;
  notes: string;
  created_at: string;
}

const OP_COLUMNS: { id: OpStatus; label: string; color: string }[] = [
  { id: 'pendiente',    label: 'Pendiente',    color: 'bg-carbon-800 border-carbon-600' },
  { id: 'en_proceso',   label: 'En proceso',   color: 'bg-blue-900/30 border-blue-700/40' },
  { id: 'en_revision',  label: 'En revisión',  color: 'bg-amber-900/20 border-amber-700/30' },
  { id: 'esperando',    label: 'Esperando',    color: 'bg-navy-700 border-navy-500' },
  { id: 'terminado',    label: 'Terminado',    color: 'bg-emerald-900/20 border-emerald-700/30' },
];

const OP_TYPE_LABELS: Record<OpType, string> = {
  tarea_interna: 'Tarea interna', seguimiento: 'Seguimiento', correccion: 'Corrección',
  pedido_rapido: 'Pedido rápido', administracion: 'Administración', cliente: 'Cliente',
  producto: 'Producto', publicacion: 'Publicación', otro: 'Otro',
};

const EMPTY_OP_TASK: Omit<OpTask, 'id' | 'created_at'> = {
  title: '', description: '', priority: 'media', status: 'pendiente',
  due_date: null, responsible: '', simple_type: 'tarea_interna', notes: '',
};

// ─── KANBAN OP localStorage helpers ──────────────────────────────────────────
const OP_KEY = 'moldey_op_tasks';
function getOpTasks(): OpTask[] {
  try { return JSON.parse(localStorage.getItem(OP_KEY) ?? '[]'); } catch { return []; }
}
function saveOpTasks(tasks: OpTask[]) { localStorage.setItem(OP_KEY, JSON.stringify(tasks)); }
function createOpTask(data: Omit<OpTask, 'id' | 'created_at'>): OpTask {
  const t: OpTask = { ...data, id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(), created_at: new Date().toISOString() };
  saveOpTasks([...getOpTasks(), t]); return t;
}
function updateOpTask(id: string, data: Partial<Omit<OpTask, 'id' | 'created_at'>>): OpTask {
  const tasks = getOpTasks().map(t => t.id === id ? { ...t, ...data } : t);
  saveOpTasks(tasks); return tasks.find(t => t.id === id)!;
}
function deleteOpTask(id: string) { saveOpTasks(getOpTasks().filter(t => t.id !== id)); }

interface Filters {
  search: string;
  priority: string;
  taskType: string;
  category: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const INPUT_CLS = 'w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2 text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm';
const LABEL_CLS = 'block text-xs font-medium text-carbon-400 mb-1';
const SECTION_CLS = 'bg-navy-800 border border-navy-600 rounded-xl p-4 space-y-3';

const CUSTOM_ORDER_STATUS_COLORS: Record<string, string> = {
  consulta: 'bg-carbon-700 text-carbon-300',
  analisis: 'bg-blue-900/60 text-blue-300',
  presupuesto_enviado: 'bg-indigo-900/60 text-indigo-300',
  esperando_confirmacion: 'bg-amber-900/60 text-amber-300',
  aprobado: 'bg-emerald-900/60 text-emerald-300',
  en_produccion: 'bg-violet-900/60 text-violet-300',
  revision_tecnica: 'bg-orange-900/60 text-orange-300',
  listo_entregar: 'bg-teal-900/60 text-teal-300',
  entregado: 'bg-green-900/60 text-green-300',
  correccion: 'bg-red-900/60 text-red-300',
  finalizado: 'bg-carbon-800 text-carbon-400',
  cancelado: 'bg-red-950 text-red-500',
};

const CUSTOM_ORDER_STATUS_LABELS: Record<string, string> = {
  consulta: 'Consulta',
  analisis: 'En análisis',
  presupuesto_enviado: 'Presupuesto enviado',
  esperando_confirmacion: 'Esperando confirmación',
  aprobado: 'Aprobado',
  en_produccion: 'En producción',
  revision_tecnica: 'Revisión técnica',
  listo_entregar: 'Listo para entregar',
  entregado: 'Entregado',
  correccion: 'Con correcciones',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

const LAUNCH_STATUS_COLORS: Record<string, string> = {
  planificado: 'bg-blue-900/60 text-blue-300',
  atrasado: 'bg-red-900/60 text-red-300',
  listo: 'bg-green-900/60 text-green-300',
  publicado: 'bg-emerald-900/60 text-emerald-300',
  necesita_campana: 'bg-amber-900/60 text-amber-300',
  relanzar: 'bg-orange-900/60 text-orange-300',
};

const LAUNCH_STATUS_LABELS: Record<string, string> = {
  planificado: 'Planificado',
  atrasado: 'Atrasado',
  listo: 'Listo',
  publicado: 'Publicado',
  necesita_campana: 'Necesita campaña',
  relanzar: 'Relanzar',
};

const CAMPAIGN_STATUS_COLORS: Record<string, string> = {
  borrador: 'bg-carbon-700 text-carbon-300',
  programada: 'bg-blue-900/60 text-blue-300',
  activa: 'bg-emerald-900/60 text-emerald-300',
  pausada: 'bg-amber-900/60 text-amber-300',
  finalizada: 'bg-carbon-800 text-carbon-400',
  mejorar_repetir: 'bg-orange-900/60 text-orange-300',
};

const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  programada: 'Programada',
  activa: 'Activa',
  pausada: 'Pausada',
  finalizada: 'Finalizada',
  mejorar_repetir: 'Mejorar / repetir',
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  pendiente: 'bg-carbon-700 text-carbon-300',
  parcial: 'bg-amber-900/60 text-amber-300',
  pagado: 'bg-emerald-900/60 text-emerald-300',
  cancelado: 'bg-red-900/60 text-red-300',
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pendiente: 'Pendiente',
  parcial: 'Parcial',
  pagado: 'Pagado',
  cancelado: 'Cancelado',
};

const FREE_PRODUCT_OBJECTIVE_LABELS: Record<string, string> = {
  captar_clientes: 'Captar clientes',
  generar_confianza: 'Generar confianza',
  traer_trafico: 'Traer tráfico',
  probar_calidad: 'Probar calidad',
  otro: 'Otro',
};

// ─── Helper components ────────────────────────────────────────────────────────

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function EmptyState({ message, icon: Icon }: { message: string; icon?: React.ElementType }) {
  const I = Icon ?? CalendarDays;
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <I size={40} className="text-carbon-600 mb-3" />
      <p className="text-carbon-400 text-sm">{message}</p>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl p-4 flex flex-col gap-1 min-w-[130px]">
      <span className={`text-2xl font-bold ${color ?? 'text-gold-400'}`}>{value}</span>
      <span className="text-xs text-carbon-400 leading-tight">{label}</span>
    </div>
  );
}

// ─── Checklist progress ───────────────────────────────────────────────────────
function checklistProgress(checklist: ProductionChecklist): { done: number; total: number } {
  const keys = Object.keys(checklist) as (keyof ProductionChecklist)[];
  const done = keys.filter((k) => checklist[k]).length;
  return { done, total: keys.length };
}

// ─── TASK MODAL ───────────────────────────────────────────────────────────────
interface TaskModalProps {
  task: MoldeyTask | null;
  defaultColumn?: KanbanColumn;
  onClose: () => void;
  onSave: (task: Omit<MoldeyTask, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
}

function TaskModal({ task, defaultColumn, onClose, onSave }: TaskModalProps) {
  const [form, setForm] = useState<Omit<MoldeyTask, 'id' | 'created_at' | 'updated_at'>>(
    task
      ? { ...task }
      : { ...EMPTY_TASK, status: defaultColumn ?? 'ideas', checklist: { ...EMPTY_CHECKLIST } }
  );
  const [saving, setSaving] = useState(false);
  const [clientOpen, setClientOpen] = useState(false);
  const [commercialOpen, setCommercialOpen] = useState(false);

  const set = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const toggleChannel = <T extends string>(arr: T[], val: T): T[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const cl = form.checklist;
  const { done, total } = checklistProgress(cl);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="bg-navy-900 border border-navy-600 rounded-2xl w-full max-w-3xl my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-600">
          <h2 className="text-lg font-bold text-white">{task ? 'Editar tarea' : 'Nueva tarea'}</h2>
          <button onClick={onClose} className="text-carbon-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Section 1: Información básica */}
          <div className={SECTION_CLS}>
            <h3 className="text-sm font-semibold text-gold-400 mb-2">Información básica</h3>
            <div>
              <label className={LABEL_CLS}>Título *</label>
              <input className={INPUT_CLS} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Nombre de la tarea" required />
            </div>
            <div>
              <label className={LABEL_CLS}>Descripción</label>
              <textarea className={INPUT_CLS} rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descripción breve" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Tipo de tarea</label>
                <select className={INPUT_CLS} value={form.task_type} onChange={e => set('task_type', e.target.value as TaskType)}>
                  {Object.entries(TASK_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Columna / Estado</label>
                <select className={INPUT_CLS} value={form.status} onChange={e => set('status', e.target.value as KanbanColumn)}>
                  {KANBAN_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Prioridad</label>
                <select className={INPUT_CLS} value={form.priority} onChange={e => set('priority', e.target.value as Priority)}>
                  {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Categoría</label>
                <select className={INPUT_CLS} value={form.category ?? ''} onChange={e => set('category', e.target.value as Category || null)}>
                  <option value="">Sin categoría</option>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Responsable</label>
                <input className={INPUT_CLS} value={form.responsible} onChange={e => set('responsible', e.target.value)} placeholder="Nombre" />
              </div>
            </div>
          </div>

          {/* Section 2: Fechas */}
          <div className={SECTION_CLS}>
            <h3 className="text-sm font-semibold text-gold-400 mb-2">Fechas</h3>
            <div className="grid grid-cols-2 gap-3">
              {([
                ['start_date', 'Fecha de inicio'],
                ['due_date', 'Fecha límite'],
                ['launch_date', 'Fecha de lanzamiento'],
                ['delivery_date', 'Fecha de entrega al cliente'],
              ] as [keyof typeof form, string][]).map(([field, label]) => (
                <div key={field}>
                  <label className={LABEL_CLS}>{label}</label>
                  <input
                    type="date"
                    className={INPUT_CLS}
                    value={(form[field] as string | null) ?? ''}
                    onChange={e => set(field, e.target.value || null)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Cliente (collapsible) */}
          <div className={SECTION_CLS}>
            <button type="button" className="flex items-center gap-2 w-full text-left" onClick={() => setClientOpen(p => !p)}>
              <h3 className="text-sm font-semibold text-gold-400">Cliente</h3>
              {clientOpen ? <ChevronUp size={14} className="text-carbon-400" /> : <ChevronDown size={14} className="text-carbon-400" />}
            </button>
            {clientOpen && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className={LABEL_CLS}>Nombre del cliente</label>
                  <input className={INPUT_CLS} value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="Nombre" />
                </div>
                <div>
                  <label className={LABEL_CLS}>Contacto del cliente</label>
                  <input className={INPUT_CLS} value={form.client_contact} onChange={e => set('client_contact', e.target.value)} placeholder="WhatsApp / email" />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLS}>Link de referencia</label>
                  <input className={INPUT_CLS} value={form.reference_link} onChange={e => set('reference_link', e.target.value)} placeholder="https://..." />
                </div>
                <div className="col-span-2">
                  <label className={LABEL_CLS}>Notas del cliente</label>
                  <textarea className={INPUT_CLS} rows={2} value={form.client_notes} onChange={e => set('client_notes', e.target.value)} />
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Comercial (collapsible) */}
          <div className={SECTION_CLS}>
            <button type="button" className="flex items-center gap-2 w-full text-left" onClick={() => setCommercialOpen(p => !p)}>
              <h3 className="text-sm font-semibold text-gold-400">Comercial</h3>
              {commercialOpen ? <ChevronUp size={14} className="text-carbon-400" /> : <ChevronDown size={14} className="text-carbon-400" />}
            </button>
            {commercialOpen && (
              <div className="space-y-3 mt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={LABEL_CLS}>Producto relacionado</label>
                    <input className={INPUT_CLS} value={form.related_product} onChange={e => set('related_product', e.target.value)} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Pack relacionado</label>
                    <input className={INPUT_CLS} value={form.related_pack} onChange={e => set('related_pack', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>Canales de venta</label>
                  <div className="flex flex-wrap gap-2">
                    {SALE_CHANNELS.map(sc => (
                      <label key={sc.value} className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={form.sale_channels.includes(sc.value)} onChange={() => set('sale_channels', toggleChannel(form.sale_channels, sc.value))} className="accent-gold-500" />
                        <span className="text-xs text-carbon-300">{sc.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={LABEL_CLS}>Canales de marketing</label>
                  <div className="flex flex-wrap gap-2">
                    {MARKETING_CHANNELS.map(mc => (
                      <label key={mc.value} className="flex items-center gap-1 cursor-pointer">
                        <input type="checkbox" checked={form.marketing_channels.includes(mc.value as MarketingChannel)} onChange={() => set('marketing_channels', toggleChannel(form.marketing_channels, mc.value as MarketingChannel))} className="accent-gold-500" />
                        <span className="text-xs text-carbon-300">{mc.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['estimated_price', 'Precio estimado'],
                    ['final_price', 'Precio final'],
                    ['advance_payment', 'Seña / adelanto'],
                    ['sales_goal', 'Meta de ventas'],
                    ['sales_result', 'Resultado real'],
                  ] as [keyof typeof form, string][]).map(([field, label]) => (
                    <div key={field}>
                      <label className={LABEL_CLS}>{label}</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        className={INPUT_CLS}
                        value={form[field] as number}
                        onChange={e => {
                          const val = parseFloat(e.target.value) || 0;
                          if (field === 'advance_payment') {
                            set('advance_payment', val);
                            set('balance', (form.final_price) - val);
                          } else if (field === 'final_price') {
                            set('final_price', val);
                            set('balance', val - form.advance_payment);
                          } else {
                            set(field, val);
                          }
                        }}
                      />
                    </div>
                  ))}
                  <div>
                    <label className={LABEL_CLS}>Saldo (auto)</label>
                    <input type="number" className={`${INPUT_CLS} opacity-60`} value={form.balance} readOnly />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Checklist de producción */}
          <div className={SECTION_CLS}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gold-400">Checklist de producción digital</h3>
              <span className="text-xs text-carbon-400">{done} / {total} completados</span>
            </div>
            <div className="w-full bg-navy-700 rounded-full h-1.5 mb-3">
              <div className="bg-gold-500 h-1.5 rounded-full transition-all" style={{ width: `${(done / total) * 100}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(EMPTY_CHECKLIST) as (keyof ProductionChecklist)[]).map(key => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={cl[key]}
                    onChange={() => set('checklist', { ...cl, [key]: !cl[key] })}
                    className="accent-gold-500"
                  />
                  <span className="text-xs text-carbon-300 group-hover:text-white transition-colors">{CHECKLIST_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 6: Archivos y notas */}
          <div className={SECTION_CLS}>
            <h3 className="text-sm font-semibold text-gold-400 mb-2">Archivos y notas</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Archivos pendientes</label>
                <textarea className={INPUT_CLS} rows={2} value={form.pending_files} onChange={e => set('pending_files', e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLS}>Archivos completados</label>
                <textarea className={INPUT_CLS} rows={2} value={form.completed_files} onChange={e => set('completed_files', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className={LABEL_CLS}>Notas internas</label>
                <textarea className={INPUT_CLS} rows={2} value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)} />
              </div>
              <div>
                <label className={LABEL_CLS}>Estado de pago</label>
                <select className={INPUT_CLS} value={form.payment_status} onChange={e => set('payment_status', e.target.value as PaymentStatus)}>
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL_CLS}>Estado de entrega</label>
                <select className={INPUT_CLS} value={form.delivery_status} onChange={e => set('delivery_status', e.target.value as DeliveryStatus)}>
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="entregado">Entregado</option>
                  <option value="con_correcciones">Con correcciones</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-navy-600 text-carbon-300 hover:text-white hover:bg-navy-700 transition-colors text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold transition-colors text-sm disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── LAUNCH MODAL ─────────────────────────────────────────────────────────────
function LaunchModal({ launch, onClose, onSave }: {
  launch: MoldeyLaunch | null;
  onClose: () => void;
  onSave: (l: Omit<MoldeyLaunch, 'id' | 'created_at'>) => Promise<void>;
}) {
  const [form, setForm] = useState<Omit<MoldeyLaunch, 'id' | 'created_at'>>(
    launch ? { ...launch } : {
      name: '', type: 'pack', target_date: null, status: 'planificado',
      price: 0, sales_goal: 0, related_campaign: '', products_included: '',
      pending_files: '', notes: '',
    }
  );
  const [saving, setSaving] = useState(false);
  const set = (f: string, v: unknown) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); onClose(); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-900 border border-navy-600 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-600">
          <h2 className="text-lg font-bold text-white">{launch ? 'Editar lanzamiento' : 'Nuevo lanzamiento'}</h2>
          <button onClick={onClose} className="text-carbon-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3 max-h-[80vh] overflow-y-auto">
          <div>
            <label className={LABEL_CLS}>Nombre *</label>
            <input className={INPUT_CLS} value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Tipo</label>
              <select className={INPUT_CLS} value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="pack">Pack</option>
                <option value="molde_individual">Molde individual</option>
                <option value="oferta">Oferta</option>
                <option value="gratis">Gratis</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Estado</label>
              <select className={INPUT_CLS} value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(LAUNCH_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Fecha objetivo</label>
              <input type="date" className={INPUT_CLS} value={form.target_date ?? ''} onChange={e => set('target_date', e.target.value || null)} />
            </div>
            <div>
              <label className={LABEL_CLS}>Precio</label>
              <input type="number" min={0} step={0.01} className={INPUT_CLS} value={form.price} onChange={e => set('price', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className={LABEL_CLS}>Meta de ventas</label>
              <input type="number" min={0} className={INPUT_CLS} value={form.sales_goal} onChange={e => set('sales_goal', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Campaña relacionada</label>
            <input className={INPUT_CLS} value={form.related_campaign} onChange={e => set('related_campaign', e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLS}>Productos incluidos</label>
            <textarea className={INPUT_CLS} rows={2} value={form.products_included} onChange={e => set('products_included', e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLS}>Archivos pendientes</label>
            <textarea className={INPUT_CLS} rows={2} value={form.pending_files} onChange={e => set('pending_files', e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLS}>Notas</label>
            <textarea className={INPUT_CLS} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-navy-600 text-carbon-300 hover:text-white hover:bg-navy-700 transition-colors text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold transition-colors text-sm disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── CAMPAIGN MODAL ───────────────────────────────────────────────────────────
function CampaignModal({ campaign, onClose, onSave }: {
  campaign: MoldeyCampaign | null;
  onClose: () => void;
  onSave: (c: Omit<MoldeyCampaign, 'id' | 'created_at'>) => Promise<void>;
}) {
  const [form, setForm] = useState<Omit<MoldeyCampaign, 'id' | 'created_at'>>(
    campaign ? { ...campaign } : {
      name: '', promoted_product: '', start_date: null, end_date: null,
      main_channel: null, secondary_channels: [], offer: '', main_message: '',
      sales_goal: 0, final_result: 0, status: 'borrador',
    }
  );
  const [saving, setSaving] = useState(false);
  const set = (f: string, v: unknown) => setForm(p => ({ ...p, [f]: v }));
  const toggleSec = (ch: MarketingChannel) =>
    set('secondary_channels', form.secondary_channels.includes(ch)
      ? form.secondary_channels.filter(x => x !== ch)
      : [...form.secondary_channels, ch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); onClose(); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-900 border border-navy-600 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-600">
          <h2 className="text-lg font-bold text-white">{campaign ? 'Editar campaña' : 'Nueva campaña'}</h2>
          <button onClick={onClose} className="text-carbon-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3 max-h-[80vh] overflow-y-auto">
          <div>
            <label className={LABEL_CLS}>Nombre *</label>
            <input className={INPUT_CLS} value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div>
            <label className={LABEL_CLS}>Producto promovido</label>
            <input className={INPUT_CLS} value={form.promoted_product} onChange={e => set('promoted_product', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Fecha inicio</label>
              <input type="date" className={INPUT_CLS} value={form.start_date ?? ''} onChange={e => set('start_date', e.target.value || null)} />
            </div>
            <div>
              <label className={LABEL_CLS}>Fecha fin</label>
              <input type="date" className={INPUT_CLS} value={form.end_date ?? ''} onChange={e => set('end_date', e.target.value || null)} />
            </div>
            <div>
              <label className={LABEL_CLS}>Canal principal</label>
              <select className={INPUT_CLS} value={form.main_channel ?? ''} onChange={e => set('main_channel', e.target.value as MarketingChannel || null)}>
                <option value="">Sin canal</option>
                {MARKETING_CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Estado</label>
              <select className={INPUT_CLS} value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(CAMPAIGN_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Meta de ventas</label>
              <input type="number" min={0} className={INPUT_CLS} value={form.sales_goal} onChange={e => set('sales_goal', parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className={LABEL_CLS}>Resultado final</label>
              <input type="number" min={0} className={INPUT_CLS} value={form.final_result} onChange={e => set('final_result', parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Canales secundarios</label>
            <div className="flex flex-wrap gap-2">
              {MARKETING_CHANNELS.map(mc => (
                <label key={mc.value} className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={form.secondary_channels.includes(mc.value as MarketingChannel)} onChange={() => toggleSec(mc.value as MarketingChannel)} className="accent-gold-500" />
                  <span className="text-xs text-carbon-300">{mc.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Oferta</label>
            <input className={INPUT_CLS} value={form.offer} onChange={e => set('offer', e.target.value)} placeholder="ej: 30% descuento" />
          </div>
          <div>
            <label className={LABEL_CLS}>Mensaje principal</label>
            <textarea className={INPUT_CLS} rows={2} value={form.main_message} onChange={e => set('main_message', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-navy-600 text-carbon-300 hover:text-white hover:bg-navy-700 transition-colors text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold transition-colors text-sm disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── CUSTOM ORDER MODAL ───────────────────────────────────────────────────────
function CustomOrderModal({ order, onClose, onSave }: {
  order: MoldeyCustomOrder | null;
  onClose: () => void;
  onSave: (o: Omit<MoldeyCustomOrder, 'id' | 'created_at'>) => Promise<void>;
}) {
  const [form, setForm] = useState<Omit<MoldeyCustomOrder, 'id' | 'created_at'>>(
    order ? { ...order } : {
      client_name: '', client_contact: '', order_name: '', garment_type: '',
      category: null, description: '', client_references: '', requested_sizes: '',
      requested_formats: '', order_date: null, promised_delivery: null,
      price: 0, advance: 0, balance: 0, payment_status: 'pendiente',
      status: 'consulta', final_files: '', internal_notes: '', client_notes: '',
    }
  );
  const [saving, setSaving] = useState(false);
  const set = (f: string, v: unknown) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); onClose(); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 overflow-y-auto">
      <div className="bg-navy-900 border border-navy-600 rounded-2xl w-full max-w-lg my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-600">
          <h2 className="text-lg font-bold text-white">{order ? 'Editar pedido' : 'Nuevo diseño a pedido'}</h2>
          <button onClick={onClose} className="text-carbon-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Cliente *</label>
              <input className={INPUT_CLS} value={form.client_name} onChange={e => set('client_name', e.target.value)} required />
            </div>
            <div>
              <label className={LABEL_CLS}>Contacto</label>
              <input className={INPUT_CLS} value={form.client_contact} onChange={e => set('client_contact', e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLS}>Nombre del pedido *</label>
              <input className={INPUT_CLS} value={form.order_name} onChange={e => set('order_name', e.target.value)} required />
            </div>
            <div>
              <label className={LABEL_CLS}>Tipo de prenda</label>
              <input className={INPUT_CLS} value={form.garment_type} onChange={e => set('garment_type', e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLS}>Categoría</label>
              <select className={INPUT_CLS} value={form.category ?? ''} onChange={e => set('category', e.target.value as Category || null)}>
                <option value="">Sin categoría</option>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Estado</label>
              <select className={INPUT_CLS} value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.entries(CUSTOM_ORDER_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Fecha del pedido</label>
              <input type="date" className={INPUT_CLS} value={form.order_date ?? ''} onChange={e => set('order_date', e.target.value || null)} />
            </div>
            <div>
              <label className={LABEL_CLS}>Entrega prometida</label>
              <input type="date" className={INPUT_CLS} value={form.promised_delivery ?? ''} onChange={e => set('promised_delivery', e.target.value || null)} />
            </div>
            <div>
              <label className={LABEL_CLS}>Precio</label>
              <input type="number" min={0} step={0.01} className={INPUT_CLS} value={form.price} onChange={e => {
                const val = parseFloat(e.target.value) || 0;
                set('price', val);
                set('balance', val - form.advance);
              }} />
            </div>
            <div>
              <label className={LABEL_CLS}>Adelanto</label>
              <input type="number" min={0} step={0.01} className={INPUT_CLS} value={form.advance} onChange={e => {
                const val = parseFloat(e.target.value) || 0;
                set('advance', val);
                set('balance', form.price - val);
              }} />
            </div>
            <div>
              <label className={LABEL_CLS}>Saldo (auto)</label>
              <input type="number" className={`${INPUT_CLS} opacity-60`} value={form.balance} readOnly />
            </div>
            <div>
              <label className={LABEL_CLS}>Estado de pago</label>
              <select className={INPUT_CLS} value={form.payment_status} onChange={e => set('payment_status', e.target.value as PaymentStatus)}>
                {Object.entries(PAYMENT_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Descripción</label>
            <textarea className={INPUT_CLS} rows={2} value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLS}>Referencias del cliente</label>
            <textarea className={INPUT_CLS} rows={2} value={form.client_references} onChange={e => set('client_references', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Talles solicitados</label>
              <input className={INPUT_CLS} value={form.requested_sizes} onChange={e => set('requested_sizes', e.target.value)} />
            </div>
            <div>
              <label className={LABEL_CLS}>Formatos solicitados</label>
              <input className={INPUT_CLS} value={form.requested_formats} onChange={e => set('requested_formats', e.target.value)} />
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Archivos finales</label>
            <textarea className={INPUT_CLS} rows={2} value={form.final_files} onChange={e => set('final_files', e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLS}>Notas internas</label>
            <textarea className={INPUT_CLS} rows={2} value={form.internal_notes} onChange={e => set('internal_notes', e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLS}>Notas del cliente</label>
            <textarea className={INPUT_CLS} rows={2} value={form.client_notes} onChange={e => set('client_notes', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-navy-600 text-carbon-300 hover:text-white hover:bg-navy-700 transition-colors text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold transition-colors text-sm disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── FREE PRODUCT MODAL ───────────────────────────────────────────────────────
function FreeProductModal({ product, onClose, onSave }: {
  product: MoldeyFreeProduct | null;
  onClose: () => void;
  onSave: (p: Omit<MoldeyFreeProduct, 'id' | 'created_at'>) => Promise<void>;
}) {
  const [form, setForm] = useState<Omit<MoldeyFreeProduct, 'id' | 'created_at'>>(
    product ? { ...product } : {
      name: '', category: null, formats: [], file_status: 'pendiente',
      download_link: '', related_campaign: '', objective: 'captar_clientes',
      publish_date: null, result: '', next_action: '',
    }
  );
  const [saving, setSaving] = useState(false);
  const set = (f: string, v: unknown) => setForm(p => ({ ...p, [f]: v }));
  const formatOptions = ['PDF A4', 'PDF Plotter', 'CDR', 'DXF', 'PLT', 'PDS', 'MRK'];
  const toggleFormat = (f: string) =>
    set('formats', form.formats.includes(f) ? form.formats.filter(x => x !== f) : [...form.formats, f]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try { await onSave(form); onClose(); } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-navy-900 border border-navy-600 rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-600">
          <h2 className="text-lg font-bold text-white">{product ? 'Editar producto gratis' : 'Nuevo producto gratis'}</h2>
          <button onClick={onClose} className="text-carbon-400 hover:text-white"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-3 max-h-[80vh] overflow-y-auto">
          <div>
            <label className={LABEL_CLS}>Nombre *</label>
            <input className={INPUT_CLS} value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Categoría</label>
              <select className={INPUT_CLS} value={form.category ?? ''} onChange={e => set('category', e.target.value as Category || null)}>
                <option value="">Sin categoría</option>
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Estado de archivos</label>
              <select className={INPUT_CLS} value={form.file_status} onChange={e => set('file_status', e.target.value)}>
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="listo">Listo</option>
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Objetivo</label>
              <select className={INPUT_CLS} value={form.objective} onChange={e => set('objective', e.target.value)}>
                {Object.entries(FREE_PRODUCT_OBJECTIVE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Fecha de publicación</label>
              <input type="date" className={INPUT_CLS} value={form.publish_date ?? ''} onChange={e => set('publish_date', e.target.value || null)} />
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Formatos</label>
            <div className="flex flex-wrap gap-2">
              {formatOptions.map(f => (
                <label key={f} className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={form.formats.includes(f)} onChange={() => toggleFormat(f)} className="accent-gold-500" />
                  <span className="text-xs text-carbon-300">{f}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Link de descarga</label>
            <input className={INPUT_CLS} value={form.download_link} onChange={e => set('download_link', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className={LABEL_CLS}>Campaña relacionada</label>
            <input className={INPUT_CLS} value={form.related_campaign} onChange={e => set('related_campaign', e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLS}>Resultado</label>
            <textarea className={INPUT_CLS} rows={2} value={form.result} onChange={e => set('result', e.target.value)} />
          </div>
          <div>
            <label className={LABEL_CLS}>Próxima acción</label>
            <input className={INPUT_CLS} value={form.next_action} onChange={e => set('next_action', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-navy-600 text-carbon-300 hover:text-white hover:bg-navy-700 transition-colors text-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold transition-colors text-sm disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── TASK CARD ────────────────────────────────────────────────────────────────
function TaskCard({ task, onClick }: { task: MoldeyTask; onClick: () => void }) {
  const pc = PRIORITY_CONFIG[task.priority];
  const today = new Date().toISOString().slice(0, 10);
  const overdue = task.due_date && task.due_date < today && !['publicado', 'mejorar_relanzar'].includes(task.status);
  const { done, total } = checklistProgress(task.checklist);

  return (
    <div
      className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 rounded-xl p-3 cursor-pointer transition-all group"
      onClick={onClick}
    >
      <p className="text-white text-sm font-semibold leading-snug mb-1 group-hover:text-gold-300 transition-colors">{task.title}</p>
      <div className="flex flex-wrap gap-1 mb-2">
        <Badge className="bg-navy-700 text-carbon-300">{TASK_TYPE_LABELS[task.task_type]}</Badge>
        {task.category && <Badge className="bg-navy-700 text-carbon-400">{CATEGORY_LABELS[task.category]}</Badge>}
      </div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
        <span className={`text-xs ${pc.color}`}>{pc.label}</span>
      </div>
      {task.due_date && (
        <div className={`flex items-center gap-1 text-xs mb-1 ${overdue ? 'text-red-400' : 'text-carbon-400'}`}>
          {overdue && <AlertCircle size={11} />}
          <Clock size={11} />
          {task.due_date}
        </div>
      )}
      {task.client_name && (
        <p className="text-xs text-carbon-400 truncate">{task.client_name}</p>
      )}
      <div className="mt-2 flex items-center gap-1">
        <div className="flex-1 bg-navy-700 rounded-full h-1">
          <div className="bg-gold-500 h-1 rounded-full" style={{ width: `${(done / total) * 100}%` }} />
        </div>
        <span className="text-xs text-carbon-500">{done}/{total}</span>
      </div>
    </div>
  );
}

// ─── KANBAN VIEW ──────────────────────────────────────────────────────────────
function KanbanView({ tasks, onCardClick, onAddColumn }: {
  tasks: MoldeyTask[];
  onCardClick: (task: MoldeyTask) => void;
  onAddColumn: (col: KanbanColumn) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.status === col.id);
        return (
          <div key={col.id} className={`flex-shrink-0 w-64 rounded-xl border ${col.color} p-3 flex flex-col gap-2`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white">{col.label}</span>
              <span className="text-xs bg-navy-700 text-carbon-400 px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
            </div>
            <div className="flex flex-col gap-2 min-h-[60px]">
              {colTasks.map(task => (
                <TaskCard key={task.id} task={task} onClick={() => onCardClick(task)} />
              ))}
            </div>
            <button
              onClick={() => onAddColumn(col.id)}
              className="mt-1 flex items-center justify-center gap-1 text-xs text-carbon-500 hover:text-gold-400 transition-colors py-1.5 rounded-lg hover:bg-navy-700/50 border border-dashed border-navy-600 hover:border-gold-500/40"
            >
              <Plus size={12} /> Agregar
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── LIST VIEW ────────────────────────────────────────────────────────────────
function ListView({ tasks, onEdit, onDelete }: {
  tasks: MoldeyTask[];
  onEdit: (t: MoldeyTask) => void;
  onDelete: (id: string) => void;
}) {
  if (!tasks.length) return <EmptyState message="No hay tareas en Agenda Moldey todavía." icon={CalendarDays} />;

  return (
    <div className="overflow-x-auto rounded-xl border border-navy-600">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy-800 text-carbon-400 text-left">
            {['Título', 'Tipo', 'Estado', 'Prioridad', 'Fecha límite', 'Cliente', 'Precio', 'Pago', 'Acciones'].map(h => (
              <th key={h} className="px-4 py-3 text-xs font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-700">
          {tasks.map(task => {
            const pc = PRIORITY_CONFIG[task.priority];
            const col = KANBAN_COLUMNS.find(c => c.id === task.status);
            const today = new Date().toISOString().slice(0, 10);
            const overdue = task.due_date && task.due_date < today;
            return (
              <tr key={task.id} className="bg-navy-900 hover:bg-navy-800 transition-colors">
                <td className="px-4 py-3 font-medium text-white max-w-[180px] truncate">{task.title}</td>
                <td className="px-4 py-3 whitespace-nowrap"><Badge className="bg-navy-700 text-carbon-300">{TASK_TYPE_LABELS[task.task_type]}</Badge></td>
                <td className="px-4 py-3 whitespace-nowrap text-carbon-300 text-xs">{col?.label}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
                    <span className={`text-xs ${pc.color}`}>{pc.label}</span>
                  </div>
                </td>
                <td className={`px-4 py-3 text-xs whitespace-nowrap ${overdue ? 'text-red-400' : 'text-carbon-400'}`}>{task.due_date ?? '-'}</td>
                <td className="px-4 py-3 text-carbon-300 text-xs">{task.client_name || '-'}</td>
                <td className="px-4 py-3 text-carbon-300 text-xs whitespace-nowrap">{task.final_price > 0 ? `$${task.final_price}` : '-'}</td>
                <td className="px-4 py-3"><Badge className={PAYMENT_STATUS_COLORS[task.payment_status]}>{PAYMENT_STATUS_LABELS[task.payment_status]}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => onEdit(task)} className="text-carbon-400 hover:text-gold-400 transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => onDelete(task.id)} className="text-carbon-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── LAUNCHES VIEW ────────────────────────────────────────────────────────────
function LaunchesView({ launches, onEdit, onDelete }: {
  launches: MoldeyLaunch[];
  onEdit: (l: MoldeyLaunch) => void;
  onDelete: (id: string) => void;
}) {
  if (!launches.length) return <EmptyState message="No hay lanzamientos programados." icon={Rocket} />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {launches.map(launch => (
        <div key={launch.id} className="bg-navy-800 border border-navy-600 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-white text-sm leading-snug">{launch.name}</h3>
            <Badge className={LAUNCH_STATUS_COLORS[launch.status]}>{LAUNCH_STATUS_LABELS[launch.status]}</Badge>
          </div>
          <Badge className="bg-navy-700 text-carbon-300 self-start capitalize">{launch.type.replace('_', ' ')}</Badge>
          {launch.target_date && (
            <div className="flex items-center gap-1 text-xs text-carbon-400">
              <Clock size={11} />
              {launch.target_date}
            </div>
          )}
          <div className="flex items-center gap-3 text-xs text-carbon-300">
            {launch.price > 0 && <span className="text-gold-400 font-semibold">${launch.price}</span>}
            {launch.sales_goal > 0 && <span>Meta: {launch.sales_goal}</span>}
          </div>
          {launch.notes && <p className="text-xs text-carbon-400 line-clamp-2">{launch.notes}</p>}
          <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-navy-700">
            <button onClick={() => onEdit(launch)} className="text-carbon-400 hover:text-gold-400 transition-colors"><Edit2 size={14} /></button>
            <button onClick={() => onDelete(launch.id)} className="text-carbon-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CAMPAIGNS VIEW ───────────────────────────────────────────────────────────
function CampaignsView({ campaigns, onEdit, onDelete }: {
  campaigns: MoldeyCampaign[];
  onEdit: (c: MoldeyCampaign) => void;
  onDelete: (id: string) => void;
}) {
  if (!campaigns.length) return <EmptyState message="No hay campañas activas." icon={Megaphone} />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {campaigns.map(c => (
        <div key={c.id} className="bg-navy-800 border border-navy-600 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-white text-sm leading-snug">{c.name}</h3>
            <Badge className={CAMPAIGN_STATUS_COLORS[c.status]}>{CAMPAIGN_STATUS_LABELS[c.status]}</Badge>
          </div>
          {c.promoted_product && <p className="text-xs text-carbon-300">{c.promoted_product}</p>}
          {(c.start_date || c.end_date) && (
            <div className="flex items-center gap-1 text-xs text-carbon-400">
              <Clock size={11} />
              {c.start_date} {c.end_date && `→ ${c.end_date}`}
            </div>
          )}
          {c.main_channel && (
            <Badge className="bg-navy-700 text-carbon-300 self-start capitalize">{c.main_channel}</Badge>
          )}
          <div className="flex items-center gap-3 text-xs text-carbon-300">
            {c.sales_goal > 0 && <span>Meta: {c.sales_goal}</span>}
            {c.final_result > 0 && <span className="text-gold-400">Real: {c.final_result}</span>}
          </div>
          <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-navy-700">
            <button onClick={() => onEdit(c)} className="text-carbon-400 hover:text-gold-400 transition-colors"><Edit2 size={14} /></button>
            <button onClick={() => onDelete(c.id)} className="text-carbon-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── PRODUCCION DIGITAL VIEW ──────────────────────────────────────────────────
function ProduccionView({ tasks, onToggleChecklist }: {
  tasks: MoldeyTask[];
  onToggleChecklist: (taskId: string, key: keyof ProductionChecklist) => void;
}) {
  const prodTasks = tasks.filter(t => t.status === 'produccion_digital' || t.status === 'revision_tecnica');
  if (!prodTasks.length) return <EmptyState message="No hay productos en producción digital." icon={Layers} />;

  return (
    <div className="space-y-4">
      {prodTasks.map(task => {
        const { done, total } = checklistProgress(task.checklist);
        const pct = Math.round((done / total) * 100);
        return (
          <div key={task.id} className="bg-navy-800 border border-navy-600 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white text-sm">{task.title}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className={PRIORITY_CONFIG[task.priority].color}>{PRIORITY_CONFIG[task.priority].label}</Badge>
                  <span className="text-xs text-carbon-400">{KANBAN_COLUMNS.find(c => c.id === task.status)?.label}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-gold-400">{pct}%</span>
                <p className="text-xs text-carbon-400">{done}/{total} ítems</p>
              </div>
            </div>
            <div className="w-full bg-navy-700 rounded-full h-2 mb-3">
              <div className="bg-gold-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(EMPTY_CHECKLIST) as (keyof ProductionChecklist)[]).map(key => (
                <label key={key} className="flex items-center gap-1.5 cursor-pointer group">
                  <button
                    type="button"
                    onClick={() => onToggleChecklist(task.id, key)}
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${task.checklist[key] ? 'bg-gold-500 border-gold-500' : 'border-navy-600 hover:border-gold-500/50'}`}
                  >
                    {task.checklist[key] && <Check size={10} className="text-navy-900" />}
                  </button>
                  <span className={`text-xs transition-colors ${task.checklist[key] ? 'text-carbon-400 line-through' : 'text-carbon-300 group-hover:text-white'}`}>
                    {CHECKLIST_LABELS[key]}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── PEDIDOS VIEW ─────────────────────────────────────────────────────────────
function PedidosView({ orders, onEdit, onDelete }: {
  orders: MoldeyCustomOrder[];
  onEdit: (o: MoldeyCustomOrder) => void;
  onDelete: (id: string) => void;
}) {
  if (!orders.length) return <EmptyState message="No hay diseños a pedido cargados." icon={Package} />;

  return (
    <div className="overflow-x-auto rounded-xl border border-navy-600">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-navy-800 text-carbon-400 text-left">
            {['Cliente', 'Pedido', 'Estado', 'Entrega', 'Precio', 'Adelanto', 'Saldo', 'Pago', 'Acciones'].map(h => (
              <th key={h} className="px-4 py-3 text-xs font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-navy-700">
          {orders.map(o => (
            <tr key={o.id} className="bg-navy-900 hover:bg-navy-800 transition-colors">
              <td className="px-4 py-3 text-white font-medium text-xs whitespace-nowrap">{o.client_name}</td>
              <td className="px-4 py-3 text-carbon-300 text-xs max-w-[150px] truncate">{o.order_name}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <Badge className={CUSTOM_ORDER_STATUS_COLORS[o.status]}>{CUSTOM_ORDER_STATUS_LABELS[o.status]}</Badge>
              </td>
              <td className="px-4 py-3 text-carbon-400 text-xs whitespace-nowrap">{o.promised_delivery ?? '-'}</td>
              <td className="px-4 py-3 text-carbon-300 text-xs">{o.price > 0 ? `$${o.price}` : '-'}</td>
              <td className="px-4 py-3 text-carbon-300 text-xs">{o.advance > 0 ? `$${o.advance}` : '-'}</td>
              <td className="px-4 py-3 text-carbon-300 text-xs">{o.balance > 0 ? `$${o.balance}` : '-'}</td>
              <td className="px-4 py-3 whitespace-nowrap">
                <Badge className={PAYMENT_STATUS_COLORS[o.payment_status]}>{PAYMENT_STATUS_LABELS[o.payment_status]}</Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button onClick={() => onEdit(o)} className="text-carbon-400 hover:text-gold-400 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => onDelete(o.id)} className="text-carbon-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── GRATIS VIEW ──────────────────────────────────────────────────────────────
function GratisView({ products, onEdit, onDelete }: {
  products: MoldeyFreeProduct[];
  onEdit: (p: MoldeyFreeProduct) => void;
  onDelete: (id: string) => void;
}) {
  if (!products.length) return <EmptyState message="No hay productos gratis publicados." icon={Gift} />;

  const fileStatusColors: Record<string, string> = {
    pendiente: 'bg-carbon-700 text-carbon-300',
    en_proceso: 'bg-amber-900/60 text-amber-300',
    listo: 'bg-emerald-900/60 text-emerald-300',
  };
  const fileStatusLabels: Record<string, string> = {
    pendiente: 'Pendiente', en_proceso: 'En proceso', listo: 'Listo',
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map(p => (
        <div key={p.id} className="bg-navy-800 border border-navy-600 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-white text-sm leading-snug">{p.name}</h3>
            <Badge className={fileStatusColors[p.file_status]}>{fileStatusLabels[p.file_status]}</Badge>
          </div>
          <div className="flex flex-wrap gap-1">
            {p.category && <Badge className="bg-navy-700 text-carbon-300">{CATEGORY_LABELS[p.category]}</Badge>}
            {p.formats.map(f => <Badge key={f} className="bg-navy-700 text-carbon-400">{f}</Badge>)}
          </div>
          <Badge className="bg-navy-700 text-carbon-300 self-start">{FREE_PRODUCT_OBJECTIVE_LABELS[p.objective]}</Badge>
          {p.download_link && (
            <a href={p.download_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-gold-400 hover:text-gold-300 transition-colors">
              <ExternalLink size={11} /> Descargar
            </a>
          )}
          {p.next_action && <p className="text-xs text-carbon-400 italic">{p.next_action}</p>}
          <div className="flex justify-end gap-2 mt-auto pt-2 border-t border-navy-700">
            <button onClick={() => onEdit(p)} className="text-carbon-400 hover:text-gold-400 transition-colors"><Edit2 size={14} /></button>
            <button onClick={() => onDelete(p.id)} className="text-carbon-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── VENTAS MASIVAS VIEW ──────────────────────────────────────────────────────
function VentasView({ tasks }: { tasks: MoldeyTask[] }) {
  const ventasTasks = tasks.filter(t => ['campana_activa', 'publicado', 'listo_publicar'].includes(t.status));
  if (!ventasTasks.length) return <EmptyState message="No hay ventas masivas registradas." icon={BarChart2} />;

  return (
    <div className="space-y-3">
      {ventasTasks.map(task => {
        const col = KANBAN_COLUMNS.find(c => c.id === task.status);
        const pct = task.sales_goal > 0 ? Math.min(100, Math.round((task.sales_result / task.sales_goal) * 100)) : 0;
        return (
          <div key={task.id} className="bg-navy-800 border border-navy-600 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">{task.title}</h3>
                {task.related_product && <p className="text-xs text-carbon-400">{task.related_product}</p>}
              </div>
              <Badge className="bg-navy-700 text-carbon-300">{col?.label}</Badge>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-carbon-300">
              {task.final_price > 0 && <span className="text-gold-400 font-semibold">${task.final_price}</span>}
              {task.marketing_channels.length > 0 && (
                <span>Canales: {task.marketing_channels.join(', ')}</span>
              )}
            </div>
            {task.sales_goal > 0 && (
              <div>
                <div className="flex justify-between text-xs text-carbon-400 mb-1">
                  <span>Ventas: {task.sales_result} / {task.sales_goal}</span>
                  <span>{pct}%</span>
                </div>
                <div className="w-full bg-navy-700 rounded-full h-1.5">
                  <div className="bg-gold-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
            {task.internal_notes && <p className="text-xs text-carbon-400 italic">{task.internal_notes}</p>}
          </div>
        );
      })}
    </div>
  );
}

// ─── OP TASK MODAL ────────────────────────────────────────────────────────────
function OpTaskModal({ task, defaultStatus, onClose, onSave }: {
  task: OpTask | null;
  defaultStatus?: OpStatus;
  onClose: () => void;
  onSave: (data: Omit<OpTask, 'id' | 'created_at'>) => void;
}) {
  const [form, setForm] = useState<Omit<OpTask, 'id' | 'created_at'>>(
    task ? { title: task.title, description: task.description, priority: task.priority,
              status: task.status, due_date: task.due_date, responsible: task.responsible,
              simple_type: task.simple_type, notes: task.notes }
         : { ...EMPTY_OP_TASK, status: defaultStatus ?? 'pendiente' }
  );
  const set = (f: string, v: unknown) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-navy-900 border border-navy-600 rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-navy-700">
          <h2 className="text-white font-bold text-base">{task ? 'Editar tarea operativa' : 'Nueva tarea operativa'}</h2>
          <button onClick={onClose} className="text-carbon-400 hover:text-white transition-colors"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className={LABEL_CLS}>Título *</label>
            <input className={INPUT_CLS} value={form.title} onChange={e => set('title', e.target.value)} placeholder="¿Qué hay que hacer?" required autoFocus />
          </div>
          <div>
            <label className={LABEL_CLS}>Descripción</label>
            <textarea className={INPUT_CLS} rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detalles opcionales..." />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL_CLS}>Tipo</label>
              <select className={INPUT_CLS} value={form.simple_type} onChange={e => set('simple_type', e.target.value as OpType)}>
                {Object.entries(OP_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Estado</label>
              <select className={INPUT_CLS} value={form.status} onChange={e => set('status', e.target.value as OpStatus)}>
                {OP_COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Prioridad</label>
              <select className={INPUT_CLS} value={form.priority} onChange={e => set('priority', e.target.value as Priority)}>
                {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL_CLS}>Fecha límite</label>
              <input type="date" className={INPUT_CLS} value={form.due_date ?? ''} onChange={e => set('due_date', e.target.value || null)} />
            </div>
          </div>
          <div>
            <label className={LABEL_CLS}>Responsable</label>
            <input className={INPUT_CLS} value={form.responsible} onChange={e => set('responsible', e.target.value)} placeholder="¿Quién lo hace?" />
          </div>
          <div>
            <label className={LABEL_CLS}>Notas</label>
            <textarea className={INPUT_CLS} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Observaciones internas..." />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-navy-700">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-carbon-400 hover:text-white border border-navy-600 rounded-lg hover:bg-navy-700 transition-colors">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold text-sm transition-colors">
              {task ? 'Guardar cambios' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── KANBAN OP VIEW ───────────────────────────────────────────────────────────
function KanbanOpView({ tasks, onEdit, onDelete, onAddToColumn }: {
  tasks: OpTask[];
  onEdit: (t: OpTask) => void;
  onDelete: (id: string) => void;
  onAddToColumn: (status: OpStatus) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  if (tasks.length === 0 && OP_COLUMNS.every(c => true)) {
    // Still show columns even when empty
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-carbon-500 italic">Kanban operativo para tareas del día a día — rápido y simple.</p>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {OP_COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.id);
          return (
            <div key={col.id} className={`flex-shrink-0 w-60 rounded-xl border ${col.color} p-3 flex flex-col gap-2`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white uppercase tracking-wide">{col.label}</span>
                <span className="text-xs bg-navy-800 text-carbon-400 px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
              </div>

              <div className="flex flex-col gap-2 min-h-[50px]">
                {colTasks.length === 0 && (
                  <p className="text-xs text-carbon-600 text-center py-3 italic">Sin tareas</p>
                )}
                {colTasks.map(task => {
                  const pc = PRIORITY_CONFIG[task.priority];
                  const overdue = task.due_date && task.due_date < today && col.id !== 'terminado';
                  return (
                    <div
                      key={task.id}
                      className="bg-navy-800 border border-navy-600 hover:border-gold-500/40 rounded-lg p-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <p className="text-white text-xs font-semibold leading-snug group-hover:text-gold-300 transition-colors flex-1">{task.title}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => onEdit(task)} className="text-carbon-500 hover:text-gold-400 transition-colors"><Edit2 size={11} /></button>
                          <button onClick={() => { if (confirm('¿Eliminar esta tarea?')) onDelete(task.id); }} className="text-carbon-500 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                        <span className={`text-[10px] ${pc.color}`}>{pc.label}</span>
                        <span className="text-[10px] text-carbon-600">·</span>
                        <span className="text-[10px] text-carbon-500">{OP_TYPE_LABELS[task.simple_type]}</span>
                      </div>
                      {task.due_date && (
                        <div className={`flex items-center gap-1 text-[10px] ${overdue ? 'text-red-400' : 'text-carbon-500'}`}>
                          {overdue && <AlertCircle size={9} />}
                          <Clock size={9} />
                          {task.due_date}
                        </div>
                      )}
                      {task.responsible && (
                        <p className="text-[10px] text-carbon-500 mt-0.5">👤 {task.responsible}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => onAddToColumn(col.id)}
                className="mt-1 flex items-center justify-center gap-1 text-xs text-carbon-500 hover:text-gold-400 transition-colors py-1.5 rounded-lg hover:bg-navy-700/50 border border-dashed border-navy-600 hover:border-gold-500/40"
              >
                <Plus size={12} /> Agregar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AgendaMoldey() {
  const [activeView, setActiveView] = useState<ActiveView>('kanban');
  const [tasks, setTasks] = useState<MoldeyTask[]>([]);
  const [launches, setLaunches] = useState<MoldeyLaunch[]>([]);
  const [campaigns, setCampaigns] = useState<MoldeyCampaign[]>([]);
  const [customOrders, setCustomOrders] = useState<MoldeyCustomOrder[]>([]);
  const [freeProducts, setFreeProducts] = useState<MoldeyFreeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showCustomOrderModal, setShowCustomOrderModal] = useState(false);
  const [showFreeProductModal, setShowFreeProductModal] = useState(false);

  const [editingTask, setEditingTask] = useState<MoldeyTask | null>(null);
  const [editingLaunch, setEditingLaunch] = useState<MoldeyLaunch | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<MoldeyCampaign | null>(null);
  const [editingOrder, setEditingOrder] = useState<MoldeyCustomOrder | null>(null);
  const [editingFreeProduct, setEditingFreeProduct] = useState<MoldeyFreeProduct | null>(null);
  const [defaultColumn, setDefaultColumn] = useState<KanbanColumn | undefined>();

  const [filters, setFilters] = useState<Filters>({ search: '', priority: '', taskType: '', category: '' });

  // ── Kanban OP state ──
  const [opTasks, setOpTasks] = useState<OpTask[]>([]);
  const [showOpModal, setShowOpModal] = useState(false);
  const [editingOpTask, setEditingOpTask] = useState<OpTask | null>(null);
  const [defaultOpStatus, setDefaultOpStatus] = useState<OpStatus | undefined>();
  const [opSearch, setOpSearch] = useState('');
  const [opPriority, setOpPriority] = useState('');

  const loadOpTasks = useCallback(() => { setOpTasks(getOpTasks()); }, []);

  const handleSaveOpTask = (data: Omit<OpTask, 'id' | 'created_at'>) => {
    if (editingOpTask) updateOpTask(editingOpTask.id, data);
    else createOpTask(data);
    loadOpTasks();
    setEditingOpTask(null);
    setDefaultOpStatus(undefined);
  };

  const handleDeleteOpTask = (id: string) => { deleteOpTask(id); loadOpTasks(); };

  const filteredOpTasks = opTasks.filter(t => {
    if (opSearch && !t.title.toLowerCase().includes(opSearch.toLowerCase())) return false;
    if (opPriority && t.priority !== opPriority) return false;
    return true;
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [t, l, c, o, fp] = await Promise.all([
        getTasks(), getLaunches(), getCampaigns(), getCustomOrders(), getFreeProducts(),
      ]);
      setTasks(t);
      setLaunches(l);
      setCampaigns(c);
      setCustomOrders(o);
      setFreeProducts(fp);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); loadOpTasks(); }, [loadAll, loadOpTasks]);

  // Filtered tasks
  const filteredTasks = tasks.filter(t => {
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !t.client_name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    if (filters.taskType && t.task_type !== filters.taskType) return false;
    if (filters.category && t.category !== filters.category) return false;
    return true;
  });

  // Metrics
  const today = new Date().toISOString().slice(0, 10);
  const metrics = {
    pending: tasks.filter(t => !['publicado', 'mejorar_relanzar'].includes(t.status)).length,
    upcomingLaunches: launches.filter(l => ['planificado', 'listo'].includes(l.status)).length,
    activeCampaigns: campaigns.filter(c => c.status === 'activa').length,
    readyToPublish: tasks.filter(t => t.status === 'listo_publicar').length,
    overdue: tasks.filter(t => t.due_date && t.due_date < today && !['publicado', 'mejorar_relanzar'].includes(t.status)).length,
    activeOrders: customOrders.filter(o => !['finalizado', 'cancelado'].includes(o.status)).length,
    pendingDeliveries: customOrders.filter(o => o.status === 'listo_entregar').length,
    freeProducts: freeProducts.length,
  };

  // Task handlers
  const handleSaveTask = async (data: Omit<MoldeyTask, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(data);
    }
    await loadAll();
    setEditingTask(null);
    setDefaultColumn(undefined);
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    await deleteTask(id);
    await loadAll();
  };

  const handleEditTask = (task: MoldeyTask) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleAddToColumn = (col: KanbanColumn) => {
    setEditingTask(null);
    setDefaultColumn(col);
    setShowTaskModal(true);
  };

  // Launch handlers
  const handleSaveLaunch = async (data: Omit<MoldeyLaunch, 'id' | 'created_at'>) => {
    if (editingLaunch) await updateLaunch(editingLaunch.id, data);
    else await createLaunch(data);
    await loadAll();
    setEditingLaunch(null);
  };

  const handleDeleteLaunch = async (id: string) => {
    if (!confirm('¿Eliminar este lanzamiento?')) return;
    await deleteLaunch(id); await loadAll();
  };

  // Campaign handlers
  const handleSaveCampaign = async (data: Omit<MoldeyCampaign, 'id' | 'created_at'>) => {
    if (editingCampaign) await updateCampaign(editingCampaign.id, data);
    else await createCampaign(data);
    await loadAll();
    setEditingCampaign(null);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('¿Eliminar esta campaña?')) return;
    await deleteCampaign(id); await loadAll();
  };

  // Custom order handlers
  const handleSaveOrder = async (data: Omit<MoldeyCustomOrder, 'id' | 'created_at'>) => {
    if (editingOrder) await updateCustomOrder(editingOrder.id, data);
    else await createCustomOrder(data);
    await loadAll();
    setEditingOrder(null);
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm('¿Eliminar este pedido?')) return;
    await deleteCustomOrder(id); await loadAll();
  };

  // Free product handlers
  const handleSaveFreeProduct = async (data: Omit<MoldeyFreeProduct, 'id' | 'created_at'>) => {
    if (editingFreeProduct) await updateFreeProduct(editingFreeProduct.id, data);
    else await createFreeProduct(data);
    await loadAll();
    setEditingFreeProduct(null);
  };

  const handleDeleteFreeProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    await deleteFreeProduct(id); await loadAll();
  };

  // Toggle checklist inline
  const handleToggleChecklist = async (taskId: string, key: keyof ProductionChecklist) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await updateTask(taskId, { checklist: { ...task.checklist, [key]: !task.checklist[key] } });
    await loadAll();
  };

  const VIEWS: { id: ActiveView; label: string }[] = [
    { id: 'kanban', label: 'Kanban' },
    { id: 'kanban-op', label: '⚡ Kanban OP' },
    { id: 'lista', label: 'Lista' },
    { id: 'lanzamientos', label: 'Lanzamientos' },
    { id: 'campanas', label: 'Campañas' },
    { id: 'produccion', label: 'Producción Digital' },
    { id: 'pedidos', label: 'Diseños a Pedido' },
    { id: 'gratis', label: 'Productos Gratis' },
    { id: 'ventas', label: 'Ventas Masivas' },
  ];

  const getActionButton = () => {
    switch (activeView) {
      case 'kanban':
      case 'lista':
      case 'produccion':
      case 'ventas':
        return (
          <button
            onClick={() => { setEditingTask(null); setDefaultColumn(undefined); setShowTaskModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-gold-600/20"
          >
            <Plus size={16} /> Nueva tarea
          </button>
        );
      case 'kanban-op':
        return (
          <button
            onClick={() => { setEditingOpTask(null); setDefaultOpStatus(undefined); setShowOpModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-gold-600/20"
          >
            <Plus size={16} /> Tarea rápida
          </button>
        );
      case 'lanzamientos':
        return (
          <button
            onClick={() => { setEditingLaunch(null); setShowLaunchModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-gold-600/20"
          >
            <Plus size={16} /> Nuevo lanzamiento
          </button>
        );
      case 'campanas':
        return (
          <button
            onClick={() => { setEditingCampaign(null); setShowCampaignModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-gold-600/20"
          >
            <Plus size={16} /> Nueva campaña
          </button>
        );
      case 'pedidos':
        return (
          <button
            onClick={() => { setEditingOrder(null); setShowCustomOrderModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-gold-600/20"
          >
            <Plus size={16} /> Nuevo pedido
          </button>
        );
      case 'gratis':
        return (
          <button
            onClick={() => { setEditingFreeProduct(null); setShowFreeProductModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-gold-600/20"
          >
            <Plus size={16} /> Nuevo producto gratis
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gold-500/10 rounded-xl border border-gold-500/20">
              <CalendarDays size={24} className="text-gold-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">Agenda Moldey</h1>
              <p className="text-carbon-400 text-sm">Centro de planificación y producción de moldes</p>
            </div>
          </div>
        </div>
        {getActionButton()}
      </div>

      {/* Metrics bar */}
      <div className="flex gap-3 overflow-x-auto pb-1">
        <MetricCard label="Tareas pendientes" value={metrics.pending} />
        <MetricCard label="Lanzamientos próximos" value={metrics.upcomingLaunches} color="text-blue-400" />
        <MetricCard label="Campañas activas" value={metrics.activeCampaigns} color="text-emerald-400" />
        <MetricCard label="Listos para publicar" value={metrics.readyToPublish} color="text-green-400" />
        <MetricCard label="Atrasados" value={metrics.overdue} color={metrics.overdue > 0 ? 'text-red-400' : 'text-carbon-400'} />
        <MetricCard label="Pedidos activos" value={metrics.activeOrders} color="text-violet-400" />
        <MetricCard label="Entregas pendientes" value={metrics.pendingDeliveries} color="text-amber-400" />
        <MetricCard label="Productos gratis" value={metrics.freeProducts} color="text-cyan-400" />
      </div>

      {/* View tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 border-b border-navy-600">
        {VIEWS.map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
              activeView === view.id
                ? 'bg-gold-500/10 text-gold-300 border-b-2 border-gold-400'
                : 'text-carbon-400 hover:text-white hover:bg-navy-700'
            }`}
          >
            {view.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-500" />
          <input
            className={`${INPUT_CLS} pl-8`}
            placeholder="Buscar tareas..."
            value={filters.search}
            onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
          />
        </div>
        <select
          className={`${INPUT_CLS} w-auto min-w-[130px]`}
          value={filters.priority}
          onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}
        >
          <option value="">Prioridad</option>
          {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <select
          className={`${INPUT_CLS} w-auto min-w-[160px]`}
          value={filters.taskType}
          onChange={e => setFilters(p => ({ ...p, taskType: e.target.value }))}
        >
          <option value="">Tipo de tarea</option>
          {Object.entries(TASK_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select
          className={`${INPUT_CLS} w-auto min-w-[130px]`}
          value={filters.category}
          onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}
        >
          <option value="">Categoría</option>
          {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {(filters.search || filters.priority || filters.taskType || filters.category) && (
          <button
            onClick={() => setFilters({ search: '', priority: '', taskType: '', category: '' })}
            className="px-3 py-2 text-xs text-carbon-400 hover:text-white border border-navy-600 rounded-lg hover:bg-navy-700 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeView === 'kanban' && (
            <KanbanView tasks={filteredTasks} onCardClick={handleEditTask} onAddColumn={handleAddToColumn} />
          )}
          {activeView === 'kanban-op' && (
            <div className="space-y-3">
              {/* OP Filters */}
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-500" />
                  <input className={`${INPUT_CLS} pl-8`} placeholder="Buscar tarea operativa..." value={opSearch} onChange={e => setOpSearch(e.target.value)} />
                </div>
                <select className={`${INPUT_CLS} w-auto min-w-[120px]`} value={opPriority} onChange={e => setOpPriority(e.target.value)}>
                  <option value="">Prioridad</option>
                  {Object.entries(PRIORITY_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                </select>
                {(opSearch || opPriority) && (
                  <button onClick={() => { setOpSearch(''); setOpPriority(''); }} className="px-3 py-2 text-xs text-carbon-400 hover:text-white border border-navy-600 rounded-lg hover:bg-navy-700 transition-colors">Limpiar</button>
                )}
              </div>
              <KanbanOpView
                tasks={filteredOpTasks}
                onEdit={t => { setEditingOpTask(t); setShowOpModal(true); }}
                onDelete={handleDeleteOpTask}
                onAddToColumn={status => { setEditingOpTask(null); setDefaultOpStatus(status); setShowOpModal(true); }}
              />
            </div>
          )}
          {activeView === 'lista' && (
            <ListView tasks={filteredTasks} onEdit={handleEditTask} onDelete={handleDeleteTask} />
          )}
          {activeView === 'lanzamientos' && (
            <LaunchesView
              launches={launches}
              onEdit={l => { setEditingLaunch(l); setShowLaunchModal(true); }}
              onDelete={handleDeleteLaunch}
            />
          )}
          {activeView === 'campanas' && (
            <CampaignsView
              campaigns={campaigns}
              onEdit={c => { setEditingCampaign(c); setShowCampaignModal(true); }}
              onDelete={handleDeleteCampaign}
            />
          )}
          {activeView === 'produccion' && (
            <ProduccionView tasks={filteredTasks} onToggleChecklist={handleToggleChecklist} />
          )}
          {activeView === 'pedidos' && (
            <PedidosView
              orders={customOrders}
              onEdit={o => { setEditingOrder(o); setShowCustomOrderModal(true); }}
              onDelete={handleDeleteOrder}
            />
          )}
          {activeView === 'gratis' && (
            <GratisView
              products={freeProducts}
              onEdit={p => { setEditingFreeProduct(p); setShowFreeProductModal(true); }}
              onDelete={handleDeleteFreeProduct}
            />
          )}
          {activeView === 'ventas' && (
            <VentasView tasks={filteredTasks} />
          )}
        </>
      )}

      {/* Modals */}
      {showOpModal && (
        <OpTaskModal
          task={editingOpTask}
          defaultStatus={defaultOpStatus}
          onClose={() => { setShowOpModal(false); setEditingOpTask(null); setDefaultOpStatus(undefined); }}
          onSave={handleSaveOpTask}
        />
      )}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          defaultColumn={defaultColumn}
          onClose={() => { setShowTaskModal(false); setEditingTask(null); setDefaultColumn(undefined); }}
          onSave={handleSaveTask}
        />
      )}
      {showLaunchModal && (
        <LaunchModal
          launch={editingLaunch}
          onClose={() => { setShowLaunchModal(false); setEditingLaunch(null); }}
          onSave={handleSaveLaunch}
        />
      )}
      {showCampaignModal && (
        <CampaignModal
          campaign={editingCampaign}
          onClose={() => { setShowCampaignModal(false); setEditingCampaign(null); }}
          onSave={handleSaveCampaign}
        />
      )}
      {showCustomOrderModal && (
        <CustomOrderModal
          order={editingOrder}
          onClose={() => { setShowCustomOrderModal(false); setEditingOrder(null); }}
          onSave={handleSaveOrder}
        />
      )}
      {showFreeProductModal && (
        <FreeProductModal
          product={editingFreeProduct}
          onClose={() => { setShowFreeProductModal(false); setEditingFreeProduct(null); }}
          onSave={handleSaveFreeProduct}
        />
      )}
    </div>
  );
}

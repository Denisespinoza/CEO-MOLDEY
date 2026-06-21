import { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag, Plus, Package, Edit2, Trash2, X, Check,
  Copy, AlertCircle, Link, Image as ImageIcon, ChevronDown,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
type PackStatus = 'activo' | 'pausado' | 'borrador';

type MoldeCategory = 'dama' | 'hombre' | 'nino' | 'nina' | 'bebe' | 'unisex';

interface PackItem {
  id: string;
  image: string;       // base64 o URL
  name: string;
  sizes: string;
  category: MoldeCategory;
  code: string;
}

interface Pack {
  id: string;
  name: string;
  description: string;
  price: number;
  status: PackStatus;
  pack_url: string;
  cover_image: string;
  includes_base_300: boolean;
  items: PackItem[];
  created_at: string;
  updated_at: string;
}

// ─── localStorage helpers ───────────────────────────────────────────────────────
const PACKS_KEY = 'moldey_packs';
function getPacks(): Pack[] {
  try { return JSON.parse(localStorage.getItem(PACKS_KEY) ?? '[]'); } catch { return []; }
}
function savePacks(packs: Pack[]): void {
  try {
    localStorage.setItem(PACKS_KEY, JSON.stringify(packs));
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // QuotaExceededError — lanzar error legible para el usuario
    throw new Error(`No se pudo guardar: espacio insuficiente en el navegador. Intentá con imágenes más pequeñas.\n(${msg})`);
  }
}
function createPackSync(data: Omit<Pack, 'id' | 'created_at' | 'updated_at'>): Pack {
  const now = new Date().toISOString();
  const p: Pack = { ...data, id: Date.now().toString(), created_at: now, updated_at: now };
  savePacks([...getPacks(), p]);
  return p;
}
function updatePackSync(id: string, data: Partial<Omit<Pack, 'id' | 'created_at'>>): Pack {
  const packs = getPacks().map(p =>
    p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
  );
  savePacks(packs);
  return packs.find(p => p.id === id)!;
}
function deletePack(id: string) { savePacks(getPacks().filter(p => p.id !== id)); }

// ─── Constants ─────────────────────────────────────────────────────────────────
const INPUT = 'w-full bg-navy-800 border border-navy-600 rounded-lg px-3 py-2.5 text-white placeholder-carbon-500 focus:outline-none focus:ring-2 focus:ring-gold-500 text-sm';
const LABEL = 'block text-xs font-semibold text-carbon-400 mb-1.5 uppercase tracking-wide';

const STATUS_CONFIG: Record<PackStatus, { label: string; color: string; dot: string }> = {
  activo:   { label: 'Activo',   color: 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/40', dot: 'bg-emerald-400' },
  pausado:  { label: 'Pausado',  color: 'bg-amber-900/50 text-amber-300 border border-amber-700/40',       dot: 'bg-amber-400' },
  borrador: { label: 'Borrador', color: 'bg-carbon-700 text-carbon-300 border border-carbon-600',          dot: 'bg-carbon-400' },
};

const CATEGORY_LABELS: Record<MoldeCategory, string> = {
  dama: 'Dama', hombre: 'Hombre', nino: 'Niño', nina: 'Niña', bebe: 'Bebé', unisex: 'Unisex',
};

const EMPTY_ITEM: PackItem = { id: '', image: '', name: '', sizes: '', category: 'dama', code: '' };

// ─── Image uploader helper — sube a Cloudflare R2 ──────────────────────────────
async function uploadToR2(file: File): Promise<string> {
  const path = `packs-moldey/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('path', path);
  const res = await fetch('/api/r2-upload', { method: 'POST', body: fd });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Error al subir imagen: ${err}`);
  }
  const data = await res.json();
  return data.url as string;
}

function ImageUploader({ value, onChange, className = '', placeholder = 'Subir imagen' }: {
  value: string;
  onChange: (url: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setUploadError('');
    try {
      const url = await uploadToR2(file);
      onChange(url);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : 'Error al subir imagen');
    } finally {
      setLoading(false);
      if (ref.current) ref.current.value = '';
    }
  };
  return (
    <div
      className={`relative cursor-pointer group rounded-xl overflow-hidden border-2 border-dashed border-navy-600 hover:border-gold-500/60 transition-all ${className}`}
      onClick={() => ref.current?.click()}
    >
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-gold-400">
          <div className="w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Subiendo a Cloudflare...</span>
        </div>
      ) : uploadError ? (
        <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-red-400">
          <AlertCircle size={20} />
          <span className="text-xs text-center">{uploadError}</span>
          <span className="text-xs text-carbon-500">Clic para reintentar</span>
        </div>
      ) : value ? (
        <>
          <img src={value} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-semibold flex items-center gap-1"><ImageIcon size={14} /> Cambiar</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full gap-2 p-4 text-carbon-500 group-hover:text-gold-400 transition-colors">
          <ImageIcon size={24} />
          <span className="text-xs text-center">{placeholder}</span>
        </div>
      )}
    </div>
  );
}

// ─── Pack Item Card ─────────────────────────────────────────────────────────────
function PackItemCard({ item, index, onChange, onDelete }: {
  item: PackItem;
  index: number;
  onChange: (item: PackItem) => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(!item.name);
  const set = (f: keyof PackItem, v: string) => onChange({ ...item, [f]: v });

  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-navy-700 flex-shrink-0 border border-navy-600">
          {item.image
            ? <img src={item.image} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-carbon-600"><ImageIcon size={16} /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold truncate">{item.name || `Molde ${index + 1}`}</p>
          <p className="text-carbon-500 text-xs">{item.sizes ? `Talles: ${item.sizes}` : 'Sin talles'} {item.category ? `· ${CATEGORY_LABELS[item.category]}` : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="text-carbon-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <ChevronDown size={14} className={`text-carbon-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Expandido */}
      {open && (
        <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-navy-700">
          <div className="sm:col-span-2">
            <ImageUploader
              value={item.image}
              onChange={v => set('image', v)}
              className="h-36"
              placeholder="Subir foto del molde"
            />
          </div>
          <div>
            <label className={LABEL}>Nombre del molde *</label>
            <input className={INPUT} value={item.name} onChange={e => set('name', e.target.value)} placeholder="Ej: Remera oversize" />
          </div>
          <div>
            <label className={LABEL}>Código (opcional)</label>
            <input className={INPUT} value={item.code} onChange={e => set('code', e.target.value)} placeholder="Ej: RM-01" />
          </div>
          <div>
            <label className={LABEL}>Talles</label>
            <input className={INPUT} value={item.sizes} onChange={e => set('sizes', e.target.value)} placeholder="Ej: S/M/L/XL" />
          </div>
          <div>
            <label className={LABEL}>Categoría</label>
            <select className={INPUT} value={item.category} onChange={e => set('category', e.target.value as MoldeCategory)}>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pack Modal ─────────────────────────────────────────────────────────────────
function PackModal({ pack, onClose, onSave }: {
  pack: Pack | null;
  onClose: () => void;
  onSave: (data: Omit<Pack, 'id' | 'created_at' | 'updated_at'>) => void;
}) {
  const emptyForm: Omit<Pack, 'id' | 'created_at' | 'updated_at'> = {
    name: '', description: '', price: 0, status: 'borrador',
    pack_url: '', cover_image: '', includes_base_300: true,
    items: Array.from({ length: 10 }, (_, i) => ({ ...EMPTY_ITEM, id: `new_${i}` })),
  };

  const [form, setForm] = useState<Omit<Pack, 'id' | 'created_at' | 'updated_at'>>(
    pack
      ? { name: pack.name, description: pack.description, price: pack.price,
          status: pack.status, pack_url: pack.pack_url, cover_image: pack.cover_image,
          includes_base_300: pack.includes_base_300,
          items: pack.items.length >= 10 ? pack.items : [
            ...pack.items,
            ...Array.from({ length: 10 - pack.items.length }, (_, i) => ({ ...EMPTY_ITEM, id: `new_${i}` }))
          ] }
      : emptyForm
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const set = (f: string, v: unknown) => setForm(p => ({ ...p, [f]: v }));

  const updateItem = (index: number, item: PackItem) => {
    const items = [...form.items];
    items[index] = item;
    set('items', items);
  };

  const deleteItem = (index: number) => {
    const items = [...form.items];
    items.splice(index, 1);
    items.push({ ...EMPTY_ITEM, id: `new_${Date.now()}` });
    set('items', items);
  };

  const validate = (): string[] => {
    const e: string[] = [];
    if (!form.name.trim()) e.push('El nombre del pack es obligatorio.');
    if (!form.pack_url.trim()) e.push('El enlace del pack es obligatorio.');
    if (form.status === 'activo') {
      const filled = form.items.filter(i => i.name.trim()).length;
      if (filled < 10) e.push(`Para estado Activo se recomiendan 10 moldes. Tenés ${filled}/10 cargados.`);
    }
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (errs.some(err => err.includes('obligatorio'))) { setErrors(errs); return; }
    setErrors(errs);
    setSaving(true);
    try {
      // Limpiar items vacíos al guardar y asignar IDs definitivos
      const cleanItems = form.items
        .filter(i => i.name.trim())
        .map(i => ({
          ...i,
          id: i.id.startsWith('new_') ? `item_${Date.now()}_${Math.random().toString(36).slice(2)}` : i.id,
        }));
      onSave({ ...form, items: cleanItems });
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al guardar.';
      setErrors(prev => [...prev.filter(e => !e.startsWith('No se pudo guardar')), `❌ ${msg}`]);
      // NO cerramos el modal — el usuario puede intentar de nuevo
    } finally {
      setSaving(false);
    }
  };

  const filledCount = form.items.filter(i => i.name.trim()).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-navy-900 border border-navy-600 rounded-2xl w-full max-w-3xl shadow-2xl my-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-navy-700 sticky top-0 bg-navy-900 z-10 rounded-t-2xl">
          <div>
            <h2 className="text-white font-bold text-lg">{pack ? 'Editar Pack' : 'Crear Pack Moldey'}</h2>
            <p className="text-carbon-400 text-xs mt-0.5">Completá la información del pack</p>
          </div>
          <button onClick={onClose} className="text-carbon-400 hover:text-white transition-colors p-1"><X size={22} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">

          {/* Errores */}
          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((err, i) => (
                <div key={i} className={`flex items-start gap-2 p-3 rounded-lg text-sm ${err.includes('obligatorio') ? 'bg-red-900/30 border border-red-700/40 text-red-300' : 'bg-amber-900/20 border border-amber-700/30 text-amber-300'}`}>
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  {err}
                </div>
              ))}
            </div>
          )}

          {/* ── Sección 1: Info básica ── */}
          <div className="space-y-4">
            <h3 className="text-gold-400 text-xs font-bold uppercase tracking-widest border-b border-navy-700 pb-2">Información del pack</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className={LABEL}>Nombre del pack *</label>
                <input
                  className={INPUT}
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="Ej: Pack Primavera 2026 — 10 moldes"
                  autoFocus
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>Descripción breve</label>
                <textarea
                  className={INPUT}
                  rows={3}
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Describí qué incluye el pack, para quién es, por qué es especial..."
                />
              </div>
              <div>
                <label className={LABEL}>Precio *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-400 text-sm font-bold">$</span>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className={`${INPUT} pl-7`}
                    value={form.price}
                    onChange={e => set('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <label className={LABEL}>Estado</label>
                <select className={INPUT} value={form.status} onChange={e => set('status', e.target.value as PackStatus)}>
                  <option value="borrador">Borrador</option>
                  <option value="activo">Activo</option>
                  <option value="pausado">Pausado</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>Enlace del pack * <span className="normal-case font-normal text-carbon-500">(Drive, checkout, página de venta...)</span></label>
                <div className="relative">
                  <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-carbon-500" />
                  <input
                    className={`${INPUT} pl-8`}
                    value={form.pack_url}
                    onChange={e => set('pack_url', e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </div>
              </div>
            </div>

            {/* Imagen de portada */}
            <div>
              <label className={LABEL}>Imagen de portada del pack</label>
              <ImageUploader
                value={form.cover_image}
                onChange={v => set('cover_image', v)}
                className="h-48"
                placeholder="Subir imagen de portada del pack"
              />
            </div>
          </div>

          {/* ── Sección 2: 300 base ── */}
          <div className="bg-gold-500/5 border border-gold-500/20 rounded-xl p-4 space-y-3">
            <h3 className="text-gold-400 text-xs font-bold uppercase tracking-widest">Bonus incluido en todos los packs</h3>
            <p className="text-carbon-300 text-sm">Este pack incluye automáticamente los <strong className="text-gold-300">300 moldes base</strong> de Moldey.</p>
            <label className="flex items-center gap-3 cursor-pointer group">
              <button
                type="button"
                onClick={() => set('includes_base_300', !form.includes_base_300)}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.includes_base_300 ? 'bg-gold-500' : 'bg-navy-600'}`}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.includes_base_300 ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
              <span className="text-white text-sm font-medium">Incluye 300 moldes base</span>
              {form.includes_base_300 && <Check size={16} className="text-gold-400" />}
            </label>
          </div>

          {/* ── Sección 3: 10 moldes nuevos ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-navy-700 pb-2">
              <div>
                <h3 className="text-gold-400 text-xs font-bold uppercase tracking-widest">10 moldes nuevos del pack</h3>
                <p className="text-carbon-500 text-xs mt-0.5">{filledCount}/10 moldes cargados</p>
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${i < filledCount ? 'bg-gold-400' : 'bg-navy-600'}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {form.items.map((item, index) => (
                <PackItemCard
                  key={item.id}
                  item={item}
                  index={index}
                  onChange={updated => updateItem(index, updated)}
                  onDelete={() => deleteItem(index)}
                />
              ))}
            </div>
          </div>

          {/* ── Botones ── */}
          <div className="flex items-center justify-between pt-4 border-t border-navy-700 sticky bottom-0 bg-navy-900 -mx-6 px-6 py-4 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-carbon-400 hover:text-white border border-navy-600 rounded-lg hover:bg-navy-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-gold-600 hover:bg-gold-500 disabled:opacity-50 text-navy-900 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-gold-600/20 flex items-center gap-2"
            >
              {saving ? 'Guardando...' : (pack ? 'Guardar cambios' : 'Crear pack')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Pack Card ──────────────────────────────────────────────────────────────────
function PackCard({ pack, onEdit, onDelete }: {
  pack: Pack;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const sc = STATUS_CONFIG[pack.status];

  const copyLink = () => {
    if (!pack.pack_url) return;
    navigator.clipboard.writeText(pack.pack_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-navy-800 border border-navy-600 hover:border-gold-500/30 rounded-2xl overflow-hidden transition-all group shadow-lg shadow-black/20">
      {/* Cover */}
      <div className="relative h-44 bg-navy-700">
        {pack.cover_image
          ? <img src={pack.cover_image} alt={pack.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={48} className="text-navy-500" /></div>
        }
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold ${sc.color}`}>
          <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${sc.dot}`} />
          {sc.label}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-white font-bold text-base leading-tight group-hover:text-gold-300 transition-colors">{pack.name}</h3>
          {pack.description && <p className="text-carbon-400 text-xs mt-1 line-clamp-2">{pack.description}</p>}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gold-400 text-xl font-bold">${pack.price.toLocaleString('es-AR')}</span>
          <div className="text-right">
            <p className="text-carbon-300 text-xs font-semibold">{pack.items.length} moldes nuevos</p>
            {pack.includes_base_300 && (
              <p className="text-carbon-500 text-xs">+ 300 moldes base</p>
            )}
          </div>
        </div>

        {/* Galería mini */}
        {pack.items.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {pack.items.slice(0, 8).map((item, i) => (
              <div key={i} className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-navy-700 border border-navy-600" title={item.name}>
                {item.image
                  ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-carbon-600"><Package size={14} /></div>
                }
              </div>
            ))}
            {pack.items.length > 8 && (
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-navy-700 border border-navy-600 flex items-center justify-center text-carbon-400 text-xs font-bold">
                +{pack.items.length - 8}
              </div>
            )}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center gap-2 pt-1 border-t border-navy-700">
          <button
            onClick={onEdit}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-navy-700 hover:bg-navy-600 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Edit2 size={13} /> Ver / Editar
          </button>
          <button
            onClick={copyLink}
            disabled={!pack.pack_url}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${copied ? 'bg-emerald-900/40 border-emerald-700/40 text-emerald-300' : 'bg-navy-700 hover:bg-navy-600 border-navy-600 text-carbon-300 hover:text-white disabled:opacity-40'}`}
            title="Copiar enlace"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => { if (confirm(`¿Eliminar "${pack.name}"?`)) onDelete(); }}
            className="px-3 py-2 bg-navy-700 hover:bg-red-900/40 border border-navy-600 hover:border-red-700/40 text-carbon-400 hover:text-red-400 rounded-lg text-xs transition-colors"
            title="Eliminar pack"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────
export default function PacksMoldey() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPack, setEditingPack] = useState<Pack | null>(null);

  const load = () => setPacks(getPacks());

  useEffect(() => { load(); }, []);

  const handleSave = (data: Omit<Pack, 'id' | 'created_at' | 'updated_at'>) => {
    // Puede lanzar error si localStorage está lleno — el modal lo captura y muestra al usuario
    if (editingPack) updatePackSync(editingPack.id, data);
    else createPackSync(data);
    load();
    setEditingPack(null);
  };

  const handleEdit = (pack: Pack) => {
    setEditingPack(pack);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    deletePack(id);
    load();
  };

  const openCreate = () => { setEditingPack(null); setShowModal(true); };

  // Métricas
  const activos = packs.filter(p => p.status === 'activo').length;
  const productosEnPacks = activos * 10;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Packs Moldey</h1>
          <p className="text-sm text-carbon-400 mt-1">Gestión de packs digitales de moldes</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-gold-600/20"
        >
          <Plus size={16} /> Nuevo Pack
        </button>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Packs activos', value: activos, icon: ShoppingBag, color: 'text-gold-400' },
          { label: 'Moldes nuevos en packs', value: productosEnPacks, icon: Package, color: 'text-blue-400' },
          { label: 'Packs vendidos', value: 0, icon: ShoppingBag, color: 'text-carbon-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-4 p-4 rounded-xl bg-carbon-900 border border-navy-700/50">
            <div className="p-3 rounded-lg bg-gold-500/10">
              <Icon size={20} className="text-gold-400" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-carbon-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Lista de packs o estado vacío */}
      {packs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-navy-800 border border-gold-500/20 rounded-2xl flex items-center justify-center mb-6">
            <ShoppingBag size={40} className="text-gold-400/50" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No hay packs creados todavía</h2>
          <p className="text-carbon-400 text-sm max-w-sm mb-6">
            Creá tu primer pack Moldey para organizar combos de moldes y ofrecerlos a tus clientes.
          </p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-3 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-gold-600/20"
          >
            <Plus size={16} /> Crear primer pack
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {packs.map(pack => (
            <PackCard
              key={pack.id}
              pack={pack}
              onEdit={() => handleEdit(pack)}
              onDelete={() => handleDelete(pack.id)}
            />
          ))}
          {/* Tarjeta agregar más */}
          <button
            onClick={openCreate}
            className="border-2 border-dashed border-navy-600 hover:border-gold-500/50 rounded-2xl flex flex-col items-center justify-center gap-3 p-8 text-carbon-600 hover:text-gold-400 transition-all min-h-[200px]"
          >
            <Plus size={28} />
            <span className="text-sm font-semibold">Nuevo pack</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <PackModal
          pack={editingPack}
          onClose={() => { setShowModal(false); setEditingPack(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

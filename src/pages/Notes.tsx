import { useEffect, useState, useMemo, FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import {
  NotebookPen, Plus, Pin, PinOff, Trash2, Edit3, X, Search, Save, AlertCircle,
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const NOTE_COLORS = [
  { value: '#8B5CF6', label: 'Violeta' },
  { value: '#10B981', label: 'Verde' },
  { value: '#F59E0B', label: 'Ámbar' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#EF4444', label: 'Rojo' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#14B8A6', label: 'Teal' },
  { value: '#F97316', label: 'Naranja' },
  { value: '#64748B', label: 'Gris' },
];

const EMPTY_FORM = { title: '', content: '', color: '#8B5CF6' };

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

// ─── Componente ───────────────────────────────────────────────────────────────

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes]         = useState<Note[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');

  // Formulario (crear / editar)
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);

  // Vista expandida
  const [expanded, setExpanded]   = useState<Note | null>(null);

  useEffect(() => { loadNotes(); }, []);

  // ── Carga ──────────────────────────────────────────────────────────────────

  const loadNotes = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: e } = await supabase
        .from('notes')
        .select('*')
        .order('pinned', { ascending: false })
        .order('updated_at', { ascending: false });
      if (e) throw e;
      setNotes(data || []);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar las notas. Verificá que la migración esté aplicada en Supabase.');
    } finally {
      setLoading(false);
    }
  };

  // ── Guardar (crear / editar) ────────────────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() && !form.content.trim()) { setError('Escribí un título o contenido.'); return; }
    setSaving(true); setError('');
    try {
      if (editingId) {
        const { error: e } = await supabase.from('notes').update({
          title: form.title.trim(),
          content: form.content.trim(),
          color: form.color,
        }).eq('id', editingId);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('notes').insert({
          title: form.title.trim(),
          content: form.content.trim(),
          color: form.color,
          pinned: false,
          created_by: user?.id || null,
        });
        if (e) throw e;
      }
      closeForm();
      await loadNotes();
    } catch (err) { console.error(err); setError('No se pudo guardar la nota.'); }
    finally { setSaving(false); }
  };

  // ── Eliminar ───────────────────────────────────────────────────────────────

  const deleteNote = async (note: Note) => {
    if (!window.confirm(`¿Eliminar la nota "${note.title || 'sin título'}"?`)) return;
    try {
      const { error: e } = await supabase.from('notes').delete().eq('id', note.id);
      if (e) throw e;
      if (expanded?.id === note.id) setExpanded(null);
      await loadNotes();
    } catch (err) { console.error(err); setError('No se pudo eliminar la nota.'); }
  };

  // ── Fijar / desfijar ───────────────────────────────────────────────────────

  const togglePin = async (note: Note) => {
    try {
      const { error: e } = await supabase.from('notes').update({ pinned: !note.pinned }).eq('id', note.id);
      if (e) throw e;
      await loadNotes();
    } catch (err) { console.error(err); setError('No se pudo actualizar la nota.'); }
  };

  // ── Editar ────────────────────────────────────────────────────────────────

  const openEdit = (note: Note) => {
    setEditingId(note.id);
    setForm({ title: note.title, content: note.content, color: note.color });
    setShowForm(true);
    setExpanded(null);
    setError('');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
  };

  // ── Filtro ─────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(n =>
      n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
    );
  }, [notes, search]);

  const pinned   = filtered.filter(n => n.pinned);
  const unpinned = filtered.filter(n => !n.pinned);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-crudo-100 flex items-center gap-2">
            <NotebookPen size={24} className="text-violet-400" /> Notas
          </h1>
          <p className="text-sm text-crudo-400 mt-1">Guardá ideas, apuntes y recordatorios</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setError(''); }}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <Plus size={16} /> Nueva nota
        </button>
      </div>

      {/* Buscador */}
      {notes.length > 0 && (
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar en notas..."
            className="w-full max-w-sm pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/40 text-rose-300 rounded-xl p-3 text-sm flex items-center gap-2">
          <AlertCircle size={16} className="flex-shrink-0" /> {error}
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="bg-slate-800 rounded-xl border border-violet-500/40 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-petrol-300 uppercase tracking-wide">
              {editingId ? 'Editar nota' : 'Nueva nota'}
            </h3>
            <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              placeholder="Título (opcional)"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
            />
            <textarea
              value={form.content}
              onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
              placeholder="Escribí tu nota, idea o apunte acá..."
              rows={5}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/60 resize-y"
            />
            {/* Selector de color */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">Color:</span>
              <div className="flex gap-2 flex-wrap">
                {NOTE_COLORS.map(c => (
                  <button
                    key={c.value} type="button"
                    onClick={() => setForm(p => ({ ...p, color: c.value }))}
                    title={c.label}
                    className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${form.color === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={closeForm} className="px-4 py-2 rounded-lg text-sm border border-slate-600 text-slate-300 hover:bg-slate-700">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white flex items-center gap-1.5">
                <Save size={14} /> {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear nota'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sin notas */}
      {notes.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <NotebookPen size={52} className="text-slate-600" />
          <div>
            <p className="text-crudo-300 font-medium">No tenés notas todavía</p>
            <p className="text-petrol-500 text-sm mt-1">Creá tu primera nota para guardar ideas y apuntes.</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setError(''); }}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Crear primera nota
          </button>
        </div>
      )}

      {/* Sin resultados de búsqueda */}
      {notes.length > 0 && filtered.length === 0 && (
        <p className="text-center text-petrol-500 py-8 text-sm">No hay notas que coincidan con "{search}".</p>
      )}

      {/* Notas fijadas */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-petrol-400 uppercase tracking-wide flex items-center gap-1.5">
            <Pin size={12} /> Fijadas
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {pinned.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => openEdit(note)}
                onDelete={() => deleteNote(note)}
                onTogglePin={() => togglePin(note)}
                onExpand={() => setExpanded(note)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Todas las notas */}
      {unpinned.length > 0 && (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <p className="text-xs font-semibold text-petrol-400 uppercase tracking-wide">Todas las notas</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {unpinned.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onEdit={() => openEdit(note)}
                onDelete={() => deleteNote(note)}
                onTogglePin={() => togglePin(note)}
                onExpand={() => setExpanded(note)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Modal expandido */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setExpanded(null)}>
          <div
            className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-1.5 rounded-t-2xl flex-shrink-0" style={{ backgroundColor: expanded.color }} />
            <div className="flex items-start justify-between p-5 flex-shrink-0">
              <div className="flex items-center gap-2">
                {expanded.pinned && <Pin size={14} className="text-amber-400 flex-shrink-0" />}
                <h2 className="text-lg font-bold text-white">{expanded.title || <span className="text-slate-500 italic">Sin título</span>}</h2>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { openEdit(expanded); }} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-violet-300 transition-colors"><Edit3 size={15} /></button>
                <button onClick={() => setExpanded(null)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"><X size={16} /></button>
              </div>
            </div>
            <div className="px-5 pb-5 overflow-y-auto flex-1">
              <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">{expanded.content || <span className="text-slate-500 italic">Sin contenido</span>}</p>
            </div>
            <div className="px-5 pb-4 text-xs text-slate-500 flex-shrink-0">
              Última edición: {formatDate(expanded.updated_at)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tarjeta de nota ──────────────────────────────────────────────────────────

function NoteCard({ note, onEdit, onDelete, onTogglePin, onExpand }: {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onExpand: () => void;
}) {
  return (
    <div
      className="bg-slate-800 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors flex flex-col cursor-pointer group overflow-hidden"
      onClick={onExpand}
    >
      <div className="h-1 flex-shrink-0" style={{ backgroundColor: note.color }} />
      <div className="p-4 flex flex-col flex-1 gap-2">
        {/* Título */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-crudo-100 text-sm leading-snug line-clamp-2 flex-1">
            {note.title || <span className="text-slate-500 italic font-normal">Sin título</span>}
          </h3>
          {note.pinned && <Pin size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />}
        </div>

        {/* Contenido preview */}
        {note.content && (
          <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed whitespace-pre-wrap flex-1">
            {note.content}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50 mt-auto">
          <span className="text-[11px] text-slate-600">{formatDate(note.updated_at)}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
            <button onClick={onTogglePin} title={note.pinned ? 'Desfijar' : 'Fijar'} className="p-1 rounded-md hover:bg-amber-500/10 text-slate-500 hover:text-amber-400 transition-colors">
              {note.pinned ? <PinOff size={13} /> : <Pin size={13} />}
            </button>
            <button onClick={onEdit} title="Editar" className="p-1 rounded-md hover:bg-violet-500/10 text-slate-500 hover:text-violet-400 transition-colors">
              <Edit3 size={13} />
            </button>
            <button onClick={onDelete} title="Eliminar" className="p-1 rounded-md hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

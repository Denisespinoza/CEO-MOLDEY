import { ShoppingBag, Plus, Package } from 'lucide-react';

export default function PacksMoldey() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Packs Moldey</h1>
          <p className="text-sm text-carbon-400 mt-1">Gestión de packs y combos de productos Moldey</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-gold-600/20">
          <Plus size={16} />
          Nuevo Pack
        </button>
      </div>

      {/* Estado vacío */}
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-navy-800 border border-gold-500/20 rounded-2xl flex items-center justify-center mb-6">
          <ShoppingBag size={40} className="text-gold-400/50" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">No hay packs creados todavía</h2>
        <p className="text-carbon-400 text-sm max-w-sm mb-6">
          Creá tu primer pack Moldey para organizar combos de productos y ofrecerlos a tus clientes.
        </p>
        <button className="flex items-center gap-2 px-5 py-3 bg-gold-600 hover:bg-gold-500 text-navy-900 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-gold-600/20">
          <Plus size={16} />
          Crear primer pack
        </button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Packs activos', value: '0', icon: ShoppingBag },
          { label: 'Productos en packs', value: '0', icon: Package },
          { label: 'Packs vendidos', value: '0', icon: ShoppingBag },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center gap-4 p-4 rounded-xl bg-carbon-900 border border-navy-700/50">
            <div className="p-3 rounded-lg bg-gold-500/10">
              <Icon size={20} className="text-gold-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-xs text-carbon-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

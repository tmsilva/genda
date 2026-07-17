import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Edit2, Trash2, AlertTriangle, CheckCircle, Package, ArrowDown, ArrowUp, RefreshCw, X
} from 'lucide-react';
import { StockItem } from '../types';

interface EstoqueViewProps {
  stock: StockItem[];
  onUpdateStock: (s: StockItem[]) => void;
  isDark?: boolean;
}

export default function EstoqueView({ stock, onUpdateStock, isDark = false }: EstoqueViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formQuantity, setFormQuantity] = useState(0);
  const [formMinQuantity, setFormMinQuantity] = useState(5);
  const [formUnit, setFormUnit] = useState('un');

  const [alertMessage, setAlertMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const triggerAlert = (text: string, type: 'success' | 'error' = 'success') => {
    setAlertMessage({ text, type });
    setTimeout(() => setAlertMessage(null), 3000);
  };

  // Filter and statistics
  const filteredStock = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return stock.filter(item => item.name.toLowerCase().includes(term));
  }, [stock, searchTerm]);

  const stats = useMemo(() => {
    const totalItems = stock.length;
    const lowStockItems = stock.filter(item => item.quantity > 0 && item.quantity <= item.minQuantity).length;
    const outOfStockItems = stock.filter(item => item.quantity === 0).length;
    return { totalItems, lowStockItems, outOfStockItems };
  }, [stock]);

  // Handlers
  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormName('');
    setFormQuantity(0);
    setFormMinQuantity(5);
    setFormUnit('un');
    setShowFormModal(true);
  };

  const handleOpenEdit = (item: StockItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormQuantity(item.quantity);
    setFormMinQuantity(item.minQuantity);
    setFormUnit(item.unit);
    setShowFormModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const itemData: StockItem = {
      id: editingItem ? editingItem.id : Math.random().toString(36).substr(2, 9),
      name: formName.trim(),
      quantity: formQuantity,
      minQuantity: formMinQuantity,
      unit: formUnit,
      lastUpdated: new Date().toISOString()
    };

    if (editingItem) {
      onUpdateStock(stock.map(item => item.id === editingItem.id ? itemData : item));
      triggerAlert('Material atualizado com sucesso!');
    } else {
      onUpdateStock([...stock, itemData]);
      triggerAlert('Novo material cadastrado!');
    }
    setShowFormModal(false);
  };

  const handleDeleteItem = (id: string) => {
    onUpdateStock(stock.filter(item => item.id !== id));
    triggerAlert('Material excluído do estoque!');
  };

  const adjustQuantity = (item: StockItem, amount: number) => {
    const newQty = Math.max(0, item.quantity + amount);
    onUpdateStock(stock.map(i => i.id === item.id ? { 
      ...i, 
      quantity: newQty, 
      lastUpdated: new Date().toISOString() 
    } : i));
    triggerAlert(`Quantidade de "${item.name}" atualizada!`);
  };

  return (
    <div className="space-y-4" id="stock-tab-root">
      
      {/* HEADER & CONTROLS */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`font-display font-bold text-xl ${isDark ? 'text-white' : 'text-slate-900'} leading-tight`}>Controle de Estoque</h2>
          <span className={`text-xs ${isDark ? 'text-zinc-500' : 'text-slate-500'} font-mono`}>
            {stock.length} materiais cadastrados
          </span>
        </div>
        
        <button
          onClick={handleOpenCreate}
          className={`${isDark ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-950 hover:bg-slate-800'} text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer animate-fade-in`}
          id="btn-add-stock-item"
        >
          <Plus className="w-4 h-4" />
          Novo Material
        </button>
      </div>

      {/* STATS OVERVIEW BENTO GRID */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`${isDark ? 'bg-zinc-900 border-zinc-805' : 'bg-white border-slate-100'} p-4 rounded-2xl border shadow-sm flex flex-col justify-between`}>
          <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'} font-mono uppercase`}>Total de Itens</span>
          <span className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-800'} mt-1 font-mono`}>{stats.totalItems}</span>
        </div>
        <div className={`${isDark ? 'bg-zinc-900 border-zinc-805' : 'bg-white border-slate-100'} p-4 rounded-2xl border shadow-sm flex flex-col justify-between`}>
          <span className="text-[10px] text-amber-500 font-mono uppercase">Estoque Baixo</span>
          <span className={`text-xl font-black mt-1 font-mono ${stats.lowStockItems > 0 ? 'text-amber-500' : (isDark ? 'text-zinc-600' : 'text-slate-400')}`}>
            {stats.lowStockItems}
          </span>
        </div>
        <div className={`${isDark ? 'bg-zinc-900 border-zinc-805' : 'bg-white border-slate-100'} p-4 rounded-2xl border shadow-sm flex flex-col justify-between`}>
          <span className="text-[10px] text-red-500 font-mono uppercase">Esgotados</span>
          <span className={`text-xl font-black mt-1 font-mono ${stats.outOfStockItems > 0 ? 'text-red-500' : (isDark ? 'text-zinc-600' : 'text-slate-400')}`}>
            {stats.outOfStockItems}
          </span>
        </div>
      </div>

      {/* SEARCH AND NOTIFICATIONS */}
      <div className="relative">
        <span className={`absolute inset-y-0 left-0 pl-3 flex items-center ${isDark ? 'text-zinc-500' : 'text-slate-400'}`}>
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Buscar material por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full ${
            isDark 
              ? 'bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:border-zinc-700' 
              : 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-slate-800'
          } rounded-xl pl-10 pr-4 py-2.5 text-xs transition-all shadow-sm focus:outline-none`}
        />
      </div>

      {/* CRITICAL STOCK ALERTS */}
      {stock.some(item => item.quantity <= item.minQuantity) && (
        <div className={`${isDark ? 'bg-amber-950/20 border-amber-900/35 text-amber-300' : 'bg-amber-50/70 border-amber-200/50 text-amber-900'} rounded-2xl p-3.5 flex items-start gap-2.5 text-xs border`}>
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Atenção ao Estoque:</span>
            <p className={`${isDark ? 'text-amber-400/90' : 'text-amber-800'} leading-normal mt-0.5`}>
              Existem itens com estoque abaixo do mínimo de segurança ou esgotados. Recomendamos a reposição para evitar a indisponibilidade nos atendimentos.
            </p>
          </div>
        </div>
      )}

      {/* STOCK LIST */}
      {filteredStock.length === 0 ? (
        <div className={`${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-100'} rounded-2xl p-10 text-center border shadow-sm space-y-2`}>
          <Package className={`w-10 h-10 ${isDark ? 'text-zinc-700' : 'text-slate-200'} mx-auto`} />
          <h3 className={`font-display font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'} text-sm`}>Nenhum item correspondente</h3>
          <p className={`text-xs ${isDark ? 'text-zinc-550' : 'text-slate-400'} max-w-xs mx-auto font-sans`}>Adicione materiais como toalhas, navalhas, cremes e loções para controlar o estoque.</p>
        </div>
      ) : (
        <div className={`${isDark ? 'bg-zinc-900 border-zinc-850 divide-zinc-800/60' : 'bg-white border-slate-100 divide-slate-100'} rounded-2xl border shadow-sm divide-y overflow-hidden`}>
          {filteredStock.map((item) => {
            const isOutOfStock = item.quantity === 0;
            const isLowStock = !isOutOfStock && item.quantity <= item.minQuantity;

            return (
              <div 
                key={item.id} 
                className={`p-3 sm:p-4 flex flex-col gap-2 ${isDark ? 'hover:bg-zinc-850/40' : 'hover:bg-slate-50/20'} transition-all`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="flex-1 min-w-0 flex flex-col">
                      <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'} text-sm leading-snug break-words`}>
                        {item.name}
                      </span>
                      <div className="mt-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border max-w-fit flex items-center gap-1 uppercase tracking-wide ${
                          isOutOfStock 
                            ? (isDark ? 'bg-red-950/40 text-red-300 border-red-900/30' : 'bg-red-50 text-red-600 border-red-100') 
                            : isLowStock 
                            ? (isDark ? 'bg-amber-950/40 text-amber-300 border-amber-900/30' : 'bg-amber-50 text-amber-600 border-amber-100') 
                            : (isDark ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100')
                        }`}>
                          {isOutOfStock ? 'ESGOTADO' : isLowStock ? 'ESTOQUE BAIXO' : 'NORMAL'}
                        </span>
                      </div>
                      <div className={`flex flex-col gap-0.5 mt-2 text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-400'} font-mono`}>
                        <span>Mín: {item.minQuantity} {item.unit}</span>
                        <span>Atualizado: {new Date(item.lastUpdated).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between self-stretch shrink-0 pl-2">
                    {/* QUANTITY CONTROL BUTTONS */}
                    <div className={`flex items-center gap-1.5 ${isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-slate-50 border-slate-150'} p-1 rounded-xl border`}>
                      <button
                        onClick={() => adjustQuantity(item, -1)}
                        className={`w-7 h-7 ${isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300' : 'bg-white hover:bg-slate-100 border-slate-200/50 text-slate-600'} rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-95`}
                        title="Diminuir"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <span className={`w-10 sm:w-12 text-center font-extrabold ${isDark ? 'text-white' : 'text-slate-900'} font-mono text-sm`}>
                        {item.quantity} <span className={`text-[9px] sm:text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-400'} font-normal font-sans`}>{item.unit}</span>
                      </span>
                      <button
                        onClick={() => adjustQuantity(item, 1)}
                        className={`w-7 h-7 ${isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300' : 'bg-white hover:bg-slate-100 border-slate-200/50 text-slate-600'} rounded-lg flex items-center justify-center cursor-pointer transition-all active:scale-95`}
                        title="Aumentar"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* EDIT & DELETE */}
                    <div className="flex items-center gap-1 mt-auto -mr-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className={`p-1.5 text-slate-400 ${isDark ? 'hover:text-indigo-400 hover:bg-zinc-800' : 'hover:text-indigo-600 hover:bg-indigo-50/50'} rounded-lg transition-all cursor-pointer`}
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className={`p-1.5 text-slate-400 ${isDark ? 'hover:text-rose-400 hover:bg-zinc-800' : 'hover:text-rose-600 hover:bg-rose-50/50'} rounded-lg transition-all cursor-pointer`}
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MATERIAL FORM MODAL */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.98 }}
              className={`${
                isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100 shadow-zinc-950/30' : 'bg-white border-slate-100 text-slate-700 shadow-2xl'
              } rounded-2xl border p-6 max-w-md w-full mx-4 relative`}
            >
              <button
                onClick={() => setShowFormModal(false)}
                className={`absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 ${isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-50'} transition-all cursor-pointer`}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 mb-5">
                <div className={`p-2.5 rounded-xl ${isDark ? 'bg-zinc-950 text-indigo-400' : 'bg-slate-50 text-slate-700'}`}>
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className={`font-display font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'} leading-tight`}>
                    {editingItem ? 'Editar Material' : 'Novo Material'}
                  </h3>
                  <span className={`text-[10px] uppercase font-mono ${isDark ? 'text-zinc-550' : 'text-slate-400'}`}>
                    Gerenciamento de Estoque
                  </span>
                </div>
              </div>

              <form onSubmit={handleSaveItem} className={`space-y-4 text-xs ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                <div>
                  <label className={`block font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'} mb-1.5`}>
                    Nome do Material <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Navalha Descartável de Inox"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className={`w-full ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:border-zinc-700 focus:outline-none' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-slate-800 focus:outline-none'
                    } rounded-xl px-3 py-2 text-xs`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'} mb-1.5`}>
                      Quantidade Atual
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(Number(e.target.value))}
                      className={`w-full ${
                        isDark 
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-zinc-700 focus:outline-none' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-800 focus:outline-none'
                      } rounded-xl px-3 py-2 text-xs font-mono`}
                    />
                  </div>

                  <div>
                    <label className={`block font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'} mb-1.5`}>
                      Estoque Mínimo <span className={`text-[10px] ${isDark ? 'text-zinc-550' : 'text-slate-400'}`}>(Aviso)</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formMinQuantity}
                      onChange={(e) => setFormMinQuantity(Number(e.target.value))}
                      className={`w-full ${
                        isDark 
                          ? 'bg-zinc-950 border-zinc-800 text-zinc-100 focus:border-zinc-700 focus:outline-none' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-800 focus:outline-none'
                      } rounded-xl px-3 py-2 text-xs font-mono`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block font-semibold ${isDark ? 'text-zinc-300' : 'text-slate-700'} mb-1.5`}>
                    Unidade de Medida
                  </label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className={`w-full ${
                      isDark 
                        ? 'bg-zinc-950 border-zinc-800 text-zinc-200 focus:border-zinc-700' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-850'
                    } rounded-xl px-3 py-2 text-xs focus:outline-none appearance-none`}
                  >
                    <option value="un">Unidades (un)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="g">Gramas (g)</option>
                    <option value="pacote">Pacotes (pct)</option>
                  </select>
                </div>

                <div className={`flex gap-3 pt-3.5 border-t ${isDark ? 'border-zinc-800' : 'border-slate-100'}`}>
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className={`flex-1 py-2.5 rounded-xl border ${
                      isDark ? 'border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white' : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    } font-bold text-xs cursor-pointer text-center transition-all`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-2.5 rounded-xl ${
                      isDark ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
                    } font-bold text-xs cursor-pointer text-center transition-all shadow-md active:scale-98`}
                  >
                    Salvar Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALERT TOASTS */}
      <AnimatePresence>
        {alertMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-full mx-4"
          >
            <div className={`p-4 rounded-xl shadow-2xl border flex items-center gap-3 ${
              alertMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-red-50 border-red-100 text-red-800'
            }`}>
              <CheckCircle className={`w-5 h-5 shrink-0 ${alertMessage.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className="text-xs font-semibold">{alertMessage.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Check, Trash2, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PackingData, PackingItem, LuggageConfig, ITEM_WEIGHTS, SECURITY_RULES, getDefaultPackingItems } from '@/types/packing';

interface SmartPackingProps {
  tripId: string;
  destination: string;
  duration: number;
  packingData: PackingData | null;
  onUpdate: (data: PackingData) => void;
}

const SmartPacking = ({ tripId, destination, duration, packingData, onUpdate }: SmartPackingProps) => {
  const [luggage, setLuggage] = useState<LuggageConfig>(
    packingData?.luggage || {
      type: 'checked',
      dimensions: { height: 55, width: 40, depth: 20 },
      weightLimit: 23,
    }
  );
  const [items, setItems] = useState<PackingItem[]>(
    packingData?.items || getDefaultPackingItems()
  );
  const [addItemModal, setAddItemModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', weight: 0.3, category: 'roupas' as PackingItem['category'] });

  // Calculate totals
  const totalWeight = items.filter((i) => i.checked).reduce((acc, item) => acc + item.weight * item.quantity, 0);
  const volume = luggage.dimensions.height * luggage.dimensions.width * luggage.dimensions.depth;
  const volumeL = Math.round(volume / 1000);
  const weightPercentage = Math.min((totalWeight / luggage.weightLimit) * 100, 100);
  const excessWeight = Math.max(0, totalWeight - luggage.weightLimit);

  // Status
  const getWeightStatus = (): 'ok' | 'warning' | 'overweight' => {
    if (totalWeight > luggage.weightLimit) return 'overweight';
    if (weightPercentage >= 90) return 'warning';
    return 'ok';
  };
  const status = getWeightStatus();

  // Security alerts
  const securityAlerts = items.filter((i) => i.checked && i.securityAlert);

  // Update parent when data changes
  useEffect(() => {
    onUpdate({
      luggage,
      items,
      totalWeight,
      status,
    });
  }, [items, luggage]);

  const handleToggleItem = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleAddItem = () => {
    if (!newItem.name) return;

    const newItemData: PackingItem = {
      id: `custom-${Date.now()}`,
      name: newItem.name,
      weight: newItem.weight,
      quantity: 1,
      checked: true,
      category: newItem.category,
    };

    setItems((prev) => [...prev, newItemData]);
    setNewItem({ name: '', weight: 0.3, category: 'roupas' });
    setAddItemModal(false);
  };

  const getCategoryIcon = (category: PackingItem['category']) => {
    const icons: Record<string, string> = {
      roupas: '👕',
      calcados: '👟',
      eletronicos: '🔌',
      higiene: '🧴',
      documentos: '📄',
      outros: '📦',
    };
    return icons[category] || '📦';
  };

  const getCategoryLabel = (category: PackingItem['category']) => {
    const labels: Record<string, string> = {
      roupas: 'Roupas',
      calcados: 'Calçados',
      eletronicos: 'Eletrônicos',
      higiene: 'Higiene & Líquidos',
      documentos: 'Documentos & Essenciais',
      outros: 'Outros',
    };
    return labels[category] || 'Outros';
  };

  const getCategoryWeight = (category: PackingItem['category']) => {
    return items
      .filter((i) => i.category === category && i.checked)
      .reduce((acc, item) => acc + item.weight * item.quantity, 0);
  };

  const categories: PackingItem['category'][] = ['roupas', 'calcados', 'eletronicos', 'higiene', 'documentos', 'outros'];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🧳</span>
          <h2 className="font-bold text-lg text-[#f8fafc] font-['Outfit']">Smart Packing</h2>
        </div>
        <p className="text-[#94a3b8] text-sm font-['Plus_Jakarta_Sans']">
          "Deixa eu te ajudar a não pagar taxa de bagagem!"
        </p>
        <p className="text-[#64748b] text-xs mt-2">
          Destino: {destination} • {duration} dias
        </p>
      </div>

      {/* Security Alerts */}
      {securityAlerts.length > 0 && (
        <div className={`border rounded-2xl p-4 ${
          securityAlerts.some((a) => a.securityAlert === 'HAND_LUGGAGE_ONLY')
            ? 'bg-[#eab308]/10 border-[#eab308]'
            : 'bg-[#3b82f6]/10 border-[#3b82f6]'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-[#eab308]" />
            <h3 className="font-semibold text-[#f8fafc] font-['Outfit']">
              Alertas de Segurança
            </h3>
            <span className="text-xs bg-[#eab308]/20 text-[#eab308] px-2 py-0.5 rounded-full">
              {securityAlerts.length} itens
            </span>
          </div>
          <div className="space-y-3">
            {securityAlerts.map((item) => {
              const rule = SECURITY_RULES[item.securityAlert || ''];
              return (
                <div key={item.id} className="flex items-start gap-2">
                  <span className={`text-sm ${
                    item.securityAlert === 'HAND_LUGGAGE_ONLY' ? 'text-[#eab308]' : 'text-[#3b82f6]'
                  }`}>
                    ⚠️
                  </span>
                  <div>
                    <p className="text-sm text-[#f8fafc] font-medium">{item.name}</p>
                    <p className="text-xs text-[#94a3b8]">{rule?.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 pt-3 border-t border-[#334155]">
            <p className="text-xs text-[#94a3b8] flex items-center gap-1">
              <Info size={12} />
              Objetos cortantes (tesoura, canivete) sempre na mala despachada!
            </p>
          </div>
        </div>
      )}

      {/* Luggage Configuration */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4">
        <h3 className="font-semibold text-[#f8fafc] mb-4 font-['Outfit'] flex items-center gap-2">
          📐 Sua Mala
        </h3>

        {/* Luggage Type */}
        <div className="flex gap-2 mb-4">
          {[
            { id: 'hand' as const, label: '🎒 Mão', limit: 10 },
            { id: 'checked' as const, label: '🧳 Despachada', limit: 23 },
            { id: 'both' as const, label: '📦 Ambas', limit: 33 },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setLuggage((prev) => ({ ...prev, type: type.id, weightLimit: type.limit }))}
              className={`flex-1 py-2 px-3 rounded-xl text-sm transition-colors ${
                luggage.type === type.id
                  ? 'bg-[#10b981] text-white'
                  : 'bg-[#0f172a] text-[#94a3b8] border border-[#334155] hover:border-[#10b981]'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Dimensions */}
        <div className="bg-[#0f172a] rounded-xl p-4 mb-4">
          <p className="text-sm text-[#94a3b8] mb-3">Dimensões (cm):</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'height', label: 'Altura' },
              { key: 'width', label: 'Largura' },
              { key: 'depth', label: 'Profund.' },
            ].map((dim) => (
              <div key={dim.key}>
                <label className="text-xs text-[#64748b]">{dim.label}</label>
                <input
                  type="number"
                  value={luggage.dimensions[dim.key as keyof typeof luggage.dimensions]}
                  onChange={(e) =>
                    setLuggage((prev) => ({
                      ...prev,
                      dimensions: {
                        ...prev.dimensions,
                        [dim.key]: parseInt(e.target.value) || 0,
                      },
                    }))
                  }
                  className="w-full mt-1 px-3 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f8fafc] text-center focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                />
              </div>
            ))}
          </div>

          {/* Weight Limit */}
          <div className="mt-4">
            <label className="text-xs text-[#64748b]">Limite de peso da cia (kg)</label>
            <input
              type="number"
              value={luggage.weightLimit}
              onChange={(e) => setLuggage((prev) => ({ ...prev, weightLimit: parseInt(e.target.value) || 23 }))}
              className="w-full mt-1 px-3 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
            />
          </div>

          <p className="text-xs text-[#64748b] mt-3">
            Volume calculado: {volume.toLocaleString()} cm³ ({volumeL}L)
          </p>
        </div>

        {/* Tip */}
        <div className="flex items-start gap-2 text-xs text-[#94a3b8] bg-[#0f172a] rounded-xl p-3">
          <span>💡</span>
          <p>Malas de 23kg custam R$0. Cada kg extra sai por ~R$50 no balcão. Vamos evitar isso!</p>
        </div>
      </div>

      {/* Weight Summary */}
      <div className={`border rounded-2xl p-4 ${
        status === 'overweight' 
          ? 'bg-[#ef4444]/10 border-[#ef4444]' 
          : status === 'warning'
            ? 'bg-[#eab308]/10 border-[#eab308]'
            : 'bg-[#1e293b] border-[#334155]'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-[#f8fafc] font-['Outfit'] flex items-center gap-2">
            ⚖️ Peso Total
          </h3>
          {status === 'overweight' && (
            <span className="text-xs bg-[#ef4444] text-white px-2 py-0.5 rounded-full animate-pulse">
              🔴 SOBREPESO
            </span>
          )}
          {status === 'warning' && (
            <span className="text-xs bg-[#eab308] text-[#0f172a] px-2 py-0.5 rounded-full">
              ⚠️ ATENÇÃO
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#94a3b8]">{totalWeight.toFixed(1)} kg / {luggage.weightLimit} kg</span>
            <span className={`${
              status === 'overweight' ? 'text-[#ef4444]' :
              status === 'warning' ? 'text-[#eab308]' : 'text-[#10b981]'
            }`}>
              {status === 'overweight' ? `+${excessWeight.toFixed(1)} kg` : `${weightPercentage.toFixed(0)}%`}
            </span>
          </div>
          <div className="h-3 bg-[#0f172a] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                status === 'overweight' ? 'bg-[#ef4444]' :
                status === 'warning' ? 'bg-[#eab308]' : 'bg-[#10b981]'
              }`}
              style={{ width: `${Math.min(weightPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Status Message */}
        {status === 'ok' && (
          <p className="text-sm text-[#10b981] flex items-center gap-2">
            <Check size={16} />
            Dentro do limite! Folga de {(luggage.weightLimit - totalWeight).toFixed(1)} kg
          </p>
        )}
        {status === 'warning' && (
          <p className="text-sm text-[#eab308]">
            💡 "Quase no limite! Só {(luggage.weightLimit - totalWeight).toFixed(1)} kg de folga. Vai trazer compras?"
          </p>
        )}
        {status === 'overweight' && (
          <div className="space-y-2">
            <p className="text-sm text-[#ef4444]">
              💸 Taxa estimada no balcão: ~R$ {(excessWeight * 50).toFixed(0)} (R$ 50/kg)
            </p>
            <p className="text-xs text-[#94a3b8]">
              💡 "Ei, vamos resolver isso? Tira alguns itens ou move algo pra bagagem de mão!"
            </p>
          </div>
        )}

        {/* Category Breakdown */}
        <div className="mt-4 pt-4 border-t border-[#334155] space-y-2">
          {categories.map((category) => {
            const catWeight = getCategoryWeight(category);
            if (catWeight === 0) return null;
            const catPercentage = (catWeight / totalWeight) * 100;

            return (
              <div key={category} className="flex items-center gap-3 text-sm">
                <span className="w-6 text-center">{getCategoryIcon(category)}</span>
                <span className="flex-1 text-[#94a3b8]">{getCategoryLabel(category)}</span>
                <span className="text-[#f8fafc]">{catWeight.toFixed(1)} kg</span>
                <div className="w-20 h-2 bg-[#0f172a] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10b981] rounded-full"
                    style={{ width: `${catPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
          {totalWeight < luggage.weightLimit && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-6 text-center">🎁</span>
              <span className="flex-1 text-[#64748b]">Espaço pra compras!</span>
              <span className="text-[#64748b]">{(luggage.weightLimit - totalWeight).toFixed(1)} kg</span>
            </div>
          )}
        </div>
      </div>

      {/* Items by Category */}
      {categories.map((category) => {
        const categoryItems = items.filter((i) => i.category === category);
        if (categoryItems.length === 0) return null;

        const catWeight = getCategoryWeight(category);

        return (
          <div key={category} className="bg-[#1e293b] border border-[#334155] rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-[#334155]">
              <h3 className="font-semibold text-[#f8fafc] font-['Outfit'] flex items-center gap-2">
                {getCategoryIcon(category)} {getCategoryLabel(category)}
              </h3>
              <span className="text-sm text-[#94a3b8]">
                Peso: {catWeight.toFixed(1)} kg
              </span>
            </div>
            <div className="divide-y divide-[#334155]">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 flex items-center gap-3 transition-colors ${
                    item.checked ? '' : 'opacity-60'
                  }`}
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleItem(item.id)}
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                      item.checked
                        ? 'bg-[#10b981] border-[#10b981]'
                        : 'border-[#334155] hover:border-[#10b981]'
                    }`}
                  >
                    {item.checked && <Check size={14} className="text-white" />}
                  </button>

                  {/* Item Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${item.checked ? 'text-[#f8fafc]' : 'text-[#94a3b8]'}`}>
                        {item.name}
                      </span>
                      {item.securityAlert && (
                        <span className="text-xs bg-[#eab308]/20 text-[#eab308] px-1.5 py-0.5 rounded">
                          ⚠️
                        </span>
                      )}
                    </div>
                    {item.securityAlert && (
                      <p className="text-xs text-[#eab308] mt-0.5">
                        {SECURITY_RULES[item.securityAlert]?.shortMessage}
                      </p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="w-6 h-6 rounded bg-[#0f172a] text-[#94a3b8] text-sm hover:text-[#f8fafc]"
                    >
                      -
                    </button>
                    <span className="w-6 text-center text-sm text-[#f8fafc]">×{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      className="w-6 h-6 rounded bg-[#0f172a] text-[#94a3b8] text-sm hover:text-[#f8fafc]"
                    >
                      +
                    </button>
                  </div>

                  {/* Weight */}
                  <span className="text-sm text-[#94a3b8] w-16 text-right">
                    {(item.weight * item.quantity).toFixed(2)} kg
                  </span>

                  {/* Remove */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1 text-[#64748b] hover:text-[#ef4444] transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add Item Button */}
      <button
        onClick={() => setAddItemModal(true)}
        className="w-full py-4 bg-[#1e293b] border border-dashed border-[#334155] rounded-2xl text-[#94a3b8] font-['Outfit'] flex items-center justify-center gap-2 hover:border-[#10b981] hover:text-[#f8fafc] transition-colors"
      >
        <Plus size={20} />
        Adicionar Item
      </button>

      {/* Destination Suggestions */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-4">
        <h3 className="font-semibold text-[#f8fafc] mb-3 font-['Outfit'] flex items-center gap-2">
          🌡️ Sugestões para {destination}
        </h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-[#10b981] mb-2">✅ Inclua:</p>
            <ul className="text-sm text-[#94a3b8] space-y-1 pl-4">
              <li>• Casaco leve ou jaqueta (noites frias)</li>
              <li>• Guarda-chuva compacto</li>
              <li>• Sapato confortável para caminhar</li>
            </ul>
          </div>
          <div>
            <p className="text-sm text-[#ef4444] mb-2">❌ Pode deixar:</p>
            <ul className="text-sm text-[#94a3b8] space-y-1 pl-4">
              <li>• Roupas de praia (se não for destino tropical)</li>
              <li>• Muitas roupas de frio pesado</li>
            </ul>
          </div>
          <div className="pt-3 border-t border-[#334155]">
            <p className="text-xs text-[#94a3b8] flex items-start gap-2">
              <span>🎯</span>
              <span>
                <strong className="text-[#eab308]">Dica do Clã:</strong> "Leva uma sacola dobrável vazia — você vai querer trazer lembranças!"
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      <Dialog open={addItemModal} onOpenChange={setAddItemModal}>
        <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc] max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-['Outfit']">➕ Adicionar Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#94a3b8] mb-2">Nome do item</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Camiseta extra"
                className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#94a3b8] mb-2">Peso estimado (kg)</label>
              <input
                type="number"
                step="0.1"
                value={newItem.weight}
                onChange={(e) => setNewItem((prev) => ({ ...prev, weight: parseFloat(e.target.value) || 0.1 }))}
                className="w-full px-4 py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#10b981]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#94a3b8] mb-2">Categoria</label>
              <div className="grid grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setNewItem((prev) => ({ ...prev, category: cat }))}
                    className={`py-2 px-3 rounded-lg text-xs transition-colors ${
                      newItem.category === cat
                        ? 'bg-[#10b981] text-white'
                        : 'bg-[#0f172a] text-[#94a3b8] border border-[#334155]'
                    }`}
                  >
                    {getCategoryIcon(cat)} {getCategoryLabel(cat).split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleAddItem}
              disabled={!newItem.name}
              className="w-full py-3 bg-gradient-to-r from-[#10b981] to-[#0ea5e9] text-white rounded-xl font-semibold disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SmartPacking;

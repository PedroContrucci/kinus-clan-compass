import { useState } from 'react';
import { useParams } from 'react-router-dom';

const ITEM_DATABASE = {
  clothes: [
    { id: 'camiseta', name: 'Camiseta', weight: 0.15, icon: '👕' },
    { id: 'calca_jeans', name: 'Calça Jeans', weight: 0.50, icon: '👖' },
    { id: 'shorts', name: 'Shorts', weight: 0.20, icon: '🩳' },
    { id: 'vestido', name: 'Vestido', weight: 0.30, icon: '👗' },
    { id: 'casaco', name: 'Casaco', weight: 0.80, icon: '🧥' },
    { id: 'underwear', name: 'Cueca/Calcinha', weight: 0.05, icon: '🩲' },
    { id: 'meias', name: 'Par de Meias', weight: 0.03, icon: '🧦' },
  ],
  shoes: [
    { id: 'tenis', name: 'Tênis', weight: 0.80, icon: '👟' },
    { id: 'sapato', name: 'Sapato', weight: 0.70, icon: '👞' },
    { id: 'sandalia', name: 'Sandália', weight: 0.30, icon: '🩴' },
  ],
  hygiene: [
    { id: 'shampoo', name: 'Shampoo 100ml', weight: 0.12, icon: '🧴', restriction: 'LIQUID_100ML' },
    { id: 'condicionador', name: 'Condicionador 100ml', weight: 0.12, icon: '🧴', restriction: 'LIQUID_100ML' },
    { id: 'escova_dente', name: 'Escova de Dente', weight: 0.05, icon: '🪥' },
    { id: 'creme_dental', name: 'Creme Dental', weight: 0.10, icon: '🦷' },
    { id: 'desodorante', name: 'Desodorante', weight: 0.10, icon: '🧴' },
  ],
  electronics: [
    { id: 'notebook', name: 'Notebook', weight: 1.50, icon: '💻' },
    { id: 'tablet', name: 'Tablet', weight: 0.50, icon: '📱' },
    { id: 'carregador', name: 'Carregador', weight: 0.20, icon: '🔌' },
    { id: 'powerbank', name: 'Power Bank', weight: 0.40, icon: '🔋', restriction: 'HAND_ONLY' },
    { id: 'fones', name: 'Fones de Ouvido', weight: 0.25, icon: '🎧' },
    { id: 'adaptador', name: 'Adaptador de Tomada', weight: 0.10, icon: '🔌' },
  ],
};

interface PackedItem {
  id: string;
  name: string;
  weight: number;
  icon: string;
  quantity: number;
  restriction?: string;
}

export const SmartPackingPage = () => {
  useParams();
  
  const [luggageType, setLuggageType] = useState<'hand' | 'checked' | 'both'>('checked');
  const [dimensions, setDimensions] = useState({ height: 55, width: 40, depth: 20 });
  const [weightLimit, setWeightLimit] = useState(23);
  const [packedItems, setPackedItems] = useState<PackedItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('clothes');
  
  const totalWeight = packedItems.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const weightPercentage = (totalWeight / weightLimit) * 100;
  const isOverweight = totalWeight > weightLimit;
  
  const volume = (dimensions.height * dimensions.width * dimensions.depth) / 1000;
  
  const addItem = (item: typeof ITEM_DATABASE.clothes[0], quantity: number) => {
    const existing = packedItems.find(p => p.id === item.id);
    if (existing) {
      setPackedItems(packedItems.map(p => 
        p.id === item.id ? { ...p, quantity: p.quantity + quantity } : p
      ));
    } else {
      setPackedItems([...packedItems, { ...item, quantity }]);
    }
    setShowAddModal(false);
  };
  
  const removeItem = (itemId: string) => {
    setPackedItems(packedItems.filter(p => p.id !== itemId));
  };
  
  const updateQuantity = (itemId: string, delta: number) => {
    setPackedItems(packedItems.map(p => {
      if (p.id !== itemId) return p;
      const newQty = Math.max(0, p.quantity + delta);
      return { ...p, quantity: newQty };
    }).filter(p => p.quantity > 0));
  };
  
  const categories = [
    { id: 'clothes', label: '👕 Roupas' },
    { id: 'shoes', label: '👟 Calçados' },
    { id: 'hygiene', label: '🧴 Higiene' },
    { id: 'electronics', label: '💻 Eletrônicos' },
  ];
  
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      paddingBottom: '100px'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        padding: '24px 16px',
        borderBottom: '1px solid #334155'
      }}>
        <h1 style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '28px',
          fontWeight: 700,
          color: 'white',
          margin: 0
        }}>
          🧳 Smart Packing
        </h1>
        <p style={{
          color: '#94a3b8',
          marginTop: '8px',
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }}>
          Organize sua mala de forma inteligente
        </p>
      </div>
      
      <div style={{ padding: '16px' }}>
        {/* Luggage Config */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #334155'
        }}>
          <h3 style={{ color: 'white', fontSize: '14px', marginBottom: '12px' }}>
            Tipo de Bagagem
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'hand', label: '🎒 Mão', weight: 10 },
              { id: 'checked', label: '🧳 Despachada', weight: 23 },
              { id: 'both', label: '📦 Ambas', weight: 33 }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => {
                  setLuggageType(type.id as typeof luggageType);
                  setWeightLimit(type.weight);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: luggageType === type.id ? '#10b981' : '#0f172a',
                  border: luggageType === type.id ? 'none' : '1px solid #334155',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Dimensions */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #334155'
        }}>
          <h3 style={{ color: 'white', fontSize: '14px', marginBottom: '12px' }}>
            Dimensões (cm)
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            {[
              { key: 'height', label: 'Altura' },
              { key: 'width', label: 'Largura' },
              { key: 'depth', label: 'Profund.' }
            ].map(dim => (
              <div key={dim.key} style={{ flex: 1 }}>
                <label style={{ color: '#64748b', fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                  {dim.label}
                </label>
                <input
                  type="number"
                  value={dimensions[dim.key as keyof typeof dimensions]}
                  onChange={(e) => setDimensions({
                    ...dimensions,
                    [dim.key]: Number(e.target.value)
                  })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '16px',
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}
          </div>
          <p style={{
            color: '#64748b',
            fontSize: '12px',
            marginTop: '8px',
            textAlign: 'center'
          }}>
            Volume: {volume.toFixed(0)} litros
          </p>
        </div>
        
        {/* 3D Visualization Placeholder */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          height: '200px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #334155',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${dimensions.width * 2}px`,
            height: `${dimensions.height * 2}px`,
            background: 'linear-gradient(135deg, #334155, #1e293b)',
            borderRadius: '8px',
            border: '2px solid #10b981',
            display: 'flex',
            flexWrap: 'wrap',
            alignContent: 'flex-start',
            padding: '8px',
            gap: '4px',
            transform: 'perspective(500px) rotateX(10deg) rotateY(-10deg)'
          }}>
            {packedItems.slice(0, 12).map((item, i) => (
              <div
                key={i}
                style={{
                  width: '30px',
                  height: '30px',
                  background: '#10b981',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px'
                }}
              >
                {item.icon}
              </div>
            ))}
          </div>
        </div>
        
        {/* Weight Indicator */}
        <div style={{
          background: isOverweight ? 'rgba(239, 68, 68, 0.1)' : '#1e293b',
          border: isOverweight ? '1px solid #ef4444' : '1px solid #334155',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>⚖️ PESO</span>
            <span style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '18px',
              fontWeight: 700,
              color: isOverweight ? '#ef4444' : '#10b981'
            }}>
              {totalWeight.toFixed(1)} / {weightLimit} kg
            </span>
          </div>
          <div style={{
            height: '8px',
            background: '#334155',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${Math.min(weightPercentage, 100)}%`,
              height: '100%',
              background: isOverweight ? '#ef4444' : '#10b981',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          {isOverweight && (
            <p style={{
              color: '#ef4444',
              fontSize: '13px',
              marginTop: '8px'
            }}>
              🔴 Excesso: {(totalWeight - weightLimit).toFixed(1)} kg
            </p>
          )}
          {!isOverweight && (
            <p style={{
              color: '#10b981',
              fontSize: '13px',
              marginTop: '8px'
            }}>
              💚 Folga: {(weightLimit - totalWeight).toFixed(1)} kg
            </p>
          )}
        </div>
        
        {/* Items List */}
        <div style={{
          background: '#1e293b',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          border: '1px solid #334155'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{ color: 'white', fontSize: '14px', margin: 0 }}>
              📦 Itens na Mala ({packedItems.reduce((sum, i) => sum + i.quantity, 0)})
            </h3>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '8px 16px',
                background: '#10b981',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '13px'
              }}
            >
              + Adicionar
            </button>
          </div>
          
          {packedItems.length === 0 ? (
            <p style={{ color: '#64748b', textAlign: 'center', padding: '24px' }}>
              Nenhum item adicionado ainda
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {packedItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: '#0f172a',
                    borderRadius: '8px'
                  }}
                >
                  <span style={{ fontSize: '24px' }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'white', fontSize: '14px', margin: 0 }}>
                      {item.name}
                    </p>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                      {(item.weight * item.quantity).toFixed(2)} kg
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: '#334155',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      −
                    </button>
                    <span style={{ color: 'white', minWidth: '24px', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: '#10b981',
                        border: 'none',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        marginLeft: '8px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                  {item.restriction === 'HAND_ONLY' && (
                    <span style={{
                      background: 'rgba(234, 179, 8, 0.2)',
                      color: '#eab308',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px'
                    }}>
                      SÓ MÃO
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Add Item Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 100
        }}>
          <div style={{
            width: '100%',
            maxHeight: '80vh',
            background: '#1e293b',
            borderRadius: '24px 24px 0 0',
            padding: '24px',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h3 style={{ color: 'white', fontSize: '18px', margin: 0 }}>
                + Adicionar Item
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
            
            {/* Category Tabs */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
              overflowX: 'auto'
            }}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '10px 16px',
                    background: selectedCategory === cat.id ? '#10b981' : '#0f172a',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontSize: '13px'
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            {/* Items Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px'
            }}>
              {ITEM_DATABASE[selectedCategory as keyof typeof ITEM_DATABASE].map(item => (
                <button
                  key={item.id}
                  onClick={() => addItem(item, 1)}
                  style={{
                    padding: '16px',
                    background: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>
                    {item.icon}
                  </span>
                  <span style={{ color: 'white', fontSize: '13px', display: 'block' }}>
                    {item.name}
                  </span>
                  <span style={{ color: '#64748b', fontSize: '11px' }}>
                    {item.weight} kg
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartPackingPage;

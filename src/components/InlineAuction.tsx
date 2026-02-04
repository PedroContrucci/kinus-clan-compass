import { useState } from 'react';

interface Props {
  activity: {
    id: string;
    name: string;
    estimatedCost: number;
  };
  onClose: () => void;
  onAccept: (offerId: string, price: number) => void;
}

export const InlineAuction = ({ activity, onClose, onAccept }: Props) => {
  const [targetPrice, setTargetPrice] = useState(
    Math.round(activity.estimatedCost * 0.85)
  );
  const [waitDays, setWaitDays] = useState(3);
  const [showOffers, setShowOffers] = useState(false);
  
  // Simula ofertas baseadas no preço alvo
  const mockOffers = [
    { 
      id: '1',
      provider: 'GetYourGuide', 
      price: Math.round(targetPrice * 1.08), 
      rating: 4.9,
      features: ['Skip the line', 'Audioguia', 'Cancelamento grátis']
    },
    { 
      id: '2',
      provider: 'Civitatis', 
      price: Math.round(targetPrice * 1.15), 
      rating: 4.7,
      features: ['Guia em português', 'Grupos pequenos']
    },
    { 
      id: '3',
      provider: 'Viator', 
      price: Math.round(targetPrice * 1.25), 
      rating: 4.6,
      features: ['Entrada prioritária', 'Transfer incluso']
    },
  ];
  
  const savings = activity.estimatedCost - targetPrice;
  const successChance = waitDays >= 7 ? 85 : waitDays >= 3 ? 73 : 55;
  
  return (
    <div style={{
      background: '#0f172a',
      borderRadius: '12px',
      padding: '16px',
      marginTop: '12px',
      border: '1px solid #eab308'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h4 style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '16px',
          fontWeight: 700,
          color: '#eab308',
          margin: 0
        }}>
          🏷️ Leilão Reverso
        </h4>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
      
      {/* Estimativa KINU */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        padding: '12px',
        background: '#1e293b',
        borderRadius: '8px'
      }}>
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>Estimativa KINU:</span>
        <span style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '18px',
          fontWeight: 700,
          color: 'white'
        }}>
          R$ {activity.estimatedCost.toLocaleString()}
        </span>
      </div>
      
      {/* Meu Preço Alvo */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          color: '#94a3b8',
          fontSize: '13px',
          marginBottom: '8px'
        }}>
          Meu Preço Alvo:
        </label>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#1e293b',
          borderRadius: '8px',
          border: '1px solid #334155',
          padding: '4px 12px'
        }}>
          <span style={{ color: '#64748b' }}>R$</span>
          <input
            type="number"
            value={targetPrice}
            onChange={(e) => setTargetPrice(Number(e.target.value))}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '18px',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 700,
              outline: 'none'
            }}
          />
        </div>
        {savings > 0 && (
          <p style={{
            color: '#10b981',
            fontSize: '13px',
            marginTop: '8px'
          }}>
            💰 Economia potencial: R$ {savings.toLocaleString()}
          </p>
        )}
      </div>
      
      {/* Dias de Espera */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{
          display: 'block',
          color: '#94a3b8',
          fontSize: '13px',
          marginBottom: '8px'
        }}>
          Dias de Espera (Duração do Leilão):
        </label>
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          {[1, 3, 7, 14].map(days => (
            <button
              key={days}
              onClick={() => setWaitDays(days)}
              style={{
                flex: 1,
                padding: '12px',
                background: waitDays === days ? '#eab308' : '#1e293b',
                border: waitDays === days ? 'none' : '1px solid #334155',
                borderRadius: '8px',
                color: waitDays === days ? '#0f172a' : 'white',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>
      
      {/* Insight de IA */}
      <div style={{
        background: 'rgba(234, 179, 8, 0.1)',
        border: '1px solid rgba(234, 179, 8, 0.3)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <p style={{
          color: '#fef3c7',
          fontSize: '13px',
          margin: 0,
          lineHeight: 1.5
        }}>
          🤖 <strong>Insight KINU:</strong> Com {waitDays} dias de espera, histórico mostra{' '}
          <strong>{successChance}%</strong> de chance de encontrar ofertas até{' '}
          R$ {Math.round(targetPrice * 1.05).toLocaleString()}.
        </p>
      </div>
      
      {/* Buscar Ofertas */}
      {!showOffers ? (
        <button
          onClick={() => setShowOffers(true)}
          style={{
            width: '100%',
            padding: '14px',
            background: '#eab308',
            border: 'none',
            borderRadius: '8px',
            color: '#0f172a',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '16px',
            fontFamily: 'Plus Jakarta Sans, sans-serif'
          }}
        >
          🔍 Buscar Ofertas
        </button>
      ) : (
        <div>
          <h5 style={{
            color: 'white',
            fontSize: '14px',
            marginBottom: '12px',
            fontWeight: 600
          }}>
            Ofertas Encontradas:
          </h5>
          {mockOffers.map((offer, idx) => (
            <div
              key={offer.id}
              style={{
                background: idx === 0 ? 'rgba(16, 185, 129, 0.1)' : '#1e293b',
                border: idx === 0 ? '1px solid #10b981' : '1px solid #334155',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '8px'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <div>
                  <span style={{
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '14px'
                  }}>
                    {idx === 0 && '🏆 '}{offer.provider}
                  </span>
                </div>
                <span style={{
                  color: '#94a3b8',
                  fontSize: '13px'
                }}>
                  ⭐ {offer.rating}
                </span>
              </div>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                marginBottom: '10px'
              }}>
                {offer.features.map((f, i) => (
                  <span
                    key={i}
                    style={{
                      background: '#334155',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      color: '#94a3b8',
                      fontSize: '11px'
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: idx === 0 ? '#10b981' : 'white'
                }}>
                  R$ {offer.price.toLocaleString()}
                </span>
                <button
                  onClick={() => onAccept(offer.id, offer.price)}
                  style={{
                    padding: '8px 16px',
                    background: idx === 0 ? '#10b981' : 'transparent',
                    border: idx === 0 ? 'none' : '1px solid #334155',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '13px'
                  }}
                >
                  {idx === 0 ? '✅ Aceitar' : 'Selecionar'}
                </button>
              </div>
              {idx === 0 && offer.price < activity.estimatedCost && (
                <p style={{
                  color: '#10b981',
                  fontSize: '12px',
                  marginTop: '8px',
                  marginBottom: 0
                }}>
                  💚 Economia: R$ {(activity.estimatedCost - offer.price).toLocaleString()} ({Math.round((1 - offer.price / activity.estimatedCost) * 100)}%)
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InlineAuction;

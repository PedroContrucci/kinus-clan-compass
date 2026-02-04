import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTripsStore } from '../stores/tripsStore';
import { InlineAuction } from '../components/InlineAuction';

export const MyTripsPage = () => {
  const { trips, loadTrips, removeTrip, startAuction, confirmActivity } = useTripsStore();
  const [expandedAuction, setExpandedAuction] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ tripId: string; activityId: string; name: string; estimatedCost: number } | null>(null);
  const [confirmPrice, setConfirmPrice] = useState('');
  
  useEffect(() => {
    loadTrips();
    
    const handleTripSaved = () => loadTrips();
    window.addEventListener('kinu-trip-saved', handleTripSaved);
    return () => window.removeEventListener('kinu-trip-saved', handleTripSaved);
  }, [loadTrips]);
  
  if (trips.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🗺️</div>
        <h2 style={{
          fontFamily: 'Outfit, sans-serif',
          color: 'white',
          fontSize: '20px',
          marginBottom: '8px'
        }}>
          Nenhuma viagem salva
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: '24px' }}>
          Crie seu primeiro roteiro na aba Planejar!
        </p>
        <Link
          to="/planejar"
          style={{
            padding: '12px 24px',
            background: '#10b981',
            borderRadius: '8px',
            color: 'white',
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          ✈️ Criar Roteiro
        </Link>
      </div>
    );
  }
  
  const handleConfirmActivity = () => {
    if (confirmModal && confirmPrice) {
      confirmActivity(confirmModal.tripId, confirmModal.activityId, Number(confirmPrice));
      setConfirmModal(null);
      setConfirmPrice('');
    }
  };
  
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      padding: '24px 16px',
      paddingBottom: '100px'
    }}>
      <h1 style={{
        fontFamily: 'Outfit, sans-serif',
        fontSize: '28px',
        fontWeight: 700,
        color: 'white',
        marginBottom: '24px'
      }}>
        🗺️ Minhas Viagens
      </h1>
      
      {trips.map(trip => (
        <div
          key={trip.id}
          style={{
            background: '#1e293b',
            borderRadius: '16px',
            marginBottom: '24px',
            border: '1px solid #334155',
            overflow: 'hidden'
          }}
        >
          {/* Header com Countdown */}
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            padding: '16px',
            borderBottom: '1px solid #334155'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px'
            }}>
              <div>
                <h2 style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '20px',
                  fontWeight: 700,
                  color: 'white',
                  margin: 0
                }}>
                  🗼 {trip.destination}
                </h2>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '13px',
                  marginTop: '4px'
                }}>
                  {trip.dates.start} → {trip.dates.end}
                </p>
              </div>
              
              {/* BOTÃO REMOVER VIAGEM */}
              <button
                onClick={() => {
                  if (confirm('Tem certeza que deseja remover esta viagem?')) {
                    removeTrip(trip.id);
                  }
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500
                }}
              >
                🗑️ Remover
              </button>
            </div>
            
            {/* Countdown */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>⏱️ FALTAM</span>
              <div style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '24px',
                fontWeight: 700,
                color: '#10b981',
                marginTop: '4px'
              }}>
                {trip.daysUntil} dias • {trip.hoursUntil}h
              </div>
            </div>
          </div>
          
          {/* Status Financeiro */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            padding: '16px',
            borderBottom: '1px solid #334155'
          }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Planejado</span>
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '16px',
                fontWeight: 700,
                color: 'white'
              }}>
                R$ {trip.totalCost.toLocaleString()}
              </span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Confirmado</span>
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '16px',
                fontWeight: 700,
                color: '#10b981'
              }}>
                R$ {trip.confirmedCost.toLocaleString()} 🟢
              </span>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '11px', display: 'block' }}>Em Leilão</span>
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '16px',
                fontWeight: 700,
                color: '#eab308'
              }}>
                R$ {trip.inAuctionCost.toLocaleString()} 🟡
              </span>
            </div>
          </div>
          
          {/* Atividades */}
          <div style={{ padding: '16px' }}>
            <h3 style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: 600,
              marginBottom: '12px'
            }}>
              Itens do Roteiro
            </h3>
            
            {trip.activities.slice(0, 5).map(activity => (
              <div
                key={activity.id}
                style={{
                  background: '#0f172a',
                  borderRadius: '10px',
                  padding: '12px',
                  marginBottom: '10px',
                  borderLeft: `3px solid ${
                    activity.status === 'confirmed' ? '#10b981' :
                    activity.status === 'bidding' ? '#eab308' : '#64748b'
                  }`
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      margin: 0
                    }}>
                      {activity.name}
                    </h4>
                    <span style={{
                      color: '#64748b',
                      fontSize: '12px'
                    }}>
                      {activity.date} • {activity.time}
                    </span>
                  </div>
                  <span style={{
                    background: activity.status === 'confirmed' ? 'rgba(16, 185, 129, 0.2)' :
                               activity.status === 'bidding' ? 'rgba(234, 179, 8, 0.2)' :
                               'rgba(100, 116, 139, 0.2)',
                    color: activity.status === 'confirmed' ? '#10b981' :
                           activity.status === 'bidding' ? '#eab308' : '#94a3b8',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    {activity.status === 'confirmed' ? '🟢 Confirmado' : 
                     activity.status === 'bidding' ? '🟡 Em Leilão' : 
                     '⚪ Pendente'}
                  </span>
                </div>
                
                {/* Custo */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: activity.status === 'pending' ? '12px' : 0
                }}>
                  <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                    {activity.status === 'confirmed' ? 'Valor pago:' : 'Estimativa KINU:'}
                  </span>
                  <span style={{
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: activity.status === 'confirmed' ? '#10b981' : 'white'
                  }}>
                    R$ {(activity.confirmedCost || activity.estimatedCost).toLocaleString()}
                  </span>
                </div>
                
                {/* Ações para pendentes */}
                {activity.status === 'pending' && (
                  <div style={{
                    display: 'flex',
                    gap: '8px'
                  }}>
                    <button
                      onClick={() => {
                        startAuction(trip.id, activity.id);
                        setExpandedAuction(expandedAuction === activity.id ? null : activity.id);
                      }}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'transparent',
                        border: '1px solid #eab308',
                        borderRadius: '8px',
                        color: '#eab308',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '13px'
                      }}
                    >
                      🏷️ Ativar Leilão
                    </button>
                    <button
                      onClick={() => setConfirmModal({
                        tripId: trip.id,
                        activityId: activity.id,
                        name: activity.name,
                        estimatedCost: activity.estimatedCost
                      })}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#10b981',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '13px'
                      }}
                    >
                      ✅ Já Reservei
                    </button>
                  </div>
                )}
                
                {/* Ações para em leilão */}
                {activity.status === 'bidding' && (
                  <div style={{ marginTop: '12px' }}>
                    <button
                      onClick={() => setExpandedAuction(
                        expandedAuction === activity.id ? null : activity.id
                      )}
                      style={{
                        width: '100%',
                        padding: '10px',
                        background: '#eab308',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#0f172a',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '13px'
                      }}
                    >
                      🏷️ {expandedAuction === activity.id ? 'Fechar Leilão' : 'Ver Ofertas'}
                    </button>
                  </div>
                )}
                
                {/* Leilão Inline Expandido */}
                {expandedAuction === activity.id && activity.status === 'bidding' && (
                  <InlineAuction
                    activity={activity}
                    onClose={() => setExpandedAuction(null)}
                    onAccept={(_, price) => {
                      confirmActivity(trip.id, activity.id, price);
                      setExpandedAuction(null);
                    }}
                  />
                )}
              </div>
            ))}
            
            {trip.activities.length > 5 && (
              <p style={{
                color: '#64748b',
                fontSize: '13px',
                textAlign: 'center',
                marginTop: '8px'
              }}>
                + {trip.activities.length - 5} mais atividades
              </p>
            )}
          </div>
          
          {/* Link para Smart Packing */}
          <div style={{
            padding: '16px',
            borderTop: '1px solid #334155'
          }}>
            <Link
              to={`/packing/${trip.id}`}
              style={{
                display: 'block',
                padding: '12px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid #10b981',
                borderRadius: '8px',
                color: '#10b981',
                textDecoration: 'none',
                textAlign: 'center',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              🧳 Organizar Mala (Smart Packing 3D)
            </Link>
          </div>
        </div>
      ))}
      
      {/* Modal de Confirmação */}
      {confirmModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          zIndex: 100
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid #334155'
          }}>
            <h3 style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '18px',
              color: 'white',
              marginBottom: '8px'
            }}>
              ✅ Confirmar Reserva
            </h3>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              marginBottom: '16px'
            }}>
              {confirmModal.name}
            </p>
            <p style={{
              color: '#64748b',
              fontSize: '13px',
              marginBottom: '8px'
            }}>
              Estimativa: R$ {confirmModal.estimatedCost.toLocaleString()}
            </p>
            
            <label style={{
              display: 'block',
              color: '#94a3b8',
              fontSize: '13px',
              marginBottom: '8px'
            }}>
              Quanto você pagou?
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: '#0f172a',
              borderRadius: '8px',
              border: '1px solid #334155',
              padding: '4px 12px',
              marginBottom: '16px'
            }}>
              <span style={{ color: '#64748b' }}>R$</span>
              <input
                type="number"
                value={confirmPrice}
                onChange={(e) => setConfirmPrice(e.target.value)}
                placeholder={confirmModal.estimatedCost.toString()}
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
            
            {confirmPrice && Number(confirmPrice) < confirmModal.estimatedCost && (
              <p style={{
                color: '#10b981',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                💚 Economia: R$ {(confirmModal.estimatedCost - Number(confirmPrice)).toLocaleString()}
              </p>
            )}
            
            <div style={{
              display: 'flex',
              gap: '12px'
            }}>
              <button
                onClick={() => {
                  setConfirmModal(null);
                  setConfirmPrice('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'transparent',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmActivity}
                disabled={!confirmPrice}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: confirmPrice ? '#10b981' : '#334155',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: confirmPrice ? 'pointer' : 'not-allowed',
                  fontWeight: 600
                }}
              >
                ✅ Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTripsPage;

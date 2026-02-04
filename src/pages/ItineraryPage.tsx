import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItineraryStore } from '../stores/itineraryStore';

export const ItineraryPage = () => {
  const navigate = useNavigate();
  const { itinerary, saveTrip } = useItineraryStore();
  const [selectedDay, setSelectedDay] = useState(0);
  
  if (!itinerary) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p>Nenhum roteiro gerado</p>
          <button
            onClick={() => navigate('/planejar')}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              background: '#10b981',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Criar Roteiro
          </button>
        </div>
      </div>
    );
  }
  
  const handleSaveTrip = () => {
    saveTrip();
    navigate('/viagens');
  };
  
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      paddingBottom: '100px'
    }}>
      {/* ═══════════════════════════════════════════════════════════════════
          EXECUTIVE SUMMARY — OBRIGATÓRIO NO TOPO
          ═══════════════════════════════════════════════════════════════════ */}
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
          🗼 {itinerary.destination}
        </h1>
        <p style={{
          color: '#94a3b8',
          marginTop: '8px',
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }}>
          {itinerary.dates.start} → {itinerary.dates.end} • {itinerary.travelers} viajantes
        </p>
        
        {/* Budget Summary */}
        <div style={{
          background: '#0f172a',
          borderRadius: '12px',
          padding: '16px',
          marginTop: '16px',
          border: '1px solid #334155'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <div>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>Budget Total</span>
              <p style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '24px',
                fontWeight: 700,
                color: 'white',
                margin: 0
              }}>
                R$ {itinerary.budget.toLocaleString()}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>Utilizado</span>
              <p style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '24px',
                fontWeight: 700,
                color: itinerary.occupation >= 80 ? '#10b981' : '#eab308',
                margin: 0
              }}>
                R$ {itinerary.totalCost.toLocaleString()} ({itinerary.occupation}%)
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div style={{
            height: '8px',
            background: '#334155',
            borderRadius: '4px',
            overflow: 'hidden',
            marginTop: '12px'
          }}>
            <div style={{
              width: `${Math.min(itinerary.occupation, 100)}%`,
              height: '100%',
              background: itinerary.occupation >= 80 ? '#10b981' : '#eab308',
              borderRadius: '4px',
              transition: 'width 0.5s ease'
            }} />
          </div>
          
          {/* Breakdown */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            marginTop: '16px'
          }}>
            <div style={{ color: '#94a3b8', fontSize: '13px' }}>
              ✈️ Voos: <span style={{ color: 'white' }}>R$ {itinerary.breakdown.flights.toLocaleString()}</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '13px' }}>
              🏨 Hotel: <span style={{ color: 'white' }}>R$ {itinerary.breakdown.hotel.toLocaleString()}</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '13px' }}>
              🎯 Passeios: <span style={{ color: 'white' }}>R$ {itinerary.breakdown.activities.toLocaleString()}</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '13px' }}>
              🍽️ Comida: <span style={{ color: 'white' }}>R$ {itinerary.breakdown.food.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          TIMELINE HORIZONTAL — SCROLL DE DIAS
          ═══════════════════════════════════════════════════════════════════ */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}>
          {itinerary.days.map((day, index) => (
            <button
              key={index}
              onClick={() => setSelectedDay(index)}
              style={{
                background: selectedDay === index ? '#10b981' : '#1e293b',
                border: selectedDay === index ? 'none' : '1px solid #334155',
                borderRadius: '12px',
                padding: '12px 20px',
                color: 'white',
                cursor: 'pointer',
                minWidth: '100px',
                textAlign: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                {day.icon}
              </div>
              <div style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: '13px',
                fontWeight: 600
              }}>
                {day.label}
              </div>
              <div style={{
                fontSize: '11px',
                opacity: 0.8,
                marginTop: '2px'
              }}>
                {day.date}
              </div>
              <div style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '12px',
                fontWeight: 700,
                marginTop: '4px',
                color: selectedDay === index ? 'white' : '#10b981'
              }}>
                R$ {day.totalCost.toLocaleString()}
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* ═══════════════════════════════════════════════════════════════════
          ATIVIDADES DO DIA — COM FOTOS DINÂMICAS
          ═══════════════════════════════════════════════════════════════════ */}
      <div style={{ padding: '16px' }}>
        <h2 style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: '18px',
          fontWeight: 700,
          color: 'white',
          marginBottom: '16px'
        }}>
          {itinerary.days[selectedDay].label} — {itinerary.days[selectedDay].date}
        </h2>
        
        {itinerary.days[selectedDay].activities.length === 0 ? (
          <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            color: '#94a3b8'
          }}>
            <p>✈️ Dia de {selectedDay === 0 ? 'chegada' : 'partida'}</p>
            <p style={{ fontSize: '14px', marginTop: '8px' }}>Tempo livre para acomodação</p>
          </div>
        ) : (
          itinerary.days[selectedDay].activities.map((activity) => (
            <div
              key={activity.id}
              style={{
                background: '#1e293b',
                borderRadius: '16px',
                overflow: 'hidden',
                marginBottom: '16px',
                border: '1px solid #334155'
              }}
            >
              {/* FOTO DINÂMICA — OBRIGATÓRIA */}
              <div style={{ position: 'relative' }}>
                <img
                  src={activity.image}
                  alt={activity.name}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: 600
                }}>
                  {activity.time}
                </div>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: '#10b981',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '13px',
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 700
                }}>
                  R$ {activity.cost.toLocaleString()}
                </div>
              </div>
              
              {/* Info */}
              <div style={{ padding: '16px' }}>
                <h3 style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'white',
                  margin: 0
                }}>
                  {activity.name}
                </h3>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '13px',
                  marginTop: '4px'
                }}>
                  {activity.description}
                </p>
                
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  marginTop: '12px',
                  color: '#64748b',
                  fontSize: '13px'
                }}>
                  <span>📍 {activity.location}</span>
                  <span>⏱️ {activity.duration}</span>
                </div>
                
                {/* Clan Tip */}
                {activity.clanTip && (
                  <div style={{
                    background: 'rgba(234, 179, 8, 0.1)',
                    border: '1px solid rgba(234, 179, 8, 0.3)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginTop: '12px'
                  }}>
                    <p style={{
                      color: '#fef3c7',
                      fontSize: '13px',
                      margin: 0,
                      fontFamily: 'Plus Jakarta Sans, sans-serif'
                    }}>
                      💡 "{activity.clanTip.text}" — @{activity.clanTip.author} 🌿
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Save Button */}
      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '16px',
        right: '16px',
        zIndex: 40
      }}>
        <button
          onClick={handleSaveTrip}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
          }}
        >
          💾 Salvar em Minhas Viagens →
        </button>
      </div>
    </div>
  );
};

export default ItineraryPage;

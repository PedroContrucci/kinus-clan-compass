import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useItineraryStore } from '../stores/itineraryStore';

const DESTINATIONS = [
  { id: 'roma', name: 'Roma, Itália', emoji: '🗼', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400' },
  { id: 'paris', name: 'Paris, França', emoji: '🗼', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400' },
  { id: 'tokyo', name: 'Tóquio, Japão', emoji: '🗼', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400' },
  { id: 'barcelona', name: 'Barcelona, Espanha', emoji: '🏖️', image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400' },
];

export const PlannerPage = () => {
  const navigate = useNavigate();
  const { generateItinerary } = useItineraryStore();
  
  const [step, setStep] = useState(1);
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [budget, setBudget] = useState(50000);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerate = async () => {
    setIsGenerating(true);
    
    // Simula loading
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    generateItinerary({
      destination,
      dates: { start: startDate, end: endDate },
      travelers,
      budget
    });
    
    navigate('/planejar/roteiro');
  };
  
  const progress = (step / 4) * 100;
  
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
          🧭 O Nexo
        </h1>
        <p style={{
          color: '#94a3b8',
          marginTop: '8px',
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        }}>
          Me conta sobre tua próxima aventura...
        </p>
        
        {/* Progress Bar */}
        <div style={{
          marginTop: '16px',
          height: '4px',
          background: '#334155',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #10b981, #0ea5e9)',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <p style={{
          color: '#64748b',
          fontSize: '12px',
          marginTop: '8px'
        }}>
          Passo {step} de 4
        </p>
      </div>
      
      <div style={{ padding: '24px 16px' }}>
        {/* Step 1: Destination */}
        {step === 1 && (
          <div>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '20px',
              color: 'white',
              marginBottom: '20px'
            }}>
              Para onde vamos? ✈️
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              {DESTINATIONS.map(dest => (
                <button
                  key={dest.id}
                  onClick={() => {
                    setDestination(dest.name);
                    setStep(2);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '16px',
                    background: destination === dest.name ? 'rgba(16, 185, 129, 0.2)' : '#1e293b',
                    border: destination === dest.name ? '1px solid #10b981' : '1px solid #334155',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <img
                    src={dest.image}
                    alt={dest.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                  />
                  <div>
                    <p style={{
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '16px',
                      margin: 0
                    }}>
                      {dest.emoji} {dest.name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Step 2: Dates */}
        {step === 2 && (
          <div>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '20px',
              color: 'white',
              marginBottom: '20px'
            }}>
              Quando você viaja? 📅
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                Data de ida
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                color: '#94a3b8',
                fontSize: '14px',
                marginBottom: '8px'
              }}>
                Data de volta
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'transparent',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                ← Voltar
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!startDate || !endDate}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: startDate && endDate ? '#10b981' : '#334155',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: startDate && endDate ? 'pointer' : 'not-allowed',
                  fontWeight: 600
                }}
              >
                Próximo →
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Travelers */}
        {step === 3 && (
          <div>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '20px',
              color: 'white',
              marginBottom: '20px'
            }}>
              Quantos viajantes? 👥
            </h2>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              marginBottom: '32px'
            }}>
              <button
                onClick={() => setTravelers(Math.max(1, travelers - 1))}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                −
              </button>
              <span style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '48px',
                fontWeight: 700,
                color: 'white'
              }}>
                {travelers}
              </span>
              <button
                onClick={() => setTravelers(travelers + 1)}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: 'none',
                  color: 'white',
                  fontSize: '24px',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'transparent',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                ← Voltar
              </button>
              <button
                onClick={() => setStep(4)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#10b981',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Próximo →
              </button>
            </div>
          </div>
        )}
        
        {/* Step 4: Budget */}
        {step === 4 && (
          <div>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '20px',
              color: 'white',
              marginBottom: '20px'
            }}>
              Qual seu orçamento total? 💰
            </h2>
            
            <div style={{
              background: '#1e293b',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <p style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: '36px',
                fontWeight: 700,
                color: '#10b981',
                margin: 0
              }}>
                R$ {budget.toLocaleString()}
              </p>
              <p style={{
                color: '#64748b',
                fontSize: '13px',
                marginTop: '8px'
              }}>
                {travelers} viajantes • R$ {Math.round(budget / travelers).toLocaleString()}/pessoa
              </p>
            </div>
            
            <input
              type="range"
              min="10000"
              max="200000"
              step="5000"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              style={{
                width: '100%',
                marginBottom: '16px',
                accentColor: '#10b981'
              }}
            />
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '32px'
            }}>
              <span style={{ color: '#64748b', fontSize: '12px' }}>R$ 10k</span>
              <span style={{ color: '#64748b', fontSize: '12px' }}>R$ 200k</span>
            </div>
            
            {/* Quick Budget Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '24px'
            }}>
              {[30000, 50000, 80000].map(val => (
                <button
                  key={val}
                  onClick={() => setBudget(val)}
                  style={{
                    padding: '12px',
                    background: budget === val ? '#10b981' : '#1e293b',
                    border: budget === val ? 'none' : '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600
                  }}
                >
                  R$ {(val / 1000).toFixed(0)}k
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(3)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'transparent',
                  border: '1px solid #334155',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                ← Voltar
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                style={{
                  flex: 2,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #10b981, #0ea5e9)',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '16px'
                }}
              >
                {isGenerating ? '🌿 Gerando roteiro...' : '✨ Gerar Roteiro'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Loading Overlay */}
      {isGenerating && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '24px',
            animation: 'pulse 2s infinite'
          }}>
            🌿
          </div>
          <p style={{
            color: 'white',
            fontSize: '18px',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            textAlign: 'center'
          }}>
            Consultando a sabedoria do Clã...
          </p>
          <p style={{
            color: '#64748b',
            fontSize: '14px',
            marginTop: '8px'
          }}>
            Preparando seu roteiro para {destination}
          </p>
        </div>
      )}
    </div>
  );
};

export default PlannerPage;

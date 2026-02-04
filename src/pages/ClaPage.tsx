import { useState } from 'react';

const FEED_POSTS = [
  {
    id: 1,
    author: 'MariaViaja',
    avatar: '👩',
    destination: 'Roma, Itália',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600',
    tip: 'Vaticano às 8h da manhã = zero fila! Fui direto pra Sistina e voltei pros outros salões depois. Economizei 2h de espera.',
    likes: 234,
    comments: 45,
    badge: '🌿 Explorador'
  },
  {
    id: 2,
    author: 'PedroNomad',
    avatar: '👨',
    destination: 'Paris, França',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600',
    tip: 'Louvre na quarta à noite: entrada reduzida e museu vazio. Deu pra ver a Mona Lisa sem ninguém na frente!',
    likes: 189,
    comments: 32,
    badge: '🔥 Top Contributor'
  },
  {
    id: 3,
    author: 'AnaExplora',
    avatar: '👧',
    destination: 'Tóquio, Japão',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600',
    tip: 'Comprem o JR Pass ANTES de ir. Economizei quase R$ 2.000 em trens em 7 dias. Vale cada centavo!',
    likes: 567,
    comments: 89,
    badge: '🌿 Explorador'
  },
  {
    id: 4,
    author: 'GastroLuiz',
    avatar: '👨‍🍳',
    destination: 'Barcelona, Espanha',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=600',
    tip: 'La Boqueria de manhã cedo, antes das 9h. Os melhores frutos do mar acabam rápido. Paella no mercado é outra experiência!',
    likes: 312,
    comments: 67,
    badge: '🍽️ Foodie'
  },
  {
    id: 5,
    author: 'ArteClara',
    avatar: '👩‍🎨',
    destination: 'Florença, Itália',
    image: 'https://images.unsplash.com/photo-1541370976299-4d24ebbc9077?w=600',
    tip: 'Reservem a Galeria Uffizi com 2 semanas de antecedência. Fila normal: 3h. Com reserva: 0 minutos!',
    likes: 445,
    comments: 78,
    badge: '🎨 Art Lover'
  }
];

export const ClaPage = () => {
  const [posts] = useState(FEED_POSTS);
  const [likedPosts, setLikedPosts] = useState<number[]>([]);
  
  const toggleLike = (postId: number) => {
    setLikedPosts(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };
  
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
          🌿 Clã KINU
        </h1>
        <p style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          color: '#94a3b8',
          marginTop: '8px',
          fontSize: '14px'
        }}>
          Sabedoria coletiva de viajantes reais
        </p>
      </div>
      
      {/* Feed */}
      <div style={{ padding: '16px' }}>
        {posts.map(post => (
          <div
            key={post.id}
            style={{
              background: '#1e293b',
              borderRadius: '16px',
              overflow: 'hidden',
              marginBottom: '16px',
              border: '1px solid #334155'
            }}
          >
            {/* Author */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                background: '#334155',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                {post.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    color: 'white', 
                    fontWeight: 600,
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                  }}>
                    @{post.author}
                  </span>
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}>
                    {post.badge}
                  </span>
                </div>
                <div style={{
                  color: '#94a3b8',
                  fontSize: '13px',
                  marginTop: '2px'
                }}>
                  📍 {post.destination}
                </div>
              </div>
            </div>
            
            {/* Image */}
            <img
              src={post.image}
              alt={post.destination}
              style={{
                width: '100%',
                height: '200px',
                objectFit: 'cover'
              }}
            />
            
            {/* Tip */}
            <div style={{ padding: '16px' }}>
              <div style={{
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                borderRadius: '12px',
                padding: '12px'
              }}>
                <p style={{
                  color: '#fef3c7',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: '14px',
                  lineHeight: 1.6,
                  margin: 0
                }}>
                  💡 "{post.tip}"
                </p>
              </div>
              
              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '16px',
                marginTop: '16px',
                paddingTop: '12px',
                borderTop: '1px solid #334155'
              }}>
                <button
                  onClick={() => toggleLike(post.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: likedPosts.includes(post.id) ? '#ef4444' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontFamily: 'Plus Jakarta Sans, sans-serif'
                  }}
                >
                  {likedPosts.includes(post.id) ? '❤️' : '🤍'} {post.likes + (likedPosts.includes(post.id) ? 1 : 0)}
                </button>
                <button style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontFamily: 'Plus Jakarta Sans, sans-serif'
                }}>
                  💬 {post.comments}
                </button>
                <button style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  marginLeft: 'auto',
                  fontFamily: 'Plus Jakarta Sans, sans-serif'
                }}>
                  📤 Compartilhar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClaPage;

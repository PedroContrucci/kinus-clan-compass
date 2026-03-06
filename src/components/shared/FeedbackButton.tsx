import { useState } from 'react';
import { MessageSquare, Send, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export const FeedbackButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [page, setPage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { id: 'bug', label: '🐛 Bug', desc: 'Algo quebrou' },
    { id: 'confusing', label: '😕 Confuso', desc: 'Não entendi' },
    { id: 'suggestion', label: '💡 Sugestão', desc: 'Ideia de melhoria' },
    { id: 'love', label: '❤️ Adorei', desc: 'Algo que gostei' },
  ];

  const handleSubmit = () => {
    if (!category || !message.trim()) {
      toast.error('Selecione uma categoria e escreva seu feedback');
      return;
    }

    const feedback = {
      id: `fb-${Date.now()}`,
      timestamp: new Date().toISOString(),
      rating,
      category,
      message: message.trim(),
      page: page || window.location.pathname,
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
    };

    const existing = JSON.parse(localStorage.getItem('kinu_feedback') || '[]');
    existing.push(feedback);
    localStorage.setItem('kinu_feedback', JSON.stringify(existing));

    setSubmitted(true);
    toast.success('Feedback enviado! Obrigado 🙏');

    setTimeout(() => {
      setIsOpen(false);
      setSubmitted(false);
      setRating(0);
      setCategory('');
      setMessage('');
      setPage('');
    }, 1500);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-amber-500 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center hover:bg-amber-600 transition-colors lg:bottom-6 lg:right-20"
        aria-label="Enviar feedback"
      >
        <MessageSquare size={20} />
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-['Outfit']">📝 Feedback Beta</DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="py-8 text-center space-y-2">
              <div className="text-4xl">🎉</div>
              <p className="font-semibold text-foreground">Obrigado!</p>
              <p className="text-sm text-muted-foreground">Seu feedback foi salvo.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Star Rating */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Como está a experiência?</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setRating(n)} className="p-1 transition-transform hover:scale-110">
                      <Star size={24} className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Tipo de feedback:</p>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left transition-colors ${
                        category === cat.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <span className="text-sm font-medium">{cat.label}</span>
                      <p className="text-xs text-muted-foreground">{cat.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Page selector */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Sobre qual tela?</p>
                <select
                  value={page}
                  onChange={(e) => setPage(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Tela atual ({window.location.pathname})</option>
                  <option value="/planejar">Criação de viagem (Wizard)</option>
                  <option value="/viagens-painel">Painel da viagem</option>
                  <option value="/viagens-roteiro">Roteiro detalhado</option>
                  <option value="/viagens-financeiro">Aba Financeiro</option>
                  <option value="/viagens-preparacao">Aba Preparação</option>
                  <option value="/cla">Clã / Comunidade</option>
                  <option value="/dashboard">Dashboard / Home</option>
                  <option value="/pdf">PDF Export</option>
                  <option value="/kinu-ai">KINU AI Chat</option>
                  <option value="/geral">Geral / App inteiro</option>
                </select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Descreva:</p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ex: O botão de confirmar não apareceu quando cliquei..."
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground"
                />
              </div>

              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <Send size={16} />
                Enviar Feedback
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

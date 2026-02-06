// EmptyAuctionState — Shows when no auctions are active

import { motion } from 'framer-motion';
import { Target, Sparkles, ArrowRight } from 'lucide-react';

interface EmptyAuctionStateProps {
  onNavigateToItinerary?: () => void;
}

export const EmptyAuctionState = ({ onNavigateToItinerary }: EmptyAuctionStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12 px-6"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center"
      >
        <Target size={40} className="text-primary" />
      </motion.div>
      
      {/* Title */}
      <h3 className="text-xl font-bold text-foreground font-['Outfit'] mb-2">
        Nenhum leilão ativo
      </h3>
      
      {/* Description */}
      <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
        Ative o monitoramento de preços para voos ou hotéis diretamente no seu roteiro.
      </p>
      
      {/* Instructions */}
      <div className="bg-muted/50 rounded-xl p-4 mb-6 text-left max-w-sm mx-auto">
        <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          Como funciona:
        </h4>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">1</span>
            <span>Vá para a aba <strong className="text-foreground">Roteiro</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">2</span>
            <span>No card do <strong className="text-foreground">Voo</strong> ou <strong className="text-foreground">Hotel</strong>, clique em <strong className="text-foreground">🎯 Ativar Leilão</strong></span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">3</span>
            <span>Defina seu preço alvo e quantos dias monitorar</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">4</span>
            <span>O KINU monitora 24/7 e avisa quando encontrar!</span>
          </li>
        </ol>
      </div>
      
      {/* CTA Button */}
      {onNavigateToItinerary && (
        <button
          onClick={onNavigateToItinerary}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
        >
          Ir para Roteiro
          <ArrowRight size={16} />
        </button>
      )}
      
      {/* Info Card */}
      <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl max-w-sm mx-auto">
        <p className="text-sm text-primary">
          💡 <strong>Dica:</strong> O Leilão Reverso funciona apenas para voos e hotéis, 
          onde os maiores descontos são encontrados.
        </p>
      </div>
    </motion.div>
  );
};

export default EmptyAuctionState;

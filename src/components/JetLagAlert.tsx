import { Brain } from 'lucide-react';
import { contextualTips } from '@/types/trip';

interface JetLagAlertProps {
  destination: string;
  timezoneDiff: number;
  severity?: 'BAIXO' | 'MODERADO' | 'ALTO' | 'SEVERO';
  isRecoveryDay?: boolean; // For days 2-3 on SEVERO
}

const JetLagAlert = ({ destination, timezoneDiff, severity, isRecoveryDay = false }: JetLagAlertProps) => {
  const direction = timezoneDiff > 0 ? '+' : '';
  const absDiff = Math.abs(timezoneDiff);
  
  // Determine effective severity
  const effectiveSeverity = severity || (absDiff <= 2 ? 'BAIXO' : absDiff <= 5 ? 'MODERADO' : absDiff <= 8 ? 'ALTO' : 'SEVERO');

  // Recovery day banner (lighter version for days 2-3 on SEVERO)
  if (isRecoveryDay) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 mb-4">
        <div className="flex items-center gap-2">
          <Brain size={16} className="text-amber-500" />
          <p className="text-sm text-foreground font-medium font-['Outfit']">
            🧠 Dia de recuperação — roteiro com 70% da intensidade
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-6">
          Seu corpo ainda está se adaptando ao fuso de {direction}{timezoneDiff}h. Hoje terá pausas extras.
        </p>
      </div>
    );
  }

  if (effectiveSeverity === 'SEVERO') {
    return (
      <div className="bg-red-500/10 border border-red-500 rounded-2xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Brain size={20} className="text-red-500" />
          </div>
          <div>
            <h4 className="font-bold text-foreground font-['Outfit'] mb-1">
              🧠 KINU AI — Alerta de Fuso Horário Severo
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              {destination} está <span className="text-red-500 font-medium">{direction}{timezoneDiff}h</span> do Brasil
            </p>
            <p className="text-sm text-foreground/90 font-['Plus_Jakarta_Sans']">
              Diferença de {absDiff}h — seu corpo vai precisar de 2-3 dias para se adaptar completamente.
            </p>
          </div>
        </div>
        
        {/* Recommendations */}
        <div className="mt-4 pt-3 border-t border-red-500/30">
          <p className="text-xs text-muted-foreground mb-2">Recomendações críticas:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-emerald-500">✅</span>
              <span>Dia 1: Apenas check-in e descanso</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-emerald-500">✅</span>
              <span>Dia 2: Atividades leves, máximo 2</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-emerald-500">✅</span>
              <span>Hidratação constante (2L+ de água)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-emerald-500">✅</span>
              <span>Melatonina às 22h local (consulte médico)</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-red-500">❌</span>
              <span>Dirigir nas primeiras 48h</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-red-500">❌</span>
              <span>Decisões importantes no Dia 1</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-red-500">❌</span>
              <span>Álcool ou cafeína após 14h</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-red-500">❌</span>
              <span>Cochilos longos (máx 20min)</span>
            </div>
          </div>
        </div>

        {/* Adaptation Protocol */}
        <div className="mt-4 pt-3 border-t border-red-500/30">
          <p className="text-xs text-muted-foreground mb-2 font-medium">🧬 Protocolo de Adaptação:</p>
          <div className="space-y-1.5">
            <p className="text-xs text-foreground">📍 <strong>Dia 1:</strong> Chegada → hotel → descanso</p>
            <p className="text-xs text-foreground">📍 <strong>Dia 2:</strong> Acordar cedo, luz solar, passeio leve</p>
            <p className="text-xs text-foreground">📍 <strong>Dia 3:</strong> Roteiro com 70% da intensidade normal</p>
            <p className="text-xs text-foreground">📍 <strong>Dia 4+:</strong> Roteiro completo</p>
          </div>
        </div>
      </div>
    );
  }

  if (effectiveSeverity === 'ALTO') {
    return (
      <div className="bg-orange-500/10 border border-orange-500 rounded-2xl p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Brain size={20} className="text-orange-500" />
          </div>
          <div>
            <h4 className="font-bold text-foreground font-['Outfit'] mb-1">
              🧠 KINU AI — Modo Adaptação Ativo
            </h4>
            <p className="text-xs text-muted-foreground mb-2">
              {destination} está <span className="text-orange-500 font-medium">{direction}{timezoneDiff}h</span> do Brasil
            </p>
            <p className="text-sm text-foreground/90 font-['Plus_Jakarta_Sans']">
              Fuso de {absDiff}h é significativo. Seu corpo precisa de 1 dia completo para ajustar.
            </p>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-orange-500/30">
          <p className="text-xs text-muted-foreground mb-2">Recomendações para hoje:</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-emerald-500">✅</span>
              <span>Descanso no hotel até 16h</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-emerald-500">✅</span>
              <span>Caminhada leve de 30min ao pôr do sol</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-red-500">❌</span>
              <span>Qualquer atividade antes das 15h</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-red-500">❌</span>
              <span>Refeições pesadas</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-foreground">
              <span className="text-red-500">❌</span>
              <span>Álcool nas primeiras 24h</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MODERADO (default for jetLagMode)
  const randomTip = "Exponha-se à luz solar — ajuda a resetar o relógio biológico.";

  return (
    <div className="bg-amber-500/10 border border-amber-500 rounded-2xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Brain size={20} className="text-amber-500" />
        </div>
        <div>
          <h4 className="font-bold text-foreground font-['Outfit'] mb-1">
            🧠 KINU AI — Modo Adaptação Ativo
          </h4>
          <p className="text-xs text-muted-foreground mb-2">
            {destination} está <span className="text-amber-500 font-medium">{direction}{timezoneDiff}h</span> do Brasil
          </p>
          <p className="text-sm text-foreground/90 font-['Plus_Jakarta_Sans']">
            "{randomTip}"
          </p>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-amber-500/30">
        <p className="text-xs text-muted-foreground mb-2">Recomendações para hoje:</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-xs text-foreground">
            <span className="text-emerald-500">✅</span>
            <span>Passeios leves pela região do hotel</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground">
            <span className="text-emerald-500">✅</span>
            <span>Jantar cedo (antes das 20h)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground">
            <span className="text-red-500">❌</span>
            <span>Museus de dia inteiro</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground">
            <span className="text-red-500">❌</span>
            <span>Tours com hora marcada</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JetLagAlert;

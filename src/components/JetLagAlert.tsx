import { Brain } from 'lucide-react';
import { contextualTips } from '@/types/trip';

interface JetLagAlertProps {
  destination: string;
  timezoneDiff: number;
}

const JetLagAlert = ({ destination, timezoneDiff }: JetLagAlertProps) => {
  const randomTip = contextualTips.jetLag[Math.floor(Math.random() * contextualTips.jetLag.length)];
  const direction = timezoneDiff > 0 ? '+' : '';

  return (
    <div className="bg-[#eab308]/10 border border-[#eab308] rounded-2xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-[#eab308]/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <Brain size={20} className="text-[#eab308]" />
        </div>
        <div>
          <h4 className="font-bold text-[#f8fafc] font-['Outfit'] mb-1">
            🧠 KINU AI — Modo Adaptação Ativo
          </h4>
          <p className="text-xs text-[#94a3b8] mb-2">
            {destination} está <span className="text-[#eab308] font-medium">{direction}{timezoneDiff}h</span> do Brasil
          </p>
          <p className="text-sm text-[#f8fafc]/90 font-['Plus_Jakarta_Sans']">
            "{randomTip}"
          </p>
        </div>
      </div>
      
      {/* Recommendations */}
      <div className="mt-4 pt-3 border-t border-[#eab308]/30">
        <p className="text-xs text-[#94a3b8] mb-2">Recomendações para hoje:</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 text-xs text-[#f8fafc]">
            <span className="text-[#10b981]">✅</span>
            <span>Passeios leves</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#f8fafc]">
            <span className="text-[#10b981]">✅</span>
            <span>Descanso 16h-18h</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#f8fafc]">
            <span className="text-red-500">❌</span>
            <span>Museus longos</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#f8fafc]">
            <span className="text-red-500">❌</span>
            <span>Tours de dia inteiro</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JetLagAlert;

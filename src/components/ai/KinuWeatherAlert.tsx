import { Cloud, Umbrella, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RainAlert } from "@/hooks/useWeather";

interface KinuWeatherAlertProps {
  alert: RainAlert;
  onAccept: () => void;
  onDismiss: () => void;
}

export function KinuWeatherAlert({ alert, onAccept, onDismiss }: KinuWeatherAlertProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 rounded-xl p-4 mb-4"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
            <Umbrella className="w-5 h-5 text-amber-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 font-semibold text-sm">⚠️ Alerta de Clima</span>
              <button
                onClick={onDismiss}
                className="ml-auto p-1 hover:bg-muted/50 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            
            <p className="text-sm text-foreground mb-3">
              {alert.message}
            </p>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Cloud className="w-3 h-3" />
              <span>Probabilidade: {alert.rainProbability}%</span>
            </div>
            
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={onAccept}
                className="bg-amber-500 hover:bg-amber-600 text-black"
              >
                Sim, sugira alternativas
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
              >
                Manter assim
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

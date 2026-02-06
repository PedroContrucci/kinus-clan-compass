// RouteInfo — Mostra informações da rota entre origem e destino

import { Plane, Clock, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRouteInfo } from '@/hooks/useSupabaseData';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface RouteInfoProps {
  origin: string;
  destination: string;
}

export const RouteInfo = ({ origin, destination }: RouteInfoProps) => {
  const { data: routeInfo, isLoading } = useRouteInfo(origin, destination);

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-48" />
      </div>
    );
  }

  if (!routeInfo) {
    return null;
  }

  if (!routeInfo.hasRoute) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-yellow-500/30 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-yellow-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-foreground">Rota não mapeada</h4>
            <p className="text-sm text-muted-foreground mt-1">
              {routeInfo.message || 'Voos com conexão podem ser necessários'}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-card border rounded-xl p-4 ${
        routeInfo.hasDirect ? 'border-primary/30' : 'border-yellow-500/30'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {routeInfo.hasDirect ? (
          <CheckCircle2 size={18} className="text-primary" />
        ) : (
          <AlertCircle size={18} className="text-yellow-500" />
        )}
        <span className="font-medium text-foreground">
          {routeInfo.hasDirect ? 'Voo Direto Disponível' : 'Conexão Necessária'}
        </span>
      </div>

      {/* Route Details */}
      <div className="grid grid-cols-3 gap-4 mb-3">
        {routeInfo.estimatedDuration && (
          <div className="flex items-center gap-2 text-sm">
            <Clock size={14} className="text-muted-foreground" />
            <span className="text-foreground">
              {Math.floor(routeInfo.estimatedDuration / 60)}h{routeInfo.estimatedDuration % 60}m
            </span>
          </div>
        )}

        {routeInfo.averagePrice && (
          <div className="flex items-center gap-2 text-sm">
            <DollarSign size={14} className="text-muted-foreground" />
            <span className="text-foreground">
              R$ {routeInfo.averagePrice.toLocaleString('pt-BR')}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 text-sm">
          <Plane size={14} className="text-muted-foreground" />
          <span className="text-foreground">
            {routeInfo.originAirport?.iata_code} → {routeInfo.destinationAirport?.iata_code}
          </span>
        </div>
      </div>

      {/* Connections */}
      {routeInfo.needsConnection && routeInfo.connections && routeInfo.connections.length > 0 && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Conexões sugeridas:</p>
          <div className="flex flex-wrap gap-2">
            {routeInfo.connections.map((connection: string) => (
              <span
                key={connection}
                className="px-2 py-1 bg-muted rounded-full text-xs text-foreground"
              >
                {connection}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Airlines */}
      {routeInfo.airlines && routeInfo.airlines.length > 0 && (
        <div className="pt-3 border-t border-border mt-3">
          <p className="text-xs text-muted-foreground mb-2">Companhias aéreas:</p>
          <div className="flex flex-wrap gap-2">
            {routeInfo.airlines.slice(0, 4).map((airline: string) => (
              <span
                key={airline}
                className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
              >
                {airline}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RouteInfo;

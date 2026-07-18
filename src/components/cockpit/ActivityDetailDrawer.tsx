import { useEffect, useMemo, useState } from 'react';
import { Star, Clock, MapPin, X, RefreshCw, Timer, Trash2, Pencil } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from '@/components/ui/drawer';
import { usePlaceDetails, PlaceDetails } from '@/hooks/usePlaceDetails';
import { destinationActivities, type SuggestedActivity } from '@/data/destinationActivities';
import type { TripActivity } from '@/types/trip';

interface ActivityDetailDrawerProps {
  activity: TripActivity | null;
  destination: string;
  travelers?: number;
  open: boolean;
  onClose: () => void;
  onFocusOnMap?: (activityName: string) => void;
  onReplaceActivity?: (activityId: string, suggested: SuggestedActivity) => void;
  onAdjustTime?: (activityId: string, newTime: string) => void;
  onRemoveActivity?: (activityId: string) => void;
  usedActivityIds?: string[];
  usedActivityNames?: string[];
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function findCuratedMatch(destination: string, activityName: string) {
  const data = destinationActivities[destination];
  if (!data || !activityName) return null;
  const target = normalize(
    activityName
      .replace(/^[^\p{L}\p{N}]+/u, '')
      .replace(/^(almoço|almoco|jantar|café|cafe|café da manhã|cafe da manha)\s*:\s*/i, '')
      .replace(/\s*\(.*?\)/g, '')
      .trim()
  );
  if (!target) return null;
  return (
    data.activities.find((a) => normalize(a.name) === target) ||
    data.activities.find((a) => {
      const n = normalize(a.name);
      return n.includes(target) || target.includes(n);
    }) ||
    null
  );
}

function inferCuratedCategory(activity: TripActivity, curated: SuggestedActivity | null): SuggestedActivity['category'] | null {
  if (curated) return curated.category;
  const name = (activity.name || '').toLowerCase();
  if (name.includes('café da manhã') || name.startsWith('café') || name.startsWith('cafe')) return 'breakfast';
  if (name.startsWith('almoço') || name.startsWith('almoco')) return 'lunch';
  if (name.startsWith('jantar')) return 'dinner';
  const c = (activity.category as string || '').toLowerCase();
  if (c === 'comida') return 'lunch';
  const hourStr = (activity.time || '').split(':')[0];
  const h = parseInt(hourStr, 10);
  if (!Number.isNaN(h)) {
    if (h < 12) return 'morning';
    if (h < 18) return 'afternoon';
    return 'night';
  }
  return null;
}

export const ActivityDetailDrawer = ({
  activity,
  destination,
  travelers = 1,
  open,
  onClose,
  onFocusOnMap,
  onReplaceActivity,
  onAdjustTime,
  onRemoveActivity,
  usedActivityIds = [],
  usedActivityNames = [],
}: ActivityDetailDrawerProps) => {
  const { searchPlace } = usePlaceDetails();
  const [place, setPlace] = useState<PlaceDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [newTime, setNewTime] = useState('');

  const cleanName = (activity?.name || '')
    .replace(/^(Jantar|Almoço|Café|Café da manhã):\s*/i, '')
    .replace(/\s*\(.*?\)/g, '')
    .trim();

  const skip = !cleanName ||
    cleanName.toLowerCase().includes('check-in') ||
    cleanName.toLowerCase().includes('check-out') ||
    cleanName.toLowerCase().includes('transfer') ||
    cleanName.toLowerCase().includes('voo') ||
    cleanName.toLowerCase().includes('aeroporto') ||
    cleanName.toLowerCase().includes('room service') ||
    cleanName.toLowerCase().includes('café da manhã') ||
    cleanName.toLowerCase().includes('descanso');

  useEffect(() => {
    if (!open) { setPickerOpen(false); setTimeOpen(false); }
    if (open && activity) setNewTime(activity.time || '');
  }, [open, activity]);

  useEffect(() => {
    if (!open || skip) { setPlace(null); return; }
    setLoading(true);
    searchPlace(cleanName, destination).then(result => {
      if (result?.found) setPlace(result);
      else setPlace(null);
      setLoading(false);
    });
  }, [open, cleanName, destination, skip, searchPlace]);

  const curated = useMemo(
    () => (activity ? findCuratedMatch(destination, activity.name) : null),
    [activity, destination]
  );

  const alternatives = useMemo<SuggestedActivity[]>(() => {
    if (!activity) return [];
    const data = destinationActivities[destination];
    if (!data) return [];
    const cat = inferCuratedCategory(activity, curated);
    if (!cat) return [];
    const usedIds = new Set(usedActivityIds);
    const usedNames = new Set(usedActivityNames.map(normalize));
    return data.activities
      .filter(a => a.category === cat && !usedIds.has(a.id) && !usedNames.has(normalize(a.name)))
      .slice(0, 6);
  }, [activity, destination, curated, usedActivityIds, usedActivityNames]);

  if (!activity) return null;

  const neighborhood = curated?.neighborhood;
  const tips = curated?.tips || [];
  const perPerson = Math.max(0, Math.round(activity.cost || 0));
  const total = perPerson * Math.max(1, travelers);
  const isConfirmed = activity.status === 'confirmed';
  const canEdit = !skip && !!(onReplaceActivity || onAdjustTime || onRemoveActivity);

  return (
    <Drawer open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DrawerContent className="max-h-[85vh] bg-card border-border">
        <DrawerHeader className="flex items-start justify-between pb-2 gap-3">
          <div className="flex-1 min-w-0">
            <DrawerTitle className="font-['Outfit'] text-lg text-foreground text-left">
              {activity.name}
            </DrawerTitle>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
              {activity.time && (
                <span className="flex items-center gap-1">
                  <Clock size={12} /> {activity.time}
                </span>
              )}
              {activity.duration && <span>⏱ {activity.duration}</span>}
              {neighborhood && (
                <span className="flex items-center gap-1">
                  <MapPin size={12} /> {neighborhood}
                </span>
              )}
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  isConfirmed
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {isConfirmed ? '✅ Confirmada' : '💡 Sugestão'}
              </span>
              {activity.edited && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 flex items-center gap-1">
                  <Pencil size={10} /> ajustado
                </span>
              )}
            </div>
          </div>
          <DrawerClose asChild>
            <button className="p-1 rounded-lg hover:bg-muted transition-colors shrink-0">
              <X size={18} className="text-muted-foreground" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4 overflow-y-auto">
          {place?.photoUrl && (
            <img
              src={place.photoUrl}
              alt={place.name || activity.name}
              className="w-full h-48 rounded-xl object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}

          {activity.description && (
            <p className="text-sm text-muted-foreground">{activity.description}</p>
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Carregando informações...
            </div>
          )}

          {place?.found && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                {place.rating && (
                  <span className="flex items-center gap-1 text-sm text-amber-400 font-medium">
                    <Star size={14} className="fill-amber-400" /> {place.rating}
                    {place.totalRatings && (
                      <span className="text-muted-foreground text-xs">
                        ({place.totalRatings.toLocaleString()} avaliações)
                      </span>
                    )}
                  </span>
                )}
                {place.openNow !== undefined && (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      place.openNow
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    <Clock size={10} className="inline mr-1" />
                    {place.openNow ? 'Aberto agora' : 'Fechado'}
                  </span>
                )}
              </div>

              {place.hours && place.hours.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-foreground">Horários:</p>
                  {place.hours.map((h, i) => (
                    <p key={i} className="text-xs text-muted-foreground">{h}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {tips.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-foreground font-['Outfit']">💡 Dicas do KINU</p>
              <ul className="space-y-1.5">
                {tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-xs text-muted-foreground leading-relaxed pl-3 border-l-2 border-emerald-500/40"
                  >
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 border-t border-border">
            <p className="text-xs font-semibold text-foreground font-['Outfit'] mb-1">Custo</p>
            {perPerson > 0 ? (
              <p className="text-sm text-foreground">
                R$ {perPerson.toLocaleString('pt-BR')} por pessoa
                <span className="text-muted-foreground"> · </span>
                <span className="text-emerald-400 font-medium">
                  R$ {total.toLocaleString('pt-BR')} total
                </span>
                <span className="text-muted-foreground text-xs"> ({Math.max(1, travelers)} viajantes)</span>
              </p>
            ) : (
              <p className="text-sm text-emerald-400 font-medium">Grátis</p>
            )}
          </div>

          {onFocusOnMap && !skip && (
            <button
              onClick={() => {
                onFocusOnMap(activity.name);
                onClose();
              }}
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-medium hover:bg-emerald-500/25 transition-colors font-['Outfit']"
            >
              <MapPin size={16} /> 📍 Ver no mapa
            </button>
          )}

          {/* Edit actions — suggestion-type only */}
          {canEdit && (
            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Ajustar este slot</p>
              <div className="grid grid-cols-3 gap-2">
                {onReplaceActivity && (
                  <button
                    onClick={() => { setPickerOpen(v => !v); setTimeOpen(false); }}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg border border-border bg-background hover:bg-muted/60 transition-colors text-xs text-foreground"
                  >
                    <RefreshCw size={14} className="text-emerald-400" />
                    <span>🔄 Trocar sugestão</span>
                  </button>
                )}
                {onAdjustTime && (
                  <button
                    onClick={() => { setTimeOpen(v => !v); setPickerOpen(false); }}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg border border-border bg-background hover:bg-muted/60 transition-colors text-xs text-foreground"
                  >
                    <Timer size={14} className="text-sky-400" />
                    <span>🕐 Ajustar horário</span>
                  </button>
                )}
                {onRemoveActivity && (
                  <button
                    onClick={() => {
                      if (window.confirm('Remover esta atividade?')) {
                        onRemoveActivity(activity.id);
                      }
                    }}
                    className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors text-xs text-red-400"
                  >
                    <Trash2 size={14} />
                    <span>🗑️ Remover</span>
                  </button>
                )}
              </div>

              {pickerOpen && onReplaceActivity && (
                <div className="mt-2 p-3 rounded-xl border border-border bg-background/60 space-y-2">
                  <p className="text-xs font-semibold text-foreground font-['Outfit']">Alternativas curadas</p>
                  {alternatives.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Sem alternativas curadas para esta categoria em {destination}.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {alternatives.map(alt => (
                        <button
                          key={alt.id}
                          onClick={() => { onReplaceActivity(activity.id, alt); setPickerOpen(false); }}
                          className="w-full text-left p-2.5 rounded-lg border border-border bg-card hover:bg-muted/60 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground font-['Outfit'] truncate">{alt.name}</p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {alt.neighborhood} · ⭐ {alt.rating} · {alt.durationHours}h
                              </p>
                            </div>
                            <span className="text-xs font-medium text-emerald-400 whitespace-nowrap">
                              R$ {alt.estimatedCostBRL.toLocaleString('pt-BR')}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {timeOpen && onAdjustTime && (
                <div className="mt-2 p-3 rounded-xl border border-border bg-background/60 space-y-2">
                  <p className="text-xs font-semibold text-foreground font-['Outfit']">Novo horário</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground"
                    />
                    <button
                      onClick={() => {
                        if (newTime) { onAdjustTime(activity.id, newTime); setTimeOpen(false); }
                      }}
                      className="px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/25 transition-colors"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

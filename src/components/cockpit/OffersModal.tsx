import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { buildOfferLinks, OfferLink } from '@/lib/offersLinks';
import { ExternalLink } from 'lucide-react';

interface OffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  activityName: string;
  city: string;
}

export const OffersModal = ({ isOpen, onClose, activityName, city }: OffersModalProps) => {
  const links = useMemo<OfferLink[]>(
    () => buildOfferLinks({ category: 'activity', city, activityName }),
    [city, activityName]
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            {activityName}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Reserve esta atividade com nossos parceiros
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhuma oferta disponível para esta atividade.
            </p>
          ) : (
            links.map((link, index) => (
              <a
                key={`${link.partner}-${index}`}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/50 hover:bg-muted transition-colors group"
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm">
                      {link.partner}
                    </span>
                    {link.isAffiliate && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary">
                        Parceiro KINU
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {link.description}
                  </span>
                </div>
                <ExternalLink
                  size={18}
                  className="text-muted-foreground group-hover:text-primary flex-shrink-0 transition-colors"
                />
              </a>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OffersModal;

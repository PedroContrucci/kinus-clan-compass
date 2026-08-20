/**
 * TripAdoptionDialog — o diálogo do Arco 4e. UI FINA, de propósito.
 *
 * Ele não decide nada: lê o pedido de consentimento do `tripAdoption.ts` e chama
 * `acceptAdoption()` / `declineAdoption()`. Toda a regra — quando perguntar, o que enfileirar,
 * o que gravar em `kinu_trips_owner` — vive no módulo, onde é testável sem React.
 *
 * POR QUE MORA NO App.tsx e não no Dashboard: a sessão resolve em qualquer rota. O retorno do
 * OAuth cai em `/dashboard`, mas um refresh de token ou um login feito em outra aba resolve
 * onde o usuário estiver — `/viagens`, `/planejar`, `/conta`. Pendurar o diálogo numa tela só
 * perderia esses casos.
 *
 * O TEXTO DO RODAPÉ E O BOTÃO SECUNDÁRIO SÃO UM PAR (decisão do arquiteto, 4e §6): "Deixar só
 * neste navegador" é verdade sobre o passado, não sobre o futuro — recusar não desliga o
 * espelho, então editar uma dessas viagens depois de entrar a faz subir. Se o rodapé cair na
 * revisão de texto, o rótulo do botão muda junto (reserva: "Agora não"). Um botão que promete
 * o que o app não cumpre é pior que nenhum botão.
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Import, Laptop } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  acceptAdoption,
  declineAdoption,
  getAdoptionPrompt,
  subscribeAdoption,
  type AdoptionPrompt,
} from '@/lib/tripAdoption';

export function TripAdoptionDialog() {
  const location = useLocation();

  // Estado inicial SÍNCRONO: o pedido pode ter sido emitido antes desta montagem — é o caso
  // normal, já que a sessão resolve na rota `/`, onde este componente devolve null.
  // `subscribeAdoption` não replica o estado atual na assinatura (contrato do 4b/Arco 1).
  const [prompt, setPrompt] = useState<AdoptionPrompt | null>(getAdoptionPrompt);

  useEffect(() => subscribeAdoption(setPrompt), []);

  // Mesma regra do KinuAIWrapper e do BetaFeedbackWrapper: a tela de login não recebe modal
  // por cima. O pedido NÃO se perde — ele vive no módulo, e o Login manda todo autenticado
  // para /dashboard com `replace`, onde o diálogo aparece.
  if (location.pathname === '/') return null;
  if (!prompt) return null;

  const count = prompt.tripIds.length;
  const quantas = count === 1 ? '1 viagem salva' : `${count} viagens salvas`;

  const handleAccept = () => {
    acceptAdoption();
    toast.success('Viagens trazidas para a sua conta ✨', {
      description: 'Elas vão aparecer nos seus outros dispositivos.',
    });
  };

  const handleDecline = () => {
    declineAdoption();
    toast('Tudo bem — elas ficam neste navegador.');
  };

  return (
    <Dialog
      open
      // Duas opções, as duas gravam uma decisão. Fechar sem responder faria o app perguntar
      // de novo no próximo boot, o que é pior do que perguntar uma vez: `onOpenChange` ignora
      // o `false`, e o `[&>button]:hidden` tira o X do DialogContent (idioma do sidebar.tsx).
      onOpenChange={() => undefined}
    >
      <DialogContent className="bg-[#1e293b] border-[#334155] text-[#f8fafc] max-w-sm mx-auto [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="font-['Outfit'] flex items-center gap-2">
            <Import size={20} className="text-[#22c55e]" />
            Trazer suas viagens para a conta?
          </DialogTitle>
          <DialogDescription className="text-[#94a3b8]">
            Encontramos <span className="font-semibold text-[#f8fafc]">{quantas}</span> neste
            navegador. Quer trazer para a sua conta? Assim você as encontra em qualquer
            dispositivo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="flex items-start gap-2 p-3 bg-[#eab308]/10 border border-[#eab308]/30 rounded-xl">
            <Laptop size={16} className="text-[#eab308] mt-0.5 shrink-0" />
            <p className="text-sm text-[#eab308]">
              Se você editar uma delas depois de entrar, ela vai para a sua conta mesmo assim.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleAccept}
              className="w-full py-3 bg-[#22c55e] rounded-xl text-white font-semibold"
            >
              Trazer para minha conta
            </button>
            <button
              onClick={handleDecline}
              className="w-full py-3 bg-[#0f172a] border border-[#334155] rounded-xl text-[#f8fafc] font-medium"
            >
              Deixar só neste navegador
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TripAdoptionDialog;

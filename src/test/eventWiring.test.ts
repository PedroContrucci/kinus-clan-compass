// A fiação dos eventos, lida do FONTE. Sim, é feio.
//
// POR QUE EXISTE: `tripEvents.test.ts` prova o que cada fato emite; nada prova que a chamada
// continua no handler certo. Montar `Viagens.tsx` (2.9k linhas, sem harness) num teste de
// renderização custa mais que o arco inteiro, e sem isto um refactor apaga a emissão com a
// suíte toda verde.
//
// O que este arquivo NÃO é: teste de comportamento. Ele não sabe se a chamada roda, só que
// ela está escrita. É o degrau entre "nada" e "harness de página" — e some no dia em que o
// harness existir.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const src = (relative: string) =>
  readFileSync(resolve(process.cwd(), 'src', relative), 'utf8');

describe('os pontos de emissão continuam onde foram postos', () => {
  it('as duas criações de viagem chamam `trackTripCreated` com a origem certa', () => {
    expect(src('components/wizard/NewPlanningWizard.tsx')).toContain("trackTripCreated(stored, 'wizard')");
    expect(src('contexts/KinuAIContext.tsx')).toContain("trackTripCreated(stored, 'kinu_ai')");
  });

  it('`Viagens.tsx` emite a ativação nos dois caminhos — o botão e a promoção implícita', () => {
    const viagens = src('pages/Viagens.tsx');
    expect(viagens.match(/trackTripActivated\(/g) ?? []).toHaveLength(2);
    expect(viagens).toContain("statusAntes === 'draft'");
  });

  it('`Viagens.tsx` emite item confirmado na atividade e no voo/hotel', () => {
    expect(src('pages/Viagens.tsx').match(/trackTripItemConfirmed\(/g) ?? []).toHaveLength(2);
  });

  it('o feedback emite `cla.feedback_sent`', () => {
    expect(src('components/shared/FeedbackButton.tsx')).toContain("trackEvent('cla.feedback_sent', { page: pagePath })");
  });

  it('o boot liga a varredura de viagem concluída', () => {
    expect(src('App.tsx')).toContain('startTripCompletion();');
  });

  it('o boot liga o motor de conquistas e pendura a celebração', () => {
    const app = src('App.tsx');
    expect(app).toContain('startAchievements();');
    // Fora do Perfil de propósito: a conquista destrava em `/viagens`, não em `/conta`.
    expect(app).toContain('<AchievementCelebration />');
  });

  it('o Perfil mostra a grade de conquistas', () => {
    expect(src('pages/Conta.tsx')).toContain('<AchievementsPanel />');
  });
});

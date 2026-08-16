// Hook de autenticação do Kinu — Supabase Auth do projeto kinu-beta.
//
// A INTERFACE É O CONTRATO (RELATORIO-RECON-AUTH.md §6a):
//   { user, isLoading, isAuthenticated, login, logout, requireAuth }
// continua idêntica ao mock que este arquivo substituiu. Dashboard.tsx e
// Cla.tsx não mudam uma linha. O que mudou foi só o que há por baixo.
//
// Novidades aditivas (para a 3b): signIn, signUp, signInWithGoogle.
//
// MUDANÇA DE ASSINATURA DECLARADA — `login`:
//   antes:  login(name: string, email?: string): User          [síncrono]
//   agora:  login(email: string, password: string): Promise<User | null>
// É alias de signIn. Custo de quebra: zero — o recon §1.4 provou que `login`
// não tinha nenhum chamador em todo o src/ (quem gravava a sessão era o
// Login.tsx na mão).
//
// Esta fase NÃO escreve nem lê `kinu_user`. A ponte com o legado (corte seco +
// verniz) é a 3b.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { kinuBeta } from '@/integrations/kinu-beta/client';

export interface User {
  id: string;      // uuid real de auth.users do kinu-beta
  name: string;    // GARANTIDO string — ver toAppUser()
  email?: string;
}

/**
 * Adaptador: User do Supabase -> User do app (recon §5.2).
 *
 * `name` é obrigatório aqui porque o app o trata como obrigatório:
 * Dashboard.tsx:122 faz `user.name.split(' ')[0]` e Conta.tsx:81 faz
 * `user.name.charAt(0)` — um name nulo é tela branca, não é campo vazio.
 *
 * O Supabase não tem `name`: tem `user_metadata`, que varia por provider
 * (email -> `name`, Google -> `full_name`). A cascata termina em 'Viajante'
 * para que NUNCA devolva string vazia.
 *
 * Nota: `profiles.name` (kinu-beta) não entra na cascata de propósito — exigiria
 * uma query e, no signup, o trigger handle_new_user do Arco 2 grava exatamente
 * este mesmo metadata lá. As duas pontas leem da mesma fonte.
 */
function toAppUser(supabaseUser: SupabaseUser | null | undefined): User | null {
  if (!supabaseUser) return null;

  const meta = (supabaseUser.user_metadata ?? {}) as Record<string, unknown>;
  const metaName = [meta.name, meta.full_name, meta.nome]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .find((value) => value.length > 0);

  const email = supabaseUser.email ?? undefined;
  const emailLocalPart = email ? email.split('@')[0].trim() : '';

  return {
    id: supabaseUser.id,
    name: metaName || emailLocalPart || 'Viajante',
    email,
  };
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // O sino do auth — mesmo padrão do subscribeTrips do Arco 1: uma porta, um
  // sino. A assinatura vem ANTES do getSession de propósito: assinar depois
  // abriria uma janela onde um evento (refresh de token, logout em outra aba)
  // passaria despercebido.
  //
  // `isLoading` só cai para false na PRIMEIRA resolução da sessão, venha ela
  // pelo evento INITIAL_SESSION ou pelo getSession. É esse contrato que segura
  // os guards de tela: enquanto ele for true, ninguém redireciona ninguém.
  useEffect(() => {
    let active = true;

    const { data: { subscription } } = kinuBeta.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active) return;
        setSession(nextSession);
        setIsLoading(false);
      }
    );

    kinuBeta.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setIsLoading(false);
      })
      .catch((error) => {
        // Rede caída não pode deixar o app preso no spinner para sempre:
        // sem sessão é um estado legítimo, e o guard sabe o que fazer com ele.
        console.error('[auth] getSession falhou', error);
        if (!active) return;
        setSession(null);
        setIsLoading(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const user = useMemo(() => toAppUser(session?.user), [session]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await kinuBeta.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return toAppUser(data.user);
  }, []);

  /**
   * `name` viaja em options.data -> raw_user_meta_data no auth.users, que é
   * exatamente de onde o trigger handle_new_user (migration 001 do Arco 2) tira
   * o profiles.name. Um único ponto de entrada para o nome.
   *
   * Devolve { user, session } em vez de só user porque, com "Confirm email"
   * LIGADO no painel, `session` vem null: a conta existe mas ainda não há
   * sessão (recon §5.4). Quem chama é que decide o que dizer ao usuário — a 3b
   * usa isso para não navegar para /dashboard sem sessão.
   */
  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const trimmedName = name?.trim();
    const { data, error } = await kinuBeta.auth.signUp({
      email,
      password,
      options: trimmedName ? { data: { name: trimmedName } } : undefined,
    });
    if (error) throw error;
    return { user: toAppUser(data.user), session: data.session };
  }, []);

  // Redireciona o browser inteiro para o Google e volta na URL de retorno.
  // Exige Site URL + Redirect URLs configuradas no painel do kinu-beta
  // (URL do Codespace E a de produção) — pendência operacional da 3b.
  const signInWithGoogle = useCallback(async () => {
    const { error } = await kinuBeta.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  }, []);

  // Alias histórico de signIn — ver a nota de assinatura no topo do arquivo.
  const login = useCallback(
    (email: string, password: string) => signIn(email, password),
    [signIn]
  );

  const logout = useCallback(async () => {
    const { error } = await kinuBeta.auth.signOut();
    if (error) console.error('[auth] signOut falhou', error);
    // O sino também vai zerar a sessão; isto é o cinto de segurança para o caso
    // do signOut falhar por rede — localmente o usuário sai de qualquer jeito.
    setSession(null);
    navigate('/');
  }, [navigate]);

  const requireAuth = useCallback(() => {
    if (!user && !isLoading) {
      navigate('/');
      return false;
    }
    return true;
  }, [user, isLoading, navigate]);

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    logout,
    requireAuth,
    signIn,
    signUp,
    signInWithGoogle,
  };
}

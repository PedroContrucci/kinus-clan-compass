// Telas de autenticação: sem navegação, agente, feedback nem modais por cima.
export const AUTH_SCREENS = ['/', '/redefinir-senha'] as const;
export const isAuthScreen = (pathname: string) => (AUTH_SCREENS as readonly string[]).includes(pathname);

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import kinuLogo from '@/assets/KINU_logo.png';

const CONTATO_EMAIL = 'pedrocontrucci@hotmail.com';

const Privacidade = () => {
  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
            <img src={kinuLogo} alt="KINU" className="h-8 w-8 object-contain" />
            <span className="font-bold text-xl font-['Outfit'] text-foreground">KINU</span>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 font-['Outfit'] text-foreground">Privacidade no KINU</h1>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 font-['Outfit'] text-foreground">O que guardamos</h2>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground font-['Plus_Jakarta_Sans']">
            <li>Nome e e-mail da sua conta;</li>
            <li>Suas viagens: destinos, datas, viajantes e orçamento;</li>
            <li>Conversas com o KINU AI;</li>
            <li>Feedback que você enviar.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 font-['Outfit'] text-foreground">Onde</h2>
          <p className="text-muted-foreground font-['Plus_Jakarta_Sans']">
            Em um banco de dados no Brasil (São Paulo). Uma cópia das suas viagens fica também no seu aparelho para uso offline.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 font-['Outfit'] text-foreground">Com quem compartilhamos para o app funcionar</h2>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground font-['Plus_Jakarta_Sans']">
            <li><span className="text-foreground">Anthropic</span> — processa as mensagens que você envia ao KINU AI;</li>
            <li><span className="text-foreground">Google</span> — busca de lugares e mapas;</li>
            <li><span className="text-foreground">Amadeus</span> — busca de voos;</li>
            <li><span className="text-foreground">Resend</span> — envio de e-mails;</li>
            <li>Parceiros de reserva quando você clica em uma oferta (Kiwi, Klook).</li>
          </ul>
          <p className="mt-3 text-muted-foreground font-['Plus_Jakarta_Sans']">
            Não vendemos seus dados e não usamos publicidade.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 font-['Outfit'] text-foreground">Seus direitos</h2>
          <p className="text-muted-foreground font-['Plus_Jakarta_Sans']">
            Você pode excluir sua conta e todos os seus dados a qualquer momento em Perfil → Excluir minha conta. A exclusão é imediata e irreversível; feedbacks enviados ficam anônimos.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-2 font-['Outfit'] text-foreground">Contato</h2>
          <p className="text-muted-foreground font-['Plus_Jakarta_Sans']">
            Responsável pelos dados: <a href={`mailto:${CONTATO_EMAIL}`} className="text-primary hover:underline">{CONTATO_EMAIL}</a>
          </p>
        </section>

        <p className="text-center text-xs text-muted-foreground/50 mt-10 font-['Plus_Jakarta_Sans']">
          KINU — The Travel OS 🌿
        </p>
      </main>
    </div>
  );
};

export default Privacidade;

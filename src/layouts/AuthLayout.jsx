import { Outlet, Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

/**
 * Layout para fluxos de auth (login, signup, recover).
 * Split-screen: brand panel à esquerda, formulário à direita.
 */
export function AuthLayout() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-aurora p-10 text-primary-foreground lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-[0.07]" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-white/5 blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2 text-lg font-semibold">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          AURORA ERP
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Gestão moderna, pensada para times que crescem.
          </h2>
          <p className="mt-4 text-base text-primary-foreground/85">
            Clientes, estoque, pedidos, financeiro — tudo num só lugar, com a fluidez de um
            produto premium.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-3xl font-semibold">99,9%</p>
              <p className="mt-1 text-primary-foreground/70">Uptime</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">Multi-empresa</p>
              <p className="mt-1 text-primary-foreground/70">Nativo</p>
            </div>
            <div>
              <p className="text-3xl font-semibold">SOC 2</p>
              <p className="mt-1 text-primary-foreground/70">Ready</p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} AURORA ERP — Todos os direitos reservados.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <header className="flex items-center justify-between p-6 lg:hidden">
          <Link to="/" className="flex items-center gap-2 text-base font-semibold">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-aurora text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            AURORA ERP
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-md animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

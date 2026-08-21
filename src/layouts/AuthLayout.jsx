import { Outlet, Link } from 'react-router-dom';
import { AuroraMark } from '@/components/brand/AuroraLogo';

export function AuthLayout() {
  return (
    <div className="grid min-h-screen w-full bg-background text-foreground lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-[28rem] w-[28rem] rounded-full bg-primary/[0.06] blur-3xl" />

        <Link to="/" className="relative flex items-center gap-2.5 text-lg font-semibold">
          <AuroraMark className="h-6 w-6" />
          <span className="tracking-[-0.02em]">Aurora</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">
            Gestão moderna, pensada para times que crescem.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            Clientes, estoque, pedidos, financeiro — tudo num só lugar, com a fluidez de um produto
            premium.
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-sm">
            <div className="border-l border-primary/30 pl-4">
              <p className="text-3xl font-semibold tabular-nums text-white">99,9%</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-primary/80">Uptime</p>
            </div>
            <div className="border-l border-primary/30 pl-4">
              <p className="text-3xl font-semibold text-white">Multi</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-primary/80">Empresa</p>
            </div>
            <div className="border-l border-primary/30 pl-4">
              <p className="text-3xl font-semibold text-white">SOC 2</p>
              <p className="mt-1 text-xs uppercase tracking-wider text-primary/80">Ready</p>
            </div>
          </div>
        </div>

        <p className="relative text-xs text-white/40">
          © {new Date().getFullYear()} AURORA ERP — Todos os direitos reservados.
        </p>
      </div>

      <div className="flex flex-col">
        <header className="flex items-center justify-between p-6 lg:hidden">
          <Link to="/" className="flex items-center gap-2 text-base font-semibold">
            <div className="grid h-8 w-8 place-items-center rounded-md border border-border">
              <AuroraMark className="h-4 w-4" />
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

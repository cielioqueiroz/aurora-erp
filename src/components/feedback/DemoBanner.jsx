import { Info } from 'lucide-react';
import { isDemoMode } from '@/app/demoMode';

/**
 * Banner discreto no topo do app indicando que estamos em modo demo.
 * Não renderiza nada se VITE_DEMO_MODE !== 'true'.
 */
export function DemoBanner() {
  if (!isDemoMode) return null;
  return (
    <div className="flex items-center justify-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-1.5 text-xs text-warning">
      <Info className="h-3.5 w-3.5" />
      <span className="font-medium">
        Modo demo ativo — você está navegando como <strong>owner fake</strong>; dados não persistem.
        Para usar com Supabase real, edite <code className="rounded bg-warning/10 px-1 font-mono">VITE_DEMO_MODE=false</code> no <code className="rounded bg-warning/10 px-1 font-mono">.env</code>.
      </span>
    </div>
  );
}

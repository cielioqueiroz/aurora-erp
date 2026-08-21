# Design

Sistema visual do Aurora ERP. Registro **product**: a interface serve à tarefa. Ver `PRODUCT.md` para usuários, propósito e anti-referências.

## Estratégia de cor

**Restrained.** Neutros tingidos em direção ao azul da marca, mais um acento. A cor nunca decora.

O acento é **azul-ardósia profundo**, usado só em três lugares: ação primária, seleção atual e foco. Tudo o mais no cromo é neutro.

### Por que a semântica vem antes da marca

Num ERP, verde, vermelho e âmbar já estão ocupados — entrou, saiu, vence. Gastar esses tons em decoração destrói a leitura do dado. Por isso a paleta semântica é fixa e o acento teve que caber em volta dela.

O acento e o `info` semântico são da mesma família azul. Eles não se confundem porque são **formas diferentes**, não matizes diferentes: ação é preenchimento sólido com texto invertido; informação é fundo tingido a 10% com texto colorido. Um botão nunca parece um selo, e um selo nunca parece clicável.

### Tokens

Definidos em `src/styles/globals.css` como triplas HSL, consumidos via `hsl(var(--token))`. A rampa foi calculada em OKLCH para uniformidade perceptual e emitida em HSL — o encanamento existente já usava HSL em cinco arquivos, e preservar a identidade do sistema venceu a troca de notação.

| Papel              | Claro         | Escuro        |
| ------------------ | ------------- | ------------- |
| `background`       | `216 30% 98%` | `217 22% 7%`  |
| `foreground`       | `217 22% 8%`  | `216 25% 93%` |
| `primary`          | `208 62% 30%` | `208 62% 60%` |
| `muted-foreground` | `215 12% 40%` | `215 14% 66%` |
| `border`           | `216 18% 89%` | `217 14% 20%` |
| `sidebar`          | `216 26% 96%` | `217 22% 9%`  |

Semânticos: `success` jade, `destructive` garnet, `warning` âmbar, `info` aço. Sempre acompanhados de rótulo — estado nunca é comunicado só por cor.

Gráficos têm paleta própria (`--chart-1` a `--chart-5`), separada da semântica. É deliberado: no gráfico a cor **é** o dado, e é o único lugar do sistema onde a cor pode ser abundante.

## Tipografia

**Uma família: Geist.** Interface de produto não precisa de par display/corpo — pesos e tamanhos carregam a hierarquia com menos ruído. `Geist Mono` para códigos, SKUs e identificadores.

Escala fixa em `rem`, não fluida: o usuário opera em DPI constante, e um h1 que encolhe dentro de um painel fica pior, não melhor.

`font-variant-numeric: tabular-nums` em toda tabela — dígitos precisam alinhar em coluna.

## Forma e movimento

- `--radius: 0.75rem` (12px) em cards e painéis; controles menores derivam por `calc()`; selos são pílula.
- Sombras discretas e neutras. Nenhuma sombra colorida, nenhum brilho.
- Transições de 150–160ms com `cubic-bezier(0.16, 1, 0.3, 1)`. Movimento comunica estado; nada se move por enfeite.
- `prefers-reduced-motion` desliga tudo.

## Proibições deste projeto

Herdadas das anti-referências do `PRODUCT.md` e das regras do registro product. Se você for escrever uma destas, reescreva o elemento:

- **Degradês decorativos.** Nenhum. Nem em logo, nem em botão, nem em régua.
- **Barra lateral colorida** como acento em card, linha de tabela ou item de menu.
- **Fonte display** em rótulo, botão ou dado.
- **`bg-accent` como superfície de hover.** `accent` aqui é cor de marca, não cinza sutil. Hover usa `secondary`.
- **Ícone de "sparkles"** ou qualquer ícone genérico fazendo papel de logo.
- **Cor saturada em estado inativo.**
- **Modal como primeira ideia.** Esgote alternativas inline antes.

## Marca

`src/components/brand/AuroraLogo.jsx`. Um "A" geométrico monolinear apoiado numa linha que atravessa toda a largura da marca — lê como a letra e como o horizonte ao amanhecer. Monocromático, herda `currentColor`, sem ladrilho de fundo.

Existe exatamente **um** âncora de marca na tela: a sidebar. O seletor de empresa abaixo dele é texto e chevron, sem bloco visual competindo.

## Ícones

`lucide-react` com `stroke-width: 1.5` aplicado globalmente em `.lucide`. O padrão de 2px é grosso demais ao lado de uma grotesca de peso médio.

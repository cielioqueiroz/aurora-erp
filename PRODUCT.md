# Product

## Register

**Product.** Aurora é uma superfície autenticada de trabalho: dashboards, tabelas densas, formulários e painéis. O design serve a tarefa; não é o produto.

## Users

Donos e operadores de pequenas e médias empresas brasileiras. Duas posturas distintas na mesma tela:

- **O dono** abre uma ou duas vezes por dia para responder "hoje pagou o dia?". Quer resumo antes de detalhe.
- **O operador** vive dentro do sistema oito horas seguidas registrando pedidos e movimentando estoque. Quer densidade, teclado e zero fricção repetida.

Nenhum dos dois é fluente em software. Ambos já usaram Conta Azul, Bling ou uma planilha, e é contra isso que Aurora é medida.

**Cena física:** um monitor 1080p barato num escritório de fundos com luz fluorescente às sete da manhã; o mesmo sistema num notebook, na sala, às nove da noite. Os dois temas precisam funcionar de verdade, com contraste alto e pouco brilho.

## Product Purpose

Substituir a planilha e o caderno por um registro único e confiável de clientes, produtos, estoque, pedidos e financeiro — com isolamento por empresa e permissões por papel.

O sistema tem uma opinião central, registrada em `docs/adr/0001`: um pedido confirmado é um fato, não uma intenção. A interface precisa deixar essa fronteira visível, porque é onde estoque e dinheiro se movem.

## Brand Personality

Sóbrio, preciso, silencioso. A ferramenta desaparece dentro da tarefa.

Aurora não é "empolgante". É a sensação de um instrumento bem calibrado: nada pisca sem motivo, nada se move sem comunicar estado, e o número que importa está onde o olho já estava.

## Anti-references

Rejeitado explicitamente pelo cliente, em ordem de gravidade:

1. **Aparência de interface gerada por IA.** Concretamente: degradês decorativos, ícone de "sparkles" como logo, azul-padrão-do-Tailwind, Inter, brilhos e sombras coloridas, dois blocos com degradê empilhados na sidebar.
2. **Cor como enfeite.** Num ERP, verde, vermelho e âmbar já significam entrou, saiu e vence. Gastá-los em decoração destrói a leitura do dado.
3. **Azul-e-laranja de ERP brasileiro** (Conta Azul, Bling, Omie). Familiar demais, indistinguível.

**Referências positivas:** Linear, Stripe Dashboard, Vercel. Cromo monocromático, cor reservada ao significado, densidade sem ruído.

## Accessibility

- Texto de corpo em 4.5:1 no mínimo, nos dois temas. Placeholder também — não o cinza claro padrão.
- Estado nunca comunicado só por cor: status carrega rótulo além do tom.
- Navegação completa por teclado; foco sempre visível.
- `prefers-reduced-motion` respeitado em toda transição.
- Interface inteira em PT-BR, moeda em BRL, datas em dd/MM/yyyy, CPF/CNPJ formatados.

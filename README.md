# RAAM

*Raam* é "janela" em holandês.

Um portfólio construído como um sistema operacional: janelas em mosaico,
uma rampa neutra, um acento por tema — tudo desenhado em código, sem uma
única imagem no projeto.

## O princípio

A linhagem é o modernismo do norte da Europa lido através do design de
produto contemporâneo: Rams e Ulm para a disciplina, Crouwel e a Total
Design para a grade, Linear e Notion para como isso se comporta em
software.

As regras da casa:

- **Uma rampa neutra, um acento, nada mais.**
- **Superfícies são separadas por uma linha de 1px, não por sombra.**
- **Raios são pequenos.** Maciez é um problema de espaçamento, não de canto.
- **Movimento é abundante, mas preciso.** Rápido, amortecido, nunca elástico.
- **Nenhum ornamento sobrevive se não carregar informação.**

## Temas

| | |
|---|---|
| **Graphite** | escuro neutro — o padrão |
| **Slate** | escuro frio |
| **Ochre** | escuro quente |
| **Paper** | claro quente |
| **Delft** | claro frio |

Trocar de tema retinge tudo: papel de parede, capas de projeto, interface.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Fluxo

`boot` → bloqueio → sessão. Uma área de trabalho vazia não é um vazio: é a
tela inicial.

## Atalhos

| | |
|---|---|
| `⌘K` ou `espaço` | buscar (apps, projetos e comandos) |
| `⌘1…5` | trocar de área |
| `⌘W` | fechar janela |
| `⌘F` | soltar / encaixar a janela |
| `⌘J` | alternar o foco |
| `⌘L` | bloquear |

## Peças

| Peça | Onde | O que é |
|---|---|---|
| Layout | `src/os/store.ts` | `dwindle`: cada janela toma metade do que sobrou, dividindo o lado mais longo da região restante |
| Movimento | `src/os/motion.ts` | Molas criticamente amortecidas e tweens curtos — a coreografia é farta, o caráter não |
| Papel de parede | `src/components/Wallpaper.tsx` | Campo quase plano, uma massa de luz muito lenta, grade modular e grão. O teste: se você o nota lendo uma janela, está alto demais |
| Temas | `src/styles/os.css` | Cinco, cada um com rampa neutra de dez passos e um acento |
| Capas | `src/components/Cover.tsx` | Oito composições planas construídas sobre a mesma grade, que herdam a paleta por CSS vars |
| Buscar | `src/components/Launcher.tsx` | Apps, projetos e comandos numa lista só, teclado primeiro |

## Tipografia

Inter, uma família só, carregada por peso e tracking em vez de por variedade —
como Linear e Notion fazem. Mono aparece só onde o dado pede: índices,
terminal, nomes de arquivo.

As fontes vêm do Google Fonts com fallbacks de sistema; sem rede, o layout
continua íntegro.

## Stack

React 19 · TypeScript · Vite · Zustand · Motion · Canvas 2D · Web Audio · CSS puro

Abaixo de 820px o mosaico colapsa para uma janela por vez e o rail sai.

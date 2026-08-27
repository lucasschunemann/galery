# RAAM

*Raam* é "janela" em holandês.

Um portfólio construído como um sistema operacional: janelas em mosaico,
uma rampa neutra e um acento por tema, tudo desenhado em código. Não há
nenhum arquivo de imagem no projeto.

## O princípio

A linhagem é o modernismo do norte da Europa lido através do design de
produto contemporâneo: Rams e a HfG Ulm para a disciplina, Crouwel e a Total
Design para a grade, Linear e Notion para como isso se comporta em software.

As regras da casa:

- Uma rampa neutra, um acento, nada mais.
- Superfícies se separam por uma linha de 1px, sem sombra.
- Todo canto é generoso e contínuo. Não sobrou nenhum canto vivo apontado
  para quem lê.
- Movimento é abundante, mas nada dispara e nada ultrapassa o alvo.
- Margem é material. O ar dentro de um painel não é sobra: é o que torna
  o texto legível.
- Nenhum ornamento sobrevive se não carregar informação.

Três decisões estruturais não aparecem em lugar nenhum da tela:

O primeiro corte do layout é 0.618, não a metade. Uma sala fica mais calma
quando suas partes são desiguais; uma divisão exata faz o olho comparar os
dois lados em vez de se acomodar em um.

A luz do papel de parede fica onde o sol estaria na hora real de quem está
lendo, com a temperatura de cor daquela hora. A sala às sete da manhã não é
a mesma de meia-noite. Ninguém deve notar isso.

Uma área de trabalho vazia não é um estado de erro. É a tela inicial.

## Programa de cores

Oito temas, cada um tirado de uma linhagem real em vez de inventado. Todos
têm uma rampa neutra de dez passos e exatamente um acento. A variedade vive
na temperatura, não na quantidade de cor.

Nenhum neutro aqui é cinza puro. Mesmo os temas escuros carregam alguma
temperatura, porque um cinza perfeitamente neutro é uma cor que não existe
em lugar nenhum e lê como equipamento.

| Tema | Linhagem |
|---|---|
| **Braun** | Dieter Rams. O padrão |
| **Linen** | branco quente, azul contido |
| **Zürich** | Josef Müller-Brockmann |
| **Delft** | azul de Delft |
| **Graphite** | carvão quente |
| **Ulm** | Otl Aicher, HfG Ulm |
| **Basel** | Armin Hofmann, Emil Ruder |
| **Stedelijk** | Wim Crouwel, Total Design |

Trocar de tema retinge tudo: papel de parede, capas de projeto, interface.
O seletor mostra a fonte de cada paleta.

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
| `⌘G` | mostrar a grade — 12 colunas e linha de base de 8px sobre tudo |

## Peças

| Peça | Onde | O que é |
|---|---|---|
| Layout | `src/os/store.ts` | `dwindle`: cada janela toma metade do que sobrou, dividindo o lado mais longo da região restante |
| Movimento | `src/os/motion.ts` | Molas criticamente amortecidas e tweens curtos. A coreografia é farta, o caráter não |
| Papel de parede | `src/components/Wallpaper.tsx` | Campo quase plano, uma massa de luz posicionada pela hora do dia, grade modular e grão. O teste: se você o nota lendo uma janela, está alto demais |
| Temas | `src/styles/os.css` | Cinco, cada um com rampa neutra de dez passos e um acento |
| Capas | `src/components/Cover.tsx` | Oito composições planas construídas sobre a mesma grade, que herdam a paleta por CSS vars |
| Pictogramas | `src/components/Pict.tsx` | Um sistema desenhado à maneira de Ulm: mesma grade de 24, mesma espessura, só círculos, quadrados e diagonais de 45° |
| Buscar | `src/components/Launcher.tsx` | Apps, projetos e comandos numa lista só, teclado primeiro |

## Tipografia

Inter, uma família só, carregada por peso e tracking em vez de por variedade,
como Linear e Notion fazem. Mono aparece só onde o dado pede: índices,
terminal, nomes de arquivo.

As fontes vêm do Google Fonts com fallbacks de sistema; sem rede, o layout
continua íntegro.

## Stack

React 19 · TypeScript · Vite · Zustand · Motion · Canvas 2D · Web Audio · CSS puro

Abaixo de 820px o mosaico colapsa para uma janela por vez e o rail sai.

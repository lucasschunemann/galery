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

Seis temas, e os dois tipos obedecem a regras diferentes.

**Três vêm de uma escola de design.** Recebem um acento e mais nada: a
disciplina é a ideia inteira, e nenhum deles repete família de acento.

**Três vêm de um lugar.** Saem de bandeiras tricolores, então são os únicos
com direito a três cores, e são todos claros, porque bandeira lê no branco.
A cor primária é sempre a que tem contraste para carregar texto e anel de
foco; a segunda e a terceira são preenchimento apenas.

| Tema | Origem | Cores |
|---|---|---|
| **Braun** | Dieter Rams | tan terroso |
| **Zürich** | Josef Müller-Brockmann | vermelho |
| **Graphite** | carvão quente | azul-violeta |
| 🇧🇷 **Brasil** | Niemeyer e Burle Marx | verde · amarelo · azul |
| 🇳🇱 **Holanda** | Oranje | azul · vermelho · laranja |
| 🇩🇪 **Alemanha** | Bauhaus | vermelho · ouro · preto |

No seletor os dois grupos ficam separados por um fio: escolas em cima,
lugares embaixo.

Nos temas de escola os três tokens de acento guardam o mesmo valor, então
tudo que rotaciona entre eles continua monocromático. Nos de bandeira, as
capas de projeto pegam uma das três cores por posição na grade, o que dá
ritmo sem precisar de nenhuma regra nova.

Nenhum neutro aqui é cinza puro. Mesmo o tema escuro carrega temperatura,
porque um cinza perfeitamente neutro é uma cor que não existe em lugar
nenhum e lê como equipamento.

Sobre as escolhas: o **Brasil** não é a bandeira pregada na parede, é o
branco de concreto de Brasília com o verde carregando o texto. A **Holanda**
usa o azul da bandeira como primária e guarda o laranja de Orange-Nassau
como terceira. A **Alemanha** usa um vermelho mais fundo que o de Zürich,
para que os dois não se confundam.

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
| `⌘G` | mostrar a grade: 12 colunas e linha de base de 8px sobre tudo |
| `alt` (arrastando) | desliga o snap e posiciona livremente |

## Mover janelas

Arrastar um painel do mosaico sobre outro troca os dois de lugar; o painel
alvo se destaca enquanto o ponteiro está sobre ele.

Uma janela solta (`⌘F`) tem três comportamentos, nesta ordem de prioridade:

1. **Zonas de borda.** O ponteiro perto de uma borda propõe metade da área;
   perto de um canto, um quarto. A prévia aparece antes de você soltar.
2. **Alinhamento.** Bordas e centros se alinham com as janelas vizinhas e com
   a área de trabalho, e uma linha mostra por quê.
3. **Grade.** O que sobrar arredonda para a grade de 12 colunas.

Segurar `alt` durante o arrasto desliga tudo isso.

## Peças

| Peça | Onde | O que é |
|---|---|---|
| Layout | `src/os/store.ts` | `dwindle`: cada janela toma metade do que sobrou, dividindo o lado mais longo da região restante |
| Snap | `src/os/snap.ts` | Funções puras: recebem um retângulo proposto e devolvem onde ele deve pousar, mais as guias que explicam o porquê |
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

## Sobre o conteúdo

Os oito projetos da galeria são **placeholders**. As capas e o layout estão
prontos; os casos não. Cada entrada em `src/data/projects.ts` tem o formato de
um estudo de caso para que a galeria possa ser lida sem que nada ali afirme
ser um trabalho que existe. Para preencher um: troque título, tipo, tagline e
corpo, coloque números reais em `metrics`, e deixe `art` e `accent` como estão,
a não ser que queira mudar o ritmo da grade.

## Stack

React 19 · TypeScript · Vite · Zustand · Motion · Canvas 2D · Web Audio · CSS puro

Abaixo de 820px o mosaico colapsa para uma janela por vez e o rail sai.

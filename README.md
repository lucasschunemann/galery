# HELVETIA

Um portfólio construído como um sistema operacional — tiling window
manager, paletas tonais e disciplina tipográfica suíça.

Não existe uma única imagem no projeto. Papel de parede, capas de projeto,
ícones e sons são gerados em código.

## O princípio

Três linhagens, uma superfície:

| Linhagem | O que ela governa |
|---|---|
| **Tiling WM** (Hyprland) | Estrutura: gaps, workspaces, layout `dwindle`, foco por anel |
| **Material 3** | Elevação: tom, nunca sombra. Rampa neutra de 10 passos + um acento |
| **Suíço / Apple** | Ordem: grade, fio de cabelo, um acento só, vidro, contenção |

A regra dura: **elevação é expressa por tom, nunca por sombra**. A
profundidade vem de blur e luz — não existe um bevel no sistema inteiro.
E existe **um acento por paleta**; todo o resto é neutro.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Fluxo

`boot` → `lock` → sessão. Uma área de trabalho vazia não é um vazio: é a
**tela inicial**, com a composição do wallpaper aparecendo por trás.

## Atalhos

| | |
|---|---|
| `⌘K` ou `espaço` | launcher (apps, projetos e comandos) |
| `⌘1…5` | trocar de área de trabalho |
| `⌘W` | fechar janela |
| `⌘F` | soltar / encaixar a janela (float ↔ tile) |
| `⌘J` | alternar o foco |
| `⌘L` | bloquear |

## Peças

| Peça | Onde | O que é |
|---|---|---|
| Layout | `src/os/store.ts` | `dwindle`: cada janela toma metade do que sobrou, dividindo sempre o lado mais longo da região restante |
| Wallpaper | `src/components/Wallpaper.tsx` | Composição "Signal": anéis concêntricos em progressão geométrica, leque radiante, grade modular, dois blooms lentos e grão. Precisa funcionar nítido nos gaps e como campo de cor sob 30px de blur |
| Paletas | `src/styles/os.css` | Quatro flavours — graphite, mocha, nord, paper — cada uma com rampa neutra e um acento |
| Capas | `src/components/Cover.tsx` | Oito composições suíças que herdam a paleta via CSS vars. Variação vem de forma e peso tonal, nunca de matiz |
| Launcher | `src/components/Launcher.tsx` | rofi: apps, projetos e comandos numa lista só, teclado primeiro |
| Bloqueio | `src/components/Lock.tsx` | hyprlock: o wallpaper segue vivo sob o blur |
| Tokens | `src/apps/Tokens.tsx` | A folha de tokens do sistema, ao vivo — mexer aqui muda o OS que você está olhando |

## Stack

React 19 · TypeScript · Vite · Zustand · Motion · Canvas 2D · Web Audio · CSS puro

Abaixo de 820px o tiling colapsa para uma janela por vez e o rail sai —
a metáfora de mosaico não sobrevive a 390px, e fingir que sobrevive seria pior.

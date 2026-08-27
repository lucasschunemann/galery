# AERO OS — International Edition

Um portfólio construído como um sistema operacional fictício do início dos anos
2000, cruzado com o minimalismo tipográfico da Escola Suíça.

Não há um único arquivo de imagem no projeto. O papel de parede, os ícones, as
capas dos projetos e até os sons da interface são gerados em código.

## O princípio

As duas linguagens brigam por natureza: uma é profundidade e ornamento, a outra
é superfície e grade. Em vez de misturá-las em cada elemento, cada uma governa
uma camada:

> **O suíço governa a estrutura. O Aero governa o material.**

Na prática isso vira uma regra tipográfica dura — **chrome em Lucida Grande**
(janelas, dock, menus: o âncora de 2001), **conteúdo em Helvetica** (grade,
fios de cabelo, numeração, uma única cor de destaque: o âncora de Basileia).
Vidro e gel não entram no conteúdo; grade e hairline não entram no chrome.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # produção em dist/
```

## O que tem aqui

| Peça | Onde | O que é |
|---|---|---|
| Boot | `src/components/Boot.tsx` | Power gate (necessário para liberar o áudio) + sequência de inicialização |
| Papel de parede | `src/components/Wallpaper.tsx` | Canvas 2D: céu, nuvens com volume real (sprites com face iluminada e face sombreada), colina Bliss, sol com flare, bolhas iridescentes, grão de filme — e um leque de arcos concêntricos em cromo com progressão geométrica de espessura: o único gesto suíço da camada material |
| Camada suíça | `src/components/DesktopGrid.tsx` | Grade modular de 12 colunas, marcas de registro, trilho tipográfico vertical e um ritmo de barras com o único acento vermelho |
| Sistema tipográfico | `src/styles/type.css` | Escala modular, papéis de texto, fios, blocos de dados |
| Window manager | `src/os/store.ts` | Zustand: z-order, foco, minimizar/zoom, cascata, singletons |
| Janelas | `src/components/Window.tsx` | Arrasto, resize, semáforo em gel, minimizar com genie até o ícone certo do dock |
| Dock | `src/components/Dock.tsx` | Magnificação gaussiana real, com mola, indicador de app aberto |
| Áudio | `src/os/sound.ts` | Web Audio: chime de boot, pops, whooshes — tudo sintetizado |
| Galeria | `src/apps/Finder.tsx` | Grade, Cover Flow 3D com reflexo, e lista |
| Capas | `src/components/Cover.tsx` | 8 variantes de arte generativa em SVG, parametrizadas por matiz |
| AeroTunes | `src/apps/Player.tsx` | Patch ambiente generativo com visualizador via `AnalyserNode` |
| Terminal | `src/apps/Terminal.tsx` | Shell funcional: `ls`, `open`, `theme`, `neofetch`, histórico |
| Playground | `src/apps/Playground.tsx` | Laboratório de materiais que emite o CSS do gel |

## Atalhos

- `⌘1` galeria · `⌘2` terminal · `⌘3` AeroTunes · `⌘W` fecha a janela
- Clique duplo na barra de título maximiza
- Menu **Aparência**: Aqua, Grafite, Bliss, Pôr do Sol — retinge o wallpaper inteiro
- 75s parado aciona o protetor de tela

## Stack

React 19 · TypeScript · Vite · Zustand · Motion · Canvas 2D · Web Audio API · CSS puro

Abaixo de 720px o sistema abandona o gerenciamento de janelas e vira uma pilha
de painéis em tela cheia — o dock e a barra de menu continuam.

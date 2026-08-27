# AERO OS — portfólio como sistema operacional

Uma experiência de portfólio construída como um sistema operacional fictício do
início dos anos 2000: Aqua, Frutiger Aero, vidro, gel e céu.

Não há um único arquivo de imagem no projeto. O papel de parede, os ícones, as
capas dos projetos e até os sons da interface são gerados em código.

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
| Papel de parede | `src/components/Wallpaper.tsx` | Canvas 2D: céu, nuvens volumétricas em 3 camadas de parallax, colina Bliss, sol com flare anamórfico e bolhas com rim iridescente |
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

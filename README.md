# KOMOREBI 木漏れ日

*A luz que passa entre as folhas.*

Um portfólio construído como um sistema operacional calmo — tiling window
manager, vidro fosco, paletas suaves e movimento orgânico.

## O princípio

A linhagem é a cultura de *rice* do Hyprland cruzada com Material You, mas a
temperatura é doméstica. As regras da casa:

- **Elevação é tom e blur, nunca uma borda de sombra dura.** Não existe um
  bevel no sistema.
- **Um acento suave por ambiente.** No momento em que ele fica neon, tudo
  volta a parecer um terminal.
- **Nada se move linearmente.** Tudo assenta, com um pouco de overshoot.
- **Respiro é conteúdo.** Raios grandes e muito espaço vazio.

## Ambientes

| | |
|---|---|
| **Matcha** | verde, calmo — o padrão |
| **Sakura** | rosa empoeirado, macio |
| **Yozora** | noite, lilás |
| **Sumi** | carvão e âmbar |
| **Washi** | papel, o único claro |

Trocar de ambiente retinge tudo: papel de parede, capas de projeto, interface.

## Rodando

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

## Fluxo

`boot` → `descanso` (tela de bloqueio) → sessão. Uma área de trabalho vazia não
é um vazio: é a **tela inicial**.

## Atalhos

| | |
|---|---|
| `⌘K` ou `espaço` | procurar (apps, projetos e comandos) |
| `⌘1…5` | trocar de área |
| `⌘W` | fechar janela |
| `⌘F` | soltar / encaixar a janela |
| `⌘J` | alternar o foco |
| `⌘L` | descansar |

## Peças

| Peça | Onde | O que é |
|---|---|---|
| Layout | `src/os/store.ts` | `dwindle`: cada janela toma metade do que sobrou, dividindo o lado mais longo da região restante |
| Movimento | `src/os/motion.ts` | Um vocabulário só para todo o sistema — molas com peso, nada crítico-amortecido |
| Papel de parede | `src/components/Wallpaper.tsx` | Quatro massas de cor à deriva em ciclos próprios, uma lanterna de papel e grão. Baixa frequência de propósito: precisa sobreviver a 40px de blur |
| Ambientes | `src/styles/os.css` | Cinco paletas, cada uma com rampa neutra de dez passos e um acento dessaturado |
| Capas | `src/components/Cover.tsx` | Oito composições macias que herdam a paleta por CSS vars |
| Procurar | `src/components/Launcher.tsx` | Apps, projetos e comandos numa lista só, teclado primeiro |
| Descanso | `src/components/Lock.tsx` | O papel de parede segue vivo sob o blur |

## Tipografia

Plus Jakarta Sans carrega a interface; **M PLUS Rounded 1c** — uma gótica
japonesa arredondada — carrega os números e títulos grandes. É ela que faz o
sistema parecer acolhedor em vez de técnico. Mono aparece só onde o dado pede.

As fontes vêm do Google Fonts com fallbacks de sistema; sem rede, o layout
continua íntegro. Nenhum arquivo de imagem no projeto.

## Stack

React 19 · TypeScript · Vite · Zustand · Motion · Canvas 2D · Web Audio · CSS puro

Abaixo de 820px o tiling colapsa para uma janela por vez e o rail sai.

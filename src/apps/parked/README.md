# Parked

Apps que saíram de circulação mas que valem guardar.

Nada aqui está registrado em `APPS` (`src/os/store.ts`) nem no `AppHost`,
então não aparecem no rail, no launcher nem no terminal, e o bundler não
os inclui na build. São arquivos vivos só para o TypeScript.

- **Player.tsx** — tocador ambiente com áudio sintetizado na hora (Web Audio,
  escala pentatônica sobre A2, drone de sub-oitava, visualizador por
  `AnalyserNode`). Saiu porque música não tem o que fazer num portfólio de
  design. O motor de som do sistema (`src/os/sound.ts`, cliques e hovers)
  é outra coisa e continua ativo.
- **Trash.tsx** — o "Arquivo". A ideia era virar um espaço de artigos em vez
  de arquivo morto; enquanto isso não acontece, fica fora.

Para religar um deles: devolver a entrada em `APPS`, o `case` no `AppHost`,
e mover o arquivo de volta para `src/apps/` (ajustando os imports, que aqui
estão um nível mais fundo).

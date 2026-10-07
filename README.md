# VON

A galeria de trabalho de Lucas Schünemann, feita como um lugar por onde se
anda. Um boneco de cromo percorre ilhas brancas que flutuam sobre um mar de
nuvens, e cada projeto está exposto numa sala, como escultura.

*Von* é a partícula que liga um nome a um lugar, no alemão e no holandês.

## A ideia

A referência é o CGI do começo dos anos 2000: os renders de demonstração de
placa de vídeo, o Frutiger Aero, o Aqua dos primeiros Mac OS X, os menus de
DVD, e jogos que estão revisitando isso agora, como o Snaptic. Cromo, vidro,
porcelana, céu azul limpo, brilhos de quatro pontas.

O mundo é renderizado pequeno (cerca de um terço da tela) e ampliado sem
suavização, o que dá o serrilhado de render antigo. A interface por cima é o
contrário: nítida, em vidro fosco, com os botões de gel do Aqua, uma família
tipográfica só e a grade e a hierarquia do design suíço.

## O percurso

Uma grade 3×3 de ilhas, ligadas por pontes em arco. O átrio fica no centro,
com o VON em tubos cromados. As seis obras seguem em sentido horário a partir
da sala 01, e o anel fecha com Sobre e Contato. Além do Sobre, uma ponte leva
à colina, onde moram uma estrela cromada e uma colher que acompanha você com
os olhos.

| Sala | Projeto | Escultura |
|---|---|---|
| 01 | Acompanha | um gráfico de tijolos com a linha do preço |
| 02 | Acronos | um cubo de módulos que se reorganiza sozinho |
| 03 | Sendeski Café | xícara cromada, grãos em órbita, vapor de vidro |
| 04 | WF Odontologia | um dente de porcelana que brilha |
| 05 | TravelDone | globo de vidro com um avião de papel |
| 06 | PF Advogados | uma balança que nunca se decide |
| LS | Sobre | a mão cromada fazendo sinal de paz |
| @ | Contato | uma antena que manda sinais |

Cada sala tem um letreiro em pixel, um pedestal com um anel no chão e uma
placa (o painel lateral) com o caso completo.

## Controles

| | |
|---|---|
| `WASD` ou setas | andar |
| clique no chão | ir até lá |
| clique na escultura | ir até ela e abrir a placa |
| `Shift` | virar bolinha de gude e rolar (mais rápido) |
| `Espaço` | pular |
| `E` ou `Enter` | abrir a placa da obra mais próxima |
| `C` | catálogo, com acesso direto a qualquer sala |
| `Esc` | fechar |
| roda do mouse | aproximar e afastar |

No celular: toque no chão para andar, segure para o boneco seguir o dedo,
pinça para o zoom, e o botão "rolar" trava o modo bolinha.

Viagens longas (pelo catálogo, pelo minimapa ou pelos links de outra placa)
viram bolinha automaticamente. O endereço guarda a sala aberta, então
`/#acronos` abre direto no Acronos.

## Dia e noite

O tema começa pela hora de quem visita: noite entre 19h e 6h. O dia é o céu do
Frutiger Aero; a noite é periwinkle, rosa e ciano, a paleta dos menus de DVD,
com estrelas. O botão de sol e lua troca, com transição.

## Som

Tudo sintetizado na hora com Web Audio, nenhum arquivo. Começa desligado;
"Entrar com som" liga, com um acorde de entrada.

- **A cadeia.** Tudo passa por um compressor leve. Música e efeitos mandam um
  pouco para uma sala (um impulso de 3,6 s gerado com ruído que escurece com o
  tempo) e para um eco pingue-pongue no tempo da música.
- **A música é generativa.** Um colchão de acordes com um filtro que respira,
  um sub embaixo, um sopro de ar filtrado como vento entre as ilhas, e sinos de
  vidro (síntese FM com razão inarmônica) tocando uma melodia que anda por
  graus vizinhos. O dia toca em Fá lídio; a noite, em Ré bemol, mais esparsa e
  mais escura. Trocar o tema troca a música.
- **Cada sala tem a sua nota.** Chegar perto toca a nota da sala; abrir a placa
  toca a nota com a quinta e a oitava; passar o mouse no catálogo e no mapa
  toca as mesmas notas, uma oitava acima.
- **O corpo faz barulho.** Passos de piso de cerâmica nas ilhas e de grama na
  colina, pulo e aterrissagem, a bolinha rolando (ruído que segue a velocidade,
  com tilintares de vidro) e o som de virar e desvirar bolinha.
- O seletor de pixel responde em 8 bits. Com a aba escondida, o áudio pausa.

## Interface

A interface sai de poucas peças, todas em `src/style.css`: vidro fosco com um
brilho no topo, botões de gel do Aqua (azul, prata e na cor da sala), contas de
gel para números, teclas de teclado e rótulos em mono. Três alturas (32, 40 e
48 px), três raios (pílula, cartão de 18 e folha de 26) e uma família
tipográfica, Inter, com JetBrains Mono para rótulos.

Cada placa abre com o letreiro da própria sala, o mesmo pixel que está no
mundo, num caixilho de porcelana com reflexo. O catálogo usa os mesmos
letreiros como miniatura.

## Logotipo

O VON é desenhado em SVG com os mesmos tubos cromados da escultura do átrio
(`src/ui/logo.ts`): contorno escuro, cromo com a faixa do horizonte, um risco de
luz e um brilho de quatro pontas no anel. O O gira como o anel 3D. À noite o
cromo reflete rosa e ciano. O favicon e o ícone do iPhone são o anel sozinho
(`public/favicon.svg`, `public/apple-touch-icon.png`), e `public/og.jpg` é a
imagem de compartilhamento, feita a partir de um quadro do próprio mundo.

## Como colocar imagens nos projetos

1. Coloque os arquivos em `public/work/<id-do-projeto>/`, por exemplo
   `public/work/acronos/01.webp`.
2. Em `src/data/projects.ts`, liste os caminhos em `images`:

   ```ts
   images: ["/work/acronos/01.webp", "/work/acronos/02.webp"],
   ```

A placa mostra as imagens logo abaixo do subtítulo. WebP com 1600 px de
largura é um bom tamanho.

O resto do conteúdo também mora em `src/data/`: `projects.ts` para as obras
(título, texto, cliente, ano, cor da sala) e `site.ts` para o Sobre.

## Peças

| Peça | Onde | O que faz |
|---|---|---|
| Mapa | `src/world/layout.ts` | as ilhas, as pontes, onde se pode pisar, e as rotas entre salas |
| Motor | `src/world/world.ts` | renderização em pixel, piso espelhado, câmera isométrica, entrada |
| Arquitetura | `src/world/build.ts` | ilhas, muros com arcos, pontes, pedestais, letreiros, a colina |
| Esculturas | `src/world/sculptures.ts` | uma por sala, todas geradas em código |
| Boneco | `src/world/player.ts` | o andar, o pulo, a bolinha, a colisão |
| Ambiente | `src/world/ambient.ts` | nuvens, cubos soltos, bolhas e brilhos |
| Materiais | `src/world/materials.ts` | cromo, porcelana, vidro, o piso espelhado e o esmaecer no céu |
| Céu | `src/world/env.ts` | as paletas de dia e noite e o ambiente pintado em canvas |
| Interface | `src/main.ts`, `src/ui/` | intro, HUD, placas, catálogo, minimapa, logotipo |
| Som | `src/audio.ts` | sintetizador, música generativa e efeitos |

Alguns detalhes técnicos que não aparecem na tela:

- A câmera anda em degraus de um texel e o canvas é deslocado pelo resto, em
  CSS. Sem isso, as bordas "nadam" quando a câmera se move.
- O piso é um espelho de verdade: uma segunda câmera, refletida no plano do
  chão, renderiza a cena numa textura. Só objetos refletem; o céu não.
- Tudo que desce abaixo do piso se dissolve na cor do céu daquele pixel.
- Se o computador sofrer, o espelho desliga sozinho, depois o pixel engrossa.
- Nada do que o site carrega é imagem, modelo 3D ou áudio. O site inteiro
  pesa cerca de 185 kB com gzip. As únicas imagens do projeto são os ícones e
  a de compartilhamento, que só redes sociais baixam.

## Rodando

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/
npm run preview    # serve dist/ em http://localhost:4173
```

O formulário de contato usa o Web3Forms se houver uma chave em `.env.local`
(veja `.env.example`). Sem a chave, ele abre o cliente de e-mail de quem visita.

## Publicando

O build é estático e não há roteamento no cliente, então qualquer host de
arquivos serve. Antes de publicar em domínio próprio, trocar a URL em
`<link rel="canonical">` e nas tags `og:url`, `og:image` e `twitter:image` do
`index.html` (a imagem de compartilhamento precisa de endereço absoluto).

Sem WebGL, a galeria abre como lista: o catálogo vira a página e as placas
continuam funcionando.

## Stack

TypeScript · Vite · three.js · Web Audio · CSS puro

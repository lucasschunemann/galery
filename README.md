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

Além das salas, há três lugares redondos sem obra, feitos para parar:

- **A colina**, depois do Sobre: grama de papel de parede, uma estrela cromada
  e uma colher que acompanha você com os olhos.
- **A lagoa**, depois do Sendeski: uma piscina com carpas de cromo,
  vitórias-régias e uma gota de vidro, e um urso de fone e óculos escuros
  debaixo de um guarda-sol. A placa dela explica o som e liga a música.
- **O mirante**, depois do TravelDone: guarda-corpo cromado, um banco, uma
  luneta e um anjo de menu de DVD com auréola de disco. De noite, os fachos de
  luz dele acendem.

Mais três lugares redondos, cada um com uma coisa para fazer:

- **O fliperama**, depois do Acronos: três gabinetes com telinhas em pixel, uma
  ficha gigante e um jogo de verdade, a Chuva de estrelas (com recorde salvo
  no navegador).
- **A estante**, depois do Contato: prateleiras de livros, um livro aberto que
  folheia sozinho e os quatro artigos do site antigo, que abrem pela placa.
- **O jardim**, depois da PF Advogados: areia rastelada, um bonsai de
  cerejeira e uma respiração guiada de meio minuto.

## O caso completo

A placa lateral é o resumo. O botão "Abrir o caso completo" leva a obra para
a tela inteira: as imagens dentro de um monitor que liga como tubo de TV, com
lupa que segue o cursor, legenda de cada imagem, os blocos do processo e a
ficha técnica. As setas trocam de imagem (e o som é de trocar de canal).

As imagens vieram do portfólio antigo, no Framer, e moram em `public/work/`.
Só são baixadas quando alguém abre o caso, então não pesam na entrada.

## Os tubos

Como no Snaptic: tubos de vidro atravessam o céu e ligam as ilhas mais
distantes. São seis linhas, cada uma com a sua cor e uma luz tracejada correndo
por dentro:

| Linha | Liga |
|---|---|
| rosa | átrio e a colina |
| dourada | átrio e o fliperama |
| verde | átrio e o jardim |
| azul-claro | fliperama e a lagoa |
| lilás | jardim e o mirante |
| azul | estante e a colina |

Cada ponta tem uma boca no chão, com um redemoinho de luz e um funil de vidro.
A bolinha que encosta na boca (rolando com `Shift`) é sugada e corre pelo tubo,
acelerando na saída e freando na chegada, até saltar do outro lado. Como boneco,
dá para apertar `E` perto da boca, ou clicar no tubo ou na etiqueta dela: ele
vira bolinha e entra sozinho. Uma viagem leva de 2 a 3 segundos; a pé, o mesmo
trajeto leva de 10 a 15. No minimapa os tubos aparecem tracejados.

Rotas automáticas (catálogo, minimapa) não caem num tubo sem querer: só entra
quem rola por conta própria ou pediu para entrar.

## Brincadeiras

- **Plataformas de salto**, no átrio e no fliperama: jogam o boneco lá no alto,
  com mortal.
- **Bolhas** baixas espalhadas pelas ilhas, que estouram quando você encosta e
  voltam depois.
- **Oito estrelas escondidas.** Duas só se alcançam pelas plataformas. Achar
  todas deixa o boneco de ouro, e a galeria lembra disso na próxima visita.

## Quem mora aqui

Chegando perto, os NPCs falam num balão, letra por letra, cada um com a sua voz
(bipes numa altura de nota própria). Cada visita mostra a próxima fala.

| Quem | Onde |
|---|---|
| Visitante de cromo rosa | sentado na beirada da ponte entre o átrio e a sala 01 |
| Fotógrafa de cromo verde | fotografando o cubo do Acronos |
| Visitante de cromo lilás | no banco do mirante |
| Urso | na lagoa, dançando o que toca no fone dele |
| Anjo | flutuando no mirante |
| Colher | atrás da colina |
| Clipe | na estante, um clipe de papel que oferece ajuda com os artigos |
| Visitante de cromo dourado | meditando, flutuando no jardim |
| Jogador de cromo azul | no fliperama, jogando |
| Robô-guia | no átrio, com o convite para o tour |

Alguns NPCs fazem um convite no balão (o tour, jogar, ver os artigos,
respirar junto). Dá para aceitar clicando ou com `E`.

Uma bolinha de gude também fica dando oitos no canto do átrio.

## O boneco

A animação é por poses que se misturam, com uma mola em cada junta
(`src/world/figure.ts`). Andando, ele balança o quadril, inclina nas curvas e a
cabeça quica no passo. No ar, encolhe subindo e abre os braços caindo; o
segundo pulo vira mortal; na volta ao chão, dobra os joelhos. Parado, respira e
troca o peso de perna, e depois de uns segundos começa a fazer coisas: olhar em
volta, se espreguiçar, bater o pé, olhar o relógio, acenar para a câmera. Perto
de uma obra, põe as mãos para trás. Com o som ligado, dança no tempo da música.
Esquecido por muito tempo, senta no chão de pernas cruzadas. Quando alguém fala
com ele, vira a cabeça para quem fala. Parado de frente para a beirada, abre os
braços e se equilibra. Meditando no jardim, flutua.

## Controles

| | |
|---|---|
| `WASD` ou setas | andar |
| clique no chão | ir até lá |
| clique na escultura | ir até ela e abrir a placa |
| `Shift` | virar bolinha de gude e rolar (mais rápido) |
| `Espaço` | pular; no ar, de novo, dá um mortal |
| `1` `2` `3` `4` | gestos: acenar, dançar, sentar, se espreguiçar |
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

A interface sai de poucas peças, todas em `src/style.css`. A principal é a
cápsula: aro de cromo com o mesmo degradê do logotipo (a faixa escura do
horizonte), miolo de gelatina colorida iluminado por baixo, uma tampa de
brilho, um reflexo que segue o cursor e um risco de luz que atravessa no
hover. Ela se inclina um pouco na direção do mouse e afunda quando apertada.
Redonda, vira bolinha de gude. Em volta: vidro fosco com aro metálico, contas
de gelatina para números, teclas de plástico translúcido como as do iMac, e
bandejas de abas onde uma gota desliza até a aba sob o cursor. Três alturas (32, 40 e
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
| Boneco | `src/world/player.ts`, `src/world/figure.ts` | o corpo, as poses, o andar, o pulo, a bolinha, a colisão |
| NPCs | `src/world/npcs.ts` | os outros visitantes, o urso, as falas |
| Ambiente | `src/world/ambient.ts` | nuvens, cubos soltos, bolhas e brilhos |
| Tubos | `src/world/tubes.ts` | a rede de tubos, as bocas e as curvas no céu |
| Brincadeiras | `src/world/play.ts` | plataformas de salto, bolhas de estourar, estrelas escondidas |
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

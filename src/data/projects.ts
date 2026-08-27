import type { ArtVariant } from "../components/Cover";

export interface Project {
  id: string;
  title: string;
  year: string;
  kind: string;
  tagline: string;
  body: string[];
  role: string;
  stack: string[];
  art: ArtVariant;
  /** how loudly the cover speaks: 0 quiet, 1 normal, 2 accent-dominant */
  accent: 0 | 1 | 2;
  metrics: { label: string; value: string }[];
  link?: string;
}

export const PROJECTS: Project[] = [
  {
    id: "dying-star",
    title: "Blame It On A Dying Star",
    year: "2025",
    kind: "Art Direction / Web",
    tagline: "Um álbum visual onde o código é a capa.",
    body: [
      "Identidade e site para um EP conceitual. A capa é gerada em tempo real: o mesmo shader que desenha a estrela cromada na home também exporta os PNGs usados no streaming.",
      "A tipografia técnica sobreposta não é decorativa — é o próprio source do gerador, renderizado como textura. Design e implementação são o mesmo artefato.",
    ],
    role: "Direção de arte, design de sistema, front-end",
    stack: ["WebGL", "GLSL", "React", "Motion"],
    art: "arcs",
    accent: 1,
    metrics: [
      { label: "Tempo médio na página", value: "4m 12s" },
      { label: "Capas geradas", value: "18.4k" },
      { label: "Peso da home", value: "212 kb" },
    ],
  },
  {
    id: "bliss-2001",
    title: "Bliss 2001",
    year: "2024",
    kind: "Experiência / WebGL",
    tagline: "A colina mais famosa do mundo, reconstruída em tempo real.",
    body: [
      "Um ensaio interativo sobre nostalgia de interface. O usuário caminha por uma reconstrução procedural da paisagem que uma geração inteira olhou por horas sem nunca ter visitado.",
      "Todo o terreno é ruído fractal avaliado na GPU. Nenhuma textura, nenhum modelo: 340 linhas de shader e uma curva de cor.",
    ],
    role: "Conceito, shaders, direção",
    stack: ["Three.js", "GLSL", "TypeScript"],
    art: "mesh",
    accent: 0,
    metrics: [
      { label: "Frames por segundo", value: "60" },
      { label: "Assets de textura", value: "0" },
      { label: "Prêmios", value: "SOTD ×2" },
    ],
  },
  {
    id: "sys-warning",
    title: "System Warning",
    year: "2024",
    kind: "Design System",
    tagline: "Um design system que assume que o usuário vai errar.",
    body: [
      "Biblioteca de componentes para uma fintech, construída em torno de estados de erro em vez de estados felizes. Cada componente foi projetado a partir do pior cenário possível.",
      "O resultado: 63% menos tickets de suporte relacionados a formulários no primeiro trimestre após o rollout.",
    ],
    role: "Lead de design system, documentação",
    stack: ["React", "Radix", "Style Dictionary", "Figma"],
    art: "modular",
    accent: 2,
    metrics: [
      { label: "Componentes", value: "84" },
      { label: "Redução de tickets", value: "−63%" },
      { label: "Times adotando", value: "11" },
    ],
  },
  {
    id: "touch-grass",
    title: "Touch Grass",
    year: "2025",
    kind: "Campanha / Editorial",
    tagline: "Uma campanha que pede pra você fechar o navegador.",
    body: [
      "Peça editorial e microsite para uma ONG de saúde mental digital. O site mede quanto tempo você passa nele — e, aos oito minutos, começa a se desligar sozinho, camada por camada.",
      "A última tela é preta com uma única linha de texto. Nenhum call-to-action, nenhum formulário.",
    ],
    role: "Direção de arte, tipografia, front-end",
    stack: ["Astro", "CSS Houdini", "Variable Fonts"],
    art: "numeral",
    accent: 0,
    metrics: [
      { label: "Sessões", value: "1.2M" },
      { label: "Duração média", value: "7m 51s" },
      { label: "Compartilhamentos", value: "94k" },
    ],
  },
  {
    id: "aquatint",
    title: "Aquatint",
    year: "2023",
    kind: "Produto / Ferramenta",
    tagline: "Gerador de paletas que entende brilho especular.",
    body: [
      "Ferramenta para designers que trabalham com superfícies: vidro, gel, cromo. Em vez de gerar cores planas, o Aquatint gera rampas completas de material — cor base, highlight, sombra de contato e refração de borda.",
      "Exporta direto para tokens CSS, Figma Variables e Swift.",
    ],
    role: "Produto, design, engenharia",
    stack: ["Svelte", "OKLCH", "WASM"],
    art: "orbit",
    accent: 1,
    metrics: [
      { label: "Usuários ativos", value: "27k" },
      { label: "Paletas exportadas", value: "310k" },
      { label: "Preço", value: "Grátis" },
    ],
  },
  {
    id: "meridian",
    title: "Meridian OS",
    year: "2023",
    kind: "Interface / Dashboard",
    tagline: "Um painel de operações que cabe numa olhada.",
    body: [
      "Redesenho completo do centro de controle de uma operação logística. O desafio não era mostrar mais dados — era mostrar drasticamente menos, e ainda assim mais rápido.",
      "Removemos 71% dos elementos da tela original. O tempo médio até a decisão caiu de 40 para 9 segundos.",
    ],
    role: "UX lead, pesquisa, protótipo",
    stack: ["React", "D3", "WebSocket"],
    art: "wedge",
    accent: 1,
    metrics: [
      { label: "Tempo até decisão", value: "−78%" },
      { label: "Elementos removidos", value: "71%" },
      { label: "Operadores", value: "1.4k" },
    ],
  },
  {
    id: "euphoria",
    title: "Euphoria 2021",
    year: "2021",
    kind: "Identidade / Motion",
    tagline: "Identidade viva para um festival que nunca fica parado.",
    body: [
      "Sistema de identidade generativo: cada peça é uma composição única montada por um motor de layout que respeita a mesma grade e o mesmo vocabulário de formas.",
      "Foram 2.400 peças únicas produzidas em três semanas por uma equipe de duas pessoas.",
    ],
    role: "Sistema generativo, direção de motion",
    stack: ["Cavalry", "p5.js", "Node"],
    art: "split",
    accent: 2,
    metrics: [
      { label: "Peças geradas", value: "2.4k" },
      { label: "Equipe", value: "2 pessoas" },
      { label: "Prazo", value: "3 semanas" },
    ],
  },
  {
    id: "gelcast",
    title: "Gelcast",
    year: "2022",
    kind: "App / Áudio",
    tagline: "Player de podcast com física de superfície.",
    body: [
      "Um app de áudio onde cada controle tem peso, brilho e resposta tátil. Os botões afundam, o scrubber tem inércia, e o waveform reage à luz ambiente do dispositivo.",
      "Um exercício deliberado em skeuomorfismo moderno: profundidade a serviço da affordance, não da decoração.",
    ],
    role: "Design de interação, prototipagem",
    stack: ["SwiftUI", "Metal", "Core Haptics"],
    art: "bars",
    accent: 1,
    metrics: [
      { label: "Rating", value: "4.8 ★" },
      { label: "Retenção D30", value: "41%" },
      { label: "Frame budget", value: "8ms" },
    ],
  },
];

export const byId = (id: string) => PROJECTS.find((p) => p.id === id);
export type { ArtVariant };

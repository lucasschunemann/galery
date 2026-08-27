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
    tagline: "Identidade e site para um EP conceitual.",
    body: [
      "A capa do disco é gerada em tempo real. O mesmo shader que desenha a estrela na home exporta os PNGs entregues às plataformas de streaming.",
      "A tipografia sobreposta é o código-fonte do gerador, renderizado como textura.",
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
    tagline: "Um ensaio interativo sobre nostalgia de interface.",
    body: [
      "O usuário caminha por uma reconstrução da paisagem que uma geração inteira olhou por horas sem nunca ter visitado.",
      "O terreno é ruído fractal avaliado na GPU: 340 linhas de shader e uma curva de cor, sem nenhuma textura ou modelo carregado.",
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
    tagline: "Biblioteca de componentes construída a partir dos estados de erro.",
    body: [
      "Cada componente foi desenhado começando pelo pior cenário: campo inválido, conexão caída, sessão expirada. O estado bem-sucedido veio depois.",
      "No primeiro trimestre após o rollout, os tickets de suporte sobre formulários caíram 63%.",
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
    tagline: "Peça editorial e microsite para uma ONG de saúde mental digital.",
    body: [
      "O site mede quanto tempo você passa nele. Aos oito minutos começa a se desligar sozinho, camada por camada.",
      "A última tela é preta, com uma linha de texto e nenhum botão.",
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
    tagline: "Gerador de paletas para quem trabalha com superfície.",
    body: [
      "Em vez de cores planas, o Aquatint gera rampas de material completas: cor base, realce, sombra de contato e refração de borda.",
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
    tagline: "Redesenho do centro de controle de uma operação logística.",
    body: [
      "A tela original mostrava tudo ao mesmo tempo. Passamos três semanas acompanhando os operadores para descobrir o que eles de fato olhavam, e removemos 71% dos elementos.",
      "O tempo médio até a decisão caiu de 40 para 9 segundos.",
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
    tagline: "Sistema de identidade generativo para um festival.",
    body: [
      "Cada peça é montada por um motor de layout que respeita a mesma grade e o mesmo vocabulário de formas.",
      "Foram 2.400 peças únicas em três semanas, com uma equipe de duas pessoas.",
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
    tagline: "Player de podcast com resposta tátil.",
    body: [
      "Os botões afundam, o scrubber tem inércia e o waveform reage à luz ambiente do aparelho.",
      "Cada controle tem peso e resposta próprios, para que dê para operar o app no bolso, sem olhar.",
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

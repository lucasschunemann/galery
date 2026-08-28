import type { ArtVariant } from "../components/Cover";

export interface Project {
  id: string;
  title: string;
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

/* ============================================================
   Trabalho real, feito como Lucas von e pela quieto®.

   Cinco projetos, cinco clientes reais. Sem métricas inventadas:
   o que aparece em cada card lateral é o que existe de fato —
   cliente, indústria, ano. Quando um projeto tem link público,
   ele está em `link`.
   ============================================================ */

export const PROJECTS: Project[] = [
  {
    id: "acronos",
    title: "Acronos",
    kind: "Interface",
    tagline: "Sistema de design para consistência entre os produtos digitais da Área Central.",
    body: [
      "O Acronos foi criado para dar consistência, escalabilidade e eficiência aos produtos digitais da Área Central. Antes dele, cada time construía seus próprios componentes, e as pequenas diferenças entre eles se acumulavam até virar atrito.",
      "O sistema entrega componentes reutilizáveis e diretrizes de acessibilidade. O ganho não é só visual: times passam menos tempo redecidindo decisões já tomadas, e a colaboração entre design e desenvolvimento fica mais direta.",
    ],
    role: "Design de sistema",
    stack: ["Figma", "Design tokens"],
    art: "modular",
    accent: 2,
    metrics: [
      { label: "Cliente", value: "Área Central" },
      { label: "Indústria", value: "Software" },
      { label: "Ano", value: "2025" },
    ],
  },
  {
    id: "sendeski",
    title: "Sendeski Café",
    kind: "Produto",
    tagline: "Site para uma marca de café gourmet brasileira, construído em torno do produto.",
    body: [
      "O Sendeski Café precisava de um site moderno e funcional para uma marca de café gourmet. O processo começou com análise competitiva no segmento e identificação de um público que valoriza experiências autênticas, não só o produto em si.",
      "A estrutura final prioriza os produtos premium na hierarquia visual, com um layout responsivo pensado para navegação simples entre loja, produtos e informações institucionais.",
    ],
    role: "Web design",
    stack: ["Framer"],
    art: "orbit",
    accent: 1,
    metrics: [
      { label: "Cliente", value: "Sendeski Café" },
      { label: "Indústria", value: "Café gourmet" },
      { label: "Ano", value: "2025" },
    ],
  },
  {
    id: "wf-odontologia",
    title: "WF Odontologia",
    kind: "Web",
    tagline: "Landing page minimalista para uma clínica odontológica.",
    body: [
      "A WF Odontologia precisava de uma presença digital que comunicasse confiabilidade e expertise sem depender de excesso de informação na tela. A resposta foi um site limpo, com navegação intuitiva e conteúdo objetivo.",
      "O foco ficou na experiência de quem chega buscando um profissional: encontrar o que precisa rápido, sem ruído visual no caminho.",
    ],
    role: "Web design",
    stack: ["Framer"],
    art: "bars",
    accent: 0,
    metrics: [
      { label: "Cliente", value: "WF Odontologia" },
      { label: "Indústria", value: "Odontologia" },
      { label: "Ano", value: "2025" },
    ],
    link: "https://wfodontologia.framer.website",
  },
  {
    id: "traveldone",
    title: "TravelDone",
    kind: "Web",
    tagline: "Landing page para o infoproduto TravelDone, da MetaCumprida.",
    body: [
      "O TravelDone é um infoproduto sobre viajar com liberdade e praticidade. A landing page precisava traduzir essa promessa em algo visual e persuasivo sem soar como propaganda genérica de curso online.",
      "O resultado combina clareza, uma comunicação direta e uma estética leve — pensada para transmitir confiança antes mesmo de o visitante ler o primeiro parágrafo.",
    ],
    role: "Web design",
    stack: ["Framer"],
    art: "wedge",
    accent: 1,
    metrics: [
      { label: "Cliente", value: "MetaCumprida" },
      { label: "Indústria", value: "Infoproduto" },
      { label: "Ano", value: "2025" },
    ],
  },
  {
    id: "pf-advogados",
    title: "PF Advogados",
    kind: "Web",
    tagline: "Site institucional para um escritório de advocacia.",
    body: [
      "Um escritório de advocacia vive de credibilidade, então o site da PF Advogados foi construído em torno disso: tons sóbrios, tipografia refinada e uma navegação direta até áreas de atuação e equipe.",
      "Nada aqui tenta chamar atenção por conta própria — a seriedade da marca é o que precisa aparecer primeiro.",
    ],
    role: "Web design",
    stack: ["Framer"],
    art: "split",
    accent: 0,
    metrics: [
      { label: "Cliente", value: "PF Advogados" },
      { label: "Indústria", value: "Advocacia" },
      { label: "Ano", value: "2024" },
    ],
    link: "https://passigfirmino.adv.br",
  },
];

export const byId = (id: string) => PROJECTS.find((p) => p.id === id);
export type { ArtVariant };

export interface Shot {
  src: string;
  caption: string;
}

export interface Section {
  title: string;
  items: string[];
}

export interface Project {
  id: string;
  title: string;
  kind: string;
  year: string;
  /** o mês, quando existe, para a ficha do caso completo */
  date: string;
  service: string;
  client: string;
  industry: string;
  tagline: string;
  body: string[];
  role: string;
  stack: string[];
  /** cor da instalação na galeria: tinge a escultura, o letreiro e o painel */
  color: string;
  link?: string;
  /**
   * Imagens do caso, em ordem, com legenda. Os arquivos ficam em
   * `public/work/<id>/`. A placa mostra a primeira como capa; o caso
   * completo mostra todas, em tamanho grande.
   */
  images?: Shot[];
  /** blocos do caso completo: pilares, etapas, entregas */
  sections?: Section[];
}

/* ============================================================
   Trabalho real, feito como Lucas von e pela quieto®.

   Seis projetos, seis clientes reais. Sem métricas inventadas:
   o que aparece em cada painel é o que existe de fato: cliente,
   indústria, ano. Quando um projeto tem link público, ele está
   em `link`. Acompanha não tem: é produto de cliente, ainda em
   desenvolvimento, sem versão pública para apontar.

   A ordem daqui é a ordem do percurso na galeria.
   ============================================================ */

export const PROJECTS: Project[] = [
  {
    id: "acompanha",
    title: "Acompanha",
    kind: "Produto",
    year: "2025–2026",
    date: "2025 a 2026",
    service: "Design de produto",
    client: "Acompanha",
    industry: "Materiais de construção",
    tagline: "SaaS que mostra pra lojas de material de construção se elas estão comprando bem.",
    body: [
      "O produto acompanha preço e demanda do mercado regional e compara com o que a loja está de fato pagando, pra mostrar se a compra dela está boa ou não. Entrei nele para desenhar as telas e os fluxos que hoje seguem para desenvolvimento. A tela de produto, por exemplo, passou por várias versões inteiras até fechar num layout de coluna única com indicadores de confiança nos dados, num vocabulário visual próximo do Linear.",
      "Um dos módulos que desenhei transforma a Reforma Tributária brasileira em oportunidade de produto: um motor de créditos que simula a transição de PIS/COFINS/ICMS/ISS para CBS/IBS, com um simulador editável na própria tela em vez de um cenário fixo. Também fiz o módulo de Educação do produto.",
    ],
    role: "Design de produto",
    stack: ["Figma"],
    color: "#ff6a2b",
    sections: [
      {
        title: "O que eu desenhei",
        items: [
          "Telas e fluxos principais, hoje em desenvolvimento",
          "A tela de produto, refeita várias vezes até chegar numa coluna única com indicadores de confiança nos dados",
          "O motor de créditos da Reforma Tributária, com um simulador editável na própria tela",
          "O módulo de Educação",
        ],
      },
    ],
  },
  {
    id: "acronos",
    title: "Acronos",
    kind: "Interface",
    year: "2025",
    date: "Fevereiro de 2025",
    service: "Design system",
    client: "Área Central",
    industry: "Software",
    tagline: "Sistema de design para consistência entre os produtos digitais da Área Central.",
    body: [
      "O Acronos foi criado para dar consistência, escalabilidade e eficiência aos produtos digitais da Área Central. Antes dele, cada time construía seus próprios componentes, e as pequenas diferenças entre eles se acumulavam até virar atrito.",
      "O sistema entrega componentes reutilizáveis e diretrizes de acessibilidade. Com ele, os times passam menos tempo redecidindo decisões já tomadas, e a colaboração entre design e desenvolvimento fica mais direta.",
    ],
    role: "Design de sistema",
    stack: ["Figma", "Design tokens"],
    color: "#3d5bff",
    link: "https://acronosds.framer.website",
    images: [
      { src: "/work/acronos/01.jpg", caption: "A documentação do Acronos DS: navegação lateral com styleguides e componentes, e atalhos para os mais usados." },
      { src: "/work/acronos/02.jpg", caption: "A página Sobre explica por que o sistema existe e o que ele resolve para os times." },
    ],
    sections: [
      {
        title: "Os quatro pilares",
        items: [
          "Consistência: uma identidade visual só, entre todos os produtos",
          "Velocidade: componentes reutilizáveis e documentados aceleram o desenvolvimento",
          "Acessibilidade: interfaces inclusivas, alinhadas aos padrões",
          "Escalabilidade: o sistema cresce junto com as plataformas",
        ],
      },
      {
        title: "O que tem dentro",
        items: [
          "Styleguides de cor, tipografia, espaçamento e efeitos",
          "Componentes de navegação, formulário, avatar, avisos, botões e categorias",
          "Foco em produtos SaaS, pensado mobile-first",
          "Changelog e acesso direto ao arquivo no Figma",
        ],
      },
    ],
  },
  {
    id: "sendeski",
    title: "Sendeski Café",
    kind: "Produto",
    year: "2025",
    date: "Junho de 2025",
    service: "Protótipo",
    client: "Sendeski Café",
    industry: "Café gourmet",
    tagline: "Site para uma marca de café gourmet brasileira, construído em torno do produto.",
    body: [
      "O Sendeski Café precisava de um site moderno e funcional para uma marca de café gourmet. O processo começou com análise competitiva no segmento e identificação de um público que valoriza experiências autênticas além do próprio produto.",
      "A estrutura final prioriza os produtos premium na hierarquia visual, com um layout responsivo pensado para navegação simples entre loja, produtos e informações institucionais.",
    ],
    role: "Web design",
    stack: ["Framer"],
    color: "#c07a3e",
    images: [
      { src: "/work/sendeski/01.jpg", caption: "A home abre com o ritual do café: foto de produto em tela cheia e tipografia serifada." },
      { src: "/work/sendeski/02.jpg", caption: "A página de produto, com variações de tamanho, preço e selos de qualidade logo abaixo da compra." },
    ],
    sections: [
      {
        title: "Pesquisa e descoberta",
        items: [
          "Análise de concorrentes locais e internacionais de café gourmet",
          "Tendências de design minimalista e storytelling visual para produtos premium",
          "Persona: quem toma café gourmet e procura experiências autênticas e exclusivas",
        ],
      },
      {
        title: "Wireframes e arquitetura",
        items: [
          "Hierarquia clara, com produtos premium e promoções em destaque",
          "Layout responsivo, pensado para desktop e mobile",
          "Navegação simples entre produtos, loja online e a marca",
        ],
      },
    ],
  },
  {
    id: "wf-odontologia",
    title: "WF Odontologia",
    kind: "Web",
    year: "2025",
    date: "Março de 2025",
    service: "Website",
    client: "WF Odontologia",
    industry: "Odontologia",
    tagline: "Landing page minimalista para uma clínica odontológica.",
    body: [
      "A WF Odontologia precisava de uma presença digital que comunicasse confiabilidade e expertise sem depender de excesso de informação na tela. A resposta foi um site limpo, com navegação intuitiva e conteúdo objetivo.",
      "O foco ficou na experiência de quem chega buscando um profissional: encontrar o que precisa rápido, sem ruído visual no caminho.",
    ],
    role: "Web design",
    stack: ["Framer"],
    color: "#14c3a5",
    link: "https://wfodontologia.framer.website",
    images: [
      { src: "/work/wf-odontologia/01.jpg", caption: "A home: chamada curta, foto da equipe e um único botão de contato." },
      { src: "/work/wf-odontologia/02.jpg", caption: "Quem atende e o que a clínica faz, com as especialidades em etiquetas." },
    ],
  },
  {
    id: "traveldone",
    title: "TravelDone",
    kind: "Web",
    year: "2025",
    date: "Março de 2025",
    service: "Landing page",
    client: "MetaCumprida",
    industry: "Infoproduto",
    tagline: "Landing page para o infoproduto TravelDone, da MetaCumprida.",
    body: [
      "O TravelDone é um infoproduto sobre viajar com liberdade e praticidade. A landing page precisava traduzir essa promessa em algo visual e persuasivo sem soar como propaganda genérica de curso online.",
      "O resultado combina clareza, comunicação direta e uma estética leve, pensada para transmitir confiança antes mesmo de o visitante ler o primeiro parágrafo.",
    ],
    role: "Web design",
    stack: ["Framer"],
    color: "#ff4fa3",
    link: "https://traveldone.framer.website",
    images: [
      { src: "/work/traveldone/01.jpg", caption: "O topo da landing page: a promessa, uma foto de família viajando e a chamada para começar." },
      { src: "/work/traveldone/02.jpg", caption: "Quem está por trás do curso, com selos de prova: mais de 15 países e 15 anos viajando." },
    ],
  },
  {
    id: "pf-advogados",
    title: "PF Advogados",
    kind: "Web",
    year: "2024",
    date: "Janeiro de 2024",
    service: "Website",
    client: "PF Advogados",
    industry: "Advocacia",
    tagline: "Site institucional para um escritório de advocacia.",
    body: [
      "Um escritório de advocacia vive de credibilidade, então o site da PF Advogados foi construído em torno disso: tons sóbrios, tipografia refinada e uma navegação direta até áreas de atuação e equipe.",
      "A seriedade da marca precisa aparecer antes de qualquer coisa, sem elementos brigando por atenção.",
    ],
    role: "Web design",
    stack: ["Framer"],
    color: "#7b5cff",
    link: "https://passigfirmino.adv.br",
    images: [
      { src: "/work/pf-advogados/01.jpg", caption: "A home vai direto à dor de quem chega: a suspensão da CNH, com contato por WhatsApp sempre à mão." },
      { src: "/work/pf-advogados/02.jpg", caption: "Quem somos: a equipe, a especialidade em direito de trânsito e os valores do escritório." },
    ],
  },
];

export const byId = (id: string) => PROJECTS.find((p) => p.id === id);

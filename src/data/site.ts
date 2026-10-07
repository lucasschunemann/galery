export const PERSON = {
  name: "Lucas Schünemann",
  role: "Product designer",
  city: "Blumenau, SC",
  email: "lucas.vhschunemann@gmail.com",
  linkedin: "https://www.linkedin.com/in/lucas-von-helden/",
  instagram: "https://www.instagram.com/lucasvonhelden/",
};

/** os artigos que moram no site antigo, no Framer; a estante aponta para eles */
export const ARTICLES = [
  {
    title: "Do código ao design: minha jornada do frontend para o UX",
    tag: "Tech e design",
    date: "31 dez 2024",
    href: "https://lucasvon.framer.website/stories/ux-frontend",
    color: "#3d5bff",
  },
  {
    title: "Feng Shui no UX design",
    tag: "UX design",
    date: "12 fev 2025",
    href: "https://lucasvon.framer.website/stories/fengshui",
    color: "#14c3a5",
  },
  {
    title: "A arte da simplicidade: filosofia budista e UX design",
    tag: "Vida e design",
    date: "27 fev 2025",
    href: "https://lucasvon.framer.website/stories/ux-buda",
    color: "#ff9a2b",
  },
  {
    title: "Rituais de foco: pequenos hábitos no processo criativo",
    tag: "Disciplina",
    date: "12 mar 2025",
    href: "https://lucasvon.framer.website/stories/rituals",
    color: "#ff4fa3",
  },
];

export const ABOUT = {
  bio: [
    "Sou product designer com foco em UX/UI, co-fundador e CPO da neth!, uma startup de saúde e bem-estar digital.",
    "No meu trabalho principal sou UX/UI designer na Área Central. Liderei a criação de um design system multiplataforma que unificou padrões visuais e de interação entre vários produtos, encurtando o caminho do design até o desenvolvimento. Também reestruturei o fluxo de visualização de documentos de uma plataforma complexa, reduzindo atrito nas telas principais e aumentando a conclusão das tarefas.",
    "Na neth! cuido da direção de produto, da prototipação em Figma, do roadmap e da gestão do time de desenvolvimento.",
    "Em paralelo pego projetos freelance B2B e B2C, na maioria plataformas de inteligência de dados e sites. Vou do discovery e do mapeamento de jornada até a interface em alta fidelidade, pronta para desenvolvimento.",
  ],
  doing: [
    "Pesquisa de UX e validação de hipóteses",
    "Arquitetura de informação e estruturação de fluxos",
    "Prototipação em média e alta fidelidade no Figma",
    "Design systems e consistência entre produtos",
    "Sites em Framer com código customizado",
    "Handoff e colaboração próxima com desenvolvedores",
  ],
  specs: [
    ["Função", "Product designer, foco em UX/UI"],
    ["Hoje", "CPO e co-fundador na neth!"],
    ["Também", "UX/UI designer na Área Central"],
    ["Experiência", "4+ anos, 15+ projetos entregues"],
    ["Formação", "Interaction Design Foundation"],
    ["Local", "Blumenau, Santa Catarina (GMT-3)"],
    ["Situação", "Aberto a projetos freelance"],
  ] as [string, string][],
};

import { PROJECTS, type Project } from "../data/projects";
import { ABOUT, ARTICLES, PERSON } from "../data/site";
import { signURL } from "../world/sign";
import type { Zone } from "../world/layout";
import { h, icons, svg } from "./dom";

/* ============================================================
   O que aparece dentro da placa: a de cada obra, e as das salas
   que não são obra (Sobre, Contato, átrio e colina). Toda placa
   abre com o letreiro da própria sala, o mesmo pixel do mundo.
   ============================================================ */

export interface Nav {
  go: (id: string) => void;
  /** abre o caso completo, na imagem i */
  study: (p: Project, i?: number) => void;
  catalog: () => void;
  sound: () => boolean;
  toggleSound: () => void;
  night: () => boolean;
  toggleNight: () => void;
  play: () => void;
  record: () => number;
  breathe: () => void;
}

export interface Sounds {
  sent: () => void;
  error: () => void;
}

export interface View {
  /** o que vai na barra de cima da placa */
  kicker: string;
  meta: string;
  body: HTMLElement;
}

const pad = (n: number) => String(n + 1).padStart(2, "0");

const screen = (zn: Zone, alt: string) =>
  h("figure", { class: "screen" }, h("img", { src: signURL(zn), alt, width: 200, height: 124 }));

const specs = (rows: [string, string][]) =>
  h("dl", { class: "specs" }, ...rows.flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)]));

const title = (t: string) => h("h2", { class: "t-h1", id: "panel-title" }, t);
const lede = (t: string) => h("p", { class: "t-lede p-lede" }, t);
const body = (ps: string[]) => h("div", { class: "p-body" }, ...ps.map((t) => h("p", {}, t)));

function navButton(p: Project, dir: "prev" | "next", nav: Nav) {
  const i = PROJECTS.indexOf(p);
  const bead = h("span", { class: "bead" }, pad(i));
  bead.style.setProperty("--b", p.color);
  const b = h("button", { type: "button", onclick: () => nav.go(p.id) },
    h("span", { class: "row1" },
      dir === "prev" ? h("span", { class: "label" }, "Anterior") : null,
      bead,
      dir === "next" ? h("span", { class: "label" }, "Próxima") : null,
    ),
    h("b", {}, p.title),
  );
  b.style.setProperty("--b", p.color);
  return b;
}

export function projectView(zn: Zone, p: Project, nav: Nav): View {
  const i = PROJECTS.indexOf(p);
  const prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(i + 1) % PROJECTS.length];

  const shots = p.images ?? [];
  return {
    kicker: p.kind,
    meta: p.year,
    body: h("article", { class: "p" },
      screen(zn, `Letreiro da sala ${pad(i)}, ${p.title}`),
      title(p.title),
      lede(p.tagline),
      h("div", { class: "p-actions" },
        h("button", { class: "gel gel--accent", type: "button", onclick: () => nav.study(p, 0) }, svg(icons.expand), h("span", {}, "Abrir o caso completo")),
        p.link ? h("a", { class: "gel gel--silver", href: p.link, target: "_blank", rel: "noopener" }, h("span", {}, "Ver o site"), svg(icons.out)) : null,
      ),
      shots.length
        ? h("div", { class: "p-shots" },
            ...shots.map((s, k) =>
              h("button", { class: "shot", type: "button", "aria-label": `Ver a imagem ${k + 1}: ${s.caption}`, onclick: () => nav.study(p, k) },
                h("img", { src: s.src, alt: "", loading: "lazy" }),
                h("span", { class: "shot__n bead" }, String(k + 1)),
              ),
            ),
          )
        : null,
      body(p.body),
      specs([
        ["Cliente", p.client],
        ["Serviço", p.service],
        ["Indústria", p.industry],
        ["Quando", p.date],
        ["Papel", p.role],
        ["Ferramentas", p.stack.join(", ")],
      ]),
      h("nav", { class: "p-nav", "aria-label": "Outras obras" }, navButton(prev, "prev", nav), navButton(next, "next", nav)),
    ),
  };
}

export function aboutView(zn: Zone, nav: Nav): View {
  return {
    kicker: "Sobre",
    meta: PERSON.city,
    body: h("article", { class: "p" },
      screen(zn, "Letreiro da sala Sobre"),
      title(PERSON.name),
      lede(`${PERSON.role} em ${PERSON.city}. Hoje cuido de produto na neth! e de interface na Área Central.`),
      body(ABOUT.bio),
      h("p", { class: "label p-h" }, "O trabalho costuma envolver"),
      h("ul", { class: "p-list" }, ...ABOUT.doing.map((d) => h("li", {}, h("span", { class: "dot" }), d))),
      specs(ABOUT.specs),
      h("div", { class: "p-actions" },
        h("button", { class: "gel gel--accent", type: "button", onclick: () => nav.go("contato") }, h("span", {}, "Escrever para mim")),
        h("button", { class: "gel gel--silver", type: "button", onclick: () => nav.catalog() }, h("span", {}, "Ver o catálogo")),
      ),
    ),
  };
}

const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined;

export function contactView(zn: Zone, sound: Sounds): View {
  const msg = h("p", { class: "form__msg", role: "status" });
  const send = h("button", { class: "gel gel--accent", type: "submit" }, h("span", {}, "Enviar"));
  const field = (label: string, control: HTMLElement) => h("label", { class: "field" }, h("span", { class: "label" }, label), control);
  const form = h("form", { class: "form" },
    field("Seu e-mail", h("input", { name: "email", type: "email", required: true, autocomplete: "email", placeholder: "voce@email.com" })),
    field("Assunto", h("input", { name: "subject", required: true, placeholder: "Um projeto, uma vaga, um oi" })),
    field("Mensagem", h("textarea", { name: "message", rows: 5, required: true, placeholder: "Escreva aqui" })),
    h("div", { class: "form__row" }, send, msg),
  ) as HTMLFormElement;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    const subject = String(data.get("subject") ?? "");
    const message = String(data.get("message") ?? "");
    if (!WEB3FORMS_KEY) {
      // sem chave configurada, abre o cliente de e-mail de quem visita
      location.href = `mailto:${PERSON.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${message}\n\n(${email})`)}`;
      msg.textContent = "Abrindo seu e-mail.";
      sound.sent();
      return;
    }
    send.setAttribute("disabled", "");
    msg.textContent = "Enviando…";
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: subject || "Mensagem pela galeria", from_name: email, email, message }),
      });
      const out = await res.json();
      if (!res.ok || !out.success) throw new Error();
      form.reset();
      msg.textContent = "Recebido. Respondo assim que ler.";
      sound.sent();
    } catch {
      msg.textContent = "Não consegui enviar. Escreve direto pro e-mail aí embaixo.";
      sound.error();
    } finally {
      send.removeAttribute("disabled");
    }
  });

  const copy = h("button", { class: "gel gel--silver gel--sm", type: "button" }, h("span", {}, "Copiar"));
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(PERSON.email);
      copy.firstElementChild!.textContent = "Copiado";
      setTimeout(() => (copy.firstElementChild!.textContent = "Copiar"), 1600);
    } catch { /* sem permissão de área de transferência, o link continua ali */ }
  });

  return {
    kicker: "Contato",
    meta: "GMT-3",
    body: h("article", { class: "p" },
      screen(zn, "Letreiro da sala Contato"),
      title("Vamos conversar"),
      lede("Estou aberto a projetos freelance e a conversas sobre produto. Pode escrever por aqui ou direto no e-mail."),
      form,
      h("div", { class: "mail" }, h("a", { href: `mailto:${PERSON.email}` }, PERSON.email), copy),
      h("div", { class: "p-actions" },
        h("a", { class: "gel gel--silver gel--sm", href: PERSON.linkedin, target: "_blank", rel: "noopener" }, h("span", {}, "LinkedIn"), svg(icons.out)),
        h("a", { class: "gel gel--silver gel--sm", href: PERSON.instagram, target: "_blank", rel: "noopener" }, h("span", {}, "Instagram"), svg(icons.out)),
      ),
    ),
  };
}

export function atriumView(zn: Zone, nav: Nav): View {
  return {
    kicker: "Átrio",
    meta: "2026",
    body: h("article", { class: "p" },
      screen(zn, "Letreiro do átrio"),
      title("Bem-vindo à galeria"),
      lede("Seis trabalhos de Lucas Schünemann, cada um numa sala, ligadas por pontes."),
      body([
        "O percurso segue em sentido horário a partir da sala 01. Cada obra tem uma placa: chegue perto e aperte E, ou clique na escultura.",
        "Segurando Shift, você vira uma bolinha e anda mais rápido. Se tiver pressa, o catálogo leva direto a qualquer sala.",
        "O nome VON vem da partícula que liga um nome a um lugar, no alemão e no holandês.",
      ]),
      h("div", { class: "p-actions" },
        h("button", { class: "gel gel--accent", type: "button", onclick: () => nav.go(PROJECTS[0].id) }, h("span", {}, "Começar pela sala 01")),
        h("button", { class: "gel gel--silver", type: "button", onclick: () => nav.catalog() }, h("span", {}, "Catálogo")),
      ),
    ),
  };
}

export function hillView(zn: Zone, nav: Nav): View {
  return {
    kicker: "A colina",
    meta: "Fim",
    body: h("article", { class: "p" },
      screen(zn, "Letreiro da colina"),
      title("Você chegou ao fim"),
      lede("Daqui não tem mais ponte. Obrigado por andar até aqui."),
      body(["A estrela e a colher moram aqui desde o começo. Ninguém sabe direito o que a colher está fazendo, mas ela parece contente com a visita."]),
      h("div", { class: "p-actions" },
        h("button", { class: "gel gel--accent", type: "button", onclick: () => nav.go("contato") }, h("span", {}, "Escrever para o Lucas")),
        h("button", { class: "gel gel--silver", type: "button", onclick: () => nav.go("atrio") }, h("span", {}, "Voltar ao átrio")),
      ),
    ),
  };
}

/** um botão que troca de texto quando o estado muda */
function toggle(label: () => string, act: () => void) {
  const b = h("button", { class: "gel gel--accent", type: "button" }, h("span", {}, label()));
  b.addEventListener("click", () => {
    act();
    b.firstElementChild!.textContent = label();
  });
  return b;
}

export function pondView(zn: Zone, nav: Nav): View {
  return {
    kicker: "A lagoa",
    meta: "Um lugar pra parar",
    body: h("article", { class: "p" },
      screen(zn, "Letreiro da lagoa"),
      title("A lagoa"),
      lede("Um lugar sem obra, com água, carpas de cromo e um urso que não tira o fone."),
      body([
        "Todo o som da galeria é gerado na hora, no seu navegador: os acordes, os sinos, os passos e até a água daqui. Nenhum arquivo de áudio é baixado.",
        "A música muda quando o dia vira noite, e cada sala tem a sua nota. Chegue perto de uma obra para ouvir a dela.",
      ]),
      h("div", { class: "p-actions" },
        toggle(() => (nav.sound() ? "Desligar o som" : "Ligar o som"), nav.toggleSound),
        h("button", { class: "gel gel--silver", type: "button", onclick: () => nav.catalog() }, h("span", {}, "Ver o catálogo")),
      ),
    ),
  };
}

export function lookoutView(zn: Zone, nav: Nav): View {
  return {
    kicker: "O mirante",
    meta: "Um lugar pra olhar",
    body: h("article", { class: "p" },
      screen(zn, "Letreiro do mirante"),
      title("O mirante"),
      lede("A beirada mais alta da galeria, com um banco, uma luneta e um anjo de disco."),
      body([
        "O anjo vem dos menus de DVD, uma das referências mais antigas desta galeria. De noite, os fachos de luz dele acendem.",
        "Daqui dá para ver as ilhas de cima: role a roda do mouse, ou faça pinça no celular, para afastar a câmera.",
      ]),
      h("div", { class: "p-actions" },
        toggle(() => (nav.night() ? "Ver de dia" : "Ver de noite"), nav.toggleNight),
        h("button", { class: "gel gel--silver", type: "button", onclick: () => nav.go("atrio") }, h("span", {}, "Voltar ao átrio")),
      ),
    ),
  };
}

export function arcadeView(zn: Zone, nav: Nav): View {
  const best = nav.record();
  return {
    kicker: "O fliperama",
    meta: best ? `Recorde ${best}` : "Sem recorde ainda",
    body: h("article", { class: "p" },
      screen(zn, "Letreiro do fliperama"),
      title("O fliperama"),
      lede("Três gabinetes, uma ficha gigante e um jogo de verdade: a Chuva de estrelas."),
      body([
        "Estrelas caem e você pega com uma barra de cromo. As rosas e as azuis valem 10, as douradas valem 50 e caem mais rápido. Deixou cair três, acabou.",
        best ? `O seu recorde neste navegador é ${best}. O do garoto do lado é 340.` : "O garoto do lado diz que o recorde dele é 340.",
      ]),
      h("div", { class: "p-actions" },
        h("button", { class: "gel gel--accent", type: "button", onclick: () => nav.play() }, h("span", {}, "Jogar")),
        h("button", { class: "gel gel--silver", type: "button", onclick: () => nav.catalog() }, h("span", {}, "Ver o catálogo")),
      ),
    ),
  };
}

export function libraryView(zn: Zone, nav: Nav): View {
  return {
    kicker: "A estante",
    meta: `${ARTICLES.length} artigos`,
    body: h("article", { class: "p" },
      screen(zn, "Letreiro da estante"),
      title("A estante"),
      lede("O que eu escrevo sobre design: a troca de carreira, processo, foco e um pouco de filosofia."),
      h("ul", { class: "reads" },
        ...ARTICLES.map((a, i) => {
          const b = h("span", { class: "bead" }, String(i + 1));
          b.style.setProperty("--b", a.color);
          const li = h("li", {},
            h("a", { class: "read", href: a.href, target: "_blank", rel: "noopener" },
              b,
              h("span", { class: "read__t" }, h("b", {}, a.title), h("span", { class: "label" }, `${a.tag} · ${a.date}`)),
              svg(icons.out),
            ),
          );
          (li.firstElementChild as HTMLElement).style.setProperty("--b", a.color);
          return li;
        }),
      ),
      body(["Os artigos abrem no meu site antigo, numa aba nova. O Clipe, ali do lado, já leu todos."]),
      h("div", { class: "p-actions" },
        h("button", { class: "gel gel--silver", type: "button", onclick: () => nav.go("sobre") }, h("span", {}, "Quem escreve")),
      ),
    ),
  };
}

export function gardenView(zn: Zone, nav: Nav): View {
  return {
    kicker: "O jardim",
    meta: "Um lugar pra respirar",
    body: h("article", { class: "p" },
      screen(zn, "Letreiro do jardim"),
      title("O jardim"),
      lede("Areia rastelada, um bonsai de cerejeira e alguém meditando no meio da galeria."),
      body([
        "Escrevi sobre rituais de foco e sobre o que a simplicidade budista ensina ao design de interface. Este lugar é a versão andável desses textos.",
        "Se quiser, respire junto por meio minuto: quatro respirações, quatro segundos para inspirar e quatro para soltar.",
      ]),
      h("div", { class: "p-actions" },
        h("button", { class: "gel gel--accent", type: "button", onclick: () => nav.breathe() }, h("span", {}, "Respirar junto")),
        h("button", { class: "gel gel--silver", type: "button", onclick: () => nav.go("estante") }, h("span", {}, "Ler os textos")),
      ),
    ),
  };
}

import { PROJECTS, type Project } from "../data/projects";
import { ABOUT, PERSON } from "../data/site";
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
  catalog: () => void;
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

  return {
    kicker: p.kind,
    meta: p.year,
    body: h("article", { class: "p" },
      screen(zn, `Letreiro da sala ${pad(i)}, ${p.title}`),
      title(p.title),
      lede(p.tagline),
      p.images?.length
        ? h("div", { class: "p-figs" }, ...p.images.map((src, k) => h("img", { src, alt: `${p.title}, imagem ${k + 1}`, loading: "lazy" })))
        : null,
      body(p.body),
      specs([
        ["Cliente", p.client],
        ["Indústria", p.industry],
        ["Ano", p.year],
        ["Papel", p.role],
        ["Ferramentas", p.stack.join(", ")],
      ]),
      p.link
        ? h("div", { class: "p-actions" },
            h("a", { class: "gel gel--accent", href: p.link, target: "_blank", rel: "noopener" }, h("span", {}, "Ver o site"), svg(icons.out)),
          )
        : null,
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

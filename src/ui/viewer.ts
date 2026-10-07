import { PROJECTS, type Project } from "../data/projects";
import { zoneById } from "../world/layout";
import { signURL } from "../world/sign";
import { h, icons, svg } from "./dom";

/* ============================================================
   O caso completo. A placa lateral é o resumo; aqui a obra
   ocupa a tela, como chegar bem perto de um quadro.

   À esquerda, a tela: as imagens do projeto dentro de um
   caixilho, que liga como um tubo de TV quando abre e troca
   de canal quando você passa de imagem. Clicar na imagem
   aproxima, e a lupa segue o cursor. À direita, o texto: o
   contexto, os blocos do processo e a ficha técnica.

   Setas trocam de imagem, Esc fecha.
   ============================================================ */

export interface ViewerHooks {
  open: () => void;
  close: () => void;
  flip: () => void;
  lock: (on: boolean) => void;
  go: (id: string) => void;
}

const pad = (n: number) => String(n + 1).padStart(2, "0");

export function createViewer(hooks: ViewerHooks) {
  let project: Project | null = null;
  let index = 0;

  const bead = h("span", { class: "bead bead--lg" });
  const title = h("h2", { class: "viewer__title", id: "viewer-title" });
  const meta = h("span", { class: "label" });
  const live = h("a", { class: "gel gel--accent gel--sm", target: "_blank", rel: "noopener" }, h("span", {}, "Ver o site"), svg(icons.out));
  const prevP = h("button", { class: "gel gel--silver gel--sm gel--icon", type: "button", "aria-label": "Obra anterior" }, svg(icons.left));
  const nextP = h("button", { class: "gel gel--silver gel--sm gel--icon", type: "button", "aria-label": "Próxima obra" }, svg(icons.right));
  const close = h("button", { class: "gel gel--silver gel--sm gel--icon", type: "button", "aria-label": "Fechar o caso" });
  close.innerHTML = icons.close;

  const img = h("img", { class: "viewer__img", alt: "" });
  const scan = h("span", { class: "viewer__scan", "aria-hidden": "true" });
  const tube = h("div", { class: "viewer__tube" }, img, scan);
  const prevI = h("button", { class: "gel gel--silver gel--icon viewer__arrow viewer__arrow--l", type: "button", "aria-label": "Imagem anterior" }, svg(icons.left));
  const nextI = h("button", { class: "gel gel--silver gel--icon viewer__arrow viewer__arrow--r", type: "button", "aria-label": "Próxima imagem" }, svg(icons.right));
  const screen = h("figure", { class: "viewer__screen" }, tube, prevI, nextI);
  const caption = h("p", { class: "viewer__caption t-small" });
  const count = h("span", { class: "label" });
  const thumbs = h("div", { class: "viewer__thumbs" });
  const stage = h("div", { class: "viewer__stage" }, screen, h("div", { class: "viewer__under" }, caption, count), thumbs);
  const text = h("div", { class: "viewer__text", "data-keys-own": "" });

  const sheet = h("div", { class: "viewer__sheet glass sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": "viewer-title" },
    h("header", { class: "sheet__bar" }, bead, h("div", { class: "viewer__head" }, title, meta), h("span", { class: "grow" }), live, prevP, nextP, close),
    h("div", { class: "viewer__body" }, stage, text),
  );
  const el = h("div", { class: "viewer", "aria-hidden": "true" }, sheet);
  el.addEventListener("click", (e) => { if (e.target === el) hide(); });

  close.addEventListener("click", () => hide());
  prevI.addEventListener("click", () => show(index - 1));
  nextI.addEventListener("click", () => show(index + 1));
  prevP.addEventListener("click", () => step(-1));
  nextP.addEventListener("click", () => step(1));

  // a lupa: clicar aproxima, e o ponto de origem segue o cursor
  tube.addEventListener("click", (e) => {
    if (!project?.images?.length) return;
    tube.classList.toggle("is-zoom");
    aim(e);
  });
  tube.addEventListener("pointermove", aim);
  tube.addEventListener("pointerleave", () => tube.classList.remove("is-zoom"));
  function aim(e: PointerEvent | MouseEvent) {
    const r = tube.getBoundingClientRect();
    img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  }

  function step(d: number) {
    if (!project) return;
    const i = PROJECTS.indexOf(project);
    const next = PROJECTS[(i + d + PROJECTS.length) % PROJECTS.length];
    open(next, 0);
    hooks.go(next.id);
  }

  function show(i: number) {
    if (!project) return;
    const shots = project.images ?? [];
    tube.classList.remove("is-zoom");
    if (!shots.length) {
      // sem imagens públicas: o letreiro da sala no lugar, ampliado em pixel
      img.src = signURL(zoneById(project.id)!);
      img.alt = `Letreiro de ${project.title}`;
      img.classList.add("is-pixel");
      caption.textContent = "As telas deste projeto ainda não são públicas. Elas entram aqui quando o produto lançar.";
      count.textContent = "";
      prevI.hidden = nextI.hidden = true;
      thumbs.replaceChildren();
      return;
    }
    index = (i + shots.length) % shots.length;
    const s = shots[index];
    img.classList.remove("is-pixel");
    img.src = s.src;
    img.alt = s.caption;
    caption.textContent = s.caption;
    count.textContent = `${pad(index)} / ${pad(shots.length - 1)}`;
    prevI.hidden = nextI.hidden = shots.length < 2;
    // troca de canal
    tube.classList.remove("is-switch");
    void tube.offsetWidth;
    tube.classList.add("is-switch");
    thumbs.querySelectorAll(".shot").forEach((t, k) => t.setAttribute("aria-current", String(k === index)));
    hooks.flip();
  }

  function fill(p: Project) {
    sheet.style.setProperty("--accent", p.color);
    bead.textContent = pad(PROJECTS.indexOf(p));
    bead.style.setProperty("--b", p.color);
    title.textContent = p.title;
    meta.textContent = `${p.kind} · ${p.date}`;
    live.hidden = !p.link;
    if (p.link) live.href = p.link;

    const shots = p.images ?? [];
    thumbs.replaceChildren(
      ...shots.map((s, k) => {
        const b = h("button", { class: "shot", type: "button", "aria-label": `Imagem ${k + 1}: ${s.caption}`, onclick: () => show(k) },
          h("img", { src: s.src, alt: "", loading: "lazy" }),
          h("span", { class: "shot__n bead" }, String(k + 1)),
        );
        (b.querySelector(".bead") as HTMLElement).style.setProperty("--b", p.color);
        return b;
      }),
    );

    const sections = (p.sections ?? []).map((sec) =>
      h("section", { class: "v-sec" },
        h("h3", { class: "label" }, sec.title),
        h("ol", { class: "v-list" }, ...sec.items.map((it, k) => h("li", {}, h("span", { class: "bead" }, String(k + 1)), h("span", {}, it)))),
      ),
    );
    text.replaceChildren(
      h("p", { class: "t-lede" }, p.tagline),
      h("div", { class: "p-body" }, ...p.body.map((t) => h("p", {}, t))),
      ...sections,
      h("dl", { class: "specs" },
        ...([
          ["Cliente", p.client],
          ["Serviço", p.service],
          ["Indústria", p.industry],
          ["Quando", p.date],
          ["Papel", p.role],
          ["Ferramentas", p.stack.join(", ")],
        ] as [string, string][]).flatMap(([k, v]) => [h("dt", {}, k), h("dd", {}, v)]),
      ),
      ...(p.link
        ? [h("div", { class: "p-actions" }, h("a", { class: "gel gel--accent", href: p.link, target: "_blank", rel: "noopener" }, h("span", {}, "Ver o site ao vivo"), svg(icons.out)))]
        : []),
    );
    text.scrollTop = 0;
    text.querySelectorAll<HTMLElement>(".v-list .bead").forEach((b) => b.style.setProperty("--b", p.color));
  }

  function open(p: Project, i = 0) {
    const first = !el.classList.contains("is-open");
    project = p;
    fill(p);
    show(i);
    if (first) {
      el.classList.add("is-open");
      el.setAttribute("aria-hidden", "false");
      // o tubo liga do zero
      screen.classList.remove("is-on");
      void screen.offsetWidth;
      screen.classList.add("is-on");
      hooks.lock(true);
      hooks.open();
      close.focus({ preventScroll: true });
    }
  }

  function hide() {
    if (!el.classList.contains("is-open")) return;
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
    tube.classList.remove("is-zoom");
    hooks.lock(false);
    hooks.close();
  }

  addEventListener("keydown", (e) => {
    if (!el.classList.contains("is-open")) return;
    if (e.key === "Escape") { e.stopImmediatePropagation(); hide(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); show(index + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); show(index - 1); }
  }, true);

  return {
    el,
    open,
    close: hide,
    get isOpen() { return el.classList.contains("is-open"); },
  };
}

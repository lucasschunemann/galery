import { h } from "./dom";

/* ============================================================
   Respirar junto, no jardim: quatro respirações de oito
   segundos, quatro para inspirar e quatro para soltar. Um
   círculo de vidro cresce e encolhe no ritmo, o boneco senta
   e flutua. Andar interrompe.
   ============================================================ */

export interface CalmHooks {
  start: () => void;
  stop: (done: boolean) => void;
  phase: (inhale: boolean) => void;
}

const CYCLES = 4;
const HALF = 4000;

export function createCalm(hooks: CalmHooks) {
  const word = h("b", { class: "calm__word" }, "inspira");
  const count = h("span", { class: "label" });
  const orb = h("div", { class: "calm__orb" }, word, count);
  const stopBtn = h("button", { class: "gel gel--silver gel--sm", type: "button" }, h("span", {}, "Parar"));
  const el = h("div", { class: "calm", "aria-live": "polite" }, orb, stopBtn);
  stopBtn.addEventListener("click", () => stop(false));

  let timer = 0;
  let k = 0;
  let running = false;

  function tick() {
    const inhale = k % 2 === 0;
    const cycle = Math.floor(k / 2);
    if (cycle >= CYCLES) { stop(true); return; }
    word.textContent = inhale ? "inspira" : "solta";
    count.textContent = `${cycle + 1} de ${CYCLES}`;
    orb.classList.toggle("is-in", inhale);
    hooks.phase(inhale);
    k++;
    timer = window.setTimeout(tick, HALF);
  }

  function start() {
    if (running) return;
    running = true;
    k = 0;
    el.classList.add("is-on");
    hooks.start();
    timer = window.setTimeout(tick, 600);
  }

  function stop(done: boolean) {
    if (!running) return;
    running = false;
    clearTimeout(timer);
    el.classList.remove("is-on");
    orb.classList.remove("is-in");
    hooks.stop(done);
  }

  return { el, start, stop: () => stop(false), get running() { return running; } };
}

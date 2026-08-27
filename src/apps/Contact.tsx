import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSfx } from "../os/useSfx";

const LINKS = [
  { label: "E-mail", value: "lucas.vhschunemann@gmail.com", href: "mailto:lucas.vhschunemann@gmail.com" },
  { label: "GitHub", value: "github.com/lucas", href: "#" },
  { label: "LinkedIn", value: "in/lucas-schunemann", href: "#" },
  { label: "Dribbble", value: "dribbble.com/lucas", href: "#" },
];

export default function Contact() {
  const sfx = useSfx();
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [form, setForm] = useState({ name: "", email: "", msg: "" });

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (state !== "idle") return;
    sfx("click");
    setState("sending");
    // no backend here on purpose — the form demonstrates the interaction,
    // the real channel is the mailto link below
    setTimeout(() => { setState("sent"); sfx("chime"); }, 1500);
  };

  return (
    <div className="contact">
      <h1 className="contact__h">Nova mensagem</h1>

      <AnimatePresence mode="wait">
        {state !== "sent" ? (
          <motion.form
            key="form" onSubmit={send} className="contact__form"
            exit={{ opacity: 0, y: -10 }}
          >
            <label className="row">
              <span>Para:</span>
              <input value="Lucas Schünemann" readOnly className="row__input row__input--locked" />
            </label>
            <label className="row">
              <span>De:</span>
              <input
                required type="email" placeholder="seu@email.com" className="row__input"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </label>
            <label className="row">
              <span>Assunto:</span>
              <input
                required placeholder="Assunto" className="row__input"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <textarea
              required rows={6} className="contact__area" placeholder="Escreva aqui…"
              value={form.msg} onChange={(e) => setForm({ ...form, msg: e.target.value })}
            />
            <div className="contact__send">
              <button className="gel btn" type="submit" disabled={state === "sending"}>
                {state === "sending" ? "Enviando…" : "Enviar"}
              </button>
              {state === "sending" && <span className="spinner" aria-hidden />}
            </div>
          </motion.form>
        ) : (
          <motion.div
            key="ok" className="contact__ok"
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >
            <div className="contact__ok-badge">✓</div>
            <p><strong>Mensagem escrita.</strong></p>
            <p className="contact__ok-sub">
              Este formulário é uma demonstração e não envia nada. Para falar comigo,
              use o e-mail abaixo.
            </p>
            <button className="btn btn--ghost" onClick={() => { setState("idle"); sfx("click"); }}>
              Escrever outra
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ul className="contact__links">
        {LINKS.map((l) => (
          <li key={l.label}>
            <span>{l.label}</span>
            <a href={l.href} onPointerEnter={() => sfx("hover")}>{l.value}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}

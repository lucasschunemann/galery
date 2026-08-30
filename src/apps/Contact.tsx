import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useSfx } from "../os/useSfx";

const TO = "lucas.vhschunemann@gmail.com";
const WEB3FORMS_KEY = import.meta.env.VITE_WEB3FORMS_KEY as string | undefined;

/* Only what is real. Add the rest when the handles are decided. */
const LINKS = [
  { label: "E-mail", value: TO, href: `mailto:${TO}` },
  { label: "Local", value: "Porto Alegre, Brasil", href: null },
];

export default function Contact() {
  const sfx = useSfx();
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [form, setForm] = useState({ name: "", email: "", msg: "" });

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    sfx("click");
    setState("sending");

    if (!WEB3FORMS_KEY) {
      // sem chave configurada, cai pro cliente de e-mail do visitante
      window.location.href =
        `mailto:${TO}?subject=${encodeURIComponent(form.name)}&body=${encodeURIComponent(`${form.msg}\n\n(${form.email})`)}`;
      setState("sent");
      sfx("chime");
      return;
    }

    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          to: TO,
          subject: form.name || "Nova mensagem pelo portfólio",
          from_name: form.email,
          email: form.email,
          message: form.msg,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "falha no envio");
      setState("sent");
      sfx("chime");
    } catch {
      setState("error");
    }
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
            {state === "error" && (
              <p className="contact__ok-sub">
                Não consegui enviar. Escreve direto pro e-mail aí embaixo.
              </p>
            )}
          </motion.form>
        ) : (
          <motion.div
            key="ok" className="contact__ok"
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >
            <div className="contact__ok-badge">✓</div>
            <p><strong>Mensagem enviada.</strong></p>
            <p className="contact__ok-sub">Respondo assim que ver.</p>
            <button className="btn btn--ghost" onClick={() => { setState("idle"); setForm({ name: "", email: "", msg: "" }); sfx("click"); }}>
              Escrever outra
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ul className="contact__links">
        {LINKS.map((l) => (
          <li key={l.label}>
            <span>{l.label}</span>
            {l.href ? (
              <a href={l.href} onPointerEnter={() => sfx("hover")}>{l.value}</a>
            ) : (
              <em className="contact__plain">{l.value}</em>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

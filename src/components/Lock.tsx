import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useOS } from "../os/store";
import { useSfx } from "../os/useSfx";
import { unlockAudio } from "../os/sound";

/* hyprlock, essentially: the wallpaper stays live behind a heavy
   blur, the time is the whole composition, and the field takes any
   password because there is nothing to protect. */
export default function Lock() {
  const phase = useOS((s) => s.phase);
  const unlockOS = useOS((s) => s.unlock);
  const sfx = useSfx();
  const [pw, setPw] = useState("");
  const [shake, setShake] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const inputRef = useRef<HTMLInputElement>(null);

  const on = phase === "lock";

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (on) {
      setPw("");
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [on]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    unlockAudio();
    if (!pw.trim()) {
      setShake(true);
      sfx("error");
      setTimeout(() => setShake(false), 420);
      return;
    }
    sfx("open");
    unlockOS();
  };

  const time = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  return (
    <AnimatePresence>
      {on && (
        <motion.div
          className="lock"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(6px)", scale: 1.015 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="lock__scrim" />

          <div className="lock__grid" aria-hidden>
            {Array.from({ length: 11 }, (_, i) => (
              <span key={i} style={{ left: `${((i + 1) / 12) * 100}%` }} />
            ))}
          </div>

          <motion.div
            className="lock__clockblock"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <p className="lock__label t-label">descansando</p>
            <p className="lock__time t-num">{time}</p>
            <p className="lock__date">{date}</p>
          </motion.div>

          <motion.form
            className={`lock__form ${shake ? "is-shake" : ""}`}
            onSubmit={submit}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="lock__avatar" aria-hidden>LS</div>
            <div className="lock__user">
              <span className="lock__name">lucas</span>
              <span className="lock__host">em casa</span>
            </div>

            <div className="lock__field glass">
              <input
                ref={inputRef}
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="qualquer coisa"
                aria-label="Senha"
              />
              <button type="submit" className="lock__go" title="Entrar">→</button>
            </div>
            <p className="lock__hint">
              qualquer senha entra — não há nada aqui para trancar
            </p>
          </motion.form>

          <div className="lock__foot">
            <span>komorebi</span>
            <span>lucas schünemann — ux/ui &amp; web</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useEffect, useRef, useState } from "react";
import { useOS, APPS, type Flavour } from "../os/store";
import { PROJECTS } from "../data/projects";
import { useSfx } from "../os/useSfx";

type Line = { kind: "in" | "out" | "err"; text: string };

const BANNER = [
  "raam",
  'Digite "help" para ver os comandos disponíveis.',
];

const NEOFETCH = String.raw`
     ┌───────┐       lucas@raam
     │  ▘ ▘  │       ───────────────
     │   ─   │       OS      RAAM
     │  ───  │       WM      dwindle
     └───────┘       BAR     helvetia-bar
                     PALETTE {theme}
                     UPTIME  {uptime}
                     APPS    {apps}
                     DESIGN  gerado em código
`;

export default function Terminal() {
  const { open, setFlavour } = useOS();
  const theme = useOS((s) => s.flavour);
  const sfx = useSfx();
  const [lines, setLines] = useState<Line[]>(BANNER.map((t) => ({ kind: "out", text: t })));
  const [value, setValue] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [hIdx, setHIdx] = useState(-1);
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const started = useRef(Date.now());

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  const push = (...l: Line[]) => setLines((s) => [...s, ...l]);
  const out = (text: string) => push({ kind: "out", text });

  function run(raw: string) {
    const input = raw.trim();
    push({ kind: "in", text: input });
    if (!input) return;

    const [cmd, ...args] = input.split(/\s+/);
    const arg = args.join(" ");

    switch (cmd.toLowerCase()) {
      case "help":
        out("comandos disponíveis:");
        out("  ls                lista os projetos");
        out("  open <alvo>       abre um app ou projeto");
        out("  tema <nome>       braun linen zurich delft graphite ulm basel stedelijk");
        out("  whoami            quem escreveu isto");
        out("  neofetch          informações do sistema");
        out("  date              data e hora");
        out("  echo <texto>      repete o texto");
        out("  clear             limpa a tela");
        break;

      case "ls":
      case "projects":
        PROJECTS.forEach((p) =>
          out(`  ${p.id.padEnd(14)} ${p.year}  ${p.title}`)
        );
        out(`total ${PROJECTS.length}`);
        break;

      case "open": {
        if (!arg) { push({ kind: "err", text: "open: informe um alvo. ex: open finder" }); break; }
        const key = arg.toLowerCase();
        if (APPS[key]) { open(key); out(`abrindo ${APPS[key].name}…`); sfx("open"); break; }
        const p = PROJECTS.find((x) => x.id === key || x.title.toLowerCase() === key);
        if (p) { open("project", { id: p.id, title: p.title }); out(`abrindo “${p.title}”…`); sfx("open"); break; }
        push({ kind: "err", text: `open: alvo não encontrado: ${arg}` });
        break;
      }

      case "theme":
      case "tema":
      case "flavour": {
        const t = arg.toLowerCase() as Flavour;
        if (["braun", "linen", "zurich", "delft", "graphite", "ulm", "basel", "stedelijk"].includes(t)) {
          setFlavour(t); sfx("chime"); out(`paleta alterada para ${t}`);
        } else push({ kind: "err", text: "tema: braun linen zurich delft graphite ulm basel stedelijk" });
        break;
      }

      case "whoami":
        out("lucas schünemann, designer e desenvolvedor front-end.");
        out("uid=1000  groups=design,frontend,motion");
        break;

      case "neofetch": {
        const up = Math.floor((Date.now() - started.current) / 1000);
        NEOFETCH.trim()
          .replace("{theme}", theme)
          .replace("{uptime}", `${Math.floor(up / 60)}m ${up % 60}s`)
          .replace("{apps}", String(Object.keys(APPS).length))
          .split("\n")
          .forEach(out);
        break;
      }

      case "date":
        out(new Date().toLocaleString("pt-BR", { dateStyle: "full", timeStyle: "medium" }));
        break;

      case "echo":
        out(arg);
        break;

      case "clear":
        setLines([]);
        return;

      case "sudo":
        push({ kind: "err", text: "lucas não está no arquivo sudoers. Este incidente será reportado." });
        sfx("error");
        break;

      case "rm":
        push({ kind: "err", text: "rm: operação não permitida neste portfólio." });
        sfx("error");
        break;

      default:
        push({ kind: "err", text: `bash: ${cmd}: comando não encontrado` });
        sfx("error");
    }
  }

  return (
    <div className="term" onClick={() => inputRef.current?.focus()}>
      <div className="term__body" ref={bodyRef}>
        {lines.map((l, i) => (
          <p key={i} className={`term__line term__line--${l.kind}`}>
            {l.kind === "in" && <span className="term__ps">lucas ~ $</span>}
            {l.text}
          </p>
        ))}
        <form
          className="term__prompt"
          onSubmit={(e) => {
            e.preventDefault();
            run(value);
            if (value.trim()) setHistory((h) => [value, ...h]);
            setHIdx(-1);
            setValue("");
          }}
        >
          <span className="term__ps">lucas ~ $</span>
          <input
            ref={inputRef}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                const n = Math.min(history.length - 1, hIdx + 1);
                if (n >= 0) { setHIdx(n); setValue(history[n]); }
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                const n = hIdx - 1;
                setHIdx(n);
                setValue(n >= 0 ? history[n] : "");
              }
            }}
            aria-label="Entrada do terminal"
          />
          <span className="term__caret" aria-hidden />
        </form>
      </div>
    </div>
  );
}

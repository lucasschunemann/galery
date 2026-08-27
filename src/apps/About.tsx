import { motion } from "motion/react";
import { useOS } from "../os/store";
import { useSfx } from "../os/useSfx";

const SPECS = [
  ["host", "lucas schünemann"],
  ["role", "ux/ui designer & web developer"],
  ["shell", "design 3.2 GHz · código 3.0 GHz"],
  ["uptime", "8 anos em produção"],
  ["render", "motion · webgl · canvas"],
  ["locale", "brasil — remoto, gmt-3"],
  ["status", "aberto a projetos"],
];

export default function About() {
  const open = useOS((s) => s.open);
  const sfx = useSfx();

  return (
    <div className="about">
      <div className="about__head">
        <motion.div
          className="about__orb"
          animate={{ rotate: 360 }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
        />
        <div>
          <h1 className="about__name">Lucas Schünemann</h1>
          <p className="about__ver">helvetia 1.0 · international style · build 2026</p>
        </div>
      </div>

      <p className="about__bio">
        Eu projeto e construo interfaces. Comecei no design, aprendi a programar porque
        queria que as coisas se movessem exatamente como eu tinha imaginado, e nunca mais
        separei as duas coisas. Gosto de sistemas: cor, tipografia, componente, token,
        deploy — tudo junto, tudo coerente.
      </p>
      <p className="about__bio">
        Este site é um sistema operacional. Janelas tiladas, paletas tonais, um acento
        por tema, tudo desenhado em código — não existe uma única imagem no projeto.
        É a forma mais honesta que eu conheço de mostrar como eu trabalho.
      </p>

      <table className="specs">
        <tbody>
          {SPECS.map(([k, v], i) => (
            <motion.tr
              key={k}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.3 }}
            >
              <th>{k}</th>
              <td>{v}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>

      <div className="about__actions">
        <button className="gel btn" onClick={() => { sfx("open"); open("files"); }}>Ver o trabalho</button>
        <button className="btn btn--ghost" onClick={() => { sfx("open"); open("contact"); }}>Entrar em contato</button>
      </div>
    </div>
  );
}

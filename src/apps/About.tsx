import { motion } from "motion/react";
import { useOS } from "../os/store";
import { useSfx } from "../os/useSfx";

const SPECS = [
  ["Nome", "Lucas Schünemann"],
  ["Função", "UX/UI Designer e Web Developer"],
  ["Foco", "Interfaces, design systems, motion"],
  ["Experiência", "8 anos"],
  ["Ferramentas", "Figma, React, TypeScript, WebGL"],
  ["Local", "Brasil, remoto (GMT-3)"],
  ["Situação", "Aberto a projetos"],
];

export default function About() {
  const open = useOS((s) => s.open);
  const sfx = useSfx();

  return (
    <div className="about">
      <div className="about__head">
        <span className="about__mark" aria-hidden>LS</span>
        <div>
          <h1 className="about__name">Lucas Schünemann</h1>
          <p className="about__ver">raam · 2026</p>
        </div>
      </div>

      <p className="about__bio">
        Eu projeto e construo interfaces. Comecei no design e aprendi a programar
        porque queria controlar como as coisas se movem. Desde então trabalho nas duas
        pontas: cor, tipografia, componente, token, deploy.
      </p>
      <p className="about__bio">
        Este site é um sistema operacional funcional. As janelas se organizam em
        mosaico, os temas trocam a paleta inteira e nada aqui usa arquivo de imagem:
        cada superfície é desenhada em código.
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

import { motion } from "motion/react";
import { useOS } from "../os/store";
import { useSfx } from "../os/useSfx";
import { stagger } from "../os/motion";

const SPECS = [
  ["Função", "Product Designer, foco em UX/UI"],
  ["Hoje", "CPO e co-fundador na neth!"],
  ["Também", "UX/UI Designer na Área Central"],
  ["Formação", "Interaction Design Foundation"],
  ["Local", "Porto Alegre, Brasil (GMT-3)"],
  ["Situação", "Aberto a projetos freelance"],
];

const DOING = [
  "Pesquisa de UX e validação de hipóteses",
  "Arquitetura de informação e estruturação de fluxos",
  "Prototipação em média e alta fidelidade no Figma",
  "Design systems e consistência entre produtos",
  "Desenvolvimento de sites em Framer com código customizado",
  "Handoff e colaboração próxima com desenvolvedores",
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
          <p className="about__ver">Product Designer · Porto Alegre</p>
        </div>
      </div>

      <p className="about__bio">
        Sou product designer com foco em UX/UI, co-fundador e CPO da neth!, uma
        startup de saúde e bem-estar digital em Porto Alegre.
      </p>
      <p className="about__bio">
        No meu trabalho principal sou UX/UI designer na Área Central. Liderei a
        criação de um design system multiplataforma que unificou padrões visuais e
        de interação entre vários produtos, encurtando o caminho do design até o
        desenvolvimento. Também reestruturei o fluxo de visualização de documentos
        de uma plataforma complexa, reduzindo atrito nas telas principais e
        aumentando a conclusão das tarefas.
      </p>
      <p className="about__bio">
        Na neth! cuido da direção de produto, da prototipação em Figma, do roadmap
        e da gestão do time de desenvolvimento. É um trabalho na interseção entre
        design, tecnologia e estratégia de negócio.
      </p>
      <p className="about__bio">
        Em paralelo pego projetos freelance B2B e B2C, na maioria plataformas de
        inteligência de dados e sites. Vou do discovery e do mapeamento de jornada
        até a interface em alta fidelidade, pronta para desenvolvimento.
      </p>

      <section className="about__block">
        <p className="t-label">O trabalho costuma envolver</p>
        <ul className="about__list">
          {DOING.map((d, i) => (
            <motion.li
              key={d}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={stagger(i, 0.03)}
            >
              {d}
            </motion.li>
          ))}
        </ul>
      </section>

      <table className="specs">
        <tbody>
          {SPECS.map(([k, v], i) => (
            <motion.tr
              key={k}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={stagger(i, 0.03)}
            >
              <th>{k}</th>
              <td>{v}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>

      <div className="about__actions">
        <button className="btn" onClick={() => { sfx("open"); open("files"); }}>
          Ver o trabalho
        </button>
        <button className="btn btn--accent" onClick={() => { sfx("open"); open("contact"); }}>
          Entrar em contato
        </button>
      </div>
    </div>
  );
}

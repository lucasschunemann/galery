const DISCARDED = [
  ["parallax-infinito.sketch", "Bonito por 4 segundos, cansativo por toda a eternidade."],
  ["hamburguer-no-desktop.fig", "Três linhas escondendo cinco links. Não."],
  ["carrossel-da-home.psd", "Ninguém nunca chegou no slide 3."],
  ["scroll-hijack.js", "Devolva o scroll para quem é dono dele."],
  ["loader-de-6-segundos.json", "O site carregava em 400ms. A animação, em 6s."],
  ["dark-mode-as-pressas.css", "Inverter as cores não é um tema."],
];

export default function Trash() {
  return (
    <div className="trash">
      <p className="trash__note">
        Ideias que não sobreviveram à revisão. Guardo todas — errar em público é
        parte do método.
      </p>
      <ul className="trash__list">
        {DISCARDED.map(([name, why]) => (
          <li key={name}>
            <span className="trash__file">{name}</span>
            <span className="trash__why">{why}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

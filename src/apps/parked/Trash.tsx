const DISCARDED = [
  ["parallax-infinito.sketch", "Bonito nos primeiros segundos, cansativo no resto da página."],
  ["hamburguer-no-desktop.fig", "Três linhas escondendo cinco links num monitor de 27 polegadas."],
  ["carrossel-da-home.psd", "Ninguém chegou no terceiro slide."],
  ["scroll-hijack.js", "O scroll é do usuário."],
  ["loader-de-6-segundos.json", "O site carregava em 400ms. A animação levava seis segundos."],
  ["dark-mode-as-pressas.css", "Inverter as cores não produz um tema."],
  ["glass-em-tudo.css", "Vidro sobre vidro sobre vidro. Nada ficou legível."],
];

export default function Trash() {
  return (
    <div className="trash">
      <p className="trash__note">
        Ideias que não passaram da revisão. Guardo todas para não repetir.
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

import { svg } from "./dom";

/* ============================================================
   O logotipo: VON desenhado com os mesmos tubos cromados da
   escultura do átrio. Cada letra tem três camadas: o contorno
   escuro, o cromo (um degradê com a faixa escura do horizonte)
   e um risco de luz deslocado para cima, à esquerda. O O é um
   anel, e gira como gira lá no mundo.
   ============================================================ */

const V = "M8 7 21 37 34 7";
const N = "M95 37V7l25 30V7";
const O_ARC = "M50.2 19.5A14.5 14.5 0 0 1 71.75 9.44";
// um brilho de quatro pontas pousado no anel, como reflexo de estúdio
const STAR = "M75 4.5Q75 10.5 81 10.5Q75 10.5 75 16.5Q75 10.5 69 10.5Q75 10.5 75 4.5Z";

let uid = 0;

export function logo(cls = "") {
  const id = `von-chrome-${uid++}`;
  const fill = `stroke="url(#${id})" stroke-width="8.4"`;
  const edge = `stroke="var(--chr-edge)" stroke-width="10.6"`;
  const spec = `stroke="#fff" stroke-width="1.6" opacity=".85" transform="translate(-1.2 -1.5)"`;
  return svg(`
    <svg class="logo ${cls}" viewBox="0 0 128 44" role="img" aria-label="VON">
      <defs>
        <linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="0" y1="3" x2="0" y2="41">
          <stop offset="0" style="stop-color:var(--chr-0)"/>
          <stop offset=".3" style="stop-color:var(--chr-1)"/>
          <stop offset=".47" style="stop-color:var(--chr-2)"/>
          <stop offset=".5" style="stop-color:var(--chr-3)"/>
          <stop offset=".58" style="stop-color:var(--chr-4)"/>
          <stop offset=".82" style="stop-color:var(--chr-5)"/>
          <stop offset="1" style="stop-color:var(--chr-0)"/>
        </linearGradient>
      </defs>
      <g fill="none" stroke-linecap="round" stroke-linejoin="round">
        <g class="logo__v">
          <path d="${V}" ${edge}/><path d="${V}" ${fill}/><path d="${V}" ${spec}/>
        </g>
        <g class="logo__o">
          <circle cx="64.5" cy="22" r="14.5" ${edge}/><circle cx="64.5" cy="22" r="14.5" ${fill}/><path d="${O_ARC}" ${spec}/>
        </g>
        <g class="logo__n">
          <path d="${N}" ${edge}/><path d="${N}" ${fill}/><path d="${N}" ${spec}/>
        </g>
      </g>
      <path class="logo__star" d="${STAR}" fill="#fff"/>
    </svg>`);
}

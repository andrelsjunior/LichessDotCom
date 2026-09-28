import { gridLine, hitArea, xAxisLabel } from '#shared/charts/markup.ts';
import { html, type SafeHtml } from '#shared/html.ts';
import { RANGE_KEYS } from './dates.ts';
import { HEIGHT, PAD, type Plot } from './scales.ts';
import type { TimeTick } from './time-ticks.ts';

/** The chart's frame, filled in by each draw. */
export function chartShell(): SafeHtml {
  const ranges = RANGE_KEYS.map(
    key => html`<button type="button" data-range="${key}">${key}</button>`,
  );
  return html`<div class="cdc-rchart__top"><div class="cdc-rchart__legend"></div><div class="cdc-rchart__ranges"><span class="cdc-rchart__thumb"></span>${ranges}</div></div><div class="cdc-rchart__plot"><svg class="cdc-rchart__svg" aria-hidden="true"></svg><div class="cdc-rchart__tip"></div></div>`;
}

export const gradientId = (index: number): string => `cdc-rg-${index}`;

function dateLabels(plot: Plot, ticks: readonly TimeTick[]): SafeHtml[] {
  // Labels too close to the plot's edges would be cut.
  return ticks
    .filter(([time]) => plot.x(time) > PAD.left + 16 && plot.x(time) < plot.width - PAD.right - 16)
    .map(([time, label]) => xAxisLabel({ x: plot.x(time), y: HEIGHT - 8, text: label }));
}

/** Everything in the SVG but the rating grid and the curves' paths, which `update` sets. */
export function plotMarkup(plot: Plot, ticks: readonly TimeTick[]): SafeHtml {
  const plotWidth = plot.width - PAD.left - PAD.right;
  const gradients = plot.rows.map(
    ({ index, color }) =>
      html`<linearGradient id="${gradientId(index)}" gradientUnits="userSpaceOnUse" x1="0" x2="0"><stop offset="0" stop-color="${color}" stop-opacity="0.3"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient>`,
  );
  const series = plot.rows.map(
    ({ index, color }) =>
      html`<g class="cdc-rchart__series" data-i="${index}" style="--c:${color}"><path class="cdc-rchart__area" fill="url(#${gradientId(index)})"/><path class="cdc-rchart__line"/></g>`,
  );
  const dots = plot.rows.map(
    ({ index, color }) =>
      html`<circle class="cdc-rchart__dot" data-i="${index}" r="4.5" style="--c:${color}"/>`,
  );
  // One clip, wiped open, reveals every line and fill together, left to right.
  const clip = html`<clipPath id="cdc-rclip"><rect class="cdc-rchart__wipe" x="${PAD.left - 4}" y="0" width="${plotWidth + 8}" height="${HEIGHT}"/></clipPath>`;
  const hit = hitArea({
    x: PAD.left,
    y: PAD.top,
    width: plotWidth,
    height: plot.bottom - PAD.top,
  });
  return html`<defs>${gradients}${clip}</defs><g class="cdc-rchart__axis">${dateLabels(plot, ticks)}</g><g class="cdc-rchart__all" clip-path="url(#cdc-rclip)">${series}</g><g class="cdc-rchart__hover"><line class="cdc-rchart__guide" y1="${PAD.top}" y2="${plot.bottom}"/>${dots}</g>${hit}`;
}

/** The rating grid, which follows the ratings shown. */
export function ratingGrid(plot: Plot): SafeHtml {
  const lines = plot.ratings.ticks.map(rating =>
    gridLine({ y: plot.y(rating), left: PAD.left, right: plot.width - PAD.right, label: rating }),
  );
  return html`${lines}`;
}

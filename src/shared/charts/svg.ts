import { type SafeHtml, setHtml } from '#shared/html.ts';

/** Sizes an SVG to `width` × `height` pixels, its units being pixels too. */
export function sizeSvg(svg: SVGSVGElement, width: number, height: number): void {
  setAttributes(svg, { width, height });
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
}

export function setAttributes(
  element: Element,
  attributes: Readonly<Record<string, number>>,
): void {
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
}

/** The pointer's x from the element's left edge. */
export const pointerX = (event: MouseEvent, element: Element): number =>
  event.clientX - element.getBoundingClientRect().left;

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Parses SVG markup into the start of `parent`. The markup is parsed inside an
 * SVG element, so it's SVG in any DOM (happy-dom reads insertAdjacentHTML on
 * an SVG element as HTML).
 */
export function prependSvg(parent: Element, markup: SafeHtml): void {
  const scratch = document.createElementNS(SVG_NS, 'g');
  setHtml(scratch, markup);
  parent.prepend(...scratch.childNodes);
}

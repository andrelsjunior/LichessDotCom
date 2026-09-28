// A tagged template for markup built as text: every interpolated value is
// escaped unless it is itself `html` output, so templates can nest safely.

const ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ENTITIES[char] ?? char);
}

export class SafeHtml {
  readonly value: string;

  constructor(value: string) {
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}

export type HtmlValue =
  | SafeHtml
  | string
  | number
  | false
  | null
  | undefined
  | readonly HtmlValue[];

function render(value: HtmlValue): string {
  if (value instanceof SafeHtml) return value.value;
  if (typeof value === 'string') return escapeHtml(value);
  if (typeof value === 'number') return String(value);
  if (value === false || value === null || value === undefined) return '';
  return value.map(render).join('');
}

export function html(strings: TemplateStringsArray, ...values: readonly HtmlValue[]): SafeHtml {
  let out = strings[0] ?? '';
  for (const [i, value] of values.entries()) out += render(value) + (strings[i + 1] ?? '');
  return new SafeHtml(out);
}

/** Markup that is known to be safe: a constant, never user or page data. */
export const trustedHtml = (markup: string): SafeHtml => new SafeHtml(markup);

export function setHtml(element: Element, markup: SafeHtml): void {
  element.innerHTML = markup.value;
}

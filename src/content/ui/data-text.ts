/**
 * Sets a data attribute that reads as empty when absent: an empty value
 * clears one already there, but doesn't add it.
 */
export function setDataText(element: HTMLElement, key: string, value: string): void {
  if ((element.dataset[key] ?? '') !== value) element.dataset[key] = value;
}

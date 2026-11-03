export function getModalRoot(): HTMLElement {
  return document.querySelector<HTMLElement>('.bank-app') ?? document.body
}

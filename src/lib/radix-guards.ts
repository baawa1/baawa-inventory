export function clearRadixGuards() {
  if (typeof document === 'undefined') return;

  document
    .querySelectorAll('[data-radix-dialog-aria-hidden]')
    .forEach(element => {
      element.removeAttribute('data-radix-dialog-aria-hidden');
      element.removeAttribute('aria-hidden');
      element.removeAttribute('inert');
      if ('inert' in element) {
        (element as HTMLElement & { inert?: boolean }).inert = false;
      }
    });

  document.body?.removeAttribute('aria-hidden');
  document.body?.removeAttribute('inert');
  if ('inert' in document.body) {
    (document.body as HTMLElement & { inert?: boolean }).inert = false;
  }

  const htmlElement = document.documentElement as HTMLElement & {
    inert?: boolean;
  };
  htmlElement.removeAttribute('aria-hidden');
  htmlElement.removeAttribute('inert');
  if ('inert' in htmlElement) {
    htmlElement.inert = false;
  }
}

let activeRadixLayers = 0;

export function markRadixLayerOpen() {
  activeRadixLayers += 1;
}

export function markRadixLayerClosed() {
  activeRadixLayers = Math.max(0, activeRadixLayers - 1);
  if (activeRadixLayers === 0) {
    clearRadixGuards();
  }
}

export function resetRadixLayerGuards() {
  activeRadixLayers = 0;
  clearRadixGuards();
}

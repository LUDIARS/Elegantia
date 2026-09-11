// Excubitor owns the injected prefix. Direct access retains the root route.
const injected = document.querySelector<HTMLScriptElement>('script[data-excubitor-viewer]')?.dataset.prefix;
export const viewerBase = injected === '/viewer/apps/elegantia' ? injected : '';
export const servicePath = (path: string): string => viewerBase + path;

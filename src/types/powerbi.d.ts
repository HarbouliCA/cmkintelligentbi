interface PowerBIEmbed {
  embed: (element: HTMLElement, config: any) => any;
  get: (element: HTMLElement) => any;
  reset?: () => void;
}

declare global {
  interface Window {
    powerbi: any;
  }
}

export interface PowerBIInstance {
  embed: (element: HTMLElement, config: any) => any;
  reset: (element: HTMLElement) => void;
}

export {};
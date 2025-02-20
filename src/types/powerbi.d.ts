interface PowerBIEmbed {
  embed: (element: HTMLElement, config: any) => any;
  get: (element: HTMLElement) => any;
  reset?: () => void;
}

declare global {
  interface Window {
    powerbi: PowerBIInstance;
  }
}

export interface PowerBIInstance {
  embed: (element: HTMLElement, config: any) => any;
  reset: () => void;
}

export {};
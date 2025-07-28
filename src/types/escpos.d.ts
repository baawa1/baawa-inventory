declare module 'escpos' {
  export class Printer {
    constructor(device: any);
    font(font: string): this;
    align(alignment: string): this;
    style(style: string): this;
    size(width: number, height: number): this;
    text(text: string): this;
    drawLine(): this;
    cut(): this;
    close(): Promise<void>;
  }
}

declare module 'escpos-usb' {
  export function findPrinter(): Array<{
    deviceDescriptor: {
      idProduct: number;
    };
  }>;
}

declare module 'escpos-network' {
  export default class NetworkDevice {
    constructor(ip: string, port: number);
  }
} 
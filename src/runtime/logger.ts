import { createWriter, type Writer } from '@ludiars/vestigium';
export function createLogger(logsDir: string): Writer {
  return createWriter({ serviceCode: 'elegantia', logsDir });
}

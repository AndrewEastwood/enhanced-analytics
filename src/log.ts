import { getConfig } from './config';
export const log = (...args: any[]) => {
  const config = getConfig();
  config.debug ? console.debug(...args) : void 0;
};

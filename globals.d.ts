interface Window {
  klaviyo: {
    identify(a: any): Promise<any>;
    track([a, b], [string, any]): Promise<any>;
  };
  FS: {
    identify: Function;
    anonymize: Function;
    shutdown: Function;
    log: Function;
    consent: Function;
    identifyAccount: Function;
    clearUserCookie: Function;
    setVars: Function;
    setUserVars: Function;
    event: Function;
  };
  fbq?(fn: string, event: string, attr?: any, modif?: { eventID: string });
  _fbq?(fn: string, event: string, attr?: any, modif?: { eventID: string });
}

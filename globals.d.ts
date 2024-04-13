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
  fbq?(
    fn: string,
    event: string,
    attr?: any,
    modif?: { eventID?: string; user_data?: any }
  );
  _fbq?(
    fn: string,
    event: string,
    attr?: any,
    modif?: { eventID?: string; user_data?: any }
  );
  gtag?();
  ttq: {
    page?(): Promise<void>;
    track?(e: string, a: any): Promise<void>;
    identify?(a: any): Promise<void>;
    instances?(a: any): Promise<void>;
    debug?(a: any): Promise<void>;
    on?(a: any): Promise<void>;
    off?(a: any): Promise<void>;
    once?(a: any): Promise<void>;
    ready?(a: any): Promise<void>;
    alias?(a: any): Promise<void>;
    group?(a: any): Promise<void>;
    enableCookie?(a: any): Promise<void>;
    disableCookie?(a: any): Promise<void>;
  };
}

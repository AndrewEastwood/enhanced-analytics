interface Window {
  klaviyo: {
    identify(a: any): Promise<any>;
    track([a, b], [string, any]): Promise<any>;
  };
}

import { Request } from "express";
import { defaultsDeep } from "lodash";
import { TDataBasket, TDataOrder, TDataPage, TDataProduct, TDataProfile, TSettings } from "./shared";

let _config:TSettings|null = null;

export const getDefaultParams = (_store:Partial<TSettings>):TSettings => ({
  absoluteURL: '/',
  currency: 'usd',
  affiliation: 'WebSite',
  defaultCatalogName: 'Search Results',
  defaultBasketName: 'Basket',
  dataLayerName: 'dataLayer',
  serverAnalytics: {
    fb: {
      enabled: false,
      sdk: null,
      pixelId: null,
      testCode: null,
      token: null,
    },
    klaviyo: {
      enabled: false,
      sdk: null,
      siteId: null,
      token: null,
    },
    testing: false,
    links: {
      ...(_store?.serverAnalytics?.links || {}),
      resetPassword: '',
    },
    resolvers: {
      ...(_store?.serverAnalytics?.resolvers || {}),
      userData: _store?.serverAnalytics?.resolvers?.userData || ((r:Request) => (r['user'] || null) as TDataProfile),
      serverEventUUID: (r:Request) => Date.now(),
    },
  },
  map: {
    ...(_store.map || {}),
    product: _store.map?.product || ((p) => p as TDataProduct),
    order: _store.map?.order || ((p) => p as TDataOrder),
    basket: _store.map?.basket || ((p) => p as TDataBasket),
    profile: _store.map?.profile || ((p) => p as TDataProfile),
    page: _store.map?.page || ((p) => p as TDataPage),
  },
});

export const configureAnalytics = (_store:Partial<TSettings>):TSettings => {
  _config = defaultsDeep(_store, getDefaultParams(_store)) as TSettings;
  return _config;
}

export const getConfig = () => {
  return _config;
}

export const getResolvers = () => {
  return Object.assign({}, _config?.serverAnalytics.resolvers || {});
}

export const getMappings = () => {
  return Object.assign({}, _config?.map || {});
}


import { Request } from 'express';
import { defaultsDeep } from 'lodash';
import { installBrowserTrackers } from './apiTracker/installers';
import {
  type T_EA_DataBasket,
  type T_EA_DataOrder,
  type T_EA_DataPage,
  type T_EA_DataProduct,
  type T_EA_DataProfile,
  type T_EA_DataSession,
  type TSettings,
} from './shared';

const _config: TSettings = {} as TSettings;

const config = new Proxy<TSettings>(_config, {
  set(target: TSettings, p: keyof TSettings, newValue) {
    const r = Reflect.set(target, p, newValue);
    // temprory solution....
    installBrowserTrackers(target);
    return r;
  },
  get(target, p) {
    return target[p];
  },
});

export const getDefaultParams = (_store: Partial<TSettings>): TSettings => ({
  _configured: false,
  absoluteURL: '/',
  currency: 'usd',
  affiliation: 'WebSite',
  debug: false,
  integrations: {
    fb: {
      enabled: false,
      sdk: null,
      pixelId: null,
      testCode: null,
      token: null,
      hashUser: false,
    },
    klaviyo: {
      enabled: false,
      siteId: null,
      token: null,
      sdk: null,
    },
    fullstory: {
      enabled: false,
      orgId: null,
    },
    ga: {
      enabled: false,
      trackId: null,
      defaultCatalogName: 'Search Results',
      defaultBasketName: 'Basket',
      dataLayerName: 'dataLayer',
    },
  },
  links: {
    ...(_store?.links || {}),
    resetPassword: '',
  },
  resolvers: {
    ...(_store.resolvers || {}),
    identityStore: void 0,
    session: _store?.resolvers?.session || (() => ({} as T_EA_DataSession)),
    eventUUID: _store.resolvers?.eventUUID ?? (() => Date.now()),
    product: _store.resolvers?.product || ((p) => p as T_EA_DataProduct),
    order: _store.resolvers?.order || ((p) => p as T_EA_DataOrder),
    basket: _store.resolvers?.basket || ((p) => p as T_EA_DataBasket),
    profile: _store.resolvers?.profile || ((p) => p as T_EA_DataProfile | null),
    page: _store.resolvers?.page || ((p) => p as T_EA_DataPage),
  },
});

export const configureAnalytics = (_store: Partial<TSettings>): TSettings => {
  const mergedConfig = defaultsDeep(
    {
      _configured: true,
    },
    _store,
    getDefaultParams(_store)
  ) as TSettings;
  Object.assign(config, mergedConfig);
  return config;
};

type TSettingsMiddleware = TSettings & {
  resolvers: (req: Request) => TSettings['resolvers'];
};
export const analyticsMiddleware =
  (options: Partial<TSettingsMiddleware>) => (req: Request, res, next) => {
    req.app.locals.evtUuid = Date.now().toString(32);
    // identify a user by a key in the body of the request
    // req.app.locals.customer = req.body[
    //   options.integrations?.userIdentification?.reqBodyKey ?? '__not_set__'
    // ]
    //   ? req.body
    //   : req.app.locals.customer;
    const resolvers = options.resolvers?.(req);
    configureAnalytics({ ...options, resolvers });
    // expose the latest event uuid
    // options.integrations?.evtUuid?.exposeInResponse &&
    // options.integrations?.evtUuid?.cookieName
    //   ? res.cookie(
    //       options.integrations?.evtUuid.cookieName,
    //       req.app.locals.evtUuid,
    //       {
    //         secure: true,
    //         httpOnly: true,
    //       }
    //     )
    //   : void 0;
    next();
  };

export const getConfig = () => {
  return config;
};

export const getResolvers = () => {
  return Object.assign({}, _config?.resolvers || {});
};

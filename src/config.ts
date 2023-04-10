import { Request } from 'express';
import { defaultsDeep } from 'lodash';
import { installBrowserTrackers } from './apiTracker/installers';
import {
  T_EA_DataBasket,
  T_EA_DataOrder,
  T_EA_DataPage,
  T_EA_DataProduct,
  T_EA_DataProfile,
  T_EA_DataSession,
  TSettings,
} from './shared';

const _config: TSettings = {} as TSettings;

const config = new Proxy<TSettings>(_config, {
  set(target: TSettings, p: keyof TSettings, newValue) {
    target[p] = newValue;
    p === 'integrations' && newValue ? installBrowserTrackers(config) : void 0;
    return true;
  },
});

export const getDefaultParams = (_store: Partial<TSettings>): TSettings => ({
  absoluteURL: '/',
  currency: 'usd',
  affiliation: 'WebSite',
  defaultCatalogName: 'Search Results',
  defaultBasketName: 'Basket',
  dataLayerName: 'dataLayer',
  integrations: {
    fb: {
      enabled: false,
      sdk: null,
      pixelId: null,
      testCode: null,
      token: null,
    },
    klaviyo: {
      enabled: false,
      siteId: null,
      token: null,
      sdk:
        _store.integrations?.klaviyo?.siteId &&
        document &&
        !_store.integrations.klaviyo.sdk
          ? {
              Events: {
                _unprocessed: [],
                createEvent(body: any) {
                  this._unprocessed = this._unprocessed || [];
                  this._unprocessed.push(body);
                  this._unprocessed = this._unprocessed
                    .filter((b) => !(b instanceof Promise))
                    .map((b) =>
                      window.klaviyo
                        ? window.klaviyo.track(
                            body?.data?.attributes?.metric?.name,
                            body?.data?.attributes?.properties
                          )
                        : b
                    );
                  return Promise.allSettled(
                    this._unprocessed?.filter((v) => v instanceof Promise) ?? []
                  );
                },
              },
              Profiles: {
                _unprocessed: [],
                getProfiles(filter: Record<string, any>) {
                  return Promise.resolve({ body: { data: [] } });
                },
                createProfile(body: any) {
                  this._unprocessed = this._unprocessed || [];
                  this._unprocessed.push(body);
                  this._unprocessed = this._unprocessed
                    .filter((b) => !(b instanceof Promise))
                    .map((b) =>
                      window.klaviyo
                        ? window.klaviyo.identify(b?.data?.attributes ?? {})
                        : b
                    );
                  return Promise.allSettled(
                    this._unprocessed?.filter((v) => v instanceof Promise) ?? []
                  );
                },
              },
            }
          : null,
    },
    fullstory: {
      enabled: false,
      orgId: null,
    },
    ga: {
      enabled: false,
      trackId: null,
    },
    testing: false,
    evtUuid: {
      cookieName: 'evt-uuid',
      exposeInResponse: true,
    },
    userIdentification: {
      reqBodyKey: 'email',
    },
  },
  links: {
    ...(_store?.links || {}),
    resetPassword: '',
  },
  resolvers: {
    ...(_store.resolvers || {}),
    session: _store?.resolvers?.session || (() => ({} as T_EA_DataSession)),
    eventUUID: _store.resolvers?.eventUUID ?? ((r?: Request) => Date.now()),
    product: _store.resolvers?.product || ((p) => p as T_EA_DataProduct),
    order: _store.resolvers?.order || ((p) => p as T_EA_DataOrder),
    basket: _store.resolvers?.basket || ((p) => p as T_EA_DataBasket),
    profile: _store.resolvers?.profile || ((p) => p as T_EA_DataProfile | null),
    page: _store.resolvers?.page || ((p) => p as T_EA_DataPage),
  },
});

export const configureAnalytics = (_store: Partial<TSettings>): TSettings => {
  const mergedConfig = defaultsDeep(
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
    req.app.locals.customer = req.body[
      options.integrations?.userIdentification?.reqBodyKey ?? '__not_set__'
    ]
      ? req.body
      : req.app.locals.customer;
    const resolvers = options.resolvers?.(req);
    configureAnalytics({ ...options, resolvers });
    options.integrations?.evtUuid?.exposeInResponse &&
    options.integrations?.evtUuid?.cookieName
      ? res.cookie(
          options.integrations?.evtUuid.cookieName,
          req.app.locals.evtUuid,
          {
            secure: true,
            httpOnly: true,
          }
        )
      : void 0;
    next();
  };

export const getConfig = () => {
  return Reflect.ownKeys(config).length > 0 ? config : null;
};

export const getResolvers = () => {
  return Object.assign({}, _config?.resolvers || {});
};

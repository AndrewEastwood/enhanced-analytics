import { Request } from 'express';
import { defaultsDeep } from 'lodash';
import {
  TDataBasket,
  TDataOrder,
  TDataPage,
  TDataProduct,
  TDataProfile,
  TDataSession,
  TSettings,
} from './shared';

let _config: TSettings | null = null;

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
                createEvent(body: any) {
                  // @ts-ignore
                  return window.klaviyo.track(
                    body.data.attributes.metric.name,
                    body.data.attributes.properties
                  );
                },
              },
              Profiles: {
                createProfile(body: any) {
                  // @ts-ignore
                  return window.klaviyo.identify(body.data.attributes);
                },
              },
            }
          : null,
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
    session: _store?.resolvers?.session || (() => ({} as TDataSession)),
    eventUUID: _store.resolvers?.eventUUID ?? ((r?: Request) => Date.now()),
    product: _store.resolvers?.product || ((p) => [p] as TDataProduct[]),
    order: _store.resolvers?.order || ((p) => p as TDataOrder),
    basket: _store.resolvers?.basket || ((p) => p as TDataBasket),
    profile: _store.resolvers?.profile || ((p) => p as TDataProfile | null),
    page: _store.resolvers?.page || ((p) => p as TDataPage),
  },
});

export const configureAnalytics = (_store: Partial<TSettings>): TSettings => {
  _config = defaultsDeep(_store, getDefaultParams(_store)) as TSettings;
  return _config;
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
  return _config;
};

export const getResolvers = () => {
  return Object.assign({}, _config?.resolvers || {});
};

// export const getMappings = () => {
//   return Object.assign({}, _config?.map || {});
// }

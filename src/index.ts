import { Request } from "express";
import { defaults } from "lodash";
import apiTracker from "./apiTracker"
import { getEEC } from "./ecommerce";
import { ETrackers, TDataBasket, TDataOrder, TDataPage, TDataProduct, TDataProfile, TSettings } from "./types";
import * as trackUtils from './utils';

export const useAnalytics = (_store:Partial<TSettings>) => {
  const getDefaultParams = ():TSettings => ({
    absoluteURL: '/',
    currency: 'usd',
    affiliation: 'WebSite',
    defaultCatalogName: 'Search Results',
    defaultBasketName: 'Basket',
    dataLayerName: 'dataLayer',
    analytics: {
      fb: {
        enabled: false,
        pixelId: null,
        testCode: null,
        token: null,
      },
      klaviyo: {
        enabled: false,
        siteId: null,
        token: null,
      },
      testing: false,
    },
    links: {
      ...(_store.links || {}),
      resetPassword: '',
    },
    resolvers: {
      ...(_store.resolvers || {}),
      userData: _store.resolvers?.userData || ((r:Request) => (r['user'] || null) as TDataProfile),
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
  const store = defaults(getDefaultParams(), _store);
  const {
    map: {
      product = (p) => p as TDataProduct,
      order = (p) => p as TDataOrder,
      basket = (p) => p as TDataBasket,
      profile = (p) => p as TDataProfile,
      page = (p) => p as TDataPage,
    },
  } = store;

  return {
    withPage: (payload:TDataPage|Record<string,any>) => {
      const v = page(payload);
      return {
        sendTo: {
          all: apiTracker(store).page(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true, }).page(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true, }).page(v),
          [ETrackers.GoogleEEC]: apiTracker(store, { geec: true, }).page(v),
        },
      };
    },
    withProfile: (payload:TDataProfile|Record<string,any>) => {
      const v = profile(payload);
      return {
        sendTo: {
          all: apiTracker(store).profile(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true, }).profile(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true, }).profile(v),
          [ETrackers.GoogleEEC]: apiTracker(store, { geec: true, }).profile(v),
        },
      };
    },
    withCatalog: (payload:(TDataProduct|Record<string,any>)[]) => {
      const v = payload.map(product);
      return {
        sendToServer: {
          all: apiTracker(store).catalog(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true, }).catalog(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true, }).catalog(v),
        },
        data: trackUtils.Catalog(store, v),
        events: getEEC(store).groups.catalog,
      }
    },
    withBasket: (payload:TDataBasket|Record<string,any>) => {
      const v = basket(payload);
      return {
        sendToServer: {
          all: apiTracker(store).basket(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true, }).basket(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true, }).basket(v),
        },
        data: trackUtils.Basket(store, v),
        events: getEEC(store).groups.basket,
      }
    },
    withOrder: (payload:TDataOrder|Record<string,any>) => {
      const v = order(payload);
      return {
        sendToServer: {
          all: apiTracker(store).order(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true, }).order(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true, }).order(v),
        },
        data: trackUtils.Order(store, v),
        events: getEEC(store).groups.order(v)
      };
    },
  }
};

export default useAnalytics;

// useAnalytics({}).withPurchase({}).sendToServer.klaviyo.({});
// useAnalytics({}).withOrder({}).data.Purchase.getEECDataLayer()
// useAnalytics({}).withOrder({}).events.getEECPurchased().when().push()
// useAnalytics({}).withCheckout({}).events({}).getEECCheckoutList()

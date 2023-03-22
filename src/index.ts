import { getConfig } from './config';
import apiTracker from './apiTracker';
import { getEEC } from './ecommerce';
import {
  ETrackers,
  TDataBasket,
  TDataOrder,
  TDataPage,
  TDataProduct,
  TDataProfile,
} from './shared';
import * as trackUtils from './utils';

export * from './apiTracker';
export * from './ecommerce';
export * from './utils';
export {
  TSettings,
  TDataAddress,
  TDataBasket,
  TDataOrder,
  TDataPage,
  TDataProduct,
  TDataProfile,
  TEECParams,
  TEvtType,
} from './shared';

export * from './config';

export const useAnalytics = () => {
  return {
    withPage: (payload: TDataPage | Record<string, any> | null = null) => {
      const store = getConfig();
      if (store === null) {
        throw 'Invoke configureAnalytics first and provide configuration';
      }
      if (!store.resolvers?.page) {
        throw '[store.resolvers.page] is not defined';
      }
      const v = store.resolvers?.page(payload);
      return {
        sendToServer: {
          all: apiTracker(store).page(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true }).page(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true }).page(v),
        },
        data: trackUtils.Page(store),
        events: getEEC(store).groups.general(),
      };
    },
    withProfile: (
      payload: TDataProfile | Record<string, any> | null = null
    ) => {
      const store = getConfig();
      if (store === null) {
        throw 'Invoke configureAnalytics first and provide configuration';
      }
      if (!store.resolvers?.profile) {
        throw '[store.resolvers.profile] is not defined';
      }
      const v = store.resolvers?.profile(payload);
      return {
        sendToServer: {
          all: apiTracker(store).profile(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true }).profile(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true }).profile(v),
        },
        data: trackUtils.Profile(store),
        events: getEEC(store).groups.profile(),
      };
    },
    withCatalog: (
      payload: (TDataProduct | Record<string, any>)[] | null = null
    ) => {
      const store = getConfig();
      if (store === null) {
        throw 'Invoke configureAnalytics first and provide configuration';
      }
      if (!store.resolvers?.product) {
        throw '[store.resolvers.product] is not defined';
      }
      const v = payload?.flatMap(store.resolvers?.product) ?? [];
      return {
        sendToServer: {
          all: apiTracker(store).catalog(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true }).catalog(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true }).catalog(v),
        },
        data: trackUtils.Catalog(store, v),
        events: getEEC(store).groups.catalog(v),
      };
    },
    withBasket: (payload: TDataBasket | Record<string, any> | null = null) => {
      const store = getConfig();
      if (store === null) {
        throw 'Invoke configureAnalytics first and provide configuration';
      }
      if (!store.resolvers?.basket) {
        throw '[store.resolvers.basket] is not defined';
      }
      const v = store.resolvers?.basket(payload);
      return {
        sendToServer: {
          all: apiTracker(store).basket(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true }).basket(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true }).basket(v),
        },
        data: trackUtils.Basket(store, v),
        events: getEEC(store).groups.basket(v),
      };
    },
    withOrder: (payload: TDataOrder | Record<string, any> | null) => {
      const store = getConfig();
      if (store === null) {
        throw 'Invoke configureAnalytics first and provide configuration';
      }
      if (!store.resolvers?.order) {
        throw '[store.resolvers.order] is not defined';
      }
      const v = store.resolvers?.order(payload);
      return {
        sendToServer: {
          all: apiTracker(store).order(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true }).order(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true }).order(v),
        },
        data: trackUtils.Order(store, v),
        events: getEEC(store).groups.order(v),
      };
    },
  };
};

export default useAnalytics;

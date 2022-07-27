import { getConfig } from "./config";
import apiTracker from "./apiTracker"
import { getEEC } from "./ecommerce";
import { ETrackers, TDataBasket, TDataOrder, TDataPage, TDataProduct, TDataProfile } from "./shared";
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
  TEvtType
} from './shared';

export * from './config';

export const useAnalytics = () => {

  // const _config = getConfig();

  // if (_config === null) {
  //   throw "Invoke configureAnalytics first and provide configuration";
  // };

  // const store = _config!;
  // const {
  //   map: {
  //     product = (p) => p,
  //     order = (p) => p,
  //     basket = (p) => p,
  //     profile = (p) => p,
  //     page = (p) => p,
  //   },
  // } = store;

  return {
    withPage: (payload:TDataPage|Record<string,any>) => {
      const store = getConfig();
      if (store === null) {
        throw "Invoke configureAnalytics first and provide configuration";
      };
      if (!store.map.page) {
        throw "[store.map.page] is not defined";
      };
      const v = store.map.page(payload);
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
      const store = getConfig();
      if (store === null) {
        throw "Invoke configureAnalytics first and provide configuration";
      };
      if (!store.map.profile) {
        throw "[store.map.profile] is not defined";
      };
      const v = store.map.profile(payload);
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
      const store = getConfig();
      if (store === null) {
        throw "Invoke configureAnalytics first and provide configuration";
      };
      if (!store.map.product) {
        throw "[store.map.product] is not defined";
      };
      const v = payload.map(store.map.product);
      return {
        sendToServer: {
          all: apiTracker(store).catalog(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true, }).catalog(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true, }).catalog(v),
        },
        data: trackUtils.Catalog(store, v),
        events: getEEC(store).groups.catalog(v),
      }
    },
    withBasket: (payload:TDataBasket|Record<string,any>) => {
      const store = getConfig();
      if (store === null) {
        throw "Invoke configureAnalytics first and provide configuration";
      };
      if (!store.map.basket) {
        throw "[store.map.basket] is not defined";
      };
      const v = store.map.basket(payload);
      return {
        sendToServer: {
          all: apiTracker(store).basket(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true, }).basket(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true, }).basket(v),
        },
        data: trackUtils.Basket(store, v),
        events: getEEC(store).groups.basket(v),
      }
    },
    withOrder: (payload:TDataOrder|Record<string,any>) => {
      const store = getConfig();
      if (store === null) {
        throw "Invoke configureAnalytics first and provide configuration";
      };
      if (!store.map.order) {
        throw "[store.map.order] is not defined";
      };
      const v = store.map.order(payload);
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

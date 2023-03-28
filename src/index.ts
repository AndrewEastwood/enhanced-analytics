import { getConfig } from './config';
import apiTracker from './apiTracker';
import { getEEC } from './ecommerce';
import {
  ETrackers,
  T_EA_DataBasket,
  T_EA_DataOrder,
  T_EA_DataPage,
  T_EA_DataProduct,
  T_EA_DataProfile,
  T_EA_DataCustomEvent,
} from './shared';
import * as trackUtils from './utils';
import {
  isNativePayloadBasket,
  isNativePayloadOrder,
  isNativePayloadPage,
  isNativePayloadProducts,
  isNativePayloadProfile,
} from './guards';
import { useState } from 'react';

export * from './apiTracker';
export * from './ecommerce';
export * from './utils';
export {
  TSettings,
  T_EA_DataAddress as TDataAddress,
  T_EA_DataBasket as TDataBasket,
  T_EA_DataOrder as TDataOrder,
  T_EA_DataPage as TDataPage,
  T_EA_DataProduct as TDataProduct,
  T_EA_DataProfile as TDataProfile,
  TEECParams,
  TEvtType,
} from './shared';

export * from './config';
export * from './guards';

export const useAnalytics = () => {
  return {
    config: getConfig(),
    withEvent: (name: string, attributes?: Record<string, any>) => {
      const store = getConfig();
      if (store === null) {
        throw 'Invoke configureAnalytics first and provide configuration';
      }
      const v: T_EA_DataCustomEvent = {
        name,
        attributes,
      };
      return {
        sendToServer: {
          all: apiTracker(store).events(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true }).events(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true }).events(v),
          [ETrackers.FullStory]: apiTracker(store, { fullstory: true }).events(
            v
          ),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce(
              (r, t) => ({ ...r, [t]: true }),
              {} as Partial<Record<ETrackers, boolean>>
            );
            return apiTracker(store, c).events(v);
          },
        },
        // data: trackUtils.Page(store),
        // events: getEEC(store).groups.general(),
      };
    },
    withPage: (payload: T_EA_DataPage | Record<string, any> | null = null) => {
      const store = getConfig();
      if (store === null) {
        throw 'Invoke configureAnalytics first and provide configuration';
      }

      const isNative = isNativePayloadPage(payload);
      if (!isNative && !store.resolvers?.page) {
        throw '[store.resolvers.page] is not defined';
      }

      const v = isNative ? payload : store.resolvers?.page?.(payload) ?? null;

      if (!v) {
        throw 'Page data is not defined';
      }

      return {
        sendToServer: {
          all: apiTracker(store).page(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true }).page(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true }).page(v),
          [ETrackers.FullStory]: apiTracker(store, { fullstory: true }).page(v),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce(
              (r, t) => ({ ...r, [t]: true }),
              {} as Partial<Record<ETrackers, boolean>>
            );
            return apiTracker(store, c).page(v);
          },
        },
        data: trackUtils.Page(store),
        events: getEEC(store).groups.general(),
      };
    },
    withProfile: (
      payload: T_EA_DataProfile | Record<string, any> | null = null
    ) => {
      const store = getConfig();
      if (store === null) {
        throw 'Invoke configureAnalytics first and provide configuration';
      }

      const isNative = isNativePayloadProfile(payload);
      if (!isNative && !store.resolvers?.profile) {
        throw '[store.resolvers.profile] is not defined';
      }

      const v = isNative
        ? payload
        : store.resolvers?.profile?.(payload) ?? null;

      // user can be null, which means it is anonymous

      return {
        sendToServer: {
          all: apiTracker(store).profile(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true }).profile(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true }).profile(v),
          [ETrackers.FullStory]: apiTracker(store, { fullstory: true }).profile(
            v
          ),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce(
              (r, t) => ({ ...r, [t]: true }),
              {} as Partial<Record<ETrackers, boolean>>
            );
            return apiTracker(store, c).profile(v);
          },
        },
        data: trackUtils.Profile(store),
        events: getEEC(store).groups.profile(),
      };
    },
    withCatalog: (
      payload: (T_EA_DataProduct | Record<string, any>)[] | null = null
    ) => {
      const store = getConfig();
      if (store === null) {
        throw 'Invoke configureAnalytics first and provide configuration';
      }
      // if (!store.resolvers?.product) {
      //   throw '[store.resolvers.product] is not defined';
      // }

      const isNative = isNativePayloadProducts(payload);
      if (!isNative && !store.resolvers?.product) {
        throw '[store.resolvers.profile] is not defined';
      }

      const v = isNative
        ? payload
        : store.resolvers?.product?.(payload) ?? null;

      if (!v) {
        throw 'Product data is not defined';
      }
      // const v = payload?.flatMap(store.resolvers?.product) ?? [];
      return {
        sendToServer: {
          all: apiTracker(store).catalog(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true }).catalog(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true }).catalog(v),
          [ETrackers.FullStory]: apiTracker(store, { fullstory: true }).catalog(
            v
          ),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce(
              (r, t) => ({ ...r, [t]: true }),
              {} as Partial<Record<ETrackers, boolean>>
            );
            return apiTracker(store, c).catalog(v);
          },
        },
        data: trackUtils.Catalog(store, v),
        events: getEEC(store).groups.catalog(v),
      };
    },
    withBasket: (
      payload: T_EA_DataBasket | Record<string, any> | null = null
    ) => {
      const store = getConfig();
      if (store === null) {
        throw 'Invoke configureAnalytics first and provide configuration';
      }
      if (!store.resolvers?.basket) {
        throw '[store.resolvers.basket] is not defined';
      }
      // const v = store.resolvers?.basket(payload);
      const isNative = isNativePayloadBasket(payload);
      if (!isNative && !store.resolvers?.basket) {
        throw '[store.resolvers.basket] is not defined';
      }

      const v = isNative ? payload : store.resolvers?.basket?.(payload) ?? null;
      if (!v) {
        throw 'Basket data is not defined';
      }

      return {
        sendToServer: {
          all: apiTracker(store).basket(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true }).basket(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true }).basket(v),
          [ETrackers.FullStory]: apiTracker(store, { fullstory: true }).basket(
            v
          ),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce(
              (r, t) => ({ ...r, [t]: true }),
              {} as Partial<Record<ETrackers, boolean>>
            );
            return apiTracker(store, c).basket(v);
          },
        },
        data: trackUtils.Basket(store, v),
        events: getEEC(store).groups.basket(v),
      };
    },
    withOrder: (payload: T_EA_DataOrder | Record<string, any> | null) => {
      const store = getConfig();
      if (store === null) {
        throw 'Invoke configureAnalytics first and provide configuration';
      }
      // if (!store.resolvers?.order) {
      //   throw '[store.resolvers.order] is not defined';
      // }
      // const v = store.resolvers?.order(payload);
      const isNative = isNativePayloadOrder(payload);
      if (!isNative && !store.resolvers?.order) {
        throw '[store.resolvers.order] is not defined';
      }

      const v = isNative ? payload : store.resolvers?.order?.(payload) ?? null;
      if (!v) {
        throw 'Order data is not defined';
      }
      return {
        sendToServer: {
          all: apiTracker(store).order(v),
          [ETrackers.Facebook]: apiTracker(store, { fb: true }).order(v),
          [ETrackers.Klaviyo]: apiTracker(store, { klaviyo: true }).order(v),
          [ETrackers.FullStory]: apiTracker(store, { fullstory: true }).order(
            v
          ),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce(
              (r, t) => ({ ...r, [t]: true }),
              {} as Partial<Record<ETrackers, boolean>>
            );
            return apiTracker(store, c).order(v);
          },
        },
        data: trackUtils.Order(store, v),
        events: getEEC(store).groups.order(v),
      };
    },
  };
};

export default useAnalytics;

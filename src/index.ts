import { configureAnalytics, getConfig } from './config';
import apiTracker, { getEEC } from './apiTracker';
import { resolveUser } from './apiTracker/identity';
import { TSettings } from './shared';
import { installBrowserTrackers } from './apiTracker/installers';
import {
  ETrackers,
  T_EA_DataBasket,
  T_EA_DataOrder,
  T_EA_DataPage,
  T_EA_DataProduct,
  T_EA_DataProfile,
  T_EA_DataCustomEvent,
} from './shared';
import {
  isNativePayloadBasket,
  isNativePayloadOrder,
  isNativePayloadPage,
  isNativePayloadProducts,
  isNativePayloadProfile,
} from './guards';

export * from './apiTracker';
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

export const useAnalytics = (c?: TSettings) => {
  c ? configureAnalytics(c) : void 0;
  // temporary solution
  c ? installBrowserTrackers(c) : void 0;
  return {
    config: getConfig(),
    identify: (user: T_EA_DataProfile) => {
      const u = resolveUser(user);
      return u && u.email;
    },
    utils: {
      observeItemsOnScreen(
        elSelector: string,
        whenFound: (e: IntersectionObserverEntry) => void
      ) {
        // Register IntersectionObserver
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            entry.intersectionRatio > 0 ? whenFound(entry) : void 0;
          });
        });

        setTimeout(() => {
          // Declares what to observe, and observes its properties.
          const boxElList = document.querySelectorAll(elSelector);
          boxElList.forEach((el) => {
            io.observe(el);
          });
        });
      },
    },
    withMisc: (name: string, attributes?: Record<string, any>) => {
      const store = getConfig();
      if (!store._configured) {
        throw '[EA] Invoke configureAnalytics first and provide configuration';
      }
      const v: T_EA_DataCustomEvent = {
        name,
        attributes,
      };
      return {
        s2s: {
          all: () => apiTracker(store, { server: true }).misc(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, {
              fb: true,
              server: true,
            }).misc(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, {
              klaviyo: true,
              server: true,
            }).misc(v),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce((r, t) => ({ ...r, [t]: true }), {
              server: true,
            } as Partial<Record<ETrackers, boolean>>);
            return apiTracker(store, c).misc(v);
          },
        },
        events: {
          [ETrackers.GoogleAnalytics]: () => getEEC(store).misc(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, { klaviyo: true }).misc(v),
          [ETrackers.FullStory]: () =>
            apiTracker(store, { fullstory: true }).misc(v),
          [ETrackers.Facebook]: () => apiTracker(store, { fb: true }).misc(v),
        },
      };
    },
    withPage: (payload: T_EA_DataPage | Record<string, any> | null = null) => {
      const store = getConfig();
      if (!store._configured) {
        throw '[EA] Invoke configureAnalytics first and provide configuration';
      }

      const isNative = isNativePayloadPage(payload);
      if (!isNative && !store.resolvers?.page) {
        throw '[EA] [store.resolvers.page] is not defined';
      }

      const v = isNative ? payload : store.resolvers?.page?.(payload) ?? null;

      if (!v) {
        throw '[EA] Page data is not defined';
      }

      return {
        s2s: {
          all: () => apiTracker(store, { server: true }).page(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, {
              fb: true,
              server: true,
            }).page(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, {
              klaviyo: true,
              server: true,
            }).page(v),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce((r, t) => ({ ...r, [t]: true }), {
              server: true,
            } as Partial<Record<ETrackers, boolean>>);
            return apiTracker(store, c).page(v);
          },
        },
        events: {
          [ETrackers.GoogleAnalytics]: () => getEEC(store).page(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, { klaviyo: true }).page(v),
          [ETrackers.FullStory]: () =>
            apiTracker(store, { fullstory: true }).page(v),
          [ETrackers.Facebook]: () => apiTracker(store, { fb: true }).page(v),
        },
      };
    },
    withProfile: (
      payload: T_EA_DataProfile | Record<string, any> | null = null
    ) => {
      const store = getConfig();
      if (!store._configured) {
        throw '[EA] Invoke configureAnalytics first and provide configuration';
      }

      const isNative = isNativePayloadProfile(payload);
      if (!isNative && !store.resolvers?.profile) {
        throw '[EA] [store.resolvers.profile] is not defined';
      }

      const v = isNative ? resolveUser(payload) : null;
      if (!v) {
        throw '[EA] User data is not defined';
      }

      return {
        s2s: {
          all: () => apiTracker(store, { server: true }).profile(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, {
              fb: true,
              server: true,
            }).profile(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, {
              klaviyo: true,
              server: true,
            }).profile(v),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce((r, t) => ({ ...r, [t]: true }), {
              server: true,
            } as Partial<Record<ETrackers, boolean>>);
            return apiTracker(store, c).profile(v);
          },
        },
        events: {
          [ETrackers.GoogleAnalytics]: () => getEEC(store).profile(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, { klaviyo: true }).profile(v),
          [ETrackers.FullStory]: () =>
            apiTracker(store, { fullstory: true }).profile(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, { fb: true }).profile(v),
        },
      };
    },
    withCatalog: (
      payload: (T_EA_DataProduct | Record<string, any>)[] | null = null
    ) => {
      const store = getConfig();
      if (!store._configured) {
        throw '[EA] Invoke configureAnalytics first and provide configuration';
      }

      const isNative = isNativePayloadProducts(payload);
      if (!isNative && !store.resolvers?.product) {
        throw '[EA] [store.resolvers.profile] is not defined';
      }

      const v = isNative
        ? payload
        : payload
            ?.map((p) => store.resolvers?.product?.(p))
            .filter((v): v is T_EA_DataProduct => !!v) ?? null;

      if (!v) {
        throw '[EA] Product data is not defined';
      }

      return {
        s2s: {
          all: () => apiTracker(store, { server: true }).catalog(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, {
              fb: true,
              server: true,
            }).catalog(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, {
              klaviyo: true,
              server: true,
            }).catalog(v),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce((r, t) => ({ ...r, [t]: true }), {
              server: true,
            } as Partial<Record<ETrackers, boolean>>);
            return apiTracker(store, c).catalog(v);
          },
        },
        events: {
          [ETrackers.GoogleAnalytics]: () => getEEC(store).catalog(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, { klaviyo: true }).catalog(v),
          [ETrackers.FullStory]: () =>
            apiTracker(store, { fullstory: true }).catalog(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, { fb: true }).catalog(v),
        },
      };
    },
    withBasket: (
      payload: T_EA_DataBasket | Record<string, any> | null = null
    ) => {
      const store = getConfig();
      if (!store._configured) {
        throw '[EA] Invoke configureAnalytics first and provide configuration';
      }
      if (!store.resolvers?.basket) {
        throw '[EA] [store.resolvers.basket] is not defined';
      }

      const isNative = isNativePayloadBasket(payload);
      if (!isNative && !store.resolvers?.basket) {
        throw '[EA] [store.resolvers.basket] is not defined';
      }

      const v = isNative ? payload : store.resolvers?.basket?.(payload) ?? null;
      if (!v) {
        throw '[EA] Basket data is not defined';
      }

      return {
        s2s: {
          all: () => apiTracker(store, { server: true }).basket(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, {
              fb: true,
              server: true,
            }).basket(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, {
              klaviyo: true,
              server: true,
            }).basket(v),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce((r, t) => ({ ...r, [t]: true }), {
              server: true,
            } as Partial<Record<ETrackers, boolean>>);
            return apiTracker(store, c).basket(v);
          },
        },
        events: {
          [ETrackers.GoogleAnalytics]: () => getEEC(store).basket(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, { klaviyo: true }).basket(v),
          [ETrackers.FullStory]: () =>
            apiTracker(store, { fullstory: true }).basket(v),
          [ETrackers.Facebook]: () => apiTracker(store, { fb: true }).basket(v),
        },
      };
    },
    withOrder: (
      payload: T_EA_DataOrder | Record<string, any> | null = null
    ) => {
      const store = getConfig();

      if (!store._configured) {
        throw '[EA] Invoke configureAnalytics first and provide configuration';
      }

      const isNative = isNativePayloadOrder(payload);
      if (!isNative && !store.resolvers?.order) {
        throw '[EA] [store.resolvers.order] is not defined';
      }

      const v = isNative ? payload : store.resolvers?.order?.(payload) ?? null;
      if (!v) {
        throw '[EA] Order data is not defined';
      }
      return {
        s2s: {
          all: () => apiTracker(store, { server: true }).order(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, {
              fb: true,
              server: true,
            }).order(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, {
              klaviyo: true,
              server: true,
            }).order(v),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce((r, t) => ({ ...r, [t]: true }), {
              server: true,
            } as Partial<Record<ETrackers, boolean>>);
            return apiTracker(store, c).order(v);
          },
        },
        events: {
          [ETrackers.GoogleAnalytics]: () => getEEC(store).order(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, { klaviyo: true }).order(v),
          [ETrackers.FullStory]: () =>
            apiTracker(store, { fullstory: true }).order(v),
          [ETrackers.Facebook]: () => apiTracker(store, { fb: true }).order(v),
        },
      };
    },
  };
};

export default useAnalytics;

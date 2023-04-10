import {
  ETrackers,
  T_EA_DataBasket,
  T_EA_DataOrder,
  T_EA_DataPage,
  T_EA_DataProduct,
  T_EA_DataProfile,
  TSettings,
} from '../shared';
import tFb from './facebook';
import tKlyo from './klaviyo';
import tFs from './fullstory';
import { T_EA_DataCustomEvent } from '../shared';

type TTrackers = {
  server?: boolean;
} & Partial<Record<ETrackers, boolean>>;

export * from './ga';
export {
  EA_FB_Server_RePublish_Events,
  TFbNormalizedEventPayload,
  getFbqObjectByNormalizedData,
} from './facebook';

export const apiTracker = (config: TSettings, trackers?: TTrackers) => {
  const { integrations: analytics } = config;
  const specificTracker = Object.values(ETrackers).some(
    (tk) => typeof trackers?.[tk] === 'boolean'
  );
  const useFb = specificTracker
    ? trackers?.fb && analytics?.[ETrackers.Facebook]?.enabled
    : true;
  const useKl = specificTracker
    ? trackers?.klaviyo && analytics?.[ETrackers.Klaviyo]?.enabled
    : true;
  const useFs = specificTracker
    ? trackers?.fullstory && analytics?.[ETrackers.FullStory]?.enabled
    : true;

  if (trackers?.server && globalThis.window) {
    throw '[EA:Server] Trackers cannot be run in a browser. globalThis.window is detected.';
  }

  if (!trackers?.server && !globalThis.window) {
    throw '[EA:Browser] Trackers cannot be run at server side. globalThis.window is not accessible.';
  }

  const trackTransactionRefund = (order: T_EA_DataOrder) => async () => {
    const r = [
      useFb ? tFb(config).trackTransactionRefund : null,
      useKl ? tKlyo(config).trackTransactionRefund : null,
      useFs ? tFs(config).trackTransactionRefund : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackTransactionCancel = (order: T_EA_DataOrder) => async () => {
    const r = [
      useFb ? tFb(config).trackTransactionCancel : null,
      useKl ? tKlyo(config).trackTransactionCancel : null,
      useFs ? tFs(config).trackTransactionCancel : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackTransactionFulfill = (order: T_EA_DataOrder) => async () => {
    const r = [
      useFb ? tFb(config).trackTransactionFulfill : null,
      useKl ? tKlyo(config).trackTransactionFulfill : null,
      useFs ? tFs(config).trackTransactionFulfill : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackTransaction = (order: T_EA_DataOrder) => async () => {
    const r = [
      useFb ? tFb(config).trackTransaction : null,
      useKl ? tKlyo(config).trackTransaction : null,
      useFs ? tFs(config).trackTransaction : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackProductAddToCart = (basket: T_EA_DataBasket) => async () => {
    const r = [
      useFb ? tFb(config).trackProductAddToCart : null,
      useKl ? tKlyo(config).trackProductAddToCart : null,
      useFs ? tFs(config).trackProductAddToCart : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  const trackProductRemoveFromCart = (basket: T_EA_DataBasket) => async () => {
    const r = [
      useFb ? tFb(config).trackProductRemoveFromCart : null,
      useKl ? tKlyo(config).trackProductRemoveFromCart : null,
      useFs ? tFs(config).trackProductRemoveFromCart : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  const trackProductsItemView = (products: T_EA_DataProduct[]) => async () => {
    const r = [
      useFb ? tFb(config).trackProductsItemView : null,
      useKl ? tKlyo(config).trackProductsItemView : null,
      useFs ? tFs(config).trackProductsItemView : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(products));
    return await Promise.allSettled(r);
  };

  const trackProductItemView = (product: T_EA_DataProduct) => async () => {
    const r = [
      useFb ? tFb(config).trackProductItemView : null,
      useKl ? tKlyo(config).trackProductItemView : null,
      useFs ? tFs(config).trackProductItemView : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(product));
    return await Promise.allSettled(r);
  };

  const trackPageView = (page: T_EA_DataPage) => async () => {
    const r = [
      useFb ? tFb(config).trackPageView : null,
      useKl ? tKlyo(config).trackPageView : null,
      useFs ? tFs(config).trackPageView : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(page));
    return await Promise.allSettled(r);
  };

  const trackCustom = (event: T_EA_DataCustomEvent) => async () => {
    const r = [
      useFb ? tFb(config).trackCustom : null,
      useKl ? tKlyo(config).trackCustom : null,
      useFs ? tFs(config).trackCustom : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(event));
    return await Promise.allSettled(r);
  };

  const trackInitiateCheckout = (basket: T_EA_DataBasket) => async () => {
    const r = [
      useFb ? tFb(config).trackInitiateCheckout : null,
      useKl ? tKlyo(config).trackInitiateCheckout : null,
      useFs ? tFs(config).trackInitiateCheckout : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  const trackSearch =
    (searchTerm: string, products: T_EA_DataProduct[]) => async () => {
      const r = [
        useFb ? tFb(config).trackSearch : null,
        useKl ? tKlyo(config).trackSearch : null,
        useFs ? tFs(config).trackSearch : null,
      ]
        .filter((v) => !!v)
        .map((v) => v!(searchTerm, products));
      return await Promise.allSettled(r);
    };

  const trackIdentify = (profile: T_EA_DataProfile | null) => async () => {
    const r = [
      useFb ? tFb(config).trackIdentify : null,
      useKl ? tKlyo(config).trackIdentify : null,
      useFs ? tFs(config).trackIdentify : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(profile));
    return await Promise.allSettled(r);
  };

  const trackNewProfile = (profile: T_EA_DataProfile | null) => async () => {
    const r = [
      useFb ? tFb(config).trackNewProfile : null,
      useKl ? tKlyo(config).trackNewProfile : null,
      useFs ? tFs(config).trackNewProfile : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(profile));
    return await Promise.allSettled(r);
  };

  const trackProfileResetPassword =
    (profile: T_EA_DataProfile | null) => async () => {
      const r = [
        useFb ? tFb(config).trackProfileResetPassword : null,
        useKl ? tKlyo(config).trackProfileResetPassword : null,
        useFs ? tFs(config).trackProfileResetPassword : null,
      ]
        .filter((v) => !!v)
        .map((v) => v!(profile));
      return await Promise.allSettled(r);
    };

  const trackProfileLogIn = (profile: T_EA_DataProfile | null) => async () => {
    const r = [
      useFb ? tFb(config).trackProfileLogIn : null,
      useKl ? tKlyo(config).trackProfileLogIn : null,
      useFs ? tFs(config).trackProfileLogIn : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(profile));
    return await Promise.allSettled(r);
  };

  const trackProfileLogOut = (profile: T_EA_DataProfile | null) => async () => {
    const r = [
      useFb ? tFb(config).trackProfileLogOut : null,
      useKl ? tKlyo(config).trackProfileLogOut : null,
      useFs ? tFs(config).trackProfileLogOut : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(profile));
    return await Promise.allSettled(r);
  };

  const trackProfileSubscribeNL =
    (profile: T_EA_DataProfile | null) => async () => {
      const r = [
        useFb ? tFb(config).trackProfileSubscribeNL : null,
        useKl ? tKlyo(config).trackProfileSubscribeNL : null,
        useFs ? tFs(config).trackProfileSubscribeNL : null,
      ]
        .filter((v) => !!v)
        .map((v) => v!(profile));
      return await Promise.allSettled(r);
    };

  const trackAddToWishlist = (products: T_EA_DataProduct[]) => async () => {
    const r = [
      useFb ? tFb(config).trackAddToWishlist : null,
      useKl ? tKlyo(config).trackAddToWishlist : null,
      useFs ? tFs(config).trackAddToWishlist : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(products));
    return await Promise.allSettled(r);
  };

  const trackViewBasket = (basket: T_EA_DataBasket) => async () => {
    const r = [
      useFb ? tFb(config).trackViewBasket : null,
      useKl ? tKlyo(config).trackViewBasket : null,
      useFs ? tFs(config).trackViewBasket : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  const trackAddPaymentInfo = (basket: T_EA_DataBasket) => async () => {
    const r = [
      useFb ? tFb(config).trackAddPaymentInfo : null,
      useKl ? tKlyo(config).trackAddPaymentInfo : null,
      useFs ? tFs(config).trackAddPaymentInfo : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  const trackAddShippingInfo = (basket: T_EA_DataBasket) => async () => {
    const r = [
      useFb ? tFb(config).trackAddShippingInfo : null,
      useKl ? tKlyo(config).trackAddShippingInfo : null,
      useFs ? tFs(config).trackAddShippingInfo : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  return {
    misc: (event: T_EA_DataCustomEvent) => ({
      trackCustom: trackCustom(event),
    }),
    page: (page: T_EA_DataPage) => ({
      trackPageView: trackPageView(page),
    }),
    profile: (profile: T_EA_DataProfile | null) => ({
      trackIdentify: trackIdentify(profile),
      trackNewProfile: trackNewProfile(profile),
      trackProfileResetPassword: trackProfileResetPassword(profile),
      trackProfileLogIn: trackProfileLogIn(profile),
      trackProfileLogOut: trackProfileLogOut(profile),
      trackProfileSubscribeNL: trackProfileSubscribeNL(profile),
    }),
    catalog: (products: T_EA_DataProduct[], search = '') => ({
      trackProductsItemView: trackProductsItemView(products),
      trackProductItemView: trackProductItemView(products[0]),
      trackSearch: trackSearch(search, products),
      trackAddToWishlist: trackAddToWishlist(products),
    }),
    basket: (basket: T_EA_DataBasket) => ({
      trackViewBasket: trackViewBasket(basket),
      trackProductAddToCart: trackProductAddToCart(basket),
      trackProductRemoveFromCart: trackProductRemoveFromCart(basket),
      trackInitiateCheckout: trackInitiateCheckout(basket),
      trackAddPaymentInfo: trackAddPaymentInfo(basket),
      trackAddShippingInfo: trackAddShippingInfo(basket),
    }),
    order: (order: T_EA_DataOrder) => ({
      trackTransaction: trackTransaction(order),
      trackTransactionRefund: trackTransactionRefund(order),
      trackTransactionCancel: trackTransactionCancel(order),
      trackTransactionFulfill: trackTransactionFulfill(order),
    }),
  };
};

export default apiTracker;

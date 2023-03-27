import {
  ETrackers,
  TDataBasket,
  TDataOrder,
  TDataPage,
  TDataProduct,
  TDataProfile,
  TSettings,
} from '../shared';
import tFb from './facebook';
import tKlyo from './klaviyo';
import tFs from './fullstory';
import { TDataCustomEvent } from '../shared';

type TTrackers = {} & Partial<Record<ETrackers, boolean>>;

export const apiTracker = (config: TSettings, trackers?: TTrackers) => {
  const { integrations: analytics } = config;
  const useAll = typeof trackers === 'undefined';
  const useFb =
    analytics?.[ETrackers.Facebook]?.enabled && (trackers?.fb ?? useAll);
  const useKl =
    analytics?.[ETrackers.Klaviyo]?.enabled && (trackers?.klaviyo ?? useAll);
  const useFs =
    analytics?.[ETrackers.FullStory]?.enabled &&
    (trackers?.fullstory ?? useAll);

  const trackTransactionRefund = (order: TDataOrder) => async () => {
    const r = [
      useFb ? tFb(config).trackTransactionRefund : null,
      useKl ? tKlyo(config).trackTransactionRefund : null,
      useFs ? tFs(config).trackTransactionRefund : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackTransactionCancel = (order: TDataOrder) => async () => {
    const r = [
      useFb ? tFb(config).trackTransactionCancel : null,
      useKl ? tKlyo(config).trackTransactionCancel : null,
      useFs ? tFs(config).trackTransactionCancel : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackTransactionFulfill = (order: TDataOrder) => async () => {
    const r = [
      useFb ? tFb(config).trackTransactionFulfill : null,
      useKl ? tKlyo(config).trackTransactionFulfill : null,
      useFs ? tFs(config).trackTransactionFulfill : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackTransaction = (order: TDataOrder) => async () => {
    const r = [
      useFb ? tFb(config).trackTransaction : null,
      useKl ? tKlyo(config).trackTransaction : null,
      useFs ? tFs(config).trackTransaction : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackProductAddToCart = (basket: TDataBasket) => async () => {
    const r = [
      useFb ? tFb(config).trackProductAddToCart : null,
      useKl ? tKlyo(config).trackProductAddToCart : null,
      useFs ? tFs(config).trackProductAddToCart : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  const trackProductRemoveFromCart = (basket: TDataBasket) => async () => {
    const r = [
      useFb ? tFb(config).trackProductRemoveFromCart : null,
      useKl ? tKlyo(config).trackProductRemoveFromCart : null,
      useFs ? tFs(config).trackProductRemoveFromCart : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  const trackProductsItemView = (products: TDataProduct[]) => async () => {
    const r = [
      useFb ? tFb(config).trackProductsItemView : null,
      useKl ? tKlyo(config).trackProductsItemView : null,
      useFs ? tFs(config).trackProductsItemView : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(products));
    return await Promise.allSettled(r);
  };

  const trackProductItemView = (product: TDataProduct) => async () => {
    const r = [
      useFb ? tFb(config).trackProductItemView : null,
      useKl ? tKlyo(config).trackProductItemView : null,
      useFs ? tFs(config).trackProductItemView : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(product));
    return await Promise.allSettled(r);
  };

  const trackPageView = (page: TDataPage) => async () => {
    const r = [
      useFb ? tFb(config).trackPageView : null,
      useKl ? tKlyo(config).trackPageView : null,
      useFs ? tFs(config).trackPageView : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(page));
    return await Promise.allSettled(r);
  };

  const trackCustom = (event: TDataCustomEvent) => async () => {
    const r = [
      useFb ? tFb(config).trackCustom : null,
      useKl ? tKlyo(config).trackCustom : null,
      useFs ? tFs(config).trackCustom : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(event));
    return await Promise.allSettled(r);
  };

  const trackInitiateCheckout = (basket: TDataBasket) => async () => {
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
    (searchTerm: string, products: TDataProduct[]) => async () => {
      const r = [
        useFb ? tFb(config).trackSearch : null,
        useKl ? tKlyo(config).trackSearch : null,
        useFs ? tFs(config).trackSearch : null,
      ]
        .filter((v) => !!v)
        .map((v) => v!(searchTerm, products));
      return await Promise.allSettled(r);
    };

  const trackIdentify = (profile: TDataProfile | null) => async () => {
    const r = [
      useFb ? tFb(config).trackIdentify : null,
      useKl ? tKlyo(config).trackIdentify : null,
      useFs ? tFs(config).trackIdentify : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(profile));
    return await Promise.allSettled(r);
  };

  const trackNewProfile = (profile: TDataProfile | null) => async () => {
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
    (profile: TDataProfile | null) => async () => {
      const r = [
        useFb ? tFb(config).trackProfileResetPassword : null,
        useKl ? tKlyo(config).trackProfileResetPassword : null,
        useFs ? tFs(config).trackProfileResetPassword : null,
      ]
        .filter((v) => !!v)
        .map((v) => v!(profile));
      return await Promise.allSettled(r);
    };

  const trackProfileLogIn = (profile: TDataProfile | null) => async () => {
    const r = [
      useFb ? tFb(config).trackProfileLogIn : null,
      useKl ? tKlyo(config).trackProfileLogIn : null,
      useFs ? tFs(config).trackProfileLogIn : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(profile));
    return await Promise.allSettled(r);
  };

  const trackProfileLogOut = (profile: TDataProfile | null) => async () => {
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
    (profile: TDataProfile | null) => async () => {
      const r = [
        useFb ? tFb(config).trackProfileSubscribeNL : null,
        useKl ? tKlyo(config).trackProfileSubscribeNL : null,
        useFs ? tFs(config).trackProfileSubscribeNL : null,
      ]
        .filter((v) => !!v)
        .map((v) => v!(profile));
      return await Promise.allSettled(r);
    };

  return {
    events: (event: TDataCustomEvent) => ({
      trackCustom: trackCustom(event),
    }),
    page: (page: TDataPage) => ({
      trackPageView: trackPageView(page),
    }),
    profile: (profile: TDataProfile | null) => ({
      trackIdentify: trackIdentify(profile),
      trackNewProfile: trackNewProfile(profile),
      trackProfileResetPassword: trackProfileResetPassword(profile),
      trackProfileLogIn: trackProfileLogIn(profile),
      trackProfileLogOut: trackProfileLogOut(profile),
      trackProfileSubscribeNL: trackProfileSubscribeNL(profile),
    }),
    catalog: (products: TDataProduct[], search = '') => ({
      trackProductsItemView: trackProductsItemView(products),
      trackProductItemView: trackProductItemView(products[0]),
      trackSearch: trackSearch(search, products),
    }),
    basket: (basket: TDataBasket) => ({
      trackProductAddToCart: trackProductAddToCart(basket),
      trackProductRemoveFromCart: trackProductRemoveFromCart(basket),
      trackInitiateCheckout: trackInitiateCheckout(basket),
    }),
    order: (order: TDataOrder) => ({
      trackTransaction: trackTransaction(order),
      trackTransactionRefund: trackTransactionRefund(order),
      trackTransactionCancel: trackTransactionCancel(order),
      trackTransactionFulfill: trackTransactionFulfill(order),
    }),
  };
};

export default apiTracker;

import { Request } from "express";
import { ETrackers, TDataBasket, TDataOrder, TDataPage, TDataProduct, TDataProfile, TSettings } from "../shared";
import tFb from './facebook';
import tKlyo from './klaviyo';

type TTrackers = {} & Partial<Record<ETrackers, boolean>>;

export const apiTracker = (config:TSettings, trackers?:TTrackers) => {
  const {
    serverAnalytics:analytics,
  } = config;
  const useFb = analytics?.[ETrackers.Facebook]?.enabled &&
    (trackers?.fb || true);
  const useKl = analytics?.[ETrackers.Klaviyo]?.enabled &&
    (trackers?.klaviyo || true);

    const trackTransactionRefund = (order:TDataOrder) => async () => {
    [
      useFb ? tFb(config).trackTransactionRefund : null,
      useKl ? tKlyo(config).trackTransactionRefund : null
    ]
    .filter(v => !!v)
    .map(v => v!(order));
  }

  const trackTransactionCancel = (order:TDataOrder) => async () => {
    [
      useFb ? tFb(config).trackTransactionCancel : null,
      useKl ? tKlyo(config).trackTransactionCancel : null
    ]
    .filter(v => !!v)
    .map(v => v!(order));
  }

  const trackTransactionFulfill = (order:TDataOrder) => async () => {
    [
      useFb ? tFb(config).trackTransactionFulfill : null,
      useKl ? tKlyo(config).trackTransactionFulfill : null
    ]
    .filter(v => !!v)
    .map(v => v!(order));
  }

  const trackTransaction = (order:TDataOrder) => async () => {
    [
      useFb ? tFb(config).trackTransaction : null,
      useKl ? tKlyo(config).trackTransaction : null
    ]
    .filter(v => !!v)
    .map(v => v!(order));
  }

  const trackProductAddToCart = (basket:TDataBasket) => async () => {
    [
      useFb ? tFb(config).trackProductAddToCart : null,
      useKl ? tKlyo(config).trackProductAddToCart : null
    ]
    .filter(v => !!v)
    .map(v => v!(basket));
  }

  const trackProductRemoveFromCart = (basket:TDataBasket) => async () => {
    [
      useFb ? tFb(config).trackProductRemoveFromCart : null,
      useKl ? tKlyo(config).trackProductRemoveFromCart : null
    ]
    .filter(v => !!v)
    .map(v => v!(basket));
  }

  const trackProductsItemView = (products:TDataProduct[]) => async () => {
    [
      useFb ? tFb(config).trackProductsItemView : null,
      useKl ? tKlyo(config).trackProductsItemView : null
    ]
    .filter(v => !!v)
    .map(v => v!(products));
  }

  const trackProductItemView = (product:TDataProduct) => async () => {
    [
      useFb ? tFb(config).trackProductItemView : null,
      useKl ? tKlyo(config).trackProductItemView : null
    ]
    .filter(v => !!v)
    .map(v => v!(product));
  }

  const trackPageView = (page:TDataPage) => async () => {
    [
      useFb ? tFb(config).trackPageView : null,
      useKl ? tKlyo(config).trackPageView : null
    ]
    .filter(v => !!v)
    .map(v => v!(page));
  }

  const trackInitiateCheckout = (basket:TDataBasket) => async () => {
    [
      useFb ? tFb(config).trackInitiateCheckout : null,
      useKl ? tKlyo(config).trackInitiateCheckout : null
    ]
    .filter(v => !!v)
    .map(v => v!(basket));
  }

  const trackSearch = (searchTerm:string, products:TDataProduct[]) => async () => {
    [
      useFb ? tFb(config).trackSearch : null,
      useKl ? tKlyo(config).trackSearch : null
    ]
    .filter(v => !!v)
    .map(v => v!(searchTerm, products));
  }

  const trackIdentify = (profile:TDataProfile) => async () => {
    [
      useFb ? tFb(config).trackIdentify : null,
      useKl ? tKlyo(config).trackIdentify : null
    ]
    .filter(v => !!v)
    .map(v => v!(profile));
  }

  const trackNewProfile = (profile:TDataProfile) => async () => {
    [
      useFb ? tFb(config).trackNewProfile : null,
      useKl ? tKlyo(config).trackNewProfile : null
    ]
    .filter(v => !!v)
    .map(v => v!(profile));
  }

  const trackProfileResetPassword = (profile:TDataProfile) => async () => {
    [
      useFb ? tFb(config).trackProfileResetPassword : null,
      useKl ? tKlyo(config).trackProfileResetPassword : null
    ]
    .filter(v => !!v)
    .map(v => v!(profile));
  }

  const trackProfileLogIn = (profile:TDataProfile) => async () => {
    [
      useFb ? tFb(config).trackProfileLogIn : null,
      useKl ? tKlyo(config).trackProfileLogIn : null
    ]
    .filter(v => !!v)
    .map(v => v!(profile));
  }

  const trackProfileLogOut = (profile:TDataProfile) => async () => {
    [
      useFb ? tFb(config).trackProfileLogOut : null,
      useKl ? tKlyo(config).trackProfileLogOut : null
    ]
    .filter(v => !!v)
    .map(v => v!(profile));
  }

  const trackProfileSubscribeNL = (profile:TDataProfile) => async () => {
    [
      useFb ? tFb(config).trackProfileSubscribeNL : null,
      useKl ? tKlyo(config).trackProfileSubscribeNL : null
    ]
    .filter(v => !!v)
    .map(v => v!(profile));
  }

  return {
    page: (page:TDataPage) => ({
      trackPageView: trackPageView(page),
    }),
    profile: (profile:TDataProfile) => ({
      trackIdentify: trackIdentify(profile),
      trackNewProfile: trackNewProfile(profile),
      trackProfileResetPassword: trackProfileResetPassword(profile),
      trackProfileLogIn: trackProfileLogIn(profile),
      trackProfileLogOut: trackProfileLogOut(profile),
      trackProfileSubscribeNL: trackProfileSubscribeNL(profile),
    }),
    catalog: (products:TDataProduct[], search = '') => ({
      trackProductsItemView: trackProductsItemView(products),
      trackProductItemView: trackProductItemView(products[0]),
      trackSearch: trackSearch(search, products),
    }),
    basket: (basket:TDataBasket) => ({
      trackProductAddToCart: trackProductAddToCart(basket),
      trackProductRemoveFromCart: trackProductRemoveFromCart(basket),
      trackInitiateCheckout: trackInitiateCheckout(basket),
    }),
    order: (order:TDataOrder) => ({
      trackTransaction: trackTransaction(order),
      trackTransactionRefund: trackTransactionRefund(order),
      trackTransactionCancel: trackTransactionCancel(order),
      trackTransactionFulfill: trackTransactionFulfill(order),
    }),
  };
}

export default apiTracker;

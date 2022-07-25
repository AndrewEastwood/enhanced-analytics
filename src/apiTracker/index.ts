import { ETrackers, TDataBasket, TDataOrder, TDataPage, TDataProduct, TDataProfile, TSettings } from "../types";
import tFb from './facebook';
import tKlyo from './klaviyo';

type TTrackers = {} & Partial<Record<ETrackers, boolean>>;

export const apiTracker = (config:TSettings, trackers?:TTrackers) => {

  const trackTransactionRefund = (order:TDataOrder) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackTransactionRefund : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackTransactionRefund : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, order));
  }

  const trackTransactionCancel = (order:TDataOrder) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackTransactionCancel : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackTransactionCancel : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, order));
  }

  const trackTransactionFulfill = (order:TDataOrder) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackTransactionFulfill : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackTransactionFulfill : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, order));
  }

  const trackTransaction = (order:TDataOrder) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackTransaction : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackTransaction : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, order));
  }

  const trackProductAddToCart = (basket:TDataBasket) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackProductAddToCart : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackProductAddToCart : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, basket));
  }

  const trackProductRemoveFromCart = (basket:TDataBasket) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackProductRemoveFromCart : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackProductRemoveFromCart : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, basket));
  }

  const trackProductsItemView = (products:TDataProduct[]) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackProductsItemView : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackProductsItemView : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, products));
  }

  const trackProductItemView = (product:TDataProduct) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackProductItemView : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackProductItemView : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, product));
  }

  const trackPageView = (page:TDataPage) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackPageView : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackPageView : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, page));
  }

  const trackInitiateCheckout = (basket:TDataBasket) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackInitiateCheckout : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackInitiateCheckout : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, basket));
  }

  const trackSearch = (searchTerm:string, products:TDataProduct[]) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackSearch : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackSearch : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, searchTerm, products));
  }

  const trackIdentify = (profile:TDataProfile) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackIdentify : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackIdentify : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, profile));
  }

  const trackNewProfile = (profile:TDataProfile) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackNewProfile : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackNewProfile : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, profile));
  }

  const trackProfileResetPassword = (profile:TDataProfile) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackProfileResetPassword : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackProfileResetPassword : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, profile));
  }

  const trackProfileLogIn = (profile:TDataProfile) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackProfileLogIn : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackProfileLogIn : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, profile));
  }

  const trackProfileLogOut = (profile:TDataProfile) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackProfileLogOut : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackProfileLogOut : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, profile));
  }

  const trackProfileSubscribeNL = (profile:TDataProfile) => async (request) => {
    [
      (!trackers || trackers?.fb) ? tFb(config).trackProfileSubscribeNL : null,
      (!trackers || trackers?.klaviyo) ? tKlyo(config).trackProfileSubscribeNL : null
    ]
    .filter(v => !!v)
    .map(v => v!(request, profile));
  }

  return {
    page: (page:TDataPage) => ({
      trackPageView: trackPageView.bind(null, page),
    }),
    profile: (profile:TDataProfile) => ({
      trackIdentify: trackIdentify.bind(null, profile),
      trackNewProfile: trackNewProfile.bind(null, profile),
      trackProfileResetPassword: trackProfileResetPassword.bind(null, profile),
      trackProfileLogIn: trackProfileLogIn.bind(null, profile),
      trackProfileLogOut: trackProfileLogOut.bind(null, profile),
      trackProfileSubscribeNL: trackProfileSubscribeNL.bind(null, profile),
    }),
    catalog: (products:TDataProduct[], search = '') => ({
      trackProductsItemView: trackProductsItemView.bind(null, products),
      trackProductItemView: trackProductItemView.bind(null, products[0]),
      trackSearch: trackSearch.bind(null, search, products),
    }),
    basket: (basket:TDataBasket) => ({
      trackProductAddToCart: trackProductAddToCart.bind(null, basket),
      trackProductRemoveFromCart: trackProductRemoveFromCart.bind(null, basket),
      trackInitiateCheckout: trackInitiateCheckout.bind(null, basket),
    }),
    order: (order:TDataOrder) => ({
      trackTransaction: trackTransaction.bind(null, order),
      trackTransactionRefund: trackTransactionRefund.bind(null, order),
      trackTransactionCancel: trackTransactionCancel.bind(null, order),
      trackTransactionFulfill: trackTransactionFulfill.bind(null, order),
    }),
  };
}

export default apiTracker;
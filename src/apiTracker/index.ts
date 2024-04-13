import {
  ETrackers,
  type T_EA_DataBasket,
  type T_EA_DataOrder,
  type T_EA_DataPage,
  type T_EA_DataProduct,
  type T_EA_DataProfile,
  type TSettings,
  type T_EA_DataCustomEvent,
} from '../shared';
import tFb from './facebook';
import tKlyo from './klaviyo';
import tFs from './fullstory';
import tTt from './tiktok';
import { isBrowserMode } from '../utils';

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

  // const metricRules = {
  //   [ETrackers.Facebook]: analytics?.[ETrackers.Facebook]?.rules?.metrics ?? {},
  //   [ETrackers.Klaviyo]: analytics?.[ETrackers.Klaviyo]?.rules?.metrics ?? {},
  // };

  const isMetricAllowed = (tracker: ETrackers, trackFnName?: string) => {
    const allowed = trackers?.[tracker] && analytics?.[tracker]?.enabled;
    const rules = analytics?.[tracker]?.rules?.metrics ?? {};
    const ruleConfig = rules[trackFnName ?? ''];
    return ruleConfig === false ? false : allowed;
  };

  if (trackers?.server && isBrowserMode) {
    throw '[EA:Server] Trackers cannot be run in a browser. globalThis.window is detected.';
  }

  if (!trackers?.server && !isBrowserMode) {
    throw '[EA:Browser] Trackers cannot be run at server side. globalThis.window is not accessible.';
  }

  const trackTransactionRefund = (order: T_EA_DataOrder) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackTransactionRefund.name)
        ? tFb(config).trackTransactionRefund
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackTransactionRefund.name)
        ? tKlyo(config).trackTransactionRefund
        : null,
      isMetricAllowed(ETrackers.FullStory, trackTransactionRefund.name)
        ? tFs(config).trackTransactionRefund
        : null,
      isMetricAllowed(ETrackers.TikTok, trackTransactionRefund.name)
        ? tTt(config).trackTransactionRefund
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackTransactionCancel = (order: T_EA_DataOrder) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackTransactionCancel.name)
        ? tFb(config).trackTransactionCancel
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackTransactionCancel.name)
        ? tKlyo(config).trackTransactionCancel
        : null,
      isMetricAllowed(ETrackers.FullStory, trackTransactionCancel.name)
        ? tFs(config).trackTransactionCancel
        : null,
      isMetricAllowed(ETrackers.TikTok, trackTransactionCancel.name)
        ? tTt(config).trackTransactionCancel
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackTransactionFulfill = (order: T_EA_DataOrder) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackTransactionFulfill.name)
        ? tFb(config).trackTransactionFulfill
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackTransactionFulfill.name)
        ? tKlyo(config).trackTransactionFulfill
        : null,
      isMetricAllowed(ETrackers.FullStory, trackTransactionFulfill.name)
        ? tFs(config).trackTransactionFulfill
        : null,
      isMetricAllowed(ETrackers.TikTok, trackTransactionFulfill.name)
        ? tTt(config).trackTransactionFulfill
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackTransaction = (order: T_EA_DataOrder) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackTransaction.name)
        ? tFb(config).trackTransaction
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackTransaction.name)
        ? tKlyo(config).trackTransaction
        : null,
      isMetricAllowed(ETrackers.FullStory, trackTransaction.name)
        ? tFs(config).trackTransaction
        : null,
      isMetricAllowed(ETrackers.TikTok, trackTransaction.name)
        ? tTt(config).trackTransaction
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackProductAddToCart = (basket: T_EA_DataBasket) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackProductAddToCart.name)
        ? tFb(config).trackProductAddToCart
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackProductAddToCart.name)
        ? tKlyo(config).trackProductAddToCart
        : null,
      isMetricAllowed(ETrackers.FullStory, trackProductAddToCart.name)
        ? tFs(config).trackProductAddToCart
        : null,
      isMetricAllowed(ETrackers.TikTok, trackProductAddToCart.name)
        ? tTt(config).trackProductAddToCart
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  const trackProductRemoveFromCart = (basket: T_EA_DataBasket) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackProductRemoveFromCart.name)
        ? tFb(config).trackProductRemoveFromCart
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackProductRemoveFromCart.name)
        ? tKlyo(config).trackProductRemoveFromCart
        : null,
      isMetricAllowed(ETrackers.FullStory, trackProductRemoveFromCart.name)
        ? tFs(config).trackProductRemoveFromCart
        : null,
      isMetricAllowed(ETrackers.TikTok, trackProductRemoveFromCart.name)
        ? tTt(config).trackProductRemoveFromCart
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  const trackProductsItemView = (products: T_EA_DataProduct[]) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackProductsItemView.name)
        ? tFb(config).trackProductsItemView
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackProductsItemView.name)
        ? tKlyo(config).trackProductsItemView
        : null,
      isMetricAllowed(ETrackers.FullStory, trackProductsItemView.name)
        ? tFs(config).trackProductsItemView
        : null,
      isMetricAllowed(ETrackers.TikTok, trackProductsItemView.name)
        ? tTt(config).trackProductsItemView
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(products));
    return await Promise.allSettled(r);
  };

  const trackProductItemView = (product: T_EA_DataProduct) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackProductItemView.name)
        ? tFb(config).trackProductItemView
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackProductItemView.name)
        ? tKlyo(config).trackProductItemView
        : null,
      isMetricAllowed(ETrackers.FullStory, trackProductItemView.name)
        ? tFs(config).trackProductItemView
        : null,
      isMetricAllowed(ETrackers.TikTok, trackProductItemView.name)
        ? tTt(config).trackProductItemView
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(product));
    return await Promise.allSettled(r);
  };

  const trackPageView = (page: T_EA_DataPage) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackPageView.name)
        ? tFb(config).trackPageView
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackPageView.name)
        ? tKlyo(config).trackPageView
        : null,
      isMetricAllowed(ETrackers.FullStory, trackPageView.name)
        ? tFs(config).trackPageView
        : null,
      isMetricAllowed(ETrackers.TikTok, trackPageView.name)
        ? tTt(config).trackPageView
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(page));
    return await Promise.allSettled(r);
  };

  const trackCustom = (event: T_EA_DataCustomEvent) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackCustom.name)
        ? tFb(config).trackCustom
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackCustom.name)
        ? tKlyo(config).trackCustom
        : null,
      isMetricAllowed(ETrackers.FullStory, trackCustom.name)
        ? tFs(config).trackCustom
        : null,
      isMetricAllowed(ETrackers.TikTok, trackCustom.name)
        ? tTt(config).trackCustom
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(event));
    return await Promise.allSettled(r);
  };

  const trackInitiateCheckout = (basket: T_EA_DataBasket) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackInitiateCheckout.name)
        ? tFb(config).trackInitiateCheckout
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackInitiateCheckout.name)
        ? tKlyo(config).trackInitiateCheckout
        : null,
      isMetricAllowed(ETrackers.FullStory, trackInitiateCheckout.name)
        ? tFs(config).trackInitiateCheckout
        : null,
      isMetricAllowed(ETrackers.TikTok, trackInitiateCheckout.name)
        ? tTt(config).trackInitiateCheckout
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  const trackSearch =
    (searchTerm: string, products: T_EA_DataProduct[]) => async () => {
      const r = [
        isMetricAllowed(ETrackers.Facebook, trackSearch.name)
          ? tFb(config).trackSearch
          : null,
        isMetricAllowed(ETrackers.Klaviyo, trackSearch.name)
          ? tKlyo(config).trackSearch
          : null,
        isMetricAllowed(ETrackers.FullStory, trackSearch.name)
          ? tFs(config).trackSearch
          : null,
        isMetricAllowed(ETrackers.TikTok, trackSearch.name)
          ? tTt(config).trackSearch
          : null,
      ]
        .filter((v) => !!v)
        .map((v) => v!(searchTerm, products));
      return await Promise.allSettled(r);
    };

  const trackIdentify = (profile: T_EA_DataProfile | null) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackIdentify.name)
        ? tFb(config).trackIdentify
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackIdentify.name)
        ? tKlyo(config).trackIdentify
        : null,
      isMetricAllowed(ETrackers.FullStory, trackIdentify.name)
        ? tFs(config).trackIdentify
        : null,
      isMetricAllowed(ETrackers.TikTok, trackIdentify.name)
        ? tTt(config).trackIdentify
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(profile));
    return await Promise.allSettled(r);
  };

  const trackNewProfile = (profile: T_EA_DataProfile | null) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackNewProfile.name)
        ? tFb(config).trackNewProfile
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackNewProfile.name)
        ? tKlyo(config).trackNewProfile
        : null,
      isMetricAllowed(ETrackers.FullStory, trackNewProfile.name)
        ? tFs(config).trackNewProfile
        : null,
      isMetricAllowed(ETrackers.TikTok, trackNewProfile.name)
        ? tTt(config).trackNewProfile
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(profile));
    return await Promise.allSettled(r);
  };

  const trackProfileResetPassword =
    (profile: T_EA_DataProfile | null) => async () => {
      const r = [
        isMetricAllowed(ETrackers.Facebook, trackProfileResetPassword.name)
          ? tFb(config).trackProfileResetPassword
          : null,
        isMetricAllowed(ETrackers.Klaviyo, trackProfileResetPassword.name)
          ? tKlyo(config).trackProfileResetPassword
          : null,
        isMetricAllowed(ETrackers.FullStory, trackProfileResetPassword.name)
          ? tFs(config).trackProfileResetPassword
          : null,
        isMetricAllowed(ETrackers.TikTok, trackProfileResetPassword.name)
          ? tTt(config).trackProfileResetPassword
          : null,
      ]
        .filter((v) => !!v)
        .map((v) => v!(profile));
      return await Promise.allSettled(r);
    };

  const trackProfileLogIn = (profile: T_EA_DataProfile | null) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackProfileLogIn.name)
        ? tFb(config).trackProfileLogIn
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackProfileLogIn.name)
        ? tKlyo(config).trackProfileLogIn
        : null,
      isMetricAllowed(ETrackers.FullStory, trackProfileLogIn.name)
        ? tFs(config).trackProfileLogIn
        : null,
      isMetricAllowed(ETrackers.TikTok, trackProfileLogIn.name)
        ? tTt(config).trackProfileLogIn
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(profile));
    return await Promise.allSettled(r);
  };

  const trackProfileLogOut = (profile: T_EA_DataProfile | null) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackProfileLogOut.name)
        ? tFb(config).trackProfileLogOut
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackProfileLogOut.name)
        ? tKlyo(config).trackProfileLogOut
        : null,
      isMetricAllowed(ETrackers.FullStory, trackProfileLogOut.name)
        ? tFs(config).trackProfileLogOut
        : null,
      isMetricAllowed(ETrackers.TikTok, trackProfileLogOut.name)
        ? tTt(config).trackProfileLogOut
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(profile));
    return await Promise.allSettled(r);
  };

  const trackProfileSubscribeNL =
    (profile: T_EA_DataProfile | null) => async () => {
      const r = [
        isMetricAllowed(ETrackers.Facebook, trackProfileSubscribeNL.name)
          ? tFb(config).trackProfileSubscribeNL
          : null,
        isMetricAllowed(ETrackers.Klaviyo, trackProfileSubscribeNL.name)
          ? tKlyo(config).trackProfileSubscribeNL
          : null,
        isMetricAllowed(ETrackers.FullStory, trackProfileSubscribeNL.name)
          ? tFs(config).trackProfileSubscribeNL
          : null,
        isMetricAllowed(ETrackers.TikTok, trackProfileSubscribeNL.name)
          ? tTt(config).trackProfileSubscribeNL
          : null,
      ]
        .filter((v) => !!v)
        .map((v) => v!(profile));
      return await Promise.allSettled(r);
    };

  const trackAddToWishlist = (products: T_EA_DataProduct[]) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackAddToWishlist.name)
        ? tFb(config).trackAddToWishlist
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackAddToWishlist.name)
        ? tKlyo(config).trackAddToWishlist
        : null,
      isMetricAllowed(ETrackers.FullStory, trackAddToWishlist.name)
        ? tFs(config).trackAddToWishlist
        : null,
      isMetricAllowed(ETrackers.TikTok, trackAddToWishlist.name)
        ? tTt(config).trackAddToWishlist
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(products));
    return await Promise.allSettled(r);
  };

  const trackViewBasket = (basket: T_EA_DataBasket) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackViewBasket.name)
        ? tFb(config).trackViewBasket
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackViewBasket.name)
        ? tKlyo(config).trackViewBasket
        : null,
      isMetricAllowed(ETrackers.FullStory, trackViewBasket.name)
        ? tFs(config).trackViewBasket
        : null,
      isMetricAllowed(ETrackers.TikTok, trackViewBasket.name)
        ? tTt(config).trackViewBasket
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  const trackAddPaymentInfo = (order: T_EA_DataOrder) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackAddPaymentInfo.name)
        ? tFb(config).trackAddPaymentInfo
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackAddPaymentInfo.name)
        ? tKlyo(config).trackAddPaymentInfo
        : null,
      isMetricAllowed(ETrackers.FullStory, trackAddPaymentInfo.name)
        ? tFs(config).trackAddPaymentInfo
        : null,
      isMetricAllowed(ETrackers.TikTok, trackAddPaymentInfo.name)
        ? tTt(config).trackAddPaymentInfo
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackAddShippingInfo = (order: T_EA_DataOrder) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, trackAddShippingInfo.name)
        ? tFb(config).trackAddShippingInfo
        : null,
      isMetricAllowed(ETrackers.Klaviyo, trackAddShippingInfo.name)
        ? tKlyo(config).trackAddShippingInfo
        : null,
      isMetricAllowed(ETrackers.FullStory, trackAddShippingInfo.name)
        ? tFs(config).trackAddShippingInfo
        : null,
      isMetricAllowed(ETrackers.TikTok, trackAddShippingInfo.name)
        ? tTt(config).trackAddShippingInfo
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
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
    }),
    order: (order: T_EA_DataOrder) => ({
      trackTransaction: trackTransaction(order),
      trackTransactionRefund: trackTransactionRefund(order),
      trackTransactionCancel: trackTransactionCancel(order),
      trackTransactionFulfill: trackTransactionFulfill(order),
      trackAddPaymentInfo: trackAddPaymentInfo(order),
      trackAddShippingInfo: trackAddShippingInfo(order),
    }),
  };
};

export default apiTracker;

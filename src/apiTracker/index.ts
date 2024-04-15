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

  const isMetricAllowed = (tracker: ETrackers, trackFnName?: string) => {
    const allowed =
      trackers?.[tracker] &&
      (typeof analytics?.[tracker]?.rules?.defaultAllowed === 'boolean'
        ? analytics?.[tracker]?.rules?.defaultAllowed
        : analytics?.[tracker]?.enabled);
    const rules = analytics?.[tracker]?.rules?.metrics ?? {};
    const ruleConfig = rules[trackFnName ?? ''];
    return typeof ruleConfig === 'boolean' ? ruleConfig : allowed;
  };

  if (trackers?.server && isBrowserMode) {
    throw '[EA:Server] Trackers cannot be run in a browser. globalThis.window is detected.';
  }

  if (!trackers?.server && !isBrowserMode) {
    throw '[EA:Browser] Trackers cannot be run at server side. globalThis.window is not accessible.';
  }

  const trackTransactionRefund = (order: T_EA_DataOrder) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackTransactionRefund')
        ? tFb(config).trackTransactionRefund
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackTransactionRefund')
        ? tKlyo(config).trackTransactionRefund
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackTransactionRefund')
        ? tFs(config).trackTransactionRefund
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackTransactionRefund')
        ? tTt(config).trackTransactionRefund
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackTransactionCancel = (order: T_EA_DataOrder) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackTransactionCancel')
        ? tFb(config).trackTransactionCancel
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackTransactionCancel')
        ? tKlyo(config).trackTransactionCancel
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackTransactionCancel')
        ? tFs(config).trackTransactionCancel
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackTransactionCancel')
        ? tTt(config).trackTransactionCancel
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackTransactionFulfill = (order: T_EA_DataOrder) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackTransactionFulfill')
        ? tFb(config).trackTransactionFulfill
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackTransactionFulfill')
        ? tKlyo(config).trackTransactionFulfill
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackTransactionFulfill')
        ? tFs(config).trackTransactionFulfill
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackTransactionFulfill')
        ? tTt(config).trackTransactionFulfill
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackTransaction = (order: T_EA_DataOrder) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackTransaction')
        ? tFb(config).trackTransaction
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackTransaction')
        ? tKlyo(config).trackTransaction
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackTransaction')
        ? tFs(config).trackTransaction
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackTransaction')
        ? tTt(config).trackTransaction
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackProductAddToCart = (basket: T_EA_DataBasket) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackProductAddToCart')
        ? tFb(config).trackProductAddToCart
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackProductAddToCart')
        ? tKlyo(config).trackProductAddToCart
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackProductAddToCart')
        ? tFs(config).trackProductAddToCart
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackProductAddToCart')
        ? tTt(config).trackProductAddToCart
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  const trackProductRemoveFromCart = (basket: T_EA_DataBasket) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackProductRemoveFromCart')
        ? tFb(config).trackProductRemoveFromCart
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackProductRemoveFromCart')
        ? tKlyo(config).trackProductRemoveFromCart
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackProductRemoveFromCart')
        ? tFs(config).trackProductRemoveFromCart
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackProductRemoveFromCart')
        ? tTt(config).trackProductRemoveFromCart
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  const trackProductsItemView = (products: T_EA_DataProduct[]) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackProductsItemView')
        ? tFb(config).trackProductsItemView
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackProductsItemView')
        ? tKlyo(config).trackProductsItemView
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackProductsItemView')
        ? tFs(config).trackProductsItemView
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackProductsItemView')
        ? tTt(config).trackProductsItemView
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(products));
    return await Promise.allSettled(r);
  };

  const trackProductItemView = (product: T_EA_DataProduct) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackProductItemView')
        ? tFb(config).trackProductItemView
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackProductItemView')
        ? tKlyo(config).trackProductItemView
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackProductItemView')
        ? tFs(config).trackProductItemView
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackProductItemView')
        ? tTt(config).trackProductItemView
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(product));
    return await Promise.allSettled(r);
  };

  const trackPageView = (page: T_EA_DataPage) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackPageView')
        ? tFb(config).trackPageView
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackPageView')
        ? tKlyo(config).trackPageView
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackPageView')
        ? tFs(config).trackPageView
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackPageView')
        ? tTt(config).trackPageView
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(page));
    return await Promise.allSettled(r);
  };

  const trackCustom = (event: T_EA_DataCustomEvent) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackCustom')
        ? tFb(config).trackCustom
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackCustom')
        ? tKlyo(config).trackCustom
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackCustom')
        ? tFs(config).trackCustom
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackCustom')
        ? tTt(config).trackCustom
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(event));
    return await Promise.allSettled(r);
  };

  const trackInitiateCheckout = (basket: T_EA_DataBasket) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackInitiateCheckout')
        ? tFb(config).trackInitiateCheckout
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackInitiateCheckout')
        ? tKlyo(config).trackInitiateCheckout
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackInitiateCheckout')
        ? tFs(config).trackInitiateCheckout
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackInitiateCheckout')
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
        isMetricAllowed(ETrackers.Facebook, 'trackSearch')
          ? tFb(config).trackSearch
          : null,
        isMetricAllowed(ETrackers.Klaviyo, 'trackSearch')
          ? tKlyo(config).trackSearch
          : null,
        isMetricAllowed(ETrackers.FullStory, 'trackSearch')
          ? tFs(config).trackSearch
          : null,
        isMetricAllowed(ETrackers.TikTok, 'trackSearch')
          ? tTt(config).trackSearch
          : null,
      ]
        .filter((v) => !!v)
        .map((v) => v!(searchTerm, products));
      return await Promise.allSettled(r);
    };

  const trackIdentify = (profile: T_EA_DataProfile | null) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackIdentify')
        ? tFb(config).trackIdentify
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackIdentify')
        ? tKlyo(config).trackIdentify
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackIdentify')
        ? tFs(config).trackIdentify
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackIdentify')
        ? tTt(config).trackIdentify
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(profile));
    return await Promise.allSettled(r);
  };

  const trackNewProfile = (profile: T_EA_DataProfile | null) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackNewProfile')
        ? tFb(config).trackNewProfile
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackNewProfile')
        ? tKlyo(config).trackNewProfile
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackNewProfile')
        ? tFs(config).trackNewProfile
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackNewProfile')
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
        isMetricAllowed(ETrackers.Facebook, 'trackProfileResetPassword')
          ? tFb(config).trackProfileResetPassword
          : null,
        isMetricAllowed(ETrackers.Klaviyo, 'trackProfileResetPassword')
          ? tKlyo(config).trackProfileResetPassword
          : null,
        isMetricAllowed(ETrackers.FullStory, 'trackProfileResetPassword')
          ? tFs(config).trackProfileResetPassword
          : null,
        isMetricAllowed(ETrackers.TikTok, 'trackProfileResetPassword')
          ? tTt(config).trackProfileResetPassword
          : null,
      ]
        .filter((v) => !!v)
        .map((v) => v!(profile));
      return await Promise.allSettled(r);
    };

  const trackProfileLogIn = (profile: T_EA_DataProfile | null) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackProfileLogIn')
        ? tFb(config).trackProfileLogIn
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackProfileLogIn')
        ? tKlyo(config).trackProfileLogIn
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackProfileLogIn')
        ? tFs(config).trackProfileLogIn
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackProfileLogIn')
        ? tTt(config).trackProfileLogIn
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(profile));
    return await Promise.allSettled(r);
  };

  const trackProfileLogOut = (profile: T_EA_DataProfile | null) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackProfileLogOut')
        ? tFb(config).trackProfileLogOut
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackProfileLogOut')
        ? tKlyo(config).trackProfileLogOut
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackProfileLogOut')
        ? tFs(config).trackProfileLogOut
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackProfileLogOut')
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
        isMetricAllowed(ETrackers.Facebook, 'trackProfileSubscribeNL')
          ? tFb(config).trackProfileSubscribeNL
          : null,
        isMetricAllowed(ETrackers.Klaviyo, 'trackProfileSubscribeNL')
          ? tKlyo(config).trackProfileSubscribeNL
          : null,
        isMetricAllowed(ETrackers.FullStory, 'trackProfileSubscribeNL')
          ? tFs(config).trackProfileSubscribeNL
          : null,
        isMetricAllowed(ETrackers.TikTok, 'trackProfileSubscribeNL')
          ? tTt(config).trackProfileSubscribeNL
          : null,
      ]
        .filter((v) => !!v)
        .map((v) => v!(profile));
      return await Promise.allSettled(r);
    };

  const trackAddToWishlist = (products: T_EA_DataProduct[]) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackAddToWishlist')
        ? tFb(config).trackAddToWishlist
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackAddToWishlist')
        ? tKlyo(config).trackAddToWishlist
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackAddToWishlist')
        ? tFs(config).trackAddToWishlist
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackAddToWishlist')
        ? tTt(config).trackAddToWishlist
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(products));
    return await Promise.allSettled(r);
  };

  const trackViewBasket = (basket: T_EA_DataBasket) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackViewBasket')
        ? tFb(config).trackViewBasket
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackViewBasket')
        ? tKlyo(config).trackViewBasket
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackViewBasket')
        ? tFs(config).trackViewBasket
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackViewBasket')
        ? tTt(config).trackViewBasket
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(basket));
    return await Promise.allSettled(r);
  };

  const trackAddPaymentInfo = (order: T_EA_DataOrder) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackAddPaymentInfo')
        ? tFb(config).trackAddPaymentInfo
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackAddPaymentInfo')
        ? tKlyo(config).trackAddPaymentInfo
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackAddPaymentInfo')
        ? tFs(config).trackAddPaymentInfo
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackAddPaymentInfo')
        ? tTt(config).trackAddPaymentInfo
        : null,
    ]
      .filter((v) => !!v)
      .map((v) => v!(order));
    return await Promise.allSettled(r);
  };

  const trackAddShippingInfo = (order: T_EA_DataOrder) => async () => {
    const r = [
      isMetricAllowed(ETrackers.Facebook, 'trackAddShippingInfo')
        ? tFb(config).trackAddShippingInfo
        : null,
      isMetricAllowed(ETrackers.Klaviyo, 'trackAddShippingInfo')
        ? tKlyo(config).trackAddShippingInfo
        : null,
      isMetricAllowed(ETrackers.FullStory, 'trackAddShippingInfo')
        ? tFs(config).trackAddShippingInfo
        : null,
      isMetricAllowed(ETrackers.TikTok, 'trackAddShippingInfo')
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

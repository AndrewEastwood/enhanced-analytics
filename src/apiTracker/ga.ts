import {
  type T_EA_DataBasket,
  type T_EA_DataOrder,
  type T_EA_DataProduct,
  type TEECParams,
  type TEvtType,
  type TSettings,
  type T_EA_DataPage,
  type T_EA_DataProfile,
  type T_EA_DataCustomEvent,
} from './../shared';
import * as trackUtils from './../utils';
import { resolveUser } from './identity';

// GA4 events
// https://developers.google.com/analytics/devguides/collection/ga4/reference/events

let uiLibInstallStatus: 'no' | 'yes' | 'installing' = 'no';

export const installGTM = (
  trackingCode?: string | null,
  dataLayerName: string = 'dataLayer',
  debug?: boolean
) => {
  return trackUtils.isBrowserMode && uiLibInstallStatus === 'no' && trackingCode
    ? new Promise((instok, insterr) => {
        uiLibInstallStatus = 'installing';
        (function (w, d, s, l, i) {
          w[l] = w[l] || [];
          // w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
          function gtag(fn: string, p: any, o?: any) {
            w[l].push(arguments);
          }

          // Set default consent to 'denied' as a placeholder
          // Determine actual values based on your own requirements
          gtag('consent', 'default', {
            ad_personalization: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            analytics_storage: 'denied',
            functionality_storage: 'denied',
            personalization_storage: 'denied',
            security_storage: 'granted',
            wait_for_update: 500,
          });
          // https://developers.google.com/tag-platform/security/guides/consent?consentmode=advanced#redact_ads_data
          gtag('set', 'ads_data_redaction', true);
          // https://developers.google.com/tag-platform/security/guides/consent?consentmode=advanced#passthroughs
          gtag('set', 'url_passthrough', true);

          gtag('js', new Date());
          gtag('config', i, { debug_mode: !!debug });
          //
          var f = d.getElementsByTagName('script')[0],
            j = d.createElement('script'),
            dl = l != 'dataLayer' ? '&l=' + l : '';
          j.async = true;
          j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
          new Promise((resolve, reject) => {
            j.onload = resolve;
            j.onerror = reject;
          })
            .then(() => {
              uiLibInstallStatus = 'yes';
              instok(true);
            })
            .catch(() => {
              uiLibInstallStatus = 'no';
              insterr(true);
            });
          f.parentNode?.insertBefore(j, f);
        })(window, document, 'script', dataLayerName, trackingCode);
      })
    : null;
};

const innerDataLayer = new Set<any>();

// Is designed to run in browsers only.

export const getEEC = (options: TSettings) => {
  const ga = options.integrations?.ga;

  const publishEvent = (payload) => {
    const dl =
      globalThis.window && ga
        ? ((globalThis.window[ga.dataLayerName ?? 'dataLayer'] =
            globalThis.window[ga.dataLayerName ?? 'dataLayer'] || []),
          globalThis.window[ga.dataLayerName ?? 'dataLayer'] as any[])
        : [];
    if (payload && payload.ecommerce) {
      dl.push({ ecommerce: null }); // Clear the previous ecommerce object.
    }
    dl.push(payload);
    innerDataLayer.add(payload);
  };

  const _evt = <T extends {}>(
    payload: T,
    conditionFn?: (p: object) => boolean
  ): TEvtType<T> => ({
    collected: () => {
      return Array.from<T>(innerDataLayer);
    },
    when: (conditionFn: () => boolean) => {
      return _evt(payload, conditionFn);
    },
    push: () => {
      const isOkayToPush = conditionFn ? conditionFn(payload) : true;
      isOkayToPush ? publishEvent(payload) : void 0;
      return _evt(payload);
    },
    value: () => {
      return payload;
    },
  });

  const getEECUserData = (
    profile?: T_EA_DataProfile | null,
    params?: TEECParams
  ) => {
    const u = resolveUser(profile);
    return _evt({
      event: params?.evName ?? 'ea.user',
      userData: {
        ...(u ?? {}),
      },
    });
  };

  const getEECPageView = (page?: T_EA_DataPage | null, params?: TEECParams) => {
    return _evt({
      event: params?.evName ?? 'ea.page',
      pageData: {
        ...(page ?? {}),
      },
    });
  };

  const getEECCustom = (
    event?: T_EA_DataCustomEvent | null,
    params?: TEECParams
  ) => {
    return _evt({
      event: params?.evName ?? 'ea.custom',
      eventData: {
        ...(event ?? {}),
      },
    });
  };

  const getEECProductDetails = (
    products: T_EA_DataProduct[],
    params?: TEECParams
  ) => {
    // https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#view_item
    const dl = trackUtils
      .Catalog(options, products)
      .ProductDetails.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECProductsList = (
    products: T_EA_DataProduct[],
    params?: TEECParams
  ) => {
    // https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#view_item_list
    const dl = trackUtils
      .Catalog(options, products)
      .Products.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECCheckoutList = (basket: T_EA_DataBasket, params?: TEECParams) => {
    const dl = trackUtils
      .Basket(options, basket)
      .InitCheckout.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECPurchased = (order: T_EA_DataOrder, params?: TEECParams) => {
    const dl = trackUtils
      .Order(options, order)
      .Purchase.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECRefund = (order: T_EA_DataOrder, params?: TEECParams) => {
    const dl = trackUtils.Order(options, order).Refund.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECCartAdd = (basket: T_EA_DataBasket, params?: TEECParams) => {
    const dl = trackUtils
      .Basket(options, basket)
      .BasketAddProduct.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECCartRemove = (basket: T_EA_DataBasket, params?: TEECParams) => {
    const dl = trackUtils
      .Basket(options, basket)
      .BasketRemoveProduct.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECSearch = (searchTerm: string, params?: TEECParams) => {
    return _evt({
      event: 'search',
      search_term: searchTerm,
    });
  };

  const getEECUserLogin = (
    profile?: T_EA_DataProfile | null,
    params?: TEECParams
  ) => {
    return _evt({
      event: 'login',
      method: profile?.loginProvider ?? 'website',
    });
  };

  const getEECUserNew = (
    profile?: T_EA_DataProfile | null,
    params?: TEECParams
  ) => {
    return _evt({
      event: 'sign_up',
      method: profile?.loginProvider ?? 'website',
    });
  };

  const getEECAddToWishlist = (
    products: T_EA_DataProduct[],
    params?: TEECParams
  ) => {
    return _evt({
      event: 'add_to_wishlist',
      ecommerce: {
        ...trackUtils
          .Catalog(options, products)
          .Products.getEECDataLayer(params).ecommerce,
      },
    });
  };

  const getEECViewBasket = (basket: T_EA_DataBasket, params?: TEECParams) => {
    // https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#view_cart
    return _evt({
      event: 'view_cart',
      ecommerce: {
        ...trackUtils
          .Basket(options, basket)
          .InitCheckout.getEECDataLayer(params).ecommerce,
      },
    });
  };

  const getEECAddPaymentInfo = (order: T_EA_DataOrder, params?: TEECParams) => {
    // https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#add_payment_info
    const dataGA4 = trackUtils
      .Order(options, order)
      .Purchase.getEECDataLayer(params);
    return _evt({
      event: 'add_payment_info',
      ecommerce: {
        payment_type: order.payment.type,
        currency: dataGA4.ecommerce.currency,
        value: dataGA4.ecommerce.value,
        coupon: dataGA4.ecommerce.coupon,
        items: dataGA4.ecommerce.items,
      },
    });
  };

  const getEECAddShippingInfo = (
    order: T_EA_DataOrder,
    params?: TEECParams
  ) => {
    // https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#add_shipping_info
    const dataGA4 = trackUtils
      .Order(options, order)
      .Purchase.getEECDataLayer(params);
    return _evt({
      event: 'add_shipping_info',
      ecommerce: {
        currency: dataGA4.ecommerce.currency,
        value: dataGA4.ecommerce.value,
        coupon: dataGA4.ecommerce.coupon,
        shipping_tier: order.shipping.name,
        items: dataGA4.ecommerce.items,
      },
    });
  };

  return {
    misc: (event: T_EA_DataCustomEvent) => ({
      getEECCustom: (p?: TEECParams) => getEECCustom(event, p),
    }),
    page: (page?: T_EA_DataPage | null) => ({
      getEECPageView: (p?: TEECParams) => getEECPageView(page, p),
    }),
    profile: (profile?: T_EA_DataProfile | null) => ({
      getEECUserData: (p?: TEECParams) => getEECUserData(profile, p),
      getEECUserLogin: (p?: TEECParams) => getEECUserLogin(profile, p),
      getEECUserNew: (p?: TEECParams) => getEECUserNew(profile, p),
    }),
    catalog: (products: T_EA_DataProduct[], search = '') => ({
      getEECProductsList: (p?: TEECParams) => getEECProductsList(products, p),
      getEECProductDetails: (p?: TEECParams) =>
        getEECProductDetails(products, p),
      getEECSearch: (p?: TEECParams) => getEECSearch(search, p),
      getEECAddToWishlist: (p?: TEECParams) => getEECAddToWishlist(products, p),
    }),
    basket: (basket: T_EA_DataBasket) => ({
      getEECCartAdd: (p?: TEECParams) => getEECCartAdd(basket, p),
      getEECCartRemove: (p?: TEECParams) => getEECCartRemove(basket, p),
      getEECCheckoutList: (p?: TEECParams) => getEECCheckoutList(basket, p),
      getEECViewBasket: (p?: TEECParams) => getEECViewBasket(basket, p),
    }),
    order: (order: T_EA_DataOrder) => ({
      getEECPurchased: (p?: TEECParams) => getEECPurchased(order, p),
      getEECRefund: (p?: TEECParams) => getEECRefund(order, p),
      getEECAddPaymentInfo: (p?: TEECParams) => getEECAddPaymentInfo(order, p),
      getEECAddShippingInfo: (p?: TEECParams) =>
        getEECAddShippingInfo(order, p),
    }),
  };
};

export default getEEC;

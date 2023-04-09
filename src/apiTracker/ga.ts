import {
  T_EA_DataBasket,
  T_EA_DataOrder,
  T_EA_DataProduct,
  TEECParams,
  TEvtType,
  TSettings,
  T_EA_DataPage,
  T_EA_DataProfile,
  T_EA_DataCustomEvent,
} from './../shared';
import * as trackUtils from './../utils';

let uiLibInstallStatus: 'no' | 'yes' | 'installing' = 'no';

export const installGTM = (
  trackingCode?: string | null,
  dataLayerName: string = 'dataLayer',
  debug?: boolean
) => {
  return uiLibInstallStatus === 'no' && trackingCode && globalThis.window
    ? new Promise((r, e) => {
        uiLibInstallStatus = 'installing';
        (function (w, d, s, l, i) {
          w[l] = w[l] || [];
          // w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
          function gtag(fn: string, p: any, o?: any) {
            w[l].push(arguments);
          }
          gtag?.('js', new Date());
          gtag?.('config', i, { debug_mode: !!debug });
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
              r(true);
            })
            .catch(() => {
              uiLibInstallStatus = 'no';
              e(true);
            });
          f.parentNode?.insertBefore(j, f);
        })(window, document, 'script', dataLayerName, trackingCode);
      })
    : null;
};

const innerDataLayer = new Set<any>();

// Is designed to run in browsers only.

export const getEEC = (options: TSettings) => {
  const { enabled = false, trackId = null } = options.integrations?.ga ?? {};
  // install gtm tag
  installGTM(
    enabled ? trackId : void 0,
    options.dataLayerName,
    options.integrations?.testing
  );

  const publishEvent = (payload) => {
    const dl = globalThis.window
      ? ((globalThis.window[options.dataLayerName] =
          globalThis.window[options.dataLayerName] || []),
        globalThis.window[options.dataLayerName] as any[])
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
    return _evt({
      event: params?.evName ?? 'eec.user',
      userData: {
        ...(profile ?? {}),
      },
    });
  };

  const getEECPageView = (page?: T_EA_DataPage | null, params?: TEECParams) => {
    return _evt({
      event: params?.evName ?? 'eec.page',
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
      event: params?.evName ?? 'eec.custom',
      eventData: {
        ...(event ?? {}),
      },
    });
  };

  const getEECProductDetails = (
    products: T_EA_DataProduct[],
    params?: TEECParams
  ) => {
    const dl = trackUtils
      .Catalog(options, products)
      .ProductDetails.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECProductsList = (
    products: T_EA_DataProduct[],
    params?: TEECParams
  ) => {
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

  return {
    misc: (event: T_EA_DataCustomEvent) => ({
      getEECCustom: (p?: TEECParams) => getEECCustom(event, p),
    }),
    page: (page?: T_EA_DataPage | null) => ({
      getEECPageView: (p?: TEECParams) => getEECPageView(page, p),
    }),
    profile: (profile?: T_EA_DataProfile | null) => ({
      getEECUserData: (p?: TEECParams) => getEECUserData(profile, p),
    }),
    catalog: (products: T_EA_DataProduct[]) => ({
      getEECProductsList: (p?: TEECParams) => getEECProductsList(products, p),
      getEECProductDetails: (p?: TEECParams) =>
        getEECProductDetails(products, p),
      getEECSearch: (p?: TEECParams) => getEECProductsList(products, p),
    }),
    basket: (basket: T_EA_DataBasket) => ({
      getEECCartAdd: (p?: TEECParams) => getEECCartAdd(basket, p),
      getEECCartRemove: (p?: TEECParams) => getEECCartRemove(basket, p),
      getEECCheckoutList: (p?: TEECParams) => getEECCheckoutList(basket, p),
    }),
    order: (order: T_EA_DataOrder) => ({
      getEECPurchased: (p?: TEECParams) => getEECPurchased(order, p),
      getEECRefund: (p?: TEECParams) => getEECRefund(order, p),
    }),
  };
};

export default getEEC;

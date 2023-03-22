import {
  TDataBasket,
  TDataOrder,
  TDataProduct,
  TEECParams,
  TEvtType,
  TSettings,
} from './shared';
import * as trackUtils from './utils';

export const getEEC = (options: TSettings) => {
  const _evt = <T extends {}>(
    payload: T,
    conditionFn?: (p: object) => boolean
  ): TEvtType<T> => ({
    when: (conditionFn: () => boolean) => {
      return _evt(payload, conditionFn);
    },
    push: (w: Window & typeof globalThis) => {
      const isOkayToPush = conditionFn ? conditionFn(payload) : true;
      w[options.dataLayerName] = w[options.dataLayerName] || [];
      isOkayToPush ? w[options.dataLayerName].push(payload) : void 0;
      return _evt(payload);
    },
    value: () => {
      return payload;
    },
  });

  const getEECUserData = (params?: TEECParams) => {
    return _evt({
      userData: {},
    });
  };

  const getEECPageView = (params?: TEECParams) => {
    return _evt({
      pageData: {},
    });
  };

  const getEECProductDetails = (
    products: TDataProduct[],
    params?: TEECParams
  ) => {
    const dl = trackUtils
      .Catalog(options, products)
      .ProductDetails.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECProductsList = (
    products: TDataProduct[],
    params?: TEECParams
  ) => {
    const dl = trackUtils
      .Catalog(options, products)
      .Products.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECCheckoutList = (basket: TDataBasket, params?: TEECParams) => {
    const dl = trackUtils
      .Basket(options, basket)
      .InitCheckout.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECPurchased = (order: TDataOrder, params?: TEECParams) => {
    const dl = trackUtils
      .Order(options, order)
      .Purchase.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECRefund = (order: TDataOrder, params?: TEECParams) => {
    const dl = trackUtils.Order(options, order).Refund.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECCartAdd = (basket: TDataBasket, params?: TEECParams) => {
    const dl = trackUtils
      .Basket(options, basket)
      .BasketAddProduct.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECCartRemove = (basket: TDataBasket, params?: TEECParams) => {
    const dl = trackUtils
      .Basket(options, basket)
      .BasketRemoveProduct.getEECDataLayer(params);
    return _evt(dl);
  };

  return {
    groups: {
      general: () => ({
        getEECPageView: (p?: TEECParams) => getEECPageView(p),
      }),
      profile: () => ({
        getEECUserData: (p?: TEECParams) => getEECUserData(p),
      }),
      catalog: (products: TDataProduct[]) => ({
        getEECProductsList: (p?: TEECParams) => getEECProductsList(products, p),
        getEECProductDetails: (p?: TEECParams) =>
          getEECProductDetails(products, p),
        getEECSearch: (p?: TEECParams) => getEECProductsList(products, p),
      }),
      basket: (basket: TDataBasket) => ({
        getEECCartAdd: (p?: TEECParams) => getEECCartAdd(basket, p),
        getEECCartRemove: (p?: TEECParams) => getEECCartRemove(basket, p),
        getEECCheckoutList: (p?: TEECParams) => getEECCheckoutList(basket, p),
      }),
      order: (order: TDataOrder) => ({
        getEECPurchased: (p?: TEECParams) => getEECPurchased(order, p),
        getEECRefund: (p?: TEECParams) => getEECRefund(order, p),
      }),
    },
  };
};

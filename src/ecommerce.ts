import {
  T_EA_DataBasket,
  T_EA_DataOrder,
  T_EA_DataProduct,
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
    groups: {
      general: () => ({
        getEECPageView: (p?: TEECParams) => getEECPageView(p),
      }),
      profile: () => ({
        getEECUserData: (p?: TEECParams) => getEECUserData(p),
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
    },
  };
};

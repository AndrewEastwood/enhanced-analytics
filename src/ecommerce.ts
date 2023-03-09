import { TDataBasket, TDataOrder, TDataProduct, TEECParams, TEvtType, TSettings } from "./shared";
import * as trackUtils from './utils';

export const getEEC = (options:TSettings) => {

  const _evt = <T extends {}>(payload:T, conditionFn?:(p:object) => boolean): TEvtType<T> => ({
    when: (conditionFn:() => boolean) => {
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

  const getEECUserData = (params?:TEECParams) => {
    return _evt({
      userData: {

      }
    });
  }


  const getEECPageView = (params?:TEECParams) => {
    return _evt({
      pageData: {

      }
    });
  }

  const getEECProductDetails = (products:TDataProduct[], params?:TEECParams) => {
    const dl = trackUtils.Catalog(options, products).ProductDetails.getEECDataLayer(params);
    return _evt(dl);
    // const {
    //   evName = 'eec.impressionView',
    //   listName = 'Search Results',
    //   products = [],
    // } = params;
    // return _evt({
    //   event: evName,
    //   ecommerce: {
    //     currencyCode: currency,
    //     impressions: products
    //       .map(p => ({
    //         ...p,
    //         list: listName
    //       })),
    //   },
    // });
  };

  const getEECProductsList = (products:TDataProduct[], params?:TEECParams) => {
    const dl = trackUtils.Catalog(options, products).Products.getEECDataLayer(params);
    return _evt(dl);
    // const {
    //   evName = 'eec.impressionView',
    //   listName = 'Search Results',
    //   products = [],
    // } = params;
    // return _evt({
    //   event: evName,
    //   ecommerce: {
    //     currencyCode: currency,
    //     impressions: products
    //       .map(p => ({
    //         ...p,
    //         list: listName
    //       })),
    //   },
    // });
  };

  const getEECCheckoutList = (basket:TDataBasket, params?:TEECParams) => {
    // const {
    //   // evName = 'eec.checkout',
    //   // listName = 'Search Results',
    //   // basket,
    // } = params;
    const dl = trackUtils.Basket(options, basket).InitCheckout.getEECDataLayer(params);
    return _evt(dl);
    // return _evt({
    //   event: evName,
    //   ecommerce: {
    //     checkout: {
    //       actionField: {
    //         step: 1
    //       },
    //       products: products
    //         .map(productMapper)
    //         .map(p => ({
    //           ...p,
    //           list: listName
    //         })),
    //     }
    //   }
    // });
  };

  const getEECPurchased = (order:TDataOrder, params?:TEECParams) => {
    const dl = trackUtils.Order(options, order).Purchase.getEECDataLayer(params);
    return _evt(dl);

    // const {
    //   evName = 'eec.purchase',
    //   listName = 'Search Results',
    //   _order = {} as TDataOrder,
    // } = params;
    // return _evt({
    //   event: evName,
    //   order: {
    //     id: order.id,
    //     total: order.revenue,
    //     tax: order.tax || null,
    //     datetime: order.dateCreated,
    //     paymentType: order.payment.type,
    //   },
    //   shipping: order.shipping,
    //   userData: {
    //     email: order.customer.email,
    //     phone_number: order.customer.phone,
    //     address: {
    //       first_name: order.customer.firstName,
    //       last_name: order.customer.lastName,
    //       street: order.customer.address.street,
    //       city: order.customer.address.city,
    //       region: order.customer.address.region,
    //       postal_code: order.customer.address.postcode,
    //       country: order.customer.address.country,
    //     },
    //   },
    //   ecommerce: {
    //     currencyCode: currency,
    //     purchase: {
    //       actionField: {
    //         id: order.id,
    //         affiliation: affiliation,
    //         revenue: order.total,
    //         coupon: order.coupon,
    //         shipping: order.shipping
    //       },
    //       products: order.products
    //         .map(p => ({
    //           ...p,
    //           list: listName
    //         })),
    //     },
    //   },
    // })
  };

  const getEECRefund = (order:TDataOrder, params?:TEECParams) => {
    const dl = trackUtils.Order(options, order).Refund.getEECDataLayer(params);
    return _evt(dl);
    // const {
    //   evName = 'eec.refund',
    //   order = {} as TDataOrder,
    // } = params;
    // return _evt({
    //   event: evName,
    //   ecommerce: {
    //     currencyCode: currency,
    //     refund: {
    //       actionField: {
    //         id: order.id,
    //       },
    //       products: (order.products || [])
    //     },
    //   },
    // })
  };

  const getEECCartAdd = (basket:TDataBasket, params?:TEECParams) => {
    const dl = trackUtils.Basket(options, basket).BasketAddProduct.getEECDataLayer(params);
    return _evt(dl);
    // const {
    //   evName = 'eec.add',
    //   listName = 'Shopping Cart',
    //   order = {} as TDataOrder,
    // } = params;
    // return _evt({
    //   event: evName,
    //   ecommerce: {
    //     currencyCode: currency,
    //     add: {
    //       actionField: {
    //         list: listName,
    //       },
    //       products: order.products
    //         .map(p => ({
    //           ...p,
    //           list: listName
    //         })),
    //     },
    //   },
    // });
  };

  const getEECCartRemove = (basket:TDataBasket, params?:TEECParams) => {
    const dl = trackUtils.Basket(options, basket).BasketRemoveProduct.getEECDataLayer(params);
    return _evt(dl);
    // const {
    //   evName = 'eec.remove',
    //   listName = 'Shopping Cart',
    // } = params;
    // return _evt({
    //   event: evName,
    //   ecommerce: {
    //     currencyCode: currency,
    //     remove: {
    //       actionField: {
    //         list: listName,
    //       },
    //       products: products
    //         .map(p => ({
    //           ...p,
    //           list: listName
    //         })),
    //     },
    //   },
    // });
  };

  return {
    groups: {
      general: () => ({
        getEECPageView: (p?:TEECParams) => getEECPageView(p),
      }),
      profile: () => ({
        getEECUserData: (p?:TEECParams) => getEECUserData(p),
      }),
      catalog: (products:TDataProduct[]) => ({
        getEECProductsList: (p?:TEECParams) => getEECProductsList(products, p),
        getEECProductDetails: (p?:TEECParams) => getEECProductDetails(products, p),
        getEECSearch: (p?:TEECParams) => getEECProductsList(products, p),
      }),
      basket: (basket:TDataBasket) => ({
        getEECCartAdd: (p?:TEECParams) => getEECCartAdd(basket, p),
        getEECCartRemove: (p?:TEECParams) => getEECCartRemove(basket, p),
        getEECCheckoutList: (p?:TEECParams) => getEECCheckoutList(basket, p),
      }),
      order: (order:TDataOrder) => ({
        getEECPurchased: (p?:TEECParams) => getEECPurchased(order, p),
        getEECRefund: (p?:TEECParams) => getEECRefund(order, p),
      }),
    },
    // getEECProductsList,
    // getEECCheckoutList,
    // getEECPurchased,
    // getEECCartAdd,
    // getEECCartRemove,
    // getEECRefund,
  };
}

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
    const dl = Catalog(options, products).ProductDetails.getEECDataLayer(
      params
    );
    return _evt(dl);
  };

  const getEECProductsList = (
    products: T_EA_DataProduct[],
    params?: TEECParams
  ) => {
    // https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#view_item_list
    const dl = Catalog(options, products).Products.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECCheckoutList = (basket: T_EA_DataBasket, params?: TEECParams) => {
    const dl = Basket(options, basket).InitCheckout.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECPurchased = (order: T_EA_DataOrder, params?: TEECParams) => {
    const dl = Order(options, order).Purchase.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECRefund = (order: T_EA_DataOrder, params?: TEECParams) => {
    const dl = Order(options, order).Refund.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECCartAdd = (basket: T_EA_DataBasket, params?: TEECParams) => {
    const dl = Basket(options, basket).BasketAddProduct.getEECDataLayer(params);
    return _evt(dl);
  };

  const getEECCartRemove = (basket: T_EA_DataBasket, params?: TEECParams) => {
    const dl = Basket(options, basket).BasketRemoveProduct.getEECDataLayer(
      params
    );
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
        ...Catalog(options, products).Products.getEECDataLayer(params)
          .ecommerce,
      },
    });
  };

  const getEECViewBasket = (basket: T_EA_DataBasket, params?: TEECParams) => {
    // https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#view_cart
    return _evt({
      event: 'view_cart',
      ecommerce: {
        ...Basket(options, basket).InitCheckout.getEECDataLayer(params)
          .ecommerce,
      },
    });
  };

  const getEECAddPaymentInfo = (order: T_EA_DataOrder, params?: TEECParams) => {
    // https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#add_payment_info
    const dataGA4 = Order(options, order).Purchase.getEECDataLayer(params);
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
    const dataGA4 = Order(options, order).Purchase.getEECDataLayer(params);
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

const EECUtils = {
  getProductItem: (product: T_EA_DataProduct) => {
    return {
      item_id: product.sku,
      item_name: product.title,
      index: product.viewOrder,
      item_brand: product.brand,
      item_category: product.category,
      discount:
        product.isSale && product.salePrice
          ? trackUtils.round(product.price - product.salePrice)
          : 0,
      item_variant: product.variant || '',
      price: product.isSale
        ? trackUtils.round(product.salePrice)
        : trackUtils.round(product.price),
      affiliation: product?.affiliation ?? null,
      ...(product.categories || []).reduce(
        (r, v, idx) => ({
          ...r,
          [`item_category${idx}`]: v,
        }),
        {}
      ),
      ...(product.quantity
        ? {
            quantity: trackUtils.round(product.quantity),
          }
        : {}),
      ...(product.gaLocationId
        ? {
            location_id: product.gaLocationId,
          }
        : {}),
      ...(product.dimensions || []).reduce(
        (r, v, idx) => ({
          ...r,
          [`item_dimension${idx}`]: v,
        }),
        {}
      ),
      ...(product.metrics || []).reduce(
        (r, v, idx) => ({
          ...r,
          [`item_metric${idx}`]: v,
        }),
        {}
      ),
    };
  },
};

const InitCheckout = (options: TSettings, basket: T_EA_DataBasket) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return InitCheckout(options, basket).getEECGA4DataLayer(param);
  },
  getEECUADataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'eec.checkout',
      basket,
      custom: {
        value: trackUtils.round(basket.total),
        currency: options.currency,
        totalQuantity: basket.quantity,
      },
      ecommerce: {
        currencyCode: options.currency,
        checkout: {
          actionField: {
            step: 1,
          },
          products: basket.products.map((p) => ({
            list:
              params?.listName || options.integrations?.ga?.defaultBasketName,
            id: p.id,
            sku: p.sku,
            name: p.title,
            category: p.category,
            brand: p.brand,
            price: p.price,
            quantity: p.quantity,
            variant: p.variant || '',
            ...(p.dimensions || []).reduce(
              (r, v, idx) => ({
                ...r,
                [`dimension${idx}`]: v,
              }),
              {}
            ),
            ...(p.metrics || []).reduce(
              (r, v, idx) => ({
                ...r,
                [`metric${idx}`]: v,
              }),
              {}
            ),
          })),
        },
      },
    };
  },
  getEECGA4DataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'begin_checkout',
      ecommerce: {
        currency: options.currency,
        value: trackUtils.round(basket.total),
        coupon: basket.coupon,
        item_list_name:
          params?.listName || options.integrations?.ga?.defaultBasketName,
        items: basket.products.map((product, idx) => ({
          ...EECUtils.getProductItem(product),
        })),
      },
    };
  },
});

const ProductDetails = (options: TSettings, product: T_EA_DataProduct) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return ProductDetails(options, product).getEECGA4DataLayer(param);
  },
  getEECUADataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'eec.detail',
      custom: {
        value: product.price,
        currency: options.currency,
        totalQuantity: 1,
        category: product.category,
        brand: product.brand,
        title: product.title,
        id: product.id,
      },
      ecommerce: {
        currencyCode: options.currency,
        detail: {
          actionField: {
            list:
              params?.listName || options.integrations?.ga?.defaultCatalogName,
          },
          products: [
            {
              id: product.id,
              sku: product.sku,
              name: product.title,
              category: product.category,
              brand: product.brand,
              price: product.price,
              variant: product.variant,
              ...(product.dimensions || []).reduce(
                (r, v, idx) => ({
                  ...r,
                  [`dimension${idx}`]: v,
                }),
                {}
              ),
              ...(product.metrics || []).reduce(
                (r, v, idx) => ({
                  ...r,
                  [`metric${idx}`]: v,
                }),
                {}
              ),
            },
          ],
        },
      },
    };
  },
  getEECGA4DataLayer: (params?: TEECParams) => {
    return {
      event: 'view_item',
      ecommerce: {
        currency: options.currency,
        value: product.isSale ? product.salePrice : product.price,
        item_list_name:
          params?.listName || options.integrations?.ga?.defaultCatalogName,
        items: [
          {
            ...EECUtils.getProductItem(product),
          },
        ],
      },
    };
  },
});

const Purchase = (options: TSettings, order: T_EA_DataOrder) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return Purchase(options, order).getEECGA4DataLayer(param);
  },
  getEECUADataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'eec.purchase',
      custom: {
        value: order.revenue,
        currency: options.currency,
        totalQuantity: order.quantity,
      },
      order,
      shipping: order.shipping,
      userData: {
        email: order.customer?.email,
        phone_number: order.customer?.phone,
        address: {
          first_name: order.customer?.firstName,
          last_name: order.customer?.lastName,
          street: order.customer?.address?.street,
          city: order.customer?.address?.city,
          region: order.customer?.address?.region,
          postal_code: order.customer?.address?.postcode,
          country: order.customer?.address?.country,
        },
      },
      ecommerce: {
        currencyCode: options.currency,
        purchase: {
          actionField: {
            id: order.id,
            affiliation: options.affiliation,
            revenue: order.revenue,
            shipping: order.shipping.cost,
            coupon: (order.coupon && order.coupon) || '',
          },
          products: order.products.map((p) => ({
            list:
              params?.listName || options.integrations?.ga?.defaultBasketName,
            id: p.id,
            sku: p.sku,
            name: p.title,
            category: p.category,
            brand: p.brand,
            price: p.price,
            quantity: p.quantity,
            variant: p.variant || '',
            ...(p.dimensions || []).reduce(
              (r, v, idx) => ({
                ...r,
                [`dimension${idx}`]: v,
              }),
              {}
            ),
            ...(p.metrics || []).reduce(
              (r, v, idx) => ({
                ...r,
                [`metric${idx}`]: v,
              }),
              {}
            ),
          })),
        },
      },
    };
  },
  getEECGA4DataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName ?? 'purchase',
      ecommerce: {
        transaction_id: order.id,
        value: order.revenue,
        tax: order.tax,
        shipping: order.shipping.cost,
        currency: options.currency,
        coupon: order.coupon,
        item_list_name:
          params?.listName || options.integrations?.ga?.defaultBasketName,
        items: order.products.map((product) => ({
          ...EECUtils.getProductItem(product),
        })),
      },
    };
  },
});

const Refund = (options: TSettings, order: T_EA_DataOrder) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return Refund(options, order).getEECGA4DataLayer(param);
  },
  getEECUADataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'eec.purchase',
      custom: {
        value: order.revenue,
        currency: options.currency,
        totalQuantity: order.quantity,
      },
      ecommerce: {
        currencyCode: options.currency,
        purchase: {
          actionField: {
            id: order.id,
            affiliation: options.affiliation,
            revenue: order.revenue,
            shipping: order.shipping.cost,
            coupon: order.coupon || '',
          },
          products: order.products.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.title,
            category: p.category,
            brand: p.brand,
            price: p.price,
            quantity: p.quantity,
            variant: p.variant || '',
            ...(p.dimensions || []).reduce(
              (r, v, idx) => ({
                ...r,
                [`dimension${idx}`]: v,
              }),
              {}
            ),
            ...(p.metrics || []).reduce(
              (r, v, idx) => ({
                ...r,
                [`metric${idx}`]: v,
              }),
              {}
            ),
          })),
        },
      },
    };
  },
  getEECGA4DataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName ?? 'refund',
      ecommerce: {
        transaction_id: order.id,
        value: order.revenue,
        tax: order.tax,
        shipping: order.shipping.cost,
        currency: options.currency,
        coupon: order.coupon,
        item_list_name:
          params?.listName || options.integrations?.ga?.defaultBasketName,
        items: order.products.map((product, idx) => ({
          ...EECUtils.getProductItem(product),
        })),
      },
    };
  },
});

const BasketAddProduct = (options: TSettings, basket: T_EA_DataBasket) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return BasketAddProduct(options, basket).getEECGA4DataLayer(param);
  },
  getEECUADataLayer: (params?: TEECParams) => {
    const product = basket.lastAdded?.[0] || {};
    return {
      event: params?.evName || 'eec.add',
      basket,
      custom: {
        value: product.total || 0,
        currency: options.currency,
        totalQuantity: product.quantity,
        category: product.category,
        brand: product.brand,
        title: product.title,
        id: product.id,
      },
      ecommerce: {
        currencyCode: options.currency,
        add: {
          actionField: {
            list:
              params?.listName || options.integrations?.ga?.defaultBasketName,
          },
          products: basket.lastAdded.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.title,
            category: p.category,
            brand: p.brand,
            price: p.price,
            quantity: p.quantity,
            variant: p.variant || '',
            ...(p.dimensions || []).reduce(
              (r, v, idx) => ({
                ...r,
                [`dimension${idx}`]: v,
              }),
              {}
            ),
            ...(p.metrics || []).reduce(
              (r, v, idx) => ({
                ...r,
                [`metric${idx}`]: v,
              }),
              {}
            ),
          })),
        },
      },
    };
  },
  getEECGA4DataLayer: (params?: TEECParams) => {
    const product = basket.lastAdded?.[0] || {};
    return {
      event: params?.evName ?? 'add_to_cart',
      ecommerce: {
        currency: options.currency,
        value: product.total ?? 0,
        item_list_name:
          params?.listName || options.integrations?.ga?.defaultBasketName,
        items: basket.lastAdded.map((product, idx) => ({
          ...EECUtils.getProductItem(product),
        })),
      },
    };
  },
});

const BasketRemoveProduct = (options: TSettings, basket: T_EA_DataBasket) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return BasketRemoveProduct(options, basket).getEECGA4DataLayer(param);
  },
  getEECUADataLayer: (params?: TEECParams) => {
    const product = basket.lastRemoved?.[0] || {};
    return {
      event: params?.evName || 'eec.remove',
      basket,
      custom: {
        value: product.total || 0,
        currency: options.currency,
        totalQuantity: product.quantity,
        category: product.category,
        brand: product.brand,
        title: product.title,
        id: product.id,
      },
      ecommerce: {
        currencyCode: options.currency,
        remove: {
          actionField: {
            list:
              params?.listName || options.integrations?.ga?.defaultBasketName,
          },
          products: basket.lastRemoved.map((p) => ({
            id: p.id,
            sku: p.sku,
            name: p.title,
            category: p.category,
            brand: p.brand,
            price: p.price,
            quantity: p.quantity,
            variant: p.variant || '',
            ...(p.dimensions || []).reduce(
              (r, v, idx) => ({
                ...r,
                [`dimension${idx}`]: v,
              }),
              {}
            ),
            ...(p.metrics || []).reduce(
              (r, v, idx) => ({
                ...r,
                [`metric${idx}`]: v,
              }),
              {}
            ),
          })),
        },
      },
    };
  },
  getEECGA4DataLayer: (params?: TEECParams) => {
    const product = basket.lastRemoved?.[0] || {};
    return {
      event: params?.evName ?? 'remove_from_cart',
      ecommerce: {
        currency: options.currency,
        value: product.total ?? 0,
        item_list_name:
          params?.listName || options.integrations?.ga?.defaultBasketName,
        items: basket.lastRemoved.map((product, idx) => ({
          ...EECUtils.getProductItem(product),
        })),
      },
    };
  },
});

const Products = (options: TSettings, products: T_EA_DataProduct[]) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return Products(options, products).getEECGA4DataLayer(param);
  },
  getEECUADataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'eec.impressionView',
      custom: {
        value: 1,
        currency: options.currency,
        totalQuantity: products.length,
      },
      ecommerce: {
        currencyCode: options.currency,
        impressions: products.map((p) => ({
          list:
            p.list ||
            params?.listName ||
            options.integrations?.ga?.defaultCatalogName,
          id: p.id,
          sku: p.sku,
          name: p.title,
          category: p.category,
          brand: p.brand,
          price: p.price,
          variant: p.variant || '',
          ...(p.dimensions || []).reduce(
            (r, v, idx) => ({
              ...r,
              [`dimension${idx}`]: v,
            }),
            {}
          ),
          ...(p.metrics || []).reduce(
            (r, v, idx) => ({
              ...r,
              [`metric${idx}`]: v,
            }),
            {}
          ),
        })),
      },
    };
  },
  getEECGA4DataLayer: (params?: TEECParams) => {
    return {
      event: 'view_item_list',
      ecommerce: {
        currency: options.currency,
        item_list_name:
          params?.listName || options.integrations?.ga?.defaultCatalogName,
        items: products.map((product) => ({
          ...EECUtils.getProductItem(product),
        })),
      },
    };
  },
});

const PageView = (options: TSettings) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return PageView(options).getEECGA4DataLayer(param);
  },
  getEECUADataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'eec.pageView',
    };
  },
  getEECGA4DataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'page_view',
    };
  },
});

const ProfileView = (options: TSettings) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return ProfileView(options).getEECGA4DataLayer(param);
  },
  getEECUADataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'eec.profileView',
    };
  },
  getEECGA4DataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'eec.profileView',
    };
  },
});

const Page = (options: TSettings) => {
  return {
    View: PageView(options),
  };
};

const Profile = (options: TSettings) => {
  return {
    View: ProfileView(options),
  };
};

const Catalog = (options: TSettings, products: T_EA_DataProduct[]) => {
  return {
    Products: Products(options, products),
    ProductDetails: ProductDetails(options, products[0]),
  };
};

const Basket = (options: TSettings, basket: T_EA_DataBasket) => {
  return {
    BasketAddProduct: BasketAddProduct(options, basket),
    BasketRemoveProduct: BasketRemoveProduct(options, basket),
    InitCheckout: InitCheckout(options, basket),
  };
};

const Order = (options: TSettings, order: T_EA_DataOrder) => {
  return {
    Purchase: Purchase(options, order),
    Refund: Refund(options, order),
  };
};

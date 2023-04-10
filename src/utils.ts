import { getConfig } from './config';
import {
  T_EA_DataBasket,
  T_EA_DataOrder,
  T_EA_DataProduct,
  TEECParams,
  TSettings,
} from './shared';

export const isBrowserMode = typeof globalThis.window !== 'undefined';

const getEvtUUIDStr = () => {
  const c = getConfig();
  return `_uuid_${c?.resolvers?.eventUUID?.()}`;
};

const getEventNameOfIdentify = () => {
  return '';
};

const getEventNameOfCustom = (e: string) => {
  return `new_custom_of_${e}${getEvtUUIDStr()}`;
};

const getEventNameOfTransaction = (order: T_EA_DataOrder) => {
  return `new_order_of_${order.id}${getEvtUUIDStr()}`;
};

const getEventNameOfSubscription = (email: string) => {
  return `new_sub_of_${email}${getEvtUUIDStr()}`;
};

const getEventNameOfLead = (modifier: string) => {
  return `new_lead_of_${modifier}${getEvtUUIDStr()}`;
};

const getEventNameOfProductAddToCart = (p: T_EA_DataProduct) => {
  return `add_product_of_${p.id}_q${p.quantity}${getEvtUUIDStr()}`;
};

const getEventNameOfProductRemoveFromCart = (p: T_EA_DataProduct) => {
  return `rem_product_of_${p.id}_q${p.quantity}${getEvtUUIDStr()}`;
};

const getEventNameOfProductItemView = (product: T_EA_DataProduct) => {
  return `view_product_of_${product.id}${getEvtUUIDStr()}`;
};

const getEventNameOfSearch = (
  searchTerm: string,
  products: T_EA_DataProduct[]
) => {
  return `search_of_${searchTerm}_found${products.length}${getEvtUUIDStr()}`;
};

const getEventNameOfPageView = () => {
  const c = getConfig();
  const page = c?.resolvers?.page?.();
  return `page_view_of_${encodeURIComponent(
    page?.name || 'root'
  )}${getEvtUUIDStr()}`;
};

const getEventNameOfInitiateCheckout = (basket: T_EA_DataBasket) => {
  return `init_checkout_of_p${basket.quantity}_${round(basket.total).toFixed(
    2
  )}${getEvtUUIDStr()}`;
};

const getEventNameOfNewProfile = () => {
  return '';
};

export const round = (num?: number | string, precision = 2) => {
  return +(
    Math.round(new Number((num ?? '0') + 'e+' + precision).valueOf()) +
    'e-' +
    precision
  );
};

const EECUtils = {
  getProductItem: (product: T_EA_DataProduct) => {
    return {
      item_id: product.sku,
      item_name: product.title,
      index: product.viewOrder,
      item_brand: product.brand,
      item_category: product.category,
      discount: product.isSale ? round(product.price - product.salePrice) : 0,
      item_variant: product.variant || '',
      price: product.isSale ? round(product.salePrice) : round(product.price),
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
            quantity: round(product.quantity),
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
    return options.integrations?.ga?.ga4
      ? InitCheckout(options, basket).getEECGA4DataLayer(param)
      : InitCheckout(options, basket).getEECUADataLayer(param);
  },
  getEECUADataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'eec.checkout',
      basket,
      custom: {
        value: round(basket.total),
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
            list: params?.listName || options.defaultBasketName,
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
        value: round(basket.total),
        coupon: basket.coupon,
        item_list_name: params?.listName || options.defaultBasketName,
        items: basket.products.map((product, idx) => ({
          ...EECUtils.getProductItem(product),
        })),
      },
    };
  },
});

const ProductDetails = (options: TSettings, product: T_EA_DataProduct) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return options.integrations?.ga?.ga4
      ? ProductDetails(options, product).getEECGA4DataLayer(param)
      : ProductDetails(options, product).getEECUADataLayer(param);
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
            list: params?.listName || options.defaultCatalogName,
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
        item_list_name: params?.listName || options.defaultCatalogName,
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
    return options.integrations?.ga?.ga4
      ? Purchase(options, order).getEECGA4DataLayer(param)
      : Purchase(options, order).getEECUADataLayer(param);
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
        email: order.customer.email,
        phone_number: order.customer.phone,
        address: {
          first_name: order.customer.firstName,
          last_name: order.customer.lastName,
          street: order.customer.address?.street,
          city: order.customer.address?.city,
          region: order.customer.address?.region,
          postal_code: order.customer.address?.postcode,
          country: order.customer.address?.country,
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
            list: params?.listName || options.defaultBasketName,
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
        item_list_name: params?.listName || options.defaultBasketName,
        items: order.products.map((product, idx) => ({
          ...EECUtils.getProductItem(product),
        })),
      },
    };
  },
});

const Refund = (options: TSettings, order: T_EA_DataOrder) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return options.integrations?.ga?.ga4
      ? Refund(options, order).getEECGA4DataLayer(param)
      : Refund(options, order).getEECUADataLayer(param);
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
        item_list_name: params?.listName || options.defaultBasketName,
        items: order.products.map((product, idx) => ({
          ...EECUtils.getProductItem(product),
        })),
      },
    };
  },
});

const BasketAddProduct = (options: TSettings, basket: T_EA_DataBasket) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return options.integrations?.ga?.ga4
      ? BasketAddProduct(options, basket).getEECGA4DataLayer(param)
      : BasketAddProduct(options, basket).getEECUADataLayer(param);
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
            list: params?.listName || options.defaultBasketName,
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
        item_list_name: params?.listName || options.defaultBasketName,
        items: basket.lastAdded.map((product, idx) => ({
          ...EECUtils.getProductItem(product),
        })),
      },
    };
  },
});

const BasketRemoveProduct = (options: TSettings, basket: T_EA_DataBasket) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return options.integrations?.ga?.ga4
      ? BasketRemoveProduct(options, basket).getEECGA4DataLayer(param)
      : BasketRemoveProduct(options, basket).getEECUADataLayer(param);
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
            list: params?.listName || options.defaultBasketName,
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
        item_list_name: params?.listName || options.defaultBasketName,
        items: basket.lastRemoved.map((product, idx) => ({
          ...EECUtils.getProductItem(product),
        })),
      },
    };
  },
});

const Products = (options: TSettings, products: T_EA_DataProduct[]) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return options.integrations?.ga?.ga4
      ? Products(options, products).getEECGA4DataLayer(param)
      : Products(options, products).getEECUADataLayer(param);
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
          list: p.list || params?.listName || options.defaultCatalogName,
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
        item_list_name: params?.listName || options.defaultCatalogName,
        items: products.map((product) => ({
          ...EECUtils.getProductItem(product),
        })),
      },
    };
  },
});

const PageView = (options: TSettings) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return options.integrations?.ga?.ga4
      ? PageView(options).getEECGA4DataLayer(param)
      : PageView(options).getEECUADataLayer(param);
  },
  getEECUADataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'eec.pageView',
    };
  },
  getEECGA4DataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'eec.pageView',
    };
  },
});

const ProfileView = (options: TSettings) => ({
  getEECDataLayer: (param?: TEECParams) => {
    return options.integrations?.ga?.ga4
      ? ProfileView(options).getEECGA4DataLayer(param)
      : ProfileView(options).getEECUADataLayer(param);
  },
  getEECUADataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'eec.profileView',
    };
  },
  getEECGA4DataLayer: (params?: TEECParams) => {
    return {};
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

export {
  getEventNameOfCustom,
  getEventNameOfIdentify,
  getEventNameOfTransaction,
  getEventNameOfProductAddToCart,
  getEventNameOfProductRemoveFromCart,
  getEventNameOfProductItemView,
  getEventNameOfSearch,
  getEventNameOfPageView,
  getEventNameOfInitiateCheckout,
  getEventNameOfNewProfile,
  getEventNameOfSubscription,
  getEventNameOfLead,
  Basket,
  Order,
  Catalog,
  Page,
  Profile,
};

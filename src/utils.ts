import { getConfig } from './config';
import {
  ETrackers,
  T_EA_DataBasket,
  T_EA_DataOrder,
  T_EA_DataProduct,
  TEECParams,
  TSettings,
} from './shared';

const getEvtUUIDStr = () => {
  const c = getConfig();
  return `_uuid_${c?.resolvers?.eventUUID?.()}`;
};

const getEventNameOfIdentify = () => {
  return '';
};

const getEventNameOfTransaction = (order: T_EA_DataOrder) => {
  return `new_order_of_${order.id}${getEvtUUIDStr()}`;
};

const getEventNameOfProductAddToCart = (p: T_EA_DataProduct) => {
  // const ids = p.map(v => v.id).join('/');
  // const qqs = p.map(v => v.quantity).join('/');
  return `add_product_of_${p.id}_q${p.quantity}${getEvtUUIDStr()}`;
};

const getEventNameOfProductRemoveFromCart = (p: T_EA_DataProduct) => {
  // const ids = p.map(v => v.id).join('/');
  // const qqs = p.map(v => v.quantity).join('/');
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
  return `init_checkout_of_p${basket.quantity}_${basket.total.toFixed(
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

const InitCheckout = (options: TSettings, basket: T_EA_DataBasket) => ({
  getContents: () => {
    const sdk = options.integrations?.[ETrackers.Facebook]?.sdk;
    if (!sdk) {
      throw 'Facebook is configured without SDK; Please provide SDK;';
    }
    const Content = sdk.Content;
    const DeliveryCategory = sdk.DeliveryCategory;
    return Object.values(basket.products).map((storedProduct) =>
      new Content()
        .setId(storedProduct.id.toString())
        .setQuantity(round(storedProduct.quantity))
        .setTitle(storedProduct.title)
        .setBrand(storedProduct.brand)
        .setDescription(storedProduct.description)
        .setCategory(storedProduct.category)
        .setItemPrice(storedProduct.price)
        .setDeliveryCategory(DeliveryCategory.HOME_DELIVERY)
    );
  },
  getContentsStr: () => {
    return JSON.stringify(
      InitCheckout(options, basket)
        .getContents()
        .map((v) => v.normalize())
    );
  },
  getEECDataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'eec.checkout',
      basket,
      custom: {
        value: basket.total,
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
});

const ProductDetails = (options: TSettings, product: T_EA_DataProduct) => ({
  getContents: () => {
    const sdk = options.integrations?.[ETrackers.Facebook]?.sdk;
    if (!sdk) {
      throw 'Facebook is configured without SDK; Please provide SDK;';
    }
    const Content = sdk.Content;
    return new Content()
      .setId(product.id.toString())
      .setTitle(product.title)
      .setBrand(product.brand)
      .setDescription(product.description)
      .setCategory(product.category)
      .setItemPrice(product.price);
  },
  getContentsStr: (product) => {
    return JSON.stringify([
      ProductDetails(options, product).getContents().normalize(),
    ]);
  },
  getEECDataLayer: (params?: TEECParams) => {
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
});

const Purchase = (options: TSettings, order: T_EA_DataOrder) => ({
  getContents: () => {
    const sdk = options.integrations?.[ETrackers.Facebook]?.sdk;
    if (!sdk) {
      throw 'Facebook is configured without SDK; Please provide SDK;';
    }
    const Content = sdk.Content;
    const DeliveryCategory = sdk.DeliveryCategory;
    return Object.values(order.products).map((storedProduct) =>
      new Content()
        .setId(storedProduct.id.toString())
        .setQuantity(round(storedProduct.quantity))
        .setTitle(storedProduct.title)
        .setBrand(storedProduct.brand)
        .setDescription(storedProduct.description)
        .setCategory(storedProduct.category)
        .setItemPrice(storedProduct.price)
        .setDeliveryCategory(DeliveryCategory.HOME_DELIVERY)
    );
  },
  getContentsStr: () => {
    return JSON.stringify(
      Purchase(options, order)
        .getContents()
        .map((c) => c.normalize())
    );
  },
  getEECDataLayer: (params?: TEECParams) => {
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
});

const Refund = (options: TSettings, order: T_EA_DataOrder) => ({
  getContents: () => {
    const sdk = options.integrations?.[ETrackers.Facebook]?.sdk;
    if (!sdk) {
      throw 'Facebook is configured without SDK; Please provide SDK;';
    }
    const Content = sdk.Content;
    const DeliveryCategory = sdk.DeliveryCategory;
    return order.products.map((storedProduct) =>
      new Content()
        .setId(storedProduct.id.toString())
        .setQuantity(round(storedProduct.quantity))
        .setTitle(storedProduct.title)
        .setBrand(storedProduct.brand)
        .setDescription(storedProduct.description)
        .setCategory(storedProduct.category)
        .setItemPrice(storedProduct.price)
        .setDeliveryCategory(DeliveryCategory.HOME_DELIVERY)
    );
  },
  getContentsStr: () => {
    return JSON.stringify(
      Refund(options, order)
        .getContents()
        .map((v) => v.normalize())
    );
  },
  getEECDataLayer: (params?: TEECParams) => {
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
});

const BasketAddProduct = (options: TSettings, basket: T_EA_DataBasket) => ({
  getContents: () => {
    const sdk = options.integrations?.[ETrackers.Facebook]?.sdk;
    if (!sdk) {
      throw 'Facebook is configured without SDK; Please provide SDK;';
    }
    // const product = basket.lastAdded?.[0] || {};
    const Content = sdk.Content;
    return basket.lastAdded.map((product) =>
      new Content()
        .setId(product.id.toString())
        .setQuantity(round(product.quantity))
        .setTitle(product.title)
        .setBrand(product.brand)
        .setDescription(product.description)
        .setCategory(product.category)
        .setItemPrice(product.price)
    );
  },
  getContentsStr: () => {
    return JSON.stringify(
      BasketAddProduct(options, basket)
        .getContents()
        .map((v) => v.normalize())
    );
  },
  getEECDataLayer: (params?: TEECParams) => {
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
});

const BasketRemoveProduct = (options: TSettings, basket: T_EA_DataBasket) => ({
  getContents: () => {
    const sdk = options.integrations?.[ETrackers.Facebook]?.sdk;
    if (!sdk) {
      throw 'Facebook is configured without SDK; Please provide SDK;';
    }
    // const product = basket.lastRemoved?.[0] || {};
    const Content = sdk.Content;
    return basket.lastRemoved.map((product) =>
      new Content()
        .setId(product.id.toString())
        .setQuantity(round(product.quantity))
        .setTitle(product.title)
        .setBrand(product.brand)
        .setDescription(product.description)
        .setCategory(product.category)
        .setItemPrice(product.price)
    );
  },
  getContentsStr: () => {
    return JSON.stringify(
      BasketRemoveProduct(options, basket)
        .getContents()
        .map((v) => v.normalize())
    );
  },
  getEECDataLayer: (params?: TEECParams) => {
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
});

const Products = (options: TSettings, products: T_EA_DataProduct[]) => ({
  getEECDataLayer: (params?: TEECParams) => {
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
});

const PageView = (options: TSettings) => ({
  getContents: () => {
    const sdk = options.integrations?.[ETrackers.Facebook]?.sdk;
    if (!sdk) {
      throw 'Facebook is configured without SDK; Please provide SDK;';
    }
    return [] as any[];
  },
  getContentsStr: () => {
    return JSON.stringify(
      PageView(options)
        .getContents()
        .map((v) => v.normalize())
    );
  },
  getEECDataLayer: (params?: TEECParams) => {
    return {
      event: params?.evName || 'eec.pageView',
    };
  },
});

const ProfileView = (options: TSettings) => ({
  getContents: () => {
    const sdk = options.integrations?.[ETrackers.Facebook]?.sdk;
    if (!sdk) {
      throw 'Facebook is configured without SDK; Please provide SDK;';
    }
    return [] as any[];
  },
  getContentsStr: () => {
    return JSON.stringify(
      ProfileView(options)
        .getContents()
        .map((v) => v.normalize())
    );
  },
  getEECDataLayer: (params?: TEECParams) => {
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

export {
  getEventNameOfIdentify,
  getEventNameOfTransaction,
  getEventNameOfProductAddToCart,
  getEventNameOfProductRemoveFromCart,
  getEventNameOfProductItemView,
  getEventNameOfSearch,
  getEventNameOfPageView,
  getEventNameOfInitiateCheckout,
  getEventNameOfNewProfile,
  Basket,
  Order,
  Catalog,
  Page,
  Profile,
};

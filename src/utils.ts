import { getConfig } from './config';
import { Request } from 'express';
import { ETrackers, TDataBasket, TDataOrder, TDataProduct, TEECParams, TSettings } from './shared';

const getEvtUUIDStr = (request:Request) => {
  const c = getConfig();
  return `_uuid_${c?.serverAnalytics?.resolvers?.serverEventUUID(request)}`;
}

const getEventNameOfIdentify = (request:Request) => {
  return '';
}

const getEventNameOfTransaction = (request:Request, order:TDataOrder) => {
  return `new_order_of_${order.id}${getEvtUUIDStr(request)}`;
}

const getEventNameOfProductAddToCart = (request:Request, p:TDataProduct) => {
  // const ids = p.map(v => v.id).join('/');
  // const qqs = p.map(v => v.quantity).join('/');
  return `add_product_of_${p.id}_q${p.quantity}${getEvtUUIDStr(request)}`;
}

const getEventNameOfProductRemoveFromCart = (request:Request, p:TDataProduct) => {
  // const ids = p.map(v => v.id).join('/');
  // const qqs = p.map(v => v.quantity).join('/');
  return `rem_product_of_${p.id}_q${p.quantity}${getEvtUUIDStr(request)}`;
}

const getEventNameOfProductItemView = (request:Request, product:TDataProduct) => {
  return `view_product_of_${product.id}${getEvtUUIDStr(request)}`;
}

const getEventNameOfSearch = (request:Request, searchTerm:string, products:TDataProduct[]) => {
  return `search_of_${searchTerm}_found${products.length}${getEvtUUIDStr(request)}`;
}

const getEventNameOfPageView = (request:Request) => {
  return `page_view_of_${encodeURIComponent(request.path.substr(1) || 'root')}${getEvtUUIDStr(request)}`;
}

const getEventNameOfInitiateCheckout = (request:Request, basket:TDataBasket) => {
  return `init_checkout_of_p${basket.quantity}_${basket.total.toFixed(2)}${getEvtUUIDStr(request)}`;
}

const getEventNameOfNewProfile = (request) => {
  return '';
}

const InitCheckout = (options:TSettings, basket:TDataBasket) => ({
  getContents: () => {
    const sdk = options.serverAnalytics?.[ETrackers.Facebook]?.sdk;
    if (!sdk) {
      throw 'Facebook is configured without SDK; Please provide SDK;'
    }
    const Content = sdk.Content;
    const DeliveryCategory = sdk.DeliveryCategory;
    return Object
      .values(basket.products)
      .map(storedProduct => (new Content())
        .setId(storedProduct.id)
        .setQuantity(storedProduct.quantity)
        .setTitle(storedProduct.title)
        .setBrand(storedProduct.brand)
        .setDescription(storedProduct.description)
        .setCategory(storedProduct.category)
        .setItemPrice(storedProduct.price)
        .setDeliveryCategory(DeliveryCategory.HOME_DELIVERY)
      );
  },
  getContentsStr: () => {
    return JSON.stringify(InitCheckout(options, basket).getContents().map(v => v.normalize()));
  },
  getEECDataLayer: (params?:TEECParams) => {
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
          products: basket.products
            .map(p => ({
              list: params?.listName || options.defaultBasketName,
              id: p.id,
              sku: p.sku,
              name: p.title,
              category: p.category,
              brand: p.brand,
              price: p.price,
              quantity: p.quantity,
              variant: p.variant || '',
              ...(p.dimensions || []).reduce((r, v, idx) => ({
                ...r,
                [`dimension${idx}`]: v,
              }), {}),
              ...(p.metrics || []).reduce((r, v, idx) => ({
                ...r,
                [`metric${idx}`]: v,
              }), {}),
            })),
        },
      },
    };
  },
});

const ProductDetails = (options:TSettings, product:TDataProduct) => ({
  getContents: () => {
    const sdk = options.serverAnalytics?.[ETrackers.Facebook]?.sdk;
    if (!sdk) {
      throw 'Facebook is configured without SDK; Please provide SDK;'
    }
    const Content = sdk.Content;
    return new Content()
      .setId(product.id)
      .setTitle(product.title)
      .setBrand(product.brand)
      .setDescription(product.description)
      .setCategory(product.category)
      .setItemPrice(product.price);
  },
  getContentsStr: (product) => {
    return JSON.stringify([ProductDetails(options, product).getContents().normalize()]);
  },
  getEECDataLayer: (params?:TEECParams) => {
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
          products: [{
            id: product.id,
            sku: product.sku,
            name: product.title,
            category: product.category,
            brand: product.brand,
            price: product.price,
            variant: product.variant,
            ...(product.dimensions || []).reduce((r, v, idx) => ({
              ...r,
              [`dimension${idx}`]: v,
            }), {}),
            ...(product.metrics || []).reduce((r, v, idx) => ({
              ...r,
              [`metric${idx}`]: v,
            }), {}),
          }]
        },
      },
    };
  },
});

const Purchase = (options:TSettings, order:TDataOrder) => ({
  getContents: () => {
    const sdk = options.serverAnalytics?.[ETrackers.Facebook]?.sdk;
    if (!sdk) {
      throw 'Facebook is configured without SDK; Please provide SDK;'
    }
    const Content = sdk.Content;
    const DeliveryCategory = sdk.DeliveryCategory;
    return Object
      .values(order.products)
      .map(storedProduct => (new Content())
        .setId(storedProduct.id)
        .setQuantity(storedProduct.quantity)
        .setTitle(storedProduct.title)
        .setBrand(storedProduct.brand)
        .setDescription(storedProduct.description)
        .setCategory(storedProduct.category)
        .setItemPrice(storedProduct.price)
        .setDeliveryCategory(DeliveryCategory.HOME_DELIVERY)
      )
  },
  getContentsStr: () => {
    return JSON.stringify(Purchase(options, order).getContents().map(c => c.normalize()));
  },
  getEECDataLayer: (params?:TEECParams) => {
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
            coupon: order.coupon && order.coupon || '',
          },
          products: order.products
            .map(p => ({
              list: params?.listName || options.defaultBasketName,
              id: p.id,
              sku: p.sku,
              name: p.title,
              category: p.category,
              brand: p.brand,
              price: p.price,
              quantity: p.quantity,
              variant: p.variant || '',
              ...(p.dimensions || []).reduce((r, v, idx) => ({
                ...r,
                [`dimension${idx}`]: v,
              }), {}),
              ...(p.metrics || []).reduce((r, v, idx) => ({
                ...r,
                [`metric${idx}`]: v,
              }), {}),
            })),
        },
      },
    };
  },
});

const Refund = (options:TSettings, order:TDataOrder) => ({
  getContents: () => {
    const sdk = options.serverAnalytics?.[ETrackers.Facebook]?.sdk;
    if (!sdk) {
      throw 'Facebook is configured without SDK; Please provide SDK;'
    }
    const Content = sdk.Content;
    const DeliveryCategory = sdk.DeliveryCategory;
    return order.products
      .map(storedProduct => (new Content())
        .setId(storedProduct.id)
        .setQuantity(storedProduct.quantity)
        .setTitle(storedProduct.title)
        .setBrand(storedProduct.brand)
        .setDescription(storedProduct.description)
        .setCategory(storedProduct.category)
        .setItemPrice(storedProduct.price)
        .setDeliveryCategory(DeliveryCategory.HOME_DELIVERY)
      )
  },
  getContentsStr: () => {
    return JSON.stringify(Refund(options, order).getContents().map(v => v.normalize()));
  },
  getEECDataLayer: (params?:TEECParams) => {
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
          products: order.products
            .map(p => ({
              id: p.id,
              sku: p.sku,
              name: p.title,
              category: p.category,
              brand: p.brand,
              price: p.price,
              quantity: p.quantity,
              variant: p.variant || '',
              ...(p.dimensions || []).reduce((r, v, idx) => ({
                ...r,
                [`dimension${idx}`]: v,
              }), {}),
              ...(p.metrics || []).reduce((r, v, idx) => ({
                ...r,
                [`metric${idx}`]: v,
              }), {}),
            })),
        },
      },
    };
  },
});

const BasketAddProduct = (options:TSettings, basket:TDataBasket) => ({
  getContents: () => {
    const sdk = options.serverAnalytics?.[ETrackers.Facebook]?.sdk;
    if (!sdk) {
      throw 'Facebook is configured without SDK; Please provide SDK;'
    }
    // const product = basket.lastAdded?.[0] || {};
    const Content = sdk.Content;
    return basket.lastAdded
      .map(product => (new Content())
      .setId(product.id)
      .setQuantity(product.quantity)
      .setTitle(product.title)
      .setBrand(product.brand)
      .setDescription(product.description)
      .setCategory(product.category)
      .setItemPrice(product.price)
    );
  },
  getContentsStr: () => {
    return JSON.stringify(BasketAddProduct(options, basket).getContents().map(v => v.normalize()));
  },
  getEECDataLayer: (params?:TEECParams) => {
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
          products: basket.lastAdded
            .map(p => ({
              id: p.id,
              sku: p.sku,
              name: p.title,
              category: p.category,
              brand: p.brand,
              price: p.price,
              quantity: p.quantity,
              variant: p.variant || '',
              ...(p.dimensions || []).reduce((r, v, idx) => ({
                ...r,
                [`dimension${idx}`]: v,
              }), {}),
              ...(p.metrics || []).reduce((r, v, idx) => ({
                ...r,
                [`metric${idx}`]: v,
              }), {}),
            })),
        },
      },
    };
  },
});

const BasketRemoveProduct = (options:TSettings, basket:TDataBasket) => ({
  getContents: () => {
    const sdk = options.serverAnalytics?.[ETrackers.Facebook]?.sdk;
    if (!sdk) {
      throw 'Facebook is configured without SDK; Please provide SDK;'
    }
    // const product = basket.lastRemoved?.[0] || {};
    const Content = sdk.Content;
    return basket.lastRemoved.map(product =>
      (new Content())
        .setId(product.id)
        .setQuantity(product.quantity)
        .setTitle(product.title)
        .setBrand(product.brand)
        .setDescription(product.description)
        .setCategory(product.category)
        .setItemPrice(product.price)
    );
  },
  getContentsStr: () => {
    return JSON.stringify(BasketRemoveProduct(options, basket).getContents().map(v => v.normalize()));
  },
  getEECDataLayer: (params?:TEECParams) => {
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
          products: basket.lastRemoved
            .map(p => ({
              id: p.id,
              sku: p.sku,
              name: p.title,
              category: p.category,
              brand: p.brand,
              price: p.price,
              quantity: p.quantity,
              variant: p.variant || '',
              ...(p.dimensions || []).reduce((r, v, idx) => ({
                ...r,
                [`dimension${idx}`]: v,
              }), {}),
              ...(p.metrics || []).reduce((r, v, idx) => ({
                ...r,
                [`metric${idx}`]: v,
              }), {}),
            })),
        },
      },
    };
  },
});

const Products = (options:TSettings, products:TDataProduct[]) => ({
  getEECDataLayer: (params?:TEECParams) => {
    return {
      event: params?.evName || 'eec.impressionView',
      custom: {
        value: 1,
        currency: options.currency,
        totalQuantity: products.length,
      },
      ecommerce: {
        currencyCode: options.currency,
        impressions: products
          .map(p => ({
            list: p.list || params?.listName || options.defaultCatalogName,
            id: p.id,
            sku: p.sku,
            name: p.title,
            category: p.category,
            brand: p.brand,
            price: p.price,
            variant: p.variant || '',
            ...(p.dimensions || []).reduce((r, v, idx) => ({
              ...r,
              [`dimension${idx}`]: v,
            }), {}),
            ...(p.metrics || []).reduce((r, v, idx) => ({
              ...r,
              [`metric${idx}`]: v,
            }), {}),
          })),
      },
    };
  },
});



const Page = (options:TSettings) => ({
  getEECDataLayer: (params?:TEECParams) => {
    return {
      event: params?.evName || 'eec.impressionView',
    };
  },
});

const Catalog = (options:TSettings, products:TDataProduct[]) => {
  return {
    Products: Products(options, products),
    ProductDetails: ProductDetails(options, products[0]),
  };
}

const Basket = (options:TSettings, basket:TDataBasket) => {
  return {
    BasketAddProduct: BasketAddProduct(options, basket),
    BasketRemoveProduct: BasketRemoveProduct(options, basket),
    InitCheckout: InitCheckout(options, basket),
  };
};

const Order = (options:TSettings, order:TDataOrder) => {
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
  // Page,
}

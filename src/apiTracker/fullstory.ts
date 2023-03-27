/*
FullStory.event('orderCreated', {
  orderId: orderItem.id,
});
FullStory.identify(orderItem.id.toString(), {
  displayName: orderItem.customerFullName,
});
FullStory.setUserVars({
  uid: 'explicit user id',
  displayName: orderItem.customerFullName,
  email: 'ddsd@sss.com',
  orderId: orderItem.id,
  orderTotal: orderItem.total,
  orderDate_date: moment(orderItem.dateCreated).format(),
});
orderItem?.seen
  ? void 0
  : FullStory.event('orderSeen', {
      orderId: orderItem.id,
    });
FullStory.setVars('page', {
  pageName: getRuntime().PAGES.CHECKOUT.TITLE,
  cartItems: cartItems.length,
});
FullStory.setVars('page', {
          pageName: getRuntime().PAGES.CHECKOUT.TITLE,
          cartItems: cartItems.length,
        })
FS.event('Product Added', {
  cart_id: '130983678493',
  product_id: '798ith22928347',
  sku: 'L-100',
  category: 'Clothing',
  name: 'Button Front Cardigan',
  brand: 'Bright & Bold',
  variant: 'Blue',
  price: 58.99,
  quantity: 1,
  coupon: '25OFF',
  position: 3,
  url: 'https://www.example.com/product/path',
  image_url: 'https://www.example.com/product/path.jpg'
});
FS.event('Subscribed', {
  uid: '750948353',
  plan_name: 'Professional',
  plan_price: 299,
  plan_users: 10,
  days_in_trial: 42,
  feature_packs: ['MAPS', 'DEV', 'DATA'],
});
FS.event('Order Completed', {
  orderId: '23f3er3d',
  products: [{
    productId: '9v87h4f8',
    price: 20.00,
    quantity: 0.75
  }, {
    productId: '4738b43z',
    price: 12.87,
    quantity: 6,
  }]
});
FS.setVars("page", {
 "pageName" : "Checkout", // what is the name of the page?
 "cart_size_int" : 10, // how many items were in the cart?
 "used_coupon_bool" : true, // was a coupon used?
});

*/

import {
  TSettings,
  TDataProduct,
  TDataProfile,
  TDataOrder,
  TDataBasket,
  TDataCustomEvent,
} from '../shared';
import * as trackUtils from '../utils';
import { TDataPage } from '../shared';

let uiLibInstalled = false;

export const fullstoryTracker = (options: TSettings) => {
  const { absoluteURL, integrations: analytics } = options;
  const bizSdk = analytics?.fullstory?.sdk;

  if (!document) {
    throw 'FullStory cannot be run out of browser;';
  }

  if (!bizSdk) {
    throw 'FullStory is not configured;';
  }

  const { init, event, identify, setUserVars, setVars } = bizSdk;

  uiLibInstalled
    ? void 0
    : init({
        orgId: analytics?.fullstory?.orgId,
      });

  uiLibInstalled = true;

  const getUserObj = (profile?: TDataProfile | null) => {
    const u = profile ? profile : options.resolvers?.profile?.();
    return u;
  };

  const fldTypeResolver = (fld: any) => {
    const isArr = Array.isArray(fld);
    const val = isArr ? (fld.length > 0 ? fld[0] : '') : fld;
    const fldType =
      typeof val === 'string'
        ? 'str'
        : typeof val === 'boolean'
        ? 'bool'
        : Number.isInteger(val)
        ? 'int'
        : !Number.isInteger(val)
        ? 'real'
        : val instanceof Date
        ? 'date'
        : 'str';
    return fldType + (isArr ? 's' : '');
  };

  const normalizePayloadFieldNames = (
    payload?: Record<string, any>
  ): Record<string, any> =>
    Object.entries(payload ?? {}).reduce((r, entry) => {
      const fT = fldTypeResolver(entry[1]);
      return {
        ...r,
        [entry[0] + '_' + fT]:
          fT === 'str' ? JSON.stringify(entry[1]) : entry[1],
      };
    }, {});

  const collectEvent = (payload) => {
    event?.(
      payload.event,
      normalizePayloadFieldNames(payload.attributes ?? {})
    );
  };

  const getProductUrl = (product: TDataProduct) => {
    return product.url;
  };

  const getProductImageUrl = (product: TDataProduct) => {
    return product.imageUrl ?? '';
  };

  // Identify a user - create/update a profile in Klaviyo
  const trackIdentify = async (profile?: TDataProfile | null) => {
    const user = getUserObj(profile);

    if (user) {
      const attributes = {
        email: user!.email, // 'sarah.mason@klaviyo-demo.com',
        phone_number: user?.phone, //'+15005550006',
        external_id: user?.id, // '63f64a2b-c6bf-40c7-b81f-bed08162edbe',
        first_name: user?.firstName ?? '', //'Sarah',
        last_name: user?.lastName ?? '', //'Mason',
        organization: user?.organization, // 'Klaviyo',
        title: user?.title, // 'Engineer',
        image: user?.avatarUrl, // 'https://images.pexels.com/photos/3760854/pexels-photo-3760854.jpeg',
        location: JSON.stringify({
          address1: user?.address?.street,
          address2: user?.address?.state,
          city: user?.address?.city,
          country: user?.address?.country,
          region: user?.address?.region,
          zip: user?.address?.postcode,
          timezone: user?.address?.timezone,
        }),
        ...(user?.extraProps ?? {}),
      };
      identify?.(attributes.external_id?.toString() ?? attributes.email, {
        displayName: attributes.first_name,
        email: attributes.email,
      });
      setUserVars?.(normalizePayloadFieldNames(attributes));
      return Promise.resolve();
    }

    return null;
  };

  const trackTransactionRefund = async (order: TDataOrder) => {};

  const trackTransactionCancel = async (order: TDataOrder) => {};

  const trackTransactionFulfill = async (order: TDataOrder) => {};

  const trackTransaction = async (order: TDataOrder) => {
    const evtName = trackUtils.getEventNameOfTransaction(order);
    // const session = options.resolvers?.session?.();
    const page = options.resolvers?.page?.();
    collectEvent({
      event: 'Placed Order',
      properties: {
        $event: evtName,
        $value: order.revenue,
        OrderId: order.id,
        Coupon: order.coupon || '',
        Categories: Object.values(order.products).map(
          (product) => product.category
        ),
        ItemNames: Object.values(order.products).map(
          (product) => product.title
        ),
        Brands: Object.values(order.products).map((product) => product.brand),
        DiscountCode: order.coupon, // "Free Shipping",
        SuccessURL: order.url ? order.url : page?.url || '',
        Items: order.products.map((product) =>
          JSON.stringify({
            ProductID: product.id,
            SKU: product.sku,
            ProductName: product.title,
            Quantity: product.quantity,
            ItemPrice: product.price,
            RowTotal: parseFloat(product.total?.toFixed(2) || '0'),
            ProductURL: getProductUrl(product),
            ImageURL: getProductImageUrl(product),
            Categories: [product.category],
            Brand: product.brand,
          })
        ),
        BillingAddress: JSON.stringify({
          FirstName: order.customer.firstName,
          LastName: order.customer.lastName,
          Company: '',
          Address1: order.shipping.address.street,
          Address2: '',
          City: order.shipping.address.city,
          Region: order.shipping.address.region,
          Region_code: '',
          Country: order.shipping.address.country,
          CountryCode: order.shipping.address.countryCode,
          Zip: order.shipping.address.postcode,
          Phone: order.shipping.address,
        }),
        ShippingAddress: JSON.stringify({
          FirstName: order.customer.firstName,
          LastName: order.customer.lastName,
          Company: '',
          Address1: order.shipping.address.street,
          Address2: '',
          City: order.shipping.address.city,
          Region: order.shipping.address.region,
          Region_code: '',
          Country: order.shipping.address.country,
          CountryCode: order.shipping.address.countryCode,
          Zip: order.shipping.address.postcode,
          Phone: order.shipping.address,
        }),
      },
    });
    return trackIdentify();
  };

  const trackProductAddToCart = async (basket: TDataBasket) => {
    basket.lastAdded.map((product) => {
      const evtName = trackUtils.getEventNameOfProductAddToCart(product);
      // console.error('klaviyo:trackInitiateCheckout', evtName);
      // const basket = request.session.basket;
      collectEvent({
        event: 'Added to Cart',
        properties: {
          $event: evtName, // 'add_cart_of_' + product.id,
          $value: parseFloat(product.price.toFixed(2)),
          AddedItemProductName: product.title,
          AddedItemProductID: product.id,
          AddedItemSKU: product.sku,
          AddedItemCategories: [product.category],
          AddedItemImageURL: getProductUrl(product),
          AddedItemURL: getProductImageUrl(product),
          AddedItemPrice: product.price,
          AddedItemQuantity: product.quantity,
          ItemNames: Object.values(basket.products).map(
            (product) => product.title
          ),
          Categories: Object.values(basket.products).map(
            (product) => product.category
          ),
          Brands: Object.values(basket.products).map(
            (product) => product.brand
          ),
          Items: Object.values(basket.products).map((product) =>
            JSON.stringify({
              ProductID: product.id,
              SKU: product.sku,
              ProductName: product.title,
              Quantity: product.quantity,
              ItemPrice: product.price,
              RowTotal: parseFloat(product.total?.toFixed(2) || '0'),
              ProductURL: getProductUrl(product),
              ImageURL: getProductImageUrl(product),
              Categories: [product.category],
              Brand: product.brand,
            })
          ),
        },
      });
    });
    return trackIdentify();
  };

  const trackProductRemoveFromCart = async (basket: TDataBasket) => {
    basket.lastRemoved.map((product) => {
      const evtName = trackUtils.getEventNameOfProductRemoveFromCart(product);
      // console.error('klaviyo:trackInitiateCheckout', evtName);
      // const basket = request.session.basket;
      collectEvent({
        event: 'Removed form Cart',
        properties: {
          $event: evtName, // 'add_cart_of_' + product.id,
          $value: parseFloat(product.price.toFixed(2)),
          RemovedItemProductName: product.title,
          RemovedItemProductID: product.id,
          RemovedItemSKU: product.sku,
          RemovedItemCategories: [product.category],
          RemovedItemImageURL: getProductUrl(product),
          RemovedItemURL: getProductImageUrl(product),
          RemovedItemPrice: product.price,
          RemovedItemQuantity: product.quantity,
          ItemNames: Object.values(basket.products).map(
            (product) => product.title
          ),
          Categories: Object.values(basket.products).map(
            (product) => product.category
          ),
          Brands: Object.values(basket.products).map(
            (product) => product.brand
          ),
          Items: Object.values(basket.products).map((product) =>
            JSON.stringify({
              ProductID: product.id,
              SKU: product.sku,
              ProductName: product.title,
              Quantity: product.quantity,
              ItemPrice: product.price,
              RowTotal: parseFloat(product.total?.toFixed(2) || '0'),
              ProductURL: getProductUrl(product),
              ImageURL: getProductImageUrl(product),
              Categories: [product.category],
              Brand: product.brand,
            })
          ),
        },
      });
    });
    return trackIdentify();
  };

  const trackProductsItemView = async (products: TDataProduct[]) => {
    await Promise.allSettled(products.map((p) => trackProductItemView(p)));
  };

  const trackProductItemView = async (product: TDataProduct) => {
    const evtName = trackUtils.getEventNameOfProductItemView(product);
    // console.error('klaviyo:trackProductItemView', evtName);
    collectEvent({
      event: 'Viewed Product',
      properties: {
        $event: evtName,
        $value: product.price,
        ProductName: product.title,
        ProductID: product.id,
        SKU: product.sku,
        Categories: [product.category],
        ImageURL: getProductImageUrl(product),
        URL: getProductUrl(product),
        Brand: product.brand,
        Price: product.price,
        SalePrice: product.salePrice,
      },
    });
    return trackIdentify();
  };

  const trackPageView = async (page: TDataPage) => {
    setVars?.('page', {
      pageName: page?.name,
      ...normalizePayloadFieldNames(page.extras ?? {}),
    });
    return trackIdentify();
  };

  const trackCustom = async (e: TDataCustomEvent) => {
    collectEvent({
      event: e.name,
      properties: e.attributes,
    });
    return trackIdentify();
  };

  const trackInitiateCheckout = async (basket: TDataBasket) => {
    const evtName = trackUtils.getEventNameOfInitiateCheckout(basket);
    const page = options.resolvers?.page?.();
    collectEvent({
      event: 'Started Checkout',
      properties: {
        $event: evtName,
        $value: basket.total.toFixed(2),
        ItemNames: Object.values(basket.products).map(
          (product) => product.title
        ),
        Categories: Object.values(basket.products).map(
          (product) => product.category
        ),
        Brands: Object.values(basket.products).map((product) => product.brand),
        CheckoutURL: page?.url,
        Items: Object.values(basket.products).map((product) =>
          JSON.stringify({
            ProductID: product.id,
            SKU: product.sku,
            ProductName: product.title,
            Quantity: product.quantity,
            ItemPrice: product.price,
            RowTotal: parseFloat(product.total?.toFixed(2) || '0'),
            ProductURL: getProductUrl(product),
            ImageURL: getProductImageUrl(product),
            Categories: [product.category],
            Brand: product.brand,
          })
        ),
      },
    });
    return trackIdentify();
  };

  const trackSearch = async (searchTerm, matchingProducts) => {
    const evtName = trackUtils.getEventNameOfSearch(
      searchTerm,
      matchingProducts
    );
    const page = options.resolvers?.page?.();
    collectEvent({
      event: 'Searched Site',
      properties: {
        SearchTerm: searchTerm,
        ReturnedResults: (matchingProducts && matchingProducts.length) || 0,
        PageUrl: page?.url,
      },
    });
    return trackIdentify();
  };

  const trackNewProfile = async (profile: TDataProfile | null) => {
    const user = getUserObj(profile);
    // console.log('klaviyo:trackNewProfile', user);
    user
      ? collectEvent({
          event: 'Created Account',
          properties: {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        })
      : void 0;
    return trackIdentify();
  };

  const trackProfileResetPassword = async (profile: TDataProfile | null) => {
    // console.error('klaviyo:trackProfileResetPassword', request.user);
    const user = getUserObj(profile);
    user
      ? collectEvent({
          event: 'Reset Password',
          properties: {
            email: user.email,
            PasswordResetLink:
              absoluteURL + (options.links?.resetPassword ?? ''),
          },
        })
      : void 0;
    return trackIdentify();
  };

  const trackProfileLogIn = async (profile: TDataProfile | null) => {
    const user = getUserObj(profile);
    user
      ? collectEvent({
          event: 'Custom User Login',
          properties: {
            email: user.email,
          },
        })
      : void 0;
    return trackIdentify();
  };

  const trackProfileLogOut = async (profile: TDataProfile | null) => {
    const user = getUserObj(profile);
    user
      ? collectEvent({
          event: 'Custom User Log Out',
          properties: {
            email: user.email,
          },
        })
      : void 0;
    return trackIdentify();
  };

  const trackProfileSubscribeNL = async (profile: TDataProfile | null) => {
    // console.error('klaviyo:trackProfileSubscribeNL', request.user);
    const user = getUserObj(profile);
    user
      ? collectEvent({
          event: 'Custom User NL Subscribed',
          properties: {
            email: user.email,
          },
        })
      : void 0;
    return trackIdentify();
  };

  return {
    trackIdentify,
    trackTransaction,
    trackProductAddToCart,
    trackProductRemoveFromCart,
    trackProductItemView,
    trackProductsItemView,
    trackSearch,
    trackPageView,
    trackInitiateCheckout,
    trackNewProfile,
    trackProfileResetPassword,
    trackProfileLogIn,
    trackProfileLogOut,
    trackProfileSubscribeNL,
    trackTransactionRefund,
    trackTransactionCancel,
    trackTransactionFulfill,
    trackCustom,
  };
};

export default fullstoryTracker;

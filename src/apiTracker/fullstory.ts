import {
  type TSettings,
  type T_EA_DataProduct,
  type T_EA_DataProfile,
  type T_EA_DataOrder,
  type T_EA_DataBasket,
  type T_EA_DataCustomEvent,
  type TServerEventResponse,
} from '../shared';
import * as trackUtils from '../utils';
import { T_EA_DataPage } from '../shared';
import { resolveUser } from './identity';
import { isBrowserMode } from '../utils';
import { log } from '../log';

let uiLibInstallStatus: 'no' | 'yes' | 'installing' = 'no';
export const installFS = (orgId?: string | null) => {
  return trackUtils.isBrowserMode && uiLibInstallStatus === 'no' && orgId
    ? new Promise((instok, insterr) => {
        uiLibInstallStatus = 'installing';
        globalThis.window['_fs_host'] = 'fullstory.com';
        globalThis.window['_fs_script'] = 'edge.fullstory.com/s/fs.js';
        globalThis.window['_fs_org'] = orgId;
        globalThis.window['_fs_namespace'] = 'FS';
        (function (m, n, e, t, l, o, g, y) {
          if (e in m) {
            if (m.console && m.console.log) {
              m.console.log(
                'FullStory namespace conflict. Please set window["_fs_namespace"].'
              );
            }
            return;
          }
          if (m.FS) {
            return;
          }
          // @ts-ignore
          g = m[e] = function (a, b, s) {
            // @ts-ignore
            g.q ? g.q.push([a, b, s]) : g._api(a, b, s);
          };
          // @ts-ignore
          g.q = [];
          // @ts-ignore
          o = n.createElement(t);
          // @ts-ignore
          o.async = 1;
          // @ts-ignore
          o.crossOrigin = 'anonymous';
          // @ts-ignore
          o.src = 'https://' + _fs_script;
          // // @ts-ignore
          // o.onload = () => {
          //   uiLibInstallStatus = 'yes';
          // };
          // // @ts-ignore
          // o.onerror = () => {
          //   uiLibInstallStatus = 'no';
          // };
          // @ts-ignore
          y = n.getElementsByTagName(t)[0];
          // @ts-ignore
          y.parentNode.insertBefore(o, y);
          // @ts-ignore
          g.identify = function (i, v, s) {
            // @ts-ignore
            g(l, { uid: i }, s);
            // @ts-ignore
            if (v) g(l, v, s);
          };
          // @ts-ignore
          g.setUserVars = function (v, s) {
            // @ts-ignore
            g(l, v, s);
          };
          // @ts-ignore
          g.event = function (i, v, s) {
            // @ts-ignore
            g('event', { n: i, p: v }, s);
          };
          // @ts-ignore
          g.anonymize = function () {
            // @ts-ignore
            g.identify(!!0);
          };
          // @ts-ignore
          g.shutdown = function () {
            // @ts-ignore
            g('rec', !1);
          };
          // @ts-ignore
          g.restart = function () {
            // @ts-ignore
            g('rec', !0);
          };
          // @ts-ignore
          g.log = function (a, b) {
            // @ts-ignore
            g('log', [a, b]);
          };
          // @ts-ignore
          g.consent = function (a) {
            // @ts-ignore
            g('consent', !arguments.length || a);
          };
          // @ts-ignore
          g.identifyAccount = function (i, v) {
            // @ts-ignore
            o = 'account';
            v = v || {};
            v.acctId = i;
            // @ts-ignore
            g(o, v);
          };
          // @ts-ignore
          g.clearUserCookie = function () {};
          // @ts-ignore
          g.setVars = function (n, p) {
            // @ts-ignore
            g('setVars', [n, p]);
          };
          // @ts-ignore
          g._w = {};
          // @ts-ignore
          y = 'XMLHttpRequest';
          // @ts-ignore
          g._w[y] = m[y];
          // @ts-ignore
          y = 'fetch';
          // @ts-ignore
          g._w[y] = m[y];
          // @ts-ignore
          if (m[y])
            // @ts-ignore
            m[y] = function () {
              // @ts-ignore
              return g._w[y].apply(this, arguments);
            };
          // @ts-ignore
          g._v = '1.3.0';
          new Promise((resolve, reject) => {
            // @ts-ignore
            o.onload = resolve;
            // @ts-ignore
            o.onerror = reject;
          })
            .then(() => {
              uiLibInstallStatus = 'yes';
              instok(globalThis.window.FS);
            })
            .catch(() => {
              uiLibInstallStatus = 'no';
              insterr();
            });
        })(
          globalThis.window,
          globalThis.document,
          globalThis.window['_fs_namespace'],
          'script',
          'user'
        );
        uiLibInstallStatus = 'yes';
        instok(globalThis.window.FS);
      })
    : null;
};

// Is designed to run in browsers only.

export const fullstoryTracker = (options: TSettings) => {
  const { absoluteURL, integrations: analytics } = options;

  if (!isBrowserMode) {
    throw '[EA] FullStory can be run in a browser only';
  }

  if (!analytics?.fullstory?.orgId) {
    throw '[EA] FullStory is not configured properly; orgId is not defined';
  }

  const { event, identify, setUserVars, setVars } = globalThis.window.FS;

  const getUserObj = (profile?: T_EA_DataProfile | null) => {
    return resolveUser(profile);
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
      normalizePayloadFieldNames(payload.properties ?? {})
    );
    log(`[EA:FullStory] collecting event ${payload.event}`, payload.properties);
  };

  const getAbsoluteUrl = (url?: string) => {
    return url
      ? url.startsWith('http')
        ? url
        : [absoluteURL, url].join('/').replace(/([^:]\/)\/+/g, '$1')
      : '';
  };

  const getProductUrl = (product: T_EA_DataProduct) => {
    return getAbsoluteUrl(product.url);
  };

  const getProductImageUrl = (product: T_EA_DataProduct) => {
    return getAbsoluteUrl(product.imageUrl ?? '');
  };

  // Identify a user - create/update a profile in Klaviyo
  const trackIdentify = async (
    profile?: T_EA_DataProfile | null
  ): Promise<TServerEventResponse> => {
    const user = getUserObj(profile);

    if (user) {
      const attributes = {
        email: user!.email,
        phone_number: user?.phone,
        external_id: user?.id,
        first_name: user?.firstName ?? '',
        last_name: user?.lastName ?? '',
        organization: user?.organization,
        title: user?.title,
        image: user?.avatarUrl,
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
      return Promise.resolve({
        message: null,
        payload: [normalizePayloadFieldNames(attributes)],
        response: true,
      });
    }

    return {
      message: 'User is not defined yet',
      payload: [user],
      response: null,
    };
  };

  const trackTransactionRefund = async (order: T_EA_DataOrder) => {};

  const trackTransactionCancel = async (order: T_EA_DataOrder) => {};

  const trackTransactionFulfill = async (order: T_EA_DataOrder) => {};

  const trackTransaction = async (order: T_EA_DataOrder) => {
    const evtName = trackUtils.getEventNameOfTransaction(order);
    // const session = options.resolvers?.session?.();
    const user = getUserObj(order.customer);
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
          FirstName: user?.firstName,
          LastName: user?.lastName,
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
          FirstName: user?.firstName,
          LastName: user?.lastName,
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

  const trackProductAddToCart = async (basket: T_EA_DataBasket) => {
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

  const trackProductRemoveFromCart = async (basket: T_EA_DataBasket) => {
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

  const trackProductsItemView = async (products: T_EA_DataProduct[]) => {
    await Promise.allSettled(products.map((p) => trackProductItemView(p)));
  };

  const trackProductItemView = async (product: T_EA_DataProduct) => {
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

  const trackPageView = async (page: T_EA_DataPage) => {
    setVars?.('page', {
      pageName: page?.name,
      ...normalizePayloadFieldNames(page.extras ?? {}),
    });
    return trackIdentify();
  };

  const trackCustom = async (e: T_EA_DataCustomEvent) => {
    collectEvent({
      event: e.name,
      properties: e.attributes,
    });
    return trackIdentify();
  };

  const trackInitiateCheckout = async (basket: T_EA_DataBasket) => {
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
    // const evtName = trackUtils.getEventNameOfSearch(
    //   searchTerm,
    //   matchingProducts
    // );
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

  const trackNewProfile = async (profile: T_EA_DataProfile | null) => {
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

  const trackProfileResetPassword = async (
    profile: T_EA_DataProfile | null
  ) => {
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

  const trackProfileLogIn = async (profile: T_EA_DataProfile | null) => {
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

  const trackProfileLogOut = async (profile: T_EA_DataProfile | null) => {
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

  const trackProfileSubscribeNL = async (profile: T_EA_DataProfile | null) => {
    // log('[EA:FullStory] trackProfileSubscribeNL', profile);
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

  const trackAddPaymentInfo = async (order: T_EA_DataOrder) => {
    return trackIdentify();
  };
  const trackAddShippingInfo = async (order: T_EA_DataOrder) => {
    return trackIdentify();
  };
  const trackAddToWishlist = async (products: T_EA_DataProduct[]) => {
    return trackIdentify();
  };
  const trackViewBasket = async (basket: T_EA_DataBasket) => {
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
    trackAddPaymentInfo,
    trackAddShippingInfo,
    trackAddToWishlist,
    trackViewBasket,
  };
};

export default fullstoryTracker;

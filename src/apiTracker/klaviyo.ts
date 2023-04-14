import {
  TSettings,
  T_EA_DataProduct,
  T_EA_DataProfile,
  T_EA_DataOrder,
  T_EA_DataBasket,
  T_EA_DataCustomEvent,
  TServerEventResponse,
  T_EA_DataPage,
} from '../shared';
import * as trackUtils from '../utils';
import { resolveUser } from './identity';
import { log } from '../log';
import { isBrowserMode } from '../utils';

const BrowserSdkWrapper = (() => {
  let _unprocessed: [string, any[]][] = [];

  const processQueue = (q: [string, any[]][]) => {
    q.map(([fn, payload]) => window.klaviyo[fn](...payload));
    return [];
  };

  const Events = {
    async createEvent(body: any) {
      _unprocessed.push([
        'track',
        [
          body?.data?.attributes?.metric?.name,
          body?.data?.attributes?.properties,
        ],
      ]);
      _unprocessed = window.klaviyo ? processQueue(_unprocessed) : _unprocessed;
    },
  };

  const Profiles = {
    getProfiles(filter: Record<string, any>) {
      return Promise.resolve({ body: { data: [] } });
    },
    async createProfile(body: any) {
      _unprocessed.push(['identify', [body?.data?.attributes ?? {}]]);
      _unprocessed = window.klaviyo ? processQueue(_unprocessed) : _unprocessed;
    },
  };

  // compatibility
  const ConfigWrapper = () => {};

  return {
    process() {
      _unprocessed = window.klaviyo ? processQueue(_unprocessed) : _unprocessed;
      return _unprocessed;
    },
    ConfigWrapper,
    Events,
    Profiles,
  };
})();

let uiLibInstallStatus: 'no' | 'yes' | 'installing' = 'no';
const queuedEvents = new Set<any>();
const indentifiedEmails = new Set();
export const installK = (siteId?: string | null) => {
  return trackUtils.isBrowserMode && uiLibInstallStatus === 'no' && siteId
    ? new Promise((instok, insterr) => {
        uiLibInstallStatus = 'installing';
        // install UI lib
        globalThis._learnq = globalThis._learnq || [];
        const el = document.createElement('script');
        el.crossOrigin = 'anonymous';
        el.src = `//static.klaviyo.com/onsite/js/klaviyo.js?company_id=${siteId}`;
        el.async = true;
        el.setAttribute('data-integration-id', `eak-${siteId}`);
        new Promise((resolve, reject) => {
          el.onload = resolve;
          el.onerror = reject;
        })
          .then(() => {
            // shitty hardcode
            setTimeout(BrowserSdkWrapper.process, 2000);
            uiLibInstallStatus = 'yes';
            instok(true);
          })
          .catch(() => {
            uiLibInstallStatus = 'no';
            insterr(true);
          });
        document.head.appendChild(el);
      })
    : null;
};

// Is desgned to run in both: browsers and server sides.

export const klaviyoTracker = (options: TSettings) => {
  const { absoluteURL, integrations: analytics } = options;
  const bizSdk = analytics?.klaviyo?.sdk;
  const { ConfigWrapper, Events, Profiles } = isBrowserMode
    ? BrowserSdkWrapper
    : bizSdk ?? {};

  if (trackUtils.isBrowserMode) {
    if (!analytics?.klaviyo?.siteId) {
      throw '[EA] Klaviyo is not configured properly; Please provide siteId to run in the UI mode;';
    }
  } else {
    if (!analytics?.klaviyo?.token) {
      throw '[EA] Klaviyo is not configured properly; Please provide token to run in the server mode;';
    }
    if (!bizSdk || !ConfigWrapper) {
      throw '[EA] Klaviyo is configured without SDK; Please install the requried dependency: npm i klaviyo-api@2.1.1 OR define your own sdk functions;';
    }
    // configure server tracker
    ConfigWrapper(analytics.klaviyo?.token);
  }

  const getUserObj = (profile?: T_EA_DataProfile | null) => {
    return resolveUser(profile);
  };

  const collectEvent = (evt) => {
    log('[EA:Klaviyo] addEvent', evt);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const session = options.resolvers?.session?.();
    queuedEvents.add({
      ...evt,
      ipAddress: session?.ip,
      agent: session?.agent,
      timestamp: current_timestamp,
      isTest: options.debug,
    });
    log('[EA:Klaviyo] queuedEvents count', queuedEvents.size);
    return queuedEvents;
  };

  const releaseAnonymousEvents = async (): Promise<TServerEventResponse[]> => {
    log('[EA:Klaviyo] releasing queuedEvents');
    const user = getUserObj();
    try {
      const resp = await Promise.allSettled(
        (user ? Array.from(queuedEvents) : []).map((evt: any) => {
          const payload = {
            type: 'event',
            attributes: {
              profile: {
                ...(evt.customer_properties ?? {}),
                first_name: user!.firstName,
                last_name: user!.lastName,
                email: user!.email,
              },
              metric: {
                name: evt.event,
              },
              properties: {
                ...(evt?.properties ?? {}),
              },
              time: new Date().toISOString(),
              value: evt.properties?.$value ?? null,
              unique_id: evt.properties?.$event_id ?? null,
            },
          };
          return Events?.createEvent({ data: payload });
        })
      );
      log('[EA:Klaviyo] queuedEvents released count:' + queuedEvents.size);
      queuedEvents.clear();
      return Array.from(queuedEvents).map((evt, idx) => ({
        message: resp[idx].status,
        payload: [evt],
        response: resp[idx],
      }));
    } catch (error) {
      console.error(error);
    }
    log('[EA:Klaviyo] queuedEvents count:' + queuedEvents.size);
    return [];
  };

  const getProductUrl = (product: T_EA_DataProduct) => {
    return product.url;
  };

  const getProductImageUrl = (product: T_EA_DataProduct) => {
    return product.imageUrl ?? '';
  };

  // Identify a user - create/update a profile in Klaviyo
  const trackIdentify = async (
    profile?: T_EA_DataProfile | null
  ): Promise<TServerEventResponse[]> => {
    const user = getUserObj(profile);
    log('[EA:Klaviyo] trackIdentify', user);
    if (user) {
      const attributes = {
        email: user?.email,
        phone_number: user?.phone,
        external_id: user?.id,
        first_name: user?.firstName ?? '',
        last_name: user?.lastName ?? '',
        organization: user?.organization,
        title: user?.title,
        image: user?.avatarUrl,
        location: {
          address1: user?.address?.street,
          address2: user?.address?.state,
          city: user?.address?.city,
          country: user?.address?.country,
          region: user?.address?.region,
          zip: user?.address?.postcode,
          timezone: user?.address?.timezone,
        },
        properties: {
          ...(user?.extraProps ?? {}),
        },
      };

      const payload = {
        type: 'profile',
        attributes,
      };

      try {
        const existingProfile =
          (await Profiles?.getProfiles?.({
            filter: `equals(email,"${user.email}")`,
          })) ?? null;
        const foundProfile =
          existingProfile?.body.data[0] ||
          indentifiedEmails.has(user.email) ||
          null;
        log('[EA:Klaviyo] ... foundProfile', foundProfile);
        const profileResp = foundProfile
          ? foundProfile
          : await Profiles?.createProfile({
              data: payload,
            });
        indentifiedEmails.add(user.email);
        log('[EA:Klaviyo] ... indentifiedEmails.add>', user.email);
        const queueResp = await releaseAnonymousEvents();
        return [
          foundProfile
            ? void 0
            : {
                message: 'fullfilled',
                response: profileResp,
                payload: [payload],
              },
          ...(queueResp ?? []),
        ].filter((v): v is TServerEventResponse => !!v);
      } catch (error) {
        console.error(error);
      }
    }

    return [
      {
        message: 'User is not defined yet',
        payload: [user],
        response: null,
      },
    ];
  };

  const trackTransactionRefund = async (order: T_EA_DataOrder) => {};

  const trackTransactionCancel = async (order: T_EA_DataOrder) => {};

  const trackTransactionFulfill = async (order: T_EA_DataOrder) => {};

  const trackTransaction = async (order: T_EA_DataOrder) => {
    const evtName = trackUtils.getEventNameOfTransaction(order);
    const page = options.resolvers?.page?.();
    log('[EA:Klaviyo] trackTransaction', evtName);
    collectEvent({
      event: 'Placed Order',
      customerProperties: {
        email: order.customer.email,
        first_name: order.customer.firstName,
        last_name: order.customer.lastName,
      },
      properties: {
        $event_id: evtName,
        // "MissingInformation": ["Shipping Address Information","Shipping Method"],
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
        // "DiscountValue": 5,
        DeliveryType: order.shipping.name,
        DeliveryCost: order.shipping.cost,
        PaymentType: order.payment.type,
        SuccessURL: order.url ? order.url : page?.url || '',
        Items: order.products.map((product) => ({
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
        })),
        BillingAddress: {
          FirstName: order.customer.firstName,
          LastName: order.customer.lastName,
          Company: order.customer.organization,
          Address1: order.shipping.address.street,
          Address2: '',
          City: order.shipping.address.city,
          Region: order.shipping.address.region,
          Region_code: '',
          Country: order.shipping.address.country,
          CountryCode: order.shipping.address.countryCode,
          Zip: order.shipping.address.postcode,
          Phone: order.shipping.address,
        },
        ShippingAddress: {
          FirstName: order.customer.firstName,
          LastName: order.customer.lastName,
          Company: order.customer.organization,
          Address1: order.shipping.address.street,
          Address2: '',
          City: order.shipping.address.city,
          Region: order.shipping.address.region,
          Region_code: '',
          Country: order.shipping.address.country,
          CountryCode: order.shipping.address.countryCode,
          Zip: order.shipping.address.postcode,
          Phone: order.shipping.address,
        },
      },
    });
    return trackIdentify(); //{ ...user, });
  };

  const trackProductAddToCart = async (basket: T_EA_DataBasket) => {
    basket.lastAdded.map((product) => {
      const evtName = trackUtils.getEventNameOfProductAddToCart(product);
      log('[EA:Klaviyo] trackProductAddToCart', evtName);
      // const basket = request.session.basket;
      collectEvent({
        event: 'Added to Cart',
        properties: {
          $event_id: evtName, // 'add_cart_of_' + product.id,
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
          Items: Object.values(basket.products).map((product) => ({
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
          })),
        },
      });
    });
    return trackIdentify();
  };

  const trackProductRemoveFromCart = async (basket: T_EA_DataBasket) => {
    basket.lastRemoved.map((product) => {
      const evtName = trackUtils.getEventNameOfProductRemoveFromCart(product);
      log('[EA:Klaviyo] trackProductRemoveFromCart', evtName);
      // const basket = request.session.basket;
      collectEvent({
        event: 'Removed form Cart',
        properties: {
          $event_id: evtName, // 'add_cart_of_' + product.id,
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
          Items: Object.values(basket.products).map((product) => ({
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
          })),
        },
      });
    });
    return trackIdentify();
  };

  const trackProductsItemView = async (products: T_EA_DataProduct[]) => {
    await Promise.allSettled(
      products.map((p) => trackProductItemView(p, 'Viewed List Product'))
    );
  };

  const trackProductItemView = async (
    product: T_EA_DataProduct,
    customEventName?: string
  ) => {
    const evtName = trackUtils.getEventNameOfProductItemView(product);
    log('[EA:Klaviyo] trackProductItemView', evtName);
    collectEvent({
      event: customEventName ?? 'Viewed Product',
      properties: {
        $event_id: evtName,
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
    log('[EA:Klaviyo] trackPageView');
    collectEvent({
      event: 'Viewed Page',
      properties: {
        PageName: page?.name,
        PageUrl: page?.url,
      },
    });
    return trackIdentify();
  };

  const trackCustom = async (e: T_EA_DataCustomEvent) => {
    log('[EA:Klaviyo] trackCustom', e.name);
    collectEvent({
      event: e.name,
      properties: e.attributes ?? {},
    });
    return trackIdentify();
  };

  const trackInitiateCheckout = async (basket: T_EA_DataBasket) => {
    const evtName = trackUtils.getEventNameOfInitiateCheckout(basket);
    const page = options.resolvers?.page?.();
    log('[EA:Klaviyo] trackInitiateCheckout', evtName);
    collectEvent({
      event: 'Started Checkout',
      properties: {
        $event_id: evtName,
        $value: basket.total.toFixed(2),
        ItemNames: Object.values(basket.products).map(
          (product) => product.title
        ),
        Categories: Object.values(basket.products).map(
          (product) => product.category
        ),
        Brands: Object.values(basket.products).map((product) => product.brand),
        CheckoutURL: page?.url,
        Items: Object.values(basket.products).map((product) => ({
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
        })),
      },
    });
    return trackIdentify();
  };

  const trackSearch = async (
    searchTerm: string,
    matchingProducts: T_EA_DataProduct[]
  ) => {
    log('[EA:Klaviyo] trackSearch', searchTerm);
    const evtName = trackUtils.getEventNameOfSearch(
      searchTerm,
      matchingProducts
    );
    const page = options.resolvers?.page?.();
    collectEvent({
      event: 'Searched Site',
      properties: {
        $event_id: evtName,
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
    log('[EA:Klaviyo] trackNewProfile');
    user
      ? collectEvent({
          event: 'Created Account',
          customer_properties: {
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
          },
        })
      : void 0;
    return trackIdentify(profile);
  };

  const trackProfileResetPassword = async (
    profile: T_EA_DataProfile | null
  ) => {
    log('[EA:Klaviyo] trackProfileResetPassword');
    const user = getUserObj(profile);
    user
      ? collectEvent({
          event: 'Reset Password',
          customer_properties: {
            email: user.email,
          },
          properties: {
            PasswordResetLink:
              absoluteURL + (options.links?.resetPassword ?? ''),
          },
        })
      : void 0;
    return trackIdentify(profile);
  };

  const trackProfileLogIn = async (profile: T_EA_DataProfile | null) => {
    const user = getUserObj(profile);
    log('[EA:Klaviyo] trackProfileLogIn');
    user
      ? collectEvent({
          event: 'Custom User Login',
          customer_properties: {
            email: user.email,
          },
        })
      : void 0;
    return trackIdentify(profile);
  };

  const trackProfileLogOut = async (profile: T_EA_DataProfile | null) => {
    const user = getUserObj(profile);
    log('[EA:Klaviyo] trackProfileLogOut');
    user
      ? collectEvent({
          event: 'Custom User Log Out',
          customer_properties: {
            email: user.email,
          },
        })
      : void 0;
    return trackIdentify(profile);
  };

  const trackProfileSubscribeNL = async (profile: T_EA_DataProfile | null) => {
    log('[EA:Klaviyo] trackProfileSubscribeNL');
    const user = getUserObj(profile);
    user
      ? collectEvent({
          event: 'Custom User NL Subscribed',
          customer_properties: {
            email: user.email,
          },
        })
      : void 0;
    return trackIdentify(profile);
  };

  const trackAddPaymentInfo = async (order: T_EA_DataOrder) => {
    log('[EA:Klaviyo] trackAddPaymentInfo');
    collectEvent({
      event: 'Payment Added',
      properties: {
        PaymentType: order.payment.type,
        BillingAddress: {
          FirstName: order.customer.firstName,
          LastName: order.customer.lastName,
          Company: order.customer.organization,
          Address1: order.shipping.address.street,
          Address2: '',
          City: order.shipping.address.city,
          Region: order.shipping.address.region,
          Region_code: '',
          Country: order.shipping.address.country,
          CountryCode: order.shipping.address.countryCode,
          Zip: order.shipping.address.postcode,
          Phone: order.shipping.address,
        },
      },
    });
    return trackIdentify();
  };

  const trackAddShippingInfo = async (order: T_EA_DataOrder) => {
    log('[EA:Klaviyo] trackViewBasket');
    collectEvent({
      event: 'Shipping Added',
      properties: {
        DeliveryType: order.shipping.name,
        DeliveryCost: order.shipping.cost,
        ShippingAddress: {
          FirstName: order.customer.firstName,
          LastName: order.customer.lastName,
          Company: order.customer.organization,
          Address1: order.shipping.address.street,
          Address2: '',
          City: order.shipping.address.city,
          Region: order.shipping.address.region,
          Region_code: '',
          Country: order.shipping.address.country,
          CountryCode: order.shipping.address.countryCode,
          Zip: order.shipping.address.postcode,
          Phone: order.shipping.address,
        },
      },
    });
    return trackIdentify();
  };

  const trackAddToWishlist = async (products: T_EA_DataProduct[]) => {
    const product = products[0];
    const evtName = trackUtils.getEventNameOfProductItemWish(product);
    log('[EA:Klaviyo] trackAddToWishlist', evtName);
    collectEvent({
      event: 'Added Wish Product',
      properties: {
        $event_id: evtName,
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

  const trackViewBasket = async (basket: T_EA_DataBasket) => {
    log('[EA:Klaviyo] trackViewBasket');
    collectEvent({
      event: 'View Basket',
      properties: {},
    });
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

export default klaviyoTracker;

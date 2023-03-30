import {
  TSettings,
  T_EA_DataProduct,
  T_EA_DataProfile,
  T_EA_DataOrder,
  T_EA_DataBasket,
  T_EA_DataCustomEvent,
} from '../shared';
import * as trackUtils from '../utils';
import { T_EA_DataPage } from '../shared';

let uiLibInstallStatus: 'no' | 'yes' | 'installing' = 'no';
const queuedEvents = new Set();
const indentifiedEmails = new Set();
const lastIdentity = new Set();

export const klaviyoTracker = (options: TSettings) => {
  const { absoluteURL, integrations: analytics } = options;
  const bizSdk = analytics?.klaviyo?.sdk;
  const isUITracking =
    !analytics?.klaviyo?.token && !!analytics?.klaviyo?.siteId;

  if (!analytics || !analytics.klaviyo) {
    throw 'Klaviyo is not configured;';
  }

  if (!bizSdk) {
    throw 'Klaviyo is configured without SDK; Please install the requried dependency: npm i klaviyo-api@2.1.1 OR define your own sdk functions;';
  }

  if (!analytics.klaviyo?.token && !analytics.klaviyo?.siteId) {
    throw 'Klaviyo is not configured; Please provide siteId or token;';
  }

  console.debug(
    '[EA:Klaviyo] running to the ' +
      (isUITracking ? 'UI' : 'API') +
      ' tracking mode'
  );

  const { ConfigWrapper, Events, Profiles } = bizSdk;

  if (analytics.klaviyo?.token && !ConfigWrapper) {
    throw 'Klaviyo is configured without SDK; ConfigWrapper is missing. Please install the requried dependency: npm i klaviyo-api@2.1.1 OR make sure that SDK has ConfigWrapper function defined;';
  }

  if (
    analytics.klaviyo?.siteId &&
    document &&
    window &&
    uiLibInstallStatus === 'no'
  ) {
    uiLibInstallStatus = 'installing';
    // install UI lib
    const el = document.createElement('script');
    el.crossOrigin = 'anonymous';
    el.src = `//static.klaviyo.com/onsite/js/klaviyo.js?company_id=${analytics.klaviyo?.siteId}`;
    el.async = true;
    el.setAttribute('data-integration-id', `eak-${analytics.klaviyo?.siteId}`);
    new Promise((resolve) => (el.onload = resolve)).then(() => {
      uiLibInstallStatus = 'yes';
    });
    document.head.appendChild(el);

    // restore id on the UI
    const savedId = localStorage.getItem('EA_Klaviyo_Identity');
    lastIdentity.clear();
    savedId ? lastIdentity.add(JSON.parse(savedId)) : void 0;
  }

  analytics.klaviyo?.token ? ConfigWrapper?.(analytics.klaviyo?.token) : void 0;

  const getUserObj = (profile?: T_EA_DataProfile | null) => {
    const u =
      (profile ? profile : options.resolvers?.profile?.()) ??
      lastIdentity.values().next().value;
    lastIdentity.clear();
    lastIdentity.add(u);
    isUITracking
      ? localStorage.setItem('EA_Klaviyo_Identity', JSON.stringify(u))
      : void 0;
    return u;
  };

  const collectEvent = (evt) => {
    console.debug('[EA:Klaviyo] addEvent', evt);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const session = options.resolvers?.session?.();
    queuedEvents.add({
      ...evt,
      ipAddress: session?.ip,
      agent: session?.agent,
      timestamp: current_timestamp,
      isTest: analytics.testing,
      post: true,
    });
    console.debug('[EA:Klaviyo] queuedEvents count', queuedEvents.size);
    return queuedEvents;
  };

  const releaseAnonymousEvents = async () => {
    console.debug('[EA:Klaviyo] releasing queuedEvents');
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
          return Events.createEvent({ data: payload });
        })
      );
      console.debug(
        '[EA:Klaviyo] queuedEvents released count:' + queuedEvents.size
      );
      queuedEvents.clear();
      return resp;
    } catch (error) {
      console.error(error);
    }
    console.debug('[EA:Klaviyo] queuedEvents count:' + queuedEvents.size);
  };

  const getProductUrl = (product: T_EA_DataProduct) => {
    return product.url;
  };

  const getProductImageUrl = (product: T_EA_DataProduct) => {
    return product.imageUrl ?? '';
  };

  // Identify a user - create/update a profile in Klaviyo
  const trackIdentify = async (profile?: T_EA_DataProfile | null) => {
    const user = getUserObj(profile);

    if (user) {
      const attributes = {
        email: user?.email, // 'sarah.mason@klaviyo-demo.com',
        phone_number: user?.phone, //'+15005550006',
        external_id: user?.id, // '63f64a2b-c6bf-40c7-b81f-bed08162edbe',
        first_name: user?.firstName ?? '', //'Sarah',
        last_name: user?.lastName ?? '', //'Mason',
        organization: user?.organization, // 'Klaviyo',
        title: user?.title, // 'Engineer',
        image: user?.avatarUrl, // 'https://images.pexels.com/photos/3760854/pexels-photo-3760854.jpeg',
        location: {
          address1: user?.address?.street,
          address2: user?.address?.state,
          city: user?.address?.city,
          country: user?.address?.country,
          region: user?.address?.region,
          zip: user?.address?.postcode,
          timezone: user?.address?.timezone,
          // ...(user?.address ?? {}),
          // address1: '89 E 42nd St',
          // address2: '1st floor',
          // city: 'New York',
          // country: 'United States',
          // region: 'NY',
          // zip: '10017',
          // timezone: 'America/New_York'
        },
        properties: {
          ...(user?.extraProps ?? {}),
        },
        // email: user!.email,
        // properties: {
        //   "$first_name": user ? user.firstName : '',
        //   "$last_name": user ? user.lastName : '',
        //   "$email": user ? user.email : '',
        // },
        // isTest: analytics.testing, //defaults to false
        // post: true //defaults to false
      };

      const payload = {
        type: 'profile',
        attributes,
      };

      try {
        const existingProfile =
          (await Profiles.getProfiles?.({
            filter: `equals(email,"${user.email}")`,
          })) ?? null;
        const foundProfile =
          existingProfile?.body.data[0] ||
          indentifiedEmails.has(user.email) ||
          null;
        const profileResp = foundProfile
          ? foundProfile
          : await Profiles.createProfile({
              data: payload,
            });
        indentifiedEmails.add(user.email);
        const queueResp =
          isUITracking && uiLibInstallStatus !== 'yes'
            ? []
            : await releaseAnonymousEvents();
        return Promise.resolve([profileResp, ...(queueResp ?? [])]);
      } catch (error) {
        console.error(error);
      }
    }

    return null;
  };

  const trackTransactionRefund = async (order: T_EA_DataOrder) => {};

  const trackTransactionCancel = async (order: T_EA_DataOrder) => {};

  const trackTransactionFulfill = async (order: T_EA_DataOrder) => {};

  const trackTransaction = async (order: T_EA_DataOrder) => {
    const evtName = trackUtils.getEventNameOfTransaction(order);
    // const session = options.resolvers?.session?.();
    const page = options.resolvers?.page?.();
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
        },
        ShippingAddress: {
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
        },
      },
    });
    return trackIdentify(); //{ ...user, });
  };

  const trackProductAddToCart = async (basket: T_EA_DataBasket) => {
    basket.lastAdded.map((product) => {
      const evtName = trackUtils.getEventNameOfProductAddToCart(product);
      // console.debug('[EA:Klaviyo] trackInitiateCheckout', evtName);
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
      // console.debug('[EA:Klaviyo] trackInitiateCheckout', evtName);
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
    await Promise.allSettled(products.map((p) => trackProductItemView(p)));
  };

  const trackProductItemView = async (product: T_EA_DataProduct) => {
    const evtName = trackUtils.getEventNameOfProductItemView(product);
    // console.debug('[EA:Klaviyo] trackProductItemView', evtName);
    collectEvent({
      event: 'Viewed Product',
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
    collectEvent({
      event: e.name,
      properties: e.attributes ?? {},
    });
    return trackIdentify();
  };

  const trackInitiateCheckout = async (basket: T_EA_DataBasket) => {
    const evtName = trackUtils.getEventNameOfInitiateCheckout(basket);
    const page = options.resolvers?.page?.();
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

  const trackSearch = async (searchTerm, matchingProducts) => {
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
    // console.debug('[EA:Klaviyo] trackProfileResetPassword', request.user);
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
    // console.debug('[EA:Klaviyo] trackProfileSubscribeNL', request.user);
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

export default klaviyoTracker;

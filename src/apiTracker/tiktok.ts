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
export const installTT = (
  pixelId?: string | null,
  autoTrackPageViews?: boolean
) => {
  return trackUtils.isBrowserMode && uiLibInstallStatus === 'no' && pixelId
    ? new Promise((instok, insterr) => {
        uiLibInstallStatus = 'installing';
        globalThis.window['TiktokAnalyticsObject'] = null;
        (function (w, d, t) {
          w['TiktokAnalyticsObject'] = t;
          const ttq = (w[t] = w[t] || []);
          ttq.methods = [
            'page',
            'track',
            'identify',
            'instances',
            'debug',
            'on',
            'off',
            'once',
            'ready',
            'alias',
            'group',
            'enableCookie',
            'disableCookie',
          ];

          ttq.setAndDefer = function (t, e) {
            t[e] = function () {
              t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
            };
          };

          for (var i = 0; i < ttq.methods.length; i++) {
            ttq.setAndDefer(ttq, ttq.methods[i]);
          }

          ttq.instance = function (t) {
            for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++)
              ttq.setAndDefer(e, ttq.methods[n]);
            return e;
          };

          ttq.load = function (e, n) {
            const i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
            (ttq._i = ttq._i || {}),
              (ttq._i[e] = []),
              (ttq._i[e]._u = i),
              (ttq._t = ttq._t || {}),
              (ttq._t[e] = +new Date()),
              (ttq._o = ttq._o || {}),
              (ttq._o[e] = n || {});
            n = document.createElement('script');
            (n.type = 'text/javascript'),
              (n.async = !0),
              (n.src = i + '?sdkid=' + e + '&lib=' + t);
            e = document.getElementsByTagName('script')[0];
            e.parentNode.insertBefore(n, e);

            new Promise((resolve, reject) => {
              // @ts-ignore
              n.onload = resolve;
              // @ts-ignore
              n.onerror = reject;
            })
              .then(() => {
                uiLibInstallStatus = 'yes';
                instok(w[t]);
              })
              .catch(() => {
                uiLibInstallStatus = 'no';
                insterr();
              });
          };

          ttq.load(pixelId);
          autoTrackPageViews ? ttq.page() : void 0;
        })(globalThis.window, globalThis.document, 'ttq');
      })
    : null;
};

// Is designed to run in browsers only.

export const tiktokTracker = (options: TSettings) => {
  const { absoluteURL, integrations: analytics, currency } = options;

  if (!analytics?.tiktok?.pixelId) {
    throw '[EA] TikTok is not configured properly; pixelId is not defined';
  }

  if (!isBrowserMode && !analytics?.tiktok.token) {
    throw '[EA] TikTok has no token defined to run in server mode';
  }

  const { track, identify, page: trackPage } = globalThis.window.ttq;

  const getUserObj = (profile?: T_EA_DataProfile | null) => {
    return resolveUser(profile);
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

  const normalizePayload = (
    payload?: Record<string, any>
  ): Record<string, any> =>
    Object.entries(payload ?? {}).reduce((r, entry) => {
      return entry[1] === null || typeof entry[1] === 'undefined'
        ? r
        : {
            ...r,
            [entry[0]]: entry[1],
          };
    }, {} as Record<string, any>);

  type T_EA_TikTokEventPayload = {
    event_id: string;
    event_time: number;
    page?: { url?: string };
    user?: {
      ttclid: string | null; // string. TikTok Click ID (ttclid) or a tracking parameter added to a landing page URL whenever a user clicks on an ad on TikTok. It starts with "E.C.P.".
      external_id: string | null; // string. Any unique identifier, such as loyalty membership IDs, user IDs, and external cookie IDs.It must be hashed with SHA-256 on the client side.
      phone: string | null; // string. The phone number of the customer if available. It must be hashed with SHA-256 on the client side.
      email: string | null; // string. The email of the customer if available. It must be hashed with SHA-256 on the client side.
      ttp: string | null; // string. Cookie ID saved in the _ttp cookie when you use Pixel SDK and enable cookies. Example: "2F7h37YkS1j57AYSKTI7IHhJPYH"
      ip: string | null; // string. Non-hashed public IP address of the browser.
      user_agent: string | null; // string. Non-hashed user agent from the user’s device. Example: "Chrome/91.0.4472.124".
    };
    contents: {
      content_id?: string | null; // string. ID of the product. Example: "1077218".
      content_type?: string | null; // string. Either product or product_group.
      content_name?: string | null; // string. The name of the page or product. Example: "shirt".
      content_category?: string | null; // string. The category of the page or product. Example: "apparel".
      quantity?: number | null; // number. The number of items. Example: 4.
      price?: number | null; // number. The price of a single item. Example: 25.
      brand?: string | null; // string. The brand name of the page or product. Example: "Nike".
    }[];
    value?: number | null; // number. Value of the order or items sold. Example: 100.
    currency?: string | null; // string. The 4217 currency code. Example: "USD".
    description?: string | null; // string. Non-hashed public IP address of the browser.
    query?: string | null; // string. The word or phrase used to search. Example: "SAVE10COUPON".
  };
  const collectEvent = async (
    evtName: string,
    payload: T_EA_TikTokEventPayload,
    userData?: T_EA_DataProfile | null
  ): Promise<TServerEventResponse> => {
    const session = options.resolvers?.session?.();
    const page = options.resolvers?.page?.();
    const user = getUserObj(userData);

    const eventProps = payload
      ? {
          ...normalizePayload(payload),
          contents: payload?.contents.map(normalizePayload).filter(Boolean),
        }
      : {};

    const eventData = {
      event: evtName,
      event_id: payload.event_id,
      event_time: payload.event_time,
      user: {
        ...user,
        ...(user?.email
          ? {
              email: await trackUtils.digestMessage(
                user.email.toLowerCase().trim()
              ),
            }
          : {}),
        ...(user?.phone
          ? {
              phone: await trackUtils.digestMessage(
                (user.phone.startsWith('+') ? user.phone : `+${user.phone}`)
                  .toLowerCase()
                  .trim()
              ),
            }
          : {}),
        ...(user?.id || user?.externalId
          ? {
              external_id: await trackUtils.digestMessage(
                (user.id! ?? user.externalId!).toString().toLowerCase().trim()
              ),
            }
          : {}),
        ttclid: session?.ttclid,
        ttp: session?.ttp,
        ip: session?.ip,
        user_agent: session?.agent,
      },
      page: { url: page?.url },
      properties: eventProps,
    };
    const eventPayload: Record<string, any> = {
      event_source: 'web',
      event_source_id: analytics?.tiktok?.pixelId,
      data: [eventData],
      ...(analytics?.tiktok?.testCode
        ? { test_event_code: analytics.tiktok.testCode }
        : {}),
    };

    log(`[EA:TikTok] collecting event ${evtName}`, payload);
    return isBrowserMode
      ? new Promise(async (resolve) => {
          track?.(evtName, eventProps);

          let conversionApiResult = null;
          if (analytics.tiktok?.conversionServerApiUrl) {
            log(
              '[EA:TikTok] Sending event to the ConversionAPI: ',
              analytics.tiktok.conversionServerApiUrl
            );
            const url = analytics.tiktok.conversionServerApiUrl;
            try {
              const convResp = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventPayload),
              });
              conversionApiResult = await convResp.json();
            } catch (err) {
              console.error(
                '[EA:TikTok] Republish ConversionAPI eventRequest=>Error: ',
                err
              );
            }
          }

          resolve({
            message: null,
            payload: [payload],
            response: true,
            conversionApiResult,
            payloadHashed: [eventPayload],
          });
        })
      : new Promise(async (resolve, reject) => {
          try {
            const result = await fetch(
              'https://business-api.tiktok.com/open_api/v1.3/event/track/',
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Token': analytics?.tiktok?.token!,
                },
                body: JSON.stringify(eventPayload),
              }
            );
            resolve({
              message: null,
              payload: [eventPayload],
              response: await result.json(),
            });
          } catch (e) {
            console.error(e);
            reject({
              message: `Error while sending event to TikTok: ${e}`,
              payload: [eventPayload],
              response: false,
            });
          }
        });
  };

  // Identify a user - create/update a profile in Klaviyo
  const trackIdentify = async (
    profile?: T_EA_DataProfile | null
  ): Promise<TServerEventResponse> => {
    const user = getUserObj(profile);

    if (user?.email) {
      const payload = normalizePayload({
        email: user.email,
        phone_number:
          user.phone && user.phone.startsWith('+')
            ? user.phone
            : `+${user.phone}`,
        external_id: user.id,
      });
      identify?.(payload);
      return Promise.resolve({
        message: null,
        payload: [payload],
        response: true,
      });
    }

    return Promise.resolve({
      message: 'User is not defined yet',
      payload: [user],
      response: null,
    });
  };

  const trackTransactionRefund = async (order: T_EA_DataOrder) => {};

  const trackTransactionCancel = async (order: T_EA_DataOrder) => {};

  const trackTransactionFulfill = async (order: T_EA_DataOrder) => {};

  const trackTransaction = async (order: T_EA_DataOrder) => {
    const evtName = trackUtils.getEventNameOfTransaction(order);
    await trackIdentify();
    return collectEvent(
      'CompletePayment',
      {
        event_id: evtName,
        event_time: Date.now(),
        contents: Object.values(order.products).map((product) => ({
          content_id: product.id.toString(),
          content_type: 'product',
          content_name: product.title,
          content_category: product.category,
          quantity: product.quantity,
          price: product.price,
          brand: product.brand,
        })),
        value: order.revenue,
        currency,
      },
      getUserObj(order.customer)
    );
  };

  const trackProductAddToCart = async (basket: T_EA_DataBasket) => {
    if (!basket.lastAdded.length) return;
    const evtName = trackUtils.getEventNameOfProductAddToCart(
      basket.lastAdded.at(0)!
    );
    await trackIdentify();
    return collectEvent('AddToCart', {
      event_id: evtName,
      event_time: Date.now(),
      contents: basket.lastAdded.map((product) => ({
        content_id: product.id.toString(),
        content_type: 'product',
        content_name: product.title,
        content_category: product.category,
        quantity: product.quantity,
        price: product.price,
        brand: product.brand,
      })),
      value: basket.total,
      currency,
    });
  };

  const trackProductRemoveFromCart = async (basket: T_EA_DataBasket) => {
    if (!basket.lastRemoved.length) return;
    const evtName = trackUtils.getEventNameOfProductRemoveFromCart(
      basket.lastRemoved.at(0)!
    );
    await trackIdentify();
    collectEvent('RemoveFromCart', {
      event_id: evtName,
      event_time: Date.now(),
      contents: basket.lastRemoved.map((product) => ({
        content_id: product.id.toString(),
        content_type: 'product',
        content_name: product.title,
        content_category: product.category,
        quantity: product.quantity,
        price: product.price,
        brand: product.brand,
      })),
      value: basket.total,
      currency,
    });
  };

  const trackProductsItemView = async (products: T_EA_DataProduct[]) => {
    await Promise.allSettled(products.map((p) => trackProductItemView(p)));
  };

  const trackProductItemView = async (product: T_EA_DataProduct) => {
    const evtName = trackUtils.getEventNameOfProductItemView(product);
    await trackIdentify();
    return collectEvent('ViewContent', {
      event_id: evtName,
      event_time: Date.now(),
      contents: [
        {
          content_id: product.id.toString(),
          content_type: 'product',
          content_name: product.title,
          content_category: product.category,
          quantity: product.quantity,
          price: product.price,
          brand: product.brand,
        },
      ],
    });
  };

  const trackPageView = async (page: T_EA_DataPage) => {
    const evtName = trackUtils.getEventNameOfPageView();
    await trackIdentify();
    return collectEvent('Pageview', {
      event_id: evtName,
      event_time: Date.now(),
      page: { url: page.url },
      contents: [],
    });
  };

  const trackCustom = async (e: T_EA_DataCustomEvent) => {
    const evtName = trackUtils.getEventNameOfCustom(e.name);
    await trackIdentify();
    return collectEvent(e.name, {
      event_id: evtName,
      event_time: Date.now(),
      contents: [],
    });
  };

  const trackInitiateCheckout = async (basket: T_EA_DataBasket) => {
    const evtName = trackUtils.getEventNameOfInitiateCheckout(basket);
    await trackIdentify();
    return collectEvent('InitiateCheckout', {
      event_id: evtName,
      event_time: Date.now(),
      contents: basket.products.map((product) => ({
        content_id: product.id.toString(),
        content_type: 'product',
        content_name: product.title,
        content_category: product.category,
        quantity: product.quantity,
        price: product.price,
        brand: product.brand,
      })),
      value: basket.total,
      currency,
    });
  };

  const trackSearch = async (
    searchTerm: string,
    matchingProducts: T_EA_DataProduct[]
  ) => {
    const evtName = trackUtils.getEventNameOfSearch(
      searchTerm,
      matchingProducts
    );
    const page = options.resolvers?.page?.();
    await trackIdentify();
    return collectEvent('Search', {
      event_id: evtName,
      event_time: Date.now(),
      query: searchTerm,
      page: { url: page?.url },
      contents: matchingProducts.map((product) => ({
        content_id: product.id.toString(),
        content_type: 'product',
        content_name: product.title,
        content_category: product.category,
        quantity: product.quantity,
        price: product.price,
        brand: product.brand,
      })),
    });
  };

  const trackNewProfile = async (profile: T_EA_DataProfile | null) => {
    const evtName = trackUtils.getEventNameOfCustom('CompleteRegistration');
    await trackIdentify();
    return collectEvent('CompleteRegistration', {
      event_id: evtName,
      event_time: Date.now(),
      contents: [],
    });
  };

  const trackProfileResetPassword = async (
    profile: T_EA_DataProfile | null
  ) => {
    const evtName = trackUtils.getEventNameOfCustom('ProfileResetPassword');
    await trackIdentify();
    return collectEvent('ProfileResetPassword', {
      event_id: evtName,
      event_time: Date.now(),
      contents: [],
    });
  };

  const trackProfileLogIn = async (profile: T_EA_DataProfile | null) => {
    const evtName = trackUtils.getEventNameOfCustom('ProfileLogIn');
    await trackIdentify();
    return collectEvent('ProfileLogIn', {
      event_id: evtName,
      event_time: Date.now(),
      contents: [],
    });
  };

  const trackProfileLogOut = async (profile: T_EA_DataProfile | null) => {
    const evtName = trackUtils.getEventNameOfCustom('ProfileLogOut');
    await trackIdentify();
    return collectEvent('ProfileLogOut', {
      event_id: evtName,
      event_time: Date.now(),
      contents: [],
    });
  };

  const trackProfileSubscribeNL = async (profile: T_EA_DataProfile | null) => {
    const evtName = trackUtils.getEventNameOfCustom('Subscribe');
    await trackIdentify();
    return collectEvent('Subscribe', {
      event_id: evtName,
      event_time: Date.now(),
      contents: [],
    });
  };

  const trackAddPaymentInfo = async (order: T_EA_DataOrder) => {
    const evtName = trackUtils.getEventNameOfPaymentInfo(order.payment.type);
    await trackIdentify();
    return collectEvent('AddPaymentInfo', {
      event_id: evtName,
      event_time: Date.now(),
      contents: [],
    });
  };
  const trackAddShippingInfo = async (order: T_EA_DataOrder) => {
    const evtName = trackUtils.getEventNameOfShippingInfo(order.shipping.name);
    await trackIdentify();
    return collectEvent('AddShippingInfo', {
      event_id: evtName,
      event_time: Date.now(),
      contents: [],
    });
  };
  const trackAddToWishlist = async (products: T_EA_DataProduct[]) => {
    if (products.length === 0) return;
    const evtName = trackUtils.getEventNameOfProductItemWish(products[0]);
    await trackIdentify();
    return collectEvent('AddToWishlist', {
      event_id: evtName,
      event_time: Date.now(),
      contents: products.map((product) => ({
        content_id: product.id.toString(),
        content_type: 'product',
        content_name: product.title,
        content_category: product.category,
        quantity: product.quantity,
        price: product.price,
        brand: product.brand,
      })),
    });
  };
  const trackViewBasket = async (basket: T_EA_DataBasket) => {
    const evtName = trackUtils.getEventNameOfCustom('ViewBasket');
    await trackIdentify();
    return collectEvent('ViewBasket', {
      event_id: evtName,
      event_time: Date.now(),
      contents: basket.products.map((product) => ({
        content_id: product.id.toString(),
        content_type: 'product',
        content_name: product.title,
        content_category: product.category,
        quantity: product.quantity,
        price: product.price,
        brand: product.brand,
      })),
      value: basket.total,
      currency,
    });
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

export default tiktokTracker;

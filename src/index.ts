import { configureAnalytics, getConfig } from './config';
import apiTracker, { getEEC } from './apiTracker';
import { resolveUser } from './apiTracker/identity';
import { TSettings } from './shared';
import { installBrowserTrackers } from './apiTracker/installers';
import {
  ETrackers,
  type T_EA_DataBasket,
  type T_EA_DataOrder,
  type T_EA_DataPage,
  type T_EA_DataProduct,
  type T_EA_DataProfile,
  type T_EA_DataCustomEvent,
} from './shared';
import {
  isNativePayloadBasket,
  isNativePayloadOrder,
  isNativePayloadPage,
  isNativePayloadProducts,
  isNativePayloadProfile,
} from './guards';

export * from './apiTracker';
export * from './utils';
export {
  TSettings,
  T_EA_DataAddress as TDataAddress,
  T_EA_DataBasket as TDataBasket,
  T_EA_DataOrder as TDataOrder,
  T_EA_DataPage as TDataPage,
  T_EA_DataProduct as TDataProduct,
  T_EA_DataProfile as TDataProfile,
  TEECParams,
  TEvtType,
} from './shared';

export * from './config';
export * from './guards';

export const useAnalytics = (c?: TSettings) => {
  c ? configureAnalytics(c) : void 0;
  // temporary solution
  c ? installBrowserTrackers(c) : void 0;

  const config = getConfig();
  return {
    config,
    identify: (user: T_EA_DataProfile) => {
      const u = resolveUser(user);
      return u && u.email;
    },
    utils: {
      observeItemsOnScreen(
        elSelector: string,
        whenFound: (e: IntersectionObserverEntry) => void
      ) {
        // Register IntersectionObserver
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            entry.intersectionRatio > 0 ? whenFound(entry) : void 0;
          });
        });

        setTimeout(() => {
          // Declares what to observe, and observes its properties.
          const boxElList = document.querySelectorAll(elSelector);
          boxElList.forEach((el) => {
            io.observe(el);
          });
        });
      },
    },
    withMisc: (name: string, attributes?: Record<string, any>) => {
      const store = getConfig();
      if (!store._configured) {
        throw '[EA] Invoke configureAnalytics first and provide configuration';
      }
      const v: T_EA_DataCustomEvent = {
        name,
        attributes,
      };
      return {
        s2s: {
          all: () => apiTracker(store, { server: true }).misc(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, {
              fb: true,
              server: true,
            }).misc(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, {
              klaviyo: true,
              server: true,
            }).misc(v),
          [ETrackers.TikTok]: () =>
            apiTracker(store, {
              tiktok: true,
              server: true,
            }).misc(v),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce((r, t) => ({ ...r, [t]: true }), {
              server: true,
            } as Partial<Record<ETrackers, boolean>>);
            return apiTracker(store, c).misc(v);
          },
        },
        events: {
          [ETrackers.GoogleAnalytics]: () => getEEC(store).misc(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, { klaviyo: true }).misc(v),
          [ETrackers.FullStory]: () =>
            apiTracker(store, { fullstory: true }).misc(v),
          [ETrackers.Facebook]: () => apiTracker(store, { fb: true }).misc(v),
          [ETrackers.TikTok]: () => apiTracker(store, { tiktok: true }).misc(v),
        },
      };
    },
    withPage: (payload: T_EA_DataPage | Record<string, any> | null = null) => {
      const store = getConfig();
      if (!store._configured) {
        throw '[EA] Invoke configureAnalytics first and provide configuration';
      }

      const isNative = isNativePayloadPage(payload);
      if (!isNative && !store.resolvers?.page) {
        throw '[EA] [store.resolvers.page] is not defined';
      }

      const v = isNative ? payload : store.resolvers?.page?.(payload) ?? null;

      if (!v) {
        throw '[EA] Page data is not defined';
      }

      return {
        s2s: {
          all: () => apiTracker(store, { server: true }).page(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, {
              fb: true,
              server: true,
            }).page(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, {
              klaviyo: true,
              server: true,
            }).page(v),
          [ETrackers.TikTok]: () =>
            apiTracker(store, {
              tiktok: true,
              server: true,
            }).page(v),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce((r, t) => ({ ...r, [t]: true }), {
              server: true,
            } as Partial<Record<ETrackers, boolean>>);
            return apiTracker(store, c).page(v);
          },
        },
        events: {
          [ETrackers.GoogleAnalytics]: () => getEEC(store).page(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, { klaviyo: true }).page(v),
          [ETrackers.FullStory]: () =>
            apiTracker(store, { fullstory: true }).page(v),
          [ETrackers.Facebook]: () => apiTracker(store, { fb: true }).page(v),
          [ETrackers.TikTok]: () => apiTracker(store, { tiktok: true }).page(v),
        },
      };
    },
    withProfile: (
      payload: T_EA_DataProfile | Record<string, any> | null = null
    ) => {
      const store = getConfig();
      if (!store._configured) {
        throw '[EA] Invoke configureAnalytics first and provide configuration';
      }

      const isNative = isNativePayloadProfile(payload);
      if (!isNative && !store.resolvers?.profile) {
        throw '[EA] [store.resolvers.profile] is not defined';
      }

      const v = isNative || !payload ? resolveUser(payload) : null;
      if (!v) {
        throw '[EA] User data is not defined';
      }

      return {
        s2s: {
          all: () => apiTracker(store, { server: true }).profile(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, {
              fb: true,
              server: true,
            }).profile(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, {
              klaviyo: true,
              server: true,
            }).profile(v),
          [ETrackers.TikTok]: () =>
            apiTracker(store, {
              tiktok: true,
              server: true,
            }).profile(v),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce((r, t) => ({ ...r, [t]: true }), {
              server: true,
            } as Partial<Record<ETrackers, boolean>>);
            return apiTracker(store, c).profile(v);
          },
        },
        events: {
          [ETrackers.GoogleAnalytics]: () => getEEC(store).profile(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, { klaviyo: true }).profile(v),
          [ETrackers.FullStory]: () =>
            apiTracker(store, { fullstory: true }).profile(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, { fb: true }).profile(v),
          [ETrackers.TikTok]: () =>
            apiTracker(store, { tiktok: true }).profile(v),
        },
      };
    },
    withCatalog: (
      payload: (T_EA_DataProduct | Record<string, any>)[] | null = null
    ) => {
      const store = getConfig();
      if (!store._configured) {
        throw '[EA] Invoke configureAnalytics first and provide configuration';
      }

      const isNative = isNativePayloadProducts(payload);
      if (!isNative && !store.resolvers?.product) {
        throw '[EA] [store.resolvers.profile] is not defined';
      }

      const v = isNative
        ? payload
        : payload
            ?.map((p) => store.resolvers?.product?.(p))
            .filter((v): v is T_EA_DataProduct => !!v) ?? null;

      if (!v) {
        throw '[EA] Product data is not defined';
      }

      return {
        s2s: {
          all: () => apiTracker(store, { server: true }).catalog(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, {
              fb: true,
              server: true,
            }).catalog(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, {
              klaviyo: true,
              server: true,
            }).catalog(v),
          [ETrackers.TikTok]: () =>
            apiTracker(store, {
              tiktok: true,
              server: true,
            }).catalog(v),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce((r, t) => ({ ...r, [t]: true }), {
              server: true,
            } as Partial<Record<ETrackers, boolean>>);
            return apiTracker(store, c).catalog(v);
          },
        },
        events: {
          [ETrackers.GoogleAnalytics]: () => getEEC(store).catalog(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, { klaviyo: true }).catalog(v),
          [ETrackers.FullStory]: () =>
            apiTracker(store, { fullstory: true }).catalog(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, { fb: true }).catalog(v),
          [ETrackers.TikTok]: () =>
            apiTracker(store, { tiktok: true }).catalog(v),
        },
        feed: {
          [ETrackers.Facebook]: () => {
            const xml = '<?xml version="1.0"?>';
            const rssChannel = (...inner: string[]) =>
              `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>${inner.join(
                ''
              )}</channel></rss>`;
            const title = (t: string) => `<title>${t}</title>`;
            const link = (l: string) =>
              `<link>${l}</link><atom:link href="${l}" rel="self" type="application/rss+xml" />`;
            const desc = (d: string) => `<description>${d}</description>`;
            const sanitize = (str: string) => str.replace(/&(?!a)/g, '&amp;');
            const getAbsoluteUrl = (url?: string) =>
              url
                ? url.startsWith('http')
                  ? url
                  : [config.absoluteURL, url]
                      .join('/')
                      .replace(/([^:]\/)\/+/g, '$1')
                : '';
            // https://support.google.com/merchants/answer/7052112?hl=en&ref_topic=6324338&sjid=4696082261280780108-EU
            const items = (products: T_EA_DataProduct[] = []) =>
              products.map((p) =>
                [
                  `<item>`,
                  `<g:id>${p.id}</g:id>`,
                  `<g:title>${sanitize(p.title)}</g:title>`,
                  `<g:description>${sanitize(p.description)
                    .replace(/<[^>]*>/g, '')
                    .replace(/\r\n/g, ' ')}</g:description>`,
                  `<g:availability>${
                    p.inStock ? 'in stock' : 'out_of_stock'
                  }</g:availability>`,
                  `<g:link>${getAbsoluteUrl(p.url)}</g:link>`,
                  `<g:brand>${sanitize(p.brand)}</g:brand>`,
                  `<g:price>${p.price.toFixed(2)} ${config.currency}</g:price>`,
                  `<g:product_type>${sanitize(p.category)}</g:product_type>`,
                  `<g:image_link>${getAbsoluteUrl(p.imageUrl)}</g:image_link>`,
                  p.dimLength
                    ? `<g:product_length>${p.dimLength}</g:product_length>`
                    : null,
                  p.dimWidth
                    ? `<g:product_width>${p.dimWidth}</g:product_width>`
                    : null,
                  p.dimHeight
                    ? `<g:product_height>${p.dimHeight}</g:product_height>`
                    : null,
                  p.dimWeight
                    ? `<g:product_weight>${p.dimWeight}</g:product_weight>`
                    : null,
                  (p.imageUrls ?? [])
                    .map(
                      (img) =>
                        `<additional_image_link>${getAbsoluteUrl(
                          img
                        )}</additional_image_link>`
                    )
                    .join(''),
                  p.condition
                    ? `<g:condition>${p.condition}</g:condition>`
                    : null,
                  p.inStock ?? 0 > 0
                    ? `<g:quantity_to_sell_on_facebook>${p.inStock}</g:quantity_to_sell_on_facebook>`
                    : null,
                  p.isSale && p.salePrice
                    ? `<g:sale_price>${p.salePrice.toFixed(2)} ${
                        config.currency
                      }</g:sale_price>`
                    : null,
                  (p.dimensions || [])
                    .map(
                      (dim, idx) =>
                        `<g:custom_label_${idx}>${dim}</g:custom_label_${idx}>`
                    )
                    .join(''),
                  (p.metrics || [])
                    .map(
                      (met, idx) =>
                        `<g:custom_number_${idx}>${met}</g:custom_number_${idx}>`
                    )
                    .join(''),
                  p.color ? `<g:color>${p.color}</g:color>` : null,
                  p.size ? `<g:size>${p.size || 'Unisize'}</g:size>` : null,
                  p.groupId
                    ? `<g:item_group_id>${
                        p.groupId || 'General'
                      }</g:item_group_id>`
                    : null,
                  p.gender ? `<g:gender>${p.gender}</g:gender>` : null,
                  p.ageGroup
                    ? `<g:age_group>${p.ageGroup}</g:age_group>`
                    : null,
                  p.google_product_category
                    ? `<g:google_product_category>${p.google_product_category}</g:google_product_category>`
                    : null,
                  p.fb_product_category
                    ? `<g:fb_product_category>${p.fb_product_category}</g:fb_product_category>`
                    : null,
                  p.material ? `<g:material>${p.material}</g:material>` : null,
                  p.pattern ? `<g:pattern>${p.pattern}</g:pattern>` : null,
                  p.shipping ? `<g:shipping>${p.shipping}</g:shipping>` : null,
                  p.shipping_weight
                    ? `<g:shipping_weight>${p.shipping_weight}</g:shipping_weight>`
                    : null,
                  `</item>`,
                ]
                  .filter(Boolean)
                  .join('')
              );
            const feed = [
              xml,
              rssChannel(
                title(config.affiliation),
                link(getAbsoluteUrl(config.feeds?.facebook?.feedUrl)),
                desc(config.description ?? ''),
                ...items(v)
              ),
            ];
            return feed.join('');
          },
          [ETrackers.Klaviyo]: () => {
            const getAbsoluteUrl = (url?: string) =>
              url
                ? url.startsWith('http')
                  ? url
                  : [config.absoluteURL, url]
                      .join('/')
                      .replace(/([^:]\/)\/+/g, '$1')
                : '';
            // https://developers.klaviyo.com/en/docs/guide_to_syncing_a_custom_catalog_feed_to_klaviyo
            const feed = v.map((p) => ({
              id: p.id,
              title: p.title,
              link: getAbsoluteUrl(p.url),
              description: p.description,
              price: p.price,
              image_link: getAbsoluteUrl(p.imageUrl),
              categories: [p.category, ...(p.categories ?? [])],
              inventory_quantity: p.inStock ?? 1,
              inventory_policy: 1,
            }));
            return JSON.stringify(feed);
          },
          [ETrackers.GoogleAnalytics]: () => {
            const xml = '<?xml version="1.0"?>';
            const rssChannel = (...inner: string[]) =>
              `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>${inner.join(
                ''
              )}</channel></rss>`;
            const title = (t: string) => `<title>${t}</title>`;
            const link = (l: string) =>
              `<link>${l}</link><atom:link href="${l}" rel="self" type="application/rss+xml" />`;
            const desc = (d: string) => `<description>${d}</description>`;
            const sanitize = (str: string) => str.replace(/&(?!a)/g, '&amp;');
            const getAbsoluteUrl = (url?: string) =>
              url
                ? url.startsWith('http')
                  ? url
                  : [config.absoluteURL, url]
                      .join('/')
                      .replace(/([^:]\/)\/+/g, '$1')
                : '';
            // https://support.google.com/merchants/answer/7052112?hl=en&ref_topic=6324338&sjid=4696082261280780108-EU
            const items = (products: T_EA_DataProduct[] = []) =>
              products.map((p) =>
                [
                  `<item>`,
                  `<g:id>${p.id}</g:id>`,
                  `<g:title>${sanitize(p.title)}</g:title>`,
                  `<g:description>${sanitize(p.description)
                    .replace(/<[^>]*>/g, '')
                    .replace(/\r\n/g, ' ')}</g:description>`,
                  `<g:availability>${
                    p.inStock ? 'in stock' : 'out_of_stock'
                  }</g:availability>`,
                  `<g:link>${getAbsoluteUrl(p.url)}</g:link>`,
                  `<g:brand>${sanitize(p.brand)}</g:brand>`,
                  `<g:price>${p.price.toFixed(2)} ${config.currency}</g:price>`,
                  `<g:product_type>${sanitize(p.category)}</g:product_type>`,
                  `<g:image_link>${getAbsoluteUrl(p.imageUrl)}</g:image_link>`,
                  p.dimLength
                    ? `<g:product_length>${p.dimLength}</g:product_length>`
                    : null,
                  p.dimWidth
                    ? `<g:product_width>${p.dimWidth}</g:product_width>`
                    : null,
                  p.dimHeight
                    ? `<g:product_height>${p.dimHeight}</g:product_height>`
                    : null,
                  p.dimWeight
                    ? `<g:product_weight>${p.dimWeight}</g:product_weight>`
                    : null,
                  (p.imageUrls ?? [])
                    .map(
                      (img) =>
                        `<additional_image_link>${getAbsoluteUrl(
                          img
                        )}</additional_image_link>`
                    )
                    .join(''),
                  p.condition
                    ? `<g:condition>${p.condition}</g:condition>`
                    : null,
                  p.inStock ?? 0 > 0
                    ? `<g:quantity_to_sell_on_facebook>${p.inStock}</g:quantity_to_sell_on_facebook>`
                    : null,
                  p.isSale && p.salePrice
                    ? `<g:sale_price>${p.salePrice.toFixed(2)} ${
                        config.currency
                      }</g:sale_price>`
                    : null,
                  (p.dimensions || [])
                    .map(
                      (dim, idx) =>
                        `<g:custom_label_${idx}>${dim}</g:custom_label_${idx}>`
                    )
                    .join(''),
                  (p.metrics || [])
                    .map(
                      (met, idx) =>
                        `<g:custom_number_${idx}>${met}</g:custom_number_${idx}>`
                    )
                    .join(''),
                  p.color ? `<g:color>${p.color}</g:color>` : null,
                  p.size ? `<g:size>${p.size || 'Unisize'}</g:size>` : null,
                  p.groupId
                    ? `<g:item_group_id>${
                        p.groupId || 'General'
                      }</g:item_group_id>`
                    : null,
                  p.gender ? `<g:gender>${p.gender}</g:gender>` : null,
                  p.ageGroup
                    ? `<g:age_group>${p.ageGroup}</g:age_group>`
                    : null,
                  p.google_product_category
                    ? `<g:google_product_category>${p.google_product_category}</g:google_product_category>`
                    : null,
                  p.fb_product_category
                    ? `<g:fb_product_category>${p.fb_product_category}</g:fb_product_category>`
                    : null,
                  p.material ? `<g:material>${p.material}</g:material>` : null,
                  p.pattern ? `<g:pattern>${p.pattern}</g:pattern>` : null,
                  p.shipping ? `<g:shipping>${p.shipping}</g:shipping>` : null,
                  p.shipping_weight
                    ? `<g:shipping_weight>${p.shipping_weight}</g:shipping_weight>`
                    : null,
                  `</item>`,
                ]
                  .filter(Boolean)
                  .join('')
              );
            const feed = [
              xml,
              rssChannel(
                title(config.affiliation),
                link(getAbsoluteUrl(config.feeds?.facebook?.feedUrl)),
                desc(config.description ?? ''),
                ...items(v)
              ),
            ];
            return feed.join('');
          },
          tiktok: () => {
            const xml = '<?xml version="1.0"?>';
            const rssChannel = (...inner: string[]) =>
              `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>${inner.join(
                ''
              )}</channel></rss>`;
            const title = (t: string) => `<title>${t}</title>`;
            const link = (l: string) =>
              `<link>${l}</link><atom:link href="${l}" rel="self" type="application/rss+xml" />`;
            const desc = (d: string) => `<description>${d}</description>`;
            const sanitize = (str: string) => str.replace(/&(?!a)/g, '&amp;');
            const getAbsoluteUrl = (url?: string) =>
              url
                ? url.startsWith('http')
                  ? url
                  : [config.absoluteURL, url]
                      .join('/')
                      .replace(/([^:]\/)\/+/g, '$1')
                : '';
            // https://ads.tiktok.com/help/article/catalog-product-parameters?lang=en
            const items = (products: T_EA_DataProduct[] = []) =>
              products.map((p) =>
                [
                  `<item>`,
                  `<g:sku_id>${p.id}</g:sku_id>`,
                  `<g:title>${sanitize(p.title)}</g:title>`,
                  `<g:description>${sanitize(p.description)
                    .replace(/<[^>]*>/g, '')
                    .replace(/\r\n/g, ' ')}</g:description>`,
                  `<g:availability>${
                    p.inStock ? 'in stock' : 'out_of_stock'
                  }</g:availability>`,
                  p.condition
                    ? `<g:condition>${p.condition}</g:condition>`
                    : null,
                  `<g:price>${p.price.toFixed(2)} ${config.currency}</g:price>`,
                  `<g:link>${getAbsoluteUrl(p.url)}</g:link>`,
                  `<g:image_link>${getAbsoluteUrl(p.imageUrl)}</g:image_link>`,
                  `<g:brand>${sanitize(p.brand)}</g:brand>`,
                  // optional fields
                  // https://ads.tiktok.com/help/article/catalog-product-parameters?lang=en#anchor-1
                  p.google_product_category
                    ? `<g:google_product_category>${p.google_product_category}</g:google_product_category>`
                    : null,
                  (p.imageUrls ?? []).length > 0
                    ? `<additional_image_link>${p.imageUrls
                        ?.map(getAbsoluteUrl)
                        .join(',')}</additional_image_link>`
                    : null,
                  p.ageGroup
                    ? `<g:age_group>${p.ageGroup}</g:age_group>`
                    : null,
                  p.color ? `<g:color>${p.color}</g:color>` : null,
                  p.gender ? `<g:gender>${p.gender}</g:gender>` : null,
                  p.groupId
                    ? `<g:item_group_id>${
                        p.groupId || 'General'
                      }</g:item_group_id>`
                    : null,
                  p.material ? `<g:material>${p.material}</g:material>` : null,
                  p.pattern ? `<g:pattern>${p.pattern}</g:pattern>` : null,
                  `<g:product_type>${sanitize(p.category)}</g:product_type>`,
                  p.isSale && p.salePrice
                    ? `<g:sale_price>${p.salePrice.toFixed(2)} ${
                        config.currency
                      }</g:sale_price>`
                    : null,
                  p.shipping ? `<g:shipping>${p.shipping}</g:shipping>` : null,
                  p.shipping_weight
                    ? `<g:shipping_weight>${p.shipping_weight}</g:shipping_weight>`
                    : null,
                  p.size ? `<g:size>${p.size || 'Unisize'}</g:size>` : null,
                  (p.dimensions || [])
                    .map(
                      (dim, idx) =>
                        `<g:custom_label_${idx}>${dim}</g:custom_label_${idx}>`
                    )
                    .join(''),
                  `</item>`,
                ]
                  .filter(Boolean)
                  .join('')
              );
            const feed = [
              xml,
              rssChannel(
                title(config.affiliation),
                link(getAbsoluteUrl(config.feeds?.facebook?.feedUrl)),
                desc(config.description ?? ''),
                ...items(v)
              ),
            ];

            return feed.join('');
          },
        },
      };
    },
    withBasket: (
      payload: T_EA_DataBasket | Record<string, any> | null = null
    ) => {
      const store = getConfig();
      if (!store._configured) {
        throw '[EA] Invoke configureAnalytics first and provide configuration';
      }
      if (!store.resolvers?.basket) {
        throw '[EA] [store.resolvers.basket] is not defined';
      }

      const isNative = isNativePayloadBasket(payload);
      if (!isNative && !store.resolvers?.basket) {
        throw '[EA] [store.resolvers.basket] is not defined';
      }

      const v = isNative ? payload : store.resolvers?.basket?.(payload) ?? null;
      if (!v) {
        throw '[EA] Basket data is not defined';
      }

      return {
        s2s: {
          all: () => apiTracker(store, { server: true }).basket(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, {
              fb: true,
              server: true,
            }).basket(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, {
              klaviyo: true,
              server: true,
            }).basket(v),
          [ETrackers.TikTok]: () =>
            apiTracker(store, {
              tiktok: true,
              server: true,
            }).basket(v),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce((r, t) => ({ ...r, [t]: true }), {
              server: true,
            } as Partial<Record<ETrackers, boolean>>);
            return apiTracker(store, c).basket(v);
          },
        },
        events: {
          [ETrackers.GoogleAnalytics]: () => getEEC(store).basket(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, { klaviyo: true }).basket(v),
          [ETrackers.FullStory]: () =>
            apiTracker(store, { fullstory: true }).basket(v),
          [ETrackers.Facebook]: () => apiTracker(store, { fb: true }).basket(v),
          [ETrackers.TikTok]: () =>
            apiTracker(store, { tiktok: true }).basket(v),
        },
      };
    },
    withOrder: (
      payload: T_EA_DataOrder | Record<string, any> | null = null
    ) => {
      const store = getConfig();

      if (!store._configured) {
        throw '[EA] Invoke configureAnalytics first and provide configuration';
      }

      const isNative = isNativePayloadOrder(payload);
      if (!isNative && !store.resolvers?.order) {
        throw '[EA] [store.resolvers.order] is not defined';
      }

      const v = isNative ? payload : store.resolvers?.order?.(payload) ?? null;
      if (!v) {
        throw '[EA] Order data is not defined';
      }
      return {
        s2s: {
          all: () => apiTracker(store, { server: true }).order(v),
          [ETrackers.Facebook]: () =>
            apiTracker(store, {
              fb: true,
              server: true,
            }).order(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, {
              klaviyo: true,
              server: true,
            }).order(v),
          [ETrackers.TikTok]: () =>
            apiTracker(store, {
              tiktok: true,
              server: true,
            }).order(v),
          any: (...trackers: ETrackers[]) => {
            const c = trackers.reduce((r, t) => ({ ...r, [t]: true }), {
              server: true,
            } as Partial<Record<ETrackers, boolean>>);
            return apiTracker(store, c).order(v);
          },
        },
        events: {
          [ETrackers.GoogleAnalytics]: () => getEEC(store).order(v),
          [ETrackers.Klaviyo]: () =>
            apiTracker(store, { klaviyo: true }).order(v),
          [ETrackers.FullStory]: () =>
            apiTracker(store, { fullstory: true }).order(v),
          [ETrackers.Facebook]: () => apiTracker(store, { fb: true }).order(v),
          [ETrackers.TikTok]: () =>
            apiTracker(store, { tiktok: true }).order(v),
        },
      };
    },
  };
};

export default useAnalytics;

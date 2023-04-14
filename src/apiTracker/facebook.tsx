import { log } from '../log';
import React, { useEffect } from 'react';
import {
  T_EA_DataBasket,
  T_EA_DataCustomEvent,
  T_EA_DataOrder,
  T_EA_DataPage,
  T_EA_DataProduct,
  T_EA_DataProfile,
  TSettings,
  TServerEventResponse,
} from '../shared';
import * as trackUtils from '../utils';
import { round, isBrowserMode } from '../utils';
import { resolveUser } from './identity';

const DeliveryCategory = {
  IN_STORE: 'in_store',
  CURBSIDE: 'curbside',
  HOME_DELIVERY: 'home_delivery',
};

const sentUserData = new Set();

let { Content, CustomData, UserData, ServerEvent, EventRequest } = (() => {
  class Content {
    _id;
    _quantity;
    _title;
    _brand;
    _description;
    _category;
    _item_price;
    _delivery_category;
    setId(_id: string) {
      this._id = _id;
      return this;
    }
    setQuantity(_quantity: number) {
      this._quantity = _quantity;
      return this;
    }
    setTitle(_title: string) {
      this._title = _title;
      return this;
    }
    setBrand(_brand: string) {
      this._brand = _brand;
      return this;
    }
    setDescription(_description: string) {
      this._description = _description;
      return this;
    }
    setCategory(_category: string) {
      this._category = _category;
      return this;
    }
    setItemPrice(_item_price: number) {
      this._item_price = _item_price;
      return this;
    }
    setDeliveryCategory(_delivery_category: string) {
      this._delivery_category = _delivery_category;
      return this;
    }
    normalize(): Record<string, any> {
      return {
        id: this._id,
        quantity: this._quantity,
        title: this._title,
        brand: this._brand,
        description: this._description,
        category: this._category,
        item_price: this._item_price,
        delivery_category: this._delivery_category,
      };
    }
  }
  class CustomData {
    _contents;
    _currency;
    _order_id;
    _status;
    _num_items;
    _value;
    _content_name;
    _content_category;
    _search_string;
    _content_type;
    setContents(_contents: Content[]) {
      this._contents = _contents;
      return this;
    }
    setCurrency(_currency: string) {
      this._currency = _currency;
      return this;
    }
    setOrderId(_order_id: string) {
      this._order_id = _order_id;
      return this;
    }
    setStatus(_status: string) {
      this._status = _status;
      return this;
    }
    setNumItems(_num_items: number) {
      this._num_items = _num_items;
      return this;
    }
    setValue(_value: number) {
      this._value = _value;
      return this;
    }
    setContentName(_content_name: string) {
      this._content_name = _content_name;
      return this;
    }
    setContentType(_content_type: string) {
      this._content_type = _content_type;
      return this;
    }
    setContentCategory(_content_category: string) {
      this._content_category = _content_category;
      return this;
    }
    setSearchString(_search_string: string) {
      this._search_string = _search_string;
      return this;
    }
    normalize(): Record<string, any> {
      return {
        contents: this._contents?.map((c) => c.normalize()) ?? [],
        currency: this._currency,
        order_id: this._order_id,
        status: this._status,
        num_items: this._num_items,
        value: this._value,
        content_name: this._content_name,
        content_category: this._content_category,
        search_string: this._search_string,
      };
    }
  }
  class UserData {
    _external_ids: string[] = [];
    _emails: string[] = [];
    _first_names: string[] = [];
    _last_names: string[] = [];
    _countries: string[] = [];
    _cities: string[] = [];
    _zips: string[] = [];
    _phones: string[] = [];
    _client_ip_address;
    _client_user_agent;
    _fbp;
    setExternalId(a: string) {
      this._external_ids = [a];
      return this;
    }
    setEmail(a: string) {
      this._emails = [a];
      return this;
    }
    setFirstName(a: string) {
      this._first_names = [a];
      return this;
    }
    setLastName(a: string) {
      this._last_names = [a];
      return this;
    }
    setCountry(a: string) {
      this._countries = [a];
      return this;
    }
    setCity(a: string) {
      this._cities = [a];
      return this;
    }
    setZip(a: string) {
      this._zips = [a];
      return this;
    }
    setPhone(a: string) {
      this._phones = [a];
      return this;
    }
    setClientIpAddress(a: string) {
      this._client_ip_address = a;
      return this;
    }
    setClientUserAgent(a: string) {
      this._client_user_agent = a;
      return this;
    }
    setFbp(a: string) {
      this._fbp = a;
      return this;
    }
    async normalize(): Promise<
      TFbNormalizedEventPayload['user_data'] | Record<string, any>
    > {
      const noHash = isBrowserMode;
      return {
        em: await Promise.all(
          this._emails
            .filter(Boolean)
            .map((v) =>
              noHash
                ? v.toLowerCase().trim()
                : trackUtils.digestMessage(v.toLowerCase().trim())
            )
        ),
        ph: await Promise.all(
          this._phones
            .filter(Boolean)
            .map((v) =>
              noHash
                ? v.toLowerCase().trim()
                : trackUtils.digestMessage(v.toLowerCase().trim())
            )
        ),
        fn: await Promise.all(
          this._first_names
            .filter(Boolean)
            .map((v) =>
              noHash
                ? v.toLowerCase().trim()
                : trackUtils.digestMessage(v.toLowerCase().trim())
            )
        ),
        ln: await Promise.all(
          this._last_names
            .filter(Boolean)
            .map((v) =>
              noHash
                ? v.toLowerCase().trim()
                : trackUtils.digestMessage(v.toLowerCase().trim())
            )
        ),
        ct: await Promise.all(
          this._cities
            .filter(Boolean)
            .map((v) =>
              noHash
                ? v.toLowerCase().trim()
                : trackUtils.digestMessage(v.toLowerCase().trim())
            )
        ),
        zp: await Promise.all(
          this._zips
            .filter(Boolean)
            .map((v) =>
              noHash
                ? v.toLowerCase().trim()
                : trackUtils.digestMessage(v.toLowerCase().trim())
            )
        ),
        country: await Promise.all(
          this._countries
            .filter(Boolean)
            .map((v) =>
              noHash
                ? v.toLowerCase().trim()
                : trackUtils.digestMessage(v.toLowerCase().trim())
            )
        ),
        external_id: await Promise.all(
          this._external_ids
            .filter(Boolean)
            .map((v) => trackUtils.digestMessage(v.toLowerCase().trim()))
        ),
        client_ip_address: this._client_ip_address,
        client_user_agent: this._client_user_agent,
      };
    }
  }
  class ServerEvent {
    _event_id;
    _event_name;
    _event_time;
    _custom_data: CustomData = new CustomData();
    _event_source_url;
    _action_source;
    _user_data: UserData = new UserData();
    get user_data(): UserData {
      return this._user_data;
    }
    setEventId(_event_id: string) {
      this._event_id = _event_id;
      return this;
    }
    setEventName(_event_name: string) {
      this._event_name = _event_name;
      return this;
    }
    setEventTime(_event_time: number) {
      this._event_time = _event_time;
      return this;
    }
    setCustomData(_custom_data: CustomData) {
      this._custom_data = _custom_data;
      return this;
    }
    setEventSourceUrl(_event_source_url: string) {
      this._event_source_url = _event_source_url;
      return this;
    }
    setActionSource(_action_source: string) {
      this._action_source = _action_source;
      return this;
    }
    setUserData(_user_data: UserData) {
      this._user_data = _user_data;
      return this;
    }
    async normalize(): Promise<
      TFbNormalizedEventPayload | Record<string, any>
    > {
      return {
        event_id: this._event_id,
        event_name: this._event_name,
        event_time: this._event_time,
        custom_data: this._custom_data?.normalize() ?? {},
        event_source_url: this._event_source_url,
        action_source: this._action_source,
        user_data: this._user_data ? await this._user_data.normalize() : {},
      };
    }
  }
  class EventRequest {
    _test_event_code: string = '';
    _events: ServerEvent[] = [];
    _pixel_id: string;
    _access_token: string;
    constructor(at: string, pxId: string) {
      this._access_token = at;
      this._pixel_id = pxId;
    }
    get events(): ServerEvent[] {
      return this._events;
    }
    get pixel(): string {
      return this._pixel_id;
    }
    setTestEventCode(_test_event_code: string) {
      this._test_event_code = _test_event_code;
      return this;
    }
    setEvents(_events: ServerEvent[]) {
      this._events = _events;
      return this;
    }
    static processBrowserEvent(
      pixelId: string,
      evtData: TFbNormalizedEventPayload | Record<string, any>
    ) {
      // try to identify (https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching)
      const u = Object.entries(evtData.user_data ?? {}).reduce((r, e) => {
        return {
          ...r,
          [e[0]]: Array.isArray(e[1]) ? e[1][0] ?? '' : e[1],
        };
      }, {} as Record<string, any>);
      // re-init
      sentUserData.size === 0
        ? globalThis.window.fbq?.('init', pixelId, {
            ...u,
          })
        : void 0;
      evtData.user_data ? sentUserData.add(evtData.user_data) : void 0;
      // track event
      globalThis.window.fbq?.(
        isStandardEvent(evtData.event_name) ? 'track' : 'trackCustom',
        evtData.event_name,
        getFbqObjectByNormalizedData(evtData),
        {
          eventID: evtData.event_id,
        }
      );
      return {
        [evtData.event_name]: `Sent to ${pixelId}`,
        IsStandardEvent: isStandardEvent(evtData.event_name),
        UserData: evtData.user_data,
        eventID: evtData.event_id,
        evt: evtData,
      };
    }
    async execute() {
      return isBrowserMode
        ? Promise.resolve({
            message: null,
            response: 'Browser Processed',
            processedItems: await Promise.all(
              this._events.map(async (evt) => {
                const evtData = await evt.normalize();
                return EventRequest.processBrowserEvent(
                  this._pixel_id,
                  evtData
                );
              })
            ),
          })
        : Promise.reject({
            message:
              'Wrong SDK used. Server side requires the official Facebook-NodeJs-SDK to be installed',
            response: null,
            payload: [],
          });
    }
  }

  return {
    Content,
    CustomData,
    UserData,
    ServerEvent,
    EventRequest,
  };
})();

export type TFbNormalizedEventPayload = {
  pixel: string;
  event_name: string;
  event_time: number;
  event_source_url?: string;
  // https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching
  user_data?: {
    em?: string[]; // Email em Unhashed lowercase or hashed SHA-256
    fn?: string[]; // First Name fn Lowercase letters
    ln?: string[]; // Last Name ln Lowercase letters smith
    ph?: string[]; // Phone ph Digits only including country code and area code
    external_id?: string[]; // External ID external_id Any unique ID from the advertiser, such as loyalty membership ID, user ID, and external cookie ID. a@example.com
    ge?: string[]; // Gender ge Single lowercase letter, f or m, if unknown, leave blank f
    db?: string[]; // Birthdate db Digits only with birth year, month, then day 19910526 for May 26, 1991.
    ct?: string[]; // City ct Lowercase with any spaces removed menlopark
    st?: string[]; // State or Province st Lowercase two-letter state or province code ca
    zp?: string[]; // Zip or Postal Code zp String 94025;
    country?: string[]; // Country country Lowercase two-letter country code us
    client_ip_address?: string;
    client_user_agent?: string;
  };
  custom_data?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
    contents?: {
      id?: string;
      quantity?: number;
      item_price?: number;
      title?: string;
      description?: string;
      brand?: string;
      category?: string;
      delivery_category?: string;
    }[];
    content_type?: string;
    order_id?: string;
    predicted_ltv?: number;
    num_items?: number;
    search_string?: string;
    status?: string;
    item_number?: string;
    delivery_category?: string;
    custom_properties?: Record<string, any>;
  };
  event_id: string;
  opt_out?: boolean;
  action_source?: string;
};

const StandardEvents = [
  'AddPaymentInfo',
  'AddToCart',
  'AddToWishlist',
  'CompleteRegistration',
  'Contact',
  'CustomizeProduct',
  'Donate',
  'FindLocation',
  'InitiateCheckout',
  'Lead',
  'Purchase',
  'Schedule',
  'Search',
  'StartTrial',
  'SubmitApplication',
  'Subscribe',
  'ViewContent',
  'PageView',
];

const isStandardEvent = (eName: string) => StandardEvents.includes(eName);

let uiLibInstallStatus: 'no' | 'yes' | 'installing' = 'no';
export const installFB = (pixelId?: string | null) => {
  return trackUtils.isBrowserMode && uiLibInstallStatus === 'no' && pixelId
    ? new Promise((instok) => {
        uiLibInstallStatus = 'installing';
        // @ts-ignore
        !(function (f, b, e, v, n, t, s) {
          if (f.fbq) return;
          // @ts-ignore
          n = f.fbq = function () {
            // @ts-ignore
            n.callMethod
              ? // @ts-ignore
                n.callMethod.apply(n, arguments)
              : // @ts-ignore
                n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n;
          // @ts-ignore
          n.push = n;
          // @ts-ignore
          n.loaded = !0;
          // @ts-ignore
          n.version = '2.0';
          // @ts-ignore
          n.queue = [];
          // @ts-ignore
          t = b.createElement(e);
          // @ts-ignore
          t.async = !0;
          // @ts-ignore
          t.src = v;
          // @ts-ignore
          s = b.getElementsByTagName(e)[0];
          // @ts-ignore
          s.parentNode.insertBefore(t, s);
        })(
          window,
          document,
          'script',
          'https://connect.facebook.net/en_US/fbevents.js'
        );
        uiLibInstallStatus = 'yes';
        instok(globalThis.window.fbq);
      })
    : null;
};

export const getFbqObjectByNormalizedData = (
  p: TFbNormalizedEventPayload | Record<string, any>
) => {
  return {
    // Advanced User Data Matching
    user_data: p.user_data ?? {},
    // https://developers.facebook.com/docs/meta-pixel/reference
    // Contact, Donate, FindLocation, Schedule, StartTrial, SubmitApplication, CompleteRegistration, AddToWishlist, AddPaymentInfo
    // TBD Later
    /// ------------------
    // PageView: [
    // Optional.
    ...(p.event_name === 'PageView' ? {} : {}),
    // AddPaymentInfo: [content_category, content_ids, contents, currency, value
    // Optional.
    // When payment information is added in the checkout flow. A person clicks on a save billing information button.
    ...(p.event_name === 'AddPaymentInfo'
      ? {
          value: p.custom_data?.value ?? 0,
          currency: p.custom_data?.currency ?? 'USD',
          content_type: p.custom_data?.content_type,
          content_name: p.custom_data?.content_name, // 'Auto Insurance',
          content_category: p.custom_data?.content_category, //'Product Search',
          contents: p.custom_data?.contents ?? [],
          num_items: p.custom_data?.num_items ?? 0,
        }
      : {}),
    // AddShippingInfo: [content_category, content_ids, contents, currency, value
    // Optional.
    // When shipping information is added in the checkout flow. A person clicks on a save shipping information button.
    ...(p.event_name === 'AddShippingInfo'
      ? {
          value: p.custom_data?.value ?? 0,
          currency: p.custom_data?.currency ?? 'USD',
          content_type: p.custom_data?.content_type,
          content_name: p.custom_data?.content_name, // 'Auto Insurance',
          content_category: p.custom_data?.content_category, //'Product Search',
          contents: p.custom_data?.contents ?? [],
          num_items: p.custom_data?.num_items ?? 0,
        }
      : {}),
    // InitiateCheckout: [content_category, content_ids, contents, currency, num_items, value
    // Optional.
    ...(p.event_name === 'InitiateCheckout'
      ? {
          value: p.custom_data?.value ?? 0,
          currency: p.custom_data?.currency ?? 'USD',
          content_type: p.custom_data?.content_type,
          content_name: p.custom_data?.content_name, // 'Auto Insurance',
          content_category: p.custom_data?.content_category, //'Product Search',
          contents: p.custom_data?.contents ?? [],
          num_items: p.custom_data?.num_items ?? 0,
        }
      : {}),
    // AddToCart: [content_ids, content_name, content_type, contents, currency, value
    // Optional.
    // Required for Advantage+ catalog ads: content_type and contents]
    ...(p.event_name === 'AddToCart'
      ? {
          value: p.custom_data?.value ?? 0,
          currency: p.custom_data?.currency ?? 'USD',
          content_type: p.custom_data?.content_type,
          content_name: p.custom_data?.content_name, // 'Auto Insurance',
          content_category: p.custom_data?.content_category, //'Product Search',
          contents: p.custom_data?.contents ?? [],
          num_items: p.custom_data?.num_items ?? 0,
          user_data: p.user_data ?? {},
        }
      : {}),
    // RemoveFromCart: [content_ids, content_name, content_type, contents, currency, value
    // Optional.
    // Required for Advantage+ catalog ads: content_type and contents]
    ...(p.event_name === 'RemoveFromCart'
      ? {
          value: p.custom_data?.value ?? 0,
          currency: p.custom_data?.currency ?? 'USD',
          content_type: p.custom_data?.content_type,
          content_name: p.custom_data?.content_name, // 'Auto Insurance',
          content_category: p.custom_data?.content_category, //'Product Search',
          contents: p.custom_data?.contents ?? [],
          num_items: p.custom_data?.num_items ?? 0,
        }
      : {}),

    // Lead: [content_category, content_name, currency, value]
    // When a sign up is completed. A person clicks on pricing.
    ...(p.event_name === 'Lead'
      ? {
          value: p.custom_data?.value ?? 0,
          currency: p.custom_data?.currency ?? 'USD',
          content_name: p.custom_data?.content_name, // 'Auto Insurance',
          content_category: p.custom_data?.content_category, // 'Quote',
        }
      : {}),
    // ViewContent: [content_ids, content_category, content_name, content_type, contents, currency, value
    // Optional.
    // Required for Advantage+ catalog ads: content_type and contents, or content_ids]
    ...(p.event_name === 'ViewContent'
      ? {
          value: p.custom_data?.value ?? 0,
          currency: p.custom_data?.currency ?? 'USD',
          content_type: p.custom_data?.content_type,
          content_name: p.custom_data?.content_name, // 'ABC Leather Sandal',
          contents: p.custom_data?.contents ?? [],
          content_category: p.custom_data?.content_category, //'Shoes',
          num_items: p.custom_data?.num_items ?? 0,
        }
      : {}),
    // Search: [content_category, content_ids, contents, currency, search_string, value
    // Optional.
    // Required for Advantage+ catalog ads: content_type and contents, or content_ids]
    ...(p.event_name === 'Search'
      ? {
          value: p.custom_data?.value ?? 0,
          currency: p.custom_data?.currency ?? 'USD',
          search_string: p.custom_data?.search_string ?? '',
          content_category: p.custom_data?.content_category, //'Product Search',
          contents: p.custom_data?.contents ?? [],
          num_items: p.custom_data?.num_items ?? 0,
        }
      : {}),
    // Purchase: [content_ids, content_name, content_type, contents, currency, num_items, value
    // Required: currency and value
    // Required for Advantage+ catalog ads: content_type and contents, or content_ids]
    ...(p.event_name === 'Purchase'
      ? {
          value: p.custom_data?.value ?? 0,
          currency: p.custom_data?.currency ?? 'USD',
          content_name: p.custom_data?.content_name,
          content_type: p.custom_data?.content_type,
          contents: p.custom_data?.contents ?? [],
          num_items: p.custom_data?.num_items ?? 0,
          delivery_category: p.custom_data?.delivery_category ?? '',
          order_id: p.custom_data?.order_id,
        }
      : {}),
    //
  };
};

// This component is being used along with FB Server Events.
// Once you trigger any event at your server side, you may return response
// to your frontent side and hand it to this component.
// If so, it re-publish the same events but from the frontent side.
// Here the eventID is being used to dedup any of them.
export const EA_FB_Server_RePublish_Events: React.FC<{
  errorMessage?: string;
  serverPayloads?: TFbNormalizedEventPayload[];
}> = (props) => {
  const { errorMessage, serverPayloads } = props;

  useEffect(() => {
    serverPayloads?.map((evtData) => {
      EventRequest.processBrowserEvent(evtData.pixel, evtData);
    });
  }, []);

  const getEvents = (events: TFbNormalizedEventPayload[]) =>
    events.map((p) => (
      <span
        key={p.event_id}
        id={`_ea_fb_event_${p.event_id.toLowerCase()}`}
        data-fb-event={JSON.stringify(p)}
      ></span>
    ));

  return serverPayloads && !errorMessage ? (
    <>{getEvents(serverPayloads)}</>
  ) : null;
};

export const fbTracker = (options: TSettings) => {
  const { integrations: analytics, currency } = options;
  const access_token = analytics?.fb?.token ?? '';
  const pixel_id = analytics?.fb?.pixelId;
  const testCode = analytics?.fb?.testCode ?? '';
  const bizSdk = analytics?.fb?.sdk;

  if (!pixel_id) {
    throw '[EA] Facebook is configured without pixel_id; Please provide pixel_id;';
  }

  if (!isBrowserMode) {
    if (!access_token) {
      throw '[EA] Facebook is configured without access_token; Please provide access_token;';
    }
    if (!bizSdk) {
      throw '[EA] Facebook is configured without SDK; Please provide SDK; npm i facebook-nodejs-business-sdk@13 -S';
    }

    // override browser sdk to nodejs
    Content = bizSdk.Content;
    CustomData = bizSdk.CustomData;
    UserData = bizSdk.UserData;
    ServerEvent = bizSdk.ServerEvent;
    EventRequest = bizSdk.EventRequest;
  }

  const publish = async (req = new EventRequest('', '')) => {
    try {
      var response = isBrowserMode
        ? await req.execute()
        : !!req.events[0].user_data
        ? await req.execute()
        : await Promise.reject('UserData is not set');
      log('[EA:Facebook] eventRequest=>Response: ', response);
      return {
        message: null,
        payload: await Promise.all(
          req.events.map(
            async (se) =>
              ({
                ...((await se.normalize()) ?? {}),
                pixel: req.pixel,
              } as TFbNormalizedEventPayload)
          )
        ),
        response,
      };
    } catch (err: any) {
      console.error('[EA:Facebook] eventRequest=>Error: ', err);
      return {
        message: 'Cannot process your request',
        response: err?.data ?? null,
        payload: [],
      };
    }
  };

  const trackIdentify = (profile?: T_EA_DataProfile | null) => {
    const user = resolveUser(profile);
    return user;
  };

  const _getUserDataObject = (order?: T_EA_DataOrder) => {
    const user = trackIdentify();
    const u = order ? order.customer : user;
    const session = options.resolvers?.session?.();
    const userData =
      u && session
        ? new UserData()
            .setExternalId(u.email)
            .setEmail(u.email)
            .setFirstName(u.firstName)
            .setLastName(u.lastName ?? '')
            .setCountry(u.address?.country ?? '')
            .setCity(u.address?.city ?? '')
            .setZip(u.address?.postcode ?? '')
            .setPhone(u.phone ?? '')
            // It is recommended to send Client IP and User Agent for Conversions API Events.
            .setClientIpAddress(session.ip ?? '')
            .setClientUserAgent(session.agent ?? '')
            .setFbp(session.fbp ?? '')
        : null;
    return userData;
  };

  const trackTransactionRefund = async (order: T_EA_DataOrder) => {
    // const contents = order.products.map((storedProduct) =>
    //   new Content()
    //     .setId(storedProduct.id.toString())
    //     .setQuantity(round(storedProduct.quantity))
    //     .setTitle(storedProduct.title)
    //     .setBrand(storedProduct.brand)
    //     .setDescription(storedProduct.description)
    //     .setCategory(storedProduct.category)
    //     .setItemPrice(storedProduct.price)
    //     .setDeliveryCategory(DeliveryCategory.HOME_DELIVERY)
    // );
  };

  const trackTransactionCancel = async (order: T_EA_DataOrder) => {};

  const trackTransactionFulfill = async (order: T_EA_DataOrder) => {};

  /**
   *
   * Purchase

    When a purchase is made or checkout flow is completed.

    A person has finished the purchase or checkout flow and lands on thank you or confirmation page.	
    content_ids, content_name, content_type, contents, currency, num_items, value

    Required: currency and value

    Required for Advantage+ catalog ads: content_type and contents, or content_ids

    PURCHASE
   */
  const trackTransaction = async (
    order: T_EA_DataOrder
  ): Promise<TServerEventResponse> => {
    const evtName = trackUtils.getEventNameOfTransaction(order);
    log('[EA:Facebook] trackTransaction', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const userData = _getUserDataObject(order);
    const page = options.resolvers?.page?.();

    const contents = order.products.map((storedProduct) =>
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

    const customData = new CustomData()
      .setContentName(page?.name ?? 'Order Complete')
      .setContents(contents)
      .setCurrency(currency)
      .setOrderId(order.id.toString())
      .setStatus(order.status)
      .setNumItems(round(order.quantity))
      .setValue(round(order.revenue));

    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('Purchase')
      .setEventTime(current_timestamp)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    userData ? serverEvent.setUserData(userData) : void 0;

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    return publish(eventRequest);
  };

  /**
   *
   * AddToCart

      When a product is added to the shopping cart.

      A person clicks on an add to cart button.	
      content_ids, content_name, content_type, contents, currency, value

      Optional.
      Required for Advantage+ catalog ads: content_type and contents

      ADD_TO_CART
   */
  const trackProductAddToCart = async (
    basket: T_EA_DataBasket
  ): Promise<TServerEventResponse> => {
    const userData = _getUserDataObject();

    const eventsData = basket.lastAdded.map((product) => {
      const evtName = trackUtils.getEventNameOfProductAddToCart(product);
      log('[EA:Facebook] trackProductAddToCart', evtName);
      const current_timestamp = Math.floor(Date.now() / 1000);

      const contents = basket.lastAdded.map((product) =>
        new Content()
          .setId(product.id.toString())
          .setQuantity(round(product.quantity))
          .setTitle(product.title)
          .setBrand(product.brand)
          .setDescription(product.description)
          .setCategory(product.category)
          .setItemPrice(product.price)
      );

      const customData = new CustomData()
        .setValue(round(product.price))
        .setContents(contents)
        .setContentName(product.title)
        .setContentType('product')
        .setContentCategory(product.category)
        .setCurrency(currency)
        .setNumItems(round(product.quantity));

      const page = options.resolvers?.page?.();
      const serverEvent = new ServerEvent()
        .setEventId(evtName)
        .setEventName('AddToCart')
        .setEventTime(current_timestamp)
        .setCustomData(customData)
        .setEventSourceUrl(page?.url ?? '')
        .setActionSource('website');

      userData ? serverEvent.setUserData(userData) : void 0;

      return serverEvent;
    });

    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    return publish(eventRequest);
  };

  /**
   *
   * RemoveFromCart

      When a product is removed from the shopping cart.

      A person clicks on an remove from cart button.	
      content_ids, content_name, content_type, contents, currency, value

      Optional.
      Required for Advantage+ catalog ads: content_type and contents

      REMOVE_FROM_CART
   */
  const trackProductRemoveFromCart = async (
    basket: T_EA_DataBasket
  ): Promise<TServerEventResponse> => {
    const userData = _getUserDataObject();

    const eventsData = basket.lastRemoved.map((product) => {
      const evtName = trackUtils.getEventNameOfProductRemoveFromCart(product);
      log('[EA:Facebook] trackProductRemoveFromCart', evtName);
      const current_timestamp = Math.floor(Date.now() / 1000);

      const contents = basket.lastRemoved.map((product) =>
        new Content()
          .setId(product.id.toString())
          .setQuantity(round(product.quantity))
          .setTitle(product.title)
          .setBrand(product.brand)
          .setDescription(product.description)
          .setCategory(product.category)
          .setItemPrice(round(product.price))
      );

      const customData = new CustomData()
        .setValue(round(product.price))
        .setContents(contents)
        .setContentName(product.title)
        .setContentType('product')
        .setContentCategory(product.category)
        .setCurrency(currency)
        .setNumItems(round(product.quantity));

      const page = options.resolvers?.page?.();
      const serverEvent = new ServerEvent()
        .setEventId(evtName)
        .setEventName('RemoveFromCart')
        .setEventTime(current_timestamp)
        .setCustomData(customData)
        .setEventSourceUrl(page?.url ?? '')
        .setActionSource('website');

      userData ? serverEvent.setUserData(userData) : void 0;

      return serverEvent;
    });

    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    return publish(eventRequest);
  };

  /**
   *
   * ViewContent

      A visit to a web page you care about (for example, a product page or landing page). ViewContent tells you if someone visits a web page's URL, but not what they see or do on that page.

      A person lands on a product details page.	
      content_ids, content_category, content_name, content_type, contents, currency, value

      Optional.
      Required for Advantage+ catalog ads: content_type and contents, or content_ids

      VIEW_CONTENT
   */
  const trackProductItemView = async (
    product: T_EA_DataProduct
  ): Promise<TServerEventResponse> => {
    const evtName = trackUtils.getEventNameOfProductItemView(product);
    log('[EA:Facebook] trackProductItemView', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const userData = _getUserDataObject();
    const page = options.resolvers?.page?.();

    const contents = new Content()
      .setId(product.id.toString())
      .setTitle(product.title)
      .setBrand(product.brand)
      .setDescription(product.description)
      .setCategory(product.category)
      .setItemPrice(product.price);

    const customData = new CustomData()
      .setValue(round(product.price))
      .setContents([contents])
      .setContentName(product.title)
      .setContentCategory(product.category)
      .setContentType('product')
      .setCurrency(currency)
      .setNumItems(1);

    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('ViewContent')
      .setEventTime(current_timestamp)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    userData ? serverEvent.setUserData(userData) : void 0;

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    return publish(eventRequest);
  };

  /**
   *
   * ViewContent

      A visit to a web page you care about (for example, a product page or landing page). ViewContent tells you if someone visits a web page's URL, but not what they see or do on that page.

      A person lands on a product details page.	
      content_ids, content_category, content_name, content_type, contents, currency, value

      Optional.
      Required for Advantage+ catalog ads: content_type and contents, or content_ids

      VIEW_CONTENT
   */
  const trackProductsItemView = async (
    products: T_EA_DataProduct[]
  ): Promise<TServerEventResponse> => {
    const evtName = trackUtils.getEventNameOfProductItemView(products[0]);
    log('[EA:Facebook] trackProductsItemView', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const userData = _getUserDataObject();

    const eventsData = products.map((product) => {
      const contents = [product].map((storedProduct) =>
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

      const customData = new CustomData()
        .setValue(round(product.price))
        .setContents(contents)
        .setContentName(product.title)
        .setCurrency(currency)
        .setContentType('product')
        .setContentCategory(product.category)
        .setNumItems(products.length);

      const page = options.resolvers?.page?.();
      const serverEvent = new ServerEvent()
        .setEventId(evtName)
        .setEventName('ViewContent')
        .setEventTime(current_timestamp)
        .setCustomData(customData)
        .setEventSourceUrl(page?.url ?? '')
        .setActionSource('website');

      userData ? serverEvent.setUserData(userData) : void 0;

      return serverEvent;
    });

    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    return publish(eventRequest);
  };

  /**
   * 
   * ViewContent

      A visit to a web page you care about (for example, a product page or landing page). ViewContent tells you if someone visits a web page's URL, but not what they see or do on that page.

      A person lands on a product details page.	
      content_ids, content_category, content_name, content_type, contents, currency, value

      Optional.
      Required for Advantage+ catalog ads: content_type and contents, or content_ids

      VIEW_CONTENT
   */
  const trackPageView = async (
    page: T_EA_DataPage
  ): Promise<TServerEventResponse> => {
    const evtName = trackUtils.getEventNameOfPageView();
    log('[EA:Facebook] trackPageView', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const userData = _getUserDataObject();

    const customData = new CustomData()
      .setContentType('page')
      .setContentName(page?.name ?? 'Page');

    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('PageView')
      .setEventTime(current_timestamp)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    userData ? serverEvent.setUserData(userData) : void 0;

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    return publish(eventRequest);
  };

  const trackCustom = async (e: T_EA_DataCustomEvent) => {
    const evtName = trackUtils.getEventNameOfCustom(e.name ?? '');
    log('[EA:Facebook] trackCustom', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const userData = _getUserDataObject();
    const page = options.resolvers?.page?.();

    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName(e.name)
      .setEventTime(current_timestamp)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    userData ? serverEvent.setUserData(userData) : void 0;

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    return publish(eventRequest);
  };

  /**
   * InitiateCheckout

    When a person enters the checkout flow prior to completing the checkout flow.

    A person clicks on a checkout button.	
    content_category, content_ids, contents, currency, num_items, value

    Optional.	
    INITIATE_CHECKOUT
   */
  const trackInitiateCheckout = async (
    basket: T_EA_DataBasket
  ): Promise<TServerEventResponse> => {
    const evtName = trackUtils.getEventNameOfInitiateCheckout(basket);
    log('[EA:Facebook] trackInitiateCheckout', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const userData = _getUserDataObject();
    const page = options.resolvers?.page?.();

    const contents = basket.products.map((storedProduct) =>
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

    const customData = new CustomData()
      .setValue(round(basket.total))
      .setContentCategory(basket.products?.[0]?.category ?? '')
      .setContents(contents)
      .setCurrency(currency)
      .setNumItems(round(basket.quantity));

    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('InitiateCheckout')
      .setEventTime(current_timestamp)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    userData ? serverEvent.setUserData(userData) : void 0;

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    return publish(eventRequest);
  };

  /**
   * 
      When a search is made.

      A person searches for a product on your website.	
      content_category, content_ids, contents, currency, search_string, value

      Optional.
      Required for Advantage+ catalog ads: content_type and contents, or content_ids

      SEARCH
   */
  const trackSearch = async (
    searchTerm: string,
    matchingProducts: T_EA_DataProduct[]
  ): Promise<TServerEventResponse> => {
    const evtName = trackUtils.getEventNameOfSearch(
      searchTerm,
      matchingProducts
    );
    log('[EA:Facebook] trackSearch', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const userData = _getUserDataObject();
    const page = options.resolvers?.page?.();

    const contents = matchingProducts.map((storedProduct) =>
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

    const customData = new CustomData()
      .setSearchString(searchTerm)
      .setContents(contents)
      .setContentType('product')
      .setContentName(page?.name ?? 'Search Results')
      .setContentCategory(matchingProducts?.[0]?.category ?? '')
      .setNumItems(round(matchingProducts?.length));

    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('Search')
      .setEventTime(current_timestamp)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    userData ? serverEvent.setUserData(userData) : void 0;

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    return publish(eventRequest);
  };

  const trackNewProfile = async (profile: T_EA_DataProfile | null) => {
    const user = trackIdentify(profile);
    const evtName = trackUtils.getEventNameOfLead(user?.email ?? '');
    log('[EA:Facebook] trackNewProfile', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const userData = _getUserDataObject();
    const page = options.resolvers?.page?.();

    const customData = new CustomData().setContentName(page?.name ?? 'Website');

    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('Lead')
      .setEventTime(current_timestamp)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    userData ? serverEvent.setUserData(userData) : void 0;

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    return publish(eventRequest);
  };

  const trackProfileResetPassword = async (
    profile: T_EA_DataProfile | null
  ) => {};

  const trackProfileLogIn = async (profile: T_EA_DataProfile | null) => {};

  const trackProfileLogOut = async (profile: T_EA_DataProfile | null) => {};

  const trackProfileSubscribeNL = async (profile: T_EA_DataProfile | null) => {
    const user = trackIdentify(profile);
    const evtName = trackUtils.getEventNameOfSubscription(user?.email ?? '');
    log('[EA:Facebook] trackProfileSubscribeNL', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const userData = _getUserDataObject();
    const page = options.resolvers?.page?.();

    const customData = new CustomData()
      .setContentType('subscription')
      .setContentName(page?.name ?? 'Newsletter');

    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('Subscribe')
      .setEventTime(current_timestamp)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    userData ? serverEvent.setUserData(userData) : void 0;

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    return publish(eventRequest);
  };

  const trackAddToWishlist = async (products: T_EA_DataProduct[]) => {
    return trackIdentify();
  };

  /**
   *
   * AddPaymentInfo
   * When payment information is added in the checkout flow.
   * A person clicks on a save billing information button.
   * content_category, content_ids, contents, currency, value Optional.
   * ADD_PAYMENT_INFO
   */
  const trackAddPaymentInfo = async (order: T_EA_DataOrder) => {
    const evtName = trackUtils.getEventNameOfPaymentInfo(order.payment.type);
    log('[EA:Facebook] trackAddPaymentInfo', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const userData = _getUserDataObject();
    const page = options.resolvers?.page?.();

    const contents = order.products.map((storedProduct) =>
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

    const customData = new CustomData()
      .setValue(round(order.revenue))
      .setContentCategory(order.products?.[0]?.category ?? '')
      .setContents(contents)
      .setCurrency(currency)
      .setNumItems(round(order.quantity));

    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('AddPaymentInfo')
      .setEventTime(current_timestamp)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    userData ? serverEvent.setUserData(userData) : void 0;

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    return publish(eventRequest);
  };

  /**
   *
   * Custom Event: AddShippingInfo
   * Params are the same as for AddPaymentInfo
   */
  const trackAddShippingInfo = async (order: T_EA_DataOrder) => {
    const evtName = trackUtils.getEventNameOfShippingInfo(order.shipping.name);
    log('[EA:Facebook] trackAddShippingInfo', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const userData = _getUserDataObject();
    const page = options.resolvers?.page?.();

    const contents = order.products.map((storedProduct) =>
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

    const customData = new CustomData()
      .setValue(round(order.revenue))
      .setContentCategory(order.products?.[0]?.category ?? '')
      .setContents(contents)
      .setCurrency(currency)
      .setNumItems(round(order.quantity));

    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('AddShippingInfo')
      .setEventTime(current_timestamp)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    userData ? serverEvent.setUserData(userData) : void 0;

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    return publish(eventRequest);
  };

  const trackViewBasket = async (basket: T_EA_DataBasket) => {
    return trackIdentify();
  };

  return {
    trackIdentify,
    trackTransaction,
    trackProductAddToCart,
    trackProductRemoveFromCart,
    trackProductsItemView,
    trackProductItemView,
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

export default fbTracker;

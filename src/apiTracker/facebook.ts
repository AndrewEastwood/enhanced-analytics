import {
  T_EA_DataBasket,
  T_EA_DataCustomEvent,
  T_EA_DataOrder,
  T_EA_DataPage,
  T_EA_DataProduct,
  T_EA_DataProfile,
  TSettings,
} from '../shared';
import * as trackUtils from '../utils';
import { round } from '../utils';

export const fbTracker = (options: TSettings) => {
  const { integrations: analytics, currency } = options;
  const access_token = analytics?.fb?.token;
  const pixel_id = analytics?.fb?.pixelId;
  const testCode = (analytics?.testing ? analytics.fb?.testCode : '') ?? '';
  const bizSdk = analytics?.fb?.sdk;

  if (!bizSdk) {
    throw 'Facebook is configured without SDK; Please provide SDK;';
  }

  if (!pixel_id) {
    throw 'Facebook is configured without pixel_id; Please provide pixel_id;';
  }

  if (!access_token) {
    throw 'Facebook is configured without access_token; Please provide access_token;';
  }

  // const Content = bizSdk.Content;
  const CustomData = bizSdk.CustomData;
  // const DeliveryCategory = bizSdk.DeliveryCategory;
  const EventRequest = bizSdk.EventRequest;
  const UserData = bizSdk.UserData;
  const ServerEvent = bizSdk.ServerEvent;

  const trackIdentify = (profile?: T_EA_DataProfile | null) => {
    const user = profile ? profile : options.resolvers?.profile?.() || null;
    return user;
  };

  const _getUserDataObject = (order?: T_EA_DataOrder) => {
    const user = trackIdentify();
    // const userData = (new UserData())
    //   .setExternalId(user)
    //   .setEmail(request.user ? request.user.email : request.cookies['preflightUserEmail'] || '')
    //   .setFirstName(request.user ? request.user.firstName : '')
    //   .setLastName(request.user ? request.user.surname : '')
    //   .setCountry(request.user && request.user.address ? request.user.address.country.toLowerCase() : '')
    //   .setCity(request.user && request.user.address ? request.user.address.town : '')
    //   .setZip(request.user && request.user.address ? request.user.address.postcode : '')
    //   .setPhone(request.user && request.user.address ? request.user.address.phone : '')
    //   // It is recommended to send Client IP and User Agent for Conversions API Events.
    //   .setClientIpAddress(request.ip)
    //   .setClientUserAgent(request.headers['user-agent'])
    //   .setFbp(request.cookies['_fbp']);
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
            .setClientUserAgent(session.agent ?? '') // request.headers['user-agent'])
            .setFbp(session.fbp ?? '')
        : null; // request.cookies['_fbp']);
    return userData;
  };

  const trackTransactionRefund = async (order: T_EA_DataOrder) => {};

  const trackTransactionCancel = async (order: T_EA_DataOrder) => {};

  const trackTransactionFulfill = async (order: T_EA_DataOrder) => {};

  const trackTransaction = async (order: T_EA_DataOrder) => {
    const evtName = trackUtils.getEventNameOfTransaction(order);
    console.error('[EA:Facebook] trackTransaction', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const userData = _getUserDataObject(order);

    if (!userData) {
      return Promise.reject({ message: 'UserData is null' });
    }
    // const userData = (new UserData())
    //                 .setExternalId(order.customer.email)
    //                 .setEmail(order.customer.email)
    //                 .setFirstName(order.customer.firstName)
    //                 .setLastName(order.customer.lastName)
    //                 .setCountry(order.shipping.address.country)
    //                 .setCity(order.shipping.address.city)
    //                 .setZip(order.shipping.address.postcode)
    //                 .setPhone(order.customer.phone)
    //                 // It is recommended to send Client IP and User Agent for Conversions API Events.
    //                 .setClientIpAddress(request.ip)
    //                 .setClientUserAgent(request.headers['user-agent'])
    //                 .setFbp(request.cookies['_fbp']);

    const contents = trackUtils.Order(options, order).Purchase.getContents();

    const customData = new CustomData()
      .setContents(contents)
      .setCurrency(currency)
      .setOrderId(order.id.toString())
      .setStatus(order.status)
      .setNumItems(order.quantity)
      .setValue(order.revenue);

    const page = options.resolvers?.page?.();
    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('Purchase')
      .setEventTime(current_timestamp)
      .setUserData(userData)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    try {
      var response = await eventRequest.execute();
      console.log('[EA:Facebook] eventRequest=>Response: ', response);
      return {
        payload: eventsData.map((se) => se.normalize()),
        response,
      };
    } catch (err) {
      console.error('[EA:Facebook] eventRequest=>Error: ', err);
      return err;
    }
  };

  const trackProductAddToCart = async (basket: T_EA_DataBasket) => {
    const userData = _getUserDataObject();

    if (!userData) {
      return Promise.reject({ message: 'UserData is null' });
    }

    const eventsData = basket.lastAdded.map((product) => {
      const evtName = trackUtils.getEventNameOfProductAddToCart(product);
      console.error('[EA:Facebook] trackProductAddToCart', evtName);
      const current_timestamp = Math.floor(Date.now() / 1000);

      const contents = trackUtils
        .Basket(options, basket)
        .BasketAddProduct.getContents();

      const customData = new CustomData()
        .setValue(round(product.quantity))
        .setContents(contents)
        .setContentName(product.title)
        .setCurrency(currency);

      const page = options.resolvers?.page?.();
      const serverEvent = new ServerEvent()
        .setEventId(evtName)
        .setEventName('AddToCart')
        .setEventTime(current_timestamp)
        .setUserData(userData)
        .setCustomData(customData)
        .setEventSourceUrl(page?.url ?? '')
        .setActionSource('website');

      return serverEvent;
    });

    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    try {
      var response = await eventRequest.execute();
      console.debug('[EA:Facebook] eventRequest=>Response: ', response);
      return {
        payload: eventsData.map((se) => se.normalize()),
        response,
      };
    } catch (err) {
      console.error('[EA:Facebook] eventRequest=>Error: ', err);
      return err;
    }
  };

  const trackProductRemoveFromCart = async (basket: T_EA_DataBasket) => {
    const userData = _getUserDataObject();

    if (!userData) {
      return Promise.reject({ message: 'UserData is null' });
    }

    const eventsData = basket.lastRemoved.map((product) => {
      const evtName = trackUtils.getEventNameOfProductRemoveFromCart(product);
      console.error('[EA:Facebook] trackProductRemoveFromCart', evtName);
      const current_timestamp = Math.floor(Date.now() / 1000);

      const contents = trackUtils
        .Basket(options, basket)
        .BasketRemoveProduct.getContents();

      const customData = new CustomData()
        .setValue(round(product.quantity))
        .setContents(contents)
        .setContentName(product.title)
        .setCurrency(currency);

      const page = options.resolvers?.page?.();
      const serverEvent = new ServerEvent()
        .setEventId(evtName)
        .setEventName('RemoveFromCart')
        .setEventTime(current_timestamp)
        .setUserData(userData)
        .setCustomData(customData)
        .setEventSourceUrl(page?.url ?? '')
        .setActionSource('website');
      return serverEvent;
    });

    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    try {
      var response = await eventRequest.execute();
      console.debug('[EA:Facebook] eventRequest=>Response: ', response);
      return {
        payload: eventsData.map((se) => se.normalize()),
        response,
      };
    } catch (err) {
      console.error('[EA:Facebook] eventRequest=>Error: ', err);
      return err;
    }
  };

  const trackProductItemView = async (product: T_EA_DataProduct) => {
    const evtName = trackUtils.getEventNameOfProductItemView(product);
    console.error('[EA:Facebook] trackProductItemView', evtName);
    // const user = trackIdentify();
    const current_timestamp = Math.floor(Date.now() / 1000);
    // const userData = (new UserData())
    //                 .setExternalId(request.user ? request.user.email : request.cookies['preflightUserEmail'] || '')
    //                 .setEmail(request.user ? request.user.email : request.cookies['preflightUserEmail'] || '')
    //                 .setFirstName(request.user ? request.user.firstName : '')
    //                 .setLastName(request.user ? request.user.surname : '')
    //                 .setCountry(request.user && request.user.address ? request.user.address.country.toLowerCase() : '')
    //                 .setCity(request.user && request.user.address ? request.user.address.town : '')
    //                 .setZip(request.user && request.user.address ? request.user.address.postcode : '')
    //                 .setPhone(request.user && request.user.address ? request.user.address.phone : '')
    //                 // It is recommended to send Client IP and User Agent for Conversions API Events.
    //                 .setClientIpAddress(request.ip)
    //                 .setClientUserAgent(request.headers['user-agent'])
    //                 .setFbp(request.cookies['_fbp'])

    const userData = _getUserDataObject();

    if (!userData) {
      return Promise.reject({ message: 'UserData is null' });
    }

    const contents = trackUtils
      .Catalog(options, [product])
      .ProductDetails.getContents();

    const customData = new CustomData()
      .setValue(product.price)
      .setContents([contents])
      .setContentName(product.title)
      .setCurrency(currency);

    const page = options.resolvers?.page?.();
    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('ViewContent')
      .setEventTime(current_timestamp)
      .setUserData(userData)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    try {
      var response = await eventRequest.execute();
      console.debug('[EA:Facebook] eventRequest=>Response: ', response);
      return {
        payload: eventsData.map((se) => se.normalize()),
        response,
      };
    } catch (err) {
      console.error('[EA:Facebook] eventRequest=>Error: ', err);
      return err;
    }
  };

  const trackProductsItemView = async (products) => {};

  const trackPageView = async (page: T_EA_DataPage) => {
    const evtName = trackUtils.getEventNameOfPageView();
    console.error('[EA:Facebook] trackProductItemView', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    // const userData = (new UserData())
    //                 .setExternalId(request.user ? request.user.email : request.cookies['preflightUserEmail'] || '')
    //                 .setEmail(request.user ? request.user.email : request.cookies['preflightUserEmail'] || '')
    //                 .setFirstName(request.user ? request.user.firstName : '')
    //                 .setLastName(request.user ? request.user.surname : '')
    //                 .setCountry(request.user && request.user.address ? request.user.address.country.toLowerCase() : '')
    //                 .setCity(request.user && request.user.address ? request.user.address.town : '')
    //                 .setZip(request.user && request.user.address ? request.user.address.postcode : '')
    //                 .setPhone(request.user && request.user.address ? request.user.address.phone : '')
    //                 // It is recommended to send Client IP and User Agent for Conversions API Events.
    //                 .setClientIpAddress(request.ip)
    //                 .setClientUserAgent(request.headers['user-agent'])
    //                 .setFbp(request.cookies['_fbp'])

    const contents = trackUtils.Page(options).View.getContents();

    const userData = _getUserDataObject();

    if (!userData) {
      return Promise.reject({ message: 'UserData is null' });
    }

    const customData = new CustomData().setContents(contents);

    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('PageView')
      .setEventTime(current_timestamp)
      .setUserData(userData)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    try {
      var response = await eventRequest.execute();
      console.debug('[EA:Facebook] eventRequest=>Response: ', response);
      return {
        payload: eventsData.map((se) => se.normalize()),
        response,
      };
    } catch (err) {
      console.error('[EA:Facebook] eventRequest=>Error: ', err);
      return err;
    }
  };

  const trackCustom = async (e: T_EA_DataCustomEvent) => {};

  const trackInitiateCheckout = async (basket: T_EA_DataBasket) => {
    const evtName = trackUtils.getEventNameOfInitiateCheckout(basket);
    console.error('[EA:Facebook] trackProductItemView', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    // const userData = (new UserData())
    //                 .setExternalId(request.user ? request.user.email : request.cookies['preflightUserEmail'] || '')
    //                 .setEmail(request.user ? request.user.email : request.cookies['preflightUserEmail'] || '')
    //                 .setFirstName(request.user ? request.user.firstName : '')
    //                 .setLastName(request.user ? request.user.surname : '')
    //                 .setCountry(request.user && request.user.address ? request.user.address.country.toLowerCase() : '')
    //                 .setCity(request.user && request.user.address ? request.user.address.town : '')
    //                 .setZip(request.user && request.user.address ? request.user.address.postcode : '')
    //                 .setPhone(request.user && request.user.address ? request.user.address.phone : '')
    //                 // It is recommended to send Client IP and User Agent for Conversions API Events.
    //                 .setClientIpAddress(request.ip)
    //                 .setClientUserAgent(request.headers['user-agent'])
    //                 .setFbp(request.cookies['_fbp'])

    const userData = _getUserDataObject();

    if (!userData) {
      return Promise.reject({ message: 'UserData is null' });
    }

    const contents = trackUtils
      .Basket(options, basket)
      .InitCheckout.getContents();

    const customData = new CustomData()
      .setValue(round(basket.total))
      .setContents(contents)
      .setCurrency(currency)
      .setNumItems(basket.quantity);

    const page = options.resolvers?.page?.();
    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('InitiateCheckout')
      .setEventTime(current_timestamp)
      .setUserData(userData)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    try {
      var response = await eventRequest.execute();
      console.debug('[EA:Facebook] eventRequest=>Response: ', response);
      return {
        payload: eventsData.map((se) => se.normalize()),
        response,
      };
    } catch (err) {
      console.error('[EA:Facebook] eventRequest=>Error: ', err);
      return err;
    }
  };

  const trackSearch = async (searchTerm, matchingProducts) => {
    const evtName = trackUtils.getEventNameOfSearch(
      searchTerm,
      matchingProducts
    );
    console.error('[EA:Facebook] trackProductItemView', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    // const userData = (new UserData())
    //                 .setExternalId(request.user ? request.user.email : request.cookies['preflightUserEmail'] || '')
    //                 .setEmail(request.user ? request.user.email : request.cookies['preflightUserEmail'] || '')
    //                 .setFirstName(request.user ? request.user.firstName : '')
    //                 .setLastName(request.user ? request.user.surname : '')
    //                 .setCountry(request.user && request.user.address ? request.user.address.country.toLowerCase() : '')
    //                 .setCity(request.user && request.user.address ? request.user.address.town : '')
    //                 .setZip(request.user && request.user.address ? request.user.address.postcode : '')
    //                 .setPhone(request.user && request.user.address ? request.user.address.phone : '')
    //                 // It is recommended to send Client IP and User Agent for Conversions API Events.
    //                 .setClientIpAddress(request.ip)
    //                 .setClientUserAgent(request.headers['user-agent'])
    //                 .setFbp(request.cookies['_fbp'])

    const userData = _getUserDataObject();

    if (!userData) {
      return Promise.reject({ message: 'UserData is null' });
    }

    const customData = new CustomData().setSearchString(searchTerm);

    const page = options.resolvers?.page?.();
    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('Search')
      .setEventTime(current_timestamp)
      .setUserData(userData)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url ?? '')
      .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    try {
      var response = await eventRequest.execute();
      console.debug('[EA:Facebook] eventRequest=>Response: ', response);
      return {
        payload: eventsData.map((se) => se.normalize()),
        response,
      };
    } catch (err) {
      console.error('[EA:Facebook] eventRequest=>Error: ', err);
      return err;
    }
  };

  const trackNewProfile = async (profile: T_EA_DataProfile | null) => {};

  const trackProfileResetPassword = async (
    profile: T_EA_DataProfile | null
  ) => {};

  const trackProfileLogIn = async (profile: T_EA_DataProfile | null) => {};

  const trackProfileLogOut = async (profile: T_EA_DataProfile | null) => {};

  const trackProfileSubscribeNL = async (
    profile: T_EA_DataProfile | null
  ) => {};

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
  };
};

export default fbTracker;

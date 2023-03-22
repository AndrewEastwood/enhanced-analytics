import {
  TDataBasket,
  TDataOrder,
  TDataPage,
  TDataProduct,
  TDataProfile,
  TSettings,
} from '../shared';
import * as trackUtils from '../utils';

export const fbTracker = (options: TSettings) => {
  const { serverAnalytics: analytics, currency } = options;
  const access_token = analytics?.fb?.token;
  const pixel_id = analytics?.fb?.pixelId;
  const testCode = analytics?.testing ? analytics.fb?.testCode : '';
  const bizSdk = analytics?.fb?.sdk;

  if (!bizSdk) {
    throw 'Facebook is configured without SDK; Please provide SDK;';
  }

  // const Content = bizSdk.Content;
  const CustomData = bizSdk.CustomData;
  // const DeliveryCategory = bizSdk.DeliveryCategory;
  const EventRequest = bizSdk.EventRequest;
  const UserData = bizSdk.UserData;
  const ServerEvent = bizSdk.ServerEvent;

  const trackIdentify = (profile?: TDataProfile | null) => {
    const user = profile ? profile : options.resolvers?.profile?.() || null;
    return user;
  };

  const _getUserDataObject = (order?: TDataOrder) => {
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
    const session = options.resolvers?.session?.();
    const userData = new UserData()
      .setExternalId(order ? order.customer.email : user?.email)
      .setEmail(order ? order.customer.email : user?.email)
      .setFirstName(order ? order.customer.firstName : user?.firstName)
      .setLastName(order ? order.customer.lastName : user?.lastName)
      .setCountry(
        order ? order.shipping.address.country : user?.address?.country
      )
      .setCity(order ? order.shipping.address.city : user?.address?.city)
      .setZip(order ? order.shipping.address.postcode : user?.address?.postcode)
      .setPhone(order ? order.customer.phone : user?.phone)
      // It is recommended to send Client IP and User Agent for Conversions API Events.
      .setClientIpAddress(session?.ip)
      .setClientUserAgent(session?.agent) // request.headers['user-agent'])
      .setFbp(session?.fbp); // request.cookies['_fbp']);
    return userData;
  };

  const trackTransactionRefund = async (order: TDataOrder) => {};

  const trackTransactionCancel = async (order: TDataOrder) => {};

  const trackTransactionFulfill = async (order: TDataOrder) => {};

  const trackTransaction = async (order: TDataOrder) => {
    const evtName = trackUtils.getEventNameOfTransaction(order);
    console.error('fb:trackTransaction', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const userData = _getUserDataObject(order);
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
      .setOrderId(order.id)
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
      .setEventSourceUrl(page?.url)
      .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    try {
      var response = await eventRequest.execute();
      console.log('Response: ', response);
      return response;
    } catch (err) {
      console.error('Error: ', err);
    }
  };

  const trackProductAddToCart = async (basket: TDataBasket) => {
    basket.lastAdded.forEach(async (product) => {
      const evtName = trackUtils.getEventNameOfProductAddToCart(product);
      console.error('fb:trackProductAddToCart', evtName);
      const current_timestamp = Math.floor(Date.now() / 1000);

      const userData = _getUserDataObject();
      const contents = trackUtils
        .Basket(options, basket)
        .BasketAddProduct.getContents();

      const customData = new CustomData()
        .setValue(product.quantity)
        .setContents([contents])
        .setContentName(product.title)
        .setCurrency(currency);

      const page = options.resolvers?.page?.();
      const serverEvent = new ServerEvent()
        .setEventId(evtName)
        .setEventName('AddToCart')
        .setEventTime(current_timestamp)
        .setUserData(userData)
        .setCustomData(customData)
        .setEventSourceUrl(page?.url)
        .setActionSource('website');

      const eventsData = [serverEvent];
      const eventRequest = new EventRequest(access_token, pixel_id)
        .setTestEventCode(testCode)
        .setEvents(eventsData);

      try {
        var response = await eventRequest.execute();
        console.log('Response: ', response);
        return response;
      } catch (err) {
        console.error('Error: ', err);
      }
    });
  };

  const trackProductRemoveFromCart = async (basket: TDataBasket) => {
    basket.lastRemoved.forEach(async (product) => {
      const evtName = trackUtils.getEventNameOfProductRemoveFromCart(product);
      console.error('fb:trackProductRemoveFromCart', evtName);
      const current_timestamp = Math.floor(Date.now() / 1000);

      const userData = _getUserDataObject();
      const contents = trackUtils
        .Basket(options, basket)
        .BasketRemoveProduct.getContents();

      const customData = new CustomData()
        .setValue(product.quantity)
        .setContents([contents])
        .setContentName(product.title)
        .setCurrency(currency);

      const page = options.resolvers?.page?.();
      const serverEvent = new ServerEvent()
        .setEventId(evtName)
        .setEventName('RemoveFromCart')
        .setEventTime(current_timestamp)
        .setUserData(userData)
        .setCustomData(customData)
        .setEventSourceUrl(page?.url)
        .setActionSource('website');

      const eventsData = [serverEvent];
      const eventRequest = new EventRequest(access_token, pixel_id)
        .setTestEventCode(testCode)
        .setEvents(eventsData);

      try {
        var response = await eventRequest.execute();
        console.log('Response: ', response);
        return response;
      } catch (err) {
        console.error('Error: ', err);
      }
    });
  };

  const trackProductItemView = async (product: TDataProduct) => {
    const evtName = trackUtils.getEventNameOfProductItemView(product);
    console.error('fb:trackProductItemView', evtName);
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
      .setEventSourceUrl(page?.url)
      .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    try {
      var response = await eventRequest.execute();
      console.log('Response: ', response);
      return response;
    } catch (err) {
      console.error('Error: ', err);
    }
  };

  const trackProductsItemView = async (products) => {};

  const trackPageView = async (page: TDataPage) => {
    const evtName = trackUtils.getEventNameOfPageView();
    console.error('fb:trackProductItemView', evtName);
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
    const customData = new CustomData().setContents([contents]);

    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('PageView')
      .setEventTime(current_timestamp)
      .setUserData(userData)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url)
      .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    try {
      var response = await eventRequest.execute();
      console.log('Response: ', response);
      return response;
    } catch (err) {
      console.error('Error: ', err);
    }
  };

  const trackInitiateCheckout = async (basket: TDataBasket) => {
    const evtName = trackUtils.getEventNameOfInitiateCheckout(basket);
    console.error('fb:trackProductItemView', evtName);
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
    const contents = trackUtils
      .Basket(options, basket)
      .InitCheckout.getContents();

    const customData = new CustomData()
      .setValue(basket.total.toFixed(2))
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
      .setEventSourceUrl(page?.url)
      .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    try {
      var response = await eventRequest.execute();
      console.log('Response: ', response);
      return response;
    } catch (err) {
      console.error('Error: ', err);
    }
  };

  const trackSearch = async (searchTerm, matchingProducts) => {
    const evtName = trackUtils.getEventNameOfSearch(
      searchTerm,
      matchingProducts
    );
    console.error('fb:trackProductItemView', evtName);
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
    const customData = new CustomData().setSearchString(searchTerm);

    const page = options.resolvers?.page?.();
    const serverEvent = new ServerEvent()
      .setEventId(evtName)
      .setEventName('Search')
      .setEventTime(current_timestamp)
      .setUserData(userData)
      .setCustomData(customData)
      .setEventSourceUrl(page?.url)
      .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = new EventRequest(access_token, pixel_id)
      .setTestEventCode(testCode)
      .setEvents(eventsData);

    try {
      var response = await eventRequest.execute();
      console.log('Response: ', response);
      return response;
    } catch (err) {
      console.error('Error: ', err);
    }
  };

  const trackNewProfile = async (profile: TDataProfile | null) => {};

  const trackProfileResetPassword = async (profile: TDataProfile | null) => {};

  const trackProfileLogIn = async (profile: TDataProfile | null) => {};

  const trackProfileLogOut = async (profile: TDataProfile | null) => {};

  const trackProfileSubscribeNL = async (profile: TDataProfile | null) => {};

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
  };
};

export default fbTracker;

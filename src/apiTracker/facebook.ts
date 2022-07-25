import { Request } from 'express';
import bizSdk from 'facebook-nodejs-business-sdk';
import { TDataBasket, TDataOrder, TDataPage, TDataProduct, TDataProfile, TSettings } from '../types';
import * as trackUtils from '../utils';

// const Content = bizSdk.Content;
const CustomData = bizSdk.CustomData;
// const DeliveryCategory = bizSdk.DeliveryCategory;
const EventRequest = bizSdk.EventRequest;
const UserData = bizSdk.UserData;
const ServerEvent = bizSdk.ServerEvent;

export const fbTracker = (options:TSettings) => {
  const {
    analytics,
    absoluteURL,
    currency,
  } = options;
  const access_token = analytics.fb.token;
  const pixel_id = analytics.fb.pixelId;
  const testCode = analytics.testing ? analytics.fb.testCode : '';

  const trackIdentify = (request:Request, profile?:TDataProfile) => {
    const user = profile ? profile : options.resolvers?.userData(request) || request['user'] || null;
    return user;
  };

  const _getUserDataObject = (request:Request, order?:TDataOrder) => {
    const user = trackIdentify(request);
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

      const userData = (new UserData())
        .setExternalId(order ? order.customer.email : user?.email)
        .setEmail(order ? order.customer.email : user?.email)
        .setFirstName(order ? order.customer.firstName : user?.firstName)
        .setLastName(order ? order.customer.lastName : user?.lastName)
        .setCountry(order ? order.shipping.address.country : user?.address?.country)
        .setCity(order ? order.shipping.address.city : user?.address?.city)
        .setZip(order ? order.shipping.address.postcode : user?.address?.postcode)
        .setPhone(order ? order.customer.phone : user?.phone)
        // It is recommended to send Client IP and User Agent for Conversions API Events.
        .setClientIpAddress(request.ip)
        .setClientUserAgent(request.headers['user-agent'])
        .setFbp(request.cookies['_fbp']);
    return userData;
  }

  const trackTransactionRefund = async (request:Request, order:TDataOrder) => {}

  const trackTransactionCancel = async (request:Request, order:TDataOrder) => {}

  const trackTransactionFulfill = async (request:Request, order:TDataOrder) => {}

  const trackTransaction = async (request:Request, order:TDataOrder) => {
    const evtName = trackUtils.getEventNameOfTransaction(request, order);
    console.error('fb:trackTransaction', evtName);
    const current_timestamp = Math.floor(Date.now() / 1000);
    const userData = _getUserDataObject(request, order);
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

    const customData = (new CustomData())
                    .setContents(contents)
                    .setCurrency(currency)
                    .setOrderId(order.id)
                    .setStatus(order.status)
                    .setNumItems(order.quantity)
                    .setValue(order.revenue);

    const serverEvent = (new ServerEvent())
                    .setEventId(evtName)
                    .setEventName('Purchase')
                    .setEventTime(current_timestamp)
                    .setUserData(userData)
                    .setCustomData(customData)
                    .setEventSourceUrl(absoluteURL + request.originalUrl)
                    .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = (new EventRequest(access_token, pixel_id))
                    .setTestEventCode(testCode)
                    .setEvents(eventsData);

    try {
      var response = await eventRequest.execute()
      // console.log('Response: ', response);
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  const trackProductAddToCart = async (request:Request, basket:TDataBasket) => {
    basket.lastAdded.forEach(async product => {
      const evtName = trackUtils.getEventNameOfProductAddToCart(request, product);
      console.error('fb:trackProductAddToCart', evtName);
      const current_timestamp = Math.floor(Date.now() / 1000);

      const userData = _getUserDataObject(request);
      const contents = trackUtils.Basket(options, basket).BasketAddProduct.getContents();

      const customData = (new CustomData())
                      .setValue(product.quantity)
                      .setContents([contents])
                      .setContentName(product.title)
                      .setCurrency(currency);

      const serverEvent = (new ServerEvent())
                      .setEventId(evtName)
                      .setEventName('AddToCart')
                      .setEventTime(current_timestamp)
                      .setUserData(userData)
                      .setCustomData(customData)
                      .setEventSourceUrl(absoluteURL + request.originalUrl)
                      .setActionSource('website');

      const eventsData = [serverEvent];
      const eventRequest = (new EventRequest(access_token, pixel_id))
                      .setTestEventCode(testCode)
                      .setEvents(eventsData);

      try {
        var response = await eventRequest.execute()
        // console.log('Response: ', response);
      } catch (err) {
        console.error('Error: ', err);
      }
    });
  }

  const trackProductRemoveFromCart = async (request:Request, basket:TDataBasket) => {
    basket.lastRemoved.forEach(async product => {
      const evtName = trackUtils.getEventNameOfProductRemoveFromCart(request, product);
      console.error('fb:trackProductRemoveFromCart', evtName);
      const current_timestamp = Math.floor(Date.now() / 1000);

      const userData = _getUserDataObject(request);
      const contents = trackUtils.Basket(options, basket).BasketRemoveProduct.getContents();

      const customData = (new CustomData())
                      .setValue(product.quantity)
                      .setContents([contents])
                      .setContentName(product.title)
                      .setCurrency(currency);

      const serverEvent = (new ServerEvent())
                      .setEventId(evtName)
                      .setEventName('RemoveFromCart')
                      .setEventTime(current_timestamp)
                      .setUserData(userData)
                      .setCustomData(customData)
                      .setEventSourceUrl(absoluteURL + request.originalUrl)
                      .setActionSource('website');

      const eventsData = [serverEvent];
      const eventRequest = (new EventRequest(access_token, pixel_id))
                      .setTestEventCode(testCode)
                      .setEvents(eventsData);

      try {
        var response = await eventRequest.execute()
        // console.log('Response: ', response);
      } catch (err) {
        console.error('Error: ', err);
      }
    });
  }

  const trackProductItemView = async (request:Request, product:TDataProduct) => {
    const evtName = trackUtils.getEventNameOfProductItemView(request, product);
    console.error('fb:trackProductItemView', evtName);
    // const user = trackIdentify(request);
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

    const userData = _getUserDataObject(request);
    const contents = trackUtils
      .Catalog(options, [product])
      .ProductDetails
      .getContents();

    const customData = (new CustomData())
                    .setValue(product.price)
                    .setContents([contents])
                    .setContentName(product.title)
                    .setCurrency(currency);

    const serverEvent = (new ServerEvent())
                    .setEventId(evtName)
                    .setEventName('ViewContent')
                    .setEventTime(current_timestamp)
                    .setUserData(userData)
                    .setCustomData(customData)
                    .setEventSourceUrl(absoluteURL + request.originalUrl)
                    .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = (new EventRequest(access_token, pixel_id))
                    .setTestEventCode(testCode)
                    .setEvents(eventsData);

    try {
      var response = await eventRequest.execute()
      // console.log('Response: ', response);
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  const trackProductsItemView = async (request:Request, products) => {

  }

  const trackPageView = async (request:Request, page:TDataPage) => {
    const evtName = trackUtils.getEventNameOfPageView(request);
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

    const userData = _getUserDataObject(request);
    const customData = (new CustomData());

    const serverEvent = (new ServerEvent())
                    .setEventId(evtName)
                    .setEventName('PageView')
                    .setEventTime(current_timestamp)
                    .setUserData(userData)
                    .setCustomData(customData)
                    .setEventSourceUrl(absoluteURL + request.originalUrl)
                    .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = (new EventRequest(access_token, pixel_id))
                    .setTestEventCode(testCode)
                    .setEvents(eventsData);

    try {
      var response = await eventRequest.execute()
      console.error('Response: ', response);
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  const trackInitiateCheckout = async (request:Request, basket:TDataBasket) => {
    const evtName = trackUtils.getEventNameOfInitiateCheckout(request, basket);
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

    const userData = _getUserDataObject(request);
    const contents = trackUtils.Basket(options, basket).InitCheckout.getContents();

    const customData = (new CustomData())
                    .setValue(basket.total.toFixed(2))
                    .setContents(contents)
                    .setCurrency(currency)
                    .setNumItems(basket.quantity);

    const serverEvent = (new ServerEvent())
                    .setEventId(evtName)
                    .setEventName('InitiateCheckout')
                    .setEventTime(current_timestamp)
                    .setUserData(userData)
                    .setCustomData(customData)
                    .setEventSourceUrl(absoluteURL + request.originalUrl)
                    .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = (new EventRequest(access_token, pixel_id))
                    .setTestEventCode(testCode)
                    .setEvents(eventsData);

    try {
      var response = await eventRequest.execute()
      console.error('Response: ', response);
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  const trackSearch = async (request:Request, searchTerm, matchingProducts) => {
    const evtName = trackUtils.getEventNameOfSearch(request, searchTerm, matchingProducts);
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

    const userData = _getUserDataObject(request);
    const customData = (new CustomData())
                    .setSearchString(searchTerm);

    const serverEvent = (new ServerEvent())
                    .setEventId(evtName)
                    .setEventName('Search')
                    .setEventTime(current_timestamp)
                    .setUserData(userData)
                    .setCustomData(customData)
                    .setEventSourceUrl(absoluteURL + request.originalUrl)
                    .setActionSource('website');

    const eventsData = [serverEvent];
    const eventRequest = (new EventRequest(access_token, pixel_id))
                    .setTestEventCode(testCode)
                    .setEvents(eventsData);

    try {
      var response = await eventRequest.execute()
      console.error('Response: ', response);
    } catch (err) {
      console.error('Error: ', err);
    }
  }

  const trackNewProfile = async (request:Request, profile:TDataProfile) => {}

  const trackProfileResetPassword = async (request:Request, profile:TDataProfile) => {}

  const trackProfileLogIn = async (request:Request, profile:TDataProfile) => {}

  const trackProfileLogOut = async (request:Request, profile:TDataProfile) => {}

  const trackProfileSubscribeNL = async (request:Request, profile:TDataProfile) => {}

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
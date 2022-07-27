import { Request } from 'express';
import { TSettings, TDataProduct, TDataProfile, TDataOrder, TDataBasket, TDataPage } from '../shared';
import * as trackUtils from '../utils';

let KlaviyoClient:any = null;

export const klaviyoTracker = (options:TSettings) => {
  const {
    absoluteURL,
    serverAnalytics:analytics,
  } = options;

  const sdk = analytics?.klaviyo?.sdk;

  if (!sdk) {
    throw 'Klaviyo is configured without SDK; Please provide SDK;'
  }

  KlaviyoClient = KlaviyoClient || new sdk({
      publicToken: analytics.klaviyo?.siteId,
      privateToken: analytics.klaviyo?.token
  });

  const getUserObj = (request:Request, profile?:TDataProfile) => {
    return profile ? profile : options.serverAnalytics.resolvers.userData(request);

    // [TODO] move into app middleware >>
    // const user = request.user || null; // session user
    // const isAdmin = user && user.username || false;
    // const preflightUserEmail = (request.body && request.body.email) || // preflight email submission
    //   (request.cookies && request.cookies['preflightUserEmail']) || ''; // or from cookies
    // return !!(user && user.email && !isAdmin)
    //   ? JSON.parse(JSON.stringify(user))
    //   : preflightUserEmail
    //   ? { email: preflightUserEmail, firstName: '', surname: '' }
    //   : null;
  }

  const collectEvent = (request, evt) => {
    // console.error('klaviyo:addEvent');
    const current_timestamp = Math.floor(Date.now() / 1000);
    request.session.anonymousEvents = request.session.anonymousEvents || [];
    request.session.anonymousEvents.push({
      ...evt,
      ipAddress: request.ip,
      timestamp: current_timestamp,
      isTest: analytics.testing,
      post: true,
    });
    // console.error('request.session.anonymousEvents count', request.session.anonymousEvents.length);
    return request.session.anonymousEvents;
  }

  const releaseAnonymousEvents = (request) => {
    // console.error('klaviyo:releaseAnonymousEvents')
    const user = getUserObj(request);
    // request.session.anonymousEvents = request.session.anonymousEvents || [];
    // console.error('BEFRE anonymousEvents.len=', request.session.anonymousEvents.length);
    (user ? request.session.anonymousEvents : []).forEach(evt => {
      try {
        KlaviyoClient.public.track({
          ...evt,
          email: user!.email,
          customer_properties: {
            ...(evt.customer_properties || {}),
            "$first_name": user!.firstName,
            "$last_name": user!.lastName,
            "$email": user!.email,
          },
        });
      } catch { }
    });
    user ? (request.session.anonymousEvents.length = 0) : void 0;
    console.error('klaviyo:anonymousEvents#' + request.session.anonymousEvents.length);
  }

  const getProductUrl = (product:TDataProduct) => {
    return product.url;
  };

  const getProductImageUrl = (product:TDataProduct) => {
    return product.imageUrl ?? '';
  };

  // Identify a user - create/update a profile in Klaviyo
  const trackIdentify = async (request:Request, profile?:TDataProfile) => {
    const user = getUserObj(request, profile);
    // console.error('trackIdentify user=', user);
    await user ? KlaviyoClient.public.identify({
      email: user!.email,
      properties: {
        "$first_name": user ? user.firstName : '',
        "$last_name": user ? user.lastName : '',
        "$email": user ? user.email : '',
      },
      isTest: analytics.testing, //defaults to false
      post: true //defaults to false
    }) : Promise.resolve();
    releaseAnonymousEvents(request);
  }

  const trackTransactionRefund = async (request:Request, order:TDataOrder) => {}

  const trackTransactionCancel = async (request:Request, order:TDataOrder) => {}

  const trackTransactionFulfill = async (request:Request, order:TDataOrder) => {}

  const trackTransaction = async (request:Request, order:TDataOrder) => {
    const evtName = trackUtils.getEventNameOfTransaction(request, order);
    // console.error('klaviyo:trackTransaction', evtName);
    const user:TDataProfile = {
      phone: order.customer.phone,
      email: order.customer.email,
      firstName: order.customer.firstName,
      lastName: order.customer.lastName,
    };
    collectEvent(request, {
      event: "Placed Order",
      customerProperties: {
        "$email": order.customer.email,
        "$first_name": order.customer.firstName,
        "$last_name": order.customer.lastName,
        "$phone_number": order.customer.phone,
        "$address1": order.shipping.address,
        // "$address2": "Suite 1",
        "$city": order.shipping.address.city,
        "$zip": order.shipping.address.postcode,
        "$region": order.shipping.address.region,
        "$country": order.shipping.address.country
      },
      "properties": {
        "$event_id": evtName,// 'new_order_of_' + order.id,
        // "MissingInformation": ["Shipping Address Information","Shipping Method"],
        "$value": order.revenue,
        "OrderId": order.id,
        "Coupon": order.coupon || '',
        "Categories": Object
          .values(order.products)
          .map(product => product.category),
        "ItemNames": Object
          .values(order.products)
          .map(product => product.title),
        "Brands": Object
          .values(order.products)
          .map(product => product.brand),
        "DiscountCode": order.coupon,// "Free Shipping",
        // "DiscountValue": 5,
        SuccessURL: absoluteURL + request.originalUrl,
        "Items": order.products
          .map(product => ({
            "ProductID": product.id,
            "SKU": product.sku,
            "ProductName": product.title,
            "Quantity": product.quantity,
            "ItemPrice": product.price,
            "RowTotal": parseFloat(product.total?.toFixed(2) || '0'),
            "ProductURL": getProductUrl(product),
            "ImageURL": getProductImageUrl(product),
            "Categories": [product.category],
            "Brand": product.brand
          })),
        "BillingAddress": {
          "FirstName": order.customer.firstName,
          "LastName": order.customer.lastName,
          "Company": "",
          "Address1": order.shipping.address.street,
          "Address2": "",
          "City": order.shipping.address.city,
          "Region": order.shipping.address.region,
          "Region_code": "",
          "Country": order.shipping.address.country,
          "CountryCode": order.shipping.address.countryCode,
          "Zip": order.shipping.address.postcode,
          "Phone": order.shipping.address
        },
        "ShippingAddress": {
          "FirstName": order.customer.firstName,
          "LastName": order.customer.lastName,
          "Company": "",
          "Address1": order.shipping.address.street,
          "Address2": "",
          "City": order.shipping.address.city,
          "Region": order.shipping.address.region,
          "Region_code": "",
          "Country": order.shipping.address.country,
          "CountryCode": order.shipping.address.countryCode,
          "Zip": order.shipping.address.postcode,
          "Phone": order.shipping.address
        }
      },
    });
    trackIdentify(request);//{ ...request, user, });
  }

  const trackProductAddToCart = async (request:Request, basket:TDataBasket) => {
    basket.lastAdded.map(product => {
      const evtName = trackUtils.getEventNameOfProductAddToCart(request, product);
      // console.error('klaviyo:trackInitiateCheckout', evtName);
      // const basket = request.session.basket;
      collectEvent(request, {
        event: "Added to Cart",
        properties: {
          "$event_id": evtName,// 'add_cart_of_' + product.id,
          "$value": parseFloat(product.price.toFixed(2)),
          "AddedItemProductName": product.title,
          "AddedItemProductID": product.id,
          "AddedItemSKU": product.sku,
          "AddedItemCategories": [product.category],
          "AddedItemImageURL": getProductUrl(product),
          "AddedItemURL": getProductImageUrl(product),
          "AddedItemPrice": product.price,
          "AddedItemQuantity": product.quantity,
          "ItemNames": Object
            .values(basket.products)
            .map(product => product.title),
          "Categories": Object
            .values(basket.products)
            .map(product => product.category),
          "Brands": Object
            .values(basket.products)
            .map(product => product.brand),
          "Items": Object
            .values(basket.products)
            .map(product => ({
              "ProductID": product.id,
              "SKU": product.sku,
              "ProductName": product.title,
              "Quantity": product.quantity,
              "ItemPrice": product.price,
              "RowTotal": parseFloat(product.total?.toFixed(2) || '0'),
              "ProductURL": getProductUrl(product),
              "ImageURL": getProductImageUrl(product),
              "Categories": [product.category],
              "Brand": product.brand
            })),
        },
      });
      trackIdentify(request);
    });
  }

  const trackProductRemoveFromCart = async (request:Request, basket:TDataBasket) => {
    basket.lastAdded.map(product => {
      const evtName = trackUtils.getEventNameOfProductRemoveFromCart(request, product);
      // console.error('klaviyo:trackInitiateCheckout', evtName);
      // const basket = request.session.basket;
      collectEvent(request, {
        event: "Removed form Cart",
        properties: {
          "$event_id": evtName,// 'add_cart_of_' + product.id,
          "$value": parseFloat(product.price.toFixed(2)),
          "RemovedItemProductName": product.title,
          "RemovedItemProductID": product.id,
          "RemovedItemSKU": product.sku,
          "RemovedItemCategories": [product.category],
          "RemovedItemImageURL": getProductUrl(product),
          "RemovedItemURL": getProductImageUrl(product),
          "RemovedItemPrice": product.price,
          "RemovedItemQuantity": product.quantity,
          "ItemNames": Object
            .values(basket.products)
            .map(product => product.title),
          "Categories": Object
            .values(basket.products)
            .map(product => product.category),
          "Brands": Object
            .values(basket.products)
            .map(product => product.brand),
          "Items": Object
            .values(basket.products)
            .map(product => ({
              "ProductID": product.id,
              "SKU": product.sku,
              "ProductName": product.title,
              "Quantity": product.quantity,
              "ItemPrice": product.price,
              "RowTotal": parseFloat(product.total?.toFixed(2) || '0'),
              "ProductURL": getProductUrl(product),
              "ImageURL": getProductImageUrl(product),
              "Categories": [product.category],
              "Brand": product.brand
            })),
        },
      });
      trackIdentify(request);
    });
  }

  const trackProductsItemView = async (request:Request, products:TDataProduct[]) => {

  }

  const trackProductItemView = async (request:Request, product:TDataProduct) => {
    const evtName = trackUtils.getEventNameOfProductItemView(request, product);
    // console.error('klaviyo:trackProductItemView', evtName);
    collectEvent(request, {
      event: "Viewed Product",
      properties: {
        "$event_id": evtName,
        "$value": product.price,
        ProductName: product.title,
        ProductID: product.id,
        SKU: product.sku,
        Categories: [product.category],
        ImageURL: getProductImageUrl(product),
        URL: getProductUrl(product),
        Brand: product.brand,
        Price: product.price,
        SalePrice: product.salePrice
      },
    });
    trackIdentify(request);
  }

  const trackPageView = async (request:Request, page:TDataPage) => {
    // const evtName = trackUtils.getEventNameOfPageView(request);
    // console.error('klaviyo:trackPageView', evtName);
    // const basket = request.session.basket;
    collectEvent(request, {
      event: "Viewed Page",
      properties: {
        // "$event_id": evtName,
        // "$value": request.path.includes('/basket') ? basket.total.toFixed(2) : 0,
        PageName: request.path,
        PageUrl: absoluteURL + request.originalUrl
      },
    });
    trackIdentify(request);
  }

  const trackInitiateCheckout = async (request:Request, basket:TDataBasket) => {
    const evtName = trackUtils.getEventNameOfInitiateCheckout(request, basket);
    // console.error('klaviyo:trackInitiateCheckout', evtName);
    collectEvent(request, {
      event: "Started Checkout",
      properties: {
        "$event_id": evtName,
        "$value": basket.total.toFixed(2),
        "ItemNames": Object
          .values(basket.products)
          .map(product => product.title),
        "Categories": Object
          .values(basket.products)
          .map(product => product.category),
        "Brands": Object
          .values(basket.products)
          .map(product => product.brand),
        CheckoutURL: absoluteURL + request.originalUrl,
        "Items": Object
          .values(basket.products)
          .map(product => ({
            "ProductID": product.id,
            "SKU": product.sku,
            "ProductName": product.title,
            "Quantity": product.quantity,
            "ItemPrice": product.price,
            "RowTotal": parseFloat(product.total?.toFixed(2) || '0'),
            "ProductURL": getProductUrl(product),
            "ImageURL": getProductImageUrl(product),
            "Categories": [product.category],
            "Brand": product.brand
          })),
      },
    });
    trackIdentify(request);
  }

  const trackSearch = async (request:Request, searchTerm, matchingProducts) => {
    const evtName = trackUtils.getEventNameOfSearch(request, searchTerm, matchingProducts);
    // console.error('klaviyo:trackSearch', evtName);
    collectEvent(request, {
      event: "Searched Site",
      properties: {
        "$event_id": evtName,
        SearchTerm: searchTerm,
        ReturnedResults: matchingProducts && matchingProducts.length || 0,
        PageUrl: absoluteURL + request.originalUrl
      },
    });
    trackIdentify(request);
  }

  const trackNewProfile = async (request:Request, profile:TDataProfile) => {
    // console.error('klaviyo:trackNewProfile', request.user);
    const user = getUserObj(request, profile);
    user ? collectEvent(request, {
      event: 'Created Account',
      customer_properties: {
        "$first_name": user.firstName,
        "$last_name": user.lastName,
        "$email": user.email,
      },
    }) : void 0;
    trackIdentify(request);
  }

  const trackProfileResetPassword = async (request:Request, profile:TDataProfile) => {
    // console.error('klaviyo:trackProfileResetPassword', request.user);
    const user = getUserObj(request, profile);
    user ? collectEvent(request, {
      event: 'Reset Password',
      customer_properties: {
        "$email": user.email,
      },
      properties: {
        PasswordResetLink: absoluteURL + options.serverAnalytics.links.resetPassword,
      }
    }) : void 0;
    trackIdentify(request);
  }

  const trackProfileLogIn = async (request:Request, profile:TDataProfile) => {
    const user = getUserObj(request, profile);
    user ? collectEvent(request, {
      event: 'Custom User Login',
      customer_properties: {
        "$email": user.email,
      },
    }) : void 0;
    trackIdentify(request);
  }

  const trackProfileLogOut = async (request:Request, profile:TDataProfile) => {
    const user = getUserObj(request, profile);
    user ? collectEvent(request, {
      event: 'Custom User Log Out',
      customer_properties: {
        "$email": user.email,
      },
    }) : void 0;
    trackIdentify(request);
  }

  const trackProfileSubscribeNL = async (request:Request, profile:TDataProfile) => {
    // console.error('klaviyo:trackProfileSubscribeNL', request.user);
    const user = getUserObj(request, profile);
    user ? collectEvent(request, {
      event: 'Custom User NL Subscribed',
      customer_properties: {
        "$email": user.email,
      },
    }) : void 0;
    trackIdentify(request);
  }

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
  };
};

export default klaviyoTracker;
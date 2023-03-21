import { TSettings, TDataProduct, TDataProfile, TDataOrder, TDataBasket, TDataPage } from '../shared';
import * as trackUtils from '../utils';
import { ConfigWrapper, Events, Profiles, } from 'klaviyo-api';

const anonymousEvents = new Set();

export const klaviyoTracker = (options:TSettings) => {
  const {
    absoluteURL,
    serverAnalytics:analytics,
  } = options;

  // const sdk = analytics?.klaviyo?.sdk;

  // if (!sdk) {
  //   throw 'Klaviyo is configured without SDK; Please provide SDK;'
  // }

  // KlaviyoClient = KlaviyoClient || new sdk({
  //     publicToken: analytics.klaviyo?.siteId,
  //     privateToken: analytics.klaviyo?.token
  // });

  if (!analytics || !analytics.klaviyo) {
    throw 'Klaviyo is not configured;'
  }

  if (!analytics.klaviyo?.token) {
    throw 'Klaviyo is configured without token; Please provide token;'
  }

  if (!analytics.klaviyo?.siteId) {
    throw 'Klaviyo is configured without siteId; Please provide siteId;'
  }

  ConfigWrapper(analytics.klaviyo?.token);

  // how to get your request information
  
  // const test = async () => {
  //   try {
  //     const body = {
  //       attributes: {
  //         email: 'sarah.mason@klaviyo-demo.com',
  //         phone_number: '+15005550006',
  //         external_id: '63f64a2b-c6bf-40c7-b81f-bed08162edbe',
  //         first_name: 'Sarah',
  //         last_name: 'Mason',
  //         organization: 'Klaviyo',
  //         title: 'Engineer',
  //         image: 'https://images.pexels.com/photos/3760854/pexels-photo-3760854.jpeg',
  //         location: {
  //           address1: '89 E 42nd St',
  //           address2: '1st floor',
  //           city: 'New York',
  //           country: 'United States',
  //           region: 'NY',
  //           zip: '10017',
  //           timezone: 'America/New_York'
  //         },
  //         properties: {newKey: 'New Value'}
  //       }
  //     };
  //     const response = await Profiles.createProfile(body);
  //     const response_body = response.body
  //     // first index id
  //     const id = response_body.data[0].id
  //     // getting the next page cursor
  //     const next_page_cursor = response_body.links.next
  //     // rest of the response information
  //     const status = response.status
  //     const headers = response.headers
  //   } catch (e) {
  //     console.log(e);
  //   }
  // }

  const getUserObj = (profile?:TDataProfile) => {
    return profile ? profile : options.resolvers?.user?.();

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

  const collectEvent = (evt) => {
    // console.error('klaviyo:addEvent');
    const current_timestamp = Math.floor(Date.now() / 1000);
    const session = options.resolvers?.session?.();
    // anonymousEvents = anonymousEvents || [];
    anonymousEvents.add({
      ...evt,
      ipAddress: session?.ip,
      agent: session?.agent,
      timestamp: current_timestamp,
      isTest: analytics.testing,
      post: true,
    });
    // console.error('anonymousEvents count', anonymousEvents.length);
    return anonymousEvents;
  }

  const releaseAnonymousEvents = () => {
    // console.error('klaviyo:releaseAnonymousEvents')
    const user = getUserObj();
    // request.session.anonymousEvents = request.session.anonymousEvents || [];
    // console.error('BEFRE anonymousEvents.len=', request.session.anonymousEvents.length);
    (user ? Array.from(anonymousEvents) : []).forEach((evt:any) => {
      try {
        // KlaviyoClient.public.track({
        Events.createEvent({
          type: 'event',
          attributes: {
            profile: {
              ...(evt.customer_properties ?? {}),
              "$first_name": user!.firstName,
              "$last_name": user!.lastName,
              "$email": user!.email,
              email: user!.email,
            },
            metric: {
              name: evt.event,
            },
            properties: {
              ...(evt?.properties ?? {}),
            },
            time: new Date().toISOString(),// '2022-11-08T00:00:00',
            value: evt.properties?.$value ?? null,
            unique_id: evt.properties?.$event_id ?? null,
          },
          // email: user!.email,
          // customer_properties: {
          // },
        });
      } catch { }
    });
    user ? anonymousEvents.clear() : void 0;
    console.error('klaviyo:anonymousEvents#' + anonymousEvents.size);
  }

  const getProductUrl = (product:TDataProduct) => {
    return product.url;
  };

  const getProductImageUrl = (product:TDataProduct) => {
    return product.imageUrl ?? '';
  };

  // Identify a user - create/update a profile in Klaviyo
  const trackIdentify = async (profile?:TDataProfile) => {
    const user = getUserObj(profile);
    // console.error('trackIdentify user=', user);
    // await user ? KlaviyoClient.public.identify({
    const attributes = {
      $email: user!.email,// 'sarah.mason@klaviyo-demo.com',
      $phone_number: user!.phone,//'+15005550006',
      external_id: user?.id,// '63f64a2b-c6bf-40c7-b81f-bed08162edbe',
      $first_name: user?.firstName ?? '',//'Sarah',
      $last_name: user?.lastName ?? '',//'Mason',
      organization: user?.organization,// 'Klaviyo',
      title: user?.title,// 'Engineer',
      $image: user?.avatarUrl,// 'https://images.pexels.com/photos/3760854/pexels-photo-3760854.jpeg',
      location: {
        ...(user?.address ?? {}),
        // address1: '89 E 42nd St',
        // address2: '1st floor',
        // city: 'New York',
        // country: 'United States',
        // region: 'NY',
        // zip: '10017',
        // timezone: 'America/New_York'
      },
      properties: {
        ...(user?.extraProps ?? {})
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
    user ? await Profiles.createProfile({ data: { type: 'profile', attributes }}) : Promise.resolve();
    releaseAnonymousEvents();
  }

  const trackTransactionRefund = async (order:TDataOrder) => {}

  const trackTransactionCancel = async (order:TDataOrder) => {}

  const trackTransactionFulfill = async (order:TDataOrder) => {}

  const trackTransaction = async (order:TDataOrder) => {
    const evtName = trackUtils.getEventNameOfTransaction(order);
    const session = options.resolvers?.session?.();
    collectEvent({
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
      properties: {
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
        SuccessURL: absoluteURL + session?.originalUrl,
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
    trackIdentify();//{ ...user, });
  }

  const trackProductAddToCart = async (basket:TDataBasket) => {
    basket.lastAdded.map(product => {
      const evtName = trackUtils.getEventNameOfProductAddToCart(product);
      // console.error('klaviyo:trackInitiateCheckout', evtName);
      // const basket = request.session.basket;
      collectEvent({
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
      trackIdentify();
    });
  }

  const trackProductRemoveFromCart = async (basket:TDataBasket) => {
    basket.lastAdded.map(product => {
      const evtName = trackUtils.getEventNameOfProductRemoveFromCart(product);
      // console.error('klaviyo:trackInitiateCheckout', evtName);
      // const basket = request.session.basket;
      collectEvent({
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
      trackIdentify();
    });
  }

  const trackProductsItemView = async (products:TDataProduct[]) => {
    products.forEach(p => trackProductItemView(p));
  }

  const trackProductItemView = async (product:TDataProduct) => {
    const evtName = trackUtils.getEventNameOfProductItemView(product);
    // console.error('klaviyo:trackProductItemView', evtName);
    collectEvent({
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
    trackIdentify();
  }

  const trackPageView = async (page:TDataPage) => {
    // const evtName = trackUtils.getEventNameOfPageView(request);
    // console.error('klaviyo:trackPageView', evtName);
    // const basket = request.session.basket;

    const session = options.resolvers?.session?.();
    collectEvent({
      event: "Viewed Page",
      properties: {
        // "$event_id": evtName,
        // "$value": request.path.includes('/basket') ? basket.total.toFixed(2) : 0,
        PageName: session?.pagePath,
        PageUrl: absoluteURL + session?.originalUrl
      },
    });
    trackIdentify();
  }

  const trackInitiateCheckout = async (basket:TDataBasket) => {
    const evtName = trackUtils.getEventNameOfInitiateCheckout(basket);
    // console.error('klaviyo:trackInitiateCheckout', evtName);
    const session = options.resolvers?.session?.();
    collectEvent({
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
        CheckoutURL: absoluteURL + session?.originalUrl,
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
    trackIdentify();
  }

  const trackSearch = async (searchTerm, matchingProducts) => {
    const evtName = trackUtils.getEventNameOfSearch(searchTerm, matchingProducts);
    // console.error('klaviyo:trackSearch', evtName);
    const session = options.resolvers?.session?.();
    collectEvent({
      event: "Searched Site",
      properties: {
        "$event_id": evtName,
        SearchTerm: searchTerm,
        ReturnedResults: matchingProducts && matchingProducts.length || 0,
        PageUrl: absoluteURL + session?.originalUrl
      },
    });
    trackIdentify();
  }

  const trackNewProfile = async (profile:TDataProfile) => {
    // console.error('klaviyo:trackNewProfile', request.user);
    const user = getUserObj(profile);
    user ? collectEvent({
      event: 'Created Account',
      customer_properties: {
        "$first_name": user.firstName,
        "$last_name": user.lastName,
        "$email": user.email,
      },
    }) : void 0;
    trackIdentify();
  }

  const trackProfileResetPassword = async (profile:TDataProfile) => {
    // console.error('klaviyo:trackProfileResetPassword', request.user);
    const user = getUserObj(profile);
    user ? collectEvent({
      event: 'Reset Password',
      customer_properties: {
        "$email": user.email,
      },
      properties: {
        PasswordResetLink: absoluteURL + (options.links?.resetPassword ?? ''),
      }
    }) : void 0;
    trackIdentify();
  }

  const trackProfileLogIn = async (profile:TDataProfile) => {
    const user = getUserObj(profile);
    user ? collectEvent({
      event: 'Custom User Login',
      customer_properties: {
        "$email": user.email,
      },
    }) : void 0;
    trackIdentify();
  }

  const trackProfileLogOut = async (profile:TDataProfile) => {
    const user = getUserObj(profile);
    user ? collectEvent({
      event: 'Custom User Log Out',
      customer_properties: {
        "$email": user.email,
      },
    }) : void 0;
    trackIdentify();
  }

  const trackProfileSubscribeNL = async (profile:TDataProfile) => {
    // console.error('klaviyo:trackProfileSubscribeNL', request.user);
    const user = getUserObj(profile);
    user ? collectEvent({
      event: 'Custom User NL Subscribed',
      customer_properties: {
        "$email": user.email,
      },
    }) : void 0;
    trackIdentify();
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

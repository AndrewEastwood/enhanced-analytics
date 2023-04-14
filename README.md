# enhanced-analytics

A couple of convenient tools for populating dataLayer ecommerce event data or even more.

**integrated services**:\
&nbsp;&nbsp;✅ Google Analytics & GA4 / Tag Manager (Browser Only)\
&nbsp;&nbsp;✅ Klaviyo (Server+Browser) https://www.klaviyo.com/

- Install `npm i -S klaviyo-api@2.11` when this lib is being used at NodeJs
- This will auto-install js when running it in a broswer.

&nbsp;&nbsp;✅ Facebook (Server+Browser)

- install `npm i -S facebook-nodejs-business-sdk@13.0.0` when running in NodeJs env

&nbsp;&nbsp;✅ FullStory (Broswer Only) https://www.fullstory.com/

- Install `npm i @fullstory/browser` when this lib is being used at NodeJs

---

## 1 Configure (UI Side)

```tsx
import { useEffect } from 'react';
import { configureAnalytics } from 'enhanced-analytics';
import * as EATypes from 'enhanced-analytics';

const MyApp = () => {
  // store configuration
  const activeStore = {
    name: 'My Store',
    homepage: 'www.my-store.com',
    localization: {
      currency: 'USD',
    },
  };

  useEffect(() => {
    configureAnalytics({
      affiliation: activeStore.name,
      absoluteURL: activeStore.homepage,
      currency: activeStore.localization.currency,
      debug: /* set true when localhost or dev env */
      integrations: {
        // Klaviyo
        klaviyo: {
          enabled: true,
          siteId: 'YOUR-SITE-ID',
        },
        // Google Analytics (TagManager)
        ga: {
          enabled: true,
          trackId: 'GTM-XXXXXXX',
          ga4: true, // <-- publish GA4 events data
          // more default params:
          // defaultCatalogName: `${activeStore.name} Landing Products`,
          // defaultBasketName: 'Shopping Cart',
          // dataLayerName: 'dataLayer'
        },
        // FullStory
        fullstory: {
          enabled: true,
          orgId: 'YOUR-ORG-ID',
          // @ts-ignore
          sdk: FullStory, // <-- this requires: npm i @fullstory/browser
        },
        // Facebook Pixel
        fb: {
          enabled: true,
          pixelId: 'YOUR-PIXEL-ID',
          testCode: 'TEST61709', // <---- test code, when testing Pixel data (server side only)
        },
      },
      // you may have your own data structure
      // therefore we need it converted for the lib here
      // This is just real use-case.
      resolvers: {
        // custom data transformation configuration
        // prettier-ignore
        page(input) {//  <================================|
          //   ^^ this would be 'test'                    |
          return {                          //            |
            id: '',                         //            |
            name: document.title,           //            |
            path: window.location.pathname, //            |
            url: window.location.href,      //            |
            title: document.title,          //            |
          };                                //            |
        }, //                               //            |
        //                                                |
        // ^^ here, If you call useAnalytics().withPage('test').integrations.klaviyo.trackPageView();
        //    and the same approach for the other scopes: withUser, withBasket... etc.
        profile(input) {
          const currUser = input || /* get session user */;
          return currUser?.userName && currUser?.email === 12
            ? {
                email: currUser.email,
                firstName: currUser.userName,
              }
            : null;
        },
        product: (p: any) => {
          const res: EATypes.T_EA_DataProduct = {
            id: p.id,
            brand: p.seller,
            category: p.category,
            description: p.description,
            isSale: !!p.promo,
            price: p.price,
            salePrice: p.price,
            title: p.title,
            sku: p.sku,
            viewOrder: p.viewOrder,
          };
          return res;
        },
        basket: () => {
          const diff = CartBuilderStore.getLastDiff();
          const res: EATypes.TDataBasket = {
            coupon: CartBuilderStore.getCouponCode(),
            total: CartBuilderStore.getCartTotal(),
            quantity: CartBuilderStore.getItemsCount(),
            lastAdded: diff?.lastAddedItems.map(mapCartItemToAnalytics) || [],
            lastRemoved:
              diff?.lastRemovedItems.map(mapCartItemToAnalytics) || [],
            products: CartBuilderStore.getItems().map(mapCartItemToAnalytics),
          };
          return res;
        },
        order: (o: any) => {
          const res: EATypes.T_EA_DataOrder = {
            id: o.id,
            coupon: o.coupon,
            dateCreated: o.dateCreated,
            revenue: o.costsDetails.net,
            status: o.status,
            tax: o.taxValue,
            payment: {
              type: o.paymentType,
            },
            products: o.orderProducts,
            quantity: o.orderTotal
            customer: {
              email: o.customerEmail,
              firstName: o.customerFullName,
              lastName: o.customerLastName,
              phone: o.customerPhone,
              address: {
                street: o.customerAddress,
              },
            },
            shipping: {
              cost: o.costsDetails.feeValue,
              name: o.deliveryMethod,
              address: {
                street: o.customerAddress,
              },
            },
          };
          return res;
        },
      },
    });
  }, []);

  return <div>my app</div>;
};
```

## 1.2 Google Analytics

... somewhere in components:

```tsx
import useAnalytics from 'enhanced-analytics';

const MyComponent = () => {
  const analytics = useAnalytics();

  useEffect(() => {
    const myProductItems = [];

    //
    // Google Analytics: track basket add/remove items
    //
    analytics
      .withBasket(/* TDataBasket|Record<any>|null */) // <- this can be empty or TDataBasket AND resolver.basket is being invoked as well
      .events.ga()
      .getEECCheckoutList()
      .when(() => true /* or your condition */) // <----- or omit this call, if there is no any conditions
      .push(); // <- inject event into the dataLayer (config dataLayerName default is 'dataLayer');

    //
    // Google Analytics: track search/on-page product items
    //
    analytics
      .withCatalog(/* your array of goods; any custom data[] or T_EA_DataProduct[] */)
      // ^ the resolver.product is being invoked over the each item in the given collection
      .events.ga()
      .getEECProductsList()
      .push();

    //
    // Google Analytics: track product details
    //
    analytics
      .withCatalog(/* array with just one product data [T_EA_DataProduct] */)
      // ^ the resolver.product is being invoked over the each item in the given collection
      .events.ga()
      .getEECProductDetails()
      .when(() => /* producItem is loaded */)
      .push();

    //
    // Google Analytics: track order creation
    //
    analytics
      .withOrder(/* TDataOrder or any custom object */)
      // ^ invokes resolver.order
      .events.ga()
      .getEECPurchased()
      .when(() => !thisOrderWasSeen) // why not, implement your logic, that prevents duplicated events
      .push();
  }, []);

  return <></>;
};
```

### 1.2.Klaviyo UI / FullStory UI / Facebook Pixel

```tsx
import useAnalytics from 'enhanced-analytics';

const MyComponent = () => {
  const analytics = useAnalytics();
  const order = useOrder();

  // Track PageView
  useEffect(() => {
    // page tracking
    const evtPageView = analytics.withPage().events;

    evtPageView.fullstory().trackPageView();
    evtPageView.klaviyo().trackPageView();
  }, []);

  // Track User Indetify
  useEffect(() => {
    // page tracking
    const evtPageView = analytics.withPage().events;
    evtProfile.fullstory().trackIdentify();
    evtProfile.klaviyo().trackIdentify();
    evtPageView.fb().trackPageView();
  }, []);

  // Track Order Complete + Custom event "OrderSeen"
  useEffect(() => {
    const evtOrder = analytics.withOrder(order).events;
    const evtProfile = analytics.withProfile({
      userName: order.customerFullName,
      phone: order.customerPhone,
    }).events;
    // the custom event. This is going to track 'orderSeen' event
    const evtCustom = analytics.withMisc('orderSeen', {
      orderId: order.id,
      orderDate: moment(order.dateCreated).format(),
      orderTotal: order.total,
    }).events;

    // push the 'eec.purchase' evet along with order details
    evtOrder.ga().getEECPurchased().push();

    // indetify current session (this will link anonymous events to this user by email)
    evtProfile.fullstory().trackIdentify();
    evtProfile.klaviyo().trackIdentify();
    evtPageView.fb().trackIdentify();

    // any other custom events
    evtCustom.fullstory().trackCustom();
    evtCustom.klaviyo().trackCustom();
    evtPageView.fb().trackCustom();
  }, []);
};
```

## 2 Configure (API Side)

Simple snippet with Express.Js as middleware:

```typescript
app.use(
  analyticsMiddleware({
    absoluteURL: 'https://www.your-domain.lviv.ua/',
    serverAnalytics: {
      testing: false,
      klaviyo: {
        enabled: true,
        token: 'pk_token-goes-here',
        sdk: require('klaviyo-api'), // npm i klaviyo-api@2.1.1
      },
      userIdentification: {
        // this field is used this way: incoming request has body and we
        // check if this field contains req.body, if so we store the whole req.body
        // into app.locals.customer = req.body
        reqBodyKey: 'customerPhone',
      },
    },
    resolvers: (req) => ({
      order(evtPayload: any) {
        // in this case { order, products } (see order tracking at 2.2.KalviyoAPI below)
        const order = evtPayload.order;
        const orderProducts = evtPayload.products;
        return {
          id: order.id,
          revenue: order.total,
          tax: 0,
          quantity: order.features.length,
          coupon: order.coupon,
          products: [],
          dateCreated: order.dateCreated,
          status: order.status,
          shipping: {
            cost: order.deliveryFee,
            name: order.deliveryMethod,
            address: {
              street: order.customerAddress,
            },
          },
          customer: {
            firstName: order.customerFullName,
            email: `john.smith@test.com`,
          },
          payment: {
            type: order.paymentType,
          },
          url: `${req.protocol}://${req.hostname}/order/success/${order.externalId}`,
        };
      },
      profile() {
        return app.locals.customer.customerPhone
          ? {
              email: `john.smith@test.com`,
              firstName: app.locals.customer.customerFullName,
              phoneNumber: '5551234567',
              address: {
                country: 'United States',
                city: 'Boston',
                postcode: '02110',
                region: 'MA',
                countryCode: 'UA',
                street: app.locals.customer.customerAddress,
              },
            }
          : null;
      },
      eventUUID() {
        return app.locals.evtUuid;
      },
      product(input: TDataList<IDataProduct>) {
        const l = input.items.map((prodItem) => {
          return {
            id: prodItem.id,
            title: prodItem.title,
            description: prodItem.description,
            price: prodItem.price,
            salePrice: prodItem.price,
            isSale: false,
            brand: prodItem.seller,
            category: prodItem.categoryName,
            sku: prodItem.sku,
            list: 'main',
            url: `${req.protocol}://${req.hostname}/product/${prodItem.id}/${prodItem.sku}`,
            imageUrl: prodItem.imageUrl,
          };
        });
        return l;
      },
      page() {
        return {
          id: req.baseUrl,
          name: req.path.split('/')[0],
          path: req.path,
          title: 'Main Page',
          url: `${req.protocol}://${req.hostname}${req.originalUrl}`,
        };
      },
      session() {
        return {
          // agent, fbp and ip are optional when using fb tracking
          agent: req.headers['user-agent'],
          fbp: req.cookies['_fbp'],
          ip: req.ip,
        };
      },
    }),
  })
);
```

Another configuration for NextJs:

```typescript

// src/utils/ea.ts
// Server Side EA Configuration for NextJs
const getServerEA = (req: GetServerSidePropsContext['req']) => {
  const ea = useAnalytics({
    absoluteURL: "https://my-store.com/",
    affiliation: "My Store",
    currency: "USD",
    integrations: {
      testing: true,
      fb: {
        enabled: true,
        pixelId: "PIXEL-ID",
        token: "PIXEL-TOKEN",
        sdk: bizSdk,
        testCode: "TESTxxxxx",
      },
    },
    resolvers: {
      eventUUID() {
        return Date.now().toString(32);
      },
      session() {
          // agent, fbp and ip are optional when using fb tracking
        return {
          agent: req.headers["user-agent"],
          fbp: req.cookies["_fbp"],
          ip: req.socket.remoteAddress,
        };
      },
      profile() {
        const user = /* get session user info */
        return user
          ? {
              email: user.email,
              firstName: user.username,
            }
          : null;
      },
      basket() {
        return {
          total: 0,
          coupon: null,
          quantity: 0,
          lastAdded: [],
          lastRemoved: [],
          products: [],
        };
      },
    },
  });

  return ea;
}

// See usage below at 2.3.FB Pixel
```

## 2.1 Use It

### 2.2.Klaviyo API

Track new order:

```typescript
import useAnalytics from 'enhanced-analytics';

const evtPayload = { order, products };
// you can define your own payload
// and handle it at your resolvers.order function
await useAnalytics().withOrder(evtPayload).s2s.klaviyo().trackTransaction();
```

Begin checkout:

```typescript
import useAnalytics from 'enhanced-analytics';

const evtPayload = { order, products };
// you can define your own payload
// and handle it at your resolvers.order function
await useAnalytics()
  .withOrder(evtPayload)
  .s2s.klaviyo()
  .trackInitiateCheckout();
```

All methods:

```ts
// track Identify
await useAnalytics().withOrder(evtPayload).s2s.klaviyo().trackIdentify();

// track Transaction
await useAnalytics().withOrder(evtPayload).s2s.klaviyo().trackTransaction();

// track ProductAddToCart
await useAnalytics()
  .withOrder(evtPayload)
  .s2s.klaviyo()
  .trackProductAddToCart();

// track ProductRemoveFromCart
await useAnalytics()
  .withOrder(evtPayload)
  .s2s.klaviyo()
  .trackProductRemoveFromCart();

// track ProductItemView
await useAnalytics().withOrder(evtPayload).s2s.klaviyo().trackProductItemView();

// track ProductsItemView
await useAnalytics()
  .withOrder(evtPayload)
  .s2s.klaviyo()
  .trackProductsItemView();

// track Search
await useAnalytics().withOrder(evtPayload).s2s.klaviyo().trackSearch();

// track PageView
await useAnalytics().withOrder(evtPayload).s2s.klaviyo().trackPageView();

// track InitiateCheckout
await useAnalytics()
  .withOrder(evtPayload)
  .s2s.klaviyo()
  .trackInitiateCheckout();

// track NewProfile
await useAnalytics().withOrder(evtPayload).s2s.klaviyo().trackNewProfile();

// track ProfileResetPassword
await useAnalytics()
  .withOrder(evtPayload)
  .s2s.klaviyo()
  .trackProfileResetPassword();

// track ProfileLogIn
await useAnalytics().withOrder(evtPayload).s2s.klaviyo().trackProfileLogIn();

// track ProfileLogOut
await useAnalytics().withOrder(evtPayload).s2s.klaviyo().trackProfileLogOut();

// track ProfileSubscribeNL
await useAnalytics()
  .withOrder(evtPayload)
  .s2s.klaviyo()
  .trackProfileSubscribeNL();

// track TransactionRefund
await useAnalytics()
  .withOrder(evtPayload)
  .s2s.klaviyo()
  .trackTransactionRefund();

// track TransactionCancel
await useAnalytics()
  .withOrder(evtPayload)
  .s2s.klaviyo()
  .trackTransactionCancel();

// track TransactionFulfill
await useAnalytics()
  .withOrder(evtPayload)
  .s2s.klaviyo()
  .trackTransactionFulfill();

// track Custom
await useAnalytics().withOrder(evtPayload).s2s.klaviyo().trackCustom();
```

### 2.2.FB Pixel (Server+UI)

This examples shows how to send server-side (NextJs) fb events and then re-process then from the UI.

```tsx
import { GetServerSideProps } from "next";
import { useEffect } from "react";
import {
  EA_FB_Server_RePublish_Events,
  TFbNormalizedEventPayload,
} from "enhanced-analytics/apiTracker/facebook";
import useAnalytics, { configureAnalytics } from "enhanced-analytics";
import * as bizSdk from "facebook-nodejs-business-sdk";
import { GetServerSidePropsContext } from "next";

interface IShopProductResponse {
  eaFbEvents: any;
}

export default function AnyProductPage({
  eaFbEvents,
}: IShopProductResponse) {
    useEffect(() => {
      analytics
        .withPage({
          name: props.title,
          path: window.location.pathname,
        })
        .events.fb()
        .trackPageView();
    }, []);
  return (
    <div>
      <span>testing fb events</span>
      {* The component from EA, which is digesting handed server response *}
      <EA_FB_Server_RePublish_Events serverPayloads={props.eaFbEvents} />
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, }) => {
  // analytics
  const product = fetch(/* your api that fetches product data */);
  const ea = getServerEA(req); /* see NextJs configuration */
  const fbResp = await ea
    .withCatalog([
      {
        id: product.id,
        title: product.title,
        description: product.description,
        salePrice: roundToTwo(product.salePrice),
        price: product.salePrice || product.price,
        isSale: roundToTwo(product.salePrice) > 0,
        brand: product.brand,
        category: product.category,
        color: product.color,
        sku: product.sku,
        imageUrl: product.images.length > 0 ? product.images[0] : void 0,
        url: `https://my-store.com/any-product/${product.shortId}/${product.slug}`,
      },
    ])
    .s2s.fb()
    .trackProductItemView(); // server to server event

  return {
    props: {
      // @ts-ignore
      eaFbEvents: fbResp[0].value.payload
    },
  };
};

```

## 3 useAnalytics top methods

```ts
const ea = useAnalytics();

// set runtime user
ea.identify(user: T_EA_DataProfile);

// custom events
ea.withMisc(name: string, attributes?: Record<string, any>);

// ...TBD
ea.withPage(payload: T_EA_DataPage | Record<string, any> | null = null);
ea.withProfile(payload: T_EA_DataProfile | Record<string, any> | null = null);
ea.withCatalog(payload: (T_EA_DataProduct | Record<string, any>)[] | null = null);
ea.withBasket(payload: T_EA_DataBasket | Record<string, any> | null = null);
ea.withOrder(payload: T_EA_DataOrder | Record<string, any> | null = null);

// TBD
```

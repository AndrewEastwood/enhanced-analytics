# enhanced-analytics

A couple of convenient tools for populating dataLayer ecommerce event data or even more.

**integrated services**:\
&nbsp;&nbsp;✅ Google Analytics\
&nbsp;&nbsp;✅ Klaviyo <= requires `npm i -S klaviyo-api@2.11`\
&nbsp;&nbsp;✅ Facebook <= requires `npm i -S facebook-nodejs-business-sdk@13.0.0` \
&nbsp;&nbsp;🚣 FullStory (soon)

---

## 1 Configure (UI Side)

```typescript
import { useEffect } from 'react';
import { configureAnalytics, useAnalytics } from 'enhanced-analytics';
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
      defaultCatalogName: `${activeStore.name} Landing Products`,
      defaultBasketName: 'Shopping Cart',

      // you may have your own data structure
      // therefore we need it converted for the lib here
      resolvers: {
        // custom data transformation configuration
        // @ts-ignore
        product: (p: IDataProduct, viewOrder: number) => {
          const res: EATypes.TDataProduct = {
            id: p.id,
            brand: p.seller,
            category:
              $store.getState().categoryItems.find((c) => c.id === p.categoryId)
                ?.title || 'unresolved',
            description: p.description,
            isSale: !!p.promo,
            price: p.price,
            salePrice: p.price,
            title: p.title,
            sku: p.sku,
            viewOrder: viewOrder,
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
        order: (p: IDataOrderWithTransaction) => {
          const res: EATypes.TDataOrder = {
            id: p.id,
            coupon: p.coupon,
            dateCreated: p.dateCreated,
            revenue: p.costsDetails.net,
            status: p.status,
            tax: 0,
            payment: {
              type: p.paymentType,
            },
            products: getOrderFeaturesList(
              p.features,
              $store.getState().productItems
            ).map(mapCartItemToAnalytics),
            quantity: p.features.reduce((r, v) => r + v.q, 0),
            customer: {
              email: '',
              firstName: p.customerFullName,
              lastName: '',
              phone: p.customerPhone,
              address: {
                street: p.customerAddress,
              },
            },
            shipping: {
              cost: p.costsDetails.feeValue,
              name: p.deliveryMethod,
              address: {
                street: p.customerAddress,
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

## 1.2 Use It

### 1.2.GoogleAnalytics

... somewhere in components:

```typescript
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
      .events.getEECCheckoutList()
      .when(() => true /* or your condition */)
      .push(window); // <- inject event into the dataLayer (config dataLayerName default is 'dataLayer');

    //
    // Google Analytics: track search/on-page product items
    //
    analytics
      .withCatalog(/* your array of goods; any custom data[] or TDataProduct[] */)
      // ^ the resolver.product is being invoked over the each item in the given collection
      .events.getEECProductsList()
      .when(() => myProductItems.length > 0)
      .push(window);

    //
    // Google Analytics: track order creation
    //
    analytics
      .withOrder(/* TDataOrder or any custom object */)
      // ^ invokes resolver.order
      .events.getEECPurchased()
      .when(() => !thisOrderWasSeen) // why not, implement your logic, that prevents duplicated events
      .push(window);

    // and few more things like:
    analytics.withPage();

    // and
    analytics.withProfile();
  }, []);

  return <></>;
};
```

### 1.2.Klaviyo UI

... docs are in progress

### 1.2.FB Events UI

... docs are in progress

## 2 Configure (API Side)

Simple snippet of configuration for Express.Js

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
          name: req.baseUrl,
          path: req.path,
          title: 'Main Page',
          url: `${req.protocol}://${req.hostname}${req.originalUrl}`,
        };
      },
      session() {
        return {
          agent: req.headers['user-agent'],
          fbp: req.cookies['_fbp'],
          ip: req.ip,
        };
      },
    }),
  })
);
```

## 2.1 Use It

### 2.2.Klaviyo API

... docs are in progress

Track new order:

```typescript
import useAnalytics from 'enhanced-analytics';

const evtPayload = { order, products };
// you can define your own payload
// and handle it at your resolvers.order function
await useAnalytics()
  .withOrder(evtPayload)
  .sendToServer.klaviyo.trackTransaction();
```

### 2.2.FB Events API

... docs are in progress

# enhanced-analytics
A couple of convenient tools for populating dataLayer ecommerce event data or even more.

**integrated services**:\
&nbsp;&nbsp;✅ Google Analytics\
&nbsp;&nbsp;✅ Klaviyo\
&nbsp;&nbsp;✅ Facebook\
&nbsp;&nbsp;🚣 FullStory (soon)

---
## 1 Configure 

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
      map: {
        // custom data transformation configuration
        // @ts-ignore
        product: (p: IDataProduct, viewOrder: number) => {
          const res: EATypes.TDataProduct = {
            id: p.id,
            brand: p.seller,
            category:
              $store.getState().categoryItems.find((c) => c.id === p.categoryId)?.title ||
              'unresolved',
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
            lastRemoved: diff?.lastRemovedItems.map(mapCartItemToAnalytics) || [],
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
            products: getOrderFeaturesList(p.features, $store.getState().productItems).map(
              mapCartItemToAnalytics,
            ),
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
}
```


## 2 Use It
### 2.GoogleAnalytics
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
      .withBasket(/* TDataBasket|Record<any>|null */) // <- this can be empty or TDataBasket AND map.basket is being invoked as well
      .events.getEECCheckoutList()
      .when(() => true /* or your condition */)
      .push(window); // <- inject event into the dataLayer (config dataLayerName default is 'dataLayer');

    // 
    // Google Analytics: track search/on-page product items
    //
    analytics
      .withCatalog(/* your array of goods; any custom data[] or TDataProduct[] */)
      // ^ the map.product is being invoked over the each item in the given collection
      .events.getEECProductsList()
      .when(() => myProductItems.length > 0)
      .push(window);

    // 
    // Google Analytics: track order creation
    //
    analytics
      .withOrder(/* TDataOrder or any custom object */)
      // ^ invokes map.order
      .events.getEECPurchased()
      .when(() => !thisOrderWasSeen) // why not, implement your logic, that prevents duplicated events
      .push(window);

    // and few more things like:
    analytics.withPage();

    // and
    analytics.withProfile();

  }, []);

  return <></>;
}
```

### 2.Klaviyo (Server Side)
... docs are in progress
### 2.FB Events (Server Side)
... docs are in progress

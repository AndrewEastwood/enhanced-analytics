# enhanced-analytics
Couple of convenient tools for populating dataLayer ecommerce event data.  



Here I will describe how to use this tool soon

---
## 1 Configure 

```
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
Then somewhere in a component:
```
import useAnalytics from 'enhanced-analytics';

const MyComponent = () => {
  const analytics = useAnalytics();

  useEffect(() => {
    analytics
      .withBasket(null)
      .events.getEECCheckoutList()
      .when(() => true /* or your condition */)
      .push(window); // <- inject event into the dataLayer (config dataLayerName default is 'dataLayer')
  }, []);

  return <></>;
}
```

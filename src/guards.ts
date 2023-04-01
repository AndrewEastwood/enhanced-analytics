import { T_EA_DataAddress, T_EA_Payment, T_EA_Shipping } from './shared';
import {
  T_EA_DataProduct,
  T_EA_DataPage,
  T_EA_DataProfile,
  T_EA_DataBasket,
  T_EA_DataOrder,
} from './shared';

export const isNativePayloadPage = (payload: any): payload is T_EA_DataPage => {
  return Object.keys(payload ?? {}).every((k) =>
    ['id', 'title', 'name', 'path'].includes(k)
  );
};

export const isNativePayloadProfile = (
  payload: any
): payload is T_EA_DataProfile => {
  return Object.keys(payload ?? {}).every((k) =>
    ['firstName', 'email'].includes(k)
  );
};

export const isNativePayloadAddress = (
  payload: any
): payload is T_EA_DataAddress => {
  return Object.keys(payload ?? {}).every((k) =>
    [
      'countryCode',
      'country',
      'city',
      'state',
      'postcode',
      'region',
      'street',
    ].includes(k)
  );
};

export const isNativePayloadShipping = (
  payload: any
): payload is T_EA_Shipping => {
  const shallowMatch = Object.keys(payload ?? {}).every((k) =>
    ['name', 'cost', 'address'].includes(k)
  );
  const subMatchShippingAddress =
    shallowMatch && payload ? isNativePayloadAddress(payload.address) : false;
  return shallowMatch && subMatchShippingAddress;
};

export const isNativePayloadPayment = (
  payload: any
): payload is T_EA_Payment => {
  return Object.keys(payload ?? {}).every((k) => ['type'].includes(k));
};

export const isNativePayloadOrder = (
  payload: any
): payload is T_EA_DataOrder => {
  const shallowMatch = Object.keys(payload ?? {}).every((k) =>
    [
      'id',
      'revenue',
      'tax',
      'quantity',
      'coupon',
      'products',
      'dateCreated',
      'status',
      'shipping',
      'customer',
      'payment',
    ].includes(k)
  );
  const subMatchProducts =
    shallowMatch && payload ? isNativePayloadProducts(payload.products) : false;
  const subMatchPayment =
    shallowMatch && payload ? isNativePayloadPayment(payload.payment) : false;
  const subMatchShipping =
    shallowMatch && payload ? isNativePayloadShipping(payload.shipping) : false;
  const subMatchCustomer =
    shallowMatch && payload ? isNativePayloadProfile(payload.customer) : false;

  return (
    shallowMatch &&
    subMatchPayment &&
    subMatchProducts &&
    subMatchShipping &&
    subMatchCustomer
  );
};

export const isNativePayloadBasket = (
  payload: any
): payload is T_EA_DataBasket => {
  const shallowMatch = Object.keys(payload ?? {}).every((k) =>
    [
      'total',
      'quantity',
      'coupon',
      'products',
      'lastAdded',
      'lastRemoved',
    ].includes(k)
  );

  const subMatch =
    shallowMatch && payload
      ? [payload.products, payload.lastAdded, payload.lastRemoved].every(
          isNativePayloadProducts
        )
      : false;

  return shallowMatch && subMatch;
};

export const isNativePayloadProduct = (
  payload: any
): payload is T_EA_DataProduct => {
  return Object.keys(payload ?? {}).every((k) =>
    [
      'id',
      'title',
      'description',
      'price',
      'salePrice',
      'isSale',
      'brand',
      'category',
    ].includes(k)
  );
};
export const isNativePayloadProducts = (
  payloads: any[] | null
): payloads is T_EA_DataProduct[] => {
  return (payloads ?? []).every(isNativePayloadProduct);
};

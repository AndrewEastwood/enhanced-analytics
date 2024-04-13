import { getConfig } from './config';
import {
  type T_EA_DataBasket,
  type T_EA_DataOrder,
  type T_EA_DataProduct,
} from './shared';

export const isBrowserMode = typeof globalThis.window !== 'undefined';

const getEvtUUIDStr = () => {
  const c = getConfig();
  return `_uuid_${c?.resolvers?.eventUUID?.()}`;
};

const getEventNameOfIdentify = () => {
  return '';
};

const getEventNameOfCustom = (e: string) => {
  return `new_custom_of_${e}${getEvtUUIDStr()}`;
};

const getEventNameOfTransaction = (order: T_EA_DataOrder) => {
  return `new_order_of_${order.id}${getEvtUUIDStr()}`;
};

const getEventNameOfSubscription = (email: string) => {
  return `new_sub_of_${email}${getEvtUUIDStr()}`;
};

const getEventNameOfLead = (modifier: string) => {
  return `new_lead_of_${modifier}${getEvtUUIDStr()}`;
};

const getEventNameOfProductAddToCart = (p: T_EA_DataProduct) => {
  return `add_product_of_${p.id}_q${p.quantity}${getEvtUUIDStr()}`;
};

const getEventNameOfProductRemoveFromCart = (p: T_EA_DataProduct) => {
  return `rem_product_of_${p.id}_q${p.quantity}${getEvtUUIDStr()}`;
};

const getEventNameOfProductItemView = (product: T_EA_DataProduct) => {
  return `view_product_of_${product.id}${getEvtUUIDStr()}`;
};

const getEventNameOfProductItemWish = (product: T_EA_DataProduct) => {
  return `wish_product_of_${product.id}${getEvtUUIDStr()}`;
};

const getEventNameOfPaymentInfo = (name: string) => {
  return `info_payment_of_${name}${getEvtUUIDStr()}`;
};

const getEventNameOfShippingInfo = (name: string) => {
  return `info_shipoping_of_${name}${getEvtUUIDStr()}`;
};

const getEventNameOfSearch = (
  searchTerm: string,
  products: T_EA_DataProduct[]
) => {
  return `search_of_${searchTerm}_found${products.length}${getEvtUUIDStr()}`;
};

const getEventNameOfPageView = () => {
  const c = getConfig();
  const page = c?.resolvers?.page?.();
  return `page_view_of_${encodeURIComponent(
    page?.name || 'root'
  )}${getEvtUUIDStr()}`;
};

const getEventNameOfInitiateCheckout = (basket: T_EA_DataBasket) => {
  return `init_checkout_of_p${basket.quantity}_${round(basket.total).toFixed(
    2
  )}${getEvtUUIDStr()}`;
};

const getEventNameOfNewProfile = () => {
  return '';
};

export const digestMessage = async (message: string) => {
  const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8); // hash the message
  const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(''); // convert bytes to hex string
  return hashHex;
};

export const round = (num?: number | string, precision = 2) => {
  return +(
    Math.round(new Number((num ?? '0') + 'e+' + precision).valueOf()) +
    'e-' +
    precision
  );
};

export {
  getEventNameOfCustom,
  getEventNameOfIdentify,
  getEventNameOfTransaction,
  getEventNameOfProductAddToCart,
  getEventNameOfProductRemoveFromCart,
  getEventNameOfProductItemWish,
  getEventNameOfProductItemView,
  getEventNameOfSearch,
  getEventNameOfPageView,
  getEventNameOfInitiateCheckout,
  getEventNameOfNewProfile,
  getEventNameOfSubscription,
  getEventNameOfLead,
  getEventNameOfPaymentInfo,
  getEventNameOfShippingInfo,
  // Basket,
  // Order,
  // Catalog,
  // Page,
  // Profile,
};

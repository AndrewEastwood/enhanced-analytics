import { type TKalviyoSdk } from './apiTracker/klaviyo';

export type TTrackerRunMode = {
  server?: boolean;
};

export type T_EA_DataCustomEvent = {
  name: string;
  attributes?: Record<string, string>;
};

export type T_EA_DataPage = {
  name: string;
  path: string;
  url?: string;
  extras?: Record<string, string | number | boolean>;
};

export type T_EA_DataAddress = {
  countryCode?: string;
  country?: string;
  state?: string;
  city?: string;
  street?: string;
  street2?: string;
  postcode?: string;
  region?: string;
  regionCode?: string;
  timezone?: string;
  phone?: string;
};

export type T_EA_DataSession = {
  ip?: string;
  fbp?: string;
  agent?: string;
};

export type T_EA_DataProfile = {
  id?: string | number | null;
  firstName: string;
  lastName?: string;
  title?: string;
  isNew?: string;
  phone?: string;
  email: string;
  address?: T_EA_DataAddress;
  organization?: string;
  avatarUrl?: string;
  extraProps?: Record<string, string>;
  loginProvider?: string;
  url?: string;
};

export type T_EA_DataProduct = {
  id: string | number;
  title: string;
  description: string;
  price: number;
  salePrice?: number;
  isSale?: boolean;
  brand: string;
  category: string;
  sku?: string;
  variant?: string;
  color?: string;
  size?: string;
  size_type?: 'regular' | 'petite' | 'plus' | 'tall' | 'big' | 'maternity';
  size_system?:
    | 'AU'
    | 'BR'
    | 'CN'
    | 'DE'
    | 'EU'
    | 'FR'
    | 'IT'
    | 'JP'
    | 'MEX'
    | 'UK'
    | 'US';
  gender?: 'male' | 'female' | 'unisex';
  ageGroup?: 'newborn' | 'infant' | 'toddler' | 'kids' | 'adult';
  condition?:
    | 'new'
    | 'refurbished'
    | 'used'
    | 'used_like_new'
    | 'used_good'
    | 'used_fair'
    | 'cpo'
    | 'open_box_new';
  metrics?: number[];
  dimensions?: string[];
  list?: string;
  viewOrder?: number;
  url?: string;
  imageUrl?: string;
  imageUrls?: string[];
  inStock?: number;
  groupId?: string | number;
  // sizings
  dimLength?: string | number;
  dimWidth?: string | number;
  dimHeight?: string | number;
  dimWeight?: string | number;
  dimShippingLength?: string | number;
  dimShippingWidth?: string | number;
  dimShippingHeight?: string | number;
  dimShippingWeight?: string | number;
  // basket features
  total?: number;
  quantity?: number;
  // location offline name (id)
  gaLocationId?: string;
  categories?: string[];
  // A product affiliation to designate a supplying company or brick and mortar store location.
  // Note: `affiliation` is only available at the item-scope.
  affiliation?: string;
  google_product_category?: string;
  fb_product_category?: string;
  material?: string;
  pattern?: string;
  shipping?: string;
  shipping_weight?: string;
};

export type T_EA_DataBasket = {
  total: number;
  quantity: number;
  coupon: null | string;
  products: T_EA_DataProduct[];
  lastAdded: T_EA_DataProduct[];
  lastRemoved: T_EA_DataProduct[];
};

export enum ETrackers {
  Facebook = 'fb',
  Klaviyo = 'klaviyo',
  FullStory = 'fullstory',
  GoogleAnalytics = 'ga',
}

export type TEECParams = {
  evName?: string;
  listName?: string;
  page_title?: string;
  page_location?: string;
};

type TResolvers = {
  identityStore?: (
    key?: string,
    val?: string
  ) => string | Record<string, any> | void;
  session?: () => T_EA_DataSession;
  eventUUID?: () => string | number;
  product?: (data?: any) => T_EA_DataProduct;
  order?: (data?: any) => T_EA_DataOrder;
  basket?: (data?: any) => T_EA_DataBasket;
  profile?: (data?: any) => T_EA_DataProfile | null;
  page?: (data?: any) => T_EA_DataPage;
};

export type TSettings = {
  _configured: boolean;
  affiliation: string;
  description?: string;
  absoluteURL: string;
  currency: string;
  debug?: boolean;
  feeds?: {
    klaviyo?: {
      feedUrl?: string;
    };
    facebook?: {
      feedUrl?: string;
    };
  };
  integrations?: {
    [ETrackers.Facebook]?: {
      enabled: boolean;
      sdk?: any;
      pixelId: null | string;
      token?: null | string;
      testCode?: null | string;
      hashUser?: boolean;
      rules?: {
        metrics?: Partial<Record<keyof TTrackersEvents, boolean>>;
      };
    };
    [ETrackers.FullStory]?: {
      enabled: boolean;
      orgId: string | null;
      rules?: {
        metrics?: {};
      };
    };
    [ETrackers.Klaviyo]?: {
      enabled: boolean;
      siteId?: null | string;
      token?: null | string;
      sdk?: null | TKalviyoSdk;
      events?: {
        onEvent?: (
          eventPayloads: any[],
          state: { isIdentified: boolean }
        ) => void;
      };
      rules?: {
        metrics?: Partial<Record<keyof TTrackersEvents, boolean>>;
      };
    };
    [ETrackers.GoogleAnalytics]?: {
      enabled: boolean;
      trackId?: null | string;
      ga4?: true;
      defaultCatalogName?: string;
      defaultBasketName?: string;
      dataLayerName?: string;
      rules?: {
        metrics?: {};
      };
    };
  };
  links?: {
    resetPassword?: string;
  };
  resolvers?: TResolvers;
};

export type T_EA_Shipping = {
  cost: number;
  name: string;
  address: T_EA_DataAddress;
};

export type T_EA_Payment = {
  type: string;
};

export type T_EA_DataOrder = {
  id: string | number;
  revenue: number;
  subtotal?: number;
  discountValue?: number;
  tax: number;
  quantity: number;
  coupon: null | string;
  products: T_EA_DataProduct[];
  dateCreated: number;
  status: string;
  shipping: T_EA_Shipping;
  billing?: T_EA_DataAddress;
  customer: T_EA_DataProfile;
  payment: T_EA_Payment;
  trackingNo?: string;
  url?: string;
};

export type TServerEventResponse<
  T = any,
  P = Record<string, any> | null | void
> = {
  message: null | string;
  payload: P[];
  response: null | T;
  browserData?: string;
};

export type TTrackersEvents = {
  trackIdentify(): TServerEventResponse;
  trackTransaction(): TServerEventResponse;
  trackProductAddToCart(): TServerEventResponse;
  trackProductRemoveFromCart(): TServerEventResponse;
  trackProductItemView(): TServerEventResponse;
  trackProductsItemView(): TServerEventResponse;
  trackSearch(): TServerEventResponse;
  trackPageView(): TServerEventResponse;
  trackInitiateCheckout(): TServerEventResponse;
  trackNewProfile(): TServerEventResponse;
  trackProfileResetPassword(): TServerEventResponse;
  trackProfileLogIn(): TServerEventResponse;
  trackProfileLogOut(): TServerEventResponse;
  trackProfileSubscribeNL(): TServerEventResponse;
  trackTransactionRefund(): TServerEventResponse;
  trackTransactionCancel(): TServerEventResponse;
  trackTransactionFulfill(): TServerEventResponse;
  trackCustom(): TServerEventResponse;
  trackAddPaymentInfo(): TServerEventResponse;
  trackAddShippingInfo(): TServerEventResponse;
  trackAddToWishlist(): TServerEventResponse;
  trackViewBasket(): TServerEventResponse;
};

export type TEvtType<TPayload> = {
  when: (check: () => boolean) => TEvtType<TPayload>;
  push: () => TEvtType<TPayload>;
  value: () => TPayload;
  collected: () => TPayload[];
};

import { Request } from "express"

export type TDataPage = {
  id: string|number;
  title: string;
  path: string;
}

export type TDataAddress = {
  countryCode?: string;
  country?: string;
  state?: string;
  city?: string;
  street?: string;
  postcode?: string;
  region?: string;
};

export type TDataProfile = {
  // id?: string|number;
  // name: string;
  // firstName: string;
  // lastName: string;
  // phone: null|string;
  // email: null|string;
  id?: string|number|null;
  firstName: string;
  lastName?: string;
  isNew?: string;
  phone: string;
  email: string;
  address?: TDataAddress;
}

export type TDataProduct = {
  id: string|number;
  title: string;
  description: string;
  price: number;
  salePrice: number;
  isSale: boolean;
  brand: string;
  category: string;
  sku?: string;
  variant?: string;
  color?: string;
  size?: string;
  metrics?: number[];
  dimensions?: string[];
  list?: string;
  viewOrder?: number;
  url?: string;
  imageUrl?: string;
  // basket features
  total?: number;
  quantity?: number;
}

export type TDataBasket = {
  total: number;
  quantity: number;
  coupon: null|string;
  products: TDataProduct[];
  lastAdded: TDataProduct[];
  lastRemoved: TDataProduct[];
}

export enum ETrackers {
  Facebook = 'fb',
  Klaviyo = 'klaviyo',
  GoogleEEC = 'geec',
}

export type TEECParams = {
  evName?: string;
  listName?: string;
}

export type TSettings = {
  affiliation: string;
  absoluteURL: string;
  currency: string;
  defaultCatalogName: string;
  defaultBasketName: string;
  dataLayerName: string;
  serverAnalytics: {
    testing: boolean;
    [ETrackers.Facebook]?: {
      enabled: boolean;
      sdk: any;
      pixelId: null|string;
      token: null|string;
      testCode: null|string;
    },
    [ETrackers.Klaviyo]?: {
      enabled: boolean;
      sdk: any;
      siteId: null|string;
      token: null|string;
    },
    links: {
      resetPassword: string,
    },
    resolvers: {
      userData: (request:Request) => TDataProfile|null,
      serverEventUUID: (request:Request) => string|number,
    };
  };
  map: {
    product?: (data:any) => TDataProduct;
    order?: (data:any) => TDataOrder;
    basket?: (data:any) => TDataBasket;
    profile?: (data:any) => TDataProfile;
    page?: (data:any) => TDataPage;
  };
}

export type TDataOrder = {
  id: string|number;
  revenue: number;
  tax: number;
  quantity: number;
  coupon: null|string;
  products: TDataProduct[];
  dateCreated: number;
  status: string;
  shipping: {
    cost: number;
    name: string;
    address: TDataAddress;
  },
  customer: TDataProfile,
  payment: {
    type: string;
  };
};

export type TEvtType<TPayload> = {
  when: (check:() => boolean) => TEvtType<TPayload>;
  push: (w: Window & typeof globalThis) => TEvtType<TPayload>;
  value: () => TPayload;
};

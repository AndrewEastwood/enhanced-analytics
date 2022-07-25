import { Request } from "express"

export type TDataPage = {
  id: string|number;
  title: string;
  path: string;
}

export type TDataAddress = {
  countryCode: string;
  country: string;
  state: string;
  city: string;
  street: string;
  postcode: string;
  region: string;
};

export type TDataProfile = {
  // id: string|number;
  // name: string;
  // firstName: string;
  // lastName: string;
  // phone: null|string;
  // email: null|string;
  id?: string|number|null;
  firstName: string;
  lastName: string;
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
  quantity?: string;
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
  links: {
    resetPassword: string,
  },
  resolvers: {
    userData: (request:Request) => TDataProfile|null,
  };
  analytics: {
    testing: boolean;
    [ETrackers.Facebook]: {
      enabled: boolean;
      pixelId: null|string;
      token: null|string;
      testCode: null|string;
    },
    [ETrackers.Klaviyo]: {
      enabled: boolean;
      siteId: null|string;
      token: null|string;
    }
  };
  map: {
    product: (data:Record<string,any>) => TDataProduct;
    order: (data:Record<string,any>) => TDataOrder;
    basket: (data:Record<string,any>) => TDataBasket;
    profile: (data:Record<string,any>) => TDataProfile;
    page: (data:Record<string,any>) => TDataPage;
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
}
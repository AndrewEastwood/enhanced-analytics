import { Request } from 'express';
import * as fbSdk from 'facebook-nodejs-business-sdk';

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
  postcode?: string;
  region?: string;
  timezone?: string;
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
  url?: string;
};

export type T_EA_DataProduct = {
  id: string | number;
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
  GoogleEEC = 'geec',
  FullStory = 'fullstory',
  GoogleAnalytics = 'ga',
}

export type TEECParams = {
  evName?: string;
  listName?: string;
};

type TResolvers = {
  session?: () => T_EA_DataSession;
  eventUUID?: (request?: Request) => string | number;
  product?: (data?: any) => T_EA_DataProduct[];
  order?: (data?: any) => T_EA_DataOrder;
  basket?: (data?: any) => T_EA_DataBasket;
  profile?: (data?: any) => T_EA_DataProfile | null;
  page?: (data?: any) => T_EA_DataPage;
};

export type TSettings = {
  affiliation: string;
  absoluteURL: string;
  currency: string;
  defaultCatalogName: string;
  defaultBasketName: string;
  dataLayerName: string;
  integrations?: {
    testing: boolean;
    evtUuid?: {
      exposeInResponse?: boolean;
      cookieName?: string;
    };
    userIdentification?: {
      reqBodyKey?: string;
    };
    [ETrackers.Facebook]?: {
      enabled: boolean;
      sdk: typeof fbSdk | null;
      pixelId: null | string;
      token: null | string;
      testCode: null | string;
    };
    [ETrackers.FullStory]?: {
      enabled: boolean;
      // sdk: {
      //   init: (setupVars?: Record<string, any>) => void;
      //   identify?: (uid: string, userVars?: Record<string, any>) => void;
      //   event?: (
      //     eventName: string,
      //     eventProperties?: Record<string, any>
      //   ) => void;
      //   setUserVars?: (userVars?: Record<string, any>) => void;
      //   setVars?: (scope: string, pageProperties?: Record<string, any>) => void;
      // } | null;
      orgId: string | null;
    };
    [ETrackers.Klaviyo]?: {
      enabled: boolean;
      siteId?: null | string;
      token?: null | string;
      sdk?: null | {
        ConfigWrapper?: (string) => void;
        Events: {
          _unprocessed?: any[];
          createEvent: (payload: any) => Promise<any>;
        };
        Profiles: {
          _unprocessed?: any[];
          getProfiles?: (filter: any) => Promise<{ body: { data: any[] } }>;
          createProfile: (payload: any) => Promise<any>;
        };
      };
      events?: {
        onEvent?: (
          eventPayloads: any[],
          state: { isIdentified: boolean }
        ) => void;
      };
    };
    [ETrackers.GoogleAnalytics]?: {
      enabled: boolean;
      trackId?: null | string;
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
  tax: number;
  quantity: number;
  coupon: null | string;
  products: T_EA_DataProduct[];
  dateCreated: number;
  status: string;
  shipping: T_EA_Shipping;
  customer: T_EA_DataProfile;
  payment: T_EA_Payment;
  url?: string;
};

export type TServerEventResponse<T = any> = {
  message: null | string;
  payload: (Record<string, any> | null | void)[];
  response: null | T;
};

export type TEvtType<TPayload> = {
  when: (check: () => boolean) => TEvtType<TPayload>;
  push: () => TEvtType<TPayload>;
  value: () => TPayload;
  collected: () => TPayload[];
};

import { isBrowserMode } from '../utils';
import { type T_EA_DataProfile } from '../shared';
import cookies from '../cookies';
import { getConfig } from '../config';
import { isNativePayloadProfile } from '../guards';

const lastIdentity = new Set<T_EA_DataProfile>();
const scope = 'EA_Identity';

const getStore = () => {
  const kv = new Map<string, any>();
  const identityStore = getConfig().resolvers?.identityStore;
  const _store = identityStore
    ? identityStore
    : isBrowserMode
    ? cookies.getSet // use cookies as default browser storage
    : null;
  return {
    getItem(k: string) {
      return (_store ? _store(k) : kv.get(k)) as string | null;
    },
    setItem(k: string, v: any) {
      _store ? _store(k, v) : kv.set(k, v);
      return this.getItem(k);
    },
  };
};

export const restore = () => {
  const savedId = getStore().getItem(scope);
  lastIdentity.clear();
  savedId ? lastIdentity.add(JSON.parse(savedId)) : void 0;
};

export const resolveUser = (
  profile?: T_EA_DataProfile | null
): T_EA_DataProfile | null => {
  restore();
  const customResolver = getConfig().resolvers?.profile;
  const lastId = lastIdentity.values().next().value as T_EA_DataProfile | null;
  const userToStore = customResolver
    ? customResolver({
        input: profile,
        lastIdentity: lastId,
      })
    : isNativePayloadProfile(profile)
    ? profile
    : isNativePayloadProfile(lastId)
    ? lastId
    : null;
  if (isNativePayloadProfile(userToStore) && !userToStore?.isAnonymous) {
    store(userToStore);
  }
  return userToStore;
};

export const store = (u: T_EA_DataProfile) => {
  lastIdentity.clear();
  u ? lastIdentity.add(u) : void 0;
  getStore().setItem(scope, JSON.stringify(u ?? {}));
};

import { isBrowserMode } from '../utils';
import { T_EA_DataProfile } from '../shared';

const lastIdentity = new Set<T_EA_DataProfile>();
const scope = 'EA_Identity';

export const restore = () => {
  const savedId = localStorage.getItem(scope);
  lastIdentity.clear();
  savedId ? lastIdentity.add(JSON.parse(savedId)) : void 0;
};

export const resolveUser = (
  profile?: T_EA_DataProfile | null,
  customResolver?: () => T_EA_DataProfile | null
) => {
  restore();
  const u =
    (profile ? profile : customResolver?.()) ??
    (lastIdentity.values().next().value as T_EA_DataProfile);
  store(u);
  return u;
};

export const store = (u: T_EA_DataProfile) => {
  lastIdentity.clear();
  u ? lastIdentity.add(u) : void 0;
  isBrowserMode && u ? localStorage.setItem(scope, JSON.stringify(u)) : void 0;
};

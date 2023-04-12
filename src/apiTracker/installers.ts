import { ETrackers, TSettings } from '../shared';
import { installFB } from './facebook';
import { installFS } from './fullstory';
import { installGTM } from './ga';
import { installK } from './klaviyo';
import { isBrowserMode } from '../utils';

export const installer = {
  [ETrackers.Facebook]: (s: TSettings) =>
    installFB(s.integrations?.fb?.pixelId),
  [ETrackers.Klaviyo]: (s: TSettings) =>
    installK(s.integrations?.klaviyo?.siteId),
  [ETrackers.FullStory]: (s: TSettings) =>
    installFS(s.integrations?.fullstory?.orgId),
  [ETrackers.GoogleAnalytics]: (s: TSettings) =>
    installGTM(
      s.integrations?.ga?.trackId,
      s.dataLayerName,
      s.integrations?.testing
    ),
};

const installedTrackers = new Set<ETrackers>();
export const installBrowserTrackers = async (s: TSettings) => {
  isBrowserMode
    ? await Promise.allSettled(
        Object.values(ETrackers)
          .filter((v) => !installedTrackers.has(v))
          .map((v) => {
            console.debug('[EA] installing browser tracker of ' + v);
            return s.integrations?.[v]?.enabled && installer[v]
              ? (installer[v](s), installedTrackers.add(v))
              : Promise.resolve();
          })
      )
    : void 0;
};

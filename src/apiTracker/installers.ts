import { ETrackers, type TSettings } from '../shared';
import { installFB } from './facebook';
import { installFS } from './fullstory';
import { installGTM } from './ga';
import { installK } from './klaviyo';
import { installTT } from './tiktok';
import { isBrowserMode } from '../utils';
import { log } from '../log';

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
      s.integrations?.ga?.dataLayerName,
      s.debug
    ),
  [ETrackers.TikTok]: (s: TSettings) =>
    installTT(
      s.integrations?.tiktok?.pixelId,
      s.integrations?.tiktok?.autoTrackPageViews
    ),
};

const installedTrackers = new Set<ETrackers>();
export const installBrowserTrackers = async (s: TSettings) => {
  isBrowserMode
    ? await Promise.allSettled(
        Object.values(ETrackers)
          .filter((v) => !installedTrackers.has(v))
          .map((v) => {
            return s.integrations?.[v]?.enabled && installer[v]
              ? (installedTrackers.add(v),
                log('[EA:Installer] installing browser tracker of ' + v),
                installer[v](s))
              : Promise.resolve();
          })
      )
    : void 0;
};

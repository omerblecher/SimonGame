import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AdMob, BannerAdPluginEvents } from '@capacitor-community/admob';

const BANNER_HEIGHT_DEFAULT = 50; // standard banner dp, pre-reserves before load

export function useBannerHeight(): number {
  const [bannerHeight, setBannerHeight] = useState<number>(
    Capacitor.isNativePlatform() ? BANNER_HEIGHT_DEFAULT : 0,
  );

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handle: { remove: () => Promise<void> } | null = null;

    AdMob.addListener(BannerAdPluginEvents.SizeChanged, (size) => {
      setBannerHeight(size.height);
    }).then((h) => {
      handle = h;
    });

    return () => {
      handle?.remove();
    };
  }, []);

  return bannerHeight;
}

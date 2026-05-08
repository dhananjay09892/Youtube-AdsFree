// YouTubeWebView — thin wrapper around SiteWebView that passes in the
// YouTube SiteConfig. All existing callers (HomeScreen, WatchScreen, etc.)
// continue to import and use this component without any changes.
//
// The full implementation now lives in SiteWebView.tsx; site-specific
// selectors and config live in config/youtube.site.ts.

import React from 'react';
import {SiteWebView} from './SiteWebView';
import {youtubeConfig} from '../config/youtube.site';

export interface YouTubeWebViewProps {
  path?: string;
}

export function YouTubeWebView({path = '/'}: YouTubeWebViewProps): React.ReactElement {
  // Derive a stable tabId from the path so every instance writes its current
  // URL to the store, enabling the TabBar auto-hide logic.
  const tabId = `youtube:${path}`;
  return <SiteWebView site={youtubeConfig} path={path} tabId={tabId} />;
}

// VideoCard — a thumbnail + title + metadata row used on Home, Search, and
// the recommendations list on the Watch screen.

import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {colors, radius, spacing, typography} from '../theme';

export interface VideoCardProps {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  viewCount: string;
  duration: string;
  publishedAt: string;
  onPress: () => void;
}

export function VideoCard(props: VideoCardProps): React.ReactElement {
  const {title, channelName, thumbnailUrl, viewCount, duration, publishedAt, onPress} = props;
  const [imageFailed, setImageFailed] = React.useState<boolean>(false);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Play ${title} from ${channelName}`}>
      <View style={styles.thumbWrapper}>
        {imageFailed ? (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Text style={styles.fallbackText}>No preview</Text>
          </View>
        ) : (
          <Image
            source={{uri: thumbnailUrl}}
            style={styles.thumb}
            resizeMode="cover"
            onError={() => setImageFailed(true)}
          />
        )}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{duration}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.channel} numberOfLines={1}>
        {channelName}
      </Text>
      <Text style={styles.meta} numberOfLines={1}>
        {viewCount} · {publishedAt}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    padding: spacing.sm,
  },
  thumbWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.background.tertiary,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
  },
  durationBadge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: colors.background.overlay,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  durationText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
  },
  title: {
    color: colors.text.primary,
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    marginTop: spacing.sm,
  },
  channel: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
    marginTop: spacing.xs,
  },
  meta: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
});

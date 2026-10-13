import { useEffect, useState } from 'react';
import { Image, Platform, type ImageSourcePropType } from 'react-native';
import { cutoutReady, studioCutout } from './cutout';

function sourceUri(source: ImageSourcePropType): string | null {
  if (typeof source === 'number') return Image.resolveAssetSource(source)?.uri ?? null;
  if (Array.isArray(source)) return source[0] ? sourceUri(source[0]) : null;
  if (source && typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') return source.uri;
  return null;
}

/** Flat studio backdrops become transparent on web. The original is kept when the backdrop is not flat. */
export function useCutout(source: ImageSourcePropType): ImageSourcePropType | null {
  const uri = sourceUri(source);
  const [out, setOut] = useState<ImageSourcePropType | null>(() => {
    if (Platform.OS !== 'web') return source;
    const cached = uri ? cutoutReady(uri) : null;
    return cached ? { uri: cached } : null;
  });
  useEffect(() => {
    let live = true;
    if (Platform.OS !== 'web') {
      setOut(source);
      return;
    }
    if (!uri) {
      setOut(source);
      return;
    }
    const cached = cutoutReady(uri);
    if (cached) {
      setOut(cached === uri ? source : { uri: cached });
      return;
    }
    setOut(null);
    studioCutout(uri).then((next) => {
      if (live) setOut(next === uri ? source : { uri: next });
    }).catch(() => {
      if (live) setOut(source);
    });
    return () => { live = false; };
  }, [source, uri]);
  return out;
}

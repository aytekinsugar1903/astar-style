/** Native builds keep the original photo. Web replaces flat studio backdrops. */
export function cutoutReady(_uri: string): string | null {
  return null;
}

export function studioCutout(uri: string): Promise<string> {
  return Promise.resolve(uri);
}

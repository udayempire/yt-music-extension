export type NowPlayingState = {
  channelId: string;
  title: string;
  artists: string;
  coverUrl: string | null;
  songUrl: string | null;
  isPlaying: boolean;
  positionSec: number;
  durationSec: number;
  playedAt: number;
};

const nowPlayingByChannel = new Map<string, NowPlayingState>();

export function upsertNowPlaying(state: NowPlayingState): void {
	nowPlayingByChannel.set(state.channelId, state);
}

export function getNowPlayingByChannelId(
	channelId: string
): NowPlayingState | null {
	return nowPlayingByChannel.get(channelId) ?? null;
}

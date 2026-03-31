import { NowPlayingState } from "../../../shared/types/now-playing";

const nowPlayingByChannel = new Map<string, NowPlayingState>();

export function upsertNowPlaying(state: NowPlayingState): void {
	nowPlayingByChannel.set(state.channelId, state);
}

export function getNowPlayingByChannelId(
	channelId: string
): NowPlayingState | null {
	return nowPlayingByChannel.get(channelId) ?? null;
}

import 'package:audio_service/audio_service.dart';
import 'package:just_audio/just_audio.dart';
import '../models/song.dart';
import 'dart:io';

class MezmurAudioHandler extends BaseAudioHandler with SeekHandler {
  final _player = AudioPlayer();

  MezmurAudioHandler() {
    _player.playbackEventStream.map(_transformEvent).pipe(playbackState);
    
    // Listen for song completion to play next
    _player.processingStateStream.listen((state) {
      if (state == ProcessingState.completed) {
        skipToNext();
      }
    });
  }

  @override
  Future<void> play() => _player.play();

  @override
  Future<void> pause() => _player.pause();

  @override
  Future<void> seek(Duration position) => _player.seek(position);

  @override
  Future<void> stop() => _player.stop();

  Future<void> playSong(Song song) async {
    final mediaItem = MediaItem(
      id: song.filePath,
      album: "ደቂቀ ትንሣኤ",
      title: song.title,
      artist: song.artist,
      artUri: Uri.parse("https://picsum.photos/seed/church/512/512"),
    );
    this.mediaItem.add(mediaItem);
    
    try {
      await _player.setAudioSource(AudioSource.file(song.filePath));
      play();
    } catch (e) {
      print("Error loading audio: $e");
    }
  }

  PlaybackState _transformEvent(PlaybackEvent event) {
    return PlaybackState(
      controls: [
        MediaControl.skipToPrevious,
        if (_player.playing) MediaControl.pause else MediaControl.play,
        MediaControl.stop,
        MediaControl.skipToNext,
      ],
      systemActions: const {
        MediaAction.seek,
        MediaAction.seekForward,
        MediaAction.seekBackward,
      },
      androidCompactActionIndices: const [0, 1, 3],
      processingState: const {
        ProcessingState.idle: AudioProcessingState.idle,
        ProcessingState.loading: AudioProcessingState.loading,
        ProcessingState.buffering: AudioProcessingState.buffering,
        ProcessingState.ready: AudioProcessingState.ready,
        ProcessingState.completed: AudioProcessingState.completed,
      }[_player.processingState]!,
      playing: _player.playing,
      updatePosition: _player.position,
      bufferedPosition: _player.bufferedPosition,
      speed: _player.speed,
      queueIndex: event.currentIndex,
    );
  }
}

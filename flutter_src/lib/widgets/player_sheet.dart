import 'package:flutter/material.dart';
import 'package:audio_service/audio_service.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../main.dart';

class PlayerSheet extends StatelessWidget {
  const PlayerSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<MediaItem?>(
      stream: audioHandler.mediaItem,
      builder: (context, snapshot) {
        final mediaItem = snapshot.data;
        if (mediaItem == null) return const SizedBox.shrink();

        return Positioned(
          bottom: 0,
          left: 0,
          right: 0,
          child: StreamBuilder<PlaybackState>(
            stream: audioHandler.playbackState,
            builder: (context, playbackSnapshot) {
              final playbackState = playbackSnapshot.data;
              final playing = playbackState?.playing ?? false;

              return Container(
                margin: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF4A0404),
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.5),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: Colors.white10,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(LucideIcons.music, color: Color(0xFFFBBF24)),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                mediaItem.title,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                mediaItem.artist ?? "ዘማሪ",
                                style: const TextStyle(fontSize: 10, color: Colors.white54),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(LucideIcons.skipBack, color: Colors.white38, size: 20),
                          onPressed: () => audioHandler.skipToPrevious(),
                        ),
                        IconButton(
                          icon: Icon(
                            playing ? LucideIcons.pause : LucideIcons.play,
                            color: const Color(0xFFFBBF24),
                          ),
                          onPressed: () => playing ? audioHandler.pause() : audioHandler.play(),
                        ),
                        IconButton(
                          icon: const Icon(LucideIcons.skipForward, color: Colors.white38, size: 20),
                          onPressed: () => audioHandler.skipToNext(),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    StreamBuilder<Duration>(
                      stream: AudioService.position,
                      builder: (context, positionSnapshot) {
                        final position = positionSnapshot.data ?? Duration.zero;
                        final duration = mediaItem.duration ?? Duration.zero;
                        
                        return Column(
                          children: [
                            SliderTheme(
                              data: SliderTheme.of(context).copyWith(
                                trackHeight: 2,
                                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 4),
                                overlayShape: const RoundSliderOverlayShape(overlayRadius: 10),
                              ),
                              child: Slider(
                                value: position.inSeconds.toDouble(),
                                max: duration.inSeconds.toDouble() > 0 
                                     ? duration.inSeconds.toDouble() 
                                     : (position.inSeconds.toDouble() + 1),
                                onChanged: (value) {
                                  audioHandler.seek(Duration(seconds: value.toInt()));
                                },
                                activeColor: const Color(0xFFFBBF24),
                                inactiveColor: Colors.white10,
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}

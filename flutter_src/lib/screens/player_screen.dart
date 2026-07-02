import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../models/song.dart';

class PlayerScreen extends StatelessWidget {
  final Song song;
  final bool isPlaying;
  final double progress;
  final VoidCallback onPlayPause;
  final VoidCallback onNext;
  final VoidCallback onPrev;

  const PlayerScreen({
    super.key,
    required this.song,
    required this.isPlaying,
    required this.progress,
    required this.onPlayPause,
    required this.onNext,
    required this.onPrev,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 40),
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A),
        borderRadius: BorderRadius.vertical(top: Radius.circular(48)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.white10,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 40),
          
          // Album Art Placeholder
          Container(
            width: 240,
            height: 240,
            decoration: BoxDecoration(
              color: const Color(0xFF1E3A8A).withOpacity(0.3),
              borderRadius: BorderRadius.circular(40),
              border: Border.all(color: const Color(0xFFFBBF24).withOpacity(0.2)),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFFBBF24).withOpacity(0.1),
                  blurRadius: 40,
                  spreadRadius: -10,
                )
              ],
            ),
            child: const Center(
              child: Icon(LucideIcons.music, size: 80, color: Color(0xFFFBBF24)),
            ),
          ),
          
          const SizedBox(height: 40),
          
          Text(
            song.title,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: Colors.white),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            song.artist,
            style: const TextStyle(fontSize: 16, color: Color(0xFFFBBF24), fontWeight: FontWeight.bold),
          ),
          
          const SizedBox(height: 40),
          
          // Progress Bar
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              trackHeight: 4,
              thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 6),
              overlayShape: const RoundSliderOverlayShape(overlayRadius: 14),
              activeTrackColor: const Color(0xFFFBBF24),
              inactiveTrackColor: Colors.white10,
              thumbColor: const Color(0xFFFBBF24),
            ),
            child: Slider(
              value: progress,
              onChanged: (v) {},
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('0:00', style: TextStyle(fontSize: 10, color: Colors.white38)),
                Text(song.duration, style: const TextStyle(fontSize: 10, color: Colors.white38)),
              ],
            ),
          ),
          
          const SizedBox(height: 40),
          
          // Controls
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: const Icon(LucideIcons.skipBack, size: 32, color: Colors.white60),
                onPressed: onPrev,
              ),
              const SizedBox(width: 32),
              GestureDetector(
                onTap: onPlayPause,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFBBF24),
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Color(0xFFFBBF24),
                        blurRadius: 20,
                        spreadRadius: -5,
                      )
                    ],
                  ),
                  child: Icon(
                    isPlaying ? LucideIcons.pause : LucideIcons.play,
                    size: 40,
                    color: const Color(0xFF1E3A8A),
                  ),
                ),
              ),
              const SizedBox(width: 32),
              IconButton(
                icon: const Icon(LucideIcons.skipForward, size: 32, color: Colors.white60),
                onPressed: onNext,
              ),
            ],
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

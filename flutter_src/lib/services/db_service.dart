import 'package:hive_flutter/hive_flutter.dart';
import '../models/song.dart';

class DBService {
  static const String _songBoxName = 'songs_box';

  static Future<void> init() async {
    await Hive.initFlutter();
    if (!Hive.isAdapterRegistered(0)) {
      // Hive adapter registration would normally be here after generation
    }
    await Hive.openBox<dynamic>(_songBoxName);
  }

  static Future<void> saveSong(Song song) async {
    final box = Hive.box<dynamic>(_songBoxName);
    // Convert to map for simplicity if adapter is not generated yet in dummy mode
    await box.put(song.id, {
      'id': song.id,
      'title': song.title,
      'artist': song.artist,
      'category': song.category,
      'duration': song.duration,
      'filePath': song.filePath,
      'isFavorite': song.isFavorite,
      'isFeatured': song.isFeatured,
      'addedAt': song.addedAt.millisecondsSinceEpoch,
    });
  }

  static List<Song> getAllSongs() {
    final box = Hive.box<dynamic>(_songBoxName);
    return box.values.map((e) {
      final map = e as Map;
      return Song(
        id: map['id'],
        title: map['title'],
        artist: map['artist'],
        category: map['category'],
        duration: map['duration'],
        filePath: map['filePath'],
        isFavorite: map['isFavorite'] ?? false,
        isFeatured: map['isFeatured'] ?? false,
        addedAt: DateTime.fromMillisecondsSinceEpoch(map['addedAt']),
      );
    }).toList();
  }

  static Future<void> toggleFavorite(String id) async {
    final box = Hive.box<dynamic>(_songBoxName);
    final map = box.get(id) as Map?;
    if (map != null) {
      map['isFavorite'] = !(map['isFavorite'] ?? false);
      await box.put(id, map);
    }
  }

  static Future<void> deleteSong(String id) async {
    final box = Hive.box<dynamic>(_songBoxName);
    await box.delete(id);
  }
}

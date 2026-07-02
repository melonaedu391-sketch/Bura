import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/db_service.dart';
import '../models/song.dart';
import '../main.dart';

class FavoritesTab extends StatefulWidget {
  const FavoritesTab({super.key});

  @override
  State<FavoritesTab> createState() => _FavoritesTabState();
}

class _FavoritesTabState extends State<FavoritesTab> {
  List<Song> _favorites = [];

  @override
  void initState() {
    super.initState();
    _loadFavorites();
  }

  void _loadFavorites() {
    final songs = DBService.getAllSongs();
    setState(() {
      _favorites = songs.where((s) => s.isFavorite).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    bool isAmharic = Localizations.localeOf(context).languageCode == 'am';

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text(isAmharic ? 'ተወዳጅ መዝሙሮች' : 'Favorites', 
          style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFFBBF24))),
        centerTitle: true,
      ),
      body: _favorites.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                   Icon(LucideIcons.heart, size: 64, color: Colors.white10),
                   const SizedBox(height: 16),
                   Text(isAmharic ? 'ምንም ተወዳጅ የለም' : 'No Favorites Yet', 
                    style: const TextStyle(color: Colors.white24)),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _favorites.length,
              itemBuilder: (context, index) => _buildSongTile(_favorites[index]),
            ),
    );
  }

  Widget _buildSongTile(Song song) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.music, color: Color(0xFFFBBF24), size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(song.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(song.artist, style: const TextStyle(fontSize: 12, color: Colors.white54)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(LucideIcons.heart, color: Colors.red, size: 20),
            onPressed: () async {
              await DBService.toggleFavorite(song.id);
              _loadFavorites();
            },
          ),
          IconButton(
            icon: const Icon(LucideIcons.play, color: Color(0xFFFBBF24), size: 24),
            onPressed: () => audioHandler.playSong(song),
          ),
        ],
      ),
    );
  }
}

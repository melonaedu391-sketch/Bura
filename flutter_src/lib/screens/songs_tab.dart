import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:file_picker/file_picker.dart';
import '../services/db_service.dart';
import '../models/song.dart';
import '../main.dart';
import 'dart:io';

class SongsTab extends StatefulWidget {
  const SongsTab({super.key});

  @override
  State<SongsTab> createState() => _SongsTabState();
}

class _SongsTabState extends State<SongsTab> {
  List<Song> _songs = [];
  List<Song> _filteredSongs = [];
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadSongs();
  }

  void _loadSongs() {
    final songs = DBService.getAllSongs();
    setState(() {
      _songs = songs;
      _filteredSongs = songs;
    });
  }

  void _filterSongs(String query) {
    setState(() {
      _filteredSongs = _songs
          .where((s) => s.title.toLowerCase().contains(query.toLowerCase()) || 
                       s.artist.toLowerCase().contains(query.toLowerCase()))
          .toList();
    });
  }

  Future<void> _uploadSongs() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(
      type: FileType.audio,
      allowMultiple: true,
    );

    if (result != null) {
      for (var file in result.files) {
        if (file.path != null) {
          final song = Song(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            title: file.name.replaceAll('.mp3', ''),
            artist: 'ዘማሪ',
            category: 'መዝሙር',
            duration: '0:00',
            filePath: file.path!,
            addedAt: DateTime.now(),
          );
          await DBService.saveSong(song);
        }
      }
      _loadSongs();
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isAmharic = Localizations.localeOf(context).languageCode == 'am';

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text(isAmharic ? 'ሁሉም መዝሙሮች' : 'All Songs', 
          style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFFBBF24))),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.upload, color: Color(0xFFFBBF24)),
            onPressed: _uploadSongs,
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20.0),
            child: TextField(
              controller: _searchController,
              onChanged: _filterSongs,
              decoration: InputDecoration(
                hintText: isAmharic ? 'መዝሙር ፈልግ...' : 'Search Mezmurs...',
                prefixIcon: const Icon(LucideIcons.search, size: 20),
                filled: true,
                fillColor: Colors.white10,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: _filteredSongs.length,
              itemBuilder: (context, index) => _buildSongTile(_filteredSongs[index]),
            ),
          ),
          const SizedBox(height: 100),
        ],
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
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFF1E3A8A).withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(LucideIcons.music, color: Color(0xFFFBBF24), size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(song.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Text(song.artist, style: const TextStyle(fontSize: 12, color: Colors.white54)),
              ],
            ),
          ),
          IconButton(
            icon: Icon(
              song.isFavorite ? LucideIcons.heart : LucideIcons.heart,
              color: song.isFavorite ? Colors.red : Colors.white24,
              size: 20,
            ),
            onPressed: () async {
              await DBService.toggleFavorite(song.id);
              _loadSongs();
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

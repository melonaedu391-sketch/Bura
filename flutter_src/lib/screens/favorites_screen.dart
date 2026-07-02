import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../models/song.dart';
import '../services/db_service.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  List<Song> _favorites = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFavorites();
  }

  void _loadFavorites() {
    setState(() => _isLoading = true);
    final all = DBService.getAllSongs();
    setState(() {
      _favorites = all.where((s) => s.isFavorite).toList();
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('ተወዳጆች', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFFBBF24))),
        centerTitle: true,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _favorites.isEmpty
          ? const Center(child: Text('ምንም ተወዳጅ መዝሙር የለም', style: TextStyle(color: Colors.white24)))
          : ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: _favorites.length,
              itemBuilder: (context, index) => _buildFavoriteTile(_favorites[index]),
            ),
    );
  }

  Widget _buildFavoriteTile(Song song) {
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
            icon: const Icon(LucideIcons.heart, color: Colors.red, fill: 1),
            onPressed: () async {
              await DBService.toggleFavorite(song.id);
              _loadFavorites();
            },
          ),
        ],
      ),
    );
  }
}

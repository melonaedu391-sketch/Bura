import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:file_picker/file_picker.dart';
import '../models/song.dart';
import '../services/db_service.dart';
import '../services/audio_handler.dart';
import 'package:audio_service/audio_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<Song> _songs = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSongs();
  }

  Future<void> _loadSongs() async {
    setState(() => _isLoading = true);
    final songs = DBService.getAllSongs();
    setState(() {
      _songs = songs;
      _isLoading = false;
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
            duration: '0:00', // In reality, calculate this
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
    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Elegant Header
          SliverAppBar(
            expandedHeight: 180,
            floating: false,
            pinned: true,
            backgroundColor: const Color(0xFF0F172A),
            flexibleSpace: FlexibleSpaceBar(
              centerTitle: true,
              title: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    'ደቂቀ ትንሣኤ',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.secondary,
                      fontWeight: FontWeight.w900,
                      fontSize: 24,
                    ),
                  ),
                  const Text(
                    'Ethiopian Orthodox Mezmur',
                    style: TextStyle(
                      fontSize: 10,
                      color: Colors.white54,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Search Bar
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'መዝሙር ፈልግ...',
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
          ),

          // Featured Section
          SliverToBoxAdapter(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSectionHeader('ተለይቶ የቀረበ'),
                SizedBox(
                  height: 220,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: 5,
                    itemBuilder: (context, index) => _buildFeaturedCard(),
                  ),
                ),
              ],
            ),
          ),

          // All Songs Section
          SliverToBoxAdapter(child: _buildSectionHeader('ሁሉም መዝሙሮች')),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) => _buildSongTile(),
              childCount: 10,
            ),
          ),

          // About Section
          SliverToBoxAdapter(
            child: Container(
              margin: const EdgeInsets.all(20),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(32),
                border: Border.all(color: Colors.white10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Row(
                    children: [
                      Icon(LucideIcons.info, color: Theme.of(context).colorScheme.secondary),
                      const SizedBox(width: 8),
                      const Text('ስለ ፕሮግራሙ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'ደቂቀ ትንሣኤ የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን መዝሙራትን በአንድ ቦታ ሰብስቦ ለማዳመጥ የተዘጋጀ መተግበሪያ ነው።',
                    style: TextStyle(color: Colors.white70, height: 1.5),
                  ),
                ],
              ),
            ),
          ),
          
          const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
        ],
      ),
      floatingActionButton: FloatingActionButton.large(
        onPressed: () {},
        backgroundColor: Theme.of(context).primaryColor,
        child: const Icon(LucideIcons.upload, color: Color(0xFFFBBF24)),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w900,
          color: Theme.of(context).colorScheme.secondary,
        ),
      ),
    );
  }

  Widget _buildFeaturedCard() {
    return Container(
      width: 160,
      margin: const EdgeInsets.only(right: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: Colors.white10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 120,
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.05),
              borderRadius: BorderRadius.circular(24),
            ),
            child: const Center(child: Icon(LucideIcons.music, color: Colors.white12, size: 48)),
          ),
          const SizedBox(height: 12),
          const Text('መዝሙር ርዕስ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14), truncate: true),
          const Text('የዘማሪ ስም', style: TextStyle(fontSize: 10, color: Colors.white54), truncate: true),
        ],
      ),
    );
  }

  Widget _buildSongTile() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: const Color(0xFF1E3A8A).withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(LucideIcons.music, color: Color(0xFFFBBF24), size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('የመዝሙር ርዕስ', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Text('ዘማሪ', style: TextStyle(fontSize: 10, color: Color(0xFFFBBF24))),
                    const SizedBox(width: 8),
                    const Text('መዝሙር', style: TextStyle(fontSize: 10, color: Colors.white38)),
                    const SizedBox(width: 8),
                    const Text('4:30', style: TextStyle(fontSize: 10, color: Colors.white38)),
                  ],
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFBBF24),
              foregroundColor: const Color(0xFF1E3A8A),
              shape: const StadiumBorder(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
            ),
            child: const Text('አጫውት', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ],
      ),
    );
  }
}

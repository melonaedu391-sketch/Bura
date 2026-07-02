import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/db_service.dart';
import '../models/song.dart';
import '../main.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  List<Song> _songs = [];

  @override
  void initState() {
    super.initState();
    _loadSongs();
  }

  void _loadSongs() {
    setState(() {
      _songs = DBService.getAllSongs();
    });
  }

  @override
  Widget build(BuildContext context) {
    bool isAmharic = Localizations.localeOf(context).languageCode == 'am';
    final featured = _songs.where((s) => s.isFeatured).toList();

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 180,
            floating: false,
            pinned: true,
            backgroundColor: const Color(0xFF4A0404),
            flexibleSpace: FlexibleSpaceBar(
              centerTitle: true,
              title: Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    isAmharic ? 'ደቂቀ ትንሣኤ' : 'Dekike Tinsae',
                    style: const TextStyle(
                      color: Color(0xFFFBBF24),
                      fontWeight: FontWeight.w900,
                      fontSize: 24,
                    ),
                  ),
                  Text(
                    isAmharic ? 'የኢትዮጵያ ኦርቶዶክስ መዝሙር' : 'Ethiopian Orthodox Mezmur',
                    style: const TextStyle(
                      fontSize: 10,
                      color: Colors.white54,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
            actions: [
               IconButton(
                 icon: const Icon(LucideIcons.languages, size: 20),
                 onPressed: () {
                   MezmurApp.setLocale(context, isAmharic ? const Locale('en') : const Locale('am'));
                 },
               ),
            ],
          ),
          
          if (featured.isNotEmpty) ...[
            SliverToBoxAdapter(
              child: _buildSectionHeader(isAmharic ? 'ተለይቶ የቀረበ' : 'Featured'),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 220,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  itemCount: featured.length,
                  itemBuilder: (context, index) => _buildFeaturedCard(featured[index]),
                ),
              ),
            ),
          ],

          SliverToBoxAdapter(
            child: _buildSectionHeader(isAmharic ? 'የቅርብ ጊዜ' : 'Recent'),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (context, index) => _buildSongTile(_songs[index]),
              childCount: _songs.length > 10 ? 10 : _songs.length,
            ),
          ),
          
          const SliverPadding(padding: EdgeInsets.only(bottom: 150)),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 22,
          fontWeight: FontWeight.w900,
          color: Color(0xFFFBBF24),
        ),
      ),
    );
  }

  Widget _buildFeaturedCard(Song song) {
    return GestureDetector(
      onTap: () => audioHandler.playSong(song),
      child: Container(
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
            Text(song.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14), overflow: TextOverflow.ellipsis),
            Text(song.artist, style: const TextStyle(fontSize: 10, color: Colors.white54), overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  Widget _buildSongTile(Song song) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.03),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.music, color: Color(0xFFFBBF24), size: 18),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(song.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text(song.artist, style: const TextStyle(fontSize: 10, color: Colors.white38)),
              ],
            ),
          ),
          IconButton(
            icon: Icon(
              LucideIcons.play, 
              size: 20, 
              color: const Color(0xFFFBBF24).withOpacity(0.8)
            ),
            onPressed: () => audioHandler.playSong(song),
          ),
        ],
      ),
    );
  }
}

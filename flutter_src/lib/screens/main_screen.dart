import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'home_tab.dart';
import 'songs_tab.dart';
import 'favorites_tab.dart';
import 'about_tab.dart';
import '../widgets/player_sheet.dart';

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  
  final List<Widget> _tabs = [
    const HomeTab(),
    const SongsTab(),
    const FavoritesTab(),
    const AboutTab(),
  ];

  void _showSocials(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Color(0xFF4A0404),
          borderRadius: BorderRadius.vertical(top: Radius.circular(40)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            const Text(
              'እንከተለን',
              style: TextStyle(
                color: Color(0xFFFBBF24),
                fontSize: 24,
                fontWeight: FontWeight.w900,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Follow Us',
              style: TextStyle(
                color: Colors.white54,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 32),
            _socialItem(
              LucideIcons.send, 
              'Telegram', 
              const Color(0xFF229ED9),
            ),
            const SizedBox(height: 12),
            _socialItem(
              LucideIcons.youtube, 
              'YouTube', 
              const Color(0xFFFF0000),
            ),
            const SizedBox(height: 12),
            _socialItem(
              LucideIcons.instagram, 
              'Instagram', 
              const Color(0xFFE4405F),
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white10,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
                child: const Text('ዝጋ / Close'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _socialItem(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white10),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 16),
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const Spacer(),
          const Icon(LucideIcons.chevronRight, color: Colors.white24, size: 16),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    bool isAmharic = Localizations.localeOf(context).languageCode == 'am';

    return Scaffold(
      body: Stack(
        children: [
          IndexedStack(
            index: _currentIndex,
            children: _tabs,
          ),
          const PlayerSheet(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showSocials(context),
        backgroundColor: const Color(0xFF4A0404),
        elevation: 10,
        shape: RoundedRectangleBorder(
          side: const BorderSide(color: Color(0xFFF9F5F0), width: 4),
          borderRadius: BorderRadius.circular(100),
        ),
        child: const Icon(LucideIcons.church, color: Color(0xFFFBBF24)),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        color: const Color(0xFF4A0404),
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _navItem(0, LucideIcons.home, isAmharic ? 'ዋና' : 'Home'),
            _navItem(1, LucideIcons.music, isAmharic ? 'መዝሙር' : 'Songs'),
            const SizedBox(width: 40), // Space for FAB
            _navItem(2, LucideIcons.heart, isAmharic ? 'ተወዳጅ' : 'Favs'),
            _navItem(3, LucideIcons.info, isAmharic ? 'ስለ' : 'About'),
          ],
        ),
      ),
    );
  }

  Widget _navItem(int index, IconData icon, String label) {
    final isSelected = _currentIndex == index;
    return InkWell(
      onTap: () => setState(() => _currentIndex = index),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            color: isSelected ? const Color(0xFFFBBF24) : Colors.white24,
            size: 20,
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              color: isSelected ? const Color(0xFFFBBF24) : Colors.white24,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class AboutTab extends StatelessWidget {
  const AboutTab({super.key});

  @override
  Widget build(BuildContext context) {
    bool isAmharic = Localizations.localeOf(context).languageCode == 'am';

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text(isAmharic ? 'ስለ እኛ' : 'About', 
          style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFFBBF24))),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF1E3A8A).withOpacity(0.2),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFFBBF24).withOpacity(0.2)),
              ),
              child: const Icon(LucideIcons.music, size: 64, color: Color(0xFFFBBF24)),
            ),
            const SizedBox(height: 24),
            Text(
              isAmharic ? 'ደቂቀ ትንሣኤ' : 'Dekike Tinsae',
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFFFBBF24)),
            ),
            const SizedBox(height: 8),
             Text(
              isAmharic ? 'የኢትዮጵያ ኦርቶዶክስ መዝሙር' : 'Ethiopian Orthodox Mezmur',
              style: const TextStyle(fontSize: 14, color: Colors.white54, letterSpacing: 2),
            ),
            const SizedBox(height: 40),
            _buildInfoCard(
              context,
              LucideIcons.info,
              isAmharic ? 'ስለ ፕሮግራሙ' : 'About the App',
              isAmharic 
                ? 'ደቂቀ ትንሣኤ የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን መዝሙራትን በቀላሉ ለማግኘት እና ለማዳመጥ የተዘጋጀ መተግበሪያ ነው።'
                : 'Dekike Tinsae is an application designed to easily access and listen to Ethiopian Orthodox Tewahedo Church hymns.',
            ),
            const SizedBox(height: 20),
            _buildInfoCard(
              context,
              LucideIcons.code,
              isAmharic ? 'ሥሪት' : 'Version',
              '1.0.0',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoCard(BuildContext context, IconData icon, String title, String content) {
    return Container(
      width: double.infinity,
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
              Icon(icon, size: 20, color: const Color(0xFFFBBF24)),
              const SizedBox(width: 12),
              Text(title, style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFFFBBF24))),
            ],
          ),
          const SizedBox(height: 12),
          Text(content, style: const TextStyle(fontSize: 14, color: Colors.white70, height: 1.6)),
        ],
      ),
    );
  }
}

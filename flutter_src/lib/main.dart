import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:audio_service/audio_service.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'services/db_service.dart';
import 'services/audio_handler.dart';
import 'screens/main_screen.dart';

late MezmurAudioHandler audioHandler;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Database
  await DBService.init();

  // Initialize Background Audio
  await JustAudioBackground.init(
    androidNotificationChannelId: 'com.church.mezmur.channel.audio',
    androidNotificationChannelName: 'Audio playback',
    androidNotificationOngoing: true,
  );

  audioHandler = await AudioService.init(
    builder: () => MezmurAudioHandler(),
    config: const AudioServiceConfig(
      androidNotificationChannelId: 'com.church.mezmur.channel.audio',
      androidNotificationChannelName: 'Audio playback',
      androidNotificationOngoing: true,
    ),
  );

  runApp(const MezmurApp());
}

class MezmurApp extends StatefulWidget {
  const MezmurApp({super.key});

  @override
  State<MezmurApp> createState() => _MezmurAppState();

  static void setLocale(BuildContext context, Locale newLocale) {
    _MezmurAppState? state = context.findAncestorStateOfType<_MezmurAppState>();
    state?.setLocale(newLocale);
  }
}

class _MezmurAppState extends State<MezmurApp> {
  Locale _locale = const Locale('am');

  void setLocale(Locale locale) {
    setState(() {
      _locale = locale;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ደቂቀ ትንሣኤ',
      debugShowCheckedModeBanner: false,
      locale: _locale,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF121212),
        primaryColor: const Color(0xFF4A0404),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4A0404),
          primary: const Color(0xFF4A0404),
          secondary: const Color(0xFFFBBF24),
          surface: const Color(0xFF1E1E1E),
          brightness: Brightness.dark,
        ),
        textTheme: GoogleFonts.notoSerifEthiopicTextTheme(
          ThemeData.dark().textTheme,
        ),
      ),
      home: const MainScreen(),
    );
  }
}

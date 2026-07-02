import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Heart, Search, 
  Upload, Download, MoreVertical, Info, Youtube, Instagram, Send,
  Music, List, Bell, X, Menu, Share2, Grid, LayoutGrid, ChevronDown, Edit, Save, Copy, Check,
  ChevronRight, Settings, FolderHeart, Library, Church, Sun, Moon, Calendar, RefreshCw,
  Smartphone, QrCode, MessageSquare, Mail, BellRing, Sparkles
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { toEthiopian } from 'ethiopian-date';
import { toggleFavorite } from './lib/db';
import { 
  auth, db, onAuthStateChanged, User, isUserAdmin, signInWithGoogle, logout,
  getSongs, uploadAudio, addSongData, updateSongData, deleteSongData, onSnapshot,
  getBranding, updateBranding, uploadLogo
} from './lib/firebase';
import { LogOut, LogIn, Trash2, Camera, Image } from 'lucide-react';
import { askOrthodoxAI } from './lib/gemini';

// --- Types ---
export interface Song {
  id: string;
  title: string;
  artist: string;
  category: 'mezmur' | 'kidasie' | 'zema';
  duration: string;
  audioUrl: string;
  blob?: Blob; // For local caching if needed
  isFavorite?: boolean;
  isFeatured: boolean;
  lyrics?: string;
  addedAt: number;
  createdBy?: string;
}
type Language = 'am' | 'en' | 'ti' | 'or';
type Theme = 'light' | 'dark';
type Tab = 'home' | 'categories' | 'favorites' | 'settings' | 'downloads' | 'calendar' | 'ai-chat';

const translations = {
  am: {
    title: 'ደቂቀ ትንሣኤ',
    sub: '',
    home: 'መዝሙር',
    categories: 'ምድብ',
    favorites: 'የተወደዱ',
    downloads: 'የወረዱ',
    settings: 'ማስተካከያ',
    search: 'መዝሙር ፈልግ...',
    upload: 'መዝሙር ጨምር',
    featured: 'ተለይቶ የቀረበ',
    allSongs: 'ሁሉም መዝሙሮች',
    aboutTitle: 'ስለ ፕሮግራሙ',
    aboutText: 'ደቂቀ ትንሣኤ የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን መዝሙራትን በአንድ ቦታ ላይ ሰብስቦ ለመንፈሳዊ አገልግሎት የሚሰጥ መተግበሪያ ነው።',
    lang: 'ቋንቋ',
    artist: 'የዘማሪ ስም',
    nowPlaying: 'እየተደመጠ',
    play: 'አጫውት',
    lyrics: 'ግጥሞች',
    editLyrics: 'ግጥም ጨምር',
    editSong: 'መዝሙሩን ያስተካክሉ',
    share: 'አጋራ',
    save: 'አስቀምጥ',
    cancel: 'ተው',
    about: 'ስለ',
    theme: 'ገጽታ',
    lightMode: 'ብርሃን',
    darkMode: 'ጨለማ',
    language: 'ቋንቋ',
    success: 'አፕዎ ተሰርቷል! አሁን Publish ያድርጉ እና እንደ መደበኛ አፕ ይጫኑ!',
    followUs: 'እንከተለን',
    close: 'ዝጋ',
    lyricsSize: 'የግጥም መጠን',
    calendar: 'ዘመን አቆጣጠር',
    ethiopianCalendar: 'የኢትዮጵያ ዘመን አቆጣጠር',
    today: 'ዛሬ',
    updateAvailable: 'አዲስ ማሻሻያ አለ',
    refresh: 'አድስ',
    happyHoliday: 'እንኳን አደረሳችሁ',
    holidayGreeting: 'እንኳን ለ{name} በሰላም አደረሳችሁ!',
    ethMonths: ['መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'],
    ethDays: ['እሑድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'],
    download: 'አውርድ',
    downloaded: 'የወረደ',
    delete: 'አጥፋ',
    downloading: 'እየወረደ ነው...',
    monthlyHolidays: 'የወሩ ክብረ በዓላት',
    aiChat: 'ኦርቶዶክስ AI ውይይት',
    aiChatPlaceholder: 'ስለ ሃይማኖትዎ ይጠይቁ...',
    aiChatIntro: 'ሰላም! እኔ የኦርቶዶክስ ተዋሕዶ ሃይማኖት ረዳት ነኝ። ስለ መዝሙራት፣ በዓላት፣ ቅዱሳን ወይም ሥርዓተ አምልኮ መጠየቅ ይችላሉ።',
    aiChatError: 'ይቅርታ፣ ምላሽ ማግኘት አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
    aiChatClear: 'ታሪክ አጥፋ',
    offlineMode: 'ከመስመር ውጭ (Offline)',
    offlineAlert: 'ይህ መዝሙር አልወረደም። ከመስመር ውጭ ለማዳመጥ እባክዎ አስቀድመው ያውርዱት።',
    holidays: [
      'ልደታ ለማርያም', 'አባ ታዴዎስ / አባ ጉባ', 'በኣታ ለማርያም', 'ዮሐንስ ወልደ ነጐድጓድ', 'አቡነ ገብረ መንፈስ ቅዱስ', 
      'ኢየሱስ', 'ሥላሴ', 'አቡነ ኪሮስ', 'ቶማስ', 'መስቀል / ጻድቁ አቡነ ኖብ', 
      'ሐና ማርያም / ፋኑኤል', 'ቅዱስ ሚካኤል', 'እግዚአብሔር አብ / ረፋኤል', 'አቡነ አረጋዊ / ገብረ ክርስቶስ', 'ቂርቆስና ኢየሉጣ', 
      'ኪዳነ ምሕረት', 'እስጢፋኖስ / አቡነ ገሪማ', 'ቅዱስ ያዕቆብ / ፊልጶስ', 'ቅዱስ ገብርኤል', 'ሄኖክ', 
      'ቅድስት ማርያም', 'ቅዱስ ዑራኤል', 'ቅዱስ ጊዮርጊስ', 'አቡነ ተክለ ሃይማኖት', 'መርቆሬዎስ', 
      'ቶማስ / አቡነ ሰላማ', 'መድኃኔ ዓለም', 'አማኑኤል', 'ባዕለ እግዚአብሔር / ቅዱስ ጴጥሮስ ወጳውሎስ', 'ቅዱስ ማርቆስ'
    ]
  },
  en: {
    title: 'Dekike Tinsae',
    sub: '',
    home: 'Mezmur',
    categories: 'Category',
    favorites: 'Favorites',
    downloads: 'Downloads',
    settings: 'Settings',
    search: 'Search Mezmur...',
    upload: 'Add Song',
    featured: 'Featured',
    allSongs: 'All Songs',
    aboutTitle: 'About This App',
    aboutText: 'Dekike Tinsae is a dedicated platform for Ethiopian Orthodox Tewahedo Church hymns, liturgies, and spiritual chants.',
    lang: 'Language',
    artist: 'Artist',
    nowPlaying: 'Now Playing',
    play: 'Play',
    lyrics: 'Lyrics',
    editLyrics: 'Add Lyrics',
    editSong: 'Edit Song Details',
    share: 'Share',
    save: 'Save',
    cancel: 'Cancel',
    about: 'Settings',
    theme: 'Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    language: 'Language',
    success: 'Your app is ready! Publish it now and install it as a regular app!',
    followUs: 'Follow Us',
    close: 'Close',
    lyricsSize: 'Lyrics Text Size',
    calendar: 'Calendar',
    ethiopianCalendar: 'Ethiopian Calendar',
    today: 'Today',
    updateAvailable: 'New Update Available',
    refresh: 'Refresh',
    happyHoliday: 'Happy Holiday',
    holidayGreeting: 'Happy {name}!',
    ethMonths: ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehasse', 'Pagume'],
    ethDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    download: 'Download',
    downloaded: 'Downloaded',
    delete: 'Delete',
    downloading: 'Downloading...',
    monthlyHolidays: 'Monthly Holidays',
    aiChat: 'Orthodox AI Chat',
    aiChatPlaceholder: 'Ask about the Orthodox faith...',
    aiChatIntro: 'Greetings! I am an Orthodox Tewahedo faith assistant. You can ask me about hymns, holidays, saints, or teachings.',
    aiChatError: 'Sorry, could not get a response. Please try again.',
    aiChatClear: 'Clear History',
    offlineMode: 'Offline Mode',
    offlineAlert: 'This song is not downloaded. Please download it first to listen offline.',
    holidays: [
      'Lideta Mariam', 'St. Thaddeus', 'Ba\'ata Mariam', 'John Apostle', 'Abune Gebre Menfes Kiddus',
      'Eyesus', 'Sillassie', 'Abune Kiros', 'St. Thomas', 'Mesqel / Abune Nob',
      'Hanna Mariam / Fanuel', 'St. Michael', 'Egziabher Ab / Raphael', 'Abune Aregawi / Gebre Kristos', 'St. Qirkos',
      'Kidane Mehret', 'St. Stephen / Abune Gerima', 'St. James', 'St. Gabriel', 'St. Henok',
      'St. Mary', 'St. Urael', 'St. George', 'Abune Tekle Haymanot', 'St. Merkorewos',
      'St. Thomas / Abune Salama', 'Medhane Alem', 'St. Emmanuel', 'Bale Egziabher', 'St. Mark'
    ]
  },
  ti: {
    title: 'ደቂቀ ትንሣኤ',
    sub: '',
    home: 'መዝሙር',
    categories: 'ምድብ',
    favorites: 'ዝተፈተዉ',
    downloads: 'ዝወረዱ',
    settings: 'ምምሕያሽ',
    search: 'መዝሙር ድለ...',
    upload: 'መዝሙር ወስኽ',
    featured: 'ፍሉይ',
    allSongs: 'ኩሎም መዝሙራት',
    aboutTitle: 'ብዛዕባ ፕሮግራሙ',
    aboutText: 'ደቂቀ ትንሣኤ ናይ ኢትዮጵያ ኦርቶዶክስ ተዋሕዶ ቤተ ክርስቲያን መዝሙራት፣ ቅዳሴያትን መንፈሳዊ ዜማታትን ኣብ ሓደ ቦታ ኣኪቡ ንመንፈሳዊ ኣገልግሎት ዝህብ መተግበሪያ እዩ።',
    lang: 'ቋንቋ',
    artist: 'ስም ዘማሪ',
    nowPlaying: 'ዝስማዕ ዘሎ',
    play: 'ኣጫውት',
    lyrics: 'ግጥምታት',
    editLyrics: 'ግጥሚ ወስኽ',
    editSong: 'መዝሙር አስተካክል',
    share: 'ኣካፍል',
    save: 'ኣቀምጥ',
    cancel: 'ግደፍ',
    about: 'ብዛዕባ',
    theme: 'ገጽታ',
    lightMode: 'ብርሃን',
    darkMode: 'ጸልማት',
    language: 'ቋንቋ',
    success: 'መተግበሪያኹም ተሰሪሑ እዩ!',
    followUs: 'ስዓቡና',
    close: 'ዕጸው',
    lyricsSize: 'ዓቐን ግጥሚ',
    calendar: 'ጽባሕ',
    ethiopianCalendar: 'ናይ ኢትዮጵያ ዘመን ኣቆፃፅራ',
    today: 'ሎሚ',
    happyHoliday: 'እንቋዕ ኣብጽሓኩም',
    holidayGreeting: 'እንቋዕ ን{name} ብሰላም ኣብጽሓኩም!',
    ethMonths: ['መስከረም', 'ጥቅምቲ', 'ሕዳር', 'ታሕሳስ', 'ጥሪ', 'ለካቲት', 'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰነ', 'ሓምለ', 'ነሓሰ', 'ጳጉሜን'],
    ethDays: ['ሰንበት', 'ሰኑይ', 'ሰሉስ', 'ረቡዕ', 'ሓሙስ', 'ዓርቢ', 'ቀዳም'],
    download: 'አውርድ',
    downloaded: 'ዝወረደ',
    delete: 'አጥፋ',
    downloading: 'እየወረደ እዩ...',
    monthlyHolidays: 'ናይ ወርሒ ክብረ በዓላት',
    aiChat: 'ኦርቶዶክስ AI ዕላል',
    aiChatPlaceholder: 'ብዛዕባ እምነት ኦርቶዶክስ ሕተቱ...',
    aiChatIntro: 'ሰላም! ኣነ ናይ ኦርቶዶክስ ተዋሕዶ እምነት ሓጋዚ እየ። ብዛዕባ መዝሙራት፣ በዓላት፣ ቅዱሳን ወይ ትምህርትታት ክትሓቱኒ ትኽእሉ ኢኹም።',
    aiChatError: 'ይቕረታ፣ ምላሽ ክርከብ ኣይተኻእለን። በጃኹም ድሕሪ ሕጂ ፈትኑ።',
    aiChatClear: 'ታሪክ ደምስስ',
    offlineMode: 'ከመስመር ወጻኢ',
    offlineAlert: 'እዚ መዝሙር እዚ ኣይወረደን። ከመስመር ወጻኢ ንምስማዕ በጃኹም ቅድም የውርዱዎ።',
    holidays: [
      'ልደታ ለማርያም', 'ኣባ ታዴዎስ / ኣባ ጉባ', 'በኣታ ለማርያም', 'ዮሃንስ ወልደ ነጐድጓድ', 'ኣቡነ ገብረ መንፈስ ቅዱስ', 
      'ኢየሱስ', 'ስላሴ', 'ኣቡነ ኪሮስ', 'ቶማስ', 'መስቀል', 
      'ሓና ማርያም', 'ቅዱስ ሚካኤል', 'እግዚአብሔር ኣቦ / ረፋኤል', 'ኣቡነ ኣረጋዊ', 'ቂርቆስ', 
      'ኪዳነ ምሕረት', 'እስጢፋኖስ / ኣቡነ ገሪማ', 'ቅዱስ ያዕቆብ', 'ቅዱስ ገብርኤል', 'ሄኖክ', 
      'ቅድስት ማርያም', 'ቅዱስ ዑራኤል', 'ቅዱስ ጊዮርጊስ', 'ኣቡነ ተክለ ሃይማኖት', 'መርቆሬዎስ', 
      'ቶማስ / ኣቡነ ሰላማ', 'መድኃኔ ዓለም', 'ኣማኑኤል', 'ባዕለ እግዚአብሔር', 'ቅዱስ ማርቆስ'
    ]
  },
  or: {
    title: "Dekike Tinsae",
    sub: "",
    home: "Faarfannaa",
    categories: "Ramaddii",
    favorites: "Jaallataman",
    downloads: "Buufaman",
    settings: "Sajoo",
    search: "Faarfannoo barbaadi...",
    upload: "Faarfannaa dabali",
    featured: "Adda",
    allSongs: "Faarfannaa hunda",
    aboutTitle: "Waa'ee Appii",
    aboutText: "Dekike Tinsae Mana Kiristaanaa Ortodooksii Tawaahidoo Itoophiyaatti faarfannaawwan, qiddaaseewwan fi weedduuwwan hafuuraa bakka tokkotti walitti qabuun tajaajila hafuuraaf kan ooludha.",
    lang: "Afaan",
    artist: "Maqaa Faarfataa",
    nowPlaying: "Tapha kan jiru",
    play: "Taphadhu",
    lyrics: "Walaloo",
    editLyrics: "Walaloo dabali",
    editSong: "Faarfannoo sirreessi",
    share: "Qoodi",
    save: "Ol-kaayi",
    cancel: "Dhiisi",
    about: "Waa'ee",
    theme: "Haala",
    lightMode: "Bifaan",
    darkMode: "Gurraacha",
    language: "Afaan",
    success: "Appiin kee qophaa'edha!",
    followUs: "Nu hordofaa",
    close: "Cufi",
    lyricsSize: 'Hamma Walaloo',
    calendar: "Kalendarii",
    ethiopianCalendar: "Kalendarii Itoophiyaa",
    today: "Harr'a",
    happyHoliday: "Baga ittiin isin gahe",
    holidayGreeting: "Baga ayyaana {name} ittiin isin gahe!",
    ethMonths: ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit', 'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehasse', 'Pagume'],
    ethDays: ['Dilbata', 'Wiixata', 'Wallaga', 'Roobii', 'Kamisa', 'Jimaata', 'Sanbata'],
    download: 'Buufadhu',
    downloaded: 'Kan Buufame',
    delete: 'Haqui',
    downloading: 'Buufamaa jira...',
    monthlyHolidays: 'Ayyaanota Baatii',
    aiChat: 'Orthodox AI Chat',
    aiChatPlaceholder: 'Waa\'ee amantaa Ortodooksii gaafadhu...',
    aiChatIntro: 'Nagaa! Ani gargaaraa amantaa Ortodooksii Tawaahidooti. Waa\'ee faarfannaa, ayyaanota, qulqulloota, ykn barsiisa gaafachuu dandeessa.',
    aiChatError: 'Dhiifama, deebii argachuun hin danda\'amne. Maaloo irra deebi\'ii yaali.',
    aiChatClear: 'Seenaa Haqi',
    offlineMode: 'Offline',
    offlineAlert: 'Faarfannaan kun hin buufamne. Offline dhaggeeffachuuf maaloo dura buufadhu.',
    holidays: [
      'Lideta Mariyam', 'St. Thaddeus', 'Ba\'ata Mariyam', 'Yohaannis', 'Abune Gebre Menfes Qidduus',
      'Eyesus', 'Sillaasee', 'Abune Kiros', 'St. Toomaas', 'Mesqel',
      'Hanna Mariyam', 'St. Mikaa\'el', 'Egzi\'abher Ab', 'Abune Aregaawii', 'St. Qirqoos',
      'Kidaane Mehret', 'St. Isxiifanos', 'St. Yaa\'iqoob', 'St. Gabri\'eel', 'St. Henok',
      'St. Mariyam', 'St. Ura\'eel', 'St. Giyoorgis', 'Abune Tekle Haymanot', 'St. Merkorewos',
      'St. Toomaas', 'Medhaane Alem', 'St. Amaanu\'el', 'Bale Egzi\'abher', 'St. Marqoos'
    ]
  }
};

// --- Components ---

const AppLogo = ({ className = "", url = null, onClick }: { className?: string, url?: string | null, onClick?: () => void }) => {
  const [error, setError] = React.useState(false);
  const displayUrl = url || "/logo.png";

  React.useEffect(() => {
    setError(false);
  }, [url]);
  
  return (
    <div 
      onClick={onClick}
      className={`flex items-center justify-center overflow-hidden ${className} ${onClick ? 'cursor-pointer active:scale-95 transition-transform' : ''}`}
    >
      {!error ? (
        <img 
          src={displayUrl} 
          alt="App Logo" 
          className="w-full h-full object-contain drop-shadow-2xl"
          onError={() => setError(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full bg-church-maroon rounded-full flex items-center justify-center border-2 border-church-gold/30">
          <Church className="w-1/2 h-1/2 text-church-gold animate-pulse-slow" />
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [showInbox, setShowInbox] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(true);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'am');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const [brandingUrl, setBrandingUrl] = useState<string | null>(() => localStorage.getItem('cached_branding_url'));
  const [brandingTitle, setBrandingTitle] = useState<string | null>(() => localStorage.getItem('cached_branding_title'));
  const [chatMessages, setChatMessages] = useState<{ id: string, role: 'user' | 'model', text: string, timestamp: number }[]>(() => {
    try {
      const saved = localStorage.getItem('orthodox_ai_chat');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);


  const [songs, setSongs] = useState<Song[]>(() => {
    try {
      const saved = localStorage.getItem('cached_songs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [appReady, setAppReady] = useState(() => {
    try {
      const saved = localStorage.getItem('cached_songs');
      return saved && JSON.parse(saved).length > 0;
    } catch (e) {
      return false;
    }
  });
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    // Prevent default context menu for a more native feel
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<Tab>('home');

  useEffect(() => {
    try {
      localStorage.setItem('orthodox_ai_chat', JSON.stringify(chatMessages));
    } catch (e) {}
    if (activeTab === 'ai-chat') {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chatMessages, activeTab]);

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const [showPlayer, setShowPlayer] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [notificationsConfirmed, setNotificationsConfirmed] = useState(() => {
    try {
      return localStorage.getItem('notifications') === 'granted';
    } catch (e) {
      return false;
    }
  });

  // Trigger System Notification
  const triggerSystemNotification = (title: string, body: string) => {
    try {
      if (!("Notification" in window)) return;
      
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: '/logo.png' });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            setNotificationsConfirmed(true);
            try {
              localStorage.setItem('notifications', 'granted');
            } catch (e) {}
            new Notification(title, { body, icon: '/logo.png' });
          }
        }).catch(err => console.error("Notification permission error", err));
      }
    } catch (err) {
      console.error("Notification trigger failed", err);
    }
  };

  // Listen for online status to send holiday greeting (not inside app)
  useEffect(() => {
    const handleOnlineStatus = () => {
      try {
        const now = new Date();
        const results = toEthiopian(now.getFullYear(), now.getMonth() + 1, now.getDate());
        if (!Array.isArray(results) || results.length < 3) return;
        const [eYear, eMonth, eDay] = results;
        
        const majorHolidays: Record<string, string> = {
          '1-1': lang === 'am' ? 'አዲስ ዓመት (እንቁጣጣሽ)' : 'New Year',
          '1-17': lang === 'am' ? 'መስቀል ደመራ' : 'Meskel',
          '4-29': lang === 'am' ? 'ገና (ልደተ ክርስቶስ)' : 'Christmas',
          '5-11': lang === 'am' ? 'ጥምቀት' : 'Epiphany',
          '8-4': lang === 'am' ? 'ትንሣኤ (ፋሲካ)' : 'Easter',
          '9-1': lang === 'am' ? 'ግንቦት ልደታ' : 'Ginbot Lideta',
          '12-13': lang === 'am' ? 'ደብረ ታቦር (ቡሔ)' : 'Debre Tabor',
        };
        
        const key = `${eMonth}-${eDay}`;
        const holidayName = majorHolidays[key] || t.holidays[eDay - 1];
        
        if (holidayName) {
          const lastSent = localStorage.getItem('last_holiday_notification');
          const today = `${eYear}-${eMonth}-${eDay}`;
          
          if (lastSent !== today) {
            const greeting = t.holidayGreeting.replace('{name}', holidayName);
            triggerSystemNotification(t.title, greeting);
            localStorage.setItem('last_holiday_notification', today);
          }
        }
      } catch (err) {
        console.error("Holiday greeting check failed", err);
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    // Initial check
    if (navigator.onLine) handleOnlineStatus();

    return () => window.removeEventListener('online', handleOnlineStatus);
  }, [lang]);
  const [editingLyrics, setEditingLyrics] = useState(false);
  const [newLyrics, setNewLyrics] = useState('');
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editCategory, setEditCategory] = useState<Song['category']>('mezmur');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadedIds, setDownloadedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('downloaded_songs');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showSocials, setShowSocials] = useState(false);
  const [adminVisible, setAdminVisible] = useState(false);
  const [adminTapCount, setAdminTapCount] = useState(0);
  const [isUpdatingBranding, setIsUpdatingBranding] = useState(false);
  const [logoUploadProgress, setLogoUploadProgress] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [uploadCategory, setUploadCategory] = useState<Song['category']>('mezmur');
  const [uploadIsFeatured, setUploadIsFeatured] = useState(false);
  const [uploadLyrics, setUploadLyrics] = useState('');
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedShareSong, setSelectedShareSong] = useState<Song | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const t = translations[lang];
  const [tempTitle, setTempTitle] = useState<string>('');
  
  useEffect(() => {
    if (brandingTitle) setTempTitle(brandingTitle);
    else if (t.title) setTempTitle(t.title);
  }, [brandingTitle, t.title]);

  useEffect(() => {
    if (brandingUrl && 'caches' in window) {
       // Auto-sync branding logo to cache for SW icon hijacking
       const syncLogo = async () => {
         try {
           const cache = await caches.open('branding-assets-v1');
           // Always refresh the cache to ensure the icon is up to date
           const response = await fetch(brandingUrl);
           if (response.ok) {
             await cache.put('custom-logo', response);
           }
         } catch (e) {
           console.warn("Logo sync failed", e);
         }
       };
       syncLogo();
    }
  }, [brandingUrl]);

  const handleBrandingUpdate = async (newTitle: string, file?: File) => {
    if (!isAdmin) return;
    setIsUpdatingBranding(true);
    setLogoUploadProgress(1);
    try {
      let logoUrl = brandingUrl;
      if (file) {
        logoUrl = await uploadLogo(file, (p) => {
          setLogoUploadProgress(Math.floor(p));
        });
        // Cache the branding logo so SW can hijack /logo.png
        // We use a try-catch for caching so it doesn't block the main update if it fails
        if ('caches' in window) {
           try {
             const cache = await caches.open('branding-assets-v1');
             // Use the file object directly to avoid potential CORS issues with fetch
             await cache.put('custom-logo', new Response(file));
           } catch (cacheErr) {
             console.warn("Local logo caching failed", cacheErr);
           }
        }
      }
      await updateBranding({ appName: newTitle, logoUrl });
      alert(lang === 'am' ? 'ማስተካከያው በተሳካ ሁኔታ ተቀምጧል!' : 'Branding updated successfully!');
    } catch (err: any) {
      console.error("Branding update failed", err);
      alert((lang === 'am' ? 'ማስተካከያው አልተሳካም፦ ' : 'Update failed: ') + (err.message || 'Unknown error'));
    } finally {
      setIsUpdatingBranding(false);
      setLogoUploadProgress(0);
    }
  };

  const handleAdminTap = () => {
    const newCount = adminTapCount + 1;
    setAdminTapCount(newCount);
    if (newCount >= 5) {
      setAdminVisible(true);
      setAdminTapCount(0);
      alert(lang === 'am' ? 'የአስተዳዳሪ ሞድ ነቅቷል! አሁን ወደ ታች በመውረድ መግባት ይችላሉ።' : 'Admin Mode Enabled! Scroll down to sign in.');
    }
  };

  const [needRefresh, setNeedRefresh] = useState(false);
  
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setNeedRefresh(true);
      });
    }
  }, []);

  const handleUpdate = () => {
    window.location.reload();
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (showSearch) {
      searchInputRef.current?.focus();
    }
  }, [showSearch]);

  // Initialize Firebase and load songs
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      const isAdm = isUserAdmin(u);
      setIsAdmin(isAdm);
      if (isAdm) setAdminVisible(true);
      setIsLoading(false);
    });

    const q = getSongs();
    const unsubSongs = onSnapshot(q, (snapshot) => {
      const all: Song[] = [];
      snapshot.forEach((doc) => {
        all.push({ id: doc.id, ...doc.data() } as Song);
      });
      setSongs(all);
      try {
        localStorage.setItem('cached_songs', JSON.stringify(all));
      } catch (e) {}
      setIsLoading(false);
      setAppReady(true);
    }, (error) => {
      console.warn("Firestore songs load error (probably offline):", error);
      setIsLoading(false);
      setAppReady(true);
    });

    const unsubBranding = onSnapshot(getBranding(), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.logoUrl) {
          setBrandingUrl(data.logoUrl);
          localStorage.setItem('cached_branding_url', data.logoUrl);
        }
        if (data.appName) {
          setBrandingTitle(data.appName);
          localStorage.setItem('cached_branding_title', data.appName);
        }
      }
    }, (error) => {
      console.warn("Firestore branding load error (probably offline):", error);
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });

    const interval = setInterval(() => {
      if (audioRef.current && isPlaying) {
        const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
        setProgress(isNaN(p) ? 0 : p);
      }
    }, 500);

    return () => {
      unsubAuth();
      unsubSongs();
      unsubBranding();
      clearInterval(interval);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (appReady && songs.length > 0) {
      try {
        const params = new URLSearchParams(window.location.search);
        const sharedId = params.get('songId') || params.get('song') || params.get('share');
        if (sharedId) {
          const found = songs.find(s => s.id === sharedId);
          if (found) {
            playSong(found);
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          }
        }
      } catch (err) {
        console.warn("Error handling deep-linked song on startup:", err);
      }
    }
  }, [appReady, songs]);

  const refreshSongs = async () => {
    // onSnapshot handles this now
  };

  const getDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const url = URL.createObjectURL(file);
      audio.src = url;
      
      const timeout = setTimeout(() => {
        URL.revokeObjectURL(url);
        resolve('0:00');
      }, 5000);

      audio.onloadedmetadata = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        const min = Math.floor(audio.duration / 60);
        const sec = Math.floor(audio.duration % 60);
        resolve(`${min}:${sec < 10 ? '0' : ''}${sec}`);
      };

      audio.onerror = () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(url);
        resolve('0:00');
      };
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;

    // Be more lenient with file types as some mobile devices report differently
    const isAudio = file.type.startsWith('audio/') || file.name.toLowerCase().endsWith('.mp3');
    if (!isAudio) {
      alert(lang === 'am' ? 'እባክዎ መዝሙር (MP3) ፋይል ብቻ ይምረጡ' : 'Please select an audio (MP3) file');
      return;
    }

    setUploadFile(file);
    setUploadTitle(file.name.replace(/\.[^/.]+$/, ""));
    setUploadArtist('');
    setUploadCategory('mezmur');
    setUploadIsFeatured(false);
    setUploadLyrics('');
    
    // Generate Preview URL (Merging user's URL.createObjectURL logic)
    const previewUrl = URL.createObjectURL(file);
    setUploadPreviewUrl(previewUrl);
    
    setUploadProgress(0);
    setShowUploadModal(true);
    // Reset input
    e.target.value = '';
  };

  const startActualUpload = async () => {
    if (!uploadFile || !isAdmin) {
      alert(lang === 'am' ? 'እባክዎ እንደ አስተዳዳሪ መግባትዎን ያረጋግጡ' : 'Please ensure you are logged in as admin');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Step 1: Duration extraction
      setUploadProgress(2);
      const durationString = await getDuration(uploadFile);
      
      // Step 2: Audio File Upload to Firebase Storage
      setUploadProgress(5);
      const audioUrl = await uploadAudio(uploadFile, (p) => {
        // Range 5% to 90%
        setUploadProgress(Math.floor(5 + (p * 0.85)));
      });
      
      // Step 3: Metadata entry in Firestore
      setUploadProgress(92);
      const songData = {
        title: uploadTitle,
        artist: uploadArtist,
        category: uploadCategory,
        lyrics: uploadLyrics,
        isFeatured: uploadIsFeatured,
        audioUrl: audioUrl,
        duration: durationString,
        addedAt: Date.now(),
        createdBy: user?.uid
      };
      
      await addSongData(songData);
      
      // Step 4: Finalize
      setUploadProgress(100);
      setTimeout(() => {
        setIsUploading(false);
        setShowUploadModal(false);
        if (uploadPreviewUrl) {
          URL.revokeObjectURL(uploadPreviewUrl);
          setUploadPreviewUrl(null);
        }
        setUploadFile(null);
        setUploadProgress(0);
        alert(lang === 'am' ? 'መዝሙሩ በተሳካ ሁኔታ ተጭኗል!' : 'Song uploaded successfully!');
      }, 500);
      
    } catch (err: any) {
      console.error("Critical Upload Error:", err);
      let errorMsg = err.message || 'Unknown error';
      
      if (errorMsg.includes('Permission Denied') || errorMsg.includes('ፈቃድ')) {
        errorMsg = lang === 'am' ? 'የመጫን ፈቃድ የሎትም (Permission Denied)። እባክዎ እንደገና ይግቡ።' : 'Permission Denied. Please try re-logging.';
      }
      
      alert((lang === 'am' ? 'መጫን አልተቻለም፦ ' : 'Upload failed: ') + errorMsg);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    
    const userText = chatInput.trim();
    setChatInput('');
    setIsChatLoading(true);

    const newUserMsg = {
      id: Math.random().toString(36).substring(7),
      role: 'user' as const,
      text: userText,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, newUserMsg]);

    try {
      const historyForAPI = chatMessages.slice(-10).map(m => ({
        role: m.role,
        text: m.text
      }));

      const reply = await askOrthodoxAI(userText, historyForAPI, lang);
      
      const newModelMsg = {
        id: Math.random().toString(36).substring(7),
        role: 'model' as const,
        text: reply,
        timestamp: Date.now()
      };

      setChatMessages(prev => [...prev, newModelMsg]);
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg = {
        id: Math.random().toString(36).substring(7),
        role: 'model' as const,
        text: t.aiChatError || 'Sorry, could not get a response. Please try again.',
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };


  const handleToggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(id);
    const updatedSongs = songs.map(s => {
      if (s.id === id) {
        return { ...s, isFavorite: !s.isFavorite };
      }
      return s;
    });
    setSongs(updatedSongs);
  };

  const handleDownload = async (song: Song, e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloadedIds.includes(song.id)) return;
    
    setDownloadingId(song.id);
    try {
      const cache = await caches.open('meimur-audio-cache');
      const response = await fetch(song.audioUrl);
      if (response.ok) {
        await cache.put(song.audioUrl, response);
        const newDownloaded = [...downloadedIds, song.id];
        setDownloadedIds(newDownloaded);
        localStorage.setItem('downloaded_songs', JSON.stringify(newDownloaded));
      }
    } catch (error) {
      console.error("Download failed", error);
    } finally {
      setDownloadingId(null);
    }
  };

  const removeFromDownloads = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const song = songs.find(s => s.id === id);
      if (song) {
        const cache = await caches.open('meimur-audio-cache');
        await cache.delete(song.audioUrl);
      }
      const newDownloaded = downloadedIds.filter(did => did !== id);
      setDownloadedIds(newDownloaded);
      localStorage.setItem('downloaded_songs', JSON.stringify(newDownloaded));
    } catch (error) {
      console.error("Delete from cache failed", error);
    }
  };

  const handleShareSong = async (song: Song) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?songId=${song.id}`;
    const shareText = lang === 'am' ? `የዘማሪ ${song.artist} ድንቅ መዝሙር - "${song.title}" በደቂቀ ትንሣኤ ያዳምጡ።` : 
                      lang === 'ti' ? `ናይ ዘማሪ ${song.artist} ዝገርም መዝሙር - "${song.title}" ኣብ ደቂቀ ትንሣኤ ስምዑ።` :
                      lang === 'or' ? `Faarfannaa bareedaa barruu ${song.artist} - "${song.title}" Dekike Tinsae irratti dhaggeeffadhaa.` :
                      `Listen to "${song.title}" by ${song.artist} on Dekike Tinsae.`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: song.title,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        console.log("Native share cancelled or unsupported, falling back to modal", err);
      }
    }
    
    setSelectedShareSong(song);
    setShowShareModal(true);
    setCopiedLink(false);
  };

  const playSong = async (song: Song) => {
    if (!isOnline && !downloadedIds.includes(song.id)) {
      alert(t.offlineAlert);
      return;
    }

    if (currentSong?.id === song.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
      return;
    }

    let url = song.audioUrl;
    try {
      const cache = await caches.open('meimur-audio-cache');
      const cachedResponse = await cache.match(song.audioUrl);
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        url = URL.createObjectURL(blob);
      }
    } catch (e) {
      console.error("Cache check failed", e);
    }

    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.play().catch(e => console.error("Play failed", e));
      setIsPlaying(true);
      setCurrentSong(song);
      setShowPlayer(true);
      setProgress(0);

      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: song.title,
          artist: song.artist,
          album: t.title,
          artwork: [{ src: 'https://picsum.photos/seed/church/512/512', sizes: '512x512', type: 'image/png' }]
        });
      }
    }
  };

  const nextSong = () => {
    const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
    if (currentIndex < songs.length - 1) {
      playSong(songs[currentIndex + 1]);
    }
  };

  const prevSong = () => {
    const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
    if (currentIndex > 0) {
      playSong(songs[currentIndex - 1]);
    }
  };

  const [lyricsFontSize, setLyricsFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('lyricsFontSize');
    return saved ? parseInt(saved) : 18;
  });

  useEffect(() => {
    localStorage.setItem('lyricsFontSize', lyricsFontSize.toString());
  }, [lyricsFontSize]);

  const changeLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleInstall = () => {
    if (installPrompt) {
      installPrompt.prompt();
      installPrompt.userChoice.then(() => setInstallPrompt(null));
    }
  };

  const handleShare = async (song: Song) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: song.title,
          text: `Listening to ${song.title} by ${song.artist} on ደቂቀ ትንሣኤ Hub!`,
          url: window.location.href,
        });
      } catch (e) {
        console.error('Sharing failed', e);
      }
    }
  };

  const handleSaveLyrics = async () => {
    if (currentSong && isAdmin) {
      try {
        await updateSongData(currentSong.id, { lyrics: newLyrics });
        setCurrentSong({ ...currentSong, lyrics: newLyrics });
        setEditingLyrics(false);
      } catch (err) {
        console.error("Save lyrics failed", err);
      }
    }
  };

  const handleSaveSongDetails = async () => {
    if (editingSong && isAdmin) {
      try {
        const updates = {
          title: editTitle,
          artist: editArtist,
          category: editCategory,
          isFeatured: editIsFeatured
        };
        await updateSongData(editingSong.id, updates);
        setEditingSong(null);
        if (currentSong?.id === editingSong.id) {
          setCurrentSong({ ...currentSong, ...updates });
        }
      } catch (err) {
        console.error("Save song details failed", err);
      }
    }
  };

  const handleDeleteSong = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteSongData(id);
      setDeleteConfirmId(null);
      if (currentSong?.id === id) {
        setCurrentSong(null);
        setIsPlaying(false);
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const categories = lang === 'am' ? [
    { id: 'regular', title: 'የዘወትር መዝሙር' },
    { id: 'saints', title: 'የቅዱሳን መዝሙር' },
    { id: 'holiday', title: 'የበዓል መዝሙር' },
  ] : [
    { id: 'regular', title: 'Regular Mezmur' },
    { id: 'saints', title: 'Saints Mezmur' },
    { id: 'holiday', title: 'Holiday Mezmur' },
  ];

  const displaySongs = songs.filter(s => {
    const queryStr = searchQuery.toLowerCase();
    const matchesSearch = s.title.toLowerCase().includes(queryStr) || 
                         s.artist.toLowerCase().includes(queryStr) ||
                         (s.lyrics && s.lyrics.toLowerCase().includes(queryStr));
    const matchesTab = activeTab === 'favorites' ? s.isFavorite : (activeTab === 'downloads' ? downloadedIds.includes(s.id) : true);
    const matchesCategory = selectedCategory ? s.category === selectedCategory : true;
    return matchesSearch && matchesTab && matchesCategory;
  });

  const featuredSongs = songs.filter(s => s.isFeatured).slice(0, 6);

  if (!appReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-church-maroon text-white overflow-hidden space-y-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-church-gold rounded-full opacity-20 blur-2xl animate-pulse" />
          <AppLogo 
            className="w-32 h-32 relative z-10 cursor-pointer active:scale-95 transition-transform" 
            url={brandingUrl} 
            onClick={() => setShowSocials(true)} 
          />
        </motion.div>
        <div className="text-center space-y-2 relative z-10 px-6">
          <h1 className="text-4xl font-bold tracking-tight text-church-gold">{brandingTitle || t.title}</h1>
          <p className="text-white/60 italic text-sm">{t.sub}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#070101] overflow-hidden p-0 md:p-6 select-none z-50">
      {/* Mystical Orthodox halo background on desktop */}
      <div className="absolute inset-0 z-0 hidden md:block">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-church-maroon/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-church-gold/15 rounded-full blur-[160px] animate-pulse" style={{ animationDelay: '2.5s' }} />
      </div>

      {/* Main Mobile App Chassis Frame */}
      <div 
        className={`relative w-full h-full md:max-w-[412px] md:h-[844px] md:max-h-[92vh] md:rounded-[44px] md:shadow-[0_24px_70px_rgba(0,0,0,0.9)] md:border-[10px] md:border-[#1e0707] overflow-hidden flex flex-col transition-colors duration-500 font-ethiopic z-10 ${theme === 'dark' ? 'bg-church-dark text-church-dark-text' : 'bg-church-cream text-church-text'}`}
        style={{ '--nav-bg': theme === 'dark' ? 'rgba(18, 18, 18, 0.85)' : 'rgba(255, 255, 255, 0.85)' } as React.CSSProperties}
      >
        {/* Mock Smartphone Status Bar on Desktop/Tablet */}
        <div className="hidden md:flex items-center justify-between px-6 pt-3 pb-2 text-[10px] font-black tracking-wider uppercase z-50 select-none opacity-60 mix-blend-difference text-white">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          
          {/* Dynamic Island Notch */}
          <div className="w-24 h-4.5 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-2 flex items-center justify-center space-x-1 px-3 shadow-inner">
             <div className="w-1.5 h-1.5 rounded-full bg-[#1da1f2]/40 animate-pulse" />
             <div className="h-1 w-8 bg-white/10 rounded-full" />
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[8px] font-extrabold">LTE</span>
            <div className="w-5 h-2.5 border border-current rounded-xs p-0.5 flex items-center">
              <div className="h-full w-4.5 bg-current rounded-2xs" />
            </div>
          </div>
        </div>

        <audio 
          ref={audioRef} 
          onEnded={nextSong}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

      {/* Side Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDrawer(false)}
              className="absolute inset-0 bg-black/60 z-[100] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`absolute top-0 left-0 bottom-0 w-[280px] z-[101] shadow-2xl flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-church-dark-surface border-r border-white/5' : 'bg-church-cream'}`}
            >
              <div className="bg-church-maroon p-8 pt-[calc(var(--safe-area-top)+4rem)] text-center space-y-2">
                <button 
                  onClick={() => { setShowSocials(true); setShowDrawer(false); }}
                  className="relative mx-auto mb-4 w-28 h-28 flex items-center justify-center active:scale-95 transition-transform"
                >
                  <div className="absolute inset-0 bg-church-gold/10 rounded-full blur-2xl animate-pulse" />
                  <AppLogo className="w-24 h-24 relative z-10" url={brandingUrl} />
                </button>
                <h2 className="text-2xl font-black text-church-gold tracking-tight">{brandingTitle || t.title}</h2>
                <p className="text-[10px] uppercase font-bold text-white/40 tracking-widest">Orthodox Mezmur Hub</p>
              </div>

              <div className="flex-1 p-6 space-y-4 overflow-y-auto scroll-none">
                <div className="pt-2 space-y-1">
                  <button 
                    onClick={() => { setActiveTab('settings'); setShowDrawer(false); setSelectedCategory(null); }}
                    className={`w-full flex items-center space-x-3 p-2.5 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-church-maroon text-white shadow-md' : 'text-church-secondary hover:bg-black/5 opacity-80'}`}
                  >
                    <Settings className="w-4.5 h-4.5" />
                    <span className="font-bold text-[13px]">{t.settings}</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('calendar'); setShowDrawer(false); setSelectedCategory(null); }}
                    className={`w-full flex items-center space-x-3 p-2.5 rounded-xl transition-all ${activeTab === 'calendar' ? 'bg-church-maroon text-white shadow-md' : 'text-church-secondary hover:bg-black/5 opacity-80'}`}
                  >
                    <Calendar className="w-4.5 h-4.5" />
                    <span className="font-bold text-[13px]">{t.calendar}</span>
                  </button>
                  <button 
                    onClick={() => { setActiveTab('ai-chat'); setShowDrawer(false); setSelectedCategory(null); }}
                    className={`w-full flex items-center space-x-3 p-2.5 rounded-xl transition-all ${activeTab === 'ai-chat' ? 'bg-church-maroon text-white shadow-md' : 'text-church-secondary hover:bg-black/5 opacity-80'}`}
                  >
                    <Sparkles className="w-4.5 h-4.5 text-church-gold animate-pulse" />
                    <span className="font-bold text-[13px]">{t.aiChat}</span>
                  </button>
                  <button 
                    onClick={() => { setShowSocials(true); setShowDrawer(false); }}
                    className={`w-full flex items-center space-x-3 p-2.5 rounded-xl transition-all text-church-secondary hover:bg-black/5 opacity-80`}
                  >
                    <MessageSquare className="w-4.5 h-4.5" />
                    <span className="font-bold text-[13px]">{lang === 'am' ? 'መልዕክት / ማህበራዊ' : 'Messages / Socials'}</span>
                  </button>
                </div>
              </div>

              <div className={`p-8 pb-[calc(var(--safe-area-bottom)+2rem)] border-t mt-auto ${theme === 'dark' ? 'border-white/5 opacity-40' : 'border-black/5 opacity-60'}`}>
                 <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 text-church-maroon">{t.aboutTitle}</h4>
                 <p className="text-[10px] leading-relaxed font-bold italic">{t.aboutText}</p>
                 <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                    <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">Version 2.0.4</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Styled Maroon Header */}
      <header className="bg-church-maroon text-church-gold px-4 pt-[calc(var(--safe-area-top)+2rem)] pb-6 shadow-lg shadow-black/10 relative z-10 transition-all duration-300">
        <div className="flex justify-between items-center mb-0">
           {!showSearch ? (
             <>
               <button onClick={() => setShowDrawer(true)} className="p-2 text-church-gold hover:opacity-70 transition-opacity active:scale-90">
                 <Menu className="w-6 h-6" />
               </button>
               
               <div className="text-center">
                 <h1 className="text-2xl font-black tracking-widest">{brandingTitle || t.title}</h1>
                 {!isOnline ? (
                   <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/25 text-amber-300 text-[8px] font-black uppercase tracking-widest border border-amber-500/35 animate-pulse mt-1">
                     <span className="w-1 h-1 rounded-full bg-amber-400" />
                     <span>{t.offlineMode}</span>
                   </span>
                 ) : (
                   <p className="text-[10px] uppercase font-medium text-white/40 tracking-[0.2em]">{t.sub}</p>
                 )}
               </div>
    
               <div className="flex items-center space-x-1">
                 <button onClick={() => setShowSearch(true)} className="p-2 text-church-gold hover:opacity-70 transition-opacity active:scale-90">
                   <Search className="w-6 h-6" />
                 </button>
               </div>
             </>
           ) : (
             <div className="flex-1 flex items-center bg-black/20 rounded-2xl px-4 py-1.5 animate-in fade-in zoom-in duration-300">
               <Search className="w-5 h-5 text-church-gold/40 mr-3" />
               <input 
                 ref={searchInputRef}
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder={t.search}
                 className="flex-1 bg-transparent border-none outline-none text-church-gold placeholder:text-church-gold/30 font-bold text-sm h-9"
               />
               <button 
                 onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                 className="p-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
               >
                 <X className="w-4 h-4 text-church-gold" />
               </button>
             </div>
           )}
        </div>
      </header>



      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-5 pb-[calc(var(--safe-area-bottom)+10rem)] pt-2 overscroll-contain touch-pan-y">
        
        {selectedCategory && (
          <header className="bg-church-maroon text-church-gold px-4 py-4 shadow-lg relative z-20 flex items-center">
             <button onClick={() => setSelectedCategory(null)} className="p-2 mr-2">
                <X className="w-6 h-6" />
             </button>
             <h2 className="text-xl font-black uppercase tracking-widest">{categories.find(c => c.id === selectedCategory)?.title}</h2>
          </header>
        )}

        {activeTab === 'home' && !selectedCategory && (
          <>
            {/* Editorial Featured Section */}
            {featuredSongs.length > 0 && (
              <section className="mb-12">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] block mb-1 ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-maroon/40'}`}>ተለይቶ የቀረበ</span>
                    <h2 className={`text-3xl font-black tracking-tighter leading-none italic ${theme === 'dark' ? 'text-church-gold' : 'text-church-maroon'}`}>{t.featured}</h2>
                  </div>
                  <div className="flex space-x-1.5 pb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-church-gold" />
                    <div className="w-1.5 h-1.5 rounded-full bg-church-gold/30" />
                    <div className="w-1.5 h-1.5 rounded-full bg-church-gold/10" />
                  </div>
                </div>
                
                <div className="flex space-x-6 overflow-x-auto scroll-none pb-8 snap-x -mx-5 px-5">
                  {featuredSongs.map(song => (
                    <motion.div 
                      key={song.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => playSong(song)}
                      className="flex-shrink-0 w-[75vw] max-w-[320px] relative group cursor-pointer snap-center"
                    >
                      <div className="w-full aspect-[10/12] rounded-[48px] overflow-hidden relative shadow-2xl shadow-church-maroon/20 border border-black/5">
                        <img 
                          src={`https://picsum.photos/seed/released-${song.id}/800/1000`} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-church-maroon/90 via-church-maroon/20 to-transparent" />
                        
                        <div className="absolute top-6 left-6">
                           <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                              <Music className="w-4 h-4 text-white" />
                           </div>
                        </div>

                        <div className="absolute top-6 right-6">
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               handleShareSong(song);
                             }}
                             className="w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 hover:scale-105 active:scale-95 backdrop-blur-md flex items-center justify-center border border-white/20 transition-all text-white shadow-md z-20 cursor-pointer"
                             title={t.share}
                           >
                              <Share2 className="w-4 h-4 text-white hover:text-church-gold transition-colors" />
                           </button>
                        </div>

                        <div className="absolute bottom-8 left-8 right-8 space-y-2">
                          <div className="flex items-center space-x-2">
                             <span className="w-6 h-[1px] bg-church-gold/60" />
                             <span className="text-[9px] font-black uppercase text-church-gold tracking-widest">{song.category}</span>
                          </div>
                          <h3 className="text-white text-2xl font-black tracking-tight leading-tight group-hover:text-church-gold transition-colors">{song.title}</h3>
                          <div className="flex items-center space-x-2">
                             <div className="w-5 h-5 rounded-full bg-church-gold flex items-center justify-center">
                                <Play className="w-2.5 h-2.5 fill-church-maroon text-church-maroon ml-0.5" />
                             </div>
                             <p className="text-white/70 text-xs font-bold">{song.artist}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === 'settings' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <header className="mb-10">
                <h1 
                  onClick={handleAdminTap}
                  className="text-4xl font-black text-church-maroon tracking-tighter mb-2 italic cursor-default select-none"
                >
                  {t.settings}
                </h1>
                <p className={`font-medium opacity-60 ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>Personalize your spiritual experience</p>
             </header>

             <div className="space-y-6">
                {/* 1. Language Settings */}
                <div className={`rounded-[32px] p-8 card-shadow border border-black/5 transition-colors ${theme === 'dark' ? 'bg-church-dark-surface border-white/5' : 'bg-white'}`}>
                   <h3 className="text-sm font-black uppercase tracking-widest text-church-maroon/40 mb-6">{t.language}</h3>
                   <div className="flex flex-col space-y-6">
                      <div className="space-y-1">
                         <p className="font-bold text-lg">App Language</p>
                         <p className={`text-xs ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>Select your preferred language / ቋንቋ ይምረጡ</p>
                      </div>
                      <div className={`p-2 rounded-[24px] grid grid-cols-2 gap-2 ${theme === 'dark' ? 'bg-white/5' : 'bg-church-cream'}`}>
                         <button 
                            onClick={() => changeLang('am')}
                            className={`py-4 rounded-2xl text-xs font-black uppercase transition-all flex flex-col items-center justify-center space-y-1 ${lang === 'am' ? 'bg-church-maroon text-white shadow-lg' : (theme === 'dark' ? 'text-white/40 hover:bg-white/10' : 'text-church-secondary hover:bg-black/5')}`}
                         >
                            <span className="text-sm">አማርኛ</span>
                            <span className="text-[8px] opacity-40">Amharic</span>
                         </button>
                         <button 
                            onClick={() => changeLang('en')}
                            className={`py-4 rounded-2xl text-xs font-black uppercase transition-all flex flex-col items-center justify-center space-y-1 ${lang === 'en' ? 'bg-church-maroon text-white shadow-lg' : (theme === 'dark' ? 'text-white/40 hover:bg-white/10' : 'text-church-secondary hover:bg-black/5')}`}
                         >
                            <span className="text-sm">English</span>
                            <span className="text-[8px] opacity-40">English</span>
                         </button>
                         <button 
                            onClick={() => changeLang('ti')}
                            className={`py-4 rounded-2xl text-xs font-black uppercase transition-all flex flex-col items-center justify-center space-y-1 ${lang === 'ti' ? 'bg-church-maroon text-white shadow-lg' : (theme === 'dark' ? 'text-white/40 hover:bg-white/10' : 'text-church-secondary hover:bg-black/5')}`}
                         >
                            <span className="text-sm">ትግርኛ</span>
                            <span className="text-[8px] opacity-40">Tigrigna</span>
                         </button>
                         <button 
                            onClick={() => changeLang('or')}
                            className={`py-4 rounded-2xl text-xs font-black uppercase transition-all flex flex-col items-center justify-center space-y-1 ${lang === 'or' ? 'bg-church-maroon text-white shadow-lg' : (theme === 'dark' ? 'text-white/40 hover:bg-white/10' : 'text-church-secondary hover:bg-black/5')}`}
                         >
                            <span className="text-sm">Oromiffa</span>
                            <span className="text-[8px] opacity-40">Afaan Oromoo</span>
                         </button>
                      </div>
                   </div>
                </div>

                {/* 2. Theme Settings */}
                <div className={`rounded-[32px] p-8 card-shadow border border-black/5 transition-colors ${theme === 'dark' ? 'bg-church-dark-surface border-white/5' : 'bg-white'}`}>
                   <h3 className="text-sm font-black uppercase tracking-widest text-church-maroon/40 mb-6">{t.theme}</h3>
                   <div className="flex items-center justify-between">
                      <div className="space-y-1">
                         <p className="font-bold text-lg">App Theme</p>
                         <p className={`text-xs ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>Switch between light and dark themes</p>
                      </div>
                      <div className={`p-1.5 rounded-full flex ${theme === 'dark' ? 'bg-white/5' : 'bg-church-cream'}`}>
                         <button 
                            onClick={() => toggleTheme('light')}
                            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase transition-all ${theme === 'light' ? 'bg-church-maroon text-white shadow-lg' : (theme === 'dark' ? 'text-white/40' : 'text-church-secondary')}`}
                         >
                            <Sun className="w-4 h-4" />
                         </button>
                         <button 
                            onClick={() => toggleTheme('dark')}
                            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase transition-all ${theme === 'dark' ? 'bg-church-maroon text-white shadow-lg' : (theme === 'dark' ? 'text-white/40' : 'text-church-secondary')}`}
                         >
                            <Moon className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </div>

                {/* 3. Lyrics Styling */}
                <div className={`rounded-[32px] p-8 card-shadow border border-black/5 transition-colors ${theme === 'dark' ? 'bg-church-dark-surface border-white/5' : 'bg-white'}`}>
                   <h3 className="text-sm font-black uppercase tracking-widest text-church-maroon/40 mb-6">{lang === 'am' ? 'የግጥም አቀራረብ' : 'Lyrics Styling'}</h3>
                   <div className="space-y-8">
                      <div className="space-y-4">
                         <p className="font-bold text-lg">{t.lyricsSize}</p>
                         <div className={`p-1.5 rounded-2xl flex ${theme === 'dark' ? 'bg-white/5' : 'bg-church-cream'}`}>
                            {[14, 18, 22, 26].map(size => (
                               <button 
                                  key={size}
                                  onClick={() => setLyricsFontSize(size)}
                                  className={`flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all ${lyricsFontSize === size ? 'bg-church-maroon text-white shadow-lg' : (theme === 'dark' ? 'text-white/40' : 'text-church-secondary')}`}
                               >
                                  {size === 14 ? (lang === 'am' ? 'ትንሽ' : 'S') : size === 18 ? (lang === 'am' ? 'መካከለኛ' : 'M') : size === 22 ? (lang === 'am' ? 'ትልቅ' : 'L') : (lang === 'am' ? 'በጣም ትልቅ' : 'XL')}
                               </button>
                            ))}
                         </div>
                      </div>
                    </div>
                </div>

                {/* 4. Admin Branding */}
                {isAdmin && (
                   <div className={`p-8 rounded-[32px] card-shadow border border-black/5 transition-colors ${theme === 'dark' ? 'bg-church-dark-surface border-white/5' : 'bg-white'}`}>
                      <div className="flex items-center space-x-3 mb-6">
                         <div className="p-2 bg-church-maroon/10 rounded-xl">
                            <Sparkles className="w-5 h-5 text-church-maroon" />
                         </div>
                         <h3 className="text-sm font-black uppercase tracking-widest text-church-maroon/40">{lang === 'am' ? 'የጣቢያው አርማ እና ስም' : 'Site Branding'}</h3>
                      </div>
                      
                      <div className="space-y-6">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">{lang === 'am' ? 'የአፕ ስም' : 'App Title'}</label>
                            <div className="flex space-x-2">
                               <input 
                                 type="text"
                                 value={tempTitle}
                                 onChange={(e) => setTempTitle(e.target.value)}
                                 className={`flex-1 p-4 rounded-2xl border border-black/5 outline-none font-bold text-sm ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-church-cream'}`}
                                 placeholder="Enter app name..."
                               />
                               {(tempTitle !== (brandingTitle || t.title)) && (
                                 <button 
                                   onClick={() => handleBrandingUpdate(tempTitle)}
                                   disabled={isUpdatingBranding}
                                   className="bg-church-maroon text-white px-6 rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-church-maroon/20 active:scale-95 transition-all disabled:opacity-50"
                                 >
                                   {isUpdatingBranding ? '...' : (lang === 'am' ? 'አስቀምጥ' : 'Save')}
                                 </button>
                               )}
                            </div>
                         </div>

                         <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-1">{lang === 'am' ? 'አዲስ አርማ (Icon)' : 'App Icon'}</label>
                            <div className="flex items-center space-x-4">
                               <div className="w-20 h-20 rounded-[28px] bg-church-maroon/10 flex items-center justify-center overflow-hidden border-2 border-church-gold/20 shadow-inner relative group transition-all active:scale-95">
                                 <AppLogo className="w-full h-full p-2" url={brandingUrl} />
                                 {isUpdatingBranding && (
                                   <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-2">
                                     <div className="w-8 h-8 border-4 border-church-gold border-t-transparent rounded-full animate-spin mb-1" />
                                     <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                                       <div className="h-full bg-church-gold transition-all duration-300" style={{ width: `${logoUploadProgress}%` }} />
                                     </div>
                                   </div>
                                 )}
                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                                   <Camera className="w-6 h-6 text-white" />
                                 </div>
                                 <input 
                                   id="logo-upload"
                                   type="file" 
                                   className="absolute inset-0 opacity-0 cursor-pointer" 
                                   accept="image/*"
                                   disabled={isUpdatingBranding}
                                   onChange={(e) => {
                                     const file = e.target.files?.[0];
                                     if (file) {
                                       if (file.size > 2 * 1024 * 1024) {
                                         alert(lang === 'am' ? 'ምስሉ ከ 2MB መብለጥ የለበትም' : 'Image must be less than 2MB');
                                         return;
                                       }
                                       handleBrandingUpdate(brandingTitle || t.title, file);
                                     }
                                   }}
                                 />
                               </div>
                               <div className="flex-1 space-y-1.5">
                                 <p className="text-sm font-black uppercase tracking-tight text-church-maroon">{isUpdatingBranding ? (lang === 'am' ? 'እያሻሻለ ነው...' : 'Updating...') : (lang === 'am' ? 'አርማ ይቀይሩ' : 'Change App Icon')}</p>
                                 <p className="text-[10px] opacity-40 font-bold leading-tight">
                                   {lang === 'am' ? 'PNG ወይም JPG ፋይል ይምረጡ (ከ 2MB በታች)' : 'Upload PNG or JPG (Max 2MB)'}
                                 </p>
                               </div>
                            </div>
                            <p className="text-[9px] opacity-40 font-medium italic mt-2">
                              {lang === 'am' 
                                ? '* ልብ ይበሉ፤ አዲስ አርማ ሲቀይሩ በስልክዎ ስክሪን (Home Screen) ላይ እንዲታይ አፑን በድጋሚ መጫን (Install) ሊኖርብዎ ይችላል።' 
                                : '* Note: To update the Home Screen icon on your phone, you may need to re-install the app.'}
                            </p>
                         </div>
                      </div>
                   </div>
                )}

                {/* 5. Device Sync & Install */}
                {!isStandalone && (
                   <div className="pt-8 border-t border-black/5 dark:border-white/5 animate-in slide-in-from-bottom-4 duration-1000">
                      <div className="flex items-center space-x-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-church-gold/10 flex items-center justify-center">
                         <QrCode className="w-5 h-5 text-church-gold" />
                      </div>
                      <h3 className="text-xl font-black italic tracking-tight">{lang === 'am' ? 'አፑን በስልክዎ ይጫኑ' : 'Get the App'}</h3>
                   </div>

                   <div className="grid grid-cols-1 gap-6">
                      {/* QR Code Section for PC users */}
                      <div className={`rounded-[32px] p-8 card-shadow border border-black/5 transition-colors ${theme === 'dark' ? 'bg-church-dark-surface border-white/5' : 'bg-white'}`}>
                         <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                            <div className="p-4 bg-white rounded-3xl shadow-inner border-4 border-church-cream">
                               <QRCodeSVG 
                                  value={window.location.href} 
                                  size={160}
                                  fgColor="#5a1515" // church-maroon
                                  level="H"
                                  includeMargin={false}
                               />
                            </div>
                            <div className="flex-1 space-y-4 text-center md:text-left">
                               <p className="font-bold text-lg">{lang === 'am' ? 'በስልክዎ ለመክፈት' : 'Open on Phone'}</p>
                               <p className={`text-sm font-medium leading-relaxed ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>
                                  {lang === 'am' ? 'ይህንን QR Code በስልክዎ ካሜራ ስካን በማድረግ አፑን በቀላሉ በስልክዎ መክፈት ይችላሉ።' : 'Scan this QR code with your phone camera to easily open the app on your mobile device.'}
                               </p>
                               <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-church-cream dark:bg-white/5 text-[10px] font-black uppercase tracking-widest text-church-gold">
                                  <Smartphone className="w-3 h-3" />
                                  <span>No typing needed!</span>
                               </div>
                            </div>
                         </div>
                      </div>

                      {/* Visual Install Guide */}
                      <div className="rounded-[32px] p-8 card-shadow border border-church-gold/30 bg-church-maroon text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                          <Smartphone className="w-48 h-48 -mr-16 -mt-16" />
                        </div>

                        <div className="relative z-10">
                          <div className="flex items-center space-x-3 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                              <Download className="w-5 h-5 text-church-gold" />
                            </div>
                            <h3 className="text-xl font-black italic tracking-tight">{lang === 'am' ? 'እንዴት እንደሚጫን' : 'Installation Guide'}</h3>
                          </div>

                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* iOS Instructions */}
                              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">iOS</div>
                                  <span className="font-bold text-sm">iPhone (Safari)</span>
                                </div>
                                <ol className="text-[11px] space-y-2 opacity-80 list-decimal pl-4 font-medium italic">
                                  <li>ከስር ያለውን <span className="text-church-gold font-black underline">"Share"</span> ምልክት ይንኩ።</li>
                                  <li>ወደ ታች <span className="text-white font-black underline">"Add to Home Screen"</span> የሚለውን ይጫኑ።</li>
                                </ol>
                              </div>

                              {/* Android Instructions */}
                              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                <div className="flex items-center space-x-3 mb-3">
                                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-[10px] font-black">AND</div>
                                  <span className="font-bold text-sm">Android (Chrome)</span>
                                </div>
                                <ol className="text-[11px] space-y-2 opacity-80 list-decimal pl-4 font-medium italic">
                                  <li>በቀኝ በኩል ያሉትን <span className="text-church-gold font-black underline">ሦስት ነጥቦች (⋮)</span> ይንኩ።</li>
                                  <li><span className="text-white font-black underline">"Install app"</span> የሚለውን ይምረጡ።</li>
                                </ol>
                              </div>
                            </div>

                            {installPrompt && (
                              <button 
                                onClick={handleInstall}
                                className="w-full bg-church-gold text-church-maroon py-4 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2 border-2 border-white/20"
                              >
                                <Download className="w-4 h-4" />
                                <span>አሁኑኑ ጫን / Install Now</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                   </div>
                </div>
                )}

                {/* 6. Admin Footer */}
                {(adminVisible || user) && (
                   <div className="mt-12 pt-8 border-t border-black/5 dark:border-white/5 flex justify-center">
                      {user ? (
                        <button 
                          onClick={() => { logout(); setAdminVisible(false); }}
                          className="text-[10px] font-black uppercase tracking-widest text-red-500/40 hover:text-red-500 transition-colors"
                        >
                          Sign Out ({user.email})
                        </button>
                      ) : (
                        <button 
                          onClick={() => signInWithGoogle()}
                          className={`px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest shadow-xl transition-all active:scale-95 ${theme === 'dark' ? 'bg-church-gold text-church-maroon opacity-60 hover:opacity-100' : 'bg-church-maroon text-white opacity-60 hover:opacity-100'}`}
                        >
                           Admin Access / የአስተዳዳሪ መግቢያ
                        </button>
                      )}
                    </div>
                  )}
             </div>
          </section>
        )}

        {activeTab === 'calendar' && (() => {
           const [eYear, eMonth, eDay] = toEthiopian(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
           
           return (
             <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <header className="mb-8">
                  <h1 className="text-4xl font-black text-church-maroon tracking-tighter mb-2 italic">{t.calendar}</h1>
                  <p className={`font-medium opacity-60 ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>{t.ethiopianCalendar}</p>
               </header>

               <div className={`rounded-[48px] p-10 card-shadow border border-black/5 overflow-hidden transition-colors ${theme === 'dark' ? 'bg-church-dark-surface border-white/5' : 'bg-white'}`}>
                  <div className="flex flex-col items-center text-center space-y-10">
                     <div className="relative">
                        <div className="absolute inset-0 bg-church-gold/10 rounded-full blur-3xl" />
                        <div className="relative z-10 w-32 h-32 bg-church-cream rounded-[40px] flex flex-col items-center justify-center border-4 border-church-gold/20 shadow-xl overflow-hidden">
                           <div className="w-full bg-church-maroon py-2 text-white text-[10px] font-black uppercase tracking-widest">{t.today}</div>
                           <div className="flex-1 flex items-center justify-center">
                              <span className="text-5xl font-black text-church-maroon">{eDay}</span>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <p className="text-church-gold font-black uppercase text-xs tracking-[0.3em]">{t.today}</p>
                        <h2 className="text-5xl font-black tracking-tighter">
                           {t.ethMonths[eMonth - 1]} {eDay}
                        </h2>
                        <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>
                           {eYear} ዓ.ም
                        </p>
                        <p className="text-church-maroon/40 font-black uppercase text-[10px] tracking-widest pt-4">
                           {t.ethDays[new Date().getDay()]}
                        </p>
                     </div>

                     <div className="w-full grid grid-cols-2 gap-4 pt-8 border-t border-black/5 dark:border-white/5">
                        <div className="text-left">
                           <p className="text-[10px] font-black uppercase text-church-gold tracking-widest mb-1">Gregorian</p>
                           <p className="text-sm font-bold opacity-60">
                              {new Date().toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' })}
                           </p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black uppercase text-church-gold tracking-widest mb-1">Season</p>
                           <p className="text-sm font-bold opacity-60">
                              {eMonth <= 3 ? (lang === 'am' ? 'መጸው' : 'Autumn') : 
                               eMonth <= 6 ? (lang === 'am' ? 'በጋ' : 'Winter') :
                               eMonth <= 9 ? (lang === 'am' ? 'ጸደይ' : 'Spring') : (lang === 'am' ? 'ክረምት' : 'Summer')}
                           </p>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Monthly Commemorations Card */}
               <div className={`rounded-[32px] p-8 card-shadow border border-black/5 transition-colors ${theme === 'dark' ? 'bg-church-dark-surface border-white/5' : 'bg-white'}`}>
                  <div className="flex items-center space-x-3 mb-6">
                     <div className="w-10 h-10 rounded-2xl bg-church-maroon/5 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-church-maroon" />
                     </div>
                     <h3 className="text-sm font-black uppercase tracking-widest text-church-maroon/40">{t.monthlyHolidays}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                     {t.holidays.map((holiday: string, index: number) => {
                        const isToday = (index + 1) === eDay;
                        return (
                           <div 
                             key={index} 
                             className={`flex items-center space-x-3 p-3 rounded-2xl border transition-all ${isToday ? 'bg-church-maroon text-white border-church-maroon scale-[1.02] shadow-lg z-10' : (theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-church-cream/30 border-black/5')}`}
                           >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${isToday ? 'bg-church-gold text-church-maroon' : 'bg-church-maroon text-white'}`}>
                                 {index + 1}
                              </div>
                              <span className="text-[11px] font-bold truncate">{holiday}</span>
                              {isToday && (
                                 <motion.div 
                                   animate={{ scale: [1, 1.2, 1] }}
                                   transition={{ repeat: Infinity, duration: 2 }}
                                   className="w-2 h-2 rounded-full bg-church-gold ml-auto"
                                 />
                              )}
                           </div>
                        );
                     })}
                  </div>
               </div>
             </div>
           );
        })()}

        {activeTab === 'ai-chat' && (() => {
           const suggestions = lang === 'am' ? [
             'ስለ አቡነ ተክለሃይማኖት ታሪክ ንገረኝ',
             'የኢትዮጵያ ኦርቶዶክስ ተዋሕዶ እምነት መሠረተ እምነቶች ምንድን ናቸው?',
             'ስለ ጾም ሥርዓት እና በዓላት አስረዳኝ'
           ] : lang === 'ti' ? [
             'ብዛዕባ ኣቡነ ተክለሃይማኖት ታሪክ ንገረኒ',
             'ናይ ኦርቶዶክስ ተዋሕዶ እምነት መሰረታት እንታይ እዮም?',
             'ብዛዕባ ጾምን በዓላትን ግለጸለይ'
           ] : lang === 'or' ? [
             'Waa\'ee seenaa Abune Teklehayimanot natti himi',
             'Hundeeffamni amantaa Ortodooksii Tawaahidoo maali?',
             'Waa\'ee sirna soomaa fi ayyaanotaa naaf ibsi'
           ] : [
             'Tell me about the history of Abune Tekle Haymanot',
             'What are the core dogmas of Orthodox Tewahedo Church?',
             'Explain the fasting seasons and holidays'
           ];

           return (
             <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                <header className="flex justify-between items-center mb-6">
                   <div>
                      <h1 className="text-4xl font-black text-church-maroon tracking-tighter mb-1 italic flex items-center gap-2">
                        <Sparkles className="w-8 h-8 text-church-gold animate-pulse" />
                        {t.aiChat}
                      </h1>
                      <p className={`text-xs font-bold opacity-60 ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>
                        {lang === 'am' ? 'የመንፈሳዊ እውቀት ማበልጸጊያ ረዳት' : 'Spiritual companion & theologian'}
                      </p>
                   </div>
                   {chatMessages.length > 0 && (
                      <button 
                        onClick={() => {
                          if (confirm(lang === 'am' ? 'የውይይት ታሪክ ማጽዳት ይፈልጋሉ?' : 'Clear all chat history?')) {
                            setChatMessages([]);
                            try { localStorage.removeItem('orthodox_ai_chat'); } catch (e) {}
                          }
                        }}
                        className="p-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors flex items-center justify-center"
                        title={t.aiChatClear}
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                   )}
                </header>

                <div className={`rounded-[32px] p-6 card-shadow border border-black/5 transition-colors flex flex-col h-[520px] md:h-[550px] overflow-hidden ${theme === 'dark' ? 'bg-church-dark-surface border-white/5' : 'bg-white'}`}>
                   {/* Message display board */}
                   <div className="flex-1 overflow-y-auto pr-1 space-y-4 scroll-none flex flex-col min-h-0">
                      {chatMessages.length === 0 ? (
                         <div className="my-auto flex flex-col items-center text-center px-4 py-8 space-y-6">
                            <div className="w-16 h-16 rounded-[24px] bg-church-maroon/10 flex items-center justify-center border-2 border-church-gold/20 relative animate-pulse-slow">
                               <Church className="w-8 h-8 text-church-maroon" />
                               <div className="absolute -top-1 -right-1 w-4 h-4 bg-church-gold rounded-full flex items-center justify-center">
                                  <Sparkles className="w-2.5 h-2.5 text-church-maroon" />
                               </div>
                            </div>
                            <div className="space-y-2 max-w-sm">
                               <p className="font-bold text-base text-church-maroon dark:text-church-gold">{lang === 'am' ? 'እንኳን ደህና መጡ' : 'Welcome to Orthodox AI'}</p>
                               <p className={`text-xs font-semibold leading-relaxed leading-5 ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>
                                  {t.aiChatIntro}
                                </p>
                            </div>
                            
                            {/* Suggestions panel */}
                            <div className="w-full space-y-2 pt-2">
                               {suggestions.map((sug, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() => {
                                      setChatInput(sug);
                                    }}
                                    className={`w-full text-left p-3.5 rounded-2xl border text-[11px] font-bold transition-all active:scale-98 hover:border-church-gold/60 ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10' : 'bg-church-cream/30 border-black/5 text-church-secondary hover:bg-church-cream'}`}
                                  >
                                    ⚡ "{sug}"
                                  </button>
                               ))}
                            </div>
                         </div>
                      ) : (
                         <div className="space-y-4 flex flex-col">
                            {chatMessages.map((msg) => (
                               <div 
                                 key={msg.id}
                                 className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end animate-in slide-in-from-right-4 duration-300' : 'self-start animate-in slide-in-from-left-4 duration-300'}`}
                               >
                                  <div className={`p-4 rounded-[24px] text-[13px] leading-relaxed shadow-xs ${
                                    msg.role === 'user' 
                                      ? 'bg-church-maroon text-white font-bold rounded-tr-none' 
                                      : `${theme === 'dark' ? 'bg-white/5 text-white/90 border border-white/5' : 'bg-church-cream/50 text-church-text border border-black/5'} font-semibold rounded-tl-none whitespace-pre-line`
                                  }`}>
                                     {msg.text}
                                  </div>
                                  <span className={`text-[9px] font-black tracking-widest mt-1 opacity-30 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                     {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                               </div>
                            ))}
                            {isChatLoading && (
                               <div className="flex flex-col max-w-[85%] self-start animate-pulse">
                                  <div className={`p-4 rounded-[24px] rounded-tl-none ${theme === 'dark' ? 'bg-white/5 border border-white/5' : 'bg-church-cream/50 border border-black/5'} flex items-center space-x-2`}>
                                     <div className="w-2 h-2 rounded-full bg-church-gold animate-bounce" style={{ animationDelay: '0s' }} />
                                     <div className="w-2 h-2 rounded-full bg-church-gold animate-bounce" style={{ animationDelay: '0.2s' }} />
                                     <div className="w-2 h-2 rounded-full bg-church-gold animate-bounce" style={{ animationDelay: '0.4s' }} />
                                  </div>
                               </div>
                            )}
                            <div ref={chatEndRef} />
                         </div>
                      )}
                   </div>

                   {/* Chat input box */}
                   <form 
                     onSubmit={(e) => {
                       e.preventDefault();
                       handleSendChatMessage();
                     }}
                     className="flex items-center space-x-2 mt-4 pt-4 border-t border-black/5 dark:border-white/5"
                   >
                      <input 
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={isChatLoading}
                        placeholder={t.aiChatPlaceholder}
                        className={`flex-1 p-4 rounded-2xl border outline-none font-bold text-sm transition-all ${
                          theme === 'dark' 
                            ? 'bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-church-gold' 
                            : 'bg-church-cream border-black/5 text-church-text placeholder:text-church-secondary/40 focus:border-church-maroon'
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={!chatInput.trim() || isChatLoading}
                        className={`p-4 rounded-2xl text-white font-black transition-all flex items-center justify-center shadow-lg active:scale-95 disabled:opacity-40 disabled:scale-100 ${
                          theme === 'dark' 
                            ? 'bg-church-gold text-church-maroon shadow-church-gold/10' 
                            : 'bg-church-maroon shadow-church-maroon/20'
                        }`}
                      >
                        <Send className="w-5 h-5" />
                      </button>
                   </form>
                </div>
             </section>
           );
        })()}

        {activeTab === 'categories' && !selectedCategory && (

          <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            <h2 className="text-xl font-black text-church-maroon mb-6 italic">{t.categories}</h2>
            <div className="space-y-3">
              {categories.map(cat => (
                <motion.button 
                  key={cat.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between p-6 rounded-[24px] card-shadow border transition-all text-left group ${theme === 'dark' ? 'bg-church-dark-surface border-white/5 hover:border-church-gold/30' : 'bg-white border-black/5 hover:border-church-gold/30'}`}
                >
                  <span className={`text-lg font-bold ${theme === 'dark' ? 'text-church-dark-text' : 'text-church-maroon'}`}>{cat.title}</span>
                  <ChevronRight className={`w-5 h-5 transition-colors ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-maroon/30'} group-hover:text-church-gold`} />
                </motion.button>
              ))}
            </div>
          </section>
        )}

        {/* All Songs Section / Filtered List */}
        {(activeTab === 'home' || activeTab === 'favorites' || activeTab === 'downloads' || selectedCategory) && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {selectedCategory && (
                  <button onClick={() => setSelectedCategory(null)} className={`p-1 -ml-1 hover:opacity-70 ${theme === 'dark' ? 'text-church-gold' : 'text-church-maroon'}`}>
                    <X className="w-5 h-5" />
                  </button>
                )}
                <h2 className={`text-lg font-black ${theme === 'dark' ? 'text-church-gold' : 'text-church-maroon'}`}>
                  {selectedCategory ? categories.find(c => c.id === selectedCategory)?.title : 
                   (activeTab === 'favorites' ? t.favorites : 
                    (activeTab === 'downloads' ? t.downloads : t.allSongs))}
                </h2>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>{displaySongs.length} songs</span>
            </div>
            
            <div className="space-y-4">
              {displaySongs.map(song => (
                <div 
                  key={song.id}
                  className={`rounded-[24px] p-4 flex flex-col space-y-3 card-shadow border transition-all ${theme === 'dark' ? 'bg-church-dark-surface border-white/5' : 'bg-white border-black/5'} ${currentSong?.id === song.id ? 'ring-2 ring-church-gold' : ''}`}
                >
                  <div className="flex items-center space-x-4" onClick={() => playSong(song)}>
                    <div className="w-16 h-16 rounded-[18px] overflow-hidden flex-shrink-0 border border-black/5">
                      <img src={`https://picsum.photos/seed/${song.id}/200/200`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className={`text-sm font-black truncate leading-tight ${theme === 'dark' ? 'text-church-dark-text' : 'text-church-text'}`}>{song.title}</h4>
                        <span className={`text-[10px] font-bold ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>{song.duration}</span>
                      </div>
                      <p className={`text-[11px] mt-0.5 font-medium ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>{song.artist}</p>
                      <div className="flex items-center space-x-1.5 mt-1">
                        <span className={`text-[8px] px-2 py-0.5 rounded-full inline-block font-black uppercase ${theme === 'dark' ? 'bg-church-gold/20 text-church-gold' : 'bg-church-cream text-church-maroon'}`}>{song.category}</span>
                        {downloadedIds.includes(song.id) && (
                          <span className={`text-[8px] px-2 py-0.5 rounded-full flex items-center space-x-1 font-black uppercase ${theme === 'dark' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-green-50 text-green-700 border border-green-100'}`}>
                            <span className="w-1 h-1 rounded-full bg-green-500" />
                            <span>{lang === 'am' ? 'ከመስመር ውጭ ይገኛል' : (lang === 'ti' ? 'ከመስመር ወጻኢ ይርከብ' : (lang === 'or' ? 'Offline' : 'Offline Ready'))}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Horizontal Action Bar */}
                  <div className={`flex items-center justify-between pt-1 border-t ${theme === 'dark' ? 'border-white/5' : 'border-black/5'}`}>
                    <button 
                      onClick={() => playSong(song)}
                      className="flex items-center space-x-2 bg-church-maroon text-white h-9 px-4 rounded-full text-[10px] font-black uppercase active:scale-95 transition-all shadow-md shadow-church-maroon/20"
                    >
                      {currentSong?.id === song.id && isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      <span>{t.play}</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button 
                        onClick={(e) => handleToggleFavorite(song.id, e)}
                        className={`p-2.5 rounded-full transition-colors ${song.isFavorite ? 'text-red-500 bg-red-50' : (theme === 'dark' ? 'text-white/20 hover:text-red-400' : 'text-church-secondary/40 hover:text-red-400')}`}
                      >
                        <Heart className={`w-4.5 h-4.5 ${song.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button 
                        onClick={(e) => downloadedIds.includes(song.id) ? removeFromDownloads(song.id, e) : handleDownload(song, e)}
                        disabled={downloadingId === song.id}
                        className={`p-2.5 transition-colors ${downloadedIds.includes(song.id) ? 'text-church-gold' : (theme === 'dark' ? 'text-white/20 hover:text-church-gold' : 'text-church-secondary/40 hover:text-church-maroon')} ${downloadingId === song.id ? 'animate-pulse' : ''}`}
                      >
                        {downloadingId === song.id ? <RefreshCw className="w-4.5 h-4.5 animate-spin" /> : (downloadedIds.includes(song.id) ? <Trash2 className="w-4.5 h-4.5" /> : <Download className="w-4.5 h-4.5" />)}
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={() => { 
                            setEditingSong(song); 
                            setEditTitle(song.title); 
                            setEditArtist(song.artist); 
                            setEditCategory(song.category);
                            setEditIsFeatured(song.isFeatured || false);
                          }} 
                          className={`p-2.5 transition-colors ${theme === 'dark' ? 'text-white/20 hover:text-church-gold' : 'text-church-secondary/40 hover:text-church-maroon'}`}
                        >
                          <Edit className="w-4.5 h-4.5" />
                        </button>
                      )}
                      <button onClick={() => handleShare(song)} className={`p-2.5 transition-colors ${theme === 'dark' ? 'text-white/20 hover:text-church-gold' : 'text-church-secondary/40 hover:text-church-maroon'}`}>
                        <Share2 className="w-4.5 h-4.5" />
                      </button>
                      {isAdmin && (
                        <button onClick={() => setDeleteConfirmId(song.id)} className="p-2.5 text-red-500/40 hover:text-red-500 transition-colors">
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>

      {/* Static Bottom Tab Bar */}
      <nav className="absolute bottom-0 left-0 right-0 h-[calc(var(--safe-area-bottom)+5.5rem)] pb-[var(--safe-area-bottom)] glass-nav px-4 flex items-center justify-between z-50 rounded-t-[32px]">
        <button onClick={() => { setActiveTab('home'); setSelectedCategory(null); }} className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'home' ? 'text-church-maroon' : (theme === 'dark' ? 'text-white/20' : 'text-church-secondary opacity-40')}`}>
           <Music className="w-6 h-6" />
           <span className="text-[8px] font-black uppercase tracking-tighter">{t.home}</span>
        </button>
        <button onClick={() => { setActiveTab('categories'); setSelectedCategory(null); }} className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'categories' ? 'text-church-maroon' : (theme === 'dark' ? 'text-white/20' : 'text-church-secondary opacity-40')}`}>
           <Library className="w-6 h-6" />
           <span className="text-[8px] font-black uppercase tracking-tighter">{t.categories}</span>
        </button>
        
        {/* Central Logo/Play Branding */}
        <div className="relative -top-6">
           <button 
             onClick={() => setShowSocials(true)}
             className="w-16 h-16 bg-church-maroon rounded-full flex items-center justify-center shadow-xl shadow-church-maroon/30 border-4 border-church-cream active:scale-90 transition-transform"
           >
              <AppLogo className="w-full h-full border-none shadow-none" url={brandingUrl} />
           </button>
        </div>

        <button onClick={() => { setActiveTab('favorites'); setSelectedCategory(null); }} className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'favorites' ? 'text-church-maroon' : (theme === 'dark' ? 'text-white/20' : 'text-church-secondary opacity-40')}`}>
           <Heart className="w-6 h-6" />
           <span className="text-[8px] font-black uppercase tracking-tighter">{t.favorites}</span>
        </button>

        <button onClick={() => { setActiveTab('downloads'); setSelectedCategory(null); }} className={`flex flex-col items-center space-y-1 transition-all ${activeTab === 'downloads' ? 'text-church-maroon' : (theme === 'dark' ? 'text-white/20' : 'text-church-secondary opacity-40')}`}>
           <Download className="w-6 h-6" />
           <span className="text-[8px] font-black uppercase tracking-tighter">{t.downloads}</span>
        </button>
      </nav>

      {/* Full Screen Player */}
      <AnimatePresence>
        {showPlayer && currentSong && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 bg-church-maroon z-[60] flex flex-col pt-[calc(var(--safe-area-top)+3rem)] pb-[var(--safe-area-bottom)] text-white overflow-hidden"
          >
            {/* Background Image for Lyrics/Player */}
            <div className="absolute inset-0 z-0">
               <img 
                 src={`https://picsum.photos/seed/${currentSong.id}/800/800?blur=10`} 
                 className="w-full h-full object-cover opacity-30 saturate-50" 
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-b from-church-maroon via-church-maroon/60 to-church-maroon" />
            </div>

            <div className="relative z-10 px-6 flex justify-between items-center mb-8">
               <button onClick={() => { setShowPlayer(false); setShowLyrics(false); }} className="p-2 bg-white/10 rounded-full">
                  <ChevronDown className="w-6 h-6 text-church-gold" />
               </button>
               <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-church-gold/60">{translations.am.nowPlaying}</p>
                  <p className="text-xs font-bold">እየተደመጠ</p>
               </div>
               <button onClick={() => handleShare(currentSong)} className="p-2 bg-white/10 rounded-full">
                  <Share2 className="w-6 h-6 text-church-gold" />
               </button>
            </div>

            <div className="flex-1 overflow-hidden px-8 flex flex-col items-center">
               <AnimatePresence mode="wait">
                  {showLyrics ? (
                      <motion.div 
                        key="lyrics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="w-full flex-1 flex flex-col items-center relative z-10"
                      >
                         <div 
                           className="w-full flex-1 rounded-[40px] p-8 overflow-y-auto text-center font-bold leading-relaxed text-white mb-6 transition-all duration-300 border border-white/10 bg-black/50 backdrop-blur-md"
                           style={{ fontSize: `${lyricsFontSize}px` }}
                         >
                          {editingLyrics ? (
                            <textarea 
                              className="w-full h-full bg-transparent outline-none resize-none border-none p-0"
                              value={newLyrics}
                              onChange={(e) => setNewLyrics(e.target.value)}
                              placeholder="Insert lyrics here..."
                            />
                          ) : (
                            currentSong.lyrics || 'እስካሁን ምንም ግጥም አልተጨመረም።'
                          )}
                       </div>
                       <div className="flex space-x-4 mb-4">
                          {editingLyrics ? (
                            <>
                              <button onClick={handleSaveLyrics} className="flex items-center space-x-2 bg-church-gold text-church-maroon px-6 py-3 rounded-full font-black text-xs uppercase">
                                 <Save className="w-4 h-4" />
                                 <span>{translations.am.save}</span>
                              </button>
                              <button onClick={() => setEditingLyrics(false)} className="flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-full font-black text-xs uppercase">
                                 <X className="w-4 h-4" />
                                 <span>{translations.am.cancel}</span>
                              </button>
                            </>
                          ) : (
                            isAdmin && (
                              <button onClick={() => { setEditingLyrics(true); setNewLyrics(currentSong.lyrics || ''); }} className="flex items-center space-x-2 bg-white/10 text-white px-6 py-3 rounded-full font-black text-xs uppercase">
                                <Edit className="w-4 h-4" />
                                <span>{translations.am.editLyrics}</span>
                              </button>
                            )
                          )}
                       </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="art" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      className="w-full flex-1 flex flex-col items-center justify-center relative z-10"
                    >
                      <div className="w-full aspect-square rounded-[40px] overflow-hidden shadow-2xl relative border-4 border-white/5">
                        <img src={`https://picsum.photos/seed/${currentSong.id}/800/800`} className="w-full h-full object-cover" />
                      </div>
                      <div className="mt-10 text-center space-y-2">
                        <h2 className="text-3xl font-black">{currentSong.title}</h2>
                        <p className="text-church-gold text-lg font-bold">{currentSong.artist}</p>
                        <div className="bg-church-gold text-black px-4 py-1 rounded-full inline-block font-black text-xs uppercase mt-4">{currentSong.category}</div>
                      </div>
                    </motion.div>
                  )}
               </AnimatePresence>
            </div>

            <div className="p-10 space-y-8 bg-gradient-to-t from-black/20 to-transparent">
               <div className="space-y-2">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                     <motion.div className="h-full bg-church-gold shadow-[0_0_15px_rgba(197,160,89,0.5)]" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] font-black opacity-50 uppercase tracking-tighter">
                    <span>{Math.floor((audioRef.current?.currentTime || 0) / 60)}:{(Math.floor((audioRef.current?.currentTime || 0) % 60)).toString().padStart(2, '0')}</span>
                    <span>{currentSong.duration}</span>
                  </div>
               </div>

               <div className="flex items-center justify-between">
                  <button onClick={() => setShowLyrics(!showLyrics)} className={`flex items-center space-x-2 px-6 py-3 rounded-full font-black text-[10px] uppercase transition-all ${showLyrics ? 'bg-church-gold text-church-maroon' : 'bg-white/10 text-white'}`}>
                     <List className="w-4 h-4" />
                     <span>{translations.am.lyrics}</span>
                  </button>
                  <button 
                    onClick={(e) => downloadedIds.includes(currentSong.id) ? removeFromDownloads(currentSong.id, e) : handleDownload(currentSong, e)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-full font-black text-[10px] uppercase transition-all ${downloadedIds.includes(currentSong.id) ? 'bg-white text-green-600' : 'bg-white/10 text-white'}`}
                  >
                     <Download className={`w-4 h-4 ${downloadedIds.includes(currentSong.id) ? 'fill-current' : ''}`} />
                     <span>{downloadedIds.includes(currentSong.id) ? t.downloaded : t.download}</span>
                  </button>
                  <div className="flex items-center space-x-6">
                     <button onClick={prevSong} className="p-3 active:scale-90 transition-all text-white/40 hover:text-white"><SkipBack className="w-8 h-8" /></button>
                     <button onClick={() => playSong(currentSong)} className="w-20 h-20 bg-church-gold text-church-maroon rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-all outline outline-8 outline-white/5">
                        {isPlaying ? <Pause className="w-10 h-10" /> : <Play className="w-10 h-10 fill-current ml-1" />}
                     </button>
                     <button onClick={nextSong} className="p-3 active:scale-90 transition-all text-white/40 hover:text-white"><SkipForward className="w-8 h-8" /></button>
                  </div>
                  <button onClick={(e) => handleToggleFavorite(currentSong.id, e)} className={`p-4 rounded-full transition-all ${currentSong.isFavorite ? 'text-red-500 bg-red-50' : 'bg-white/10 text-white'}`}>
                    <Heart className={`w-6 h-6 ${currentSong.isFavorite ? 'fill-current' : ''}`} />
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inbox Overlay */}
      <AnimatePresence>
        {showInbox && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className={`absolute inset-0 z-[110] backdrop-blur-3xl flex flex-col pt-12 transition-colors ${theme === 'dark' ? 'bg-church-dark/95' : 'bg-church-cream/95'}`}
          >
             <div className="px-6 flex justify-between items-center mb-10">
                <div className="flex items-center space-x-3">
                   <div className="w-12 h-12 bg-church-maroon rounded-[20px] flex items-center justify-center shadow-lg shadow-church-maroon/20">
                      <Mail className="w-6 h-6 text-church-gold" />
                   </div>
                   <div>
                      <h2 className={`text-2xl font-black italic tracking-tight ${theme === 'dark' ? 'text-white' : 'text-church-maroon'}`}>{lang === 'am' ? 'መልዕክቶች' : 'Inbox'}</h2>
                      <p className={`text-[10px] uppercase font-bold tracking-[0.2em] opacity-40 ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>System Messages</p>
                   </div>
                </div>
                <button onClick={() => setShowInbox(false)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${theme === 'dark' ? 'bg-white/5 text-white active:bg-white/10' : 'bg-black/5 text-church-maroon active:bg-black/10'}`}>
                   <X className="w-6 h-6" />
                </button>
             </div>

             <div className="flex-1 px-6 overflow-y-auto space-y-6 pb-20">
                {(() => {
                   const [eYear, eMonth, eDay] = toEthiopian(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());
                   const majorHolidays: Record<string, string> = {
                     '1-1': lang === 'am' ? 'አዲስ ዓመት (እንቁጣጣሽ)' : 'New Year',
                     '1-17': lang === 'am' ? 'መስቀል ደመራ' : 'Meskel',
                     '4-29': lang === 'am' ? 'ገና (ልደተ ክርስቶስ)' : 'Christmas',
                     '5-11': lang === 'am' ? 'ጥምቀት' : 'Epiphany',
                     '8-4': lang === 'am' ? 'ትንሣኤ (ፋሲካ)' : 'Easter',
                     '9-1': lang === 'am' ? 'ግንቦት ልደታ' : 'Ginbot Lideta',
                     '12-13': lang === 'am' ? 'ደብረ ታቦር (ቡሔ)' : 'Debre Tabor',
                   };
                   const key = `${eMonth}-${eDay}`;
                   const majorHolidayName = majorHolidays[key];
                   const monthlyHolidayName = t.holidays[eDay - 1];
                   const isPagume = eMonth === 13;
                   const greetingName = majorHolidayName || (isPagume ? (lang === 'am' ? 'የጳጉሜ ጸበል' : 'Pagume Tsebbel') : monthlyHolidayName);

                   return (
                     <motion.div 
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className={`rounded-[32px] p-6 border shadow-xl relative overflow-hidden flex space-x-4 transition-all hover:scale-[1.01] ${theme === 'dark' ? 'bg-church-dark-surface border-white/5 shadow-black/40' : 'bg-white border-black/5 shadow-church-maroon/5'}`}
                     >
                        <div className="w-14 h-14 bg-church-maroon rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                           <MessageSquare className="w-7 h-7 text-church-gold" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center mb-1">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-church-gold' : 'text-church-maroon'}`}>{lang === 'am' ? 'የበዓል መልዕክት' : 'Holiday Greeting'}</span>
                              <span className="text-[9px] opacity-30 font-extrabold uppercase tracking-widest">{lang === 'am' ? 'ዛሬ' : 'Today'}</span>
                           </div>
                           <h3 className={`font-black italic text-lg leading-tight mb-2 ${theme === 'dark' ? 'text-white' : 'text-church-maroon'}`}>
                              {t.holidayGreeting.replace('{name}', greetingName)}
                           </h3>
                           <p className={`text-[11px] leading-relaxed font-bold opacity-60 italic ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>
                              Wishing you a blessed and peaceful day filled with spiritual joy. May the prayers of the saints be with you.
                           </p>
                        </div>
                     </motion.div>
                   );
                })()}

                <div className="flex flex-col items-center justify-center py-20 opacity-10">
                   <Mail className="w-16 h-16 mb-4" />
                   <p className="font-black italic tracking-widest uppercase text-sm">No more messages</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Media Modal */}
      <AnimatePresence>
        {showSocials && (
          <div className="absolute inset-0 z-[200] flex items-end justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowSocials(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.9 }}
              className={`relative w-full max-w-md overflow-hidden rounded-[40px] shadow-2xl transition-colors ${theme === 'dark' ? 'bg-church-dark-surface' : 'bg-church-cream'}`}
            >
              <div className="bg-church-maroon p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10 space-y-4">
                  <div className="w-20 h-20 bg-church-gold/20 rounded-full mx-auto flex items-center justify-center border border-church-gold/30">
                     <Church className="w-14 h-14 text-church-gold" />
                  </div>
                  <h3 className="text-2xl font-black text-church-gold tracking-tighter uppercase italic">{t.followUs}</h3>
                  <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em]">{lang === 'am' ? 'በማኅበራዊ ሚዲያዎቻችን ይከታተሉን' : 'Connect with us on social media'}</p>
                </div>
              </div>

              <div className="p-8 space-y-3">
                {[
                  { icon: <Send className="w-5 h-5" />, label: 'Telegram', sub: lang === 'am' ? 'አዳዲስ መዝሙራትንና መረጃዎችን ያግኙ' : 'Get latest updates & songs', color: 'bg-[#229ED9]', link: 'https://t.me/dekiketensae' },
                  { icon: <Youtube className="w-5 h-5" />, label: 'YouTube', sub: lang === 'am' ? 'ቪዲዮዎችን ይመልከቱ' : 'Watch official videos', color: 'bg-[#FF0000]', link: 'https://www.youtube.com/@deqiqetensae' },
                  { 
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.47-.13-.1-.26-.21-.39-.32v6.52c0 1.94-.49 3.94-1.91 5.29-1.39 1.34-3.4 1.92-5.3 1.67-2.01-.26-3.88-1.57-4.83-3.38-1.15-2.09-.9-4.89.62-6.73 1.25-1.54 3.32-2.31 5.26-2.01v4.04c-1-.14-2.12.15-2.73.99-.44.59-.47 1.4-.24 2.08.31.95 1.29 1.63 2.29 1.6 1.05-.02 2-.85 2-.19v-11.41z"/>
                      </svg>
                    ), 
                    label: 'TikTok', 
                    sub: lang === 'am' ? 'አጫጭር መንፈሳዊ ቪዲዮዎች' : 'Short spiritual videos', 
                    color: 'bg-black', 
                    link: 'https://www.tiktok.com/@deqiqetensae?_r=1&_t=ZS-955j87uv7In' 
                  },
                  { icon: <Instagram className="w-5 h-5" />, label: 'Instagram', sub: lang === 'am' ? 'መንፈሳዊ ምስሎችን ይመልከቱ' : 'Daily spiritual moments', color: 'bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]', link: 'https://www.instagram.com/deqiqetensae?igsh=ZnplanZuank0cHM2' },
                ].map((social, idx) => (
                  <motion.a
                    key={social.label}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`flex items-center space-x-4 p-5 rounded-[24px] transition-all hover:scale-[1.02] active:scale-95 border border-black/5 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-white'}`}
                  >
                    <div className={`w-12 h-12 ${social.color} text-white rounded-2xl flex items-center justify-center shadow-lg`}>
                       {social.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-sm uppercase tracking-tight">{social.label}</p>
                      <p className="text-[10px] opacity-50 font-medium">{social.sub}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-20" />
                  </motion.a>
                ))}

                <button 
                  onClick={() => setShowSocials(false)}
                  className="w-full py-5 rounded-[24px] border-2 border-dashed border-church-gold/30 text-church-gold font-black uppercase text-xs tracking-widest mt-4 hover:bg-church-gold/5 transition-colors"
                >
                  {t.close}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mini Player when active */}
      <AnimatePresence>
        {currentSong && !showPlayer && (
          <motion.div 
            initial={{ y: 150 }} animate={{ y: 0 }} exit={{ y: 150 }}
            onClick={() => setShowPlayer(true)}
            className="absolute bottom-24 left-4 right-4 h-16 bg-church-maroon text-white p-3 rounded-[20px] shadow-2xl z-40 flex items-center space-x-3 border border-church-gold/20 cursor-pointer"
          >
             <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                <img src={`https://picsum.photos/seed/${currentSong.id}/100/100`} className="w-full h-full object-cover" />
             </div>
             <div className="flex-1 min-w-0">
                <h5 className="text-[11px] font-black truncate">{currentSong.title}</h5>
                <p className="text-[9px] text-white/50 truncate font-medium">{currentSong.artist}</p>
             </div>
             <div className="flex items-center space-x-1">
                <button onClick={(e) => { e.stopPropagation(); playSong(currentSong); }} className="p-2 active:scale-90 transition-transform">
                   {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); nextSong(); }} className="p-2 active:scale-90 transition-transform">
                   <SkipForward className="w-5 h-5" />
                </button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Upload */}
      {isAdmin && (
        <label className="absolute bottom-32 right-6 w-14 h-14 bg-church-gold text-white rounded-2xl flex items-center justify-center shadow-lg cursor-pointer active:scale-95 transition-all z-40 border-2 border-white group">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Upload className="w-7 h-7 text-church-maroon" strokeWidth={2.5} />
          </motion.div>
          <input type="file" className="hidden" accept="audio/*,.mp3" onChange={handleFileUpload} />
        </label>
      )}

      {/* Song Editor Modal */}
      <AnimatePresence>
        {editingSong && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center px-6 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-sm rounded-[40px] p-8 space-y-6 ${theme === 'dark' ? 'bg-church-dark-surface' : 'bg-white'}`}
            >
              <div className="space-y-4">
                <h3 className="text-2xl font-black italic text-church-maroon">{translations.am.editSong}</h3>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{translations.am.title}</label>
                  <input 
                    type="text" 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className={`w-full p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-church-cream border-black/5'} font-bold outline-none focus:ring-2 ring-church-gold/20`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{translations.am.artist}</label>
                  <input 
                    type="text" 
                    value={editArtist}
                    onChange={(e) => setEditArtist(e.target.value)}
                    className={`w-full p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-church-cream border-black/5'} font-bold outline-none focus:ring-2 ring-church-gold/20`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{translations.am.categories}</label>
                  <select 
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as Song['category'])}
                    className={`w-full p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-church-cream border-black/5'} font-bold outline-none focus:ring-2 ring-church-gold/20`}
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-black/5 bg-church-cream/30">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">ተለይቶ የቀረበ</span>
                  <button 
                    onClick={() => setEditIsFeatured(!editIsFeatured)}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 ${editIsFeatured ? 'bg-church-gold' : 'bg-gray-300'}`}
                  >
                    <motion.div 
                      animate={{ x: editIsFeatured ? 26 : 2 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                    />
                  </button>
                </div>
              </div>

              <div className="flex flex-col space-y-3">
                <button 
                  onClick={handleSaveSongDetails}
                  className="w-full bg-church-gold text-church-maroon py-4 rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all"
                >
                  {translations.am.save}
                </button>
                <button 
                  onClick={() => setEditingSong(null)}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-sm active:scale-95 transition-all ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-church-cream text-church-secondary'}`}
                >
                  {translations.am.cancel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Song Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center px-6 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-sm rounded-[40px] p-8 space-y-6 ${theme === 'dark' ? 'bg-church-dark-surface' : 'bg-white'}`}
            >
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-church-gold/10 rounded-xl flex items-center justify-center">
                    <Music className="w-5 h-5 text-church-gold" />
                  </div>
                  <h3 className="text-2xl font-black italic text-church-maroon">{lang === 'am' ? 'መዝሙር ጨምር' : 'Add New Song'}</h3>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.title}</label>
                  <input 
                    type="text" 
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className={`w-full p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-church-cream border-black/5'} font-bold outline-none focus:ring-2 ring-church-gold/20`}
                    disabled={isUploading}
                  />
                </div>

                {uploadPreviewUrl && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{lang === 'am' ? 'የተመረጠውን መዝሙር አድምጥ' : 'Preview Selection'}</label>
                    <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-church-cream/50'} border border-church-gold/20`}>
                      <audio 
                        src={uploadPreviewUrl} 
                        controls 
                        className="w-full h-10 accent-church-maroon"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.artist}</label>
                  <input 
                    type="text" 
                    value={uploadArtist}
                    onChange={(e) => setUploadArtist(e.target.value)}
                    className={`w-full p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-church-cream border-black/5'} font-bold outline-none focus:ring-2 ring-church-gold/20`}
                    disabled={isUploading}
                    placeholder="Singer name..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.categories}</label>
                  <select 
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className={`w-full p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-church-cream border-black/5 text-black'} font-bold outline-none focus:ring-2 ring-church-gold/20`}
                    disabled={isUploading}
                  >
                    <option value="mezmur">Mezmur</option>
                    <option value="kidasie">Kidasie</option>
                    <option value="zema">Zema</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40">{t.lyrics}</label>
                  <textarea 
                    value={uploadLyrics}
                    onChange={(e) => setUploadLyrics(e.target.value)}
                    className={`w-full p-4 rounded-2xl border ${theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-church-cream border-black/5 text-black'} font-bold outline-none focus:ring-2 ring-church-gold/20 min-h-[80px] resize-none`}
                    disabled={isUploading}
                    placeholder="Enter song lyrics here (Optional)..."
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl border border-black/5 bg-church-cream/30">
                  <span className="text-xs font-black uppercase tracking-widest opacity-40">{lang === 'am' ? 'ተለይቶ የቀረበ' : 'Featured'}</span>
                  <button 
                    onClick={() => setUploadIsFeatured(!uploadIsFeatured)}
                    className={`w-12 h-6 rounded-full transition-all relative ${uploadIsFeatured ? 'bg-church-maroon' : 'bg-gray-300'}`}
                    disabled={isUploading}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${uploadIsFeatured ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase opacity-40">
                      <span>{lang === 'am' ? 'እየጫነ ነው...' : 'Uploading...'}</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-church-gold shadow-[0_0_10px_rgba(197,160,89,0.5)]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-3">
                <button 
                  onClick={startActualUpload}
                  disabled={isUploading || !uploadTitle || !uploadArtist}
                  className="w-full bg-church-maroon text-white py-4 rounded-2xl font-black uppercase text-sm shadow-xl shadow-church-maroon/20 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                >
                  {isUploading ? (lang === 'am' ? 'እባክዎ ይጠብቁ...' : 'Please Wait...') : (lang === 'am' ? 'አሁን ጫን' : 'Upload Now')}
                </button>
                <button 
                  onClick={() => {
                    setShowUploadModal(false);
                    if (uploadPreviewUrl) {
                      URL.revokeObjectURL(uploadPreviewUrl);
                      setUploadPreviewUrl(null);
                    }
                  }}
                  disabled={isUploading}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-sm active:scale-95 transition-all ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-church-cream text-church-secondary'}`}
                >
                  {t.cancel}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center px-6 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-sm rounded-[40px] p-8 space-y-6 ${theme === 'dark' ? 'bg-church-dark-surface' : 'bg-white'}`}
            >
              <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Trash2 className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-2xl font-black italic">Are you sure?</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>This action cannot be undone. The mezmur will be permanently deleted.</p>
              </div>
              <div className="flex flex-col space-y-3">
                <button 
                  onClick={() => handleDeleteSong(deleteConfirmId)}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-sm shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                >
                  Delete Mezmur
                </button>
                <button 
                  onClick={() => setDeleteConfirmId(null)}
                  className={`w-full py-4 rounded-2xl font-black uppercase text-sm active:scale-95 transition-all ${theme === 'dark' ? 'bg-white/5 text-white/40' : 'bg-church-cream text-church-secondary'}`}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {needRefresh && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="absolute bottom-28 left-4 right-4 z-[200]"
          >
            <div className="bg-church-gold text-church-maroon p-4 rounded-3xl shadow-2xl flex items-center justify-between border border-white/20">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-church-maroon/10 flex items-center justify-center animate-spin-slow">
                  <RefreshCw className="w-5 h-5 text-church-maroon" />
                </div>
                <p className="font-black text-sm uppercase tracking-tight">{t.updateAvailable}</p>
              </div>
              <button 
                onClick={handleUpdate}
                className="bg-church-maroon text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg active:scale-95 transition-all"
              >
                {t.refresh}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShareModal && selectedShareSong && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[250] flex items-center justify-center px-6 backdrop-blur-sm"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-sm rounded-[40px] p-8 space-y-6 relative overflow-hidden ${theme === 'dark' ? 'bg-church-dark-surface' : 'bg-white'}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setShowShareModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-church-gold/80 block">{t.share}</span>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-[24px] overflow-hidden flex-shrink-0 relative border border-black/5 shadow-md">
                    <img 
                      src={`https://picsum.photos/seed/released-${selectedShareSong.id}/150/150`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="text-lg font-black tracking-tight leading-snug line-clamp-1">{selectedShareSong.title}</h4>
                    <p className={`text-xs font-bold leading-relaxed ${theme === 'dark' ? 'text-church-dark-secondary' : 'text-church-secondary'}`}>{selectedShareSong.artist}</p>
                    <span className="text-[9px] px-2 py-0.5 rounded-full inline-block font-black uppercase tracking-wider bg-church-gold/20 text-church-gold mt-1.5">{selectedShareSong.category}</span>
                  </div>
                </div>
              </div>

              {/* Social Channels List */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Telegram */}
                <a 
                  href={`https://t.me/share/url?url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?songId=${selectedShareSong.id}`)}&text=${encodeURIComponent(
                    lang === 'am' ? `የዘማሪ ${selectedShareSong.artist} ድንቅ መዝሙር - "${selectedShareSong.title}" በደቂቀ ትንሣኤ ያዳምጡ።` : 
                    lang === 'ti' ? `ናይ ዘማሪ ${selectedShareSong.artist} ዝገርም መዝሙር - "${selectedShareSong.title}" ኣብ ደቂቀ ትንሣኤ ስምዑ።` :
                    lang === 'or' ? `Faarfannaa bareedaa barruu ${selectedShareSong.artist} - "${selectedShareSong.title}" Dekike Tinsae irratti dhaggeeffadhaa.` :
                    `Listen to "${selectedShareSong.title}" by ${selectedShareSong.artist} on Dekike Tinsae.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-4 rounded-3xl bg-[#0088cc]/10 hover:bg-[#0088cc]/20 transition-all border border-[#0088cc]/20 text-[#0088cc]"
                >
                  <Send className="w-5 h-5 transform rotate-[-30deg]" />
                  <span className="text-xs font-black tracking-wide uppercase">Telegram</span>
                </a>

                {/* WhatsApp */}
                <a 
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    (lang === 'am' ? `የዘማሪ ${selectedShareSong.artist} ድንቅ መዝሙር - "${selectedShareSong.title}" በደቂቀ ትንሣኤ ያዳምጡ።` : 
                     lang === 'ti' ? `ናይ ዘማሪ ${selectedShareSong.artist} ዝገርም መዝሙር - "${selectedShareSong.title}" ኣብ ደቂቀ ትንሣኤ ስምዑ።` :
                     lang === 'or' ? `Faarfannaa bareedaa barruu ${selectedShareSong.artist} - "${selectedShareSong.title}" Dekike Tinsae irratti dhaggeeffadhaa.` :
                     `Listen to "${selectedShareSong.title}" by ${selectedShareSong.artist} on Dekike Tinsae.`) + ' ' + `${window.location.origin}${window.location.pathname}?songId=${selectedShareSong.id}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-4 rounded-3xl bg-[#25d366]/10 hover:bg-[#25d366]/20 transition-all border border-[#25d366]/20 text-[#25d366]"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-xs font-black tracking-wide uppercase">WhatsApp</span>
                </a>

                {/* Facebook */}
                <a 
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?songId=${selectedShareSong.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-4 rounded-3xl bg-[#1877f2]/10 hover:bg-[#1877f2]/20 transition-all border border-[#1877f2]/20 text-[#1877f2]"
                >
                  <Share2 className="w-5 h-5" />
                  <span className="text-xs font-black tracking-wide uppercase">Facebook</span>
                </a>

                {/* Twitter / X */}
                <a 
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    lang === 'am' ? `የዘማሪ ${selectedShareSong.artist} ድንቅ መዝሙር - "${selectedShareSong.title}" በደቂቀ ትንሣኤ ያዳምጡ።` : 
                    lang === 'ti' ? `ናይ ዘማሪ ${selectedShareSong.artist} ዝገርም መዝሙር - "${selectedShareSong.title}" ኣብ ደቂቀ ትንሣኤ ስምዑ።` :
                    lang === 'or' ? `Faarfannaa bareedaa barruu ${selectedShareSong.artist} - "${selectedShareSong.title}" Dekike Tinsae irratti dhaggeeffadhaa.` :
                    `Listen to "${selectedShareSong.title}" by ${selectedShareSong.artist} on Dekike Tinsae.`
                  )}&url=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?songId=${selectedShareSong.id}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-4 rounded-3xl bg-slate-500/10 hover:bg-slate-500/20 transition-all border border-slate-500/20 text-slate-500 dark:text-slate-300"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="text-xs font-black tracking-wide uppercase">X / Twitter</span>
                </a>
              </div>

              {/* Copy Link Trigger */}
              <button 
                onClick={() => {
                  const shareUrl = `${window.location.origin}${window.location.pathname}?songId=${selectedShareSong.id}`;
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }).catch(err => {
                    console.error("Clipboard copy failed", err);
                  });
                }}
                className={`w-full py-4.5 rounded-3xl font-black uppercase text-xs tracking-wider transition-all border flex items-center justify-center space-x-2 shadow-lg active:scale-95 ${
                  copiedLink 
                    ? 'bg-green-500 text-white border-green-500 shadow-green-500/25' 
                    : (theme === 'dark' 
                        ? 'bg-church-gold text-church-maroon border-church-gold/30 shadow-church-gold/10 hover:bg-church-gold/90' 
                        : 'bg-church-maroon text-white border-church-maroon/10 shadow-church-maroon/15 hover:bg-church-maroon/90')
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4.5 h-4.5 animate-bounce" />
                    <span>{lang === 'am' ? 'የመዝሙሩ ሊንክ ተኮፒቷል!' : (lang === 'ti' ? 'ተደጊሙ ኣሎ!' : 'Link Copied!')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4.5 h-4.5" />
                    <span>{lang === 'am' ? 'የመዝሙር ሊንክ ኮፒ አድርግ' : (lang === 'ti' ? 'ሊንክ ኮፒ ግበር' : 'Copy Mezmur Link')}</span>
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
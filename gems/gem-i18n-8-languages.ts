// ═══════════════════════════════════════
// 9Soccer v1 — i18n (8 languages)
// Hebrew-first for Israeli users.
// Falls back to English for missing keys.
// ═══════════════════════════════════════

export type Language = 'en' | 'he' | 'ar' | 'es' | 'pt' | 'fr' | 'de' | 'it';

export const LANGUAGE_META: Record<Language, { name: string; flag: string; dir: 'ltr' | 'rtl' }> = {
  he: { name: 'עברית',     flag: '🇮🇱', dir: 'rtl' },
  ar: { name: 'العربية',   flag: '🇸🇦', dir: 'rtl' },
  en: { name: 'English',   flag: '🌍', dir: 'ltr' },
  es: { name: 'Español',   flag: '🇪🇸', dir: 'ltr' },
  pt: { name: 'Português', flag: '🇧🇷', dir: 'ltr' },
  fr: { name: 'Français',  flag: '🇫🇷', dir: 'ltr' },
  de: { name: 'Deutsch',   flag: '🇩🇪', dir: 'ltr' },
  it: { name: 'Italiano',  flag: '🇮🇹', dir: 'ltr' },
};

const ALL_LANGUAGES = Object.keys(LANGUAGE_META) as Language[];

const STORAGE_KEY = '9soccer_lang';

// One-time migration from old key
if (typeof window !== 'undefined') {
  const old = localStorage.getItem('9soccer_lang');
  if (old && !localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, old);
    localStorage.removeItem('9soccer_lang');
  }
}

/** Detect language from browser on first visit */
function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  const nav = (navigator.language || '').slice(0, 2).toLowerCase();
  if (nav === 'he') return 'he';
  if (nav === 'ar') return 'ar';
  if (nav === 'es') return 'es';
  if (nav === 'pt') return 'pt';
  if (nav === 'fr') return 'fr';
  if (nav === 'de') return 'de';
  if (nav === 'it') return 'it';
  return 'en';
}

export function getStoredLanguage(): Language {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
  if (stored && ALL_LANGUAGES.includes(stored)) return stored;
  // First visit — detect from browser
  const detected = detectLanguage();
  localStorage.setItem(STORAGE_KEY, detected);
  return detected;
}

export function setStoredLanguage(lang: Language): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = LANGUAGE_META[lang]?.dir ?? 'ltr';
}

/** Returns true if the language is RTL */
export function isRTL(lang?: Language): boolean {
  const l = lang || getStoredLanguage();
  return l === 'he' || l === 'ar';
}

// Translation keys
const translations = {
  // ─── Battle ───
  'battle.play': { en: 'Play', he: 'שחק', ar: 'العب' },
  'battle.pure': { en: 'Pure Battle', he: 'קרב טהור', ar: 'معركة صافية' },
  'battle.skill': { en: 'Skill Battle', he: 'קרב מיומנות', ar: 'معركة المهارة' },
  'battle.finding': { en: 'Finding opponents...', he: 'מחפש יריבים...', ar: 'جارٍ البحث عن منافسين...' },
  'battle.matched': { en: 'Opponents found!', he: 'נמצאו יריבים!', ar: 'تم العثور على منافسين!' },
  'battle.halftime': { en: 'Halftime', he: 'הפסקה', ar: 'استراحة' },
  'battle.q_of': { en: 'Question', he: 'שאלה', ar: 'سؤال' },
  'battle.final_whistle': { en: 'Final Whistle!', he: 'שריקת סיום!', ar: 'صافرة النهاية!' },
  'battle.watching_h1': { en: 'Watching - First Half', he: 'צפייה - מחצית ראשונה', ar: 'مشاهدة - الشوط الأول' },
  'battle.watching_h2': { en: 'Watching - Second Half', he: 'צפייה - מחצית שנייה', ar: 'مشاهدة - الشوط الثاني' },
  'battle.correct': { en: 'Correct!', he: 'נכון!', ar: 'صحيح!' },
  'battle.wrong': { en: 'Wrong', he: 'לא נכון', ar: 'خطأ' },
  'battle.timeout': { en: "Time's up", he: 'נגמר הזמן', ar: 'انتهى الوقت' },
  'battle.tagline': { en: 'Football knowledge battle · 3 players', he: 'קרב ידע כדורגלי · 3 שחקנים', ar: 'معركة معرفة كروية · 3 لاعبين' },
  'battle.calculating': { en: 'Calculating results...', he: 'מחשב תוצאות...', ar: 'جارٍ حساب النتائج...' },
  'battle.3_player': { en: '3-player battle', he: 'קרב 3 שחקנים', ar: 'معركة 3 لاعبين' },
  'battle.half_1': { en: '1ST HALF', he: 'מחצית 1', ar: 'الشوط الأول' },
  'battle.half_2': { en: '2ND HALF', he: 'מחצית 2', ar: 'الشوط الثاني' },
  'battle.video_unavailable': { en: 'Video unavailable', he: 'הסרטון אינו זמין', ar: 'الفيديو غير متاح' },
  'battle.kick_off': { en: 'KICK OFF', he: 'התחל', ar: 'انطلاق' },
  'battle.2nd_half_starting': { en: '2nd Half Starting...', he: 'מחצית 2 מתחילה...', ar: 'الشوط الثاني يبدأ...' },
  'battle.choose_mode': { en: 'Choose Battle Mode', he: 'בחר מצב קרב', ar: 'اختر وضع المعركة' },
  'battle.choose_mode_subtitle': { en: 'Select your battle variant', he: 'בחר את סוג הקרב', ar: 'اختر نوع المعركة' },
  'battle.start_battle': { en: 'START BATTLE', he: 'התחל קרב', ar: 'ابدأ المعركة' },
  'battle.sudden_death': { en: 'Sudden Death', he: 'מוות פתאומי', ar: 'موت مفاجئ' },
  'battle.best_of_3': { en: 'Best of 3', he: 'הטוב מ-3', ar: 'أفضل من 3' },
  'battle.eliminated': { en: 'Eliminated!', he: 'הודח!', ar: 'تم الإقصاء!' },
  'battle.survived': { en: 'Survived!', he: 'שרד!', ar: 'نجا!' },
  'battle.round': { en: 'Round', he: 'סיבוב', ar: 'جولة' },
  'battle.round_win': { en: 'Round Won!', he: 'סיבוב נוצח!', ar: 'فوز بالجولة!' },
  'battle.round_loss': { en: 'Round Lost', he: 'סיבוב הפסד', ar: 'خسارة الجولة' },
  'battle.round_draw': { en: 'Round Draw', he: 'תיקו בסיבוב', ar: 'تعادل الجولة' },

  // ─── Battle Royale ───
  'br.title': { en: 'BATTLE ROYALE', he: '\u05D1\u05D8\u05DC \u05E8\u05D5\u05D9\u05D0\u05DC', ar: '\u0628\u0627\u062A\u0644 \u0631\u0648\u064A\u0627\u0644' },
  'br.join': { en: 'JOIN FREE', he: '\u05D4\u05E6\u05D8\u05E8\u05E3 \u05D7\u05D9\u05E0\u05DD', ar: '\u0627\u0646\u0636\u0645 \u0645\u062C\u0627\u0646\u064B\u0627' },
  'br.players_in_lobby': { en: 'players in lobby', he: '\u05E9\u05D7\u05E7\u05E0\u05D9\u05DD \u05D1\u05DC\u05D5\u05D1\u05D9', ar: '\u0644\u0627\u0639\u0628\u0648\u0646 \u0641\u064A \u0627\u0644\u0644\u0648\u0628\u064A' },
  'br.last_standing': { en: 'Last one standing wins', he: '\u05D4\u05D0\u05D7\u05E8\u05D5\u05DF \u05E9\u05E0\u05E9\u05D0\u05E8 \u05DE\u05E0\u05E6\u05D7', ar: '\u0627\u0644\u0623\u062E\u064A\u0631 \u0627\u0644\u0635\u0627\u0645\u062F \u064A\u0641\u0648\u0632' },
  'br.rules': { en: '5 rounds. Bottom 50% eliminated each round. Last one standing wins.', he: '5 \u05E1\u05D9\u05D1\u05D5\u05D1\u05D9\u05DD. 50% \u05D4\u05EA\u05D7\u05EA\u05D5\u05E0\u05D9\u05DD \u05DE\u05D5\u05D3\u05D7\u05D9\u05DD \u05D1\u05DB\u05DC \u05E1\u05D9\u05D1\u05D5\u05D1. \u05D4\u05D0\u05D7\u05E8\u05D5\u05DF \u05E9\u05E0\u05E9\u05D0\u05E8 \u05DE\u05E0\u05E6\u05D7.', ar: '5 \u062C\u0648\u0644\u0627\u062A. \u064A\u062A\u0645 \u0625\u0642\u0635\u0627\u0621 50% \u0645\u0646 \u0627\u0644\u0623\u0633\u0641\u0644 \u0641\u064A \u0643\u0644 \u062C\u0648\u0644\u0629. \u0627\u0644\u0623\u062E\u064A\u0631 \u0627\u0644\u0635\u0627\u0645\u062F \u064A\u0641\u0648\u0632.' },
  'br.safe': { en: 'SAFE', he: '\u05D1\u05D8\u05D5\u05D7!', ar: '\u0622\u0645\u0646!' },
  'br.eliminated': { en: 'ELIMINATED', he: '\u05D4\u05D5\u05D3\u05D7!', ar: '\u062A\u0645 \u0627\u0644\u0625\u0642\u0635\u0627\u0621!' },
  'br.champion': { en: 'CHAMPION', he: '\u05D0\u05DC\u05D5\u05E3!', ar: '\u0627\u0644\u0628\u0637\u0644!' },
  'br.next_round': { en: 'NEXT ROUND', he: '\u05E1\u05D9\u05D1\u05D5\u05D1 \u05D4\u05D1\u05D0', ar: '\u0627\u0644\u062C\u0648\u0644\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629' },
  'br.alive': { en: 'alive', he: '\u05D1\u05D7\u05D9\u05D9\u05DD', ar: '\u0639\u0644\u05F3 \u0642\u064A\u062F \u0627\u0644\u062D\u064A\u0627\u0629' },
  'br.play_again_tomorrow': { en: 'Play again tomorrow!', he: '\u05E9\u05D7\u05E7 \u05E9\u05D5\u05D1 \u05DE\u05D7\u05E8!', ar: '\u0627\u0644\u0639\u0628 \u0645\u062C\u062F\u062F\u064B\u0627 \u063A\u062F\u064B\u0627!' },

  // ─── Results ───
  'results.winner': { en: 'Victory!', he: 'ניצחון!', ar: 'فوز!' },
  'results.second': { en: 'Second Place', he: 'מקום שני', ar: 'المركز الثاني' },
  'results.third': { en: 'Third Place', he: 'מקום שלישי', ar: 'المركز الثالث' },
  'results.points': { en: 'Points', he: 'נקודות', ar: 'نقاط' },
  'results.play_again': { en: 'Play Again', he: 'שחק שוב', ar: 'العب مجددًا' },
  'results.share': { en: 'Share', he: 'שתף', ar: 'شارك' },
  'results.draw': { en: 'DRAW', he: 'תיקו', ar: 'تعادل' },
  'results.correct': { en: 'correct', he: 'נכונות', ar: 'صحيحة' },
  'results.you': { en: 'You', he: 'אתה', ar: 'أنت' },
  'results.record': { en: 'Record:', he: 'הרשומה שלך:', ar: 'السجل:' },
  'results.wins': { en: 'W', he: 'ניצחונות', ar: 'ف' },
  'results.losses': { en: 'L', he: 'הפסדים', ar: 'خ' },
  'results.draws': { en: 'D', he: 'תיקו', ar: 'ت' },
  'results.pts': { en: 'pts', he: 'נק׳', ar: 'نق' },

  // ─── Economy ───
  'coins.earned': { en: 'You earned', he: 'הרווחת', ar: 'ربحت' },
  'coins.balance': { en: 'Coins', he: 'מטבעות', ar: 'عملات' },

  // ─── Profile ───
  'profile.title': { en: 'Profile', he: 'פרופיל', ar: 'الملف الشخصي' },
  'profile.battles': { en: 'Battles', he: 'קרבות', ar: 'معارك' },
  'profile.wins': { en: 'Wins', he: 'ניצחונות', ar: 'انتصارات' },
  'profile.losses': { en: 'Losses', he: 'הפסדים', ar: 'خسائر' },
  'profile.draws': { en: 'Draws', he: 'תיקו', ar: 'تعادلات' },
  'profile.streak': { en: 'Streak', he: 'רצף', ar: 'سلسلة' },
  'profile.sign_in': { en: 'Sign in to see your stats', he: 'התחבר כדי לראות את הסטטיסטיקות שלך', ar: 'سجّل الدخول لرؤية إحصائياتك' },
  'profile.solo_challenge': { en: 'Solo Challenge', he: 'אתגר יומי', ar: 'تحدٍّ فردي' },
  'profile.stars': { en: 'Stars', he: 'כוכבים', ar: 'نجوم' },
  'profile.points': { en: 'Points', he: 'נקודות', ar: 'نقاط' },
  'profile.title_label': { en: 'Title', he: 'תואר', ar: 'اللقب' },
  'profile.levels_played': { en: 'Levels played', he: 'שלבים ששוחקו', ar: 'مستويات لُعبت' },
  'profile.longest_streak': { en: 'Longest streak', he: 'רצף שיא', ar: 'أطول سلسلة' },
  'profile.battle_record': { en: 'Battle Record', he: 'סיכום קרבות', ar: 'سجل المعارك' },
  'profile.win_rate': { en: 'Win Rate', he: 'אחוז ניצחון', ar: 'نسبة الفوز' },
  'profile.total_battles': { en: 'Total battles', he: 'סה״כ קרבות', ar: 'إجمالي المعارك' },
  'profile.best_score': { en: 'Best score', he: 'שיא ניקוד', ar: 'أفضل نتيجة' },
  'profile.no_battles': { en: 'No battles yet', he: 'אין קרבות עדיין', ar: 'لا توجد معارك بعد' },
  'profile.recent_battles': { en: 'Recent Battles', he: 'קרבות אחרונים', ar: 'معارك حديثة' },
  'profile.battle_rankings': { en: 'Battle Rankings', he: 'דירוג קרבות', ar: 'تصنيف المعارك' },
  'profile.current_rank': { en: 'Current Rank', he: 'דירוג נוכחי', ar: 'الترتيب الحالي' },
  'profile.view_leaderboard': { en: 'View Full Leaderboard', he: 'צפה בטבלת הדירוג', ar: 'عرض لوحة المتصدرين' },
  'profile.challenges': { en: 'Challenges', he: 'אתגרים', ar: 'تحديات' },
  'profile.best_streak': { en: 'Best Streak', he: 'רצף שיא', ar: 'أطول سلسلة' },
  'profile.total_score': { en: 'Total Score', he: 'ניקוד כולל', ar: 'النتيجة الإجمالية' },
  'profile.challenge_progress': { en: 'Challenge Progress', he: 'התקדמות באתגרים', ar: 'تقدم التحديات' },
  'profile.completed': { en: 'Completed', he: 'הושלמו', ar: 'مكتمل' },
  'profile.challenges_remaining': { en: 'challenges remaining', he: 'אתגרים נותרו', ar: 'تحديات متبقية' },
  'profile.all_completed': { en: 'All challenges completed!', he: 'כל האתגרים הושלמו!', ar: 'تم إكمال جميع التحديات!' },
  'profile.achievements': { en: 'Achievements', he: 'הישגים', ar: 'الإنجازات' },
  'profile.unlocked': { en: 'unlocked', he: 'נפתחו', ar: 'مفتوحة' },
  'profile.achievements_count': { en: 'Achievements', he: 'הישגים', ar: 'الإنجازات' },
  'profile.secret_achievement': { en: '???', he: '???', ar: '???' },
  'profile.locked': { en: 'Locked', he: 'נעול', ar: 'مقفل' },
  'profile.achievement_unlocked_on': { en: 'Unlocked', he: 'נפתח ב-', ar: 'فُتح في' },
  'profile.recent_activity': { en: 'Recent Activity', he: 'פעילות אחרונה', ar: 'النشاط الأخير' },
  'profile.solo_challenges': { en: 'Solo Challenges', he: 'אתגרים יומיים', ar: 'تحديات فردية' },
  'profile.no_activity': { en: 'No activity yet', he: 'אין פעילות עדיין', ar: 'لا يوجد نشاط بعد' },
  'profile.skill_battle': { en: 'Skill Battle', he: 'קרב מיומנויות', ar: 'معركة المهارات' },
  'profile.cards_used': { en: 'Cards Used', he: 'קלפים ששוחקו', ar: 'بطاقات مستخدمة' },
  'profile.favorite_card': { en: 'Favorite Card', he: 'קלף מועדף', ar: 'البطاقة المفضلة' },
  'profile.tournament_history': { en: 'Tournament History', he: 'היסטוריית טורנירים', ar: 'سجل البطولات' },
  'profile.entered': { en: 'Entered', he: 'השתתף', ar: 'شارك' },
  'profile.coins_won': { en: 'Coins Won', he: 'מטבעות שנצברו', ar: 'عملات مُكتسبة' },
  'profile.notifications': { en: 'Notifications', he: 'התראות', ar: 'الإشعارات' },
  'profile.notif_daily': { en: 'Daily Challenge (7AM)', he: 'אתגר יומי (7 בבוקר)', ar: 'التحدي اليومي (7 صباحًا)' },
  'profile.notif_streak': { en: 'Streak Reminder (8PM)', he: 'תזכורת רצף (8 בערב)', ar: 'تذكير السلسلة (8 مساءً)' },
  'profile.notif_battle': { en: 'Battle Invites', he: 'הזמנות לקרב', ar: 'دعوات المعارك' },
  'profile.notif_tournament': { en: 'Tournament Updates', he: 'עדכוני טורנירים', ar: 'تحديثات البطולات' },
  'profile.notif_season': { en: 'Season Alerts', he: 'התראות עונה', ar: 'تنبيهات الموسم' },
  'profile.notif_weekly': { en: 'Weekly Summary', he: 'סיכום שבועי', ar: 'الملخص الأسبوعي' },
  'profile.view_battle_leaderboard': { en: 'View Battle Leaderboard', he: 'טבלת דירוג קרבות', ar: 'عرض تصنيف المعارك' },
  'profile.battle_history': { en: 'Battle History', he: 'היסטוריית קרבות', ar: 'سجل المعارك' },
  'profile.invite_friends': { en: 'Invite Friends', he: 'הזמן חברים', ar: 'دعوة الأصدقاء' },
  'profile.replay_tutorial': { en: 'Replay tutorial', he: 'שחק מדריך מחדש', ar: 'إعادة الشرح' },
  'profile.delete_account': { en: 'Delete Account', he: 'מחיקת חשבון', ar: 'حذف الحساب' },
  'profile.delete_confirm_title': { en: 'Delete your account?', he: 'למחוק את החשבון?', ar: 'حذف حسابك؟' },
  'profile.delete_confirm_body': { en: 'This will permanently delete your account and all your data. This action cannot be undone.', he: 'פעולה זו תמחק לצמיתות את החשבון וכל הנתונים שלך. לא ניתן לבטל פעולה זו.', ar: 'سيؤدي هذا إلى حذف حسابك وجميع بياناتك نهائيًا. لا يمكن التراجع عن هذا الإجراء.' },
  'profile.delete_confirm_button': { en: 'Yes, delete my account', he: 'כן, מחק את החשבון', ar: 'نعم، احذف حسابي' },
  'profile.delete_cancel': { en: 'Cancel', he: 'ביטול', ar: 'إلغاء' },
  'profile.delete_success': { en: 'Account deleted. Goodbye!', he: 'החשבון נמחק. להתראות!', ar: 'تم حذف الحساب. وداعًا!' },
  'profile.delete_failed': { en: 'Failed to delete account. Please try again.', he: 'מחיקת החשבון נכשלה. נסה שוב.', ar: 'فشل حذف الحساب. حاول مرة أخرى.' },
  'profile.member_since': { en: 'Member since', he: 'חבר מאז', ar: 'عضو منذ' },
  'profile.name_updated': { en: 'Name updated!', he: 'השם עודכן!', ar: 'تم تحديث الاسم!' },
  'profile.name_failed': { en: 'Failed to save name', he: 'שמירת השם נכשלה', ar: 'فشل حفظ الاسم' },
  'profile.name_length': { en: 'Name must be 2-24 characters', he: 'השם חייב להיות 2-24 תווים', ar: 'يجب أن يكون الاسم 2-24 حرفًا' },

  // ─── Home ───
  'home.welcome': { en: 'Welcome to 9Soccer', he: 'ברוכים הבאים ל-9Soccer', ar: 'مرحبًا في 9Soccer' },
  'home.daily_checkin': { en: 'Daily Check-in', he: "צ'ק-אין יומי", ar: 'تسجيل يومي' },
  'home.leaderboard': { en: 'Leaderboard', he: 'טבלת מובילים', ar: 'لوحة المتصدرين' },
  'home.todays_challenge': { en: "Today's Challenge", he: 'האתגר היומי', ar: 'تحدي اليوم' },
  'home.choose_level': { en: 'Choose Level', he: 'בחר שלב', ar: 'اختر المستوى' },
  'home.profile': { en: 'Profile', he: 'פרופיל', ar: 'الملف الشخصي' },
  'home.online': { en: 'online', he: 'מחוברים', ar: 'متصل' },
  'home.play': { en: 'PLAY', he: 'שחק', ar: 'العب' },
  'home.battle': { en: 'BATTLE', he: 'קרב', ar: 'معركة' },
  // ─── Home — streak widget ───
  'home.streak_day': { en: 'day', he: 'יום', ar: 'يوم', es: 'día', pt: 'dia', fr: 'jour', de: 'Tag', it: 'giorno' },
  'home.streak_days': { en: 'days', he: 'ימים', ar: 'أيام', es: 'días', pt: 'dias', fr: 'jours', de: 'Tage', it: 'giorni' },
  'home.streak_in_a_row': { en: 'in a row!', he: 'רצוף!', ar: 'على التوالي!', es: '¡seguidos!', pt: 'seguidos!', fr: "d'affilée!", de: 'am Stück!', it: 'di fila!' },
  'home.streak_at_risk': { en: '⚠️ Your streak is at risk — play now!', he: '⚠️ הסטריק שלך בסכנה — שחק עכשיו!', ar: '⚠️ سلسلتك في خطر — العب الآن!', es: '⚠️ ¡Tu racha está en riesgo — juega ahora!', pt: '⚠️ Sua sequência está em risco — jogue agora!', fr: '⚠️ Votre série est en danger — jouez maintenant!', de: '⚠️ Deine Serie ist in Gefahr — spiel jetzt!', it: '⚠️ La tua serie è a rischio — gioca ora!' },
  'home.streak_keep_it': { en: 'Keep your streak alive ⚡', he: 'שמור על הסטריק שלך ⚡', ar: 'حافظ على سلسلتك ⚡', es: 'Mantén tu racha ⚡', pt: 'Mantenha sua sequência ⚡', fr: 'Gardez votre série active ⚡', de: 'Halte deine Serie ⚡', it: 'Mantieni la tua serie ⚡' },
  'home.streak_start': { en: 'Start a streak today — play the daily challenge!', he: 'התחל סטריק היום — שחק אתגר יומי!', ar: 'ابدأ سلسلتك اليوم — العب التحدي اليومي!', es: '¡Inicia una racha hoy — juega el desafío diario!', pt: 'Comece uma sequência hoje — jogue o desafio diário!', fr: 'Commencez une série aujourd\'hui — jouez le défi quotidien!', de: 'Starte heute eine Serie — spiel das tägliche Quiz!', it: 'Inizia una serie oggi — gioca la sfida quotidiana!' },
  // ─── Home — live players widget ───
  'home.live_players_now': { en: 'players live now!', he: 'שחקנים עכשיו!', ar: 'لاعبون الآن!', es: '¡jugadores en vivo!', pt: 'jogadores ao vivo!', fr: 'joueurs en direct!', de: 'Spieler jetzt live!', it: 'giocatori in diretta!' },
  'home.battle_royale_open': { en: 'Battle Royale open — join →', he: 'Battle Royale פתוח — הצטרף →', ar: 'Battle Royale مفتوح — انضم →', es: 'Battle Royale abierto — únete →', pt: 'Battle Royale aberto — entre →', fr: 'Battle Royale ouvert — rejoignez →', de: 'Battle Royale offen — mitmachen →', it: 'Battle Royale aperto — unisciti →' },
  // ─── Home — social proof ───
  'home.moments_waiting': { en: 'moments waiting for you', he: 'רגעים מחכים לך', ar: 'لحظات بانتظارك', es: 'momentos te esperan', pt: 'momentos esperando por você', fr: 'moments vous attendent', de: 'Momente warten auf dich', it: 'momenti ti aspettano' },
  // ─── Home — share bar ───
  'home.share_result': { en: '📤 Share Result', he: '📤 שתף תוצאה', ar: '📤 شارك النتيجة', es: '📤 Compartir resultado', pt: '📤 Compartilhar resultado', fr: '📤 Partager résultat', de: '📤 Ergebnis teilen', it: '📤 Condividi risultato' },
  'home.share_text': { en: 'I played 9Soccer ⚽ — {stars} ⭐', he: 'שיחקתי 9Soccer ⚽ — {stars} ⭐', ar: 'لعبت 9Soccer ⚽ — {stars} ⭐', es: 'Jugué 9Soccer ⚽ — {stars} ⭐', pt: 'Joguei 9Soccer ⚽ — {stars} ⭐', fr: "J'ai joué 9Soccer ⚽ — {stars} ⭐", de: 'Ich spielte 9Soccer ⚽ — {stars} ⭐', it: 'Ho giocato 9Soccer ⚽ — {stars} ⭐' },
  // ─── Home — guest prompt ───
  'home.guest_save_streak': { en: 'Save your streak!', he: 'שמור את הסטריק שלך!', ar: 'احفظ سلسلتك!', es: '¡Guarda tu racha!', pt: 'Salve sua sequência!', fr: 'Sauvegardez votre série!', de: 'Speichere deine Serie!', it: 'Salva la tua serie!' },
  'home.guest_free_account': { en: 'Create a free account — keep your progress', he: 'צור חשבון חינמי — לא תאבד את ההתקדמות', ar: 'أنشئ حسابًا مجانيًا — لا تفقد تقدمك', es: 'Crea una cuenta gratis — no pierdas tu progreso', pt: 'Crie uma conta grátis — mantenha seu progresso', fr: 'Créez un compte gratuit — gardez votre progression', de: 'Erstelle ein kostenloses Konto — behalte deinen Fortschritt', it: 'Crea un account gratuito — mantieni i tuoi progressi' },
  'home.guest_join': { en: 'Join', he: 'הצטרף', ar: 'انضم', es: 'Unirse', pt: 'Entrar', fr: 'Rejoindre', de: 'Beitreten', it: 'Unisciti' },
  // ─── Home — hourly battle card sub ───
  'home.hourly_open_now': { en: 'Open now!', he: 'פתוח עכשיו!', ar: 'مفتوح الآن!', es: '¡Abierto ahora!', pt: 'Aberto agora!', fr: 'Ouvert maintenant!', de: 'Jetzt offen!', it: 'Aperto ora!' },
  'home.coming_soon': { en: 'Coming soon', he: 'בקרוב', ar: 'قريباً', es: 'Próximamente', pt: 'Em breve', fr: 'Bientôt', de: 'Demnächst', it: 'Presto' },
  // ─── Home — battle royale card ───
  'home.br_today': { en: 'Today', he: 'היום', ar: 'اليوم', es: 'Hoy', pt: 'Hoje', fr: "Aujourd'hui", de: 'Heute', it: 'Oggi' },

  // ─── Halftime ───
  'halftime.scores': { en: 'Halftime Scores', he: 'תוצאות ביניים', ar: 'نتائج الاستراحة' },
  'halftime.sub_available': { en: "67' Sub Available", he: "חילוף 67' זמין", ar: "تبديل 67' متاح" },
  'halftime.lock_sub': { en: 'Lock Sub', he: 'נעל חילוף', ar: 'تأكيد التبديل' },
  'halftime.var_boost': { en: 'Activate VAR', he: 'הפעל VAR', ar: 'تفعيل VAR' },
  'halftime.choose_one': { en: 'Choose one:', he: 'בחר אחד:', ar: 'اختر واحدًا:' },
  'halftime.correct_of_3': { en: 'correct', he: 'נכונות', ar: 'صحيحة' },

  // ─── Share ───
  'share.title': { en: 'Share Your Result', he: 'שתף את התוצאה', ar: 'شارك نتيجتك' },
  'share.copy': { en: 'Copy', he: 'העתק', ar: 'نسخ' },
  'share.copied': { en: 'Copied!', he: 'הועתק!', ar: 'تم النسخ!' },
  'share.share': { en: 'Share', he: 'שתף', ar: 'مشاركة' },
  'share.copy_link': { en: 'Copy Link', he: 'העתק קישור', ar: 'نسخ الرابط' },

  // ─── Ranked ───
  'ranked.title': { en: 'Ranked', he: '\u05DE\u05D3\u05D5\u05E8\u05D2', ar: '\u0645\u0635\u0646\u0641' },
  'ranked.rp': { en: 'RP', he: 'RP', ar: 'RP' },
  'ranked.peak_rp': { en: 'Peak RP', he: 'RP \u05E9\u05D9\u05D0', ar: 'RP \u0627\u0644\u0630\u0631\u0648\u0629' },
  'ranked.battles': { en: 'Ranked Battles', he: '\u05E7\u05E8\u05D1\u05D5\u05EA \u05DE\u05D3\u05D5\u05E8\u05D2\u05D9\u05DD', ar: '\u0645\u0639\u0627\u0631\u0643 \u0645\u0635\u0646\u0641\u0629' },
  'ranked.progress': { en: 'Next rank', he: '\u05D3\u05D9\u05E8\u05D5\u05D2 \u05D4\u05D1\u05D0', ar: '\u0627\u0644\u0645\u0631\u062A\u0628\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629' },
  'ranked.rank_up': { en: 'Rank Up!', he: '\u05E2\u05DC\u05D9\u05D9\u05EA \u05D3\u05D9\u05E8\u05D5\u05D2!', ar: '\u062A\u0631\u0642\u064A\u0629!' },
  'ranked.bronze': { en: 'Bronze', he: '\u05D1\u05E8\u05D5\u05E0\u05D6\u05D4', ar: '\u0628\u0631\u0648\u0646\u0632\u064A' },
  'ranked.silver': { en: 'Silver', he: '\u05DB\u05E1\u05E3', ar: '\u0641\u0636\u064A' },
  'ranked.gold': { en: 'Gold', he: '\u05D6\u05D4\u05D1', ar: '\u0630\u0647\u0628\u064A' },
  'ranked.platinum': { en: 'Platinum', he: '\u05E4\u05DC\u05D8\u05D9\u05E0\u05D4', ar: '\u0628\u0644\u0627\u062A\u064A\u0646\u064A' },
  'ranked.diamond': { en: 'Diamond', he: '\u05D9\u05D4\u05DC\u05D5\u05DD', ar: '\u0645\u0627\u0633\u064A' },
  'ranked.master': { en: 'Master', he: '\u05DE\u05D0\u05E1\u05D8\u05E8', ar: '\u0645\u0627\u0633\u062A\u0631' },
  'ranked.grandmaster': { en: 'Grandmaster', he: '\u05D2\u05E8\u05E0\u05D3\u05DE\u05D0\u05E1\u05D8\u05E8', ar: '\u062C\u0631\u0627\u0646\u062F \u0645\u0627\u0633\u062A\u0631' },
  'ranked.legend': { en: 'Legend', he: '\u05D0\u05D2\u05D3\u05D4', ar: '\u0623\u0633\u0637\u0648\u0631\u0629' },

  // ─── Theme ───
  'profile.theme': { en: 'Theme', he: 'ערכת נושא', ar: 'المظهر' },
  'profile.theme_classic': { en: 'Night Mode', he: 'מצב לילה', ar: 'الوضع الليلي' },
  'profile.theme_dynamic': { en: 'Dynamic', he: 'דינמי', ar: 'ديناميكي' },
  'profile.theme_midnight': { en: 'Midnight', he: 'חצות', ar: 'منتصف الليل' },
  'profile.theme_pitch': { en: 'Pitch', he: 'מגרש', ar: 'الملعب' },
  'profile.theme_elclasico': { en: 'El Clasico', he: 'אל קלאסיקו', ar: 'الكلاسيكو' },
  'profile.theme_pitchblack': { en: 'Pitch Black', he: 'שחור מוחלט', ar: 'أسود داكن' },
  'profile.theme_goldenera': { en: 'Golden Era', he: 'עידן הזהב', ar: 'العصر الذهبي' },
  'profile.theme_pro_only': { en: '9Pro', he: '9Pro', ar: '9Pro' },

  // ─── Leaderboard ───
  'leaderboard.battle_title': { en: 'BATTLE LEADERBOARD', he: 'טבלת דירוג', ar: 'تصنيف المعارك' },
  'leaderboard.loading': { en: 'Loading leaderboard...', he: 'טוען טבלת דירוג...', ar: 'جارٍ تحميل التصنيف...' },
  'leaderboard.empty': { en: 'No battles yet — be the first!', he: 'אין קרבות עדיין — היה הראשון!', ar: 'لا توجد معارك بعد — كن الأول!' },
  'leaderboard.season_empty': { en: 'Play Skill Battles to earn season points!', he: 'שחק קרבות מיומנות כדי לצבור נקודות עונה!', ar: 'العب معارك المهارة لكسب نقاط الموسم!' },
  'leaderboard.season_ends': { en: 'Season ends', he: 'העונה מסתיימת', ar: 'ينتهي الموسم' },
  'leaderboard.pts': { en: 'pts', he: 'נק\'', ar: 'نق' },
  'leaderboard.mode_all': { en: 'ALL', he: 'הכל', ar: 'الكل' },
  'leaderboard.mode_classic': { en: 'CLASSIC', he: 'קלאסי', ar: 'كلاسيكي' },
  'leaderboard.mode_sudden_death': { en: 'SUDDEN DEATH', he: 'מוות פתאומי', ar: 'موت مفاجئ' },
  'leaderboard.mode_best_of_3': { en: 'BEST OF 3', he: 'הטוב מ-3', ar: 'أفضل من 3' },
  'leaderboard.skill_tab': { en: 'SKILL', he: 'מיומנות', ar: 'مهارة' },
  'leaderboard.cards_played': { en: 'Cards', he: 'קלפים', ar: 'بطاقات' },

  // ─── Pre-match briefing ───
  'prematch.player_bots': { en: 'Player · Bots', he: 'שחקן · בוטים', ar: 'لاعب · روبوتات' },
  'prematch.players': { en: 'Players', he: 'שחקנים', ar: 'لاعبون' },
  'prematch.halftime_tactical': { en: "45' · Choose tactical item", he: "45' · בחר פריט טקטי", ar: "45' · اختر عنصرًا تكتيكيًا" },
  'prematch.halftime_standings': { en: "45' · Standings review", he: "45' · סקירת דירוג", ar: "45' · مراجعة الترتيب" },
  'prematch.items_skill': { en: 'Cards + VAR active', he: 'כרטיסים + VAR זמינים', ar: 'البطاقات + VAR مفعّلة' },
  'prematch.items_pure': { en: 'No items · Pure knowledge', he: 'ללא פריטים · ידע טהור', ar: 'بدون عناصر · معرفة صافية' },

  // ─── Onboarding ───
  'onboarding.tagline': { en: '9 seconds. Pure football.', he: '9 שניות. כדורגל טהור.', ar: '9 ثوانٍ. كرة قدم صافية.' },
  'onboarding.swipe': { en: 'Swipe to continue', he: 'החלק להמשך', ar: 'اسحب للمتابعة' },
  'onboarding.watch_learn_answer': { en: 'Watch. Learn. Answer.', he: 'צפה. למד. ענה.', ar: 'شاهد. تعلّم. أجب.' },
  'onboarding.watch_clip': { en: 'Watch a 9-second football clip', he: 'צפה בקליפ כדורגל בן 9 שניות', ar: 'شاهد مقطع كرة قدم مدته 9 ثوانٍ' },
  'onboarding.answer_5': { en: 'Answer 5 trivia questions', he: 'ענה על 5 שאלות טריוויה', ar: 'أجب عن 5 أسئلة' },
  'onboarding.earn_stars': { en: 'Earn stars and coins', he: 'צבור כוכבים ומטבעות', ar: 'اكسب نجومًا وعملات' },
  'onboarding.challenge_friends': { en: 'Challenge Friends', he: 'אתגר חברים', ar: 'تحدَّ أصدقاءك' },
  'onboarding.realtime_battles': { en: 'Real-time battles', he: 'קרבות בזמן אמת', ar: 'معارك مباشرة' },
  'onboarding.use_cards': { en: 'Use Skill Battle cards', he: 'השתמש בכרטיסי מיומנות', ar: 'استخدم بطاقات المهارة' },
  'onboarding.climb_leaderboard': { en: 'Climb the leaderboard', he: 'טפס בטבלת הדירוג', ar: 'تسلّق لوحة المتصدرين' },
  'onboarding.ready': { en: "You're Ready!", he: 'מוכנים!', ar: 'أنت جاهز!' },
  'onboarding.lets_go': { en: "LET'S GO!", he: '!יאללה', ar: 'هيّا بنا!' },
  'onboarding.tap_to_start': { en: 'Tap to start your journey', he: 'לחץ כדי להתחיל', ar: 'انقر لبدء رحلتك' },
  'onboarding.welcome_title': { en: 'Welcome to 9Soccer', he: 'ברוכים הבאים ל-9Soccer', ar: 'مرحبًا في 9Soccer' },
  'onboarding.welcome_subtitle': { en: '9 seconds. Pure football.', he: '9 שניות. כדורגל טהור.', ar: '9 ثوانٍ. كرة قدم صافية.' },
  'onboarding.how_it_works': { en: 'How It Works', he: 'איך זה עובד', ar: 'كيف يعمل', es: 'Cómo funciona', pt: 'Como funciona', fr: 'Comment ça marche', de: 'So funktioniert es', it: 'Come funziona' },
  'onboarding.step_watch': { en: 'Watch 9 seconds of football history', he: 'צפה ב-9 שניות מהיסטוריית הכדורגל', ar: 'شاهد 9 ثوانٍ من تاريخ كرة القدم' },
  'onboarding.step_answer': { en: 'Answer 5 questions from memory', he: 'ענה על 5 שאלות מהזיכרון', ar: 'أجب عن 5 أسئلة من الذاكرة' },
  'onboarding.step_compete': { en: 'Climb the leaderboard', he: 'טפס בטבלת הדירוג', ar: 'تسلّق لوحة المتصدرين' },
  'onboarding.choose_name': { en: 'Choose Your Name', he: 'בחר שם', ar: 'اختر اسمك' },
  'onboarding.what_call_you': { en: 'What should we call you?', he: 'איך לקרוא לך?', ar: 'ماذا نناديك؟' },
  'onboarding.first_challenge': { en: 'Your first challenge awaits', he: 'האתגר הראשון שלך מחכה', ar: 'تحديك الأول في انتظارك' },
  'onboarding.kick_off': { en: 'KICK OFF', he: 'התחל', ar: 'انطلاق' },
  'onboarding.skip': { en: 'Skip ›', he: 'דלג ›', ar: 'تخطي ›', es: 'Saltar ›', pt: 'Pular ›', fr: 'Passer ›', de: 'Überspringen ›', it: 'Salta ›' },
  'onboarding.got_it': { en: 'Got it', he: 'הבנתי', ar: 'فهمت' },
  'onboarding.thats_me': { en: "That's me", he: 'זה אני', ar: 'هذا أنا' },
  'onboarding.lets_play': { en: "Let's Play! ⚽", he: 'בואו נשחק! ⚽', ar: 'هيا نلعب! ⚽', es: '¡Vamos a jugar! ⚽', pt: 'Vamos jogar! ⚽', fr: 'Jouons! ⚽', de: 'Loslegen! ⚽', it: 'Giochiamo! ⚽' },
  'onboarding.next': { en: 'Next →', he: 'הבא →', ar: 'التالي →', es: 'Siguiente →', pt: 'Próximo →', fr: 'Suivant →', de: 'Weiter →', it: 'Avanti →' },
  'onboarding.step1_title': { en: 'Watch the clip', he: 'צפה בקליפ', ar: 'شاهد المقطع', es: 'Mira el clip', pt: 'Assista o clipe', fr: 'Regardez le clip', de: 'Clip ansehen', it: 'Guarda il clip' },
  'onboarding.step2_title': { en: 'Answer questions', he: 'ענה על שאלות', ar: 'أجب على الأسئلة', es: 'Responde preguntas', pt: 'Responda perguntas', fr: 'Répondez aux questions', de: 'Fragen beantworten', it: 'Rispondi alle domande' },
  'onboarding.step3_title': { en: 'Build your streak', he: 'צבור סטריק', ar: 'ابنِ سلسلتك', es: 'Construye tu racha', pt: 'Construa sua sequência', fr: 'Construisez votre série', de: 'Strähne aufbauen', it: 'Costruisci la tua serie' },
  'onboarding.step4_title': { en: 'Earn coins', he: 'הרווח מטבעות', ar: 'اكسب عملات', es: 'Gana monedas', pt: 'Ganhe moedas', fr: 'Gagnez des pièces', de: 'Münzen verdienen', it: 'Guadagna monete' },
  'onboarding.your_dna_is': { en: 'Your DNA is:', he: 'הDNA שלך הוא:', ar: 'حمضك النووي هو:', es: 'Tu ADN es:', pt: 'Seu DNA é:', fr: 'Ton ADN est :', de: 'Deine DNA ist:', it: 'Il tuo DNA è:' },
  'onboarding.you_play_like': { en: 'You play like', he: 'אתה משחק כמו', ar: 'تلعب مثل', es: 'Juegas como', pt: 'Você joga como', fr: 'Tu joues comme', de: 'Du spielst wie', it: 'Giochi come' },
  'onboarding.creature_partner': { en: 'Meet {name} — your journey partner!', he: 'הנה {name} — השותף שלך למסע!', ar: 'هذا {name} — رفيقك في الرحلة!', es: '¡Conoce a {name} — tu compañero de viaje!', pt: 'Conheça {name} — seu parceiro de jornada!', fr: 'Voici {name} — ton compagnon de voyage !', de: 'Das ist {name} — dein Reisebegleiter!', it: 'Ecco {name} — il tuo compagno di viaggio!' },
  'onboarding.more_creatures': { en: '8 more creatures await in DNA Detective', he: 'עוד 8 creatures מחכים לך ב-DNA Detective', ar: '8 مخلوقات أخرى تنتظرك في DNA Detective', es: '8 criaturas más te esperan en DNA Detective', pt: '8 criaturas mais aguardam em DNA Detective', fr: '8 créatures t\'attendent dans DNA Detective', de: '8 weitere Kreaturen warten im DNA Detective', it: '8 altre creature ti aspettano in DNA Detective' },
  'onboarding.tap_to_continue': { en: 'Tap to continue', he: 'הקש להמשיך', ar: 'اضغط للمتابعة', es: 'Toca para continuar', pt: 'Toque para continuar', fr: 'Appuyez pour continuer', de: 'Tippen zum Fortfahren', it: 'Tocca per continuare' },

  // ─── Shop ───
  'shop.title': { en: 'SHOP', he: 'חנות', ar: 'المتجر' },
  'shop.coins': { en: 'Coins', he: 'מטבעות', ar: 'عملات' },
  'shop.coin_packs': { en: 'Coin Packs', he: 'חבילות מטבעות', ar: 'حزم العملات' },
  'shop.best_value': { en: 'Best Value', he: 'הכי משתלם', ar: 'أفضل قيمة' },
  'shop.daily_bonus': { en: 'Daily Bonus', he: 'בונוס יומי', ar: 'مكافأة يومية' },
  'shop.come_back': { en: 'Come back tomorrow!', he: 'חזור מחר!', ar: 'عُد غدًا!' },
  'shop.daily_soon': { en: 'Daily rewards are coming soon', he: 'פרסים יומיים בקרוב', ar: 'المكافآت اليومية قريبًا' },
  'shop.go_pro': { en: 'Go Pro — 2x Coins & More', he: 'הפוך ל-Pro — כפול מטבעות ועוד', ar: 'اشترك Pro — ضعف العملات والمزيد' },
  'shop.subscribe': { en: 'Subscribe', he: 'הירשם', ar: 'اشتراك' },
  'shop.processing': { en: 'Processing...', he: 'מעבד...', ar: 'جارٍ المعالجة...' },
  'shop.active_pro': { en: "Active — You're a Pro!", he: 'פעיל — אתה Pro!', ar: 'نشط — أنت Pro!' },
  'shop.restore': { en: 'Restore Purchases', he: 'שחזר רכישות', ar: 'استعادة المشتريات' },
  'shop.restoring': { en: 'Restoring...', he: 'משחזר...', ar: 'جارٍ الاستعادة...' },
  'shop.purchase_failed': { en: 'Purchase failed', he: 'הרכישה נכשלה', ar: 'فشلت عملية الشراء' },
  'shop.something_wrong': { en: 'Something went wrong. Try again.', he: 'משהו השתבש. נסה שוב.', ar: 'حدث خطأ. حاول مجددًا.' },
  'shop.no_restore': { en: 'No purchases to restore.', he: 'אין רכישות לשחזור.', ar: 'لا توجد مشتريات للاستعادة.' },
  'shop.restore_failed': { en: 'Restore failed. Try again.', he: 'השחזור נכשל. נסה שוב.', ar: 'فشلت الاستعادة. حاول مجددًا.' },

  // ─── Game / Solo ───
  'game.challenge_complete': { en: 'CHALLENGE COMPLETE', he: 'האתגר הושלם', ar: 'اكتمل التحدي' },
  'game.total_points': { en: 'Total Points', he: 'סה״כ נקודות', ar: 'مجموع النقاط' },
  'game.play_again': { en: 'Play Again', he: 'שחק שוב', ar: 'العب مجددًا' },
  'game.home': { en: 'Home', he: 'בית', ar: 'الرئيسية' },
  'game.next_level': { en: 'Next Level', he: 'השלב הבא', ar: 'المستوى التالي' },
  'game.replay': { en: 'Replay', he: 'שחק שוב', ar: 'إعادة' },
  'game.passed': { en: 'PASSED', he: 'עברת!', ar: 'نجحت!' },
  'game.failed': { en: 'NOT YET', he: 'עוד לא', ar: 'لم تنجح بعد' },
  'game.play_next': { en: 'Play Next', he: 'שחק הבא', ar: 'العب التالي' },
  'game.near_miss': { en: 'So close! Try again.', he: 'כמעט! נסה שוב.', ar: 'قريب جدًا! حاول مجددًا.' },

  // ─── Language Settings ───
  'settings.language': { en: 'Language', he: 'שפה', ar: 'اللغة' },

  // ─── General ───
  'general.back': { en: 'Back', he: 'חזור', ar: 'رجوع' },
  'general.loading': { en: 'Loading...', he: 'טוען...', ar: 'جارٍ التحميل...' },
  'general.error': { en: 'Error', he: 'שגיאה', ar: 'خطأ' },
  'general.retry': { en: 'Retry', he: 'נסה שוב', ar: 'أعد المحاولة' },
  'general.close': { en: 'Close', he: 'סגור', ar: 'إغلاق' },
  'general.save': { en: 'Save', he: 'שמור', ar: 'حفظ' },
  'general.cancel': { en: 'Cancel', he: 'ביטול', ar: 'إلغاء' },
  'general.confirm': { en: 'Confirm', he: 'אישור', ar: 'تأكيد' },
  'general.yes': { en: 'Yes', he: 'כן', ar: 'نعم' },
  'general.no': { en: 'No', he: 'לא', ar: 'لا' },

  // ─── Versus Mode ───
  'versus.title': { en: 'Versus', he: '\u05DE\u05D5\u05DC \u05DE\u05D5\u05DC', ar: '\u0645\u0642\u0627\u0628\u0644' },
  'versus.question': { en: 'Who wins?', he: '\u05DE\u05D9 \u05DE\u05E0\u05E6\u05D7?', ar: '\u0645\u0646 \u064A\u0641\u0648\u0632\u061F' },
  'versus.correct': { en: 'Correct!', he: '\u05E0\u05DB\u05D5\u05DF!', ar: '\u0635\u062D\u064A\u062D!' },
  'versus.wrong': { en: 'Wrong!', he: '\u05DC\u05D0 \u05E0\u05DB\u05D5\u05DF!', ar: '\u062E\u0637\u0623!' },
  'versus.timeout': { en: "Time's up!", he: '\u05E0\u05D2\u05DE\u05E8 \u05D4\u05D6\u05DE\u05DF!', ar: '\u0627\u0646\u062A\u0647\u0649 \u0627\u0644\u0648\u0642\u062A!' },
  'versus.next': { en: 'Next Matchup', he: '\u05D4\u05E2\u05D9\u05DE\u05D5\u05EA \u05D4\u05D1\u05D0', ar: '\u0627\u0644\u0645\u0648\u0627\u062C\u0647\u0629 \u0627\u0644\u062A\u0627\u0644\u064A\u0629' },
  'versus.results': { en: 'See Results', he: '\u05E6\u05E4\u05D4 \u05D1\u05EA\u05D5\u05E6\u05D0\u05D5\u05EA', ar: '\u0639\u0631\u0636 \u0627\u0644\u0646\u062A\u0627\u0626\u062C' },
  'versus.complete': { en: 'Versus Complete', he: '\u05DE\u05D5\u05DC \u05DE\u05D5\u05DC \u05D4\u05D5\u05E9\u05DC\u05DD', ar: '\u0627\u0643\u062A\u0645\u0644\u062A \u0627\u0644\u0645\u0642\u0627\u0628\u0644\u0629' },
  'versus.play_again': { en: 'Play Again', he: '\u05E9\u05D7\u05E7 \u05E9\u05D5\u05D1', ar: '\u0627\u0644\u0639\u0628 \u0645\u062C\u062F\u062F\u064B\u0627' },
  'versus.back_home': { en: 'Back to Home', he: '\u05D7\u05D6\u05D5\u05E8 \u05DC\u05D1\u05D9\u05EA', ar: '\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0644\u0631\u0626\u064A\u0633\u064A\u0629' },
  'versus.winner': { en: 'WINNER', he: '\u05DE\u05E0\u05E6\u05D7', ar: '\u0627\u0644\u0641\u0627\u0626\u0632' },
  'versus.speed_bonus': { en: 'Speed bonus!', he: '\u05D1\u05D5\u05E0\u05D5\u05E1 \u05DE\u05D4\u05D9\u05E8\u05D5\u05EA!', ar: '\u0645\u0643\u0627\u0641\u0623\u0629 \u0627\u0644\u0633\u0631\u0639\u0629!' },

  // ─── Memory Match Mode ───
  'memory.title': { en: 'Memory Match', he: '\u05DE\u05E9\u05D7\u05E7 \u05D6\u05D9\u05DB\u05E8\u05D5\u05DF', ar: '\u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0644\u0630\u0627\u0643\u0631\u0629' },
  'memory.match_pairs': { en: 'Match the football pairs', he: '\u05D4\u05EA\u05D0\u05DD \u05D0\u05EA \u05D4\u05D6\u05D5\u05D2\u05D5\u05EA', ar: '\u0637\u0627\u0628\u0642 \u0627\u0644\u0623\u0632\u0648\u0627\u062C' },
  'memory.memorize': { en: 'Memorize!', he: '\u05E9\u05E0\u05DF!', ar: '\u0627\u062D\u0641\u0638!' },
  'memory.pairs_found': { en: 'pairs found', he: '\u05D6\u05D5\u05D2\u05D5\u05EA \u05E0\u05DE\u05E6\u05D0\u05D5', ar: '\u0623\u0632\u0648\u0627\u062C \u0648\u064F\u062C\u062F\u062A' },
  'memory.get_ready': { en: 'Get ready...', he: '\u05D4\u05EA\u05DB\u05D5\u05E0\u05DF...', ar: '\u0627\u0633\u062A\u0639\u062F...' },
  'memory.complete': { en: 'Memory Match Complete', he: '\u05DE\u05E9\u05D7\u05E7 \u05D4\u05D6\u05D9\u05DB\u05E8\u05D5\u05DF \u05D4\u05D5\u05E9\u05DC\u05DD', ar: '\u0627\u0643\u062A\u0645\u0644\u062A \u0645\u0637\u0627\u0628\u0642\u0629 \u0627\u0644\u0630\u0627\u0643\u0631\u0629' },
  'memory.legendary': { en: 'LEGENDARY', he: '\u05D0\u05D2\u05D3\u05D9', ar: '\u0623\u0633\u0637\u0648\u0631\u064A' },
  'memory.perfect_match': { en: 'Perfect Match', he: '\u05D4\u05EA\u05D0\u05DE\u05D4 \u05DE\u05D5\u05E9\u05DC\u05DE\u05EA', ar: '\u062A\u0637\u0627\u0628\u0642 \u0645\u062B\u0627\u0644\u064A' },
  'memory.time_left': { en: 'Time Left', he: '\u05D6\u05DE\u05DF \u05E0\u05D5\u05EA\u05E8', ar: '\u0627\u0644\u0648\u0642\u062A \u0627\u0644\u0645\u062A\u0628\u0642\u064A' },
  'memory.play_again': { en: 'Play Again', he: '\u05E9\u05D7\u05E7 \u05E9\u05D5\u05D1', ar: '\u0627\u0644\u0639\u0628 \u0645\u062C\u062F\u062F\u064B\u0627' },

  // ─── Nav ───
  'nav.home': { en: 'Home', he: 'בית', ar: 'الرئيسية' },
  'nav.play': { en: 'Play', he: 'שחק', ar: 'العب' },
  'nav.shop': { en: 'Shop', he: 'חנות', ar: 'المتجر' },
  'nav.ranks': { en: 'Ranks', he: 'דירוג', ar: 'تصنيف' },
  'nav.me': { en: 'Me', he: 'אני', ar: 'أنا' },

  // ─── Modes Hub ───
  'modes.daily': { en: 'Daily Challenge', he: 'אתגר יומי', ar: 'التحدي اليومي' },
  'modes.daily_desc': { en: "Today's featured moment", he: 'הרגע המרכזי של היום', ar: 'لحظة اليوم المميزة' },
  'modes.timeline': { en: 'Timeline', he: 'ציר זמן', ar: 'الجدول الزمني' },
  'modes.timeline_desc': { en: 'Sort football history', he: 'סדר את היסטוריית הכדורגל', ar: 'رتّب تاريخ كرة القدم' },
  'modes.wager': { en: 'Wager', he: 'הימור', ar: 'رهان' },
  'modes.wager_desc': { en: 'Bet your coins', he: 'הימר את המטבעות שלך', ar: 'راهن بعملاتك' },
  'modes.elimination': { en: 'Elimination', he: 'הדחה', ar: 'إقصاء' },
  'modes.elimination_desc': { en: '3 lives. No mercy.', he: '3 חיים. בלי רחמים.', ar: '3 أرواح. بلا رحمة.' },
  'modes.speed': { en: 'Speed Round', he: 'סיבוב מהיר', ar: 'جولة سريعة' },
  'modes.speed_desc': { en: '10 Qs. 5 seconds each.', he: '10 שאלות. 5 שניות כל אחת.', ar: '10 أسئلة. 5 ثوانٍ لكل سؤال.' },
  'modes.bluff': { en: 'Bluff', he: 'בלוף', ar: 'خداع' },
  'modes.bluff_desc': { en: 'Write fake answers, fool the AI', he: 'כתוב תשובות מזויפות, רמה את ה-AI', ar: 'اكتب إجابات مزيفة واخدع الذكاء الاصطناعي' },
  'modes.chain': { en: 'Chain', he: 'שרשרת', ar: 'سلسلة' },
  'modes.chain_desc': { en: 'Linked knowledge test', he: 'מבחן ידע מקושר', ar: 'اختبار معرفة متسلسل' },
  'modes.scout': { en: 'Scout', he: 'סקאוט', ar: 'كشاف' },
  'modes.scout_desc': { en: 'Identify players from stats alone', he: 'זהה שחקנים מסטטיסטיקות בלבד', ar: 'حدد اللاعبين من الإحصائيات فقط' },
  'modes.prediction': { en: 'Prediction', he: 'ניחוש', ar: 'تنبؤ' },
  'modes.prediction_desc': { en: 'Predict iconic football moments', he: 'נחש רגעים אייקוניים בכדורגל', ar: 'توقع لحظات كرة القدم الأيقونية' },
  'modes.versus': { en: 'Versus', he: 'מול מול', ar: 'مقابل' },
  'modes.versus_desc': { en: 'Who wins? Pure football stats', he: 'מי מנצח? סטטיסטיקות טהורות', ar: 'من يفوز؟ إحصائيات كرة قدم صافية' },
  'modes.memory': { en: 'Memory', he: 'זיכרון', ar: 'ذاكرة' },
  'modes.memory_desc': { en: 'Match the football pairs', he: 'התאם את הזוגות', ar: 'طابق الأزواج' },
  'modes.tournament': { en: 'Tournament', he: 'טורניר', ar: 'بطولة' },
  'modes.tournament_desc': { en: '8-player bracket. Win 500 coins.', he: 'שלב נוק-אאוט. זכה ב-500 מטבעות.', ar: 'قرعة 8 لاعبين. اربح 500 عملة.' },
  'modes.br': { en: 'Battle Royale', he: 'בטל רויאל', ar: 'باتل رويال' },
  'modes.br_desc': { en: '50 players. Last one standing.', he: '50 שחקנים. האחרון שנשאר.', ar: '50 لاعبًا. الأخير يفوز.' },
  'modes.battle': { en: 'Battle', he: 'קרב', ar: 'معركة' },
  'modes.battle_desc': { en: 'Challenge a friend', he: 'אתגר חבר', ar: 'تحدَّ صديقًا' },
  'modes.featured': { en: 'Featured', he: 'מומלץ', ar: 'مميز' },
  'modes.quick_play': { en: 'Quick Play', he: 'משחק מהיר', ar: 'لعب سريع' },
  'modes.pvp': { en: 'PVP', he: 'נגד שחקנים', ar: 'ضد لاعبين' },
  'modes.more': { en: 'More Modes', he: 'עוד משחקים', ar: 'أوضاع أخرى' },
  'modes.join_now': { en: 'Join Now', he: 'הצטרף עכשיו', ar: 'انضم الآن' },
  'modes.find_match': { en: 'Find Match', he: 'מצא קרב', ar: 'ابحث عن مباراة' },
  'modes.online': { en: 'online', he: 'מחוברים', ar: 'متصل' },
  'modes.best': { en: 'Best', he: 'שיא', ar: 'الأفضل' },
  'modes.complete': { en: 'challenges complete', he: 'אתגרים הושלמו', ar: 'تحديات مكتملة' },

  // ─── Matchmaking ───
  'match.you': { en: 'YOU', he: 'אתה', ar: 'أنت' },
  'match.vs': { en: 'VS', he: 'נגד', ar: 'ضد' },
  'match.finding': { en: 'FINDING OPPONENT...', he: 'מחפש יריב...', ar: 'جارٍ البحث عن منافس...' },
  'match.finding_ai': { en: 'Finding opponent...', he: 'מחפש יריב...', ar: 'جارٍ البحث عن منافس...' },
  'match.found': { en: 'OPPONENT FOUND!', he: 'יריב נמצא!', ar: 'تم العثور على منافس!' },
  'match.get_ready': { en: 'Get ready!', he: 'התכונן!', ar: 'استعد!' },
  'match.play_ai': { en: 'PLAY VS AI INSTEAD', he: 'שחק נגד AI', ar: 'العب ضد الذكاء الاصطناعي' },
  'match.cancel': { en: 'Cancel', he: 'ביטול', ar: 'إلغاء' },

  // ─── Empty States ───
  'empty.no_battles': { en: 'No battles yet', he: 'אין קרבות עדיין', ar: 'لا توجد معارك بعد' },
  'empty.no_battles_desc': { en: 'Challenge a friend or join matchmaking to start your first battle!', he: 'אתגר חבר או הצטרף לשיבוץ כדי להתחיל!', ar: 'تحدَّ صديقًا أو انضم للعثور على منافس!' },
  'empty.find_match': { en: 'Find a Match', he: 'מצא קרב', ar: 'ابحث عن مباراة' },
  'empty.missions_refresh': { en: 'Missions refreshing...', he: 'משימות מתעדכנות...', ar: 'جارٍ تحديث المهام...' },
  'empty.missions_desc': { en: 'New daily missions appear every day at midnight. Check back soon!', he: 'משימות יומיות חדשות מופיעות בחצות. חזור בקרוב!', ar: 'تظهر مهام يومية جديدة عند منتصف الليل. عُد قريبًا!' },
  'empty.no_cosmetics': { en: 'No cosmetics yet', he: 'אין פריטים עדיין', ar: 'لا توجد مستحضرات بعد' },
  'empty.no_cosmetics_desc': { en: 'Earn coins by playing challenges and unlock themes, avatars, and more.', he: 'צבור מטבעות משחק ופתח ערכות נושא, אווטרים ועוד.', ar: 'اكسب عملات من التحديات وافتح مظاهر وصور رمزية والمزيد.' },
  'empty.play_challenge': { en: 'Play a Challenge', he: 'שחק אתגר', ar: 'العب تحدي' },
  'empty.start_streak': { en: 'Start your streak', he: 'התחל רצף', ar: 'ابدأ سلسلتك' },
  'empty.start_streak_desc': { en: 'Play the daily challenge every day to build your streak and earn bonus rewards!', he: 'שחק את האתגר היומי כל יום כדי לבנות רצף ולזכות בפרסים!', ar: 'العب التحدي اليومي كل يوم لبناء سلسلتك وكسب مكافآت!' },
  'empty.play_today': { en: 'Play Today', he: 'שחק היום', ar: 'العب اليوم' },
  'empty.no_players': { en: 'No players yet', he: 'אין שחקנים עדיין', ar: 'لا يوجد لاعبون بعد' },
  'empty.no_players_desc': { en: 'Be the first on the leaderboard! Complete challenges to earn your spot.', he: 'היה הראשון בטבלה! השלם אתגרים כדי לזכות במקומך.', ar: 'كن الأول! أكمل التحديات لتحجز مكانك.' },

  // ─── Pro ───
  'pro.title': { en: '9Soccer Pro', he: '9Soccer Pro', ar: '9Soccer Pro' },
  'pro.go_pro': { en: 'GO PRO', he: 'הפוך ל-PRO', ar: 'اشترك PRO' },
  'pro.unlock_all': { en: 'Unlock everything', he: 'פתח הכל', ar: 'افتح كل شيء' },
  'pro.activated': { en: '9Pro activated! Welcome to the club.', he: '9Pro הופעל! ברוך הבא למועדון.', ar: '9Pro مفعّل! مرحبًا في النادي.' },
  'pro.error': { en: 'Something went wrong. Try again.', he: 'משהו השתבש. נסה שוב.', ar: 'حدث خطأ. حاول مجددًا.' },
  'pro.restored': { en: 'Pro subscription restored!', he: 'מנוי Pro שוחזר!', ar: 'تم استعادة اشتراك Pro!' },
  'pro.no_restore': { en: 'No purchases to restore.', he: 'אין רכישות לשחזור.', ar: 'لا توجد مشتريات للاستعادة.' },
  'pro.restore_fail': { en: 'Restore failed. Try again.', he: 'השחזור נכשל. נסה שוב.', ar: 'فشلت الاستعادة. حاول مجددًا.' },
  'pro.coming_soon': { en: "Coming soon — you'll get Pro free during beta!", he: 'בקרוב — תקבל Pro חינם בתקופת הבטא!', ar: 'قريبًا — ستحصل على Pro مجانًا خلال البيتا!' },
  'pro.requires': { en: 'requires Pro', he: 'דורש Pro', ar: 'يتطلب Pro' },

  // ─── Notifications ───
  'notif.title': { en: 'Notifications', he: 'התראות', ar: 'الإشعارات' },
  'notif.empty': { en: 'No notifications yet', he: 'אין התראות עדיין', ar: 'لا توجد إشعارات بعد' },

  // ─── Offline ───
  'offline.title': { en: "You're offline", he: 'אתה לא מחובר', ar: 'أنت غير متصل' },
  'offline.desc': { en: 'Check your internet connection and try again. The beautiful game awaits.', he: 'בדוק את חיבור האינטרנט ונסה שוב. המשחק היפה מחכה.', ar: 'تحقق من اتصالك بالإنترنت وحاول مجددًا. اللعبة الجميلة بانتظارك.' },
  'offline.last_played': { en: 'Last played', he: 'שיחקת לאחרונה', ar: 'آخر مرة لعبت' },
  'offline.streak': { en: 'Current streak', he: 'רצף נוכחי', ar: 'السلسلة الحالية' },
  'offline.try_again': { en: 'Try Again', he: 'נסה שוב', ar: 'حاول مجددًا' },
  'offline.day': { en: 'day', he: 'יום', ar: 'يوم' },
  'offline.days': { en: 'days', he: 'ימים', ar: 'أيام' },
  'offline.limited': { en: 'You are offline — some features may be limited', he: 'אתה לא מחובר — חלק מהתכונות עלולות להיות מוגבלות', ar: 'أنت غير متصل — بعض الميزات قد تكون محدودة' },

  // ─── Skills ───
  'skills.get_in_shop': { en: 'Get skills in Shop', he: 'קנה מיומנויות בחנות', ar: 'احصل على مهارات من المتجر' },

  // ─── Shop extra ───
  'shop.power_ups': { en: 'Power-Ups', he: 'שדרוגים', ar: 'تعزيزات' },
  'shop.themes': { en: 'Themes', he: 'ערכות נושא', ar: 'المظاهر' },
  'shop.badges': { en: 'Badges', he: 'תגים', ar: 'شارات' },
  'shop.effects': { en: 'Effects', he: 'אפקטים', ar: 'تأثيرات' },
  'shop.balls': { en: 'Balls', he: 'כדורים', ar: 'كرات' },
  'shop.confirm_purchase': { en: 'Confirm Purchase', he: 'אשר רכישה', ar: 'تأكيد الشراء' },
  'shop.buy_for': { en: 'Buy for', he: 'קנה ב-', ar: 'اشترِ بـ' },
  'shop.buy': { en: 'Buy', he: 'קנה', ar: 'اشترِ' },

  // ─── Weekly Winners ───
  'weekly.champions': { en: "Last Week's Champions", he: 'אלופי השבוע שעבר', ar: 'أبطال الأسبوع الماضي' },
  'weekly.loading': { en: 'Loading champions...', he: 'טוען אלופים...', ar: 'جارٍ تحميل الأبطال...' },
  'weekly.none': { en: 'No champions yet', he: 'אין אלופים עדיין', ar: 'لا يوجد أبطال بعد' },

  // ─── Achievement Titles (Game Modes) ───
  'title.legendary': { en: 'Legendary', he: 'אגדי', ar: 'أسطوري' },
  'title.perfect_match': { en: 'Perfect Match', he: 'התאמה מושלמת', ar: 'تطابق مثالي' },
  'title.sharp_memory': { en: 'Sharp Memory', he: 'זיכרון חד', ar: 'ذاكرة حادة' },
  'title.getting_there': { en: 'Getting There', he: 'בדרך הנכונה', ar: 'في الطريق' },
  'title.rookie': { en: 'Rookie', he: 'טירון', ar: 'مبتدئ' },
  'title.oracle': { en: 'Oracle', he: 'נביא', ar: 'عرّاف' },
  'title.time_traveller': { en: 'Time Traveller', he: 'נוסע בזמן', ar: 'مسافر عبر الزمن' },
  'title.prophet': { en: 'Prophet', he: 'חוזה', ar: 'نبي' },
  'title.clairvoyant': { en: 'Clairvoyant', he: 'בעל ראייה', ar: 'بصير' },
  'title.crystal_ball_novice': { en: 'Crystal Ball Novice', he: 'מתחיל בכדור בדולח', ar: 'مبتدئ الكرة البلورية' },
  'title.director_of_football': { en: 'Director of Football', he: 'מנהל ספורטיבי', ar: 'مدير كرة القدم' },
  'title.chief_scout': { en: 'Chief Scout', he: 'סקאוט ראשי', ar: 'كبير الكشافين' },
  'title.senior_scout': { en: 'Senior Scout', he: 'סקאוט בכיר', ar: 'كشاف أقدم' },
  'title.scout': { en: 'Scout', he: 'סקאוט', ar: 'كشاف' },
  'title.academy_observer': { en: 'Academy Observer', he: 'צופה אקדמיה', ar: 'مراقب أكاديمية' },
  'title.data_god': { en: 'Data God', he: 'אל הנתונים', ar: 'إله البيانات' },
  'title.statistician': { en: 'Statistician', he: 'סטטיסטיקאי', ar: 'إحصائي' },
  'title.analyst': { en: 'Analyst', he: 'אנליסט', ar: 'محلل' },
  'title.stats_fan': { en: 'Stats Fan', he: 'חובב סטטיסטיקה', ar: 'مهووس إحصائيات' },

  // ─── Error Messages ───
  'error.network': { en: 'Network error. Check your connection.', he: 'שגיאת רשת. בדוק את החיבור.', ar: 'خطأ في الشبكة. تحقق من اتصالك.' },
  'error.generic': { en: 'Something went wrong.', he: 'משהו השתבש.', ar: 'حدث خطأ ما.' },
  'error.not_found': { en: 'Not found.', he: 'לא נמצא.', ar: 'غير موجود.' },
  'error.offline': { en: 'You are offline', he: 'אתה לא מחובר', ar: 'أنت غير متصل' },

  // ─── WC 2026 Multilingual (es/pt/fr/de/it) — key UI strings ───
  'play.button':     { en: 'PLAY', he: 'שחק', ar: 'العب', es: 'JUGAR', pt: 'JOGAR', fr: 'JOUER', de: 'SPIELEN', it: 'GIOCA' },
  'play.ready':      { en: 'GET READY!', he: 'התכונן!', ar: 'استعد!', es: '¡PREPÁRATE!', pt: 'PREPARA-TE!', fr: 'PRÉPARE-TOI!', de: 'MACH DICH BEREIT!', it: 'PREPARATI!' },
  'play.today':      { en: "Today's Challenge", he: 'אתגר היום', ar: 'تحدي اليوم', es: 'Desafío de hoy', pt: 'Desafio de hoje', fr: "Défi du jour", de: 'Heutiges Quiz', it: 'Sfida di oggi' },
  'play.correct':    { en: '✓ Correct!', he: '✓ נכון!', ar: '✓ صحيح!', es: '✓ ¡Correcto!', pt: '✓ Correto!', fr: '✓ Correct!', de: '✓ Richtig!', it: '✓ Corretto!' },
  'play.wrong':      { en: '✗ Wrong', he: '✗ לא נכון', ar: '✗ خطأ', es: '✗ Incorrecto', pt: '✗ Errado', fr: '✗ Incorrect', de: '✗ Falsch', it: '✗ Sbagliato' },
  'play.time_up':    { en: "Time's up!", he: 'נגמר הזמן!', ar: 'انتهى الوقت!', es: '¡Se acabó el tiempo!', pt: 'Tempo esgotado!', fr: 'Temps écoulé!', de: 'Zeit abgelaufen!', it: 'Tempo scaduto!' },
  'play.score':      { en: 'Score', he: 'ניקוד', ar: 'النتيجة', es: 'Puntuación', pt: 'Pontuação', fr: 'Score', de: 'Punkte', it: 'Punteggio' },
  'play.share':      { en: 'Share my score', he: 'שתף את הניקוד שלי', ar: 'شارك نتيجتي', es: 'Compartir mi puntuación', pt: 'Compartilhar minha pontuação', fr: 'Partager mon score', de: 'Punkte teilen', it: 'Condividi il mio punteggio' },
  'play.next':       { en: 'Next', he: 'הבא', ar: 'التالي', es: 'Siguiente', pt: 'Próximo', fr: 'Suivant', de: 'Weiter', it: 'Avanti' },
  'battle.royale':   { en: 'BATTLE ROYALE', he: 'בטל רויאל', ar: 'باتل رويال', es: 'BATALLA CAMPAL', pt: 'BATALHA REAL', fr: 'BATTLE ROYALE', de: 'BATTLE ROYALE', it: 'BATTLE ROYALE' },
  'battle.next_in':  { en: 'Next battle in', he: 'הקרב הבא בעוד', ar: 'المعركة التالية خلال', es: 'Próxima batalla en', pt: 'Próxima batalha em', fr: 'Prochain combat dans', de: 'Nächste Battle in', it: 'Prossima battaglia tra' },
  'battle.champion_msg': { en: '🏆 CHAMPION!', he: '🏆 אלוף!', ar: '🏆 البطل!', es: '🏆 ¡CAMPEÓN!', pt: '🏆 CAMPEÃO!', fr: '🏆 CHAMPION!', de: '🏆 CHAMPION!', it: '🏆 CAMPIONE!' },
  'onboard.step1':   { en: 'Watch 9 seconds of football history', he: 'צפה ב-9 שניות של היסטוריית כדורגל', ar: 'شاهد 9 ثوانٍ من تاريخ كرة القدم', es: 'Mira 9 segundos de historia del fútbol', pt: 'Assista 9 segundos de história do futebol', fr: '9 secondes de football', de: '9 Sekunden Fußballgeschichte', it: '9 secondi di storia del calcio' },
  'onboard.step2':   { en: 'Answer 5 questions to prove your knowledge', he: 'ענה על 5 שאלות כדי להוכיח את הידע שלך', ar: 'أجب على 5 أسئلة لإثبات معرفتك', es: 'Responde 5 preguntas', pt: 'Responda 5 perguntas', fr: 'Répondez à 5 questions', de: 'Beantworte 5 Fragen', it: 'Rispondi a 5 domande' },
  'onboard.step3':   { en: 'Beat players worldwide', he: 'נצח שחקנים בכל העולם', ar: 'تغلب على لاعبين حول العالم', es: 'Supera a jugadores de todo el mundo', pt: 'Supere jogadores do mundo todo', fr: 'Battez des joueurs du monde entier', de: 'Besiege Spieler weltweit', it: 'Batti giocatori in tutto il mondo' },
  'creature.answers_to_evolve': { he: 'עוד # תשובות לאבולוציה', ar: '# إجابات حتى التطور', en: '# more to evolve', es: '# más para evolucionar', pt: '# mais para evoluir', fr: 'encore # pour évoluer', de: 'noch # bis zur Entwicklung', it: 'ancora # per evolvere' },
} as const;

type TranslationKey = keyof typeof translations;

export function t(key: TranslationKey, lang?: Language): string {
  const l = lang || getStoredLanguage();
  const entry = translations[key] as Record<string, string> | undefined;
  return entry?.[l] ?? entry?.['en'] ?? key;
}

export function isHebrew(text: string): boolean {
  return /[\u0590-\u05FF]/.test(text);
}

export function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

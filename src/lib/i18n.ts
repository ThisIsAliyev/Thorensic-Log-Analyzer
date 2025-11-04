export type Locale = "en" | "az";

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    // Navigation
    "nav.upload": "Upload",
    "nav.explorer": "Explorer",
    "nav.dashboard": "Dashboard",
    "nav.aiAnalysis": "AI Analysis",
    "nav.incidents": "Incidents",
    "nav.alerts": "Alerts",
    "nav.queries": "Queries",
    "nav.reports": "Reports",
    "nav.settings": "Settings",
    
    // Upload
    "upload.title": "Upload Log Files",
    "upload.subtitle": "Drop your Apache or Nginx access logs to begin analysis.",
    "upload.dropzone": "Drag & drop your log file here or",
    "upload.chooseFile": "Choose File",
    "upload.supportedFormats": "Supported formats:",
    "upload.formats.apache": "Apache Combined",
    "upload.formats.nginx": "Nginx",
    "upload.formats.jsonl": "JSON Lines",
    "upload.formats.custom": "Custom",
    "upload.advanced": "Advanced Options",
    "upload.timezone": "Timezone",
    "upload.delimiter": "Delimiter",
    "upload.customGrok": "Custom Grok/Regex",
    "upload.fieldMapping": "Field Mapping Preset",
    "upload.preset.apache": "Apache",
    "upload.preset.nginx": "Nginx",
    "upload.preset.custom": "Custom",
    "upload.startParsing": "Start Parsing",
    "upload.goToExplorer": "Go to Explorer",
    
    // Explorer
    "explorer.empty": "No results yet — run a query or adjust your time range.",
    "explorer.saveQuery": "Save Query",
    "explorer.export": "Export",
    "explorer.pinToDashboard": "Pin to Dashboard",
    "explorer.createAlert": "Create Alert",
    
    // Dashboard
    "dashboard.edit": "Edit",
    "dashboard.save": "Save",
    "dashboard.cancel": "Cancel",
    "dashboard.addWidget": "Add Widget",
    
    // AI Analysis
    "ai.prompt": "Ask about your logs…",
    "ai.example1": "Why are 404s spiking?",
    "ai.example2": "Show top IPs in last 24h",
    "ai.example3": "Detect brute force on /wp-login.php",
    
    // Common
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.create": "Create",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.export": "Export",
    
    // Settings
    "settings.parsers": "Parsers",
    "settings.datasets": "Datasets",
    "settings.users": "Users & Roles",
    "settings.branding": "Branding",
    "settings.apiKeys": "API Keys",
    "settings.localization": "Localization",
  },
  az: {
    // Navigation
    "nav.upload": "Yüklə",
    "nav.explorer": "Tədqiqatçı",
    "nav.dashboard": "İdarə Paneli",
    "nav.aiAnalysis": "AI Təhlili",
    "nav.incidents": "Hadisələr",
    "nav.alerts": "Xəbərdarlıqlar",
    "nav.queries": "Sorğular",
    "nav.reports": "Hesabatlar",
    "nav.settings": "Parametrlər",
    
    // Upload
    "upload.title": "Log Fayllarını Yüklə",
    "upload.subtitle": "Təhlilə başlamaq üçün Apache və ya Nginx access log fayllarını bura sürükləyin.",
    "upload.dropzone": "Log faylınızı bura sürükləyin və ya",
    "upload.chooseFile": "Fayl Seçin",
    "upload.supportedFormats": "Dəstəklənən formatlar:",
    "upload.formats.apache": "Apache Combined",
    "upload.formats.nginx": "Nginx",
    "upload.formats.jsonl": "JSON Lines",
    "upload.formats.custom": "Fərdi",
    "upload.advanced": "Əlavə Seçimlər",
    "upload.timezone": "Vaxt Zonası",
    "upload.delimiter": "Ayırıcı",
    "upload.customGrok": "Fərdi Grok/Regex",
    "upload.fieldMapping": "Sahə Xəritələnməsi Preseti",
    "upload.preset.apache": "Apache",
    "upload.preset.nginx": "Nginx",
    "upload.preset.custom": "Fərdi",
    "upload.startParsing": "Parsinqə Başla",
    "upload.goToExplorer": "Tədqiqatçıya Get",
    
    // Explorer
    "explorer.empty": "Hələ nəticə yoxdur — sorğu yerinə yetirin və ya vaxt aralığını tənzimləyin.",
    "explorer.saveQuery": "Sorğunu Saxla",
    "explorer.export": "İxrac",
    "explorer.pinToDashboard": "İdarə Panelinə Bərkid",
    "explorer.createAlert": "Xəbərdarlıq Yarat",
    
    // Dashboard
    "dashboard.edit": "Redaktə",
    "dashboard.save": "Saxla",
    "dashboard.cancel": "Ləğv et",
    "dashboard.addWidget": "Vidjet Əlavə Et",
    
    // AI Analysis
    "ai.prompt": "Loglarınız haqqında soruşun…",
    "ai.example1": "Niyə 404-lər artır?",
    "ai.example2": "Son 24 saatda ən yüksək IP-ləri göstər",
    "ai.example3": "/wp-login.php-də brute force aşkar et",
    
    // Common
    "common.loading": "Yüklənir...",
    "common.error": "Xəta",
    "common.success": "Uğurlu",
    "common.save": "Saxla",
    "common.cancel": "Ləğv et",
    "common.delete": "Sil",
    "common.edit": "Redaktə",
    "common.create": "Yarat",
    "common.search": "Axtar",
    "common.filter": "Filter",
    "common.export": "İxrac",
    
    // Settings
    "settings.parsers": "Parserlər",
    "settings.datasets": "Məlumat Dəstləri",
    "settings.users": "İstifadəçilər və Rollar",
    "settings.branding": "Brendləmə",
    "settings.apiKeys": "API Açarları",
    "settings.localization": "Lokalizasiya",
  },
};

let currentLocale: Locale = "en";

export function setLocale(locale: Locale) {
  currentLocale = locale;
  localStorage.setItem("thorensic-locale", locale);
}

export function getLocale(): Locale {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("thorensic-locale") as Locale;
    if (stored && (stored === "en" || stored === "az")) {
      return stored;
    }
  }
  return currentLocale;
}

export function t(key: string): string {
  const locale = getLocale();
  return translations[locale][key] || key;
}


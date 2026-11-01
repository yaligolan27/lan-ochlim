// הגדרות האפליקציה
window.GD_CONFIG = {
  supabaseUrl: 'https://rrbivwhratkmzcfxqjih.supabase.co',
  supabaseKey: 'sb_publishable_sH-_lIUijbkrJvAvY2_SOA_j1oO2Itc',
  // מפתח Google Maps Platform (Places API (New) + Map Tiles API).
  // כשהוא ריק: מפה פתוחה + קישורים לגוגל מפות. כשהוא מוגדר: מפת גוגל, תמונות, דירוג ותפריט מגוגל בתוך האפליקציה.
  googleKey: '',
  // כמה מסעדות (הקרובות ביותר ברשימה) מקבלות תמונה ודירוג מגוגל בתצוגה הראשית. כל אחת היא קריאה בתשלום.
  googleListCount: 12,
  // שירות המסלולים בתוך האפליקציה (OpenStreetMap, ללא מפתח)
  routing: 'https://routing.openstreetmap.de',
  // נקודת מוצא ברירת מחדל למרחקים, עד שהמשתמש מאשר מיקום או בוחר נקודה משלו
  origin: { lat: 32.0741, lng: 34.7922, label: 'מרכז תל אביב' }
};

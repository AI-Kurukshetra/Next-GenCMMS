class SupabaseConfig {
  static const _productionUrl = 'https://ohijfgfymywelvhtpxbf.supabase.co';
  static const _productionAnonKey =
      'sb_publishable_vWQm3o69jf8ClwuzW2kyMA_uVuzeyov';

  static const url =
      String.fromEnvironment('SUPABASE_URL', defaultValue: _productionUrl);
  static const anonKey = String.fromEnvironment(
    'SUPABASE_ANON_KEY',
    defaultValue: _productionAnonKey,
  );

  static bool get isConfigured => url.isNotEmpty && anonKey.isNotEmpty;
}

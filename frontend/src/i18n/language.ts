export type AppLanguage = 'ro' | 'en' | 'ru';

export function appLanguage(value?: string | null): AppLanguage {
  const code = value?.toLowerCase().split('-')[0];
  return code === 'ru' || code === 'en' ? code : 'ro';
}

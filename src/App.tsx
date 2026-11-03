import { I18nContext, makeI18n, useI18n } from './i18n';

function Shell() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-finals-bg p-4 text-body text-finals-text">
      <h1 className="text-heading font-bold">{t('app.title')}</h1>
      <p className="text-body text-finals-muted">{t('app.subtitle')}</p>
      <p className="mt-4 text-small text-finals-muted">{t('fairplay.short')}</p>
    </div>
  );
}

export default function App() {
  return (
    <I18nContext.Provider value={makeI18n('en')}>
      <Shell />
    </I18nContext.Provider>
  );
}

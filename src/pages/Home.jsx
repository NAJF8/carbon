import { useI18n } from '../i18n/index.jsx';
import { useData } from '../store/data.jsx';
import { useReveal } from '../hooks/index.js';
import { useSeo } from '../utils/seo.js';
import { loc } from '../utils/format.js';
import { Hero, CategoriesRow, BannersRow, ProductsSection, useProductSets } from '../components/shop/sections.jsx';
import { EmptyState } from '../components/ui/index.jsx';

export default function Home() {
  const { catalog } = useData();
  const { t, lang } = useI18n();
  const sets = useProductSets();
  const { hero, sections } = catalog.home;
  const ref = useReveal([catalog, lang]);
  const store = loc(catalog.settings.store?.name, lang);
  useSeo({ title: `${store} | ${t('seo.homeTitle')}`, description: t('seo.homeDesc'), path: '/', lang });

  return (
    <div ref={ref}>
      <Hero hero={hero} />
      {sections.filter((s) => s.active).map((s) => {
        if (s.type === 'categories') return <CategoriesRow key={s.id} section={s} />;
        if (s.type === 'banners') return <BannersRow key={s.id} />;
        if (s.type === 'products') return <ProductsSection key={s.id} section={s} />;
        return null;
      })}
      {sets.all.length === 0 && (
        <section className="section"><div className="container">
          <EmptyState icon="box" title={t('empty.noProducts')} text={t('empty.noProductsText')} />
        </div></section>
      )}
    </div>
  );
}

import { useI18n } from '../../i18n/index.jsx';
import { useShop } from '../../store/shop.jsx';
import { useData } from '../../store/data.jsx';
import { Overlay, Img, Rating } from '../ui/index.jsx';
import { PriceBlock, ProductName, PurchasePanel, StockBadge } from './ProductBits.jsx';
import { Link } from '../../router.jsx';
import { loc } from '../../utils/format.js';

export default function QuickView() {
  const { ui, openUi } = useShop();
  const { catalog } = useData();
  const { lang, t } = useI18n();
  const p = catalog?.products.find((x) => x.id === ui.quick);
  const close = () => openUi({ quick: null });
  return (
    <Overlay open={!!p} onClose={close} title={p ? loc(p.name, lang) : ''} size="lg" className="quickview">
      {p && (
        <div className="qv">
          <Img src={p.images?.[0]?.src} alt={p.images?.[0]?.alt || loc(p.name, lang)} className="qv-img" ratio="1/1" eager />
          <div className="qv-info">
            <ProductName product={p} as="p" />
            <Rating value={p.rating} count={p.reviewCount} />
            <PriceBlock product={p} size="lg" />
            <StockBadge product={p} showCount />
            <PurchasePanel product={p} compact onAdded={close} />
            <Link to={`/product/${p.slug || p.id}`} className="text-link" onClick={close}>{t('product.fullDetails')} →</Link>
          </div>
        </div>
      )}
    </Overlay>
  );
}

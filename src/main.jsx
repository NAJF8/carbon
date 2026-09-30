import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { loadStoreData, mapProduct } from './carbonApi';
import Admin from './Admin';

const demoProducts = [];

const cats = [
  ['بروتين', 'بناء عضلات أقوى', 'whey'], ['كرياتين', 'قوة وأداء أعلى', 'creatine'], ['مكملات الوزن', 'زيادة الكتلة العضلية', 'mass'], ['فيتامينات', 'صحة أفضل كل يوم', 'vitamins'], ['الإكسسوارات', 'كل ما تحتاجه لتمرينك', 'gear']
];

const Icon = ({ name, size = 20 }) => {
  const paths = { search:'M11 4a7 7 0 1 0 4.9 12L21 21M4 11a7 7 0 0 1 7-7', cart:'M3 4h2l2 11h10l3-8H7M9 20h.01M17 20h.01', user:'M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8', heart:'M20.8 8.6c0 5.5-8.8 10.4-8.8 10.4S3.2 14.1 3.2 8.6A4.6 4.6 0 0 1 12 6.1a4.6 4.6 0 0 1 8.8 2.5Z', grid:'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z', compare:'M7 7h12l-3-3M17 17H5l3 3', menu:'M4 6h16M4 12h16M4 18h16', star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-3-5.5 3 1-6.2L3 9.6l6.2-.9z'};
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name] || paths.grid}/></svg>
};

function Logo(){ return <div className="logo"><div className="logo-mark">CG</div><div><strong>CARBON GROUP</strong><span>NUTRITION</span></div></div> }
function ProductArt({ kind, large=false }){ return <div className={`product-art art-${kind} ${large?'large':''}`}><div className="jar-cap"/><div className="jar-label"><small>100% PURE</small><b>{kind === 'whey' ? 'WHEY' : kind === 'creatine' ? 'CREATINE' : kind === 'vitamins' ? 'VITS' : kind === 'pre' ? 'PRE' : 'MASS'}</b><em>CARBON</em></div></div> }
function ProductCard({ p, onAdd, onCompare, compared }){ return <article className="product-card"><div className="product-top">{p.badge?<span className="badge">{p.badge}</span>:<span/>}<button className="icon-btn" aria-label="favorite"><Icon name="heart" size={18}/></button></div>{p.imageUrl?<div className="real-product-image"><img src={p.imageUrl} alt={p.ar} loading="lazy"/></div>:<ProductArt kind={p.image}/>}<div className="product-copy"><small>{p.brand}</small><h3>{p.ar}</h3><div className="rating"><span>★</span> {p.rating} <i>({p.reviews})</i></div><p className="price">{p.price>0 ? <>{p.price.toLocaleString('en-US')} <small>د.ع</small></> : <span className="price-request">السعر عند الطلب</span>} {p.old ? <del>{p.old.toLocaleString('en-US')}</del> : null}</p><div className="product-actions"><button className="add" onClick={()=>onAdd(p)}>أضف للسلة</button><button className={`compare ${compared?'selected':''}`} onClick={()=>onCompare(p)}><Icon name="compare" size={17}/></button></div></div></article> }

function App(){
  const [products, setProducts] = useState(demoProducts);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [chatbot, setChatbot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [cart, setCart] = useState([]); const [compare, setCompare] = useState([]); const [query, setQuery] = useState(''); const [view, setView] = useState('store'); const [chat, setChat] = useState(false); const [toast, setToast] = useState('');

  useEffect(() => {
    loadStoreData()
      .then(data => {
        setProducts((data.products || []).map(mapProduct));
        setCategories(data.categories || []);
        setBrands(data.brands || []);
        setChatbot(data.chatbot || null);
      })
      .catch(err => setLoadError(err.message || 'تعذر تحميل البيانات'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(()=>products.filter(p => `${p.ar} ${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(query.toLowerCase())),[products,query]);
  const add = p => { setCart(c=>[...c,p]); setToast(`تمت إضافة ${p.ar} إلى السلة`); setTimeout(()=>setToast(''),2200) };
  const toggleCompare = p => setCompare(c=>c.some(x=>x.id===p.id)?c.filter(x=>x.id!==p.id):c.length<4?[...c,p]:c);
  if(view==='admin') return <Admin onBack={()=>setView('store')} Logo={Logo} Icon={Icon}/>;
  return <div className="app-shell">
    <div className="service-strip"><span>✓ منتجات أصلية 100%</span><span>▣ توصيل سريع لجميع المحافظات</span><span>◈ دعم فني مميز 24/7</span><span>★ أفضل العلامات العالمية</span></div>
    <header className="site-header"><button className="mobile-menu"><Icon name="menu"/></button><Logo/><nav><a className="active">الرئيسية</a><a onClick={()=>document.getElementById('products').scrollIntoView()}>منتجات البروتين</a><a>الكرياتين</a><a>مكملات الوزن</a><a>الفيتامينات</a><a>الإكسسوارات</a><a>العروض</a><a>العلامات ({brands.length})</a></nav><div className="head-tools"><button><Icon name="heart"/><span>المفضلة</span></button><button><Icon name="user"/><span>حسابي</span></button><button className="cart-tool" onClick={()=>setToast(`لديك ${cart.length} منتجات في السلة`)}><Icon name="cart"/><span>سلة المشتريات</span>{cart.length>0&&<b>{cart.length}</b>}</button></div></header>
    <div className="mobile-search search-box"><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="إبحث عن منتجاتك المفضلة..."/></div>
    <main>
      <section className="hero"><div className="hero-photo"><div className="gym-light"/><div className="athlete-silhouette"/></div><div className="hero-content"><h1>ابنِ أفضل نسخة<br/><span>من نفسك</span></h1><p>مكملات غذائية أصلية 100%<br/>لأداء أقوى ونتائج أكبر</p><div className="hero-actions"><button className="primary" onClick={()=>document.getElementById('products').scrollIntoView()}>تسوق الآن <b>‹</b></button><button className="ghost">اكتشف العروض</button></div></div><div className="hero-products"><ProductArt kind="whey" large/><ProductArt kind="creatine" large/><ProductArt kind="mass" large/></div><div className="hero-dots"><b/><i/><i/></div></section>
      <section className="category-row">{(categories.length ? categories.slice(0,5).map(c=>[c.name_ar||c.name_en,c.description_ar||'تصفح المنتجات','whey']) : cats).map(([name,sub,img])=><button className="category-card" key={name} onClick={()=>setQuery(name)}><ProductArt kind={img}/><div><h3>{name}</h3><p>{sub}</p></div><span>←</span></button>)}</section>
      <section id="comparison" className="compare-panel">
  <div className="section-head"><div><h2>مقارنة المنتجات</h2><p>اختار من المنتجات أدناه وقارن حتى 4 منتجات جنباً إلى جنب</p></div><button className="outline" onClick={()=>setCompare([])}>مسح المقارنة</button></div>
  <div className="compare-picker">
    {products.slice(0,8).map(p=><button key={p.id} className={`compare-pick ${compare.some(x=>x.id===p.id)?'selected':''}`} onClick={()=>toggleCompare(p)}>
      {p.imageUrl?<img src={p.imageUrl} alt={p.ar}/>:<ProductArt kind={p.image}/>}
      <span>{p.ar}</span><b>{compare.some(x=>x.id===p.id)?'✓ محدد':'＋ أضف للمقارنة'}</b>
    </button>)}
  </div>
  {compare.length ? <div className="comparison-table-wrap"><table className="comparison-table"><thead><tr><th>المواصفة</th>{compare.map(p=><th key={p.id}>{p.ar}<button onClick={()=>toggleCompare(p)}>×</button></th>)}</tr></thead><tbody>
    <tr><td>العلامة التجارية</td>{compare.map(p=><td key={p.id}>{p.brand||'-'}</td>)}</tr>
    <tr><td>القسم</td>{compare.map(p=><td key={p.id}>{p.category||'-'}</td>)}</tr>
    <tr><td>السعر</td>{compare.map(p=><td key={p.id}>{p.price>0?`${p.price.toLocaleString('en-US')} د.ع`:'عند الطلب'}</td>)}</tr>
    <tr><td>التقييم</td>{compare.map(p=><td key={p.id}>★ {p.rating||'0.0'}</td>)}</tr>
    <tr><td>الحالة</td>{compare.map(p=><td key={p.id}>{p.stock>0?'متوفر':'تأكيد التوفر'}</td>)}</tr>
  </tbody></table></div> : <div className="compare-empty"><Icon name="compare" size={34}/><b>اختار منتجين أو أكثر حتى تظهر المقارنة التفصيلية هنا</b></div>}
</section>
      <section id="products" className="products-section"><div className="section-head"><div><h2>المنتجات</h2><p>مرتبطة مباشرة بقاعدة بيانات Supabase</p></div><span className="live-pill">LIVE DATA</span></div>{loading?<div className="store-state">جاري تحميل المنتجات...</div>:loadError?<div className="store-state error">تعذر تحميل البيانات: {loadError}</div>:filtered.length===0?<div className="store-state"><b>ماكو منتجات مضافة حالياً.</b><span>أضف المنتجات من لوحة الإدارة حتى تظهر هنا مباشرة.</span></div>:<div className="products-grid">{filtered.map(p=><ProductCard key={p.id} p={p} onAdd={add} onCompare={toggleCompare} compared={compare.some(x=>x.id===p.id)}/>)}</div>}</section>
      <section className="offer-band"><div><h2>عروض خاصة</h2><p>أفضل الأسعار على منتجات مختارة لفترة محدودة</p></div><button className="primary">عرض جميع العروض</button><div className="offer-mini"><ProductArt kind="creatine"/><span>خصم 15%</span></div><div className="offer-mini"><ProductArt kind="mass"/><span>خصم 18%</span></div><div className="offer-mini"><ProductArt kind="vitamins"/><span>خصم 20%</span></div></section>
      <section className="why"><h2>لماذا كاربون جروب؟</h2><div><article><b>✓</b><strong>منتجات أصلية</strong><span>جودة موثوقة 100%</span></article><article><b>↗</b><strong>توصيل سريع</strong><span>إلى جميع المحافظات</span></article><article><b>✦</b><strong>دعم متخصص</strong><span>نساعدك في اختيارك</span></article><article><b>★</b><strong>أفضل العلامات</strong><span>عالمية ومحلية</span></article></div></section>
    </main>
    <footer><Logo/><span>CARBON GROUP NUTRITION — مكملاتك، قوتك، إنجازك.</span><button className="admin-link" onClick={()=>setView('admin')}>لوحة الإدارة</button></footer>
    <button className="chat-fab" onClick={()=>setChat(!chat)}><img src={chatbot?.avatar_url || `${import.meta.env.BASE_URL}assets/carbon-robot.webp`} alt="Carbon AI"/><span>{chatbot?.assistant_name_ar || 'مساعد كاربون الذكي'}</span></button>
    {chat&&<div className="chat-window"><div className="chat-head"><img src={chatbot?.avatar_url || `${import.meta.env.BASE_URL}assets/carbon-robot.webp`}/><div><b>{chatbot?.assistant_name_ar || 'مساعد كاربون الذكي'}</b><span>متصل ببيانات المتجر</span></div><button onClick={()=>setChat(false)}>×</button></div><div className="chat-body"><p className="bot">{chatbot?.welcome_message_ar || 'أهلاً بك! كيف أساعدك في اختيار مكملك اليوم؟'}</p><div className="quick"><button>أريد بروتين</button><button>قارن لي كرياتين</button><button>عروض اليوم</button></div></div><div className="chat-input">إكتب رسالتك... <span>➤</span></div></div>}
    <nav className="bottom-nav"><button className="active"><Icon name="grid"/><span>الرئيسية</span></button><button><Icon name="grid"/><span>الأقسام</span></button><button onClick={()=>document.getElementById('comparison')?.scrollIntoView({behavior:'smooth'})}><Icon name="compare"/><span>المقارنة</span>{compare.length>0&&<b>{compare.length}</b>}</button><button onClick={()=>setToast(`${cart.length} منتجات في السلة`)}><Icon name="cart"/><span>السلة</span>{cart.length>0&&<b>{cart.length}</b>}</button><button><Icon name="user"/><span>حسابي</span></button></nav>
    {toast&&<div className="toast">✓ {toast}</div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App/>);

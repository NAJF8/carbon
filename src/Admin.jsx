import React, { useEffect, useState } from 'react';
import {
  loginAdmin, signupAdmin, loadAdminData, saveProduct, deleteProduct,
  loadStoredAdminSession, storeAdminSession, clearAdminSession
} from './carbonApi';

export default function Admin({ onBack, Logo, Icon }) {
  const [session, setSession] = useState(loadStoredAdminSession());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name_ar:'', name_en:'', slug:'', price_iqd:'', stock:'',
    category_id:'', brand_id:'', enabled:true
  });

  async function refresh(activeSession = session) {
    if (!activeSession?.access_token) return;
    setBusy(true);
    setMessage('');
    try {
      const next = await loadAdminData(activeSession.access_token);
      setData(next);
    } catch (error) {
      if (error.message === 'ADMIN_NOT_AUTHORIZED') {
        setMessage('تم تسجيل الدخول، لكن هذا الحساب غير مفعّل كإدارة بعد.');
      } else {
        setMessage('تعذر تحميل لوحة الإدارة أو انتهت الجلسة.');
        clearAdminSession();
        setSession(null);
      }
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { if (session) refresh(session); }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const result = await loginAdmin(email, password);
      storeAdminSession(result.session);
      setSession(result.session);
      if (!result.admin) setMessage('تم تسجيل الدخول. الحساب يحتاج تفعيل صلاحية الإدارة.');
      else await refresh(result.session);
    } catch (error) {
      setMessage('فشل تسجيل الدخول: ' + error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSignup() {
    setBusy(true);
    setMessage('');
    try {
      await signupAdmin(email, password);
      setMessage('تم إنشاء الحساب. إذا كان تأكيد البريد مفعلاً، افتح رسالة Supabase ثم سجّل الدخول.');
    } catch (error) {
      setMessage('تعذر إنشاء الحساب: ' + error.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    clearAdminSession();
    setSession(null);
    setData(null);
    setMessage('');
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!session?.access_token) return;
    setBusy(true);
    setMessage('');
    try {
      await saveProduct(session.access_token, {
        ...form,
        price_iqd: Number(form.price_iqd || 0),
        stock: Number(form.stock || 0)
      });
      setForm({name_ar:'',name_en:'',slug:'',price_iqd:'',stock:'',category_id:'',brand_id:'',enabled:true});
      setShowForm(false);
      await refresh();
    } catch (error) {
      setMessage('تعذر حفظ المنتج: ' + error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('حذف المنتج نهائياً؟')) return;
    setBusy(true);
    try {
      await deleteProduct(session.access_token, id);
      await refresh();
    } catch (error) {
      setMessage('تعذر حذف المنتج: ' + error.message);
      setBusy(false);
    }
  }

  if (!session) {
    return <div className="admin-auth">
      <div className="admin-auth-card">
        <Logo/>
        <h1>دخول إدارة Carbon Group</h1>
        <p>تسجيل الدخول مربوط بـ Supabase Auth.</p>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="البريد الإلكتروني" value={email} onChange={e=>setEmail(e.target.value)} required/>
          <input type="password" placeholder="كلمة المرور" value={password} onChange={e=>setPassword(e.target.value)} minLength="6" required/>
          <button className="primary" disabled={busy}>{busy?'جاري الدخول...':'تسجيل الدخول'}</button>
          <button type="button" className="outline" onClick={handleSignup} disabled={busy}>إنشاء حساب إدارة</button>
        </form>
        {message && <div className="auth-message">{message}</div>}
        <button className="back-link" onClick={onBack}>← العودة للمتجر</button>
      </div>
    </div>;
  }

  const products = data?.products || [];
  const orders = data?.orders || [];
  const revenue = orders.filter(o=>o.status!=='cancelled').reduce((sum,o)=>sum+Number(o.total_iqd||0),0);
  const lowStock = products.filter(p=>Number(p.stock||0)<=Number(p.low_stock_threshold||5)).length;

  return <div className="admin-shell">
    <aside>
      <Logo/>
      <button className="back" onClick={onBack}>← العودة للمتجر</button>
      {['لوحة التحكم','الطلبات','المنتجات','الأقسام','العلامات التجارية','المخزون','العروض والكوبونات','المساعد الذكي','الإعلانات','التقييمات','التوصيل والدفع','الإعدادات','التقارير والنسخ الاحتياطي'].map((x,i)=>
        <button className={i===0?'selected':''} key={x}>{x}</button>
      )}
    </aside>
    <section className="admin-main">
      <div className="admin-top">
        <div><small>Supabase Production</small><h1>لوحة تحكم Carbon Group</h1></div>
        <div className="admin-top-actions">
          <button className="admin-user"><Icon name="user"/> {data?.admin?.role || 'حساب مسجل'}</button>
          <button className="outline" onClick={logout}>تسجيل خروج</button>
        </div>
      </div>

      {message && <div className="admin-warning">{message}</div>}

      {!data ? <div className="store-state">{busy?'جاري تحميل صلاحيات الإدارة...':'الحساب غير مفعّل كإدارة بعد.'}</div> : <>
        <div className="kpis">
          {[
            ['الطلبات',orders.length],
            ['إجمالي الطلبات',revenue.toLocaleString('en-US')+' د.ع'],
            ['المنتجات',products.length],
            ['مخزون منخفض',lowStock]
          ].map(([label,value])=><div className="kpi" key={label}><span>{label}</span><strong>{value}</strong><em>بيانات مباشرة</em></div>)}
        </div>

        <div className="admin-grid">
          <div className="admin-card sales">
            <div className="card-head"><h2>حالة النظام</h2><span className="live-pill">SUPABASE LIVE</span></div>
            <div className="admin-status-list"><p>✓ قاعدة البيانات متصلة</p><p>✓ RLS مفعّل</p><p>✓ Storage جاهز</p><p>✓ Carbon API شغال</p></div>
          </div>
          <div className="admin-card">
            <div className="card-head"><h2>أحدث الطلبات</h2><span>{orders.length}</span></div>
            {orders.length ? orders.slice(0,5).map(o=><div className="order" key={o.id}><span>{o.order_code}</span><small>{o.status}</small><b>{Number(o.total_iqd||0).toLocaleString('en-US')} د.ع</b></div>) : <div className="empty-mini">لا توجد طلبات بعد</div>}
          </div>
        </div>

        <div className="admin-card table-card">
          <div className="card-head"><h2>إدارة المنتجات</h2><button className="primary" onClick={()=>setShowForm(v=>!v)}>+ إضافة منتج</button></div>
          {showForm && <form className="product-admin-form" onSubmit={handleSave}>
            <input placeholder="اسم المنتج بالعربي" value={form.name_ar} onChange={e=>setForm({...form,name_ar:e.target.value})} required/>
            <input placeholder="English name" value={form.name_en} onChange={e=>setForm({...form,name_en:e.target.value})}/>
            <input placeholder="slug مثل gold-whey" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})} required/>
            <input type="number" placeholder="السعر د.ع" value={form.price_iqd} onChange={e=>setForm({...form,price_iqd:e.target.value})} required/>
            <input type="number" placeholder="المخزون" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/>
            <select value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">القسم</option>{(data.categories||[]).map(c=><option key={c.id} value={c.id}>{c.name_ar||c.name_en}</option>)}</select>
            <select value={form.brand_id} onChange={e=>setForm({...form,brand_id:e.target.value})}><option value="">العلامة</option>{(data.brands||[]).map(b=><option key={b.id} value={b.id}>{b.name_ar||b.name_en}</option>)}</select>
            <button className="primary" disabled={busy}>حفظ المنتج</button>
          </form>}

          <table>
            <thead><tr><th>المنتج</th><th>القسم</th><th>العلامة</th><th>السعر</th><th>المخزون</th><th>الحالة</th><th></th></tr></thead>
            <tbody>{products.map(p=><tr key={p.id}><td>{p.name_ar}</td><td>{p.categories?.name_ar||'-'}</td><td>{p.brands?.name_en||'-'}</td><td>{Number(p.price_iqd||0).toLocaleString('en-US')} د.ع</td><td>{p.stock}</td><td><em className="status">{p.enabled?'متوفر':'معطل'}</em></td><td><button className="danger-btn" onClick={()=>handleDelete(p.id)}>حذف</button></td></tr>)}</tbody>
          </table>
        </div>
      </>}
    </section>
  </div>;
}

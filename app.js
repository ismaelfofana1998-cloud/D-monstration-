const STORAGE_KEY = 'd-pay-demo-v2';
const DEMO_PIN = '1234';

const initialState = () => ({
  user: { name: 'Awa Koné', phone: '+225 07 08 09 10 11' },
  balance: 78500,
  assisted: true,
  transactions: [
    { id: id(), type: 'receive', title: 'Mariam', amount: 15000, createdAt: Date.now() - 1000 * 60 * 42 },
    { id: id(), type: 'merchant', title: 'Boutique du quartier', amount: -3500, createdAt: Date.now() - 1000 * 60 * 60 * 5 },
    { id: id(), type: 'send', title: 'Yao', amount: -10000, fee: 100, createdAt: Date.now() - 1000 * 60 * 60 * 24 }
  ]
});

let state = loadState();
let currentRoute = 'home';
const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const modalContent = document.querySelector('#modalContent');
const helpButton = document.querySelector('#helpButton');
const navItems = [...document.querySelectorAll('.nav-item')];

function id() {
  return globalThis.crypto?.randomUUID?.() || `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.balance === 'number' && Array.isArray(saved.transactions)) {
      return { ...initialState(), ...saved, user: { ...initialState().user, ...(saved.user || {}) } };
    }
  } catch (_) {}
  const fresh = initialState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function money(value) { return new Intl.NumberFormat('fr-FR').format(Math.abs(Math.round(value))); }
function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}
function formatDate(timestamp) {
  const d = new Date(timestamp);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return `Aujourd’hui · ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}
function speak(text, force = false) {
  if ((!state.assisted && !force) || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  u.rate = 0.92;
  speechSynthesis.speak(u);
}
function buzz(pattern = 35) { if ('vibrate' in navigator) navigator.vibrate(pattern); }
function toast(message) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2300);
}

function navigate(route) {
  currentRoute = route;
  const navRoute = ['home','history','receive','profile'].includes(route) ? route : 'home';
  navItems.forEach(item => item.classList.toggle('active', item.dataset.route === navRoute));
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function render() {
  ({ home: renderHome, send: renderSend, pay: renderPay, deposit: renderDeposit, receive: renderReceive, history: renderHistory, profile: renderProfile }[currentRoute] || renderHome)();
}
function demoBanner() { return `<div class="demo-banner"><strong>DÉMO</strong> · Aucun argent réel.</div>`; }
function voiceButton() {
  return `<button class="voice-pill ${state.assisted ? 'on' : ''}" id="voiceToggle" type="button" aria-pressed="${state.assisted}"><span aria-hidden="true">🔊</span><span>${state.assisted ? 'Voix activée' : 'Voix désactivée'}</span></button>`;
}
function bindVoice() {
  document.querySelector('#voiceToggle')?.addEventListener('click', () => {
    state.assisted = !state.assisted;
    saveState(); render();
    if (state.assisted) speak('Aide vocale activée.', true);
  });
}
function action(route, icon, label) {
  return `<button class="action-button" data-go="${route}" type="button" aria-label="${label}"><span class="action-circle" aria-hidden="true">${icon}</span><span>${label}</span></button>`;
}
function bindGo() {
  document.querySelectorAll('[data-go]').forEach(btn => btn.addEventListener('click', () => { buzz(); navigate(btn.dataset.go); }));
}

function renderHome() {
  const recent = [...state.transactions].sort((a,b) => b.createdAt - a.createdAt).slice(0, 4);
  app.innerHTML = `
    ${demoBanner()}
    ${voiceButton()}
    <section class="balance-card" aria-label="Solde disponible">
      <p class="balance-label">Mon argent</p>
      <h2 class="balance">${money(state.balance)} <small>F CFA</small></h2>
    </section>
    <section class="quick-actions big-actions" aria-label="Actions principales">
      ${action('send','↑','Envoyer')}
      ${action('pay','▦','Payer')}
      ${action('deposit','＋','Ajouter')}
      ${action('receive','↓','Recevoir')}
    </section>
    <div class="section-heading"><h2>Activité</h2><button class="text-button" data-go="history" type="button">Tout voir</button></div>
    ${transactionsMarkup(recent)}
  `;
  bindVoice(); bindGo();
}

function transactionsMarkup(items) {
  if (!items.length) return `<div class="card empty-state">Aucune opération.</div>`;
  const icons = { send: '↑', receive: '↓', merchant: '▦', deposit: '+', fee: 'ƒ' };
  return `<section class="transaction-list">${items.map(tx => `
    <article class="transaction-row">
      <div class="transaction-icon" aria-hidden="true">${icons[tx.type] || '•'}</div>
      <div class="transaction-main"><strong class="transaction-title">${escapeHTML(tx.title)}</strong><span class="transaction-meta">${formatDate(tx.createdAt)}</span></div>
      <strong class="transaction-amount ${tx.amount > 0 ? 'positive' : 'negative'}">${tx.amount > 0 ? '+' : '−'}${money(tx.amount)}</strong>
    </article>`).join('')}</section>`;
}

function back() { return `<button class="back-button" data-go="home" type="button">← Accueil</button>`; }
function amountButtons(values) { return `<div class="amount-chips">${values.map(v => `<button type="button" data-amount="${v}">${money(v)} F</button>`).join('')}</div>`; }
function bindAmounts(selector) {
  const input = document.querySelector(selector);
  document.querySelectorAll('[data-amount]').forEach(btn => btn.addEventListener('click', () => {
    input.value = btn.dataset.amount; buzz(20); speak(`${btn.dataset.amount} francs`); input.focus();
  }));
}
function stepHead(icon, title, subtitle) {
  return `<div class="step-hero"><div class="step-icon" aria-hidden="true">${icon}</div><div><h2 class="page-title">${title}</h2><p class="page-subtitle">${subtitle}</p></div></div>`;
}

function renderSend() {
  app.innerHTML = `${back()}${stepHead('↑','Envoyer','Numéro. Montant. Confirmer.')}
    <form id="sendForm" class="form-stack">
      <div class="field"><label for="recipient">Numéro</label><input id="recipient" name="recipient" inputmode="tel" autocomplete="tel" placeholder="07 00 00 00 00" required /></div>
      <div class="field"><label for="sendAmount">Combien ?</label><div class="money-field"><input id="sendAmount" class="amount-input" name="amount" inputmode="numeric" pattern="[0-9]*" placeholder="0" required /><span>F</span></div></div>
      ${amountButtons([1000,2000,5000,10000])}
      <button class="primary-button" type="submit">Continuer →</button>
    </form>`;
  bindGo(); bindAmounts('#sendAmount');
  speak('Envoyer. Entrez le numéro, puis le montant.');
  document.querySelector('#sendForm').addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const recipient = String(f.get('recipient') || '').replace(/\D/g,'');
    const amount = Number(String(f.get('amount') || '').replace(/\D/g,''));
    const fee = Math.max(1, Math.round(amount * 0.01));
    if (recipient.length < 8) return toast('Numéro trop court');
    if (!validAmount(amount)) return toast('Montant invalide');
    if (amount + fee > state.balance) return toast('Solde insuffisant');
    confirmBox('Envoyer maintenant ?', `Vous allez envoyer ${amount} francs.`, [['À', spacedPhone(recipient)],['Montant',`${money(amount)} F`],['Frais démo',`${money(fee)} F`],['Total',`${money(amount+fee)} F`]], 'Envoyer', () => pin(() => {
      state.balance -= amount + fee;
      addTx('send', spacedPhone(recipient), -amount, fee);
      success('Argent envoyé', `${money(amount)} F`, '↑');
    }));
  });
}

function renderPay() {
  app.innerHTML = `${back()}${stepHead('▦','Payer','Marchand. Montant. Confirmer.')}
    <form id="payForm" class="form-stack">
      <div class="field"><label for="merchant">Marchand</label><input id="merchant" name="merchant" placeholder="Boutique Awa" required /></div>
      <div class="field"><label for="payAmount">Combien ?</label><div class="money-field"><input id="payAmount" class="amount-input" name="amount" inputmode="numeric" pattern="[0-9]*" placeholder="0" required /><span>F</span></div></div>
      ${amountButtons([500,1000,2500,5000])}
      <button class="primary-button" type="submit">Continuer →</button>
    </form>`;
  bindGo(); bindAmounts('#payAmount'); speak('Payer. Entrez le marchand, puis le montant.');
  document.querySelector('#payForm').addEventListener('submit', e => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    const merchant = String(f.get('merchant') || '').trim();
    const amount = Number(String(f.get('amount') || '').replace(/\D/g,''));
    if (!merchant || !validAmount(amount)) return toast('Vérifiez les informations');
    if (amount > state.balance) return toast('Solde insuffisant');
    confirmBox('Payer maintenant ?', `Vous allez payer ${amount} francs à ${merchant}.`, [['Marchand',merchant],['Montant',`${money(amount)} F`],['Frais','0 F']], 'Payer', () => pin(() => {
      state.balance -= amount; addTx('merchant', merchant, -amount); success('Paiement réussi', `${money(amount)} F`, '✓');
    }));
  });
}

function renderDeposit() {
  app.innerHTML = `${back()}${stepHead('＋','Ajouter','Choisissez seulement le montant.')}${demoBanner()}
    <form id="depositForm" class="form-stack">
      <div class="field"><label for="depositAmount">Combien ?</label><div class="money-field"><input id="depositAmount" class="amount-input" name="amount" inputmode="numeric" pattern="[0-9]*" placeholder="0" required /><span>F</span></div></div>
      ${amountButtons([5000,10000,25000,50000])}
      <button class="primary-button" type="submit">Ajouter →</button>
    </form>`;
  bindGo(); bindAmounts('#depositAmount'); speak('Ajouter de l’argent. Choisissez le montant.');
  document.querySelector('#depositForm').addEventListener('submit', e => {
    e.preventDefault(); const amount = Number(String(new FormData(e.currentTarget).get('amount') || '').replace(/\D/g,''));
    if (!validAmount(amount)) return toast('Montant invalide');
    confirmBox('Ajouter cet argent ?', `Ajouter ${amount} francs au portefeuille de démonstration.`, [['Montant',`${money(amount)} F`],['Frais','0 F']], 'Ajouter', () => pin(() => {
      state.balance += amount; addTx('deposit','Dépôt démo',amount); success('Argent ajouté',`${money(amount)} F`,'+');
    }));
  });
}

function renderReceive() {
  app.innerHTML = `<h2 class="page-title">Recevoir</h2><p class="page-subtitle">Montrez simplement cet écran.</p>
    <div class="qr-wrap"><div id="qrDemo" class="qr-demo" role="img" aria-label="QR de démonstration"></div><div class="qr-caption">${escapeHTML(state.user.name)}</div></div>
    <div class="receive-phone">${escapeHTML(state.user.phone)}</div>
    <button class="secondary-button" id="sayNumber" type="button">🔊 Écouter mon numéro</button>
    <p class="hint center receive-hint">QR visuel de démonstration. Aucun paiement réel.</p>`;
  buildQr();
  document.querySelector('#sayNumber').addEventListener('click', () => speak(`Mon numéro est ${state.user.phone}.`, true));
}
function buildQr() {
  const target = document.querySelector('#qrDemo'); let seed = [...state.user.phone].reduce((a,c)=>a+c.charCodeAt(0),0);
  for (let y=0;y<13;y++) for (let x=0;x<13;x++) {
    const cell=document.createElement('i');
    const finder=(x<4&&y<4)||(x>8&&y<4)||(x<4&&y>8);
    if (finder || ((x*7+y*11+seed)%5)<2) cell.className='on'; target.appendChild(cell);
  }
}
function renderHistory() {
  const sorted=[...state.transactions].sort((a,b)=>b.createdAt-a.createdAt);
  app.innerHTML=`<h2 class="page-title">Activité</h2><p class="page-subtitle">Entrées et sorties.</p>${transactionsMarkup(sorted)}`;
}
function renderProfile() {
  app.innerHTML=`<h2 class="page-title">Mon compte</h2>
    <section class="card"><div class="profile-head"><div class="avatar">AK</div><div><h2>${escapeHTML(state.user.name)}</h2><p>${escapeHTML(state.user.phone)}</p></div></div></section>
    <section class="list-menu">
      <button class="menu-row" id="voiceSetting" type="button"><span><strong>🔊 Aide vocale</strong><small>Lecture des étapes.</small></span><strong>${state.assisted?'ON':'OFF'}</strong></button>
      <button class="menu-row" id="voiceTest" type="button"><span><strong>▶ Écouter</strong><small>Tester la voix.</small></span><span>›</span></button>
    </section>
    <div class="button-row"><button class="danger-button" id="resetDemo" type="button">Recommencer la démo</button></div>`;
  document.querySelector('#voiceSetting').addEventListener('click',()=>{state.assisted=!state.assisted;saveState();renderProfile();if(state.assisted)speak('Aide vocale activée.',true);});
  document.querySelector('#voiceTest').addEventListener('click',()=>speak('Bonjour. Je peux vous guider pour envoyer ou recevoir de l’argent.',true));
  document.querySelector('#resetDemo').addEventListener('click',()=>confirmBox('Recommencer ?', 'Remettre la démonstration au début.', [['Solde','Réinitialisé'],['Activité','Réinitialisée']], 'Oui', ()=>{state=initialState();saveState();closeModal();navigate('home');toast('Démo réinitialisée');}));
}

function validAmount(v) { return Number.isFinite(v) && v > 0 && v <= 10000000; }
function spacedPhone(v) { return String(v).replace(/(\d{2})(?=\d)/g,'$1 ').trim(); }
function addTx(type,title,amount,fee=0) { state.transactions.unshift({id:id(),type,title,amount,fee,createdAt:Date.now()}); saveState(); }

function openModal(html) { modalContent.innerHTML=html; if(typeof modal.showModal==='function') modal.showModal(); else modal.setAttribute('open',''); }
function closeModal() { if(modal.open&&typeof modal.close==='function') modal.close(); else modal.removeAttribute('open'); }
function bindClose() { document.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',closeModal)); }
function confirmBox(title, spoken, rows, actionLabel, onConfirm) {
  speak(spoken);
  openModal(`<div class="modal-inner"><div class="modal-symbol" aria-hidden="true">?</div><h2>${escapeHTML(title)}</h2><div class="summary-box">${rows.map(([a,b])=>`<div class="summary-line"><span>${escapeHTML(a)}</span><strong>${escapeHTML(b)}</strong></div>`).join('')}</div><button class="primary-button" id="confirmAction" type="button">${escapeHTML(actionLabel)}</button><button class="secondary-button modal-second" data-close-modal type="button">Annuler</button></div>`);
  document.querySelector('#confirmAction').addEventListener('click',()=>{closeModal();onConfirm();}); bindClose();
}
function pin(onSuccess) {
  let value='';
  openModal(`<div class="modal-inner center"><div class="lock-symbol" aria-hidden="true">●</div><h2>Code secret</h2><p>4 chiffres.</p><div class="pin-dots"><i></i><i></i><i></i><i></i></div><div class="number-pad">${[1,2,3,4,5,6,7,8,9].map(n=>`<button type="button" data-digit="${n}">${n}</button>`).join('')}<button type="button" data-close-modal>×</button><button type="button" data-digit="0">0</button><button type="button" id="erasePin">⌫</button></div><p class="pin-demo-hint">Démo : <strong>1234</strong></p></div>`);
  const dots=[...document.querySelectorAll('.pin-dots i')]; const update=()=>dots.forEach((d,i)=>d.classList.toggle('filled',i<value.length));
  document.querySelectorAll('[data-digit]').forEach(btn=>btn.addEventListener('click',()=>{if(value.length>=4)return;value+=btn.dataset.digit;buzz(20);update();if(value.length===4)setTimeout(()=>{if(value===DEMO_PIN){closeModal();buzz([40,40,80]);onSuccess();}else{value='';update();buzz([100,60,100]);toast('Code incorrect');speak('Code incorrect. Recommencez.');}},180);}));
  document.querySelector('#erasePin').addEventListener('click',()=>{value=value.slice(0,-1);update();}); bindClose();
  speak('Entrez votre code secret. Pour la démonstration, un, deux, trois, quatre.');
}
function success(title, amount, symbol) {
  speak(`${title}. ${amount}.`);
  app.innerHTML=`<section class="success-screen center"><div class="success-mark">${symbol}</div><h2 class="page-title">${escapeHTML(title)}</h2><p class="success-amount">${escapeHTML(amount)}</p><p class="page-subtitle">Terminé.</p><button class="primary-button" data-go="home" type="button">Accueil</button></section>`; bindGo();
}

navItems.forEach(btn=>btn.addEventListener('click',()=>navigate(btn.dataset.route)));
helpButton.addEventListener('click',()=>{
  openModal(`<div class="modal-inner"><div class="modal-symbol" aria-hidden="true">?</div><h2>Que faire ?</h2><div class="visual-help"><div><span>↑</span><strong>Envoyer</strong></div><div><span>▦</span><strong>Payer</strong></div><div><span>＋</span><strong>Ajouter</strong></div><div><span>↓</span><strong>Recevoir</strong></div></div><button class="primary-button" id="playHelp" type="button">🔊 Écouter</button><button class="secondary-button modal-second" data-close-modal type="button">Fermer</button></div>`);
  document.querySelector('#playHelp').addEventListener('click',()=>speak('Flèche vers le haut pour envoyer. Carré pour payer. Plus pour ajouter de l’argent. Flèche vers le bas pour recevoir.',true)); bindClose();
});
if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
render();
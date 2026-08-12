const STORAGE_KEY = 'dpay-demo-v1';
const DEMO_PIN = '1234';

const initialState = () => ({
  user: {
    name: 'Amadou Kouassi',
    phone: '+225 07 00 11 22 33',
    country: 'Côte d’Ivoire',
  },
  balance: 48500,
  transactions: [
    { id: cryptoId(), type: 'receive', title: 'Fatou Traoré', amount: 15000, createdAt: Date.now() - 1000 * 60 * 48 },
    { id: cryptoId(), type: 'merchant', title: 'Boutique Chez Awa', amount: -3500, createdAt: Date.now() - 1000 * 60 * 60 * 5 },
    { id: cryptoId(), type: 'send', title: 'Yannick Koffi', amount: -10000, createdAt: Date.now() - 1000 * 60 * 60 * 28 },
    { id: cryptoId(), type: 'deposit', title: 'Dépôt agent', amount: 25000, createdAt: Date.now() - 1000 * 60 * 60 * 51 },
  ],
});

let state = loadState();
let currentRoute = 'home';

const app = document.querySelector('#app');
const modal = document.querySelector('#modal');
const modalContent = document.querySelector('#modalContent');

function cryptoId() {
  return globalThis.crypto?.randomUUID?.() || `tx-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved.balance === 'number' && Array.isArray(saved.transactions)) return saved;
  } catch (_) {}
  const fresh = initialState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  return fresh;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function money(value) {
  return new Intl.NumberFormat('fr-FR').format(Math.round(value));
}

function formatDate(timestamp) {
  const d = new Date(timestamp);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return `Aujourd’hui, ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function navigate(route) {
  currentRoute = route;
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.toggle('active', item.dataset.route === route));
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function render() {
  const routes = {
    home: renderHome,
    history: renderHistory,
    receive: renderReceive,
    profile: renderProfile,
    send: renderSend,
    pay: renderPay,
    deposit: renderDeposit,
  };
  (routes[currentRoute] || renderHome)();
}

function demoBanner() {
  return `<div class="demo-banner"><strong>Mode démo.</strong> Les montants sont fictifs et restent uniquement dans ce navigateur.</div>`;
}

function renderHome() {
  const recent = [...state.transactions].sort((a,b) => b.createdAt - a.createdAt).slice(0, 4);
  app.innerHTML = `
    ${demoBanner()}
    <section class="balance-card">
      <p class="balance-label">Mon solde disponible</p>
      <h2 class="balance">${money(state.balance)} <small>FCFA</small></h2>
      <div class="balance-foot"><span>${escapeHTML(state.user.phone)}</span><span>Compte démo</span></div>
    </section>

    <section class="quick-actions" aria-label="Actions rapides">
      ${actionButton('send', '↑', 'Envoyer')}
      ${actionButton('pay', '▦', 'Payer')}
      ${actionButton('receive', '↓', 'Recevoir')}
      ${actionButton('deposit', '+', 'Déposer')}
    </section>

    <div class="section-heading">
      <h2>Dernières opérations</h2>
      <button class="text-button" data-go="history" type="button">Tout voir</button>
    </div>
    ${transactionsMarkup(recent)}
  `;
  bindGoButtons();
}

function actionButton(route, icon, label) {
  return `<button class="action-button" data-go="${route}" type="button"><span class="action-circle">${icon}</span><span>${label}</span></button>`;
}

function transactionsMarkup(items) {
  if (!items.length) return `<div class="card empty-state">Aucune opération pour le moment.</div>`;
  return `<section class="transaction-list">${items.map(transactionMarkup).join('')}</section>`;
}

function transactionMarkup(tx) {
  const incoming = tx.amount > 0;
  const icons = { send: '↑', receive: '↓', merchant: '▦', deposit: '+', fee: 'ƒ' };
  return `
    <article class="transaction-row">
      <div class="transaction-icon">${icons[tx.type] || '•'}</div>
      <div class="transaction-main">
        <strong class="transaction-title">${escapeHTML(tx.title)}</strong>
        <span class="transaction-meta">${formatDate(tx.createdAt)}</span>
      </div>
      <strong class="transaction-amount ${incoming ? 'positive' : 'negative'}">${incoming ? '+' : '−'}${money(Math.abs(tx.amount))}</strong>
    </article>`;
}

function renderHistory() {
  const sorted = [...state.transactions].sort((a,b) => b.createdAt - a.createdAt);
  app.innerHTML = `
    <h2 class="page-title">Activité</h2>
    <p class="page-subtitle">Tout ce qui entre et sort du portefeuille est visible ici.</p>
    ${transactionsMarkup(sorted)}
  `;
}

function renderSend() {
  app.innerHTML = `
    <h2 class="page-title">Envoyer de l’argent</h2>
    <p class="page-subtitle">Entre le numéro de la personne, puis le montant. Tu vérifieras tout avant l’envoi.</p>
    <form id="sendForm" class="form-stack">
      <div class="field">
        <label for="recipient">Numéro du bénéficiaire</label>
        <input id="recipient" name="recipient" inputmode="tel" autocomplete="tel" placeholder="Ex. 07 01 02 03 04" required />
      </div>
      <div class="field">
        <label for="sendAmount">Montant</label>
        <input id="sendAmount" class="amount-input" name="amount" type="number" min="100" step="50" inputmode="numeric" placeholder="0" required />
        <p class="hint">Frais de démonstration : 1 % du montant. Solde : ${money(state.balance)} FCFA.</p>
      </div>
      <button class="primary-button" type="submit">Continuer</button>
      <button class="secondary-button" data-go="home" type="button">Annuler</button>
    </form>`;

  bindGoButtons();
  document.querySelector('#sendForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const recipient = form.get('recipient').trim();
    const amount = Number(form.get('amount'));
    const fee = Math.ceil(amount * 0.01);
    const total = amount + fee;

    if (!recipient || !Number.isFinite(amount) || amount < 100) return toast('Vérifie le numéro et le montant.');
    if (total > state.balance) return toast('Solde insuffisant pour ce transfert et ses frais.');

    showConfirmation({
      title: 'Confirmer l’envoi',
      rows: [['À', recipient], ['Montant', `${money(amount)} FCFA`], ['Frais', `${money(fee)} FCFA`], ['Total débité', `${money(total)} FCFA`]],
      onConfirm: () => authorizePin(() => {
        state.balance -= total;
        addTransaction('send', recipient, -amount);
        if (fee) addTransaction('fee', 'Frais de transfert', -fee);
        saveState();
        renderSuccess('Argent envoyé', `${money(amount)} FCFA ont été envoyés à ${recipient}.`);
      })
    });
  });
}

function renderPay() {
  const merchants = ['Boutique Chez Awa', 'Maquis Ivoire', 'Pharmacie du Marché', 'Supermarché Démo'];
  app.innerHTML = `
    <h2 class="page-title">Payer un marchand</h2>
    <p class="page-subtitle">Dans une vraie application, tu pourrais scanner le QR du marchand. Ici, choisis-en un pour tester.</p>
    <div class="hero-icon">▦</div>
    <form id="payForm" class="form-stack">
      <div class="field">
        <label for="merchant">Marchand</label>
        <select id="merchant" name="merchant" required>${merchants.map(m => `<option>${m}</option>`).join('')}</select>
      </div>
      <div class="field">
        <label for="payAmount">Montant à payer</label>
        <input id="payAmount" class="amount-input" name="amount" type="number" min="100" step="50" inputmode="numeric" placeholder="0" required />
        <p class="hint">Aucun frais marchand dans cette démonstration.</p>
      </div>
      <button class="primary-button" type="submit">Continuer</button>
      <button class="secondary-button" data-go="home" type="button">Annuler</button>
    </form>`;

  bindGoButtons();
  document.querySelector('#payForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const merchant = form.get('merchant');
    const amount = Number(form.get('amount'));
    if (!Number.isFinite(amount) || amount < 100) return toast('Entre un montant valide.');
    if (amount > state.balance) return toast('Solde insuffisant.');

    showConfirmation({
      title: 'Confirmer le paiement',
      rows: [['Marchand', merchant], ['Montant', `${money(amount)} FCFA`], ['Frais', '0 FCFA']],
      onConfirm: () => authorizePin(() => {
        state.balance -= amount;
        addTransaction('merchant', merchant, -amount);
        saveState();
        renderSuccess('Paiement réussi', `${money(amount)} FCFA ont été payés à ${merchant}.`);
      })
    });
  });
}

function renderDeposit() {
  app.innerHTML = `
    <h2 class="page-title">Déposer de l’argent</h2>
    <p class="page-subtitle">Simulation d’un dépôt chez un agent. Aucun argent réel n’est encaissé.</p>
    ${demoBanner()}
    <form id="depositForm" class="form-stack">
      <div class="field">
        <label for="depositAmount">Montant du dépôt fictif</label>
        <input id="depositAmount" class="amount-input" name="amount" type="number" min="100" step="50" inputmode="numeric" placeholder="0" required />
      </div>
      <button class="primary-button" type="submit">Simuler le dépôt</button>
      <button class="secondary-button" data-go="home" type="button">Annuler</button>
    </form>`;

  bindGoButtons();
  document.querySelector('#depositForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const amount = Number(new FormData(event.currentTarget).get('amount'));
    if (!Number.isFinite(amount) || amount < 100) return toast('Entre un montant valide.');
    state.balance += amount;
    addTransaction('deposit', 'Dépôt agent — simulation', amount);
    saveState();
    renderSuccess('Dépôt simulé', `${money(amount)} FCFA fictifs ont été ajoutés au portefeuille.`);
  });
}

function renderReceive() {
  app.innerHTML = `
    <h2 class="page-title">Recevoir de l’argent</h2>
    <p class="page-subtitle">Montre ce code à la personne qui doit te payer, ou donne-lui simplement ton numéro.</p>
    <div class="qr-wrap">
      <div id="qrDemo" class="qr-demo" role="img" aria-label="Code QR visuel de démonstration"></div>
      <div class="qr-caption">${escapeHTML(state.user.phone)}</div>
    </div>
    <div class="card center">
      <strong>${escapeHTML(state.user.name)}</strong>
      <p class="hint">QR visuel de démonstration — il n’encode pas de demande de paiement réelle.</p>
    </div>`;
  buildDemoQr();
}

function buildDemoQr() {
  const target = document.querySelector('#qrDemo');
  if (!target) return;
  const seed = state.user.phone.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  for (let y = 0; y < 13; y++) {
    for (let x = 0; x < 13; x++) {
      const cell = document.createElement('i');
      const finder = (x < 4 && y < 4) || (x > 8 && y < 4) || (x < 4 && y > 8);
      const pattern = ((x * 7 + y * 11 + seed) % 5) < 2;
      if (finder || pattern) cell.className = 'on';
      target.appendChild(cell);
    }
  }
}

function renderProfile() {
  app.innerHTML = `
    <h2 class="page-title">Mon compte</h2>
    <section class="card">
      <div class="profile-head">
        <div class="avatar">AK</div>
        <div><h2>${escapeHTML(state.user.name)}</h2><p>${escapeHTML(state.user.phone)}</p></div>
      </div>
    </section>
    <section class="list-menu">
      <button class="menu-row" type="button" id="securityInfo"><span><strong>Sécurité</strong><small>PIN de démonstration et bonnes pratiques</small></span><span>›</span></button>
      <button class="menu-row" type="button" id="aboutDemo"><span><strong>À propos de la démo</strong><small>Ce qui est réel et ce qui est simulé</small></span><span>›</span></button>
    </section>
    <div class="button-row">
      <button class="danger-button" id="resetDemo" type="button">Réinitialiser la démonstration</button>
    </div>`;

  document.querySelector('#securityInfo').addEventListener('click', () => showInfo('Sécurité', 'Le code PIN de cette démo est 1234. Dans un produit réel, un PIN ne doit jamais être stocké ou vérifié ainsi dans le navigateur : l’authentification et les contrôles sensibles doivent être sécurisés côté serveur.'));
  document.querySelector('#aboutDemo').addEventListener('click', () => showInfo('À propos', 'Cette V1 simule un portefeuille mobile money pour tester l’expérience utilisateur. Les données restent dans le navigateur et aucun fonds réel n’est traité.'));
  document.querySelector('#resetDemo').addEventListener('click', () => {
    showConfirmation({ title: 'Tout réinitialiser ?', rows: [['Effet', 'Retour aux données de départ']], onConfirm: () => {
      state = initialState(); saveState(); closeModal(); navigate('home'); toast('Démonstration réinitialisée.');
    }});
  });
}

function addTransaction(type, title, amount) {
  state.transactions.unshift({ id: cryptoId(), type, title, amount, createdAt: Date.now() });
}

function showConfirmation({ title, rows, onConfirm }) {
  modalContent.innerHTML = `
    <div class="modal-inner">
      <h2>${escapeHTML(title)}</h2>
      <p>Vérifie avant de continuer.</p>
      <div class="summary-box">${rows.map(([label, value]) => `<div class="summary-line"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`).join('')}</div>
      <div class="button-row">
        <button class="primary-button" id="confirmModal" type="button">Confirmer</button>
        <button class="secondary-button" id="cancelModal" type="button">Annuler</button>
      </div>
    </div>`;
  modal.showModal();
  document.querySelector('#cancelModal').addEventListener('click', closeModal);
  document.querySelector('#confirmModal').addEventListener('click', () => { closeModal(); onConfirm(); });
}

function authorizePin(onSuccess) {
  modalContent.innerHTML = `
    <form class="modal-inner" id="pinForm">
      <h2>Ton code PIN</h2>
      <p>Pour la démonstration, entre <strong>1234</strong>.</p>
      <div class="field">
        <label for="pinInput">Code à 4 chiffres</label>
        <input id="pinInput" type="password" inputmode="numeric" maxlength="4" pattern="[0-9]{4}" autocomplete="off" required />
      </div>
      <div class="button-row">
        <button class="primary-button" type="submit">Valider</button>
        <button class="secondary-button" id="cancelPin" type="button">Annuler</button>
      </div>
    </form>`;
  modal.showModal();
  setTimeout(() => document.querySelector('#pinInput')?.focus(), 60);
  document.querySelector('#cancelPin').addEventListener('click', closeModal);
  document.querySelector('#pinForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const pin = document.querySelector('#pinInput').value;
    if (pin !== DEMO_PIN) return toast('Code incorrect. Pour la démo : 1234.');
    closeModal();
    onSuccess();
  });
}

function renderSuccess(title, message) {
  currentRoute = 'home';
  app.innerHTML = `
    <div class="success-mark">✓</div>
    <div class="center"><h2 class="page-title">${escapeHTML(title)}</h2><p class="page-subtitle">${escapeHTML(message)}</p></div>
    <div class="card center"><p class="hint">Nouveau solde</p><h2>${money(state.balance)} FCFA</h2></div>
    <div class="button-row"><button class="primary-button" data-go="home" type="button">Retour à l’accueil</button><button class="secondary-button" data-go="history" type="button">Voir l’activité</button></div>`;
  bindGoButtons();
}

function showInfo(title, text) {
  modalContent.innerHTML = `<div class="modal-inner"><h2>${escapeHTML(title)}</h2><p>${escapeHTML(text)}</p><button class="primary-button" id="closeInfo" type="button">J’ai compris</button></div>`;
  modal.showModal();
  document.querySelector('#closeInfo').addEventListener('click', closeModal);
}

function closeModal() {
  if (modal.open) modal.close();
}

function bindGoButtons() {
  document.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.go)));
}

function toast(message) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

document.querySelectorAll('.nav-item').forEach((item) => item.addEventListener('click', () => navigate(item.dataset.route)));
document.querySelector('#helpButton').addEventListener('click', () => showInfo('Comment tester ?', 'Commence par Envoyer, Payer ou Déposer. Le code PIN de démonstration est 1234. Tout est fictif : tu peux réinitialiser les données depuis Profil.'));
modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

render();

/**
 * CarbonTrack India — Main Application Script
 * Extracted from inline scripts for caching, linting, and CSP compliance.
 * Includes: SPA routing, charts, calculator, auth, chat, modal focus trap,
 *           ARIA roles, accessible chart data tables.
 */

/* ===================================================================
   CONSTANTS
   =================================================================== */
const CHAT_API_PROXY = '/api/chat';

const SYSTEM_PROMPT = `You are GreenGuide, an expert AI carbon footprint coach for Indians. The user's current footprint is 3.6 tonnes CO₂/year. India average is 3.8t. The 1.5°C target is 2.5t. Give practical, India-specific advice. Keep responses concise (3-5 sentences max), friendly, and actionable. Use specific numbers where possible. Mention Indian context (grid emission factor 0.82 kg/kWh, Indian diet, Indian transport options like metro/auto/cycle). Use occasional Hindi words naturally (like "bilkul", "bahut achha").`;

/* ===================================================================
   SPA ROUTING — with a11y: title update, live region, focus management
   =================================================================== */
function showPage(id) {
  // Navigation guard: redirect unauthenticated users to login
  if (id !== 'landing' && id !== 'login' && !isAuthenticated()) {
    id = 'login';
  }

  const pageTitles = {
    'landing':   'Home — CarbonTrack India',
    'login':     'Login — CarbonTrack India',
    'dashboard': 'Dashboard — CarbonTrack India',
    'calculator':'Calculator — CarbonTrack India',
    'community': 'Community — CarbonTrack India',
    'profile':   'Profile — CarbonTrack India',
    'offset':    'Offset — CarbonTrack India',
    'guide':     'AI Guide — CarbonTrack India'
  };
  document.title = pageTitles[id] || 'CarbonTrack India';

  // Announce navigation to screen readers via live region
  const announcer = document.getElementById('route-announcer');
  if (announcer) {
    announcer.textContent = `Navigated to ${id === 'landing' ? 'home' : id} page.`;
  }

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.remove('active');
    l.removeAttribute('aria-current');
  });

  const target = document.getElementById('page-' + id);
  if (target) {
    target.classList.add('active');
    target.style.opacity = '0';
    target.style.transition = 'opacity 0.25s ease';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { target.style.opacity = '1'; });
    });
  }

  document.querySelectorAll('.nav-link').forEach(l => {
    if (l.dataset.page === id) {
      l.classList.add('active');
      l.setAttribute('aria-current', 'page');
    }
  });

  window.scrollTo(0, 0);

  // Move keyboard focus to the new page for screen readers
  if (target) {
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
}

/* ===================================================================
   TICKER
   =================================================================== */
const tickerData = [
  'Rohit S. just saved 2.1 kg CO₂ by cycling to work',
  'Priya M. offset 1t CO₂ via Uttarakhand forest project',
  '48,291 Indians tracking live right now',
  'New challenge: 7-day meat-free week — 1,240 joined',
  'India grid emission factor: 0.82 kg CO₂/kWh',
  'Asha K. hit a 30-day green streak!',
  'CarbonTrack community saved 1,840t CO₂ this month',
  'Solar offset credits from Rajasthan now available',
];
const ti = document.getElementById('ticker-inner');
if (ti) {
  const allTicks = [...tickerData, ...tickerData];
  ti.innerHTML = allTicks.map(t => `<span class="ticker-item"><span class="dot"></span>${t}</span>`).join('');
}

/* ===================================================================
   DASHBOARD — DATE & LIVE COUNTERS
   =================================================================== */
const dashDate = document.getElementById('dash-date');
if (dashDate) {
  dashDate.textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
}

let userCount = 48291;
setInterval(() => {
  userCount += Math.floor(Math.random() * 5) - 1;
  const el = document.getElementById('stat-users');
  if (el) el.textContent = userCount.toLocaleString('en-IN');
}, 3000);

let todayVal = 8.4;
setInterval(() => {
  todayVal = +(todayVal + (Math.random() * 0.2 - 0.05)).toFixed(1);
  const el = document.getElementById('today-val');
  if (el) el.textContent = todayVal;
}, 5000);

/* ===================================================================
   DASHBOARD CHARTS — with accessible data tables (WCAG 1.1.1)
   =================================================================== */
const weekLabels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const weekData   = [9.2,7.8,8.5,6.9,10.1,7.3,8.4];
const weekChart  = document.getElementById('weekChart');
if (weekChart) {
  new Chart(weekChart, {
    type: 'bar',
    data: {
      labels: weekLabels,
      datasets: [{
        label: 'kg CO₂',
        data: weekData,
        backgroundColor: ['#a5d6a7','#66bb6a','#81c784','#4caf50','#ef5350','#66bb6a','#81c784'],
        borderRadius: 6, borderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { callback: v => v + 'kg', font: { size: 11 } } },
        x: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });
  // Inject accessible data table for screen readers
  weekChart.setAttribute('aria-label', 'Weekly CO₂ emissions bar chart');
  weekChart.setAttribute('role', 'img');
  const weekTable = document.createElement('table');
  weekTable.className = 'chart-data-table';
  weekTable.innerHTML = `<caption>Weekly CO₂ emissions data</caption><thead><tr><th>Day</th><th>kg CO₂</th></tr></thead><tbody>${weekLabels.map((d,i)=>`<tr><td>${d}</td><td>${weekData[i]}</td></tr>`).join('')}</tbody>`;
  weekChart.parentNode.insertBefore(weekTable, weekChart.nextSibling);
}

const pieLabels = ['Transport','Food','Energy','Shopping'];
const pieData   = [45, 30, 15, 10];
const pieChart  = document.getElementById('pieChart');
if (pieChart) {
  new Chart(pieChart, {
    type: 'doughnut',
    data: {
      labels: pieLabels,
      datasets: [{ data: pieData, backgroundColor: ['#4caf50','#2e7d32','#f59e0b','#ef4444'], borderWidth: 0 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: { legend: { display: false } }
    }
  });
  pieChart.setAttribute('aria-label', 'Emission breakdown by category doughnut chart');
  pieChart.setAttribute('role', 'img');
  const pieTable = document.createElement('table');
  pieTable.className = 'chart-data-table';
  pieTable.innerHTML = `<caption>Emission breakdown by category</caption><thead><tr><th>Category</th><th>Share %</th></tr></thead><tbody>${pieLabels.map((l,i)=>`<tr><td>${l}</td><td>${pieData[i]}%</td></tr>`).join('')}</tbody>`;
  pieChart.parentNode.insertBefore(pieTable, pieChart.nextSibling);
}

/* ===================================================================
   HABITS — role="list" for a11y
   =================================================================== */
const habits = [
  { icon: '🚌', bg: '#e8f5e9', name: 'Used public transport', sub: 'Saves 2.1 kg vs car', done: true },
  { icon: '🥗', bg: '#f1f8e9', name: 'Ate vegetarian meal', sub: 'Saves 1.8 kg vs beef', done: true },
  { icon: '💡', bg: '#fff8e1', name: 'Turned off unused lights', sub: 'Saves 0.3 kg', done: true },
  { icon: '🚿', bg: '#e3f2fd', name: 'Short shower (< 5 min)', sub: 'Saves 0.5 kg', done: false },
  { icon: '♻️', bg: '#fce4ec', name: 'Sorted recyclables', sub: 'Saves 0.2 kg', done: false },
  { icon: '🛍️', bg: '#f3e5f5', name: 'Avoided single-use plastic', sub: 'Saves 0.1 kg', done: false },
];
const hl = document.getElementById('habit-list');
if (hl) {
  hl.setAttribute('role', 'list');
  hl.innerHTML = habits.map((h, i) => `<div class="habit-row" role="listitem">
    <div class="habit-icon" style="background:${h.bg}" aria-hidden="true">${h.icon}</div>
    <div class="habit-info"><div class="habit-name">${h.name}</div><div class="habit-sub">${h.sub}</div></div>
    <button class="habit-toggle ${h.done ? 'on' : ''}" id="ht-${i}" onclick="toggleHabit(${i})" aria-label="Toggle: ${h.name}" aria-pressed="${h.done}"></button>
  </div>`).join('');
}

function toggleHabit(i) {
  const btn = document.getElementById('ht-' + i);
  if (btn) {
    btn.classList.toggle('on');
    const isPressed = btn.classList.contains('on');
    btn.setAttribute('aria-pressed', isPressed);
    const done = document.querySelectorAll('.habit-toggle.on').length;
    const countEl = document.getElementById('habit-count');
    if (countEl) countEl.textContent = done + ' of 6 done';
  }
}

/* ===================================================================
   CATEGORY GOALS — with text labels (not color-only)
   =================================================================== */
const cats = [
  { name: 'Transport', used: 4.2, goal: 3.5, color: '#ef4444', status: 'Above target' },
  { name: 'Food',      used: 2.1, goal: 2.5, color: '#4caf50', status: 'On track' },
  { name: 'Energy',    used: 1.3, goal: 1.5, color: '#4caf50', status: 'On track' },
  { name: 'Shopping',  used: 0.7, goal: 0.5, color: '#f59e0b', status: 'Above target' },
];
const cg = document.getElementById('cat-goals');
if (cg) {
  cg.innerHTML = cats.map(c => {
    const pct = Math.min(100, Math.round(c.used / c.goal * 100));
    return `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:3px">
        <span>${c.name}</span>
        <span style="color:${c.color}">${c.used}t / ${c.goal}t <span class="sr-only">(${c.status})</span></span>
      </div>
      <div class="prog-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${c.name}: ${c.used}t of ${c.goal}t goal (${c.status})">
        <div class="prog-fill" style="width:${pct}%;background:${c.color}"></div>
      </div>
    </div>`;
  }).join('');
}

/* ===================================================================
   TIPS ROTATION
   =================================================================== */
const tips = [
  'Taking the metro instead of your car today could save 2.1 kg CO₂ — that\'s like planting half a tree!',
  'Switching to LED bulbs reduces your electricity CO₂ by up to 80% — a one-time change with lifetime savings.',
  'Eating one fewer meat meal this week saves about 1.8 kg CO₂ — same as not driving 9 km.',
  'Washing clothes in cold water cuts 90% of the washing energy — and your clothes last longer too.',
  'Unplugging chargers and idle devices can cut standby power by 10% of your electricity bill.',
];
let tipIdx = 0;
setInterval(() => {
  tipIdx = (tipIdx + 1) % tips.length;
  const el = document.getElementById('daily-tip');
  if (el) { el.style.opacity = 0; setTimeout(() => { el.textContent = tips[tipIdx]; el.style.opacity = 1; }, 300); }
}, 8000);

/* ===================================================================
   CALCULATOR
   =================================================================== */
function updateCalc() {
  const car    = +document.getElementById('sl-car').value;
  const bike   = +document.getElementById('sl-bike').value;
  const fly    = +document.getElementById('sl-fly').value;
  const train  = +document.getElementById('sl-train').value;
  const elec   = +document.getElementById('sl-elec').value;
  const lpg    = +document.getElementById('sl-lpg').value;
  const meat   = +document.getElementById('sl-meat').value;
  const dairy  = +document.getElementById('sl-dairy').value;
  const cloth  = +document.getElementById('sl-cloth').value;
  const elects = +document.getElementById('sl-elects').value;

  document.getElementById('sv-car').textContent   = car + ' km';
  document.getElementById('sv-bike').textContent  = bike + ' km';
  document.getElementById('sv-fly').textContent   = fly + ' flights';
  document.getElementById('sv-train').textContent = train + ' trips';
  document.getElementById('sv-elec').textContent  = elec + ' kWh';
  document.getElementById('sv-lpg').textContent   = lpg + ' cyl';
  document.getElementById('sv-meat').textContent  = meat + ' meals';
  document.getElementById('sv-dairy').textContent = dairy + ' portions';
  document.getElementById('sv-cloth').textContent = cloth + ' items';
  document.getElementById('sv-elects').textContent = '₹' + elects + 'k';

  const results = window.Emissions.calcAnnual({ car, bike, fly, train, elec, lpg, meat, dairy, cloth, elects });

  document.getElementById('calc-total').textContent = results.total;
  const pct = Math.min(100, Math.round(results.total / 7 * 100));
  const bar = document.getElementById('calc-meter');
  bar.style.width = pct + '%';
  bar.style.background = results.total <= 2.5 ? '#4caf50' : results.total <= 4 ? '#f59e0b' : '#ef4444';
  const lbl = results.total <= 2.5
    ? 'Below 1.5°C target (2.5t) — excellent!'
    : results.total <= 3.8
    ? 'Below India average (3.8t) · Above 1.5°C target'
    : 'Above India average (3.8t) — room to improve';
  document.getElementById('calc-label').textContent = lbl;

  const bd = document.getElementById('calc-breakdown');
  const items = [['Transport', results.transport], ['Home energy', results.energy], ['Food & diet', results.food], ['Shopping', results.shopping]];
  bd.innerHTML = items.map(([n, v]) =>
    `<div class="rb-row"><span>${n}</span><span>${v} t</span></div><div class="rb-bar"><div class="rb-fill" style="width:${Math.min(100, Math.round(v / (results.total || 1) * 100))}%"></div></div>`
  ).join('');
}
updateCalc();

/* ===================================================================
   LEADERBOARD — role="list" / role="listitem" for injected rows
   =================================================================== */
const lbData = [
  { rank: 1, init: 'RS', name: 'Rohit S.',  city: 'Dehradun',  co2: '1.6t', streak: '45 days', badge: 'green',  me: false },
  { rank: 2, init: 'PM', name: 'Priya M.',  city: 'Rishikesh',  co2: '1.9t', streak: '38 days', badge: 'green',  me: false },
  { rank: 3, init: 'AK', name: 'Asha K.',   city: 'Haridwar',  co2: '2.1t', streak: '22 days', badge: 'green',  me: false },
  { rank: 4, init: 'MV', name: 'Mohan V.',  city: 'Dehradun',  co2: '2.4t', streak: '18 days', badge: 'green',  me: false },
  { rank: 5, init: 'GK', name: 'Gaurav K.', city: 'Dehradun',  co2: '2.9t', streak: '12 days', badge: 'amber',  me: true  },
  { rank: 6, init: 'SK', name: 'Sunita K.', city: 'Mussoorie', co2: '3.1t', streak: '7 days',  badge: 'amber',  me: false },
  { rank: 7, init: 'VP', name: 'Vijay P.',  city: 'Dehradun',  co2: '3.5t', streak: '3 days',  badge: 'amber',  me: false },
  { rank: 8, init: 'ND', name: 'Neha D.',   city: 'Haridwar',  co2: '3.8t', streak: '1 day',   badge: 'red',    me: false },
];
const colors = ['#4caf50','#66bb6a','#81c784','#a5d6a7','#2e7d32','#388e3c','#43a047','#e8f5e9'];
const lbRows = document.getElementById('lb-rows');
if (lbRows) {
  lbRows.setAttribute('role', 'list');
  lbRows.innerHTML = lbData.map((u, i) => `<div class="lb-row ${u.me ? 'me' : ''}" role="listitem">
    <div class="lb-rank">${u.rank}</div>
    <div class="lb-user"><div class="lb-avatar" style="background:${colors[i]}20;color:${colors[i]};font-size:11px" aria-hidden="true">${u.init}</div><div><div class="lb-uname">${u.name}${u.me ? ' (you)' : ''}</div><div class="lb-city">${u.city}</div></div></div>
    <div class="lb-co2">${u.co2}</div>
    <div class="lb-streak" style="font-size:12px"><span aria-hidden="true">🔥</span> ${u.streak}</div>
    <div><span class="badge-pill badge-${u.badge}" style="font-size:10px">${u.badge === 'green' ? 'Low' : 'Medium'}</span></div>
  </div>`).join('');
}

function setLbTab(el, tab) {
  document.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

/* ===================================================================
   CHALLENGES — role="list" / role="listitem"
   =================================================================== */
const challengesData = [
  { icon: '🚴', title: '7-day cycle challenge',    desc: 'Cycle instead of drive for 7 consecutive days. 1,240 participants.', prog: 65, badge: 'green' },
  { icon: '🥗', title: 'Meatless Monday month',    desc: 'Go meat-free every Monday for a month. Community favourite!', prog: 82, badge: 'amber' },
  { icon: '💡', title: 'Zero waste week',           desc: 'Produce no landfill waste for 7 days. Tips and guides included.', prog: 40, badge: 'green' },
  { icon: '🌳', title: 'Plant 5 trees challenge',  desc: 'Virtually fund 5 trees through offset marketplace. 340 joined.', prog: 55, badge: 'amber' },
];
const chEl = document.getElementById('challenges');
if (chEl) {
  chEl.setAttribute('role', 'list');
  chEl.innerHTML = challengesData.map(c => `<div class="challenge-card" role="listitem">
    <div style="font-size:24px;margin-bottom:8px" aria-hidden="true">${c.icon}</div>
    <div class="ch-title">${c.title}</div>
    <div class="ch-desc">${c.desc}</div>
    <div class="ch-prog">
      <div class="ch-prog-bar" role="progressbar" aria-valuenow="${c.prog}" aria-valuemin="0" aria-valuemax="100" aria-label="${c.title}: ${c.prog}% participation">
        <div class="ch-prog-fill" style="width:${c.prog}%"></div>
      </div>
      <span class="ch-pct" aria-hidden="true">${c.prog}%</span>
    </div>
    <button style="margin-top:12px;padding:7px 16px;background:var(--green-600);color:#fff;border:none;border-radius:8px;font-size:12px;cursor:pointer;font-family:Inter,sans-serif" onclick="alert('Joined! Good luck on the challenge!')">Join challenge</button>
  </div>`).join('');
}

/* ===================================================================
   RECOMMENDATIONS
   =================================================================== */
const recData = [
  { id:'r1', category:'Transport', icon:'🚇', title:'Take the Metro 3x a week',       desc:'Swap three car commutes per week with the metro or bus. At 15km each, this single change can save nearly half a tonne of CO₂ per year.',       why:'Road transport is your #1 emission source at 4.2t/yr. Even one mode-shift per day makes a measurable difference.', savings:0.54, difficulty:'easy',   color:'#ef4444', bg:'#fef2f2' },
  { id:'r2', category:'Energy',    icon:'💡', title:'Switch all bulbs to LED',         desc:'Replace incandescent and CFL bulbs with LEDs. LEDs use 80% less electricity and last 15× longer.',                                              why:'India\'s grid emits 0.82 kg CO₂ per kWh. LEDs reduce electricity consumption by ~30–80% per fitting.',           savings:0.18, difficulty:'easy',   color:'#f59e0b', bg:'#fffbf0' },
  { id:'r3', category:'Food',      icon:'🥗', title:'Meatless Mondays (& more)',       desc:'Go meat-free two days a week. Swapping to lentils, tofu or paneer keeps your protein without the planetary cost.',                              why:'Beef emits 27kg CO₂/kg of protein vs 0.9kg for legumes.',                                                        savings:0.38, difficulty:'easy',   color:'#4caf50', bg:'#f0faf0' },
  { id:'r4', category:'Energy',    icon:'❄️', title:'Set AC to 24–26°C',              desc:'Every 1°C increase in your AC set-point saves ~6% of cooling energy.',                                                                           why:'BEE recommends 24°C. It can cut your cooling electricity by 24%, reducing CO₂ and your electricity bill.',        savings:0.35, difficulty:'easy',   color:'#0288d1', bg:'#e3f2fd' },
  { id:'r5', category:'Transport', icon:'🚴', title:'Cycle or walk for trips <3km',    desc:'The shortest trips in a vehicle have the highest emission per km. Using a cycle or your feet eliminates that footprint entirely.',               why:'2-wheelers still emit 41g CO₂/km. Short trips account for 30–40% of all urban vehicle journeys in India.',       savings:0.14, difficulty:'medium', color:'#ef4444', bg:'#fef2f2' },
  { id:'r6', category:'Shopping',  icon:'🛍️',title:'Buy 5 fewer clothing items/year', desc:'Fast fashion is one of the most carbon-intensive industries. Extending the life of existing clothing cuts your footprint significantly.',        why:'A single pair of jeans produces ~33kg CO₂ from production to disposal.',                                          savings:0.10, difficulty:'medium', color:'#8b5cf6', bg:'#f5f3ff' },
  { id:'r7', category:'Energy',    icon:'🔌', title:'Unplug idle electronics',         desc:'Standby power from chargers, TVs and set-top boxes can account for 5–10% of your electricity bill. Unplug when not in use.',                   why:'India\'s grid factor of 0.82 kg/kWh means phantom load adds up to 36–72 kg CO₂/year.',                           savings:0.07, difficulty:'easy',   color:'#f59e0b', bg:'#fffbf0' },
  { id:'r8', category:'Food',      icon:'🛒', title:'Buy seasonal & local produce',    desc:'Imported and out-of-season vegetables travel thousands of kilometres in refrigerated trucks. Buying local cuts transport emissions dramatically.',why:'Air-freighted produce can have 50× the carbon footprint of locally grown food.',                                   savings:0.12, difficulty:'easy',   color:'#4caf50', bg:'#f0faf0' },
  { id:'r9', category:'Transport', icon:'✈️', title:'Take train over flight once',     desc:'Trains emit ~80–90% less CO₂ per km than aircraft. Switching one Delhi–Mumbai flight to train saves nearly 1 tonne CO₂.',                     why:'A Delhi–Mumbai flight emits ~0.9t CO₂ per passenger. The equivalent train journey emits just ~0.1t.',             savings:0.80, difficulty:'hard',   color:'#ef4444', bg:'#fef2f2' },
];

let committedSavings = 0;
let committedCount   = 0;
let recFilter        = 'all';
const difficultyColors = { easy:'#4caf50', medium:'#f59e0b', hard:'#ef4444' };
const difficultyDots   = { easy:1, medium:2, hard:3 };

function renderRecommendations(filter) {
  const grid = document.getElementById('rec-grid');
  if (!grid) return;
  const filtered = filter === 'all' ? recData : recData.filter(r => r.category === filter);
  grid.setAttribute('role', 'list');
  grid.innerHTML = filtered.map(r => {
    const diff = difficultyColors[r.difficulty];
    const dots = Array.from({length: 3}, (_, i) =>
      `<div class="rec-dot" style="background:${i < difficultyDots[r.difficulty] ? diff : 'var(--border)'}"></div>`
    ).join('');
    return `
    <div class="rec-card" id="card-${r.id}" role="listitem" onclick="toggleRec('${r.id}', ${r.savings})" tabindex="0" aria-pressed="false" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();toggleRec('${r.id}', ${r.savings});}">
      <div class="rec-check-btn" id="chk-${r.id}" aria-hidden="true"></div>
      <div class="rec-cat-tag" style="background:${r.bg};color:${r.color}">${r.category}</div>
      <div class="rec-card-icon" style="background:${r.bg}" aria-hidden="true">${r.icon}</div>
      <div class="rec-card-title">${r.title}</div>
      <div class="rec-card-desc">${r.desc}</div>
      <div class="rec-difficulty" aria-label="Difficulty: ${r.difficulty}">${dots}<span style="font-size:11px;color:var(--text-muted);margin-left:4px;text-transform:capitalize">${r.difficulty}</span></div>
      <div style="background:${r.bg};border-radius:8px;padding:10px 12px;font-size:12px;color:${r.color};line-height:1.5;margin-bottom:14px"><span aria-hidden="true">💡</span> ${r.why}</div>
      <div class="rec-card-footer">
        <div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:2px">Potential saving</div>
          <div class="rec-saving" style="color:${r.color}">−${r.savings}t <span style="font-size:12px;font-weight:400;color:var(--text-muted)">CO₂/yr</span></div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);text-align:right">≈ ${Math.round(r.savings * 1000)} kg<br>= ${Math.round(r.savings / 0.022)} trees</div>
      </div>
    </div>`;
  }).join('');
}

function toggleRec(id, savings) {
  const el  = document.getElementById('card-' + id);
  const chk = document.getElementById('chk-' + id);
  if (!el) return;
  el.classList.toggle('selected');
  const isSelected = el.classList.contains('selected');
  el.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
  if (isSelected) {
    chk.innerHTML = '✓';
    committedSavings = +(committedSavings + savings).toFixed(2);
    committedCount++;
  } else {
    chk.innerHTML = '';
    committedSavings = +(committedSavings - savings).toFixed(2);
    committedCount--;
  }
  committedSavings = Math.max(0, committedSavings);
  committedCount   = Math.max(0, committedCount);
  updateRecStats();
}

function updateRecStats() {
  const GAP  = 1.1;
  const pct  = Math.min(100, Math.round((committedSavings / GAP) * 100));
  const trees = Math.round(committedSavings / 0.022);
  if (document.getElementById('rec-savings-val'))  document.getElementById('rec-savings-val').textContent  = committedSavings.toFixed(2);
  if (document.getElementById('rec-imp-actions'))  document.getElementById('rec-imp-actions').textContent  = committedCount;
  if (document.getElementById('rec-imp-tonnes'))   document.getElementById('rec-imp-tonnes').textContent   = committedSavings.toFixed(2) + 't';
  if (document.getElementById('rec-imp-pct'))      document.getElementById('rec-imp-pct').textContent      = pct + '%';
  if (document.getElementById('rec-imp-trees'))    document.getElementById('rec-imp-trees').textContent    = trees;
  if (document.getElementById('rec-gap-fill'))     document.getElementById('rec-gap-fill').style.width     = pct + '%';
}

function filterRec(btn, filter) {
  document.querySelectorAll('.rec-cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  recFilter = filter;
  renderRecommendations(filter);
}

function commitRecommendations() {
  if (committedSavings > 0) {
    showToast('Green Plan Saved! 🌍', `You've committed to ${committedCount} actions saving ${committedSavings.toFixed(2)}t CO₂/yr. Bahut achha!`);
  } else {
    showToast('Select actions first', 'Please select at least one action to build your green plan.');
  }
}

renderRecommendations('all');

/* ===================================================================
   MARKETPLACE
   =================================================================== */
const projects = [
  { emoji: '🌳', bg: '#e8f5e9', title: 'Uttarakhand reforestation', loc: 'Uttarakhand, India',     verified: true,  area: '2,400 ha',       trees: '180,000', price: '₹500/t', type: 'forest'    },
  { emoji: '☀️', bg: '#fff8e1', title: 'Rajasthan solar farm',       loc: 'Rajasthan, India',       verified: true,  area: '850 MW',          trees: '—',       price: '₹450/t', type: 'solar'     },
  { emoji: '🔥', bg: '#fce4ec', title: 'Clean cookstoves — UP',      loc: 'Uttar Pradesh, India',   verified: true,  area: '12,000 households',trees: '—',       price: '₹350/t', type: 'cookstove' },
  { emoji: '💧', bg: '#e3f2fd', title: 'Karnataka water project',    loc: 'Karnataka, India',        verified: true,  area: '8 villages',      trees: '—',       price: '₹400/t', type: 'water'     },
  { emoji: '🌿', bg: '#f1f8e9', title: 'Mangrove restoration',       loc: 'Sundarbans, West Bengal', verified: true,  area: '1,200 ha',        trees: '90,000',  price: '₹600/t', type: 'forest'    },
  { emoji: '⚡', bg: '#f3e5f5', title: 'Wind energy — Gujarat',      loc: 'Gujarat, India',          verified: false, area: '320 MW',           trees: '—',       price: '₹380/t', type: 'solar'     },
];

function renderProjects(filter) {
  const pg = document.getElementById('proj-grid');
  if (!pg) return;
  const filtered = filter === 'all' ? projects : projects.filter(p => p.type === filter);
  pg.innerHTML = filtered.map(p => `<div class="proj-card">
    <div class="proj-img" style="background:${p.bg}" aria-hidden="true">${p.emoji}${p.verified ? '<span class="proj-verified">✓ Verified</span>' : ''}
    </div>
    <div class="proj-body">
      <div class="proj-title">${p.title}</div>
      <div class="proj-loc"><span aria-hidden="true">📍</span> ${p.loc}</div>
      <div class="proj-stats">
        <div class="pstat"><div class="pstat-val">${p.area}</div><div class="pstat-label">${p.type === 'forest' ? 'Area' : 'Capacity'}</div></div>
        ${p.trees !== '—' ? `<div class="pstat"><div class="pstat-val">${p.trees}</div><div class="pstat-label">Trees</div></div>` : ''}
      </div>
      <div class="proj-price">
        <div><div class="proj-price-val">${p.price}</div><div class="proj-price-sub">per tonne CO₂</div></div>
        <button class="buy-btn" onclick="alert('Purchasing 1t CO₂ offset from ${p.title} — payment integration coming soon!')">Buy credits</button>
      </div>
    </div>
  </div>`).join('');
}
renderProjects('all');

function setFilter(el, filter) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  renderProjects(filter);
}

/* ===================================================================
   GROQ AI CHAT
   =================================================================== */
let chatHistory = [];

async function sendAIMessage(text) {
  const input = document.getElementById('chat-input');
  if (text && input) input.value = text;
  sendChat();
}

async function sendChat() {
  const input = document.getElementById('chat-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  if (location.protocol === 'file:') {
    const msgs = document.getElementById('chat-messages');
    if (msgs) {
      msgs.innerHTML += `<div class="msg msg-ai"><div class="msg-ai-name">🌿 GreenGuide AI</div>⚠️ <strong>Please open the app via the server.</strong><br><br>Run <code>node server.js</code> then open <a href="http://localhost:3000" style="color:#4caf50;font-weight:600">http://localhost:3000</a></div>`;
      msgs.scrollTop = msgs.scrollHeight;
    }
    return;
  }

  input.value = '';
  const msgs = document.getElementById('chat-messages');
  if (!msgs) return;

  const escapedUserText = text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  msgs.innerHTML += `<div class="msg msg-user">${escapedUserText}</div>`;
  const typingId = 'typing-' + Date.now();
  msgs.innerHTML += `<div class="msg msg-ai" id="${typingId}"><div class="msg-ai-name">🌿 GreenGuide AI</div><div class="typing"><span></span><span></span><span></span></div></div>`;
  msgs.scrollTop = msgs.scrollHeight;

  chatHistory.push({ role: 'user', content: text });
  if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

  const typingEl = document.getElementById(typingId);
  try {
    const token = sessionStorage.getItem('authToken');
    const res = await fetch(CHAT_API_PROXY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': token ? `Bearer ${token}` : '' },
      body: JSON.stringify({ system: SYSTEM_PROMPT, messages: chatHistory })
    });

    if (res.ok) {
      const responseData = await res.json();
      const reply = responseData.choices?.[0]?.message?.content || 'No response received.';
      chatHistory.push({ role: 'assistant', content: reply });
      if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

      if (typingEl) {
        const escaped = reply
          .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
        const formatted = escaped
          .replace(/\n/g, '<br>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>');
        typingEl.innerHTML = `<div class="msg-ai-name">🌿 GreenGuide AI</div>${formatted}`;
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      if (typingEl) typingEl.innerHTML = `<div class="msg-ai-name">🌿 GreenGuide AI</div>⚠️ ${errData.error || 'Server error ' + res.status}`;
    }
  } catch (e) {
    console.error('Groq proxy error:', e);
    if (typingEl) typingEl.innerHTML = `<div class="msg-ai-name">🌿 GreenGuide AI</div>⚠️ Failed to connect to server proxy. Please verify your server is running.`;
  }
  msgs.scrollTop = msgs.scrollHeight;
}

/* ===================================================================
   LOG MODAL — with keyboard focus trap (WCAG 2.1.2)
   =================================================================== */
const transportModes = [
  { icon: '🚗', name: 'Car/taxi',   ef: 0.171 },
  { icon: '🛵', name: '2-wheeler',  ef: 0.041 },
  { icon: '🚌', name: 'Bus',        ef: 0.089 },
  { icon: '🚇', name: 'Metro',      ef: 0.031 },
  { icon: '🚆', name: 'Train',      ef: 0.013 },
  { icon: '🚶', name: 'Walk/cycle', ef: 0 },
];
let selectedTransport = 0;
const toEl = document.getElementById('transport-options');
if (toEl) {
  transportModes.forEach((m, i) => {
    const btn = document.createElement('button');
    btn.style.cssText = `padding:8px 14px;border-radius:var(--radius-sm);font-size:13px;cursor:pointer;border:1.5px solid var(--border);background:${i === 0 ? 'var(--green-600)' : 'var(--surface)'};color:${i === 0 ? '#fff' : 'var(--text)'};transition:all 0.15s;font-family:Inter,sans-serif`;
    btn.innerHTML = `${m.icon} ${m.name}`;
    btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
    btn.onclick = () => {
      selectedTransport = i;
      document.querySelectorAll('#transport-options button').forEach((b, j) => {
        b.style.background   = j === i ? 'var(--green-600)' : 'var(--surface)';
        b.style.color        = j === i ? '#fff' : 'var(--text)';
        b.style.borderColor  = j === i ? 'var(--green-600)' : 'var(--border)';
        b.setAttribute('aria-pressed', j === i ? 'true' : 'false');
      });
      updateLogCalc();
    };
    toEl.appendChild(btn);
  });
}

const foodItems = [
  { icon: '🥩', name: 'Beef/lamb meal',      ef: 3.0  },
  { icon: '🍗', name: 'Chicken meal',         ef: 0.9  },
  { icon: '🐟', name: 'Fish meal',            ef: 0.6  },
  { icon: '🥛', name: 'Dairy (milk/curd)',    ef: 0.35 },
  { icon: '🥗', name: 'Vegetarian meal',      ef: 0.2  },
  { icon: '🌱', name: 'Vegan meal',           ef: 0.08 },
];
const fo = document.getElementById('food-options');
if (fo) {
  foodItems.forEach(f => {
    fo.innerHTML += `<label style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg);border-radius:var(--radius-sm);cursor:pointer;border:1px solid var(--border)">
      <input type="checkbox" style="width:16px;height:16px;accent-color:var(--green-600)" data-ef="${f.ef}" onchange="updateLogCalc()">
      <span style="font-size:18px" aria-hidden="true">${f.icon}</span>
      <span style="font-size:13px;flex:1">${f.name}</span>
      <span style="font-size:12px;color:var(--text-muted)">${f.ef} kg CO₂</span>
    </label>`;
  });
}

const otherItems = [
  { icon: '👕', name: 'Bought new clothing',        ef: 8.0  },
  { icon: '📦', name: 'Online shopping delivery',   ef: 0.5  },
  { icon: '🛁', name: 'Long hot bath (30min)',       ef: 0.9  },
  { icon: '🖥️', name: '8+ hours device use',        ef: 0.15 },
];
const oo = document.getElementById('other-options');
if (oo) {
  otherItems.forEach(o => {
    oo.innerHTML += `<label style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg);border-radius:var(--radius-sm);cursor:pointer;border:1px solid var(--border)">
      <input type="checkbox" style="width:16px;height:16px;accent-color:var(--green-600)" data-ef="${o.ef}" onchange="updateLogCalc()">
      <span style="font-size:18px" aria-hidden="true">${o.icon}</span>
      <span style="font-size:13px;flex:1">${o.name}</span>
      <span style="font-size:12px;color:var(--text-muted)">${o.ef} kg CO₂</span>
    </label>`;
  });
}

function updateLogCalc() {
  const dist          = +document.getElementById('log-dist').value || 0;
  const transportMode = transportModes[selectedTransport].name;
  const foodCheckedEfs = [];
  document.querySelectorAll('#food-options input:checked').forEach(cb => foodCheckedEfs.push(parseFloat(cb.dataset.ef)));
  const otherCheckedEfs = [];
  document.querySelectorAll('#other-options input:checked').forEach(cb => otherCheckedEfs.push(parseFloat(cb.dataset.ef)));
  const elec = +document.getElementById('log-elec').value;
  const elecValEl = document.getElementById('log-elec-val');
  if (elecValEl) elecValEl.textContent = elec + ' kWh';
  const acOn = document.getElementById('log-ac') ? document.getElementById('log-ac').classList.contains('on') : false;

  const total = window.Emissions.calcDaily({ distance: dist, transportMode, foodCheckedEfs, otherCheckedEfs, elec, acOn });

  const co2El = document.getElementById('log-co2');
  const cmpEl = document.getElementById('log-compare');
  if (co2El) co2El.textContent = total;
  if (cmpEl) {
    const diff = +(4.4 - total).toFixed(1);
    cmpEl.textContent = diff >= 0 ? `−${diff} kg better` : `+${Math.abs(diff)} kg worse`;
    cmpEl.style.color = diff >= 0 ? 'var(--green-600)' : 'var(--red-600)';
  }
}

function setLogTab(el, tab) {
  document.querySelectorAll('#log-category-tabs .filter-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  ['transport','food','energy','other'].forEach(t => {
    const sec = document.getElementById('log-' + t);
    if (sec) sec.style.display = t === tab ? 'block' : 'none';
  });
}

let previousActiveElement = null;

function showLogModal() {
  previousActiveElement = document.activeElement;
  const modal = document.getElementById('log-modal');
  if (modal) {
    modal.showModal();
    updateLogCalc();
    // Set initial focus inside modal
    setTimeout(() => {
      const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) firstFocusable.focus();
    }, 50);
  }
}

function closeLogModal() {
  const modal = document.getElementById('log-modal');
  if (modal) modal.close();
  if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
    previousActiveElement.focus();
  }
}

function submitLog() {
  closeLogModal();
  const co2 = document.getElementById('log-co2') ? document.getElementById('log-co2').textContent : '0';
  showToast('Activity logged! 🌿', `${co2} kg CO₂ added to today's total. Keep it green!`);
  const tv = document.getElementById('today-val');
  if (tv) tv.textContent = co2;
}

// Focus trap inside modal — cycle focus with Tab/Shift+Tab (WCAG 2.1.2)
const logModal = document.getElementById('log-modal');
if (logModal) {
  logModal.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = Array.from(logModal.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(el => el.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Close on backdrop click
  logModal.addEventListener('click', (e) => {
    const rect = logModal.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      closeLogModal();
    }
  });

  // Close on Escape (native <dialog> behavior already handles this, but restore focus)
  logModal.addEventListener('close', () => {
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus();
    }
  });
}

/* ===================================================================
   TOAST
   =================================================================== */
function showToast(title, body) {
  const t = document.getElementById('toast');
  if (!t) return;
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-body').textContent  = body;
  t.style.display = 'block';
  t.setAttribute('role', 'status');
  t.setAttribute('aria-live', 'polite');
  setTimeout(() => { t.style.transform = 'translateY(0)'; t.style.opacity = '1'; }, 50);
  setTimeout(() => {
    t.style.transform = 'translateY(20px)'; t.style.opacity = '0';
    setTimeout(() => { t.style.display = 'none'; t.style.transform = 'translateY(20px)'; }, 300);
  }, 4000);
}

/* ===================================================================
   AUTHENTICATION
   =================================================================== */
function isAuthenticated() {
  return !!sessionStorage.getItem('authToken');
}

function updateAuthUI() {
  const loggedIn = isAuthenticated();
  document.querySelectorAll('.private-link').forEach(el => {
    el.style.display = loggedIn ? '' : 'none';
  });
  const loginBtn = document.getElementById('nav-login-btn');
  if (loginBtn) loginBtn.style.display = loggedIn ? 'none' : '';

  const userJson = sessionStorage.getItem('authUser');
  if (loggedIn && userJson) {
    try {
      const user = JSON.parse(userJson);
      const greetingEl = document.querySelector('.dash-greeting');
      if (greetingEl) greetingEl.textContent = `Good morning, ${user.name || 'Gaurav'} 👋`;
    } catch (e) {
      console.error(e);
    }
  }
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const emailInput    = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const errorEl       = document.getElementById('login-error-msg');

  if (emailInput)    emailInput.removeAttribute('aria-invalid');
  if (passwordInput) passwordInput.removeAttribute('aria-invalid');
  if (errorEl)       errorEl.style.display = 'none';

  const email    = emailInput    ? emailInput.value    : '';
  const password = passwordInput ? passwordInput.value : '';

  try {
    const res  = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed.');

    sessionStorage.setItem('authToken', data.token);
    sessionStorage.setItem('authUser', JSON.stringify(data.user));
    showToast('Welcome back! 🌿', `Logged in as ${data.user.name}.`);
    if (emailInput)    emailInput.value    = '';
    if (passwordInput) passwordInput.value = '';
    updateAuthUI();
    showPage('dashboard');
  } catch (err) {
    console.error('Login error:', err);
    if (errorEl) {
      errorEl.textContent = err.message || 'Invalid email or password.';
      errorEl.style.display = 'block';
      if (emailInput)    emailInput.setAttribute('aria-invalid', 'true');
      if (passwordInput) passwordInput.setAttribute('aria-invalid', 'true');
    }
  }
}

function handleLogout() {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('authUser');
  showToast('Logged out 🌿', 'You have successfully logged out.');
  updateAuthUI();
  showPage('landing');
}

function togglePasswordVisibility(event) {
  const input = document.getElementById('login-password');
  const btn   = event.currentTarget || event.target;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
    btn.setAttribute('aria-label', 'Hide password');
  } else {
    input.type = 'password';
    btn.textContent = '👁️';
    btn.setAttribute('aria-label', 'Show password');
  }
}

function toggleSetting(btn) {
  btn.classList.toggle('on');
  const isOn = btn.classList.contains('on');
  btn.setAttribute('aria-pressed', isOn ? 'true' : 'false');
  showToast('Preferences updated ⚙️', 'Your settings have been saved locally.');
}

// Initialize auth UI
updateAuthUI();

/* ===================================================================
   PROFILE PAGE — BADGES & ACHIEVEMENTS
   =================================================================== */
const badgesData = [
  { icon:'🌱', name:'First log',   desc:'Logged your first day' },
  { icon:'🔥', name:'7-day streak',desc:'7 consecutive days' },
  { icon:'🚴', name:'Cycle hero',  desc:'Cycled 10+ times' },
  { icon:'🥗', name:'Veg week',    desc:'7 meat-free days' },
  { icon:'💡', name:'Energy saver',desc:'Stayed under 5kWh' },
  { icon:'🏆', name:'Top 10%',     desc:'City leaderboard' },
  { icon:'🌳', name:'First offset',desc:'Bought your first credit' },
  { icon:'📊', name:'Data nerd',   desc:'Checked dashboard 30 days' },
];
const bg = document.getElementById('badges-grid');
if (bg) {
  bg.setAttribute('role', 'list');
  bg.innerHTML = badgesData.map(b => `<div style="text-align:center;padding:12px;background:var(--green-50);border:1px solid var(--green-100);border-radius:var(--radius-sm);min-width:72px" role="listitem">
    <div style="font-size:24px;margin-bottom:4px" aria-hidden="true">${b.icon}</div>
    <div style="font-size:11px;font-weight:600;color:var(--green-600)">${b.name}</div>
    <div style="font-size:10px;color:var(--text-muted);margin-top:1px">${b.desc}</div>
  </div>`).join('');
}

/* ===================================================================
   PROFILE CHART — with accessible data table
   =================================================================== */
const profileLabels = ['Jan','Feb','Mar','Apr','May','Jun'];
const profileData   = [0.42,0.39,0.38,0.34,0.31,0.29];
const profileChartEl = document.getElementById('profileChart');
if (profileChartEl) {
  new Chart(profileChartEl, {
    type: 'line',
    data: {
      labels: profileLabels,
      datasets: [{ data: profileData, borderColor: '#4caf50', backgroundColor: 'rgba(76,175,80,0.1)', fill: true, tension: 0.4, pointRadius: 4, pointBackgroundColor: '#2e7d32', borderWidth: 2 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: false, ticks: { callback: v => v + 't', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } }
      }
    }
  });
  profileChartEl.setAttribute('aria-label', 'Monthly carbon footprint trend line chart');
  profileChartEl.setAttribute('role', 'img');
  const profileTable = document.createElement('table');
  profileTable.className = 'chart-data-table';
  profileTable.innerHTML = `<caption>Monthly carbon footprint trend</caption><thead><tr><th>Month</th><th>Footprint (t CO₂)</th></tr></thead><tbody>${profileLabels.map((m,i)=>`<tr><td>${m}</td><td>${profileData[i]}</td></tr>`).join('')}</tbody>`;
  profileChartEl.parentNode.insertBefore(profileTable, profileChartEl.nextSibling);
}

/* ===================================================================
   ACHIEVEMENTS LIST
   =================================================================== */
const achData = [
  { icon:'🚌', title:'Metro maven',          desc:'Used public transport 40 times this year',     saved:'68 kg CO₂ saved', done:true  },
  { icon:'🥗', title:'Plant-based pioneer',  desc:'Completed 30 meatless days',                   saved:'54 kg CO₂ saved', done:true  },
  { icon:'⚡', title:'Energy efficient',     desc:'Stayed below 150 kWh for 3 months straight',   saved:'37 kg CO₂ saved', done:true  },
  { icon:'🌳', title:'Tree planter',         desc:'Fund 10 trees through offset credits',          saved:'4 of 10 trees',   done:false },
  { icon:'🔥', title:'30-day streak',        desc:'Log your footprint for 30 consecutive days',    saved:'18 of 30 days',   done:false },
];
const al = document.getElementById('achievements-list');
if (al) {
  al.setAttribute('role', 'list');
  al.innerHTML = achData.map(a => `<div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border)" role="listitem">
    <div style="width:40px;height:40px;border-radius:var(--radius-sm);background:${a.done?'var(--green-100)':'var(--bg)'};display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;border:1px solid ${a.done?'var(--green-200)':'var(--border)'}" aria-hidden="true">${a.icon}</div>
    <div style="flex:1">
      <div style="font-size:14px;font-weight:500${a.done?';color:var(--text)':';color:var(--text-muted)'}">${a.title}${a.done?' <span aria-label="completed">✓</span>':''}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${a.desc}</div>
    </div>
    <div style="font-size:12px;font-weight:600;color:${a.done?'var(--green-600)':'var(--text-hint)'};text-align:right;white-space:nowrap">${a.saved}</div>
  </div>`).join('');
  if (al.lastChild) al.lastChild.style.borderBottom = 'none';
}

/* ===================================================================
   LIVE TOASTS
   =================================================================== */
const liveEvents = [
  ['New member joined! 🎉',     'Pooja from Jaipur just started tracking her footprint.'],
  ['Challenge update 🏆',       '1,242 people are now on the 7-day cycle challenge!'],
  ['Tip of the hour 💡',        'Switching from rice cooker to pressure cooker saves 40% energy.'],
  ['Community milestone 🌍',    'CarbonTrack users have collectively saved 1,840t CO₂ this month!'],
  ['New offset project 🌳',     'Mangrove restoration in Sundarbans now available in marketplace.'],
];
let eventIdx = 0;
setInterval(() => {
  const e = liveEvents[eventIdx % liveEvents.length];
  showToast(e[0], e[1]);
  eventIdx++;
}, 25000);
setTimeout(() => showToast('Welcome back, Gaurav! 🌿', 'You\'re on a 12-day green streak. Keep going!'), 5000);

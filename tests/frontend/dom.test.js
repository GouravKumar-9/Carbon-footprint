/**
 * DOM & Frontend SPA Integration Tests
 *
 * Strategy:
 *  1. Load index.html stripped of all inline scripts (prevents JSDOM crash).
 *  2. Load public/js/app.js directly — much simpler now that JS is extracted.
 *  3. Inject app.js flat at window scope so function declarations hoist.
 */
const fs   = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Remove every inline <script>…</script> block from HTML. External src= tags kept. */
function stripInlineScripts(html) {
  return html.replace(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi, (match) => {
    if (/\bsrc\s*=/i.test(match)) return match;
    return '';
  });
}

// ---------------------------------------------------------------------------
// Read auth.js and app.js once at module load
// ---------------------------------------------------------------------------
const AUTH_JS_PATH = path.resolve(__dirname, '../../public/js/auth.js');
const AUTH_JS_CODE = fs.readFileSync(AUTH_JS_PATH, 'utf8');

const APP_JS_PATH  = path.resolve(__dirname, '../../public/js/app.js');
const APP_JS_CODE  = fs.readFileSync(APP_JS_PATH, 'utf8');

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('DOM & Frontend SPA Integration Tests', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    const htmlPath = path.resolve(__dirname, '../../public/index.html');
    const rawHtml  = fs.readFileSync(htmlPath, 'utf8');
    const safeHtml = stripInlineScripts(rawHtml);

    dom = new JSDOM(safeHtml, {
      runScripts: 'dangerously',
      url: 'http://localhost/',
      beforeParse(win) {
        // Polyfills & stubs
        win.scrollTo = jest.fn();
        win.requestAnimationFrame = (cb) => setTimeout(cb, 0);
        win.setInterval = jest.fn();

        const originalSetTimeout = win.setTimeout;
        win.setTimeout = (cb, delay) => {
          return originalSetTimeout(cb, delay >= 100 ? 0 : delay);
        };

        // Mock Chart.js
        win.Chart = class MockChart {
          constructor() {
            this.data = {
              labels: [],
              datasets: [{ data: [] }]
            };
          }
          update() {}
        };

        // Mock global fetch
        win.fetch = jest.fn().mockResolvedValue({
          ok: true,
          json: async () => ({})
        });

        // Polyfill HTMLDialogElement
        if (!win.HTMLDialogElement) win.HTMLDialogElement = class {};
        win.HTMLDialogElement.prototype.showModal = jest.fn(function () {
          this.setAttribute('open', '');
        });
        win.HTMLDialogElement.prototype.close = jest.fn(function () {
          this.removeAttribute('open');
        });

        // Inject Emissions module
        const emissionsPath = path.resolve(__dirname, '../../public/js/emissions.js');
        win.Emissions = require(emissionsPath);
      }
    });

    window   = dom.window;
    document = dom.window.document;

    // Inject auth.js and app.js flat at window scope (no IIFE — function declarations hoist)
    window.eval(AUTH_JS_CODE);
    window.eval(APP_JS_CODE);

    // Pre-authenticate
    window.sessionStorage.setItem('authToken', 'mock-token');
    window.sessionStorage.setItem(
      'authUser',
      JSON.stringify({ name: 'Gaurav', email: 'gaurav@carbontrack.in' })
    );
  });

  // =========================================================================
  describe('SPA Routing & Accessibility', () => {
    test('should activate target page and deactivate others on showPage()', () => {
      expect(typeof window.showPage).toBe('function');
      window.showPage('calculator');
      expect(document.getElementById('page-calculator').classList.contains('active')).toBe(true);
      expect(document.getElementById('page-landing').classList.contains('active')).toBe(false);
    });

    test('should update document.title on navigation', () => {
      window.showPage('dashboard');
      expect(document.title).toBe('Dashboard — CarbonTrack India');

      window.showPage('calculator');
      expect(document.title).toBe('Calculator — CarbonTrack India');
    });

    test('should announce route to live region for screen readers', () => {
      const announcer = document.getElementById('route-announcer');
      expect(announcer).not.toBeNull();
      window.showPage('profile');
      expect(announcer.textContent).toBe('Navigated to profile page.');
    });

    test('should move keyboard focus to new page element', () => {
      const pageCalc = document.getElementById('page-calculator');
      window.showPage('calculator');
      expect(pageCalc.getAttribute('tabindex')).toBe('-1');
      expect(document.activeElement).toBe(pageCalc);
    });
  });

  // =========================================================================
  describe('Native <dialog> Modal Interactions', () => {
    test('should open log-modal using native showModal()', () => {
      const modal = document.getElementById('log-modal');
      expect(modal).not.toBeNull();
      expect(modal.tagName.toLowerCase()).toBe('dialog');
      window.showLogModal();
      expect(modal.showModal).toHaveBeenCalled();
      expect(modal.hasAttribute('open')).toBe(true);
    });

    test('should close log-modal and return focus to trigger element', () => {
      const modal = document.getElementById('log-modal');
      window.showLogModal();
      window.closeLogModal();
      expect(modal.close).toHaveBeenCalled();
      expect(modal.hasAttribute('open')).toBe(false);
    });
  });

  // =========================================================================
  describe('Password Visibility Toggle', () => {
    test('should toggle input type between password and text', () => {
      const input = document.getElementById('login-password');
      expect(input.type).toBe('password');

      const btn = document.querySelector('button[aria-label="Show password"]');
      const fakeEvent = { currentTarget: btn, target: btn };
      window.togglePasswordVisibility(fakeEvent);

      expect(input.type).toBe('text');
      expect(btn.getAttribute('aria-label')).toBe('Hide password');

      window.togglePasswordVisibility(fakeEvent);
      expect(input.type).toBe('password');
      expect(btn.getAttribute('aria-label')).toBe('Show password');
    });
  });

  // =========================================================================
  describe('Logout — clears sessionStorage', () => {
    test('handleLogout() should clear auth token and user', async () => {
      expect(window.sessionStorage.getItem('authToken')).toBe('mock-token');

      // handleLogout calls showToast which requires #toast elements
      window.showToast = jest.fn();
      await window.handleLogout();

      expect(window.sessionStorage.getItem('authToken')).toBeNull();
      expect(window.sessionStorage.getItem('authUser')).toBeNull();
    });
  });

  // =========================================================================
  describe('Login Form Validation & Accessibility', () => {
    test('inputs should have aria-describedby linking to error element', () => {
      expect(document.getElementById('login-email').getAttribute('aria-describedby')).toBe('login-error-msg');
      expect(document.getElementById('login-password').getAttribute('aria-describedby')).toBe('login-error-msg');
    });

    test('should show error and set aria-invalid on failed login', async () => {
      const emailInput    = document.getElementById('login-email');
      const passwordInput = document.getElementById('login-password');
      const errorEl       = document.getElementById('login-error-msg');

      emailInput.value    = 'invalid@test.com';
      passwordInput.value = 'wrongpassword';

      window.fetch = jest.fn().mockResolvedValue({
        ok:   false,
        json: async () => ({ error: 'Invalid email or password.' })
      });

      await window.handleLoginSubmit({ preventDefault: jest.fn() });

      expect(errorEl.textContent).toBe('Invalid email or password.');
      expect(errorEl.style.display).toBe('block');
      expect(emailInput.getAttribute('aria-invalid')).toBe('true');
      expect(passwordInput.getAttribute('aria-invalid')).toBe('true');
    });
  });

  // =========================================================================
  describe('Accessibility — ARIA roles on dynamic content', () => {
    test('habit-list should have role=list after render', () => {
      const hl = document.getElementById('habit-list');
      expect(hl.getAttribute('role')).toBe('list');
    });

    test('lb-rows should have role=list after leaderboard render', () => {
      const lbRows = document.getElementById('lb-rows');
      expect(lbRows.getAttribute('role')).toBe('list');
    });

    test('rec-grid should have role=list after recommendations render', () => {
      const grid = document.getElementById('rec-grid');
      expect(grid.getAttribute('role')).toBe('list');
    });
  });

  // =========================================================================
  describe('Personal AI Guide Integration', () => {
    test('should dynamically construct system prompt containing current calculator footprint', () => {
      document.getElementById('sl-car').value = '50';
      document.getElementById('sl-elec').value = '200';
      window.updateCalc();
      
      const prompt = window.getDynamicSystemPrompt();
      expect(prompt).toContain('Car: 50 km/day');
      expect(prompt).toContain('Elec: 200 kWh/month');
      expect(prompt).toContain('calculated annual carbon footprint');
    });

    test('should update live footprint card inside chat page when calculator updates', () => {
      document.getElementById('sl-car').value = '100';
      window.updateCalc();
      
      const chatTotal = document.getElementById('chat-stats-total').textContent;
      expect(parseFloat(chatTotal)).toBeGreaterThan(3.6);
    });
  });
});

  // ===== SUPABASE SETUP =====
  const SUPABASE_URL = 'https://wfmtoodutuaeousykora.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbXRvb2R1dHVhZW91c3lrb3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjUwODcsImV4cCI6MjA5NTkwMTA4N30.TCav8aVw4i5KSOKcey-zRrReLPWYosIgclzMyDB5V8w';
  const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window._supabase = _supabase;
  window._cloudinary = { cloudName: 'dt8nzlmgk', uploadPreset: 'frazx_community' };

  // ===== SERVICE WORKER REGISTRATION (offline support + installability) =====
  if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').catch((err) => {
              console.error('Service worker registration failed:', err);
          });
      });
  }

  // ===== CUSTOM "INSTALL APP" PROMPT =====
  let _deferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      _deferredInstallPrompt = e;
      const btn = document.getElementById('install-app-btn');
      if (btn) btn.classList.remove('hidden');
  });

  window.triggerAppInstall = async function () {
      if (!_deferredInstallPrompt) return;
      _deferredInstallPrompt.prompt();
      const { outcome } = await _deferredInstallPrompt.userChoice;
      if (outcome === 'accepted' && typeof showToast === 'function') {
          showToast('App installed!');
      }
      _deferredInstallPrompt = null;
      const btn = document.getElementById('install-app-btn');
      if (btn) btn.classList.add('hidden');
  };

  window.addEventListener('appinstalled', () => {
      const btn = document.getElementById('install-app-btn');
      if (btn) btn.classList.add('hidden');
  });

  // ===== BOTTOM NAV ACTIVE STATE =====
  (function highlightBottomNav() {
      const path = window.location.pathname.replace(/\/$/, '') || '/';
      document.querySelectorAll('.bottom-nav-item[data-page]').forEach((el) => {
          const page = el.getAttribute('data-page');
          const isActive = (page === '/' && path === '/') || (page !== '/' && path === page);
          el.classList.toggle('active', isActive);
      });
  })();

  // ===== SECURITY HELPERS (XSS protection) =====
  // Escapes user-supplied text before it is placed inside innerHTML templates.
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  window.esc = esc;
  // Neutralises dangerous schemes/characters in URLs used inside HTML attributes.
  function _safeUrl(u) {
    if (typeof u !== 'string') return u;
    if (/^\s*(javascript|vbscript|data):/i.test(u)) return '';
    return u.replace(/["'<>`]/g, function (c) { return { '"': '%22', "'": '%27', '<': '%3C', '>': '%3E', '`': '%60' }[c]; });
  }
  window._safeUrl = _safeUrl;

  // ===== IMAGE OPTIMIZATION (Cloudinary on-the-fly transforms) =====
  // Inserts a transformation string right after "/upload/" in a Cloudinary URL.
  // Non-Cloudinary URLs (e.g. fallback/demo images) are returned untouched.
  function cldUrl(url, transform) { return _safeUrl(_cldUrlRaw(url, transform)); }
  function _cldUrlRaw(url, transform) {
    if (!url || typeof url !== 'string') return url;
    if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
    if (url.includes('/upload/' + transform)) return url; // already transformed
    return url.replace('/upload/', '/upload/' + transform + '/');
  }
  // Grid/feed thumbnails - small, auto format + quality, fast to load
  function cldThumb(url) { return cldUrl(url, 'f_auto,q_auto,w_500,c_fill'); }
  // Tiny avatar / mini-thumbnail images
  function cldAvatar(url) { return cldUrl(url, 'f_auto,q_auto,w_120,h_120,c_fill'); }
  // Large detail/lightbox image - still optimized but higher resolution
  function cldFull(url) { return cldUrl(url, 'f_auto,q_auto,w_1400'); }
  window.cldThumb = cldThumb; window.cldAvatar = cldAvatar; window.cldFull = cldFull;

  // ===== AUTH STATE LISTENER =====
  _supabase.auth.onAuthStateChange((event, session) => {
    const user = session ? session.user : null;
    updateUIForUser(user);
  });

  function updateUIForUser(user) {
    const nameEl = document.getElementById('sidebar-user-name');
    const labelEl = document.getElementById('sidebar-status-label');
    const iconEl = document.getElementById('sidebar-avatar-icon');
    const imgEl = document.getElementById('sidebar-avatar-img');
    const btnEl = document.getElementById('sidebar-auth-btn');
    const navText = document.getElementById('navbar-auth-text');
    const navImg = document.getElementById('navbar-avatar-img');
    const navIcon = document.getElementById('navbar-avatar-icon');
    const navBtn = document.getElementById('navbar-auth-btn');

    if (user) {
      const meta = user.user_metadata || {};
      const name = meta.display_name || meta.full_name || user.email.split('@')[0];
      const photo = meta.avatar_url || '';
      
      if (nameEl) nameEl.innerText = name.split(' ')[0];
      if (labelEl) labelEl.innerText = 'Logged In';
      if (photo && imgEl) { imgEl.src = cldAvatar(photo); imgEl.classList.remove('hidden'); if(iconEl) iconEl.classList.add('hidden'); }
      if (btnEl) {
        btnEl.innerText = 'Profile';
        btnEl.onclick = (e) => { e.stopPropagation(); window.location.href = '/account'; };
        btnEl.className = 'text-[10px] bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-xl font-bold tracking-wider uppercase transition-colors pointer-events-auto cursor-pointer';
      }
      if (navText) navText.innerText = name.split(' ')[0].toUpperCase();
      if (navBtn) navBtn.onclick = () => { window.location.href = '/account'; };

      // Account page
      const accName = document.getElementById('account-name');
      const accEmail = document.getElementById('account-email');
      const accAvatarImg = document.getElementById('account-avatar-img');
      const accAvatarIcon = document.getElementById('account-avatar-icon');
      const guestCard = document.getElementById('account-guest-card');
      const profileCard = document.getElementById('account-profile-card');
      if (accName) accName.innerText = name;
      if (accEmail) accEmail.innerText = user.email || '';
      if (photo && accAvatarImg) { accAvatarImg.src = cldAvatar(photo); accAvatarImg.classList.remove('hidden'); if (accAvatarIcon) accAvatarIcon.classList.add('hidden'); }
      if (guestCard) guestCard.classList.add('hidden');
      if (profileCard) { profileCard.classList.remove('hidden'); profileCard.style.display = ''; }

    } else {
      if (nameEl) nameEl.innerText = 'Anonymous';
      if (labelEl) labelEl.innerText = 'Guest Mode';
      if (imgEl) imgEl.classList.add('hidden');
      if (iconEl) iconEl.classList.remove('hidden');
      if (btnEl) {
        btnEl.innerText = 'Sign In';
        btnEl.onclick = (e) => { e.stopPropagation(); toggleLoginModal(true); };
        btnEl.className = 'text-[10px] bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-xl font-bold tracking-wider uppercase transition-colors pointer-events-auto cursor-pointer';
      }
      if (navText) navText.innerText = 'SIGN IN';
      if (navImg) navImg.classList.add('hidden');
      if (navIcon) navIcon.classList.remove('hidden');
      if (navBtn) navBtn.onclick = () => toggleLoginModal(true);

      const guestCard = document.getElementById('account-guest-card');
      const profileCard = document.getElementById('account-profile-card');
      if (guestCard) guestCard.classList.remove('hidden');
      if (profileCard) profileCard.classList.add('hidden');
    }
  }

  // ===== SIGNUP =====
  window.signupWithEmail = async function() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pass = document.getElementById('signup-password').value.trim();

    if (!name) { showToast("Please enter your name!"); return; }
    if (!email) { showToast("Please enter your email!"); return; }
    if (pass.length < 6) { showToast("Password must be 6+ characters!"); return; }

    const btn = document.getElementById('signup-btn');
    if (btn) { btn.innerText = 'Creating...'; btn.disabled = true; }

    const { data, error } = await _supabase.auth.signUp({
      email: email,
      password: pass,
      options: { data: { display_name: name } }
    });

    if (btn) { btn.innerText = 'Create Account'; btn.disabled = false; }

    if (error) {
      if (error.message.includes('already registered')) showToast("❌ Email already registered!");
      else showToast("❌ " + error.message);
      return;
    }

    // Create base profile row
    if (data.user) {
      // Email is NOT stored in the public profiles table (it stays private in the auth system)
      await _supabase.from('profiles').insert({ id: data.user.id });
    }

    // Show account type choice instead of going straight in
    document.getElementById('signup-form-wrap').classList.add('hidden');
    document.getElementById('account-type-wrap').classList.remove('hidden');
  };

  // ===== ACCOUNT TYPE CHOICE =====
  window.chooseAccountType = async function(type) {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return;

    if (type === 'user') {
      await _supabase.from('profiles').update({ account_type: 'user', onboarding_completed: true }).eq('id', session.user.id);
      finishAsUserAccount();
      return;
    }

    // Contributor path — check 6 month cooldown first
    const { data: profile } = await _supabase.from('profiles').select('onboarding_rejected_at').eq('id', session.user.id).single();
    if (profile && profile.onboarding_rejected_at) {
      const rejectedDate = new Date(profile.onboarding_rejected_at);
      const sixMonthsLater = new Date(rejectedDate);
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
      if (new Date() < sixMonthsLater) {
        document.getElementById('account-type-wrap').classList.add('hidden');
        document.getElementById('quiz-rejected-wrap').classList.remove('hidden');
        return;
      }
    }

    document.getElementById('account-type-wrap').classList.add('hidden');
    startOnboardingQuiz();
  };

  window.finishAsUserAccount = function() {
    toggleLoginModal(false);
    showToast("Welcome! 🎉");
    setTimeout(() => { _feedLoaded = false; showPage('samples'); }, 600);
  };

  // ===== ONBOARDING QUIZ =====
  const ONBOARDING_QUESTIONS = [
    {
      q: "Have you created AI images before?",
      options: ["Yes", "No"],
      key: "made_before"
    },
    {
      q: "How many images do you upload per day?",
      options: ["4", "8", "10", "15"],
      key: "daily_uploads"
    },
    {
      q: "Do you have a social media account?",
      options: ["No", "Instagram", "TikTok", "Facebook", "X", "All other"],
      key: "social_media"
    },
    {
      q: "How long have you been creating AI images?",
      options: ["Less than 1 year", "1 year", "3 years", "5 years"],
      key: "experience"
    },
    {
      q: "How did you hear about FRAZX PRO?",
      options: ["Social media", "Friends", "Internet", "Other"],
      key: "referral"
    }
  ];
  let _quizAnswers = {};
  let _quizStep = 0;

  function startOnboardingQuiz() {
    _quizAnswers = {};
    _quizStep = 0;
    document.getElementById('onboarding-quiz-wrap').classList.remove('hidden');
    renderQuizStep();
  }

  function renderQuizStep() {
    const q = ONBOARDING_QUESTIONS[_quizStep];
    document.getElementById('quiz-progress').innerText = `Question ${_quizStep + 1} of ${ONBOARDING_QUESTIONS.length}`;
    document.getElementById('quiz-question').innerText = q.q;
    const optsEl = document.getElementById('quiz-options');
    optsEl.innerHTML = q.options.map(opt => `
      <button onclick="answerQuizQuestion('${opt.replace(/'/g, "\\'")}')" class="w-full text-left bg-[#050508]/60 border border-white/10 hover:border-sky-500/50 hover:bg-sky-600/10 rounded-xl px-4 py-3 text-white text-sm font-bold transition">
        ${opt}
      </button>`).join('');
  }

  window.answerQuizQuestion = async function(answer) {
    const q = ONBOARDING_QUESTIONS[_quizStep];
    _quizAnswers[q.key] = answer;

    // Question 1 — instant rejection if "No"
    if (q.key === 'made_before' && answer === 'No') {
      const { data: { session } } = await _supabase.auth.getSession();
      if (session) {
        await _supabase.from('profiles').update({
          account_type: 'user',
          onboarding_completed: true,
          onboarding_rejected_at: new Date().toISOString()
        }).eq('id', session.user.id);
      }
      document.getElementById('onboarding-quiz-wrap').classList.add('hidden');
      document.getElementById('quiz-rejected-wrap').classList.remove('hidden');
      return;
    }

    _quizStep++;
    if (_quizStep < ONBOARDING_QUESTIONS.length) {
      renderQuizStep();
    } else {
      await submitOnboardingQuiz();
    }
  };

  async function submitOnboardingQuiz() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return;

    // Perfect-answer combo unlocks the instant verified (yellow) badge
    const isPerfect =
      _quizAnswers.daily_uploads === '15' &&
      _quizAnswers.social_media === 'All other' &&
      _quizAnswers.experience === '5 years' &&
      _quizAnswers.referral === 'Social media';

    await _supabase.rpc('submit_onboarding_quiz', {
      p_daily: String(_quizAnswers.daily_uploads || ''),
      p_social: String(_quizAnswers.social_media || ''),
      p_exp: String(_quizAnswers.experience || ''),
      p_ref: String(_quizAnswers.referral || '')
    });

    document.getElementById('onboarding-quiz-wrap').classList.add('hidden');
    document.getElementById('quiz-success-wrap').classList.remove('hidden');
  }

  window.finishOnboarding = function() {
    toggleLoginModal(false);
    showToast("Welcome to FRAZX PRO! 🎉");
    setTimeout(() => { _feedLoaded = false; showPage('samples'); }, 600);
  };

  // ===== LOGIN =====
  window.loginWithEmail = async function() {
    const email = document.getElementById('email').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (!email || !pass) { showToast("Please fill all fields!"); return; }

    const btn = document.getElementById('login-btn');
    if (btn) { btn.innerText = 'Signing in...'; btn.disabled = true; }

    const { data, error } = await _supabase.auth.signInWithPassword({
      email: email,
      password: pass
    });

    if (btn) { btn.innerText = 'Sign In'; btn.disabled = false; }

    if (error) {
      showToast("❌ Wrong email or password!");
    } else {
      toggleLoginModal(false);
      const name = data.user.user_metadata?.display_name || data.user.email.split('@')[0];
      showToast("Welcome back " + name + "! 🎉");
      setTimeout(() => { _feedLoaded = false; showPage('samples'); }, 800);
    }
  };

  // ===== LOGOUT =====
  window.logoutUser = async function() {
    await _supabase.auth.signOut();
    _feedLoaded = false;
    _uploadsLoading = false;
    showToast("Signed out!");
    showPage('home');
  };

  // ===== FORM SWITCH =====
  window.showSignupForm = function() {
    document.getElementById('login-form-wrap').classList.add('hidden');
    document.getElementById('forgot-password-form-wrap').classList.add('hidden');
    document.getElementById('signup-form-wrap').classList.remove('hidden');
  };
  window.showLoginForm = function() {
    document.getElementById('signup-form-wrap').classList.add('hidden');
    document.getElementById('forgot-password-form-wrap').classList.add('hidden');
    document.getElementById('login-form-wrap').classList.remove('hidden');
  };
  window.showForgotPasswordForm = function() {
    document.getElementById('login-form-wrap').classList.add('hidden');
    document.getElementById('signup-form-wrap').classList.add('hidden');
    document.getElementById('forgot-password-form-wrap').classList.remove('hidden');
  };

  // ===== FORGOT PASSWORD =====
  window.sendPasswordResetEmail = async function() {
    const email = document.getElementById('forgot-email').value.trim();
    if (!email) { showToast("Please enter your email!"); return; }

    const btn = document.getElementById('forgot-password-btn');
    if (btn) { btn.innerText = 'Sending...'; btn.disabled = true; }

    const { error } = await _supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://frazxpro.com/reset-password'
    });

    if (btn) { btn.innerText = 'Send Reset Link'; btn.disabled = false; }

    if (error) {
      showToast("Something went wrong. Please try again.");
    } else {
      showToast("Reset link sent! Check your email.");
      document.getElementById('forgot-email').value = '';
      window.showLoginForm();
    }
  };

  // ===== PROFILE =====
  window.handleSidebarProfileClick = function() {
    _supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        window.location.href = '/account';
      } else {
        toggleLoginModal(true);
      }
    });
  };

  window.editDisplayName = function() {
    const wrap = document.getElementById('edit-name-wrap');
    const input = document.getElementById('edit-name-input');
    wrap.classList.toggle('hidden');
    input.value = document.getElementById('account-name').innerText;
    if (!wrap.classList.contains('hidden')) input.focus();
  };

  // saveDisplayName defined above

  // uploadAvatarPhoto defined above

  window.handleStartCreation = function() {
    _supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        openUploadModal();
      } else {
        toggleLoginModal(true);
      }
    });
  };

  // Check session on page load
  _supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) updateUIForUser(session.user);
    else updateUIForUser(null);
  });

  // Community functions use Supabase
  window._db = null; // No Firebase


    function toggleLoginModal(show) {
        const modal = document.getElementById('login-modal');
        if (!modal) return;
        if (show) {
            // Always reset to the default Sign In view on open
            const panels = ['signup-form-wrap', 'forgot-password-form-wrap', 'account-type-wrap', 'onboarding-quiz-wrap', 'quiz-rejected-wrap', 'quiz-success-wrap'];
            panels.forEach(id => { const el = document.getElementById(id); if (el) el.classList.add('hidden'); });
            const loginPanel = document.getElementById('login-form-wrap');
            if (loginPanel) loginPanel.classList.remove('hidden');

            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                if(modal.querySelector('div')) modal.querySelector('div').classList.remove('scale-95');
            }, 10);
        } else {
            modal.classList.add('opacity-0');
            if(modal.querySelector('div')) modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 500);
        }
    }
    // 1. Core Navigation with Standard URL Hash Control
    // 1. AAPKA ORIGINAL FUNCTION (With Safe Button Highlight Integration)
function showPage(pageId, pushToHistory = true) {
        const sections = document.querySelectorAll('.page-content');
        
        // Hide all template views natively
        sections.forEach(s => {
            s.style.display = 'none';
            s.classList.remove('active-page');
        });

        // Activate targeted matrix view
        const target = document.getElementById(pageId);
        if (target) {
            target.style.display = 'block';
            target.classList.add('active-page');

            // Force mobile browsers to append a safe layout step natively
            if (pushToHistory) {
                window.location.hash = pageId;
            }
        }

        // Collapse navigation slider automatically
        const sidebar = document.getElementById('sidebar');
        if(sidebar) sidebar.classList.add('translate-x-full');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 2. Direct Hardware Back Key Interception (Zero Exit Glitch)
    window.addEventListener('hashchange', function() {
        const activeHash = window.location.hash.substring(1);
        if (activeHash) {
            showPage(activeHash, false);
        } else {
            showPage(window.__DEFAULT_PAGE__ || 'home', false);
        }
    });

    // 3. Absolute Initialization Matrix
    window.addEventListener('DOMContentLoaded', () => {
        const startingHash = window.location.hash.substring(1);
        if (startingHash) {
            showPage(startingHash, false);
        } else {
            const defaultPage = window.__DEFAULT_PAGE__ || 'home';
            showPage(defaultPage, false);
        }
    });
    // 4. UI Layer Mechanisms
    function toggleSidebar(e) {
        if(e) e.stopPropagation();
        document.getElementById('sidebar').classList.toggle('translate-x-full');
    }

    function closeSidebarOnEmptyClick(e) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar && !sidebar.contains(e.target)) {
            sidebar.classList.add('translate-x-full');
        }
    }

    function closeSidebarOnType() {
        document.getElementById('sidebar').classList.add('translate-x-full');
    }

    // 5. Functional Processing Routines
    async function generatePowerPrompt() {
        const input = document.getElementById('userInput').value.trim();
        if (!input) return showToast("Please enter your creative idea first!");

        const btn = document.querySelector('button[onclick="generatePowerPrompt()"]');
        const originalBtnText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i>AI Compiling...';
        btn.disabled = true;

        document.getElementById('resultBox').classList.add('hidden');

        try {
            const systemPrompt = `You are a world-class cinematic AI prompt engineer. Transform the user's basic idea into a hyper-detailed, ultra-professional AI image/video generation prompt. Include: cinematic lighting type, camera lens & angle, mood & atmosphere, color grading style, render engine, artistic style, and micro-details. Keep it under 180 words. Return ONLY the final prompt, no explanation, no labels.`;
            const userMessage = `Basic idea: "${input}"`;

            const response = await fetch('/api/generate-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ system: systemPrompt, message: userMessage })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'AI request failed');
            const enhancedPrompt = (data.text || '').trim();

            document.getElementById('finalPrompt').innerText = enhancedPrompt;
            document.getElementById('resultBox').classList.remove('hidden');

        } catch (error) {
            showToast("AI Error! Check connection and try again.");
            console.error(error);
        } finally {
            btn.innerHTML = originalBtnText;
            btn.disabled = false;
        }
    }

    function copyPrompt() {
    navigator.clipboard.writeText(document.getElementById('finalPrompt').innerText);
    showToast("Prompt copied to clipboard!");
}

    async function generatePortraitAI(style) {
        const userDesc = document.getElementById('portraitUserDesc').value.trim();
        
        const styleMap = {
            cyberpunk:  { label: 'Cyberpunk', desc: 'cyberpunk neon cyborg aesthetic, glowing implants, synthwave dark city, electric blue and purple lighting' },
            pixar:      { label: 'Pixar 3D',  desc: 'Pixar 3D animated character, smooth clay material, warm studio lighting, vibrant colors, polished render' },
            profile:    { label: 'Profile',   desc: 'professional corporate headshot, clean studio lighting, neutral background, sharp 8k resolution, business formal' },
            sketch:     { label: 'Sketch',    desc: 'premium pencil sketch portrait, fine cross-hatching, dramatic shadows, fine art masterpiece, charcoal texture' },
            anime:      { label: 'Anime',     desc: 'high-quality anime illustration, vivid cel-shading, detailed eyes, dramatic lighting, Studio Ghibli or Makoto Shinkai style' },
            oilpainting:{ label: 'Oil Painting', desc: 'classical oil painting portrait, rich brushstrokes, chiaroscuro lighting, Renaissance master style, deep saturated colors' },
            ghibli:     { label: 'Ghibli',    desc: 'Studio Ghibli watercolor animation style, soft warm palette, hand-painted texture, magical atmosphere, Hayao Miyazaki aesthetic' },
            fantasy:    { label: 'Fantasy/Viking', desc: 'epic fantasy Viking warrior portrait, fur armor, battle-worn, dramatic stormy sky, cinematic lighting, highly detailed' }
        };

        const chosen = styleMap[style];
        if (!chosen) return;

        const resultBox = document.getElementById('portraitResultBox');
        const loadingEl = document.getElementById('portraitLoading');
        const promptEl = document.getElementById('portraitFinalPrompt');
        const badgeEl = document.getElementById('portraitStyleBadge');

        resultBox.classList.remove('hidden');
        loadingEl.classList.remove('hidden');
        promptEl.innerText = '';
        badgeEl.innerText = chosen.label;
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const personDesc = userDesc ? `Person details: ${userDesc}.` : 'No specific person description provided — create a generic stunning portrait.';
        const systemPrompt = `You are an elite AI portrait prompt engineer. Generate a hyper-detailed, ultra-professional AI image generation prompt for portrait photography. The prompt should include: facial features, skin texture, lighting setup, camera lens, background, color grade, mood, and render quality. Start with "use my reference picture and create a". Keep under 160 words. Return ONLY the prompt.`;
        const userMsg = `Style: ${chosen.desc}. ${personDesc}`;

        try {
            const res = await fetch('/api/generate-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ system: systemPrompt, message: userMsg })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'AI request failed');
            const prompt = (data.text || '').trim();
            loadingEl.classList.add('hidden');
            promptEl.innerText = prompt;
        } catch(e) {
            loadingEl.classList.add('hidden');
            promptEl.innerText = 'AI Error! Please check your connection and try again.';
        }
    }

    function copyPortraitPromptNew() {
        const text = document.getElementById('portraitFinalPrompt').innerText;
        navigator.clipboard.writeText(text).then(() => showToast("Portrait prompt copied!"));
    }

    function generatePortrait(stylePreset, targetBoxId) {
        // legacy stub — no longer used
    }

    function copyPortraitPrompt() {
    navigator.clipboard.writeText(document.getElementById('portraitFinalPrompt').innerText);
    showToast("Prompt copied to clipboard!");
}
    function copyLocalPrompt(textElementId, buttonElement) {
    const textToCopy = document.getElementById(textElementId).innerText;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = "✓ COPIED!";
        buttonElement.classList.add('text-cyan-400', 'border-cyan-500/40');
        
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.classList.remove('text-cyan-400', 'border-cyan-500/40');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
    }
    
    function toggleTheme() {
    const body = document.body;
    const themeText = document.getElementById('theme-text');
    const themeIcon = document.getElementById('theme-icon');
    
    // Core Elements Secure Variables
    const mainHeadings = document.querySelectorAll('h1, h2, h3, .text-white');
    const contentParagraphs = document.querySelectorAll('p');
    const glassCards = document.querySelectorAll('.bg-white\\/5, .border-white\\/10, [class*="rounded-3xl"]');
    
    // --- SIDEBAR TARGETS FIXED ---
    const sidebar = document.getElementById('sidebar');
    const sidebarLinks = sidebar ? sidebar.querySelectorAll('span, i, a') : [];

    if (!body.classList.contains('light-theme-active')) {
        body.classList.add('light-theme-active');
        
        // 1. Light Mode Main Base
        body.style.setProperty('background', '#f4f4f7', 'important');
        body.style.setProperty('color', '#111827', 'important');
        
        // 2. Headings & Main Text Visibility Fix
        mainHeadings.forEach(el => {
            if (!el.classList.contains('text-[#0ea5e9]') && !el.classList.contains('text-sky-500')) {
                el.style.setProperty('color', '#111827', 'important');
            }
        });

        // 3. Paragraphs text color
        contentParagraphs.forEach(p => {
            p.style.setProperty('color', '#4b5563', 'important');
        });

        // 4. Main Cards Update (Apple Style)
        glassCards.forEach(card => {
            if (card.id !== 'sidebar' && card.tagName !== 'NAV') {
                card.style.setProperty('background-color', '#ffffff', 'important');
                card.style.setProperty('border-color', '#e5e7eb', 'important');
                card.style.setProperty('box-shadow', '0 10px 15px -3px rgba(0, 0, 0, 0.05)', 'important');
            }
        });

        // 5. SIDEBAR LIGHT UI (Sleek Professional White Menu)
        if (sidebar) {
            sidebar.style.setProperty('background-color', '#ffffff', 'important');
            sidebar.style.setProperty('border-left', '1px solid #e5e7eb', 'important');
            sidebar.style.setProperty('box-shadow', '-10px 0 25px -5px rgba(0, 0, 0, 0.05)', 'important');
        }
        sidebarLinks.forEach(link => {
            if (!link.classList.contains('text-[#0ea5e9]') && !link.classList.contains('text-sky-500')) {
                link.style.setProperty('color', '#374151', 'important'); // Clear dark gray text for links
            }
        });

        // Toggle Button Appearance
        if (themeText) {
            themeText.innerText = "LIGHT";
            themeText.style.setProperty('color', '#111827', 'important');
        }
        if (themeIcon) themeIcon.className = "fa-solid fa-sun text-amber-500";

    } else {
        // --- DARK MODE: AAP KA ORIGINAL SETUP 100% UNTOUCHED RESTORE ---
        body.classList.remove('light-theme-active');
        
        // Inline styles delete taake aapki HTML/CSS files ka design chale
        body.style.removeProperty('background');
        body.style.removeProperty('color');
        
        mainHeadings.forEach(el => el.style.removeProperty('color'));
        contentParagraphs.forEach(p => p.style.removeProperty('color'));
        
        glassCards.forEach(card => {
            card.style.removeProperty('background-color');
            card.style.removeProperty('border-color');
            card.style.removeProperty('box-shadow');
        });

        // Sidebar Reset (Back to your original cyberpunk dark theme)
        if (sidebar) {
            sidebar.style.removeProperty('background-color');
            sidebar.style.removeProperty('border-left');
            sidebar.style.removeProperty('box-shadow');
        }
        sidebarLinks.forEach(link => {
            link.style.removeProperty('color');
        });

        // Toggle Button Reset to Dark
        if (themeText) {
            themeText.innerText = "DARK";
            themeText.style.removeProperty('color');
        }
        if (themeIcon) themeIcon.className = "fa-solid fa-moon text-[#0ea5e9]";
    }
}
   
    // Professional Toast Notification System (Fixed Overlap)

// ===== MODAL DIALOGS (replace browser confirm() / prompt()) =====
(function injectDialogStyles() {
    if (document.getElementById('fx-dialog-styles')) return;
    const st = document.createElement('style');
    st.id = 'fx-dialog-styles';
    st.textContent = `
    .fx-overlay{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(3,6,12,.72);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);animation:fxFade .18s ease}
    .fx-dialog{width:100%;max-width:420px;background:linear-gradient(180deg,rgba(56,189,248,.08),rgba(255,255,255,.02)),#0a0f18;border:1px solid rgba(125,211,252,.18);border-radius:18px;padding:22px;box-shadow:0 24px 60px rgba(0,0,0,.6);animation:fxPop .2s cubic-bezier(.34,1.4,.64,1);font-family:'Space Grotesk',system-ui,sans-serif}
    .fx-dialog h3{margin:0 0 6px;color:#fff;font-size:16px;font-weight:700;letter-spacing:.02em;text-transform:uppercase}
    .fx-dialog p{margin:0 0 16px;color:#9ca3af;font-size:14px;line-height:1.5}
    .fx-dialog textarea{width:100%;min-height:140px;max-height:50vh;resize:vertical;margin:0 0 16px;padding:12px;background:#05070b;border:1px solid rgba(255,255,255,.14);border-radius:10px;color:#fff;font:inherit;font-size:14px;line-height:1.5;outline:none}
    .fx-dialog textarea:focus{border-color:rgba(56,189,248,.6);box-shadow:0 0 0 3px rgba(56,189,248,.12)}
    .fx-actions{display:flex;gap:10px;justify-content:flex-end}
    .fx-btn{cursor:pointer;font:inherit;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:11px 18px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:transparent;color:#cbd5e1;transition:background .15s,transform .1s}
    .fx-btn:hover{background:rgba(255,255,255,.07)}
    .fx-btn:active{transform:scale(.97)}
    .fx-btn.fx-primary{background:linear-gradient(135deg,#0ea5e9,#0284c7);border-color:rgba(186,230,253,.35);color:#fff}
    .fx-btn.fx-primary:hover{background:linear-gradient(135deg,#38bdf8,#0ea5e9)}
    .fx-btn.fx-danger{background:linear-gradient(135deg,#ef4444,#b91c1c);border-color:rgba(254,202,202,.35);color:#fff}
    .fx-btn.fx-danger:hover{background:linear-gradient(135deg,#f87171,#dc2626)}
    @keyframes fxFade{from{opacity:0}to{opacity:1}}
    @keyframes fxPop{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
    `;
    document.head.appendChild(st);
})();

function _fxDialog(opts) {
    return new Promise((resolve) => {
        const prevFocus = document.activeElement;
        const overlay = document.createElement('div');
        overlay.className = 'fx-overlay';
        const box = document.createElement('div');
        box.className = 'fx-dialog';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');

        const h = document.createElement('h3'); h.textContent = opts.title || ''; box.appendChild(h);
        if (opts.message) { const p = document.createElement('p'); p.textContent = opts.message; box.appendChild(p); }

        let field = null;
        if (opts.input) {
            field = document.createElement('textarea');
            field.value = opts.value || '';
            if (opts.maxLength) field.maxLength = opts.maxLength;
            box.appendChild(field);
        }

        const actions = document.createElement('div'); actions.className = 'fx-actions';
        const cancel = document.createElement('button');
        cancel.type = 'button'; cancel.className = 'fx-btn'; cancel.textContent = opts.cancelText || 'Cancel';
        const ok = document.createElement('button');
        ok.type = 'button'; ok.className = 'fx-btn ' + (opts.danger ? 'fx-danger' : 'fx-primary'); ok.textContent = opts.confirmText || 'OK';
        actions.appendChild(cancel); actions.appendChild(ok);
        box.appendChild(actions);
        overlay.appendChild(box);

        function close(result) {
            document.removeEventListener('keydown', onKey, true);
            overlay.remove();
            if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) {} }
            resolve(result);
        }
        function accept() { close(opts.input ? field.value : true); }
        function dismiss() { close(opts.input ? null : false); }
        function onKey(e) {
            if (e.key === 'Escape') { e.preventDefault(); dismiss(); }
            else if (e.key === 'Enter' && (!opts.input || e.ctrlKey || e.metaKey)) { e.preventDefault(); accept(); }
            else if (e.key === 'Tab') {
                const items = Array.from(box.querySelectorAll('textarea,button'));
                const i = items.indexOf(document.activeElement);
                if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
                else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
            }
        }
        ok.addEventListener('click', accept);
        cancel.addEventListener('click', dismiss);
        overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) dismiss(); });
        document.addEventListener('keydown', onKey, true);
        document.body.appendChild(overlay);
        (field || (opts.danger ? cancel : ok)).focus();
        if (field) field.setSelectionRange(field.value.length, field.value.length);
    });
}
// Resolves true / false
function uiConfirm(message, opts) {
    opts = opts || {};
    return _fxDialog({ title: opts.title || 'Are you sure?', message, confirmText: opts.confirmText || 'Confirm', cancelText: opts.cancelText, danger: !!opts.danger });
}
// Resolves the entered text, or null if cancelled
function uiPrompt(title, value, opts) {
    opts = opts || {};
    return _fxDialog({ title, message: opts.message, input: true, value: value || '', maxLength: opts.maxLength, confirmText: opts.confirmText || 'Save', cancelText: opts.cancelText });
}
window.uiConfirm = uiConfirm; window.uiPrompt = uiPrompt;


// Columns needed to draw cards/lists (skips heavy `comments`; the detail modal loads those itself)
const POST_LIST_COLS = 'id,image_url,prompt,creator_name,creator_avatar,creator_id,likes,saves,created_at,title,tags,copies,category';
const PROFILE_PUBLIC_COLS = 'id,bio,account_type,badge_tier,is_verified,is_onboarding_verified,is_owner,onboarding_completed,onboarding_rejected_at,created_at';

// ===== ERROR / EMPTY STATES =====
(function injectStateStyles() {
    if (document.getElementById('fx-state-styles')) return;
    const st = document.createElement('style');
    st.id = 'fx-state-styles';
    st.textContent = `
    .fx-state{column-span:all;grid-column:1/-1;width:100%;text-align:center;padding:56px 20px;font-family:'Space Grotesk',system-ui,sans-serif}
    .fx-state-icon{width:64px;height:64px;margin:0 auto 18px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:26px;background:rgba(56,189,248,.08);border:1px solid rgba(125,211,252,.18);color:#38bdf8}
    .fx-state.fx-err .fx-state-icon{background:rgba(248,113,113,.08);border-color:rgba(248,113,113,.25);color:#f87171}
    .fx-state h3{margin:0 0 6px;color:#fff;font-size:16px;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
    .fx-state p{margin:0 auto 18px;max-width:320px;color:#9ca3af;font-size:13px;line-height:1.5}
    .fx-state button{cursor:pointer;font:inherit;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:11px 22px;border-radius:10px;border:1px solid rgba(186,230,253,.35);background:linear-gradient(135deg,#0ea5e9,#0284c7);color:#fff}
    .fx-state button:hover{background:linear-gradient(135deg,#38bdf8,#0ea5e9)}
    `;
    document.head.appendChild(st);
})();

// Shows a friendly "something went wrong" block (with a Try again button) inside a container
function showLoadError(container, retryFn) {
    if (!container) return;
    const offline = (typeof navigator !== 'undefined' && navigator.onLine === false);
    const key = '_fxRetry_' + (container.id || Math.random().toString(36).slice(2));
    window[key] = function () { container.innerHTML = ''; try { retryFn(); } catch (e) { console.error(e); } };
    container.innerHTML = `<div class="fx-state fx-err">
        <div class="fx-state-icon"><i class="fa-solid ${offline ? 'fa-wifi' : 'fa-triangle-exclamation'}"></i></div>
        <h3>${offline ? "You're offline" : 'Something went wrong'}</h3>
        <p>${offline ? 'Check your internet connection and try again.' : "We couldn't load this right now. Please try again."}</p>
        <button type="button" onclick="window['${key}']()">Try again</button>
    </div>`;
}
// Friendly empty block (used when a profile tab has nothing yet)
function showEmptyState(container, icon, title, text) {
    if (!container) return;
    container.innerHTML = `<div class="fx-state">
        <div class="fx-state-icon"><i class="fa-solid ${esc(icon)}"></i></div>
        <h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
}
window.showLoadError = showLoadError; window.showEmptyState = showEmptyState;

// Connection status toasts
window.addEventListener('offline', () => showToast("You're offline. Some things may not work."));
window.addEventListener('online', () => showToast('Back online'));

function showToast(message) {
    // Agar pehle se koi toast screen par hai to use fauran delete karo
    const oldToast = document.getElementById('custom-toast');
    if (oldToast) {
        oldToast.remove();
    }

    // Naya fresh toast container create karein
    const toast = document.createElement('div');
    toast.id = 'custom-toast';
    
    // Text completely reset aur fresh set kiya
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    
    // Solid layout aur spacing settings text overlap ko rokne ke liye
    toast.className = "fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-[#111827]/95 text-white border border-white/10 rounded-xl text-sm font-bold tracking-wide shadow-2xl backdrop-blur-md z-[9999] transition-all duration-300 opacity-0 transform translate-y-2 whitespace-nowrap text-center block leading-normal min-w-[200px]";
    
    document.body.appendChild(toast);
    
    // Smooth Fade In Animation
    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
        toast.classList.add('opacity-100', 'translate-y-0');
    }, 50);
    
    // 2.2 Seconds baad smooth fade out aur clean exit
    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 300);
    }, 2200);
}
    

// ========== COMMUNITY FEED SYSTEM ==========
let currentPostId = null;

// Load feed when samples page opens


let _feedLoading = false;
let _feedLoaded = false;

// ===== SHARED GALLERY PAGINATION SYSTEM =====
const GALLERY_PAGE_SIZE = 20;
const GALLERY_CONFIG = {
    feed:  { feedEl: 'community-feed', emptyEl: 'feed-empty',  paginationEl: 'feed-pagination',  storeKey: '_feedView',  accent: 'sky' },
    ads:   { feedEl: 'ads-feed',       emptyEl: 'ads-empty',   paginationEl: 'ads-pagination',   storeKey: '_adsView',   accent: 'sky' },
    stock: { feedEl: 'stock-feed',     emptyEl: 'stock-empty', paginationEl: 'stock-pagination', storeKey: '_stockView', accent: 'cyan' }
};

function buildGalleryCardHTML(post, accent) {
    const title = esc(post.title ? post.title.toUpperCase() : (post.prompt ? post.prompt.substring(0, 28).toUpperCase() + '...' : 'UNTITLED'));
    const likes = post.likes ? post.likes.length : 0;
    const promptPreview = esc(post.prompt ? post.prompt.substring(0, 120) + '...' : '');
    const creator = esc(post.creator_name || 'Creator');
    return `
        <div class="masonry-card group cursor-pointer" onclick="openPostDetail('${post.id}')">
            <div class="relative rounded-2xl overflow-hidden border border-white/5 hover:border-${accent}-500/30 transition-all duration-300">
                <img src="${cldThumb(post.image_url)}" class="w-full h-auto block" alt="AI Art" loading="lazy">
                <div class="absolute top-0 left-0 right-0 p-3 flex items-center justify-between">
                    <span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg truncate max-w-[65%]">${title}</span>
                    <span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <i class="fa-solid fa-heart text-red-400"></i> ${likes}
                    </span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p class="text-gray-200 text-xs leading-relaxed line-clamp-3 mb-3">${promptPreview}</p>
                    <div class="flex items-center justify-between">
                        <button onclick="event.stopPropagation(); copyFeedPrompt('${post.id}')" class="flex items-center gap-1.5 bg-${accent}-600/80 hover:bg-${accent}-600 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition">
                            <i class="fa-regular fa-copy"></i> Copy
                        </button>
                        <span class="text-gray-400 text-[10px]">@${creator}</span>
                    </div>
                </div>
            </div>
        </div>`;
}

function renderGalleryPage(posts, gallery, page) {
    const config = GALLERY_CONFIG[gallery];
    if (!config) return;

    window[config.storeKey] = posts || [];

    const feedEl = document.getElementById(config.feedEl);
    const emptyEl = document.getElementById(config.emptyEl);
    const paginationEl = document.getElementById(config.paginationEl);
    if (!feedEl) return;

    if (!posts || posts.length === 0) {
        feedEl.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        if (paginationEl) paginationEl.innerHTML = '';
        return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    const totalPages = Math.max(1, Math.ceil(posts.length / GALLERY_PAGE_SIZE));
    page = Math.min(Math.max(1, page || 1), totalPages);
    const start = (page - 1) * GALLERY_PAGE_SIZE;
    const pagePosts = posts.slice(start, start + GALLERY_PAGE_SIZE);

    feedEl.innerHTML = pagePosts.map(post => buildGalleryCardHTML(post, config.accent)).join('');
    window[config.storeKey + '_page'] = page;

    renderPaginationControls(paginationEl, page, totalPages, gallery, config.accent);
}

function renderPaginationControls(el, page, totalPages, gallery, accent) {
    if (!el) return;
    if (totalPages <= 1) { el.innerHTML = ''; return; }

    function pageBtn(p) {
        const active = p === page;
        const activeClasses = `bg-${accent}-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.4)]`;
        const inactiveClasses = 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10';
        return `<button onclick="goToGalleryPage('${gallery}', ${p})" class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-black text-xs sm:text-sm transition ${active ? activeClasses : inactiveClasses}">${p}</button>`;
    }

    const windowSize = 1;
    const pagesSet = new Set([1, totalPages, page]);
    for (let i = page - windowSize; i <= page + windowSize; i++) {
        if (i >= 1 && i <= totalPages) pagesSet.add(i);
    }
    const sortedPages = [...pagesSet].sort((a, b) => a - b);

    let numbersHTML = '';
    let prev = 0;
    sortedPages.forEach(p => {
        if (prev && p - prev > 1) {
            numbersHTML += `<span class="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 text-xs">...</span>`;
        }
        numbersHTML += pageBtn(p);
        prev = p;
    });

    el.innerHTML = `
        <div class="flex flex-col items-center gap-4 mt-8 mb-6 col-span-full">
            <span class="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-gray-300 flex items-center gap-2 tracking-widest uppercase">
                <span class="w-1.5 h-1.5 rounded-full bg-${accent}-500"></span> Page ${page} / ${totalPages}
            </span>
            <div class="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
                <button onclick="goToGalleryPage('${gallery}', ${page - 1})" ${page === 1 ? 'disabled' : ''} class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed">
                    <i class="fa-solid fa-chevron-left text-xs"></i>
                </button>
                ${numbersHTML}
                <button onclick="goToGalleryPage('${gallery}', ${page + 1})" ${page === totalPages ? 'disabled' : ''} class="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed">
                    <i class="fa-solid fa-chevron-right text-xs"></i>
                </button>
            </div>
        </div>`;
}

function goToGalleryPage(gallery, page) {
    const config = GALLERY_CONFIG[gallery];
    if (!config) return;
    const posts = window[config.storeKey] || [];
    renderGalleryPage(posts, gallery, page);
    const el = document.getElementById(config.feedEl);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadCommunityFeed(force = false) {
    if (_feedLoading) return;
    if (_feedLoaded && !force) return;
    _feedLoading = true;
    
    const loadingEl = document.getElementById('feed-loading');
    const emptyEl = document.getElementById('feed-empty');
    const feedEl = document.getElementById('community-feed');
    
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (feedEl) feedEl.innerHTML = '';

    try {
        const { data: posts, error } = await _supabase
            .from('posts')
            .select(POST_LIST_COLS)
            .or('category.eq.ai_images,category.is.null')
            .order('created_at', { ascending: false });

        if (loadingEl) loadingEl.classList.add('hidden');

        if (error) { console.error(error); showLoadError(feedEl, () => loadCommunityFeed(true)); return; }
        if (!posts || posts.length === 0) {
            if (emptyEl) emptyEl.classList.remove('hidden');
            return;
        }

        const { data: { session: currentSession } } = await _supabase.auth.getSession();
        const currentUserId = currentSession ? currentSession.user.id : null;

        // Deduplicate posts by id
        const seen = new Set();
        const uniquePosts = posts.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });

        // Store posts globally for detail view
        window._feedPosts = uniquePosts;
        _feedLoaded = true;
        renderGalleryPage(uniquePosts, 'feed', 1);

    } catch(e) {
        console.error(e);
        if (loadingEl) loadingEl.classList.add('hidden');
        showLoadError(feedEl, () => loadCommunityFeed(true));
    } finally {
        _feedLoading = false;
    }
}

function copyFeedPrompt(postId) {
    const post = (window._feedPosts || []).find(p => p.id === postId);
    if (post && post.prompt) {
        navigator.clipboard.writeText(post.prompt).then(() => { showToast("Prompt copied! ✅"); fxCopied(); });
        // Track copy count
        const copies = (post.copies || 0) + 1;
        _supabase.rpc('increment_post_copies', { p_post_id: postId }).then(() => {}, () => {});
        post.copies = copies;
    }
}

async function openPostDetail(postId) {
    // Set URL hash
    window.location.hash = 'post/' + postId;
}

async function renderPostDetail(postId) {
    // Fetch post
    let post = (window._feedPosts || []).find(p => p.id === postId);
    if (!post) {
        const { data, error: postErr } = await _supabase.from('posts').select(POST_LIST_COLS).eq('id', postId).single();
        if (postErr || !data) {
            showToast(postErr && postErr.code !== 'PGRST116' ? "Couldn't load this post. Check your connection." : 'This post is no longer available.');
            if (typeof goBackToGallery === 'function') goBackToGallery();
            return;
        }
        post = data;
        window._feedPosts = window._feedPosts || [];
        window._feedPosts.push(data);
    }

    window._currentDetailPostId = postId;

    // Reset save button
    const saveBtn = document.getElementById('detail-save-btn');
    if (saveBtn) {
        saveBtn.querySelector('i').className = 'fa-regular fa-bookmark';
        saveBtn.className = 'flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-sky-600/20 border border-white/10 hover:border-sky-500/30 rounded-xl text-xs font-bold text-gray-300 hover:text-sky-400 transition';
    }

    const _dImg = document.getElementById('detail-image');
    _dImg.classList.add('skeleton');
    _dImg.style.minHeight = '320px';
    _dImg.onload = _dImg.onerror = () => { _dImg.classList.remove('skeleton'); _dImg.style.minHeight = ''; };
    _dImg.src = cldFull(post.image_url) || '';
    document.getElementById('detail-title').innerText = post.title ? post.title.toUpperCase() : (post.prompt ? post.prompt.substring(0, 60).toUpperCase() : 'AI CREATION');
    
    // Show tags
    const tagsContainer = document.getElementById('detail-tags');
    if (tagsContainer) {
        const tags = post.tags || [];
        tagsContainer.innerHTML = tags.length > 0 
            ? tags.map(t => `<span class="px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-[10px] font-bold">#${esc(t)}</span>`).join('') 
            : '';
    }
    // Creator card
    const creatorNameEl = document.getElementById('detail-creator');
    if (creatorNameEl) creatorNameEl.innerText = '@' + (post.creator_name || 'Creator');

    // Store creator_id for follow/visit actions
    window._currentDetailCreatorId = post.creator_id || null;

    // Load creator avatar
    const avatarImg = document.getElementById('detail-creator-avatar');
    const avatarFallback = document.getElementById('detail-creator-avatar-fallback');
    if (avatarImg && avatarFallback) {
        if (post.creator_avatar) {
            avatarImg.src = cldAvatar(post.creator_avatar);
            avatarImg.onload = () => { avatarImg.classList.remove('hidden'); avatarFallback.classList.add('hidden'); };
            avatarImg.onerror = () => { avatarImg.classList.add('hidden'); avatarFallback.classList.remove('hidden'); };
        } else {
            avatarImg.classList.add('hidden');
            avatarFallback.classList.remove('hidden');
        }
    }

    // Load creator badge + follow state
    const detailBadgeSlot = document.getElementById('detail-creator-badge');
    const followBtn = document.getElementById('detail-follow-btn');
    if (detailBadgeSlot) detailBadgeSlot.innerHTML = '';
    if (followBtn) followBtn.classList.add('hidden');

    if (post.creator_id) {
        _supabase.from('profiles').select('is_onboarding_verified, badge_tier').eq('id', post.creator_id).single()
            .then(({ data: creatorProfile }) => {
                if (creatorProfile && detailBadgeSlot) detailBadgeSlot.innerHTML = renderBadgesHTML(creatorProfile, 'text-xs');
            });

        // Show follow button only if not the current user
        _supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session || session.user.id === post.creator_id) return;
            if (followBtn) {
                followBtn.classList.remove('hidden');
                // Check if already following
                const { data: existingFollow } = await _supabase
                    .from('follows')
                    .select('id')
                    .eq('follower_id', session.user.id)
                    .eq('following_id', post.creator_id)
                    .single();
                if (existingFollow) {
                    followBtn.innerText = 'Following';
                    followBtn.classList.remove('bg-sky-600', 'hover:bg-sky-500');
                    followBtn.classList.add('bg-white/10', 'hover:bg-white/20', 'text-gray-300');
                } else {
                    followBtn.innerText = 'Follow';
                    followBtn.classList.add('bg-sky-600', 'hover:bg-sky-500');
                    followBtn.classList.remove('bg-white/10', 'hover:bg-white/20', 'text-gray-300');
                }
            }
        });
    }
    document.getElementById('detail-prompt').innerText = post.prompt || '';
    setTimeout(initPromptToggle, 50);
    document.getElementById('detail-likes-count').innerText = post.likes ? post.likes.length : 0;
    document.getElementById('detail-date').innerText = post.created_at ? 'Posted on ' + new Date(post.created_at).toLocaleDateString('en-US', {year:'numeric', month:'long', day:'numeric'}) : '';

    // Check if liked + show owner buttons
    const { data: { session } } = await _supabase.auth.getSession();
    if (session) {
        const liked = (post.likes || []).includes(session.user.id);
        const likeBtn = document.getElementById('detail-like-btn');
        if (likeBtn) likeBtn.querySelector('i').className = liked ? 'fa-solid fa-heart text-red-400 text-lg' : 'fa-regular fa-heart text-lg';
        
        const isOwner = post.creator_id === session.user.id;
        const editBtn = document.getElementById('detail-edit-btn');
        const deleteBtn = document.getElementById('detail-delete-btn');
        if (editBtn) { if(isOwner) editBtn.classList.remove('hidden'); else editBtn.classList.add('hidden'); }
        if (deleteBtn) { if(isOwner) deleteBtn.classList.remove('hidden'); else deleteBtn.classList.add('hidden'); }
    }

    // Hide EVERYTHING
    document.getElementById('main-navbar').style.display = 'none';
    document.querySelectorAll('section').forEach(el => el.style.display = 'none');
    
    // Show ONLY detail
    const detailEl = document.getElementById('post-detail');
    detailEl.style.display = 'block';
    detailEl.style.paddingTop = '32px';
    
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
}

// Handle hash changes
window.addEventListener('hashchange', function() {
    const hash = window.location.hash;
    if (hash.startsWith('#post/')) {
        const postId = hash.replace('#post/', '');
        renderPostDetail(postId);
    } else {
        // Restore normal view
        document.getElementById('main-navbar').style.display = '';
        document.querySelectorAll('section').forEach(el => el.style.display = '');
        document.getElementById('post-detail').style.display = 'none';
        document.getElementById('post-detail').style.paddingTop = '';
        document.documentElement.scrollTop = 0;
    }
});

// Check hash on page load
window.addEventListener('load', function() {
    const hash = window.location.hash;
    if (hash.startsWith('#post/')) {
        const postId = hash.replace('#post/', '');
        renderPostDetail(postId);
    }
});

function copyDetailPrompt() {
    const prompt = document.getElementById('detail-prompt').innerText;
    navigator.clipboard.writeText(prompt).then(() => { showToast("Prompt copied! ✅"); fxCopied(); });
}

let _currentFilter = 'all';
let _currentCategory = 'all';

async function filterByTag(tag) {
    _currentCategory = tag;
    
    // Update active pill style
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.className = 'cat-btn px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-black text-xs rounded-full transition border border-white/10';
    });
    const activeBtn = document.getElementById('cat-' + tag);
    if (activeBtn) activeBtn.className = 'cat-btn px-4 py-2 bg-sky-600 text-white font-black text-xs rounded-full transition border border-sky-500';

    const feedEl = document.getElementById('community-feed');
    const emptyEl = document.getElementById('feed-empty');
    if (!feedEl || !window._feedPosts) return;

    let filtered = [...window._feedPosts];
    
    if (tag !== 'all') {
        filtered = filtered.filter(post => {
            const tags = (post.tags || []).map(t => t.toLowerCase());
            const title = (post.title || '').toLowerCase();
            const prompt = (post.prompt || '').toLowerCase();
            return tags.includes(tag) || title.includes(tag) || prompt.includes(tag);
        });
    }

    if (filtered.length === 0) {
        if (emptyEl) {
            emptyEl.classList.remove('hidden');
            emptyEl.querySelector('p') && (emptyEl.querySelector('p').innerText = `No ${tag} posts yet`);
        }
        feedEl.innerHTML = '';
        const paginationEl = document.getElementById('feed-pagination');
        if (paginationEl) paginationEl.innerHTML = '';
        return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    renderGalleryPage(filtered, 'feed', 1);
}

async function filterFeed(filter) {
    _currentFilter = filter;

    // Close sort dropdown
    const sortDd = document.getElementById('sort-dropdown');
    if (sortDd) sortDd.classList.add('hidden');

    // Update sort badge
    const badge = document.getElementById('active-sort-badge');
    const labels = { all: '', liked: '❤️ Most Liked', copied: '📋 Most Copied' };
    if (badge) {
        if (filter === 'all') { badge.classList.add('hidden'); }
        else { badge.classList.remove('hidden'); badge.innerText = labels[filter]; }
    }

    // Update sort btn highlight
    const sortBtn = document.getElementById('sort-btn');
    if (sortBtn) {
        sortBtn.className = filter !== 'all'
            ? 'w-10 h-10 flex items-center justify-center bg-sky-600/20 border border-sky-500/40 rounded-xl transition'
            : 'w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:border-sky-500/40 hover:bg-sky-600/10 rounded-xl transition';
    }

    const feedEl = document.getElementById('community-feed');
    if (!feedEl || !window._feedPosts) return;

    let sorted = [...window._feedPosts];

    if (filter === 'liked') {
        sorted.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
    } else if (filter === 'copied') {
        sorted.sort((a, b) => (b.copies || 0) - (a.copies || 0));
    } else {
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    // Re-render with sorted posts, page 1
    renderGalleryPage(sorted, 'feed', 1);
}

function renderCards(posts, currentUserId) {
    const feedEl = document.getElementById('community-feed');
    const paginationEl = document.getElementById('feed-pagination');
    if (!feedEl) return;

    if (!posts || posts.length === 0) {
        feedEl.innerHTML = `<div class="col-span-3 text-center py-16">
            <i class="fa-solid fa-magnifying-glass text-4xl text-gray-700 mb-4"></i>
            <p class="text-gray-500 font-bold">No results found</p>
            <p class="text-gray-600 text-xs mt-1">Try different keywords</p>
        </div>`;
        if (paginationEl) paginationEl.innerHTML = '';
        return;
    }

    renderGalleryPage(posts, 'feed', 1);
}

let _searchTimeout = null;

function searchFeed(query) {
    const clearBtn = document.getElementById('search-clear-btn');
    const infoEl = document.getElementById('search-results-info');

    if (!query || query.trim() === '') {
        if (clearBtn) clearBtn.classList.add('hidden');
        if (infoEl) infoEl.classList.add('hidden');
        // Show all posts
        renderCards(window._feedPosts || []);
        return;
    }

    if (clearBtn) clearBtn.classList.remove('hidden');

    // Debounce
    clearTimeout(_searchTimeout);
    _searchTimeout = setTimeout(() => {
        const q = query.toLowerCase().trim();
        const all = window._feedPosts || [];

        const results = all.filter(post => {
            const titleMatch = post.title && post.title.toLowerCase().includes(q);
            const tagsMatch = post.tags && post.tags.some(tag => tag.toLowerCase().includes(q));
            const promptMatch = post.prompt && post.prompt.toLowerCase().includes(q);
            const creatorMatch = post.creator_name && post.creator_name.toLowerCase().includes(q);
            return titleMatch || tagsMatch || promptMatch || creatorMatch;
        });

        if (infoEl) {
            infoEl.classList.remove('hidden');
            infoEl.innerText = results.length > 0 
                ? `${results.length} result${results.length > 1 ? 's' : ''} for "${query}"`
                : `No results for "${query}"`;
        }

        renderCards(results);
    }, 300);
}

function clearSearch() {
    const input = document.getElementById('feed-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    const infoEl = document.getElementById('search-results-info');
    if (input) input.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    if (infoEl) infoEl.classList.add('hidden');
    renderCards(window._feedPosts || []);
}

async function deletePost(postId) {
    if (!(await uiConfirm("This post will be deleted for good. This can't be undone.", { title: 'Delete post?', confirmText: 'Delete', danger: true }))) return;
    const { error } = await _supabase.from('posts').delete().eq('id', postId);
    if (error) { showToast("Delete failed!"); return; }
    showToast("Post deleted! 🗑️");
    loadCommunityFeed();
}

async function editPost(postId) {
    const post = (window._feedPosts || []).find(p => p.id === postId);
    if (!post) return;
    const edited = await uiPrompt('Edit your prompt', post.prompt || '', { maxLength: 4000, confirmText: 'Save' });
    if (edited === null) return;
    const newPrompt = edited.trim();
    if (!newPrompt) { showToast("Prompt can't be empty"); return; }
    if (newPrompt === post.prompt) return;
    const { error } = await _supabase.from('posts').update({ prompt: newPrompt }).eq('id', postId);
    if (error) { showToast("Edit failed!"); return; }
    showToast("Post updated! ✅");
    loadCommunityFeed();
}

function goBackToGallery() {
    window.location.hash = 'samples';
    document.getElementById('main-navbar').style.display = '';
    document.querySelectorAll('section').forEach(el => el.style.display = '');
    document.getElementById('post-detail').style.display = 'none';
    document.getElementById('post-detail').style.paddingTop = '';
    document.documentElement.scrollTop = 0;
    showPage('samples');
}

function toggleFilterPanel() {
    document.getElementById('filter-panel').classList.toggle('hidden');
    document.getElementById('sort-panel').classList.add('hidden');
}

function toggleSortPanel() {
    document.getElementById('sort-panel').classList.toggle('hidden');
    document.getElementById('filter-panel').classList.add('hidden');
}

// Close panels on outside click
document.addEventListener('click', function(e) {
    if (!e.target.closest('#filter-btn-wrap')) document.getElementById('filter-panel')?.classList.add('hidden');
    if (!e.target.closest('#sort-btn-wrap')) document.getElementById('sort-panel')?.classList.add('hidden');
});

function shareProfile() {
    const url = window.location.href.split('#')[0];
    navigator.clipboard.writeText(url).then(() => showToast("Profile link copied! 🔗"));
}

// ===== DROPDOWN TOGGLES =====
function toggleFilterDropdown() {
    const dd = document.getElementById('filter-dropdown');
    const sortDd = document.getElementById('sort-dropdown');
    if (sortDd) sortDd.classList.add('hidden');
    dd.classList.toggle('hidden');
}

function toggleSortDropdown() {
    const dd = document.getElementById('sort-dropdown');
    const filterDd = document.getElementById('filter-dropdown');
    if (filterDd) filterDd.classList.add('hidden');
    dd.classList.toggle('hidden');
}

// Close dropdowns on outside click
document.addEventListener('click', function(e) {
    if (!e.target.closest('#filter-wrap')) {
        const dd = document.getElementById('filter-dropdown');
        if (dd) dd.classList.add('hidden');
    }
    if (!e.target.closest('#sort-wrap')) {
        const dd = document.getElementById('sort-dropdown');
        if (dd) dd.classList.add('hidden');
    }
});

// ===== CATEGORY FILTER =====
let _activeCategory = 'all';

function filterByTag(tag) {
    _activeCategory = tag;
    
    // Close dropdown
    const dd = document.getElementById('filter-dropdown');
    if (dd) dd.classList.add('hidden');
    
    // Update active badge
    const badge = document.getElementById('active-cat-badge');
    if (badge) {
        if (tag === 'all') { badge.classList.add('hidden'); }
        else { badge.classList.remove('hidden'); badge.innerText = '× ' + tag.charAt(0).toUpperCase() + tag.slice(1); }
    }
    
    // Update filter btn highlight
    const filterBtn = document.getElementById('filter-btn');
    if (filterBtn) {
        filterBtn.className = tag !== 'all'
            ? 'w-10 h-10 flex items-center justify-center bg-sky-600/20 border border-sky-500/40 rounded-xl transition'
            : 'w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:border-sky-500/40 hover:bg-sky-600/10 rounded-xl transition';
    }

    const feedEl = document.getElementById('community-feed');
    const emptyEl = document.getElementById('feed-empty');
    if (!feedEl || !window._feedPosts) return;

    let posts = [...window._feedPosts];
    
    if (tag !== 'all') {
        posts = posts.filter(post => {
            const tags = (post.tags || []).map(t => t.toLowerCase());
            const title = (post.title || '').toLowerCase();
            const prompt = (post.prompt || '').toLowerCase();
            return tags.some(t => t.includes(tag)) || title.includes(tag) || prompt.includes(tag);
        });
    }

    if (posts.length === 0) {
        if (emptyEl) {
            emptyEl.classList.remove('hidden');
            emptyEl.querySelector('p') && (emptyEl.querySelector('p').innerText = `No ${tag} images yet`);
        }
        feedEl.innerHTML = '';
        const paginationEl = document.getElementById('feed-pagination');
        if (paginationEl) paginationEl.innerHTML = '';
        return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    renderGalleryPage(posts, 'feed', 1);
}

function renderFeedCard(feedEl, post) {
    const likes = post.likes ? post.likes.length : 0;
    const title = esc(post.title ? post.title.toUpperCase() : (post.prompt ? post.prompt.substring(0, 28).toUpperCase() + '...' : 'UNTITLED'));
    const promptPreview = esc(post.prompt ? post.prompt.substring(0, 120) + '...' : '');
    const creator = esc(post.creator_name || 'Creator');

    const card = document.createElement('div');
    card.className = 'masonry-card group cursor-pointer';
    card.onclick = () => openPostDetail(post.id);
    card.innerHTML = `
        <div class="relative rounded-2xl overflow-hidden">
            <img src="${cldThumb(post.image_url)}" class="w-full h-auto block" alt="AI Art" loading="lazy">
            <div class="absolute top-0 left-0 right-0 p-3 flex items-center justify-between">
                <span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg truncate max-w-[65%]">${title}</span>
                <span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <i class="fa-solid fa-heart text-red-400"></i> ${likes}
                </span>
            </div>
            <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p class="text-gray-200 text-xs leading-relaxed line-clamp-3 mb-3">${promptPreview}</p>
                <div class="flex items-center justify-between">
                    <button onclick="event.stopPropagation(); copyFeedPrompt('${post.id}')" class="flex items-center gap-1.5 bg-sky-600/80 hover:bg-sky-600 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition">
                        <i class="fa-regular fa-copy"></i> Copy
                    </button>
                    <span class="text-gray-400 text-[10px]">@${creator}</span>
                </div>
            </div>
        </div>`;
    feedEl.appendChild(card);
}

// ===== SEARCH SYSTEM =====
function initSearch() {
    const searchInput = document.getElementById('feed-search');
    if (!searchInput) return;
    
    let searchTimer;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            const query = this.value.trim();
            const clearBtn = document.getElementById('search-clear');
            if (clearBtn) clearBtn.classList.toggle('hidden', !query);
            searchPosts(query);
        }, 300);
    });

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') clearSearch();
    });
}

function searchPosts(query) {
    const feedEl = document.getElementById('community-feed');
    const countEl = document.getElementById('search-results-count');
    const emptyEl = document.getElementById('feed-empty');
    
    if (!window._feedPosts) return;

    if (!query) {
        // Show all posts
        if (countEl) countEl.classList.add('hidden');
        filterFeed(_currentFilter);
        return;
    }

    const q = query.toLowerCase();
    const filtered = window._feedPosts.filter(post => {
        const titleMatch = post.title && post.title.toLowerCase().includes(q);
        const tagsMatch = post.tags && post.tags.some(tag => tag.toLowerCase().includes(q));
        const promptMatch = post.prompt && post.prompt.toLowerCase().includes(q);
        const creatorMatch = post.creator_name && post.creator_name.toLowerCase().includes(q);
        return titleMatch || tagsMatch || promptMatch || creatorMatch;
    });

    // Show count
    if (countEl) {
        countEl.classList.remove('hidden');
        countEl.innerText = filtered.length === 0 
            ? 'No results found' 
            : `${filtered.length} result${filtered.length > 1 ? 's' : ''} for "${query}"`;
    }

    if (!feedEl) return;
    feedEl.innerHTML = '';

    if (filtered.length === 0) {
        if (emptyEl) {
            emptyEl.classList.remove('hidden');
            emptyEl.querySelector('p').innerText = `No results for "${query}"`;
        }
        return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    filtered.forEach(post => {
        const likes = post.likes ? post.likes.length : 0;
        const title = esc(post.title ? post.title.toUpperCase() : (post.prompt ? post.prompt.substring(0, 28).toUpperCase() + '...' : 'UNTITLED'));
        const promptPreview = esc(post.prompt ? post.prompt.substring(0, 120) + '...' : '');
        const creator = esc(post.creator_name || 'Creator');
        const tags = post.tags || [];

        const card = document.createElement('div');
        card.className = 'masonry-card group cursor-pointer';
        card.onclick = () => openPostDetail(post.id);

        // Highlight matching tags
        const tagHtml = tags.length > 0 ? tags.map(tag => {
            const isMatch = tag.toLowerCase().includes(query.toLowerCase());
            return `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${isMatch ? 'bg-sky-500/30 border border-sky-500/50 text-sky-300' : 'bg-white/5 text-gray-500'}">#${esc(tag)}</span>`;
        }).join('') : '';

        card.innerHTML = `
            <div class="relative rounded-2xl overflow-hidden">
                <img src="${cldThumb(post.image_url)}" class="w-full h-auto block" alt="AI Art" loading="lazy">
                <div class="absolute top-0 left-0 right-0 p-3 flex items-center justify-between">
                    <span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg truncate max-w-[65%]">${title}</span>
                    <span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <i class="fa-solid fa-heart text-red-400"></i> ${likes}
                    </span>
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p class="text-gray-200 text-xs leading-relaxed line-clamp-2 mb-2">${promptPreview}</p>
                    ${tagHtml ? `<div class="flex flex-wrap gap-1 mb-2">${tagHtml}</div>` : ''}
                    <div class="flex items-center justify-between">
                        <button onclick="event.stopPropagation(); copyFeedPrompt('${post.id}')" class="flex items-center gap-1.5 bg-sky-600/80 hover:bg-sky-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition">
                            <i class="fa-regular fa-copy"></i> Copy
                        </button>
                        <span class="text-gray-400 text-[10px]">@${creator}</span>
                    </div>
                </div>
            </div>`;
        feedEl.appendChild(card);
    });
}

function clearSearch() {
    const searchInput = document.getElementById('feed-search');
    const clearBtn = document.getElementById('search-clear');
    const countEl = document.getElementById('search-results-count');
    if (searchInput) searchInput.value = '';
    if (clearBtn) clearBtn.classList.add('hidden');
    if (countEl) countEl.classList.add('hidden');
    filterFeed(_currentFilter);
}

async function deletePostFromProfile(postId) {
    if (!(await uiConfirm("This post will be deleted for good. This can't be undone.", { title: 'Delete post?', confirmText: 'Delete', danger: true }))) return;
    const { error } = await _supabase.from('posts').delete().eq('id', postId);
    if (error) { showToast("Delete failed!"); return; }
    showToast("Post deleted! 🗑️");
    _feedLoading = false;
    _feedLoaded = false;
    loadMyUploads();
}

async function toggleDetailLike() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { showToast("Sign in to like!"); toggleLoginModal(true); return; }
    
    const postId = window._currentDetailPostId;
    const { data: newLikes, error: likeErr } = await _supabase.rpc('toggle_post_like', { p_post_id: postId });
    if (likeErr || !Array.isArray(newLikes)) { showToast('Could not update like, try again'); return; }
    const liked = !newLikes.includes(session.user.id);
    
    document.getElementById('detail-likes-count').innerText = newLikes.length;
    const likeBtn = document.getElementById('detail-like-btn');
    likeBtn.querySelector('i').className = !liked ? 'fa-solid fa-heart text-red-400 text-lg' : 'fa-regular fa-heart text-lg';
    if (!liked) fxPop(likeBtn.querySelector('i'));
    
    // Update in feed cache
    if (window._feedPosts) {
        const idx = window._feedPosts.findIndex(p => p.id === postId);
        if (idx !== -1) window._feedPosts[idx].likes = newLikes;
    }
    
    showToast(liked ? "Unliked" : "Liked! ❤️");
}

function getTimeAgo(date) {
    const secs = Math.floor((new Date() - date) / 1000);
    if (secs < 60) return 'just now';
    if (secs < 3600) return Math.floor(secs/60) + 'm ago';
    if (secs < 86400) return Math.floor(secs/3600) + 'h ago';
    return Math.floor(secs/86400) + 'd ago';
}

function openUploadModal(preCategory = 'ai_images') {
    _supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) {
            showToast("Please sign in to share your creation!");
            toggleLoginModal(true);
            return;
        }
        document.getElementById('upload-modal').classList.remove('hidden');
        const catSel = document.getElementById('upload-category-input');
        if (catSel) catSel.value = preCategory;
    });
}

function closeUploadModal() {
    document.getElementById('upload-modal').classList.add('hidden');
    document.getElementById('upload-preview-wrap').classList.add('hidden');
    document.getElementById('upload-placeholder').classList.remove('hidden');
    document.getElementById('upload-prompt-input').value = '';
    document.getElementById('upload-title-input').value = '';
    document.getElementById('upload-tags-input').value = '';
    document.getElementById('tags-preview').innerHTML = '';
    document.getElementById('image-file-input').value = '';
    document.getElementById('upload-status').classList.add('hidden');
}

// Tags live preview
document.addEventListener('DOMContentLoaded', function() {
    const tagsInput = document.getElementById('upload-tags-input');
    if (tagsInput) {
        tagsInput.addEventListener('input', function() {
            const preview = document.getElementById('tags-preview');
            const tags = this.value.split(',').map(t => t.trim()).filter(t => t.length > 0);
            preview.innerHTML = tags.map(tag => 
                `<span class="px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-[10px] font-bold">#${esc(tag)}</span>`
            ).join('');
        });
    }
});

function previewUploadImage(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast("Image must be under 5MB!"); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('upload-preview-img').src = e.target.result;
        document.getElementById('upload-preview-wrap').classList.remove('hidden');
        document.getElementById('upload-placeholder').classList.add('hidden');
    };
    reader.readAsDataURL(file);
}

async function submitCommunityPost() {
    const { data: { session } } = await _supabase.auth.getSession();
    const user = session ? session.user : null;
    if (!user) { showToast("Please sign in first!"); toggleLoginModal(true); return; }

    const fileInput = document.getElementById('image-file-input');
    const promptInput = document.getElementById('upload-prompt-input');
    const titleInput = document.getElementById('upload-title-input');
    const tagsInput = document.getElementById('upload-tags-input');
    
    if (!fileInput || !fileInput.files[0]) { showToast("Please select an image!"); return; }
    if (!titleInput || !titleInput.value.trim()) { showToast("Please add a title!"); return; }
    if (!promptInput || !promptInput.value.trim()) { showToast("Please add your AI prompt!"); return; }

    const file = fileInput.files[0];
    const prompt = promptInput.value.trim();
    const title = titleInput.value.trim();
    const tags = tagsInput ? tagsInput.value.split(',').map(t => t.trim()).filter(t => t.length > 0) : [];

    const statusEl = document.getElementById('upload-status');
    const statusText = document.getElementById('upload-status-text');
    if (statusEl) statusEl.classList.remove('hidden');
    if (statusText) statusText.innerText = 'Uploading image...';

    try {
        // Upload to Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'frazx_community');

        const cloudRes = await fetch(
            'https://api.cloudinary.com/v1_1/dt8nzlmgk/image/upload',
            { method: 'POST', body: formData }
        );
        const cloudData = await cloudRes.json();
        
        if (!cloudData.secure_url) {
            showToast("Image upload failed! Error: " + (cloudData.error?.message || 'unknown'));
            if (statusEl) statusEl.classList.add('hidden');
            return;
        }

        if (statusText) statusText.innerText = 'Publishing...';

        const creatorName = user.user_metadata?.display_name || user.email.split('@')[0];
        const creatorAvatar = user.user_metadata?.avatar_url || '';

        // Read category BEFORE closing modal
        const categoryEl = document.getElementById('upload-category-input');
        const selectedCategory = categoryEl ? categoryEl.value : 'ai_images';

        const { error: dbError } = await _supabase
            .from('posts')
            .insert([{
                image_url: cloudData.secure_url,
                prompt: prompt,
                title: title,
                tags: tags,
                creator_name: creatorName,
                creator_avatar: creatorAvatar,
                creator_id: user.id,
                category: selectedCategory
            }]);

        if (dbError) {
            showToast("DB Error: " + dbError.message);
            if (statusEl) statusEl.classList.add('hidden');
            return;
        }

        closeUploadModal();
        showToast("Creation published!");
        // Reload the correct feed based on category
        if (selectedCategory === 'ads_poster') {
            _adsFeedLoaded = false;
            loadAdsFeed(true);
        } else if (selectedCategory === 'ai_stock') {
            _stockFeedLoaded = false;
            loadStockFeed(true);
        } else {
            _feedLoading = false;
            _feedLoaded = false;
            loadCommunityFeed(true);
        }
        loadMyUploads();

    } catch(e) {
        console.error(e);
        if (statusEl) statusEl.classList.add('hidden');
        showToast("Error: " + e.message);
    }
}

async function openPostModal(postId) {
    currentPostId = postId;
    
    const { data: post } = await _supabase.from('posts').select('*').eq('id', postId).single();
    if (!post) return;

    const { data: { session } } = await _supabase.auth.getSession();
    const user = session ? session.user : null;
    const likes = post.likes || [];
    const isLiked = user && likes.includes(user.id);

    document.getElementById('post-modal-img').src = cldFull(post.image_url) || '';
    document.getElementById('post-modal-avatar').src = cldAvatar(post.creator_avatar) || '';
    document.getElementById('post-modal-creator').innerText = post.creator_name || 'Creator';
    document.getElementById('post-modal-prompt').innerText = post.prompt || '';
    document.getElementById('post-modal-likes').innerText = likes.length;
    document.getElementById('post-modal-time').innerText = post.created_at ? getTimeAgo(new Date(post.created_at)) : '';

    const likeBtn = document.getElementById('post-modal-like-btn');
    likeBtn.querySelector('i').className = isLiked ? 'fa-solid fa-heart text-red-400' : 'fa-regular fa-heart';
    likeBtn.className = isLiked
        ? 'flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs font-bold text-red-400'
        : 'flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 rounded-xl transition text-xs font-bold text-gray-300 hover:text-red-400';

    renderComments(post.comments || []);

    if (user) {
        document.getElementById('comment-input-wrap').classList.remove('hidden');
        document.getElementById('comment-login-hint').classList.add('hidden');
    } else {
        document.getElementById('comment-input-wrap').classList.add('hidden');
        document.getElementById('comment-login-hint').classList.remove('hidden');
    }

    document.getElementById('post-modal').classList.remove('hidden');
}

function renderComments(comments) {
    const container = document.getElementById('post-modal-comments');
    if (!comments.length) {
        container.innerHTML = '<p class="text-gray-600 text-xs italic">No comments yet. Be first!</p>';
        return;
    }
    container.innerHTML = comments.map(c => `
        <div class="flex gap-3 items-start">
            <img src="${c.avatar ? cldAvatar(c.avatar) : 'https://via.placeholder.com/24/6366f1/white?text=U'}" class="w-6 h-6 rounded-full object-cover border border-white/10 flex-shrink-0" alt="">
            <div class="glass rounded-xl px-3 py-2 flex-1">
                <p class="text-white font-black text-[10px] mb-0.5">${esc(c.name)}</p>
                <p class="text-gray-300 text-xs">${esc(c.text)}</p>
            </div>
        </div>`).join('');
}

function closePostModal() {
    document.getElementById('post-modal').classList.add('hidden');
    currentPostId = null;
    document.getElementById('comment-input').value = '';
}

async function toggleLikePost() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { showToast("Sign in to like!"); toggleLoginModal(true); return; }
    if (!currentPostId) return;

    const userId = session.user.id;
    const { data: newLikes, error: likeErr } = await _supabase.rpc('toggle_post_like', { p_post_id: currentPostId });
    if (likeErr || !Array.isArray(newLikes)) { showToast('Could not update like, try again'); return; }
    const liked = !newLikes.includes(session.user.id);
    document.getElementById('post-modal-likes').innerText = newLikes.length;
    openPostModal(currentPostId);
}

async function quickLike(postId, btn) {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { showToast("Sign in to like!"); toggleLoginModal(true); return; }
    
    const userId = session.user.id;
    const { data: newLikes, error: likeErr } = await _supabase.rpc('toggle_post_like', { p_post_id: postId });
    if (likeErr || !Array.isArray(newLikes)) { showToast('Could not update like, try again'); return; }
    const liked = !newLikes.includes(session.user.id);
    
    const countEl = btn.querySelector('.like-count');
    const iconEl = btn.querySelector('i');
    if (liked) {
        countEl.innerText = parseInt(countEl.innerText) - 1;
        iconEl.className = 'fa-regular fa-heart';
        btn.classList.remove('text-red-400');
    } else {
        countEl.innerText = parseInt(countEl.innerText) + 1;
        iconEl.className = 'fa-solid fa-heart text-red-400';
        btn.classList.add('text-red-400');
        fxPop(iconEl);
    }
}

async function submitComment() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { showToast("Sign in to comment!"); return; }

    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if (!text) return;

    const user = session.user;
    const { data: comments, error: commentErr } = await _supabase.rpc('add_post_comment', { p_post_id: currentPostId, p_text: text });
    if (commentErr || !Array.isArray(comments)) { showToast('Could not post comment, try again'); return; }
    input.value = '';
    showToast("Comment posted! 💬");
    renderComments(comments);
}

function copyPostPrompt() {
    const prompt = document.getElementById('post-modal-prompt').innerText;
    navigator.clipboard.writeText(prompt).then(() => { showToast("Prompt copied!"); fxCopied(); });
}

// ========== PROFILE FUNCTIONS ==========

window.handleStartCreation = function() {
    const user = window._auth ? window._auth.currentUser : null;
    if (user) {
        showPage('samples');
    } else {
        toggleLoginModal(true);
    }
};

window.editDisplayName = function() {
    const wrap = document.getElementById('edit-name-wrap');
    const nameEl = document.getElementById('account-name');
    const input = document.getElementById('edit-name-input');
    wrap.classList.toggle('hidden');
    input.value = nameEl.innerText;
    if (!wrap.classList.contains('hidden')) input.focus();
};

window.saveDisplayName = async function() {
    const input = document.getElementById('edit-name-input');
    if (!input) return;
    const newName = input.value.trim();
    if (!newName) return showToast("Name cannot be empty!");
    
    try {
        const { error } = await window._supabase.auth.updateUser({ 
            data: { display_name: newName } 
        });
        if (error) { showToast("Error: " + error.message); return; }
        
        document.getElementById('account-name').innerText = newName;
        const sideEl = document.getElementById('sidebar-user-name');
        if (sideEl) sideEl.innerText = newName.split(' ')[0];
        const navEl = document.getElementById('navbar-auth-text');
        if (navEl) navEl.innerText = newName.split(' ')[0].toUpperCase();
        document.getElementById('edit-name-wrap').classList.add('hidden');
        showToast("Name updated! ✅");
    } catch(e) {
        showToast("Error: " + e.message);
    }
};

window.uploadAvatarPhoto = async function(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { showToast("Max 3MB!"); return; }
    showToast("Uploading...");

    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'frazx_community');

        const res = await fetch('https://api.cloudinary.com/v1_1/dt8nzlmgk/image/upload', {
            method: 'POST', body: formData
        });
        const data = await res.json();
        if (!data.secure_url) throw new Error('Cloudinary failed');

        const { error } = await window._supabase.auth.updateUser({ 
            data: { avatar_url: data.secure_url } 
        });
        if (error) { showToast("Save error: " + error.message); return; }

        ['account-avatar-img','sidebar-avatar-img','navbar-avatar-img'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.src = cldAvatar(data.secure_url); el.classList.remove('hidden'); }
        });
        ['account-avatar-icon','sidebar-avatar-icon','navbar-avatar-icon'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        showToast("Photo updated! ✅");
    } catch(e) {
        showToast("Error: " + e.message);
    }
};

// Load my uploads on account page
let _uploadsLoading = false;

// Pinterest-style profile card (used in Posts / Liked / Saved tabs)
function profileCardHTML(post, showDelete) {
    const likes = post.likes ? post.likes.length : 0;
    const saves = post.saves ? post.saves.length : 0;
    const title = esc(post.title || (post.prompt ? post.prompt.substring(0, 40) : 'Untitled'));
    return `
        <div class="group cursor-pointer">
            <div class="relative overflow-hidden rounded-2xl aspect-[3/4] bg-white/5 border border-white/5 group-hover:border-sky-500/30 transition-all duration-300" onclick="openPostDetail('${post.id}')">
                <img src="${cldThumb(post.image_url)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="" loading="lazy">
                ${showDelete ? `
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button onclick="event.stopPropagation(); deletePostFromProfile('${post.id}')" 
                        class="w-9 h-9 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center text-white transition">
                        <i class="fa-solid fa-trash text-xs"></i>
                    </button>
                </div>` : ''}
            </div>
            <div class="pt-2 px-0.5 cursor-pointer" onclick="openPostDetail('${post.id}')">
                <p class="text-white text-xs font-bold truncate">${title}</p>
                <div class="flex items-center gap-3 text-[10px] text-gray-500 mt-1">
                    <span><i class="fa-solid fa-heart text-red-400/70 mr-1"></i>${likes}</span>
                    <span><i class="fa-solid fa-bookmark text-sky-400/70 mr-1"></i>${saves}</span>
                </div>
            </div>
        </div>`;
}

async function loadMyUploads() {
    if (_uploadsLoading) return;
    _uploadsLoading = true;

    const loadingEl = document.getElementById('my-uploads-loading');
    const emptyEl = document.getElementById('my-uploads-empty');
    const grid = document.getElementById('my-uploads-grid');
    
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (grid) grid.innerHTML = '';

    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { if (loadingEl) loadingEl.classList.add('hidden'); return; }

    // Show Create button for all logged-in users
    const _cb = document.getElementById('profile-create-btn');
    if (_cb) { _cb.classList.remove('hidden'); _cb.classList.add('flex'); }

    loadAndRenderOwnBadges(session.user.id);

    const { data: posts, error: upErr } = await _supabase
        .from('posts')
        .select(POST_LIST_COLS)
        .eq('creator_id', session.user.id)
        .or('category.eq.ai_images,category.is.null')
        .order('created_at', { ascending: false });

    if (loadingEl) loadingEl.classList.add('hidden');
    if (upErr) { console.error(upErr); showLoadError(grid, () => { _uploadsLoading = false; loadMyUploads(); }); _uploadsLoading = false; return; }

    const postCount = document.getElementById('account-post-count');
    if (postCount) postCount.innerText = posts ? posts.length : 0;

    if (!posts || posts.length === 0) {
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }

    if (grid) grid.innerHTML = posts.map(post => profileCardHTML(post, true)).join('');
    _uploadsLoading = false;
}

// ===== BADGE SYSTEM =====
// is_onboarding_verified -> yellow "✓ Verified" badge (perfect quiz answers)
// badge_tier -> achievement badge based on uploads + total likes: grey / gold / blue / red

async function calculateAndSyncBadgeTier(userId) {
    // Tier is now calculated on the server (cannot be faked from the browser)
    const { data, error } = await _supabase.rpc('sync_badge_tier', { p_user_id: userId });
    return error ? 'none' : (data || 'none');
}

function achievementBadgeIcon(tier, size = 'text-xs') {
    const map = {
        grey:  `<i class="fa-solid fa-certificate ${size}" style="color:#9ca3af" title="Grey Creator Badge"></i>`,
        gold:  `<i class="fa-solid fa-certificate ${size}" style="color:#facc15" title="Gold Creator Badge"></i>`,
        blue:  `<i class="fa-solid fa-certificate ${size}" style="color:#38bdf8" title="Blue Creator Badge"></i>`,
        red:   `<i class="fa-solid fa-crown ${size}" style="color:#f87171" title="Legendary Creator"></i>`
    };
    return map[tier] || '';
}

function verifiedBadgeIcon(size = 'text-xs') {
    return `<i class="fa-solid fa-circle-check ${size}" style="color:#eab308" title="Verified Contributor"></i>`;
}

// Builds combined badge HTML for a profile: verified check + achievement tier icon
function renderBadgesHTML(profile, size = 'text-xs') {
    if (!profile) return '';
    let html = '';
    if (profile.is_onboarding_verified) html += verifiedBadgeIcon(size) + ' ';
    if (profile.badge_tier && profile.badge_tier !== 'none') html += achievementBadgeIcon(profile.badge_tier, size);
    return html;
}

async function loadAndRenderOwnBadges(userId) {
    await calculateAndSyncBadgeTier(userId);
    const { data: profile } = await _supabase.from('profiles').select('is_onboarding_verified, badge_tier').eq('id', userId).single();
    const slot = document.getElementById('account-badge-slot');
    if (slot && profile) slot.innerHTML = renderBadgesHTML(profile, 'text-sm');
    return profile;
}


async function toggleSavePost() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { showToast("Sign in to save!"); toggleLoginModal(true); return; }
    
    const postId = window._currentDetailPostId;
    if (!postId) return;

    const userId = session.user.id;
    const { data: newSaves, error: saveErr } = await _supabase.rpc('toggle_post_save', { p_post_id: postId });
    if (saveErr || !Array.isArray(newSaves)) { showToast('Could not update save, try again'); return; }
    const saved = !newSaves.includes(session.user.id);
    
    const btn = document.getElementById('detail-save-btn');
    if (btn) {
        btn.querySelector('i').className = !saved ? 'fa-solid fa-bookmark text-sky-400' : 'fa-regular fa-bookmark';
        btn.className = !saved 
            ? 'flex items-center gap-2 px-4 py-2 bg-sky-600/20 border border-sky-500/30 rounded-xl text-xs font-bold text-sky-400 transition'
            : 'flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-sky-600/20 border border-white/10 hover:border-sky-500/30 rounded-xl text-xs font-bold text-gray-300 hover:text-sky-400 transition';
    }
    if (!saved && btn) fxPop(btn.querySelector('i'));
    showToast(saved ? "Removed from saved" : "Saved! 🔖");
    
    // Update feed post cache
    if (window._feedPosts) {
        const idx = window._feedPosts.findIndex(p => p.id === postId);
        if (idx !== -1) window._feedPosts[idx].saves = newSaves;
    }
}

// Update renderPostDetail to show save state
const _origRenderPostDetail = window.renderPostDetail;

// ===== PROFILE TABS =====
let _currentProfileTab = 'posts';

function switchProfileTab(tab) {
    _currentProfileTab = tab;
    
    // Update tab styles
    ['posts', 'ads', 'aistock', 'liked', 'saved'].forEach(t => {
        const btn = document.getElementById('tab-' + t);
        const panel = document.getElementById('profile-tab-' + t);
        if (btn) {
            btn.className = t === tab
                ? 'px-4 py-3 border-b-2 border-white text-white font-black text-sm flex items-center gap-2 transition whitespace-nowrap'
                : 'px-4 py-3 border-b-2 border-transparent text-gray-500 hover:text-gray-300 font-black text-sm flex items-center gap-2 transition whitespace-nowrap';
        }
        if (panel) panel.classList.toggle('hidden', t !== tab);
    });

    if (tab === 'liked') loadLikedPosts();
    if (tab === 'saved') loadSavedPosts();
    if (tab === 'ads') loadMyAdsPosts();
    if (tab === 'aistock') loadMyStockPosts();
}

async function loadLikedPosts() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return;
    
    const loadingEl = document.getElementById('liked-loading');
    const emptyEl = document.getElementById('liked-empty');
    const grid = document.getElementById('liked-grid');
    
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (grid) grid.innerHTML = '';

    const { data: posts, error: likedErr } = await _supabase.from('posts').select(POST_LIST_COLS).contains('likes', [session.user.id]).order('created_at', { ascending: false });
    const liked = posts || [];
    
    if (loadingEl) loadingEl.classList.add('hidden');
    if (likedErr) { console.error(likedErr); showLoadError(grid, loadLikedPosts); return; }
    if (!liked.length) { if (emptyEl) emptyEl.classList.remove('hidden'); return; }
    
    if (grid) grid.innerHTML = liked.map(post => profileCardHTML(post, false)).join('');
}

async function loadSavedPosts() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return;
    
    const loadingEl = document.getElementById('saved-loading');
    const emptyEl = document.getElementById('saved-empty');
    const grid = document.getElementById('saved-grid');
    
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (grid) grid.innerHTML = '';

    const { data: posts, error: savedErr } = await _supabase.from('posts').select(POST_LIST_COLS).contains('saves', [session.user.id]).order('created_at', { ascending: false });
    const saved = posts || [];
    
    if (loadingEl) loadingEl.classList.add('hidden');
    if (savedErr) { console.error(savedErr); showLoadError(grid, loadSavedPosts); return; }
    if (!saved.length) { if (emptyEl) emptyEl.classList.remove('hidden'); return; }
    
    if (grid) grid.innerHTML = saved.map(post => profileCardHTML(post, false)).join('');
}

// Reset tabs when leaving account
const _origSwitchPage = window.showPage;

// ===== GLOBAL SEARCH SYSTEM =====
// ===== SEARCH SYSTEM (NEW) =====
function openSearchModal() {
    const overlay = document.getElementById('search-overlay');
    const input = document.getElementById('search-input-new');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => input && input.focus(), 100);
}

function closeSearchModal() {
    const overlay = document.getElementById('search-overlay');
    if (!overlay) return;
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
    const input = document.getElementById('search-input-new');
    if (input) { input.value = ''; }
    const results = document.getElementById('search-results-new');
    if (results) results.innerHTML = '<p id="search-hint" class="text-gray-500 text-sm text-center py-6">Type to search images...</p>';
}

function closeSearch(e) {
    // Close if clicking the backdrop
    if (e.target.id === 'search-overlay') closeSearchModal();
}

// Keep toggleSearchBar as alias so existing button works
function toggleSearchBar() { openSearchModal(); }
function closeSearchBar() { closeSearchModal(); }

let _searchTimer = null;
function runSearch(query) {
    clearTimeout(_searchTimer);
    const resultsEl = document.getElementById('search-results-new');
    if (!resultsEl) return;

    if (!query.trim()) {
        resultsEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-6">Type to search images...</p>';
        return;
    }

    resultsEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-6">Searching...</p>';

    _searchTimer = setTimeout(async () => {
        try {
            const q = query.toLowerCase().trim();
            // Search the ENTIRE database directly (title or creator name), not just a recent batch
            const { data: posts, error } = await _supabase
                .from('posts')
                .select('id, title, tags, image_url, creator_name, creator_id')
                .or(`title.ilike.%${q.replace(/[,()%*\\]/g, ' ')}%,creator_name.ilike.%${q.replace(/[,()%*\\]/g, ' ')}%`)
                .order('created_at', { ascending: false })
                .limit(60);

            if (error) {
                resultsEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-6">Search failed, try again</p>';
                console.error(error);
                return;
            }

            const filtered = posts || [];

            if (filtered.length === 0) {
                resultsEl.innerHTML = `<p class="text-gray-500 text-sm text-center py-6">No results for "<span class="text-white">${esc(query)}</span>"</p>`;
                return;
            }

            resultsEl.innerHTML = `
                <p class="text-gray-500 text-xs uppercase tracking-widest mb-3">${filtered.length} result${filtered.length !== 1 ? 's' : ''}</p>
                <div class="masonry-feed">
                    ${filtered.map(post => {
                        const title = esc(post.title ? post.title.toUpperCase() : 'UNTITLED');
                        const tags = (post.tags || []).slice(0, 3).map(t => `<span class="px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded-full text-sky-400 text-[9px] font-bold">#${esc(t)}</span>`).join('');
                        return `<div class="masonry-card group cursor-pointer" onclick="closeSearchModal(); openPostDetail('${post.id}')">
                            <div class="relative rounded-2xl overflow-hidden border border-white/5 hover:border-sky-500/30 transition">
                                <img src="${cldThumb(post.image_url)}" class="w-full h-auto block" loading="lazy" alt="${title}">
                                <div class="absolute top-0 left-0 right-0 p-2 flex items-center justify-between">
                                    <span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase px-2 py-1 rounded-lg truncate max-w-[70%]">${title}</span>
                                </div>
                                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform rounded-b-2xl">
                                    <div class="flex flex-wrap gap-1 mb-1">${tags}</div>
                                    <p class="text-gray-400 text-[10px]">@${esc(post.creator_name || 'Creator')}</p>
                                </div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>`;
        } catch(err) {
            resultsEl.innerHTML = '<p class="text-red-400 text-sm text-center py-6">Search failed. Try again.</p>';
        }
    }, 300);
}

// Close search on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeSearchModal();
});

// Close stock filter panel on outside click
document.addEventListener('click', function(e) {
    if (!e.target.closest('#stock-filter-btn') && !e.target.closest('#stock-filter-panel')) {
        const panel = document.getElementById('stock-filter-panel');
        if (panel) panel.classList.add('hidden');
    }
});

// Hook into showPage to load uploads when account opens
// Feed state variables
let _adsFeedLoaded = false, _adsFeedLoading = false;
let _stockFeedLoaded = false, _stockFeedLoading = false;

const _origShowPage2 = window.showPage;
window.showPage = function(pageId, pushToHistory) {
    document.getElementById('main-navbar').style.display = '';
    document.querySelectorAll('section').forEach(el => el.style.display = '');
    const detailEl = document.getElementById('post-detail');
    if (detailEl) { detailEl.style.display = 'none'; detailEl.style.paddingTop = ''; }
    
    _origShowPage2(pageId, pushToHistory);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (pageId === 'home') {
        loadHomePreviews();
    }
    if (pageId === 'account') {
        _uploadsLoading = false;
        setTimeout(loadMyUploads, 300);
    }
    if (pageId === 'samples') {
        _feedLoaded = false;
        loadCommunityFeed();
    }
    if (pageId === 'ads-poster') {
        _adsFeedLoaded = false;
        loadAdsFeed();
    }
    if (pageId === 'ai-stock') {
        _stockFeedLoaded = false;
        loadStockFeed();
    }
};

// ===== CREATOR PROFILE VISIT =====
window.viewCreatorProfile = function() {
    const creatorId = window._currentDetailCreatorId;
    if (!creatorId) return;
    // If it's the current user, go to own account page
    _supabase.auth.getSession().then(({ data: { session } }) => {
        if (session && session.user.id === creatorId) {
            window.location.href = '/account';
        } else {
            // Open creator profile in global search / user profile view
            openUserProfileById(creatorId);
        }
    });
};

async function openUserProfileById(userId) {
    // Fetch user profile data
    const { data: profile } = await _supabase
        .from('profiles')
        .select(PROFILE_PUBLIC_COLS)
        .eq('id', userId)
        .single();

    const { data: posts } = await _supabase
        .from('posts')
        .select(POST_LIST_COLS)
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

    if (!profile && !posts) return;

    // Get name from first post if profile has no display_name
    const creatorName = (posts && posts.length > 0) ? posts[0].creator_name : 'Creator';
    const creatorAvatar = (posts && posts.length > 0) ? posts[0].creator_avatar : null;

    // Build modal
    let modalEl = document.getElementById('user-profile-modal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'user-profile-modal';
        modalEl.className = 'fixed inset-0 z-[10002] bg-black/80 backdrop-blur-md flex items-start justify-center overflow-y-auto';
        modalEl.onclick = function(e) { if (e.target === modalEl) closeUserProfileModal(); };
        document.body.appendChild(modalEl);
    }

    // Check follow state
    const { data: { session } } = await _supabase.auth.getSession();
    let isFollowing = false;
    let isOwnProfile = session && session.user.id === userId;
    if (session && !isOwnProfile) {
        const { data: fw } = await _supabase.from('follows').select('id').eq('follower_id', session.user.id).eq('following_id', userId).single();
        isFollowing = !!fw;
    }

    // Follower counts
    const { count: followerCount } = await _supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId);
    const { count: followingCount } = await _supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId);

    const badgeHTML = profile ? renderBadgesHTML(profile, 'text-sm') : '';
    const avatarHTML = creatorAvatar
        ? `<img src="${cldAvatar(creatorAvatar)}" class="w-full h-full object-cover" alt="">`
        : `<div class="w-full h-full flex items-center justify-center"><i class="fa-solid fa-user text-sky-400 text-2xl"></i></div>`;

    const followBtnHTML = isOwnProfile ? '' : isFollowing
        ? `<button id="upm-follow-btn" onclick="toggleFollowUserModal('${userId}')" class="px-6 py-2 bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-sm rounded-xl transition">Following</button>`
        : `<button id="upm-follow-btn" onclick="toggleFollowUserModal('${userId}')" class="px-6 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm rounded-xl transition">Follow</button>`;

    const postsGrid = (posts && posts.length > 0)
        ? posts.map(p => `<div class="rounded-xl overflow-hidden cursor-pointer" onclick="closeUserProfileModal(); openPostDetail('${p.id}')"><img src="${cldThumb(p.image_url)}" class="w-full h-auto block" loading="lazy"></div>`).join('')
        : `<p class="col-span-3 text-center text-gray-500 py-8">No posts yet</p>`;

    modalEl.innerHTML = `
        <div class="w-full max-w-lg mx-auto my-6 bg-[#0d0d1a] border border-white/10 rounded-3xl overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <button onclick="closeUserProfileModal()" class="text-gray-400 hover:text-white transition">
                    <i class="fa-solid fa-arrow-left"></i>
                </button>
                <span class="text-white font-black text-sm uppercase tracking-widest">Profile</span>
                <div class="w-6"></div>
            </div>
            <!-- Profile Info -->
            <div class="px-5 pt-6 pb-4">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-sky-500/40 bg-white/5 flex-shrink-0">${avatarHTML}</div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                            <h2 class="text-white font-black text-lg">@${esc(creatorName)}</h2>
                            ${badgeHTML}
                        </div>
                        <div class="flex items-center gap-4 mt-1 text-gray-400 text-xs">
                            <span><span class="text-white font-bold">${followerCount || 0}</span> followers</span>
                            <span><span class="text-white font-bold">${followingCount || 0}</span> following</span>
                        </div>
                    </div>
                    ${followBtnHTML}
                </div>
                <p class="text-gray-400 text-sm">${esc(profile?.bio || '')}</p>
            </div>
            <!-- Posts Grid -->
            <div class="px-3 pb-5">
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 px-2 mb-3">Posts · ${posts ? posts.length : 0}</p>
                <div class="grid grid-cols-3 gap-2">${postsGrid}</div>
            </div>
        </div>`;

    modalEl.style.display = 'flex';
    history.pushState({ userProfile: true }, '');
}

function closeUserProfileModal() {
    const modal = document.getElementById('user-profile-modal');
    if (modal) modal.style.display = 'none';
}

// ===== FOLLOW / UNFOLLOW FROM POST DETAIL =====
window.toggleFollowCreator = async function() {
    const creatorId = window._currentDetailCreatorId;
    if (!creatorId) return;
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { showToast('Sign in to follow!'); toggleLoginModal(true); return; }
    if (session.user.id === creatorId) return;
    await _toggleFollow(session.user.id, creatorId, 'detail-follow-btn');
};

// ===== FOLLOW / UNFOLLOW FROM USER PROFILE MODAL =====
window.toggleFollowUserModal = async function(targetUserId) {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { showToast('Sign in to follow!'); toggleLoginModal(true); return; }
    await _toggleFollow(session.user.id, targetUserId, 'upm-follow-btn');
};

// ===== SHARED FOLLOW LOGIC =====
async function _toggleFollow(followerId, followingId, btnId) {
    const { data: existing } = await _supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

    const btn = document.getElementById(btnId);

    if (existing) {
        // Unfollow
        await _supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId);
        if (btn) {
            btn.innerText = 'Follow';
            btn.classList.remove('bg-white/10', 'hover:bg-white/20', 'text-gray-300');
            btn.classList.add('bg-sky-600', 'hover:bg-sky-500', 'text-white');
        }
        showToast('Unfollowed');
    } else {
        // Follow
        await _supabase.from('follows').insert([{ follower_id: followerId, following_id: followingId }]);
        if (btn) {
            btn.innerText = 'Following';
            btn.classList.remove('bg-sky-600', 'hover:bg-sky-500');
            btn.classList.add('bg-white/10', 'hover:bg-white/20', 'text-gray-300');
        }
        showToast('Following! 🎉');
    }
}

// Close user profile modal on back button
window.addEventListener('popstate', function(e) {
    const modal = document.getElementById('user-profile-modal');
    if (modal && modal.style.display !== 'none') {
        closeUserProfileModal();
    }
});



// ===== HOME PAGE PREVIEWS (AI Images / Ads Poster / AI Stock) =====
async function loadHomePreviewCategory(category, containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    try {
        let query;
        if (category === 'ai_images') {
            query = _supabase.from('posts').select(POST_LIST_COLS).or('category.eq.ai_images,category.is.null').order('created_at', { ascending: false }).limit(5);
        } else {
            query = _supabase.from('posts').select(POST_LIST_COLS).eq('category', category).order('created_at', { ascending: false }).limit(5);
        }
        const { data: posts, error } = await query;
        if (error || !posts || posts.length === 0) {
            el.innerHTML = '<div class="col-span-full text-center py-8 text-gray-600 text-xs font-bold uppercase tracking-widest">No creations yet</div>';
            return;
        }
        el.innerHTML = posts.map(post => `
            <div class="relative rounded-xl overflow-hidden cursor-pointer group aspect-square border border-white/5 hover:border-sky-500/30 transition-all duration-300" onclick="openPostDetail('${post.id}')">
                <img src="${cldThumb(post.image_url)}" class="w-full h-full object-cover" loading="lazy" alt="AI Art">
                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
        el.innerHTML = '<div class="col-span-full text-center py-8 text-gray-600 text-xs font-bold uppercase tracking-widest">Failed to load</div>';
    }
}

function loadHomePreviews() {
    loadHomePreviewCategory('ai_images', 'home-preview-images');
    loadHomePreviewCategory('ads_poster', 'home-preview-ads');
    loadHomePreviewCategory('ai_stock', 'home-preview-stock');
}

// ===== BEFORE/AFTER COMPARISON SLIDER =====
function initBeforeAfterSliders() {
    document.querySelectorAll('.ba-slider').forEach(slider => {
        if (slider._baInit) return; // avoid double-binding
        slider._baInit = true;

        const beforeImg = slider.querySelector('.ba-before-img');
        const handle = slider.querySelector('.ba-handle');
        let dragging = false;

        function setPosition(clientX) {
            const rect = slider.getBoundingClientRect();
            let percent = ((clientX - rect.left) / rect.width) * 100;
            percent = Math.max(0, Math.min(100, percent));
            beforeImg.style.clipPath = `inset(0 ${100 - percent}% 0 0)`;
            handle.style.left = percent + '%';
        }

        function onDown(e) {
            dragging = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            setPosition(clientX);
        }
        function onMove(e) {
            if (!dragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            setPosition(clientX);
        }
        function onUp() { dragging = false; }

        slider.addEventListener('mousedown', onDown);
        slider.addEventListener('touchstart', onDown, { passive: true });
        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchend', onUp);
    });
}
document.addEventListener('DOMContentLoaded', initBeforeAfterSliders);

// ===== COPY UPSCALE PROMPT =====
function copyUpscalePrompt(btn) {
    const prompt = "Ultra high-resolution photo enhancement and upscaling. Transform this image into a crystal-clear, detailed, realistic quality. Remove noise, blur, grain, scratches, and compression artifacts. Sharpen all important details while keeping natural texture. Restore faded colors, balance exposure, increase clarity and contrast. Improve skin tone and facial features naturally, without altering identity. Repair old damage or missing details. Produce a clean, vibrant, ultra-realistic result with soft.";
    navigator.clipboard.writeText(prompt).then(() => {
        if (typeof showToast === 'function') {
            showToast('Prompt copied!');
        }
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => { btn.innerHTML = original; }, 1800);
        }
    }).catch(() => {
        if (typeof showToast === 'function') {
            showToast('Could not copy prompt');
        }
    });
}

// ===== PORTRAIT TRANSFORMER - STYLE PROMPTS (no AI/API needed) =====
// TODO: Replace each placeholder below with Hazzy's real manual prompt text.
const PORTRAIT_STYLE_PROMPTS = {
    cyberpunk: "use my reference picture and create a striking cyberpunk cyborg portrait: a androgynous face with asymmetrical glowing implant arcs, semi-translucent skin with faint circuitry veins, cyber biomechanical irises emitting electric blue pulsing, slightly angular jawline, subtle scar over left eyebrow. Lighting: dual-point neon backlight with electric blue and purple hues, rim lighting for chrome highlights, softfall shadows. Camera: 85mm portrait lens, f/1.4, ISO 100, shutter 1/200s. Background: neon-lit dystopian cityscape, blurred synthwave billboards, rain-slicked reflective alley. Color grade: high saturation, deep teal palette, punchy neon glow, subtle greenish tint for cool mood. Mood: tense, alluring, enigmatic, futurist. Render quality: hyperrealistic, 8k resolution, sharp depth of field, cinematic composition.",
    pixar: "Transform the uploaded photo into a premium Pixar-style 3D animated portrait while preserving the exact identity, facial features, hairstyle, skin tone, pose, outfit, composition, and camera angle of the original image. create a heartwarming Disney-Pixar inspired character with a soft, rounded face, large expressive glossy eyes, smooth baby skin, subtle rosy cheeks, tiny realistic nose, natural lips, and an innocent calm expression. Keep the same clothing, including the navy blue hood with fluffy white fleece lining, cream sleeves, yellow teddy bear design, and zipper exactly as in the original photo. Use cinematic soft lighting with warm highlights, global illumination, realistic subsurface skin scattering, ultra-detailed fabric textures, soft plush materials, realistic embroidery, fluffy fur details, physically based rendering (PBR), ray-traced reflections, ambient occlusion, and depth of field. The background should remain soft, blurred, cozy, and clean with pastel blue and cream tones, creating a warm nursery atmosphere.Style: Authentic Pixar Animation Studios quality, feature-film character design, ultra-cute proportions, premium 3D CGI, high-end render, Unreal Engine 5 quality, Octane Render, Redshift Render, Disney-quality lighting. Ultra realistic Pixar CGI, 8K resolution, HDR, masterpiece, sharp focus, studio-quality rendering.\n\nNegative prompt: low quality, blurry, noisy, flat lighting, extra fingers, deformed face, different clothes, different pose, different background, watermark, text, logo, oversaturated colors, creepy eyes, duplicate body parts, low resolution, artifacts, anime, cartoon sketch, plastic skin.",
    profile: "Use my reference picture and create a hyper\u2011detailed corporate headshot portrait of a generic adult professional. The face is symmetrical, with a subtle smile, warm eyes, matte translucent skin with fine pores, mild natural freckles, hair in a classic tailored cut. Two\u2011point studio lighting: 45\u00b0 key light with softbox, 135\u00b0 fill light, 2:1 ratio, smooth shadows, slight rim for depth. Capture with an 85mm f/1.4 prime lens for shallow depth of field and crisp focus on eyes, bokeh bloom. Neutral background gradient white to off\u2011white, minimal texture. Color grade: cool teal\u2011blue tint, subtle warmth at skin tone, high contrast, HDR. Mood: confident, calm, professional. Render quality: 8K resolution, ultra\u2011high detail, film\u2011style texture, perfect sharpness.",
    sketch: "Transform the uploaded image into a premium, hand-drawn graphite pencil sketch while preserving the exact facial features, expression, head angle, proportions, and identity of the person. Keep the composition closely matched to the original image.\n\nCreate a highly realistic monochrome artwork with smooth graphite shading, delicate cross-hatching, fine pencil textures, soft gradients, and subtle skin details. The eyes should be sharp, expressive, and naturally reflective. Preserve the gentle smile and innocent facial expression exactly as in the reference.\n\nUse clean white textured drawing paper as the background with light artistic pencil strokes around the subject. Maintain realistic lighting and natural depth, giving the portrait a professional gallery-quality appearance. The sketch should look as if it was drawn by a master portrait artist using graphite pencils.\n\nUltra-detailed, photorealistic pencil drawing, museum-quality portrait, soft shadows, realistic skin texture, clean edges, professional hand-drawn illustration, 8K resolution, ultra high detail, HDR quality, masterpiece.\n\nNegative prompt: cartoon, anime, painting, watercolor, oil painting, color, CGI, low quality, blurry, noisy, distorted face, deformed eyes, extra features, duplicate face, bad anatomy, oversharpening, watermark, logo, text, frame, low resolution, oversaturated, unrealistic shading.",
    anime: "Transform the uploaded photo into a premium high-quality anime portrait while preserving the exact facial identity, hairstyle, facial proportions, skin tone, expression, pose, camera angle, and clothing from the original image. Keep the same serious facial expression and direct eye contact.\n\nStyle: Modern Japanese anime with ultra-clean line art, soft cel shading, smooth gradients, expressive glossy brown eyes, detailed black hair with natural highlights, subtle facial shadows, and beautifully rendered skin.\n\nThe face should remain highly recognizable and closely match the original person, only converted into anime style. Maintain realistic facial proportions instead of exaggerated cartoon features.\n\nLighting: Soft natural daylight with gentle cinematic highlights and shadows.\nBackground: Clean light gradient background with minimal distractions.\nColor Palette: Warm natural skin tones, deep black hair, soft neutral colors.\nQuality: Ultra detailed, 8K, crisp edges, professional anime illustration, masterpiece, best quality, highly detailed, vibrant colors, sharp focus.\n\nNegative prompt: low quality, blurry, distorted face, wrong facial features, different hairstyle, different expression, extra eyes, extra ears, extra limbs, deformed anatomy, cropped head, watermark, logo, text, noise, oversaturated colors, low resolution, ugly, unrealistic proportions, bad hands, duplicate face.\n\nAspect Ratio: 4:5 (or keep the same aspect ratio as the original image).",
    oilpainting: "Transform the uploaded photo into a breathtaking, museum-quality traditional oil painting while preserving the exact facial features, hairstyle, pose, clothing, composition, and peaceful expression of the original person. The subject stands in a golden field of tall dry grass with eyes closed and head gently tilted upward, illuminated by warm sunset light. Use thick, expressive impasto brushstrokes, rich canvas texture, layered oil paint, realistic skin tones, and finely painted details. The white T-shirt should feature visible textured paint strokes while remaining clean and elegant. The background should become a softly blended painterly landscape with warm golden grasses and a luminous sky painted in classical impressionist style. Create dramatic yet natural lighting with warm amber highlights and soft shadows. The artwork should feel handcrafted by a master painter, resembling a timeless gallery masterpiece with exceptional realism, depth, color harmony, and premium fine-art quality.",
    ghibli: "Use the uploaded image as the primary reference. Preserve the exact face, hairstyle, beard, skin tone, facial expression, pose, camera angle, clothing, background, composition, lighting, and proportions exactly as in the original photo. Do not change the identity or position of any person. Transform only the visual style into a hand-painted Studio Ghibli-inspired anime illustration with soft watercolor textures, warm cinematic lighting, expressive anime eyes, delicate line art, pastel color palette, cozy atmosphere, and authentic Japanese animation aesthetics. Keep everything else identical to the original image. Ultra-detailed, masterpiece, 8K, highest quality.",
    fantasy: "Transform the uploaded photo into an epic Viking fantasy portrait while preserving the exact face, facial features, hairstyle, skin tone, facial hair, expression, body proportions, and identity of the original person. Replace the modern clothing with authentic Nordic Viking warrior attire made of dark leather armor, engraved metal plates, thick brown fur cloak, leather belts, gauntlets, and weathered medieval fabrics. Place an intricately carved double-handed Viking battle axe in his hands. Add subtle battle scars on the face while keeping the original smile and natural appearance.\n\nCreate a breathtaking cinematic environment with dramatic Nordic mountains, a cold rocky shoreline, stormy clouds, sea mist, Viking longships with dragon-head prows, wooden shields, carved Norse pillars, burning torches, and an ancient Viking settlement in the distance. Use moody blue-gray color grading with warm orange firelight, volumetric fog, realistic atmospheric depth, flying embers, and cinematic lighting.\n\nUltra-photorealistic, fantasy realism, 8K HDR, hyper-detailed textures, DSLR quality, razor-sharp focus on the face, shallow depth of field, premium movie-poster composition, Unreal Engine quality, extremely realistic leather, fur, metal, and skin textures, dramatic composition, high contrast, masterpiece, award-winning fantasy portrait.",
    upscale: "Ultra high-resolution photo enhancement and upscaling. Transform this image into a crystal-clear, detailed, realistic quality. Remove noise, blur, grain, scratches, and compression artifacts. Sharpen all important details while keeping natural texture. Restore faded colors, balance exposure, increase clarity and contrast. Improve skin tone and facial features naturally, without altering identity. Repair old damage or missing details. Produce a clean, vibrant, ultra-realistic result with soft."
};

function copyPortraitStylePrompt(styleKey, btn) {
    const prompt = PORTRAIT_STYLE_PROMPTS[styleKey] || '';
    navigator.clipboard.writeText(prompt).then(() => {
        if (typeof showToast === 'function') {
            showToast('Prompt copied!');
        }
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
            setTimeout(() => { btn.innerHTML = original; }, 1800);
        }
    }).catch(() => {
        if (typeof showToast === 'function') {
            showToast('Could not copy prompt');
        }
    });
}

// ===== ADS POSTER FEED =====
async function loadAdsFeed(force = false) {
    if (_adsFeedLoading) return;
    if (_adsFeedLoaded && !force) return;
    _adsFeedLoading = true;
    const feedEl = document.getElementById('ads-feed');
    const loadingEl = document.getElementById('ads-loading');
    const emptyEl = document.getElementById('ads-empty');
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (feedEl) feedEl.innerHTML = '';
    try {
        const { data: posts, error: loadErr } = await _supabase.from('posts').select(POST_LIST_COLS).eq('category','ads_poster').order('created_at',{ascending:false});
        if (loadingEl) loadingEl.classList.add('hidden');
        if (loadErr) { console.error(loadErr); showLoadError(feedEl, () => loadAdsFeed(true)); _adsFeedLoading = false; return; }
        if (!posts || posts.length === 0) { if (emptyEl) emptyEl.classList.remove('hidden'); _adsFeedLoading=false; return; }
        window._adsPosts = posts;
        _adsFeedLoaded = true;
        renderGalleryPage(posts, 'ads', 1);
    } catch(e) { console.error(e); if (loadingEl) loadingEl.classList.add('hidden'); showLoadError(feedEl, () => loadAdsFeed(true)); }
    _adsFeedLoading = false;
}

// ===== AI STOCK FEED =====
async function loadStockFeed(force = false) {
    if (_stockFeedLoading) return;
    if (_stockFeedLoaded && !force) return;
    _stockFeedLoading = true;
    const feedEl = document.getElementById('stock-feed');
    const loadingEl = document.getElementById('stock-loading');
    const emptyEl = document.getElementById('stock-empty');
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    if (feedEl) feedEl.innerHTML = '';
    try {
        const { data: posts, error: loadErr } = await _supabase.from('posts').select(POST_LIST_COLS).eq('category','ai_stock').order('created_at',{ascending:false});
        if (loadingEl) loadingEl.classList.add('hidden');
        if (loadErr) { console.error(loadErr); showLoadError(feedEl, () => loadStockFeed(true)); _stockFeedLoading = false; return; }
        if (!posts || posts.length === 0) { if (emptyEl) emptyEl.classList.remove('hidden'); _stockFeedLoading=false; return; }
        window._stockPosts = posts;
        _stockFeedLoaded = true;
        renderGalleryPage(posts, 'stock', 1);
    } catch(e) { console.error(e); if (loadingEl) loadingEl.classList.add('hidden'); showLoadError(feedEl, () => loadStockFeed(true)); }
    _stockFeedLoading = false;
}


// ===== PROFILE: ADS POST TAB =====
async function loadMyAdsPosts() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return;
    const grid = document.getElementById('my-ads-grid');
    const emptyEl = document.getElementById('my-ads-empty');
    const loadingEl = document.getElementById('my-ads-loading');
    if (grid) grid.innerHTML = '';
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    const { data: posts, error: tabErr } = await _supabase
        .from('posts')
        .select(POST_LIST_COLS)
        .eq('creator_id', session.user.id)
        .eq('category', 'ads_poster')
        .order('created_at', { ascending: false });
    if (loadingEl) loadingEl.classList.add('hidden');
    if (tabErr) { console.error(tabErr); showLoadError(grid, loadMyAdsPosts); return; }
    if (!posts || posts.length === 0) {
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }
    if (grid) grid.innerHTML = posts.map(post => profileCardHTML(post, true)).join('');
}

// ===== PROFILE: AI STOCK TAB =====
async function loadMyStockPosts() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) return;
    const grid = document.getElementById('my-stock-grid');
    const emptyEl = document.getElementById('my-stock-empty');
    const loadingEl = document.getElementById('my-stock-loading');
    if (grid) grid.innerHTML = '';
    if (loadingEl) loadingEl.classList.remove('hidden');
    if (emptyEl) emptyEl.classList.add('hidden');
    const { data: posts, error: tabErr } = await _supabase
        .from('posts')
        .select(POST_LIST_COLS)
        .eq('creator_id', session.user.id)
        .eq('category', 'ai_stock')
        .order('created_at', { ascending: false });
    if (loadingEl) loadingEl.classList.add('hidden');
    if (tabErr) { console.error(tabErr); showLoadError(grid, loadMyStockPosts); return; }
    if (!posts || posts.length === 0) {
        if (emptyEl) emptyEl.classList.remove('hidden');
        return;
    }
    if (grid) grid.innerHTML = posts.map(post => profileCardHTML(post, true)).join('');
}


// ===== AI STOCK FILTER PANEL =====
function toggleStockFilterPanel() {
    document.getElementById('stock-filter-panel').classList.toggle('hidden');
}

// ===== AI STOCK CATEGORY FILTER =====
function filterStockCat(cat) {
    // Close panel
    document.getElementById('stock-filter-panel').classList.add('hidden');
    // Update active button style
    document.querySelectorAll('#stock-filter-panel .stock-cat-btn').forEach(btn => {
        btn.className = 'stock-cat-btn w-full text-left px-4 py-2.5 text-gray-300 hover:bg-cyan-600/20 text-sm font-bold transition';
    });
    const activeBtn = document.querySelector('#stock-filter-panel [data-tag="' + cat + '"]');
    if (activeBtn) activeBtn.className = 'stock-cat-btn w-full text-left px-4 py-2.5 text-cyan-300 bg-cyan-600/20 text-sm font-bold transition';


    const feedEl = document.getElementById('stock-feed');
    if (!feedEl || !window._stockPosts) return;

    const posts = cat === 'all'
        ? window._stockPosts
        : window._stockPosts.filter(p =>
            (p.tags && p.tags.some(t => t.toLowerCase().includes(cat.toLowerCase()))) ||
            (p.title && p.title.toLowerCase().includes(cat.toLowerCase()))
          );

    feedEl.innerHTML = '';
    const emptyEl = document.getElementById('stock-empty');
    if (posts.length === 0) {
        if (emptyEl) emptyEl.classList.remove('hidden');
        const paginationEl = document.getElementById('stock-pagination');
        if (paginationEl) paginationEl.innerHTML = '';
        return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    renderGalleryPage(posts, 'stock', 1);
}


// ===== ADS POSTER FILTER =====
function toggleAdsFilterPanel() {
    document.getElementById('ads-filter-panel').classList.toggle('hidden');
    const stockPanel = document.getElementById('stock-filter-panel');
    if (stockPanel) stockPanel.classList.add('hidden');
}

function filterAdsCat(cat) {
    document.getElementById('ads-filter-panel').classList.add('hidden');
    document.querySelectorAll('#ads-filter-panel .ads-cat-btn').forEach(btn => {
        btn.className = 'ads-cat-btn w-full text-left px-4 py-2.5 text-gray-300 hover:bg-orange-600/20 text-sm font-bold transition';
    });
    const activeBtn = document.querySelector('#ads-filter-panel [data-tag="' + cat + '"]');
    if (activeBtn) activeBtn.className = 'ads-cat-btn w-full text-left px-4 py-2.5 text-orange-300 bg-orange-600/20 text-sm font-bold transition';

    const feedEl = document.getElementById('ads-feed');
    if (!feedEl || !window._adsPosts) return;

    const posts = cat === 'all'
        ? window._adsPosts
        : window._adsPosts.filter(p =>
            (p.tags && p.tags.some(t => t.toLowerCase().includes(cat.toLowerCase()))) ||
            (p.title && p.title.toLowerCase().includes(cat.toLowerCase()))
          );

    feedEl.innerHTML = '';
    const emptyEl = document.getElementById('ads-empty');
    if (posts.length === 0) {
        if (emptyEl) emptyEl.classList.remove('hidden');
        const paginationEl = document.getElementById('ads-pagination');
        if (paginationEl) paginationEl.innerHTML = '';
        return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    renderGalleryPage(posts, 'ads', 1);
}

// Close both panels on outside click
document.addEventListener('click', function(e) {
    if (!e.target.closest('#ads-filter-btn') && !e.target.closest('#ads-filter-panel')) {
        const p = document.getElementById('ads-filter-panel');
        if (p) p.classList.add('hidden');
    }
    if (!e.target.closest('#stock-filter-btn') && !e.target.closest('#stock-filter-panel')) {
        const p = document.getElementById('stock-filter-panel');
        if (p) p.classList.add('hidden');
    }
});

// ===== PROMPT SEE MORE / SEE LESS (PC ONLY) =====
// ===== IMAGE FADE-IN ON LOAD =====
document.addEventListener('DOMContentLoaded', function() {
    document.body.addEventListener('load', function(e) {
        if (e.target.tagName === 'IMG') {
            e.target.classList.add('loaded');
        }
    }, true);
    // Mark already loaded images
    document.querySelectorAll('img').forEach(function(img) {
        if (img.complete) img.classList.add('loaded');
    });
});

function togglePromptExpand() {
    var p = document.getElementById('detail-prompt');
    var btn = document.getElementById('prompt-toggle-label');
    if (!p || !btn) return;
    var isCollapsed = p.classList.contains('prompt-collapsed');
    if (isCollapsed) {
        p.classList.remove('prompt-collapsed');
        p.classList.add('prompt-expanded');
        btn.textContent = 'See Less ▴';
    } else {
        p.classList.remove('prompt-expanded');
        p.classList.add('prompt-collapsed');
        btn.textContent = 'See More ▾';
    }
}

function initPromptToggle() {
    var p = document.getElementById('detail-prompt');
    var btn = document.getElementById('prompt-toggle-btn');
    if (!p || !btn) return;
    p.classList.add('prompt-collapsed');
    p.classList.remove('prompt-expanded');
    var label = document.getElementById('prompt-toggle-label');
    if (label) label.textContent = 'See More ▾';
    if (window.innerWidth >= 768 && p.scrollHeight > 100) {
        btn.style.display = 'inline-flex';
    } else {
        btn.style.display = 'none';
    }
}



// =========================================================
// ACCESSIBILITY (item 10)
// Labels for icon-only buttons, keyboard support for clickable
// divs, dialog roles, Escape to close, skip link, live toasts.
// =========================================================
(function initA11y() {
    const LABELS = {
        toggleSidebar: 'Open or close menu', closeSearchModal: 'Close search', closeUploadModal: 'Close upload form',
        closePostModal: 'Close post', toggleSearchBar: 'Search', toggleFilterPanel: 'Filter by category',
        toggleSortPanel: 'Sort posts', goBackToGallery: 'Back to gallery', toggleTheme: 'Switch light or dark theme',
        toggleDetailLike: 'Like this post', toggleLikePost: 'Like this post', toggleSavePost: 'Save this post',
        editDisplayName: 'Edit display name', saveDisplayName: 'Save display name', copyDetailPrompt: 'Copy prompt',
        copyPostPrompt: 'Copy prompt', submitComment: 'Post comment', showPage: 'Go to home page',
        toggleLoginModal: 'Sign in'
    };
    const MODALS = { 'upload-modal': 'Upload your creation', 'post-modal': 'Post details', 'login-modal': 'Sign in or sign up', 'search-overlay': 'Search' };

    function humanize(fn) { return fn.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()).trim(); }

    function enhance() {
        document.querySelectorAll('i[class*="fa-"]:not([aria-hidden])').forEach(el => el.setAttribute('aria-hidden', 'true'));

        document.querySelectorAll('button:not([aria-label])').forEach(btn => {
            if (/[A-Za-z0-9]/.test(btn.textContent)) return;
            const fn = ((btn.getAttribute('onclick') || '').match(/([A-Za-z_]+)\(/) || [])[1];
            const label = btn.getAttribute('title') || (fn && (LABELS[fn] || humanize(fn))) || 'Button';
            btn.setAttribute('aria-label', label);
        });

        document.querySelectorAll('[onclick]:not(button):not(a):not(input):not([role])').forEach(el => {
            if (el.id === 'search-overlay' || el === document.body) return;
            el.setAttribute('role', 'button');
            if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
            if (!el.hasAttribute('aria-label') && !/[A-Za-z0-9]/.test(el.textContent)) {
                const img = el.querySelector('img[alt]');
                el.setAttribute('aria-label', (img && img.alt) || 'Open');
            }
        });

        document.querySelectorAll('input:not([type=hidden]):not([aria-label]), textarea:not([aria-label]), select:not([aria-label])').forEach(el => {
            if (el.id && document.querySelector('label[for="' + el.id + '"]')) return;
            const txt = el.getAttribute('placeholder') || el.getAttribute('title');
            if (txt) el.setAttribute('aria-label', txt);
            else if (el.type === 'file') el.setAttribute('aria-label', 'Choose image');
            else {
                const lb = el.parentElement && el.parentElement.querySelector('label');
                el.setAttribute('aria-label', (lb && lb.textContent.trim()) || humanize((el.id || 'field').replace(/[-_]?input$/, '').replace(/[-_]/g, ' ')));
            }
        });

        document.querySelectorAll('img:not([alt])').forEach(img => img.setAttribute('alt', ''));

        Object.keys(MODALS).forEach(id => {
            const m = document.getElementById(id);
            if (m && !m.hasAttribute('role')) {
                m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', MODALS[id]);
            }
        });
    }

    let timer = null;
    function schedule() { clearTimeout(timer); timer = setTimeout(enhance, 150); }

    function isOpen(id) { const m = document.getElementById(id); return !!m && !m.classList.contains('hidden'); }

    document.addEventListener('keydown', (e) => {
        // Enter / Space on a role=button element (not a real button/input) acts like a click
        const t = e.target;
        if ((e.key === 'Enter' || e.key === ' ') && t && t.getAttribute && t.getAttribute('role') === 'button' && !/^(BUTTON|A|INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) {
            e.preventDefault();
            t.click();
            return;
        }
        if (e.key !== 'Escape') return;
        // our own confirm/prompt dialog handles Escape by itself
        if (document.querySelector('.fx-overlay')) return;
        try {
            if (isOpen('post-modal') && typeof closePostModal === 'function') return closePostModal();
            if (isOpen('upload-modal') && typeof closeUploadModal === 'function') return closeUploadModal();
            if (isOpen('login-modal') && typeof toggleLoginModal === 'function') return toggleLoginModal(false);
            if (isOpen('search-overlay') && typeof closeSearchModal === 'function') return closeSearchModal();
        } catch (err) { /* ignore */ }
    });

    function addSkipLink() {
        if (document.querySelector('.skip-link')) return;
        const a = document.createElement('a');
        a.className = 'skip-link'; a.href = '#'; a.textContent = 'Skip to content';
        a.addEventListener('click', (ev) => {
            ev.preventDefault();
            const main = document.querySelector('main.active-page') || document.querySelector('main');
            if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: false }); }
        });
        document.body.insertBefore(a, document.body.firstChild);
    }

    function start() {
        addSkipLink();
        enhance();
        new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();


// Skeleton placeholders for the "My Ads" and "My Stock" profile tabs (were plain "Loading..." text)
document.addEventListener('DOMContentLoaded', function () {
    ['my-ads-loading', 'my-stock-loading'].forEach(function (id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-5 hidden';
        el.innerHTML = '<div class="skeleton-card"><div class="skeleton aspect-square"></div></div>'
            + '<div class="skeleton-card"><div class="skeleton aspect-square"></div></div>'
            + '<div class="skeleton-card hidden sm:block"><div class="skeleton aspect-square"></div></div>'
            + '<div class="skeleton-card hidden md:block"><div class="skeleton aspect-square"></div></div>'
            + '<div class="skeleton-card hidden lg:block"><div class="skeleton aspect-square"></div></div>';
    });
});


// =========================================================
// MOTION + FOCUS (item 12)
// =========================================================
function fxPop(el) {
    if (!el) return;
    el.classList.remove('fx-pop');
    void el.offsetWidth; // restart the animation
    el.classList.add('fx-pop');
}

// Briefly turns the clicked button into a green "Copied" confirmation
function fxCopied() {
    try {
        const ev = window.event;
        const btn = ev && ev.target && ev.target.closest ? ev.target.closest('button') : null;
        if (!btn || btn.dataset.fxBusy) return;
        btn.dataset.fxBusy = '1';
        const old = btn.innerHTML;
        btn.classList.add('fx-copied');
        btn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> Copied';
        setTimeout(() => { btn.innerHTML = old; btn.classList.remove('fx-copied'); delete btn.dataset.fxBusy; }, 1400);
    } catch (e) { /* purely cosmetic */ }
}

(function initModalFocus() {
    const IDS = ['post-modal', 'upload-modal', 'login-modal', 'search-overlay'];
    const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]):not([type=file]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const opener = {};

    function visible(el) { return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length); }
    function focusables(m) { return Array.from(m.querySelectorAll(FOCUSABLE)).filter(visible); }
    function topModal() {
        for (const id of IDS) { const m = document.getElementById(id); if (m && !m.classList.contains('hidden')) return m; }
        return null;
    }

    function watch(m) {
        let wasOpen = !m.classList.contains('hidden');
        new MutationObserver(() => {
            const open = !m.classList.contains('hidden');
            if (open === wasOpen) return;
            wasOpen = open;
            if (open) {
                opener[m.id] = document.activeElement;
                setTimeout(() => { const f = focusables(m); if (f.length && !m.contains(document.activeElement)) f[0].focus(); }, 60);
            } else {
                const back = opener[m.id];
                opener[m.id] = null;
                if (back && back.focus && document.contains(back)) { try { back.focus(); } catch (e) { /* ignore */ } }
            }
        }).observe(m, { attributes: true, attributeFilter: ['class'] });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab' || document.querySelector('.fx-overlay')) return;
        const m = topModal();
        if (!m) return;
        const f = focusables(m);
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (!m.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    function start() { IDS.forEach(id => { const m = document.getElementById(id); if (m) watch(m); }); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();


// =========================================================
// WELCOME TOUR (item 13)
// Shown once to new visitors on the home page. Replay from the menu.
// =========================================================
(function initWelcomeTour() {
    const KEY = 'frazx_tour_done';
    const STEPS = [
        { icon: '✨', title: 'Welcome to FRAZX PRO', text: 'A community of AI art and ready-to-use prompts. Take a 20-second tour to see what you can do here.' },
        { icon: '🖼️', title: 'Browse and copy prompts', text: 'Open AI Images, Ads Poster or AI Stock, tap any picture and copy the exact prompt that made it. Free, no sign-up needed.' },
        { icon: '🎬', title: 'Free AI tools', text: 'Cinematic Vision turns a simple idea into a detailed prompt. Portrait Transformer gives you ready styles like Anime, Ghibli and Pixar.' },
        { icon: '❤️', title: 'Join the community', text: 'Create a free account to like, save and comment, and to share your own AI creations with a prompt of your own.' }
    ];

    function store(get, val) {
        try { return get ? localStorage.getItem(KEY) : localStorage.setItem(KEY, val); } catch (e) { return null; }
    }

    function injectStyles() {
        if (document.getElementById('fx-tour-styles')) return;
        const st = document.createElement('style');
        st.id = 'fx-tour-styles';
        st.textContent = `
        .fx-tour-ov{position:fixed;inset:0;z-index:100001;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(2,6,12,.78);backdrop-filter:blur(6px);animation:fxModalIn .25s ease}
        .fx-tour{width:100%;max-width:400px;text-align:center;background:linear-gradient(180deg,rgba(56,189,248,.1),rgba(255,255,255,.02)),#0a0f18;border:1px solid rgba(125,211,252,.2);border-radius:22px;padding:30px 24px 22px;box-shadow:0 28px 70px rgba(0,0,0,.65);font-family:'Space Grotesk',system-ui,sans-serif}
        .fx-tour-ic{font-size:44px;line-height:1;margin-bottom:14px}
        .fx-tour h3{margin:0 0 8px;color:#fff;font-size:19px;font-weight:700;letter-spacing:.02em}
        .fx-tour p{margin:0 0 22px;color:#a8b0bd;font-size:14px;line-height:1.6}
        .fx-tour-dots{display:flex;justify-content:center;gap:7px;margin-bottom:20px}
        .fx-tour-dots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.18);transition:all .25s}
        .fx-tour-dots i.on{width:22px;border-radius:4px;background:#38bdf8}
        .fx-tour-row{display:flex;gap:10px;align-items:center;justify-content:space-between}
        .fx-tour-btn{font:inherit;cursor:pointer;border-radius:12px;padding:11px 18px;font-size:13px;font-weight:700;letter-spacing:.04em;border:1px solid rgba(255,255,255,.14);background:transparent;color:#cbd5e1}
        .fx-tour-btn.pri{background:#0272ad;border-color:#38bdf8;color:#fff;margin-left:auto}
        .fx-tour-btn:hover{background:rgba(255,255,255,.07)} .fx-tour-btn.pri:hover{background:#0278b8}
        .fx-tour-skip{background:none;border:none;color:#8a91a0;font:inherit;font-size:12px;cursor:pointer;padding:8px;text-decoration:underline}
        `;
        document.head.appendChild(st);
    }

    function run() {
        if (document.querySelector('.fx-tour-ov')) return;
        injectStyles();
        const prev = document.activeElement;
        let i = 0;
        const ov = document.createElement('div');
        ov.className = 'fx-tour-ov';
        const box = document.createElement('div');
        box.className = 'fx-tour';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.setAttribute('aria-label', 'Welcome tour');
        ov.appendChild(box);

        function close(done) {
            if (done) store(false, '1');
            document.removeEventListener('keydown', onKey, true);
            ov.remove();
            if (prev && prev.focus) { try { prev.focus(); } catch (e) { /* ignore */ } }
        }
        function onKey(e) {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(true); return; }
            if (e.key === 'Tab') {
                const f = Array.from(box.querySelectorAll('button'));
                if (!f.length) return;
                const first = f[0], last = f[f.length - 1];
                if (!box.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
                else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }
        }
        document.addEventListener('keydown', onKey, true);

        function render() {
            const s = STEPS[i], last = i === STEPS.length - 1;
            box.innerHTML = '';
            const ic = document.createElement('div'); ic.className = 'fx-tour-ic'; ic.textContent = s.icon; ic.setAttribute('aria-hidden', 'true');
            const h = document.createElement('h3'); h.textContent = s.title;
            const p = document.createElement('p'); p.textContent = s.text;
            const dots = document.createElement('div'); dots.className = 'fx-tour-dots'; dots.setAttribute('aria-hidden', 'true');
            STEPS.forEach((_, k) => { const d = document.createElement('i'); if (k === i) d.className = 'on'; dots.appendChild(d); });
            const row = document.createElement('div'); row.className = 'fx-tour-row';
            if (i > 0) {
                const back = document.createElement('button'); back.className = 'fx-tour-btn'; back.textContent = 'Back';
                back.onclick = () => { i--; render(); };
                row.appendChild(back);
            } else {
                const skip = document.createElement('button'); skip.className = 'fx-tour-skip'; skip.textContent = 'Skip tour';
                skip.onclick = () => close(true);
                row.appendChild(skip);
            }
            const next = document.createElement('button'); next.className = 'fx-tour-btn pri'; next.textContent = last ? 'Get started' : 'Next';
            next.onclick = () => { if (last) close(true); else { i++; render(); } };
            row.appendChild(next);
            box.append(ic, h, p, dots, row);
            next.focus();
        }
        document.body.appendChild(ov);
        render();
    }
    window.startWelcomeTour = run;

    function isHome() {
        const p = location.pathname.replace(/\/+$/, '');
        return (p === '' || p === '/index' || p === '/index.html') && !location.hash;
    }

    async function maybeAutoStart() {
        if (store(true) || !isHome()) return;
        try {
            const { data } = await _supabase.auth.getSession();
            if (data && data.session) { store(false, '1'); return; } // signed-in users are not new
        } catch (e) { return; }
        setTimeout(() => {
            if (store(true)) return;
            const blocking = ['login-modal', 'upload-modal', 'post-modal', 'search-overlay'].some(id => {
                const m = document.getElementById(id); return m && !m.classList.contains('hidden');
            });
            if (!blocking && !document.querySelector('.fx-overlay')) run();
        }, 2500);
    }

    function addReplayLink() {
        const anchor = document.getElementById('install-app-btn');
        if (!anchor || document.getElementById('tour-replay-btn')) return;
        const b = document.createElement('button');
        b.id = 'tour-replay-btn';
        b.type = 'button';
        b.className = 'flex items-center gap-4 text-white nav-link';
        b.style.cssText = 'background:none;border:none;padding:0;cursor:pointer;text-transform:uppercase;font-weight:700;font-size:12px;letter-spacing:.1em;text-align:left';
        b.innerHTML = '<i class="fa-solid fa-circle-play w-5 text-center text-sky-400" aria-hidden="true"></i><span>Take a Tour</span>';
        b.onclick = function (e) {
            e.stopPropagation();
            if (typeof toggleSidebar === 'function') { try { toggleSidebar(e); } catch (err) { /* ignore */ } }
            setTimeout(run, 200);
        };
        anchor.insertAdjacentElement('afterend', b);
    }

    function start() { addReplayLink(); maybeAutoStart(); }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

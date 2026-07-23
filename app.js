  // ===== SUPABASE SETUP =====
  const SUPABASE_URL = 'https://wfmtoodutuaeousykora.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmbXRvb2R1dHVhZW91c3lrb3JhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjUwODcsImV4cCI6MjA5NTkwMTA4N30.TCav8aVw4i5KSOKcey-zRrReLPWYosIgclzMyDB5V8w';
  const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  window._supabase = _supabase;
  window._cloudinary = { cloudName: 'dt8nzlmgk', uploadPreset: 'frazx_community' };

  // ===== IMAGE OPTIMIZATION (Cloudinary on-the-fly transforms) =====
  // Inserts a transformation string right after "/upload/" in a Cloudinary URL.
  // Non-Cloudinary URLs (e.g. fallback/demo images) are returned untouched.
  function cldUrl(url, transform) {
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
        btnEl.onclick = (e) => { e.stopPropagation(); showPage('account'); document.getElementById('sidebar').classList.add('translate-x-full'); };
        btnEl.className = 'text-[10px] bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-xl font-bold tracking-wider uppercase transition-colors pointer-events-auto cursor-pointer';
      }
      if (navText) navText.innerText = name.split(' ')[0].toUpperCase();
      if (navBtn) navBtn.onclick = () => showPage('account');

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
        btnEl.className = 'text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-xl font-bold tracking-wider uppercase transition-colors pointer-events-auto cursor-pointer';
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
      if (error.message.includes('already registered')) showToast("âŒ Email already registered!");
      else showToast("âŒ " + error.message);
      return;
    }

    // Create base profile row
    if (data.user) {
      await _supabase.from('profiles').insert({ id: data.user.id, email: data.user.email }).select();
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

    // Contributor path â€” check 6 month cooldown first
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
    showToast("Welcome! ðŸŽ‰");
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
      <button onclick="answerQuizQuestion('${opt.replace(/'/g, "\\'")}')" class="w-full text-left bg-[#050508]/60 border border-white/10 hover:border-indigo-500/50 hover:bg-indigo-600/10 rounded-xl px-4 py-3 text-white text-sm font-bold transition">
        ${opt}
      </button>`).join('');
  }

  window.answerQuizQuestion = async function(answer) {
    const q = ONBOARDING_QUESTIONS[_quizStep];
    _quizAnswers[q.key] = answer;

    // Question 1 â€” instant rejection if "No"
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

    await _supabase.from('profiles').update({
      account_type: 'contributor',
      onboarding_completed: true,
      is_onboarding_verified: isPerfect
    }).eq('id', session.user.id);

    document.getElementById('onboarding-quiz-wrap').classList.add('hidden');
    document.getElementById('quiz-success-wrap').classList.remove('hidden');
  }

  window.finishOnboarding = function() {
    toggleLoginModal(false);
    showToast("Welcome to FRAZX PRO! ðŸŽ‰");
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
      showToast("âŒ Wrong email or password!");
    } else {
      toggleLoginModal(false);
      const name = data.user.user_metadata?.display_name || data.user.email.split('@')[0];
      showToast("Welcome back " + name + "! ðŸŽ‰");
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
    document.getElementById('signup-form-wrap').classList.remove('hidden');
  };
  window.showLoginForm = function() {
    document.getElementById('signup-form-wrap').classList.add('hidden');
    document.getElementById('login-form-wrap').classList.remove('hidden');
  };

  // ===== PROFILE =====
  window.handleSidebarProfileClick = function() {
    _supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        showPage('account');
        document.getElementById('sidebar').classList.add('translate-x-full');
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
            const panels = ['signup-form-wrap', 'account-type-wrap', 'onboarding-quiz-wrap', 'quiz-rejected-wrap', 'quiz-success-wrap'];
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
            window.location.hash = defaultPage;
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

            const encodedSystem = encodeURIComponent(systemPrompt);
            const encodedMsg = encodeURIComponent(userMessage);
            const seed = Math.floor(Math.random() * 99999);
            const textApiUrl = `https://text.pollinations.ai/${encodedMsg}?system=${encodedSystem}&model=openai&seed=${seed}`;

            const response = await fetch(textApiUrl);
            const enhancedPrompt = (await response.text()).trim();

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

        const personDesc = userDesc ? `Person details: ${userDesc}.` : 'No specific person description provided â€” create a generic stunning portrait.';
        const systemPrompt = `You are an elite AI portrait prompt engineer. Generate a hyper-detailed, ultra-professional AI image generation prompt for portrait photography. The prompt should include: facial features, skin texture, lighting setup, camera lens, background, color grade, mood, and render quality. Start with "use my reference picture and create a". Keep under 160 words. Return ONLY the prompt.`;
        const userMsg = `Style: ${chosen.desc}. ${personDesc}`;

        try {
            const seed = Math.floor(Math.random() * 99999);
            const url = `https://text.pollinations.ai/${encodeURIComponent(userMsg)}?system=${encodeURIComponent(systemPrompt)}&model=openai&seed=${seed}`;
            const res = await fetch(url);
            const prompt = (await res.text()).trim();
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
        // legacy stub â€” no longer used
    }

    function copyPortraitPrompt() {
    navigator.clipboard.writeText(document.getElementById('portraitFinalPrompt').innerText);
    showToast("Prompt copied to clipboard!");
}
    function copyLocalPrompt(textElementId, buttonElement) {
    const textToCopy = document.getElementById(textElementId).innerText;
    
    navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = "âœ“ COPIED!";
        buttonElement.classList.add('text-purple-400', 'border-purple-500/40');
        
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.classList.remove('text-purple-400', 'border-purple-500/40');
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
            if (!el.classList.contains('text-[#6366f1]') && !el.classList.contains('text-indigo-500')) {
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
            if (!link.classList.contains('text-[#6366f1]') && !link.classList.contains('text-indigo-500')) {
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
        if (themeIcon) themeIcon.className = "fa-solid fa-moon text-[#6366f1]";
    }
}
   
    // Professional Toast Notification System (Fixed Overlap)
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
            .select('*')
            .or('category.eq.ai_images,category.is.null')
            .order('created_at', { ascending: false });

        if (loadingEl) loadingEl.classList.add('hidden');

        if (error || !posts || posts.length === 0) {
            if (emptyEl) emptyEl.classList.remove('hidden');
            return;
        }

        const { data: { session: currentSession } } = await _supabase.auth.getSession();
        const currentUserId = currentSession ? currentSession.user.id : null;

        // Deduplicate posts by id
        const seen = new Set();
        const uniquePosts = posts.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });

        uniquePosts.forEach(post => {
            const likes = post.likes ? post.likes.length : 0;
            const title = post.title ? post.title.toUpperCase() : (post.prompt ? post.prompt.substring(0, 28).toUpperCase() + '...' : 'UNTITLED');
            const promptPreview = post.prompt ? post.prompt.substring(0, 120) + '...' : '';
            const tags = post.tags || [];
            const creator = post.creator_name || 'Creator';
            const isOwner = currentUserId && post.creator_id === currentUserId;
            
            const card = document.createElement('div');
            card.className = 'masonry-card group cursor-pointer';
            card.onclick = () => openPostDetail(post.id);
            card.innerHTML = `
                <div class="relative rounded-2xl overflow-hidden">
                    <img src="${cldThumb(post.image_url)}" class="w-full h-auto block" alt="AI Art" loading="lazy">
                    
                    <!-- Always visible: title + likes at top -->
                    <div class="absolute top-0 left-0 right-0 p-3 flex items-center justify-between">
                        <span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg truncate max-w-[65%]">${title}</span>
                        <span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                            <i class="fa-solid fa-heart text-red-400"></i> ${likes}
                        </span>
                    </div>

                    <!-- Hover only: prompt + copy + creator -->
                    <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                        <p class="text-gray-200 text-xs leading-relaxed line-clamp-3 mb-3">${promptPreview}</p>
                        <div class="flex items-center justify-between">
                            <button onclick="event.stopPropagation(); copyFeedPrompt('${post.id}')" class="flex items-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-600 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition">
                                <i class="fa-regular fa-copy"></i> Copy
                            </button>
                            <div class="flex items-center gap-2">
                                <span class="text-gray-400 text-[10px]">@${creator}</span>
                            </div>
                        </div>
                    </div>
                </div>`;
            feedEl.appendChild(card);
        });

        // Store posts globally for detail view
        window._feedPosts = uniquePosts;
        _feedLoaded = true;

    } catch(e) {
        console.error(e);
        if (loadingEl) loadingEl.classList.add('hidden');
        if (emptyEl) emptyEl.classList.remove('hidden');
    }
}

function copyFeedPrompt(postId) {
    const post = (window._feedPosts || []).find(p => p.id === postId);
    if (post && post.prompt) {
        navigator.clipboard.writeText(post.prompt).then(() => showToast("Prompt copied! âœ…"));
        // Track copy count
        const copies = (post.copies || 0) + 1;
        _supabase.from('posts').update({ copies: copies }).eq('id', postId);
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
        const { data } = await _supabase.from('posts').select('*').eq('id', postId).single();
        if (!data) return;
        post = data;
        window._feedPosts = window._feedPosts || [];
        window._feedPosts.push(data);
    }

    window._currentDetailPostId = postId;

    // Reset save button
    const saveBtn = document.getElementById('detail-save-btn');
    if (saveBtn) {
        saveBtn.querySelector('i').className = 'fa-regular fa-bookmark';
        saveBtn.className = 'flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/30 rounded-xl text-xs font-bold text-gray-300 hover:text-indigo-400 transition';
    }

    document.getElementById('detail-image').src = cldFull(post.image_url) || '';
    document.getElementById('detail-title').innerText = post.title ? post.title.toUpperCase() : (post.prompt ? post.prompt.substring(0, 60).toUpperCase() : 'AI CREATION');
    
    // Show tags
    const tagsContainer = document.getElementById('detail-tags');
    if (tagsContainer) {
        const tags = post.tags || [];
        tagsContainer.innerHTML = tags.length > 0 
            ? tags.map(t => `<span class="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-bold">#${t}</span>`).join('') 
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
                    followBtn.classList.remove('bg-indigo-600', 'hover:bg-indigo-500');
                    followBtn.classList.add('bg-white/10', 'hover:bg-white/20', 'text-gray-300');
                } else {
                    followBtn.innerText = 'Follow';
                    followBtn.classList.add('bg-indigo-600', 'hover:bg-indigo-500');
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
    navigator.clipboard.writeText(prompt).then(() => showToast("Prompt copied! âœ…"));
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
    if (activeBtn) activeBtn.className = 'cat-btn px-4 py-2 bg-indigo-600 text-white font-black text-xs rounded-full transition border border-indigo-500';

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

    feedEl.innerHTML = '';
    
    if (filtered.length === 0) {
        if (emptyEl) {
            emptyEl.classList.remove('hidden');
            emptyEl.querySelector('p') && (emptyEl.querySelector('p').innerText = `No ${tag} posts yet`);
        }
        return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    const { data: { session: s } } = await _supabase.auth.getSession();
    const uid = s ? s.user.id : null;

    filtered.forEach(post => {
        const likes = post.likes ? post.likes.length : 0;
        const title = post.title ? post.title.toUpperCase() : (post.prompt ? post.prompt.substring(0, 28).toUpperCase() + '...' : 'UNTITLED');
        const promptPreview = post.prompt ? post.prompt.substring(0, 120) + '...' : '';
        const creator = post.creator_name || 'Creator';
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
                        <button onclick="event.stopPropagation(); copyFeedPrompt('${post.id}')" class="flex items-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition">
                            <i class="fa-regular fa-copy"></i> Copy
                        </button>
                        <span class="text-gray-400 text-[10px]">@${creator}</span>
                    </div>
                </div>
            </div>`;
        feedEl.appendChild(card);
    });
}

async function filterFeed(filter) {
    _currentFilter = filter;

    // Close sort dropdown
    const sortDd = document.getElementById('sort-dropdown');
    if (sortDd) sortDd.classList.add('hidden');

    // Update sort badge
    const badge = document.getElementById('active-sort-badge');
    const labels = { all: '', liked: 'â¤ï¸ Most Liked', copied: 'ðŸ“‹ Most Copied' };
    if (badge) {
        if (filter === 'all') { badge.classList.add('hidden'); }
        else { badge.classList.remove('hidden'); badge.innerText = labels[filter]; }
    }

    // Update sort btn highlight
    const sortBtn = document.getElementById('sort-btn');
    if (sortBtn) {
        sortBtn.className = filter !== 'all'
            ? 'w-10 h-10 flex items-center justify-center bg-indigo-600/20 border border-indigo-500/40 rounded-xl transition'
            : 'w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:bg-indigo-600/10 rounded-xl transition';
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

    // Re-render with sorted posts
    const { data: { session: feedSession } } = await _supabase.auth.getSession();
    const currentUserId = feedSession ? feedSession.user.id : null;

    feedEl.innerHTML = '';
    sorted.forEach(post => {
        const likes = post.likes ? post.likes.length : 0;
        const copies = post.copies || 0;
        const title = post.title ? post.title.toUpperCase() : (post.prompt ? post.prompt.substring(0, 28).toUpperCase() + '...' : 'UNTITLED');
        const promptPreview = post.prompt ? post.prompt.substring(0, 120) + '...' : '';
        const creator = post.creator_name || 'Creator';
        const isOwner = currentUserId && post.creator_id === currentUserId;

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
                        <button onclick="event.stopPropagation(); copyFeedPrompt('${post.id}')" class="flex items-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-600 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition">
                            <i class="fa-regular fa-copy"></i> Copy
                        </button>
                        <div class="flex items-center gap-1.5 ml-auto">
                            <span class="text-gray-400 text-[10px]">@${creator}</span>
                        </div>
                    </div>
                </div>
            </div>`;
        feedEl.appendChild(card);
    });
}

function renderCards(posts, currentUserId) {
    const feedEl = document.getElementById('community-feed');
    if (!feedEl) return;
    feedEl.innerHTML = '';

    if (!posts || posts.length === 0) {
        feedEl.innerHTML = `<div class="col-span-3 text-center py-16">
            <i class="fa-solid fa-magnifying-glass text-4xl text-gray-700 mb-4"></i>
            <p class="text-gray-500 font-bold">No results found</p>
            <p class="text-gray-600 text-xs mt-1">Try different keywords</p>
        </div>`;
        return;
    }

    posts.forEach(post => {
        const likes = post.likes ? post.likes.length : 0;
        const title = post.title ? post.title.toUpperCase() : (post.prompt ? post.prompt.substring(0, 28).toUpperCase() + '...' : 'UNTITLED');
        const promptPreview = post.prompt ? post.prompt.substring(0, 120) + '...' : '';
        const creator = post.creator_name || 'Creator';

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
                        <button onclick="event.stopPropagation(); copyFeedPrompt('${post.id}')" class="flex items-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-600 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition">
                            <i class="fa-regular fa-copy"></i> Copy
                        </button>
                        <span class="text-gray-400 text-[10px]">@${creator}</span>
                    </div>
                </div>
            </div>`;
        feedEl.appendChild(card);
    });
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
    if (!confirm("Delete this post?")) return;
    const { error } = await _supabase.from('posts').delete().eq('id', postId);
    if (error) { showToast("Delete failed!"); return; }
    showToast("Post deleted! ðŸ—‘ï¸");
    loadCommunityFeed();
}

async function editPost(postId) {
    const post = (window._feedPosts || []).find(p => p.id === postId);
    if (!post) return;
    const newPrompt = prompt("Edit your prompt:", post.prompt || '');
    if (!newPrompt || newPrompt === post.prompt) return;
    const { error } = await _supabase.from('posts').update({ prompt: newPrompt }).eq('id', postId);
    if (error) { showToast("Edit failed!"); return; }
    showToast("Post updated! âœ…");
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
    navigator.clipboard.writeText(url).then(() => showToast("Profile link copied! ðŸ”—"));
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
        else { badge.classList.remove('hidden'); badge.innerText = 'Ã— ' + tag.charAt(0).toUpperCase() + tag.slice(1); }
    }
    
    // Update filter btn highlight
    const filterBtn = document.getElementById('filter-btn');
    if (filterBtn) {
        filterBtn.className = tag !== 'all'
            ? 'w-10 h-10 flex items-center justify-center bg-indigo-600/20 border border-indigo-500/40 rounded-xl transition'
            : 'w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:bg-indigo-600/10 rounded-xl transition';
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

    feedEl.innerHTML = '';
    
    if (posts.length === 0) {
        if (emptyEl) {
            emptyEl.classList.remove('hidden');
            emptyEl.querySelector('p') && (emptyEl.querySelector('p').innerText = `No ${tag} images yet`);
        }
        return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    posts.forEach(post => renderFeedCard(feedEl, post));
}

function renderFeedCard(feedEl, post) {
    const likes = post.likes ? post.likes.length : 0;
    const title = post.title ? post.title.toUpperCase() : (post.prompt ? post.prompt.substring(0, 28).toUpperCase() + '...' : 'UNTITLED');
    const promptPreview = post.prompt ? post.prompt.substring(0, 120) + '...' : '';
    const creator = post.creator_name || 'Creator';

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
                    <button onclick="event.stopPropagation(); copyFeedPrompt('${post.id}')" class="flex items-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-600 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition">
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
        const title = post.title ? post.title.toUpperCase() : (post.prompt ? post.prompt.substring(0, 28).toUpperCase() + '...' : 'UNTITLED');
        const promptPreview = post.prompt ? post.prompt.substring(0, 120) + '...' : '';
        const creator = post.creator_name || 'Creator';
        const tags = post.tags || [];

        const card = document.createElement('div');
        card.className = 'masonry-card group cursor-pointer';
        card.onclick = () => openPostDetail(post.id);

        // Highlight matching tags
        const tagHtml = tags.length > 0 ? tags.map(tag => {
            const isMatch = tag.toLowerCase().includes(query.toLowerCase());
            return `<span class="px-2 py-0.5 rounded-full text-[9px] font-bold ${isMatch ? 'bg-indigo-500/30 border border-indigo-500/50 text-indigo-300' : 'bg-white/5 text-gray-500'}">#${tag}</span>`;
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
                        <button onclick="event.stopPropagation(); copyFeedPrompt('${post.id}')" class="flex items-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition">
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
    if (!confirm("Delete this post permanently?")) return;
    const { error } = await _supabase.from('posts').delete().eq('id', postId);
    if (error) { showToast("Delete failed!"); return; }
    showToast("Post deleted! ðŸ—‘ï¸");
    _feedLoading = false;
    _feedLoaded = false;
    loadMyUploads();
}

async function toggleDetailLike() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { showToast("Sign in to like!"); toggleLoginModal(true); return; }
    
    const postId = window._currentDetailPostId;
    const { data: post } = await _supabase.from('posts').select('likes').eq('id', postId).single();
    const likes = post?.likes || [];
    const userId = session.user.id;
    const liked = likes.includes(userId);
    const newLikes = liked ? likes.filter(id => id !== userId) : [...likes, userId];
    
    await _supabase.from('posts').update({ likes: newLikes }).eq('id', postId);
    
    document.getElementById('detail-likes-count').innerText = newLikes.length;
    const likeBtn = document.getElementById('detail-like-btn');
    likeBtn.querySelector('i').className = !liked ? 'fa-solid fa-heart text-red-400 text-lg' : 'fa-regular fa-heart text-lg';
    
    // Update in feed cache
    if (window._feedPosts) {
        const idx = window._feedPosts.findIndex(p => p.id === postId);
        if (idx !== -1) window._feedPosts[idx].likes = newLikes;
    }
    
    showToast(liked ? "Unliked" : "Liked! â¤ï¸");
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
                `<span class="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-bold">#${tag}</span>`
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
                <p class="text-white font-black text-[10px] mb-0.5">${c.name}</p>
                <p class="text-gray-300 text-xs">${c.text}</p>
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
    const { data: post } = await _supabase.from('posts').select('likes').eq('id', currentPostId).single();
    const likes = post?.likes || [];
    const liked = likes.includes(userId);
    const newLikes = liked ? likes.filter(id => id !== userId) : [...likes, userId];

    await _supabase.from('posts').update({ likes: newLikes }).eq('id', currentPostId);
    document.getElementById('post-modal-likes').innerText = newLikes.length;
    openPostModal(currentPostId);
}

async function quickLike(postId, btn) {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { showToast("Sign in to like!"); toggleLoginModal(true); return; }
    
    const userId = session.user.id;
    const { data: post } = await _supabase.from('posts').select('likes').eq('id', postId).single();
    const likes = post?.likes || [];
    const liked = likes.includes(userId);
    const newLikes = liked ? likes.filter(id => id !== userId) : [...likes, userId];
    
    await _supabase.from('posts').update({ likes: newLikes }).eq('id', postId);
    
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
    }
}

async function submitComment() {
    const { data: { session } } = await _supabase.auth.getSession();
    if (!session) { showToast("Sign in to comment!"); return; }

    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if (!text) return;

    const user = session.user;
    const { data: post } = await _supabase.from('posts').select('comments').eq('id', currentPostId).single();
    const comments = post?.comments || [];
    const newComment = {
        name: user.user_metadata?.display_name || user.email.split('@')[0],
        avatar: user.user_metadata?.avatar_url || '',
        text,
        time: new Date().toISOString()
    };
    comments.push(newComment);

    await _supabase.from('posts').update({ comments }).eq('id', currentPostId);
    input.value = '';
    showToast("Comment posted! ðŸ’¬");
    renderComments(comments);
}

function copyPostPrompt() {
    const prompt = document.getElementById('post-modal-prompt').innerText;
    navigator.clipboard.writeText(prompt).then(() => showToast("Prompt copied!"));
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
        showToast("Name updated! âœ…");
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
        showToast("Photo updated! âœ…");
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
    const title = post.title || (post.prompt ? post.prompt.substring(0, 40) : 'Untitled');
    return `
        <div class="group cursor-pointer">
            <div class="relative overflow-hidden rounded-2xl aspect-[3/4] bg-white/5 border border-white/5 group-hover:border-indigo-500/30 transition-all duration-300" onclick="openPostDetail('${post.id}')">
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
                    <span><i class="fa-solid fa-bookmark text-indigo-400/70 mr-1"></i>${saves}</span>
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

    const { data: posts } = await _supabase
        .from('posts')
        .select('*')
        .eq('creator_id', session.user.id)
        .or('category.eq.ai_images,category.is.null')
        .order('created_at', { ascending: false });

    if (loadingEl) loadingEl.classList.add('hidden');

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
// is_onboarding_verified -> yellow "âœ“ Verified" badge (perfect quiz answers)
// badge_tier -> achievement badge based on uploads + total likes: grey / gold / blue / red

async function calculateAndSyncBadgeTier(userId) {
    const { data: posts } = await _supabase.from('posts').select('likes').eq('creator_id', userId);
    const { data: profileRow } = await _supabase.from('profiles').select('created_at').eq('id', userId).single();
    if (!posts) return 'none';

    const uploadCount = posts.length;
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes ? p.likes.length : 0), 0);

    let accountAgeYears = 0;
    if (profileRow && profileRow.created_at) {
        accountAgeYears = (Date.now() - new Date(profileRow.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365);
    }

    let tier = 'none';
    if (uploadCount >= 5000 && totalLikes >= 50000 && accountAgeYears >= 2) tier = 'red';
    else if (uploadCount >= 500 && totalLikes >= 5000) tier = 'blue';
    else if (uploadCount >= 150 && totalLikes >= 1500) tier = 'gold';
    else if (uploadCount >= 20 && totalLikes >= 200) tier = 'grey';

    await _supabase.from('profiles').update({ badge_tier: tier }).eq('id', userId);
    return tier;
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
    const { data: post } = await _supabase.from('posts').select('saves').eq('id', postId).single();
    const saves = post?.saves || [];
    const saved = saves.includes(userId);
    const newSaves = saved ? saves.filter(id => id !== userId) : [...saves, userId];
    
    await _supabase.from('posts').update({ saves: newSaves }).eq('id', postId);
    
    const btn = document.getElementById('detail-save-btn');
    if (btn) {
        btn.querySelector('i').className = !saved ? 'fa-solid fa-bookmark text-indigo-400' : 'fa-regular fa-bookmark';
        btn.className = !saved 
            ? 'flex items-center gap-2 px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-xs font-bold text-indigo-400 transition'
            : 'flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-indigo-500/30 rounded-xl text-xs font-bold text-gray-300 hover:text-indigo-400 transition';
    }
    showToast(saved ? "Removed from saved" : "Saved! ðŸ”–");
    
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

    const { data: posts } = await _supabase.from('posts').select('*');
    const liked = (posts || []).filter(p => (p.likes || []).includes(session.user.id));
    
    if (loadingEl) loadingEl.classList.add('hidden');
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

    const { data: posts } = await _supabase.from('posts').select('*');
    const saved = (posts || []).filter(p => (p.saves || []).includes(session.user.id));
    
    if (loadingEl) loadingEl.classList.add('hidden');
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
            // Search from Supabase directly - no dependency on _feedPosts
            const { data: posts } = await _supabase
                .from('posts')
                .select('id, title, tags, image_url, creator_name, creator_id')
                .order('created_at', { ascending: false })
                .limit(100);

            if (!posts || posts.length === 0) {
                resultsEl.innerHTML = '<p class="text-gray-500 text-sm text-center py-6">No posts found</p>';
                return;
            }

            const filtered = posts.filter(post =>
                (post.title && post.title.toLowerCase().includes(q)) ||
                (post.tags && post.tags.some(t => t.toLowerCase().includes(q))) ||
                (post.creator_name && post.creator_name.toLowerCase().includes(q))
            );

            if (filtered.length === 0) {
                resultsEl.innerHTML = `<p class="text-gray-500 text-sm text-center py-6">No results for "<span class="text-white">${query}</span>"</p>`;
                return;
            }

            resultsEl.innerHTML = `
                <p class="text-gray-500 text-xs uppercase tracking-widest mb-3">${filtered.length} result${filtered.length !== 1 ? 's' : ''}</p>
                <div class="masonry-feed">
                    ${filtered.map(post => {
                        const title = post.title ? post.title.toUpperCase() : 'UNTITLED';
                        const tags = (post.tags || []).slice(0, 3).map(t => `<span class="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[9px] font-bold">#${t}</span>`).join('');
                        return `<div class="masonry-card group cursor-pointer" onclick="closeSearchModal(); openPostDetail('${post.id}')">
                            <div class="relative rounded-2xl overflow-hidden border border-white/5 hover:border-indigo-500/30 transition">
                                <img src="${cldThumb(post.image_url)}" class="w-full h-auto block" loading="lazy" alt="${title}">
                                <div class="absolute top-0 left-0 right-0 p-2 flex items-center justify-between">
                                    <span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase px-2 py-1 rounded-lg truncate max-w-[70%]">${title}</span>
                                </div>
                                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform rounded-b-2xl">
                                    <div class="flex flex-wrap gap-1 mb-1">${tags}</div>
                                    <p class="text-gray-400 text-[10px]">@${post.creator_name || 'Creator'}</p>
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
            showPage('account');
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
        .select('*')
        .eq('id', userId)
        .single();

    const { data: posts } = await _supabase
        .from('posts')
        .select('*')
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
        : `<div class="w-full h-full flex items-center justify-center"><i class="fa-solid fa-user text-indigo-400 text-2xl"></i></div>`;

    const followBtnHTML = isOwnProfile ? '' : isFollowing
        ? `<button id="upm-follow-btn" onclick="toggleFollowUserModal('${userId}')" class="px-6 py-2 bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-sm rounded-xl transition">Following</button>`
        : `<button id="upm-follow-btn" onclick="toggleFollowUserModal('${userId}')" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition">Follow</button>`;

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
                    <div class="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/40 bg-white/5 flex-shrink-0">${avatarHTML}</div>
                    <div class="flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                            <h2 class="text-white font-black text-lg">@${creatorName}</h2>
                            ${badgeHTML}
                        </div>
                        <div class="flex items-center gap-4 mt-1 text-gray-400 text-xs">
                            <span><span class="text-white font-bold">${followerCount || 0}</span> followers</span>
                            <span><span class="text-white font-bold">${followingCount || 0}</span> following</span>
                        </div>
                    </div>
                    ${followBtnHTML}
                </div>
                <p class="text-gray-400 text-sm">${profile?.bio || ''}</p>
            </div>
            <!-- Posts Grid -->
            <div class="px-3 pb-5">
                <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 px-2 mb-3">Posts Â· ${posts ? posts.length : 0}</p>
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
            btn.classList.add('bg-indigo-600', 'hover:bg-indigo-500', 'text-white');
        }
        showToast('Unfollowed');
    } else {
        // Follow
        await _supabase.from('follows').insert([{ follower_id: followerId, following_id: followingId }]);
        if (btn) {
            btn.innerText = 'Following';
            btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-500');
            btn.classList.add('bg-white/10', 'hover:bg-white/20', 'text-gray-300');
        }
        showToast('Following! ðŸŽ‰');
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
            query = _supabase.from('posts').select('*').or('category.eq.ai_images,category.is.null').order('created_at', { ascending: false }).limit(5);
        } else {
            query = _supabase.from('posts').select('*').eq('category', category).order('created_at', { ascending: false }).limit(5);
        }
        const { data: posts, error } = await query;
        if (error || !posts || posts.length === 0) {
            el.innerHTML = '<div class="col-span-full text-center py-8 text-gray-600 text-xs font-bold uppercase tracking-widest">No creations yet</div>';
            return;
        }
        el.innerHTML = posts.map(post => `
            <div class="relative rounded-xl overflow-hidden cursor-pointer group aspect-square border border-white/5 hover:border-indigo-500/30 transition-all duration-300" onclick="openPostDetail('${post.id}')">
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
        const { data: posts } = await _supabase.from('posts').select('*').eq('category','ads_poster').order('created_at',{ascending:false});
        if (loadingEl) loadingEl.classList.add('hidden');
        if (!posts || posts.length === 0) { if (emptyEl) emptyEl.classList.remove('hidden'); _adsFeedLoading=false; return; }
        posts.forEach(post => {
            const card = document.createElement('div');
            const title = post.title ? post.title.toUpperCase() : 'UNTITLED';
            const likes = post.likes ? post.likes.length : 0;
            const promptPreview = post.prompt ? post.prompt.substring(0,120)+'...' : '';
            const creator = post.creator_name || 'Creator';
            card.className = 'masonry-card group cursor-pointer';
            card.onclick = () => openPostDetail(post.id);
            card.innerHTML = '<div class="relative rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/30 transition-all duration-300">'
                + '<img src="' + cldThumb(post.image_url) + '" class="w-full h-auto block" loading="lazy">'
                + '<div class="absolute top-0 left-0 right-0 p-2.5 flex items-center justify-between">'
                + '<span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase px-2 py-1 rounded-lg truncate max-w-[65%]">' + title + '</span>'
                + '<span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"><i class="fa-solid fa-heart text-red-400"></i> ' + likes + '</span>'
                + '</div>'
                + '<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-b-2xl">'
                + '<p class="text-gray-200 text-xs line-clamp-3 mb-2">' + promptPreview + '</p>'
                + '<div class="flex items-center justify-between">'
                + '<button onclick="event.stopPropagation();copyFeedPrompt(\'' + post.id + '\')" class="flex items-center gap-1.5 bg-orange-600/80 hover:bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"><i class="fa-regular fa-copy"></i> Copy</button>'
                + '<span class="text-gray-400 text-[10px]">@' + creator + '</span>'
                + '</div></div></div>';
            feedEl.appendChild(card);
        });
        window._adsPosts = posts;
        _adsFeedLoaded = true;
    } catch(e) { if (loadingEl) loadingEl.classList.add('hidden'); if (emptyEl) emptyEl.classList.remove('hidden'); }
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
        const { data: posts } = await _supabase.from('posts').select('*').eq('category','ai_stock').order('created_at',{ascending:false});
        if (loadingEl) loadingEl.classList.add('hidden');
        if (!posts || posts.length === 0) { if (emptyEl) emptyEl.classList.remove('hidden'); _stockFeedLoading=false; return; }
        posts.forEach(post => {
            const card = document.createElement('div');
            const title = post.title ? post.title.toUpperCase() : 'UNTITLED';
            const likes = post.likes ? post.likes.length : 0;
            const promptPreview = post.prompt ? post.prompt.substring(0,120)+'...' : '';
            const creator = post.creator_name || 'Creator';
            card.className = 'masonry-card group cursor-pointer';
            card.onclick = () => openPostDetail(post.id);
            card.innerHTML = '<div class="relative rounded-2xl overflow-hidden border border-white/5 hover:border-purple-500/30 transition-all duration-300">'
                + '<img src="' + cldThumb(post.image_url) + '" class="w-full h-auto block" loading="lazy">'
                + '<div class="absolute top-0 left-0 right-0 p-2.5 flex items-center justify-between">'
                + '<span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase px-2 py-1 rounded-lg truncate max-w-[65%]">' + title + '</span>'
                + '<span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"><i class="fa-solid fa-heart text-red-400"></i> ' + likes + '</span>'
                + '</div>'
                + '<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-b-2xl">'
                + '<p class="text-gray-200 text-xs line-clamp-3 mb-2">' + promptPreview + '</p>'
                + '<div class="flex items-center justify-between">'
                + '<button onclick="event.stopPropagation();copyFeedPrompt(\'' + post.id + '\')" class="flex items-center gap-1.5 bg-purple-600/80 hover:bg-purple-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"><i class="fa-regular fa-copy"></i> Copy</button>'
                + '<span class="text-gray-400 text-[10px]">@' + creator + '</span>'
                + '</div></div></div>';
            feedEl.appendChild(card);
        });
        window._stockPosts = posts;
        _stockFeedLoaded = true;
    } catch(e) { if (loadingEl) loadingEl.classList.add('hidden'); if (emptyEl) emptyEl.classList.remove('hidden'); }
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
    const { data: posts } = await _supabase
        .from('posts')
        .select('*')
        .eq('creator_id', session.user.id)
        .eq('category', 'ads_poster')
        .order('created_at', { ascending: false });
    if (loadingEl) loadingEl.classList.add('hidden');
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
    const { data: posts } = await _supabase
        .from('posts')
        .select('*')
        .eq('creator_id', session.user.id)
        .eq('category', 'ai_stock')
        .order('created_at', { ascending: false });
    if (loadingEl) loadingEl.classList.add('hidden');
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
        btn.className = 'stock-cat-btn w-full text-left px-4 py-2.5 text-gray-300 hover:bg-purple-600/20 text-sm font-bold transition';
    });
    const activeBtn = document.querySelector('#stock-filter-panel [data-tag="' + cat + '"]');
    if (activeBtn) activeBtn.className = 'stock-cat-btn w-full text-left px-4 py-2.5 text-purple-300 bg-purple-600/20 text-sm font-bold transition';


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
        return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    posts.forEach(post => {
        const card = document.createElement('div');
        const title = post.title ? post.title.toUpperCase() : 'UNTITLED';
        const likes = post.likes ? post.likes.length : 0;
        const promptPreview = post.prompt ? post.prompt.substring(0,120)+'...' : '';
        const creator = post.creator_name || 'Creator';
        card.className = 'masonry-card group cursor-pointer';
        card.onclick = () => openPostDetail(post.id);
        card.innerHTML = '<div class="relative rounded-2xl overflow-hidden border border-white/5 hover:border-purple-500/30 transition-all duration-300">'
            + '<img src="' + cldThumb(post.image_url) + '" class="w-full h-auto block" loading="lazy">'
            + '<div class="absolute top-0 left-0 right-0 p-2.5 flex items-center justify-between">'
            + '<span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase px-2 py-1 rounded-lg truncate max-w-[65%]">' + title + '</span>'
            + '<span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"><i class="fa-solid fa-heart text-red-400"></i> ' + likes + '</span>'
            + '</div>'
            + '<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-b-2xl">'
            + '<p class="text-gray-200 text-xs line-clamp-3 mb-2">' + promptPreview + '</p>'
            + '<div class="flex items-center justify-between">'
            + '<button onclick="event.stopPropagation();copyFeedPrompt(\'' + post.id + '\')" class="flex items-center gap-1.5 bg-purple-600/80 hover:bg-purple-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"><i class="fa-regular fa-copy"></i> Copy</button>'
            + '<span class="text-gray-400 text-[10px]">@' + creator + '</span>'
            + '</div></div></div>';
        feedEl.appendChild(card);
    });
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
        return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');

    posts.forEach(post => {
        const card = document.createElement('div');
        const title = post.title ? post.title.toUpperCase() : 'UNTITLED';
        const likes = post.likes ? post.likes.length : 0;
        const promptPreview = post.prompt ? post.prompt.substring(0,120)+'...' : '';
        const creator = post.creator_name || 'Creator';
        card.className = 'masonry-card group cursor-pointer';
        card.onclick = () => openPostDetail(post.id);
        card.innerHTML = '<div class="relative rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/30 transition-all duration-300">'
            + '<img src="' + cldThumb(post.image_url) + '" class="w-full h-auto block" loading="lazy">'
            + '<div class="absolute top-0 left-0 right-0 p-2.5 flex items-center justify-between">'
            + '<span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase px-2 py-1 rounded-lg truncate max-w-[65%]">' + title + '</span>'
            + '<span class="bg-black/70 backdrop-blur-md text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1"><i class="fa-solid fa-heart text-red-400"></i> ' + likes + '</span>'
            + '</div>'
            + '<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/70 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 rounded-b-2xl">'
            + '<p class="text-gray-200 text-xs line-clamp-3 mb-2">' + promptPreview + '</p>'
            + '<div class="flex items-center justify-between">'
            + '<button onclick="event.stopPropagation();copyFeedPrompt(\'' + post.id + '\')" class="flex items-center gap-1.5 bg-orange-600/80 hover:bg-orange-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg transition"><i class="fa-regular fa-copy"></i> Copy</button>'
            + '<span class="text-gray-400 text-[10px]">@' + creator + '</span>'
            + '</div></div></div>';
        feedEl.appendChild(card);
    });
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
        btn.textContent = 'See Less â–´';
    } else {
        p.classList.remove('prompt-expanded');
        p.classList.add('prompt-collapsed');
        btn.textContent = 'See More â–¾';
    }
}

function initPromptToggle() {
    var p = document.getElementById('detail-prompt');
    var btn = document.getElementById('prompt-toggle-btn');
    if (!p || !btn) return;
    p.classList.add('prompt-collapsed');
    p.classList.remove('prompt-expanded');
    var label = document.getElementById('prompt-toggle-label');
    if (label) label.textContent = 'See More â–¾';
    if (window.innerWidth >= 768 && p.scrollHeight > 100) {
        btn.style.display = 'inline-flex';
    } else {
        btn.style.display = 'none';
    }
}


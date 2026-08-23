class AccuDrawValuation {
  async run(env) {
    if (!env || !env.container) {
      throw new Error("run() requires an environment object with a valid container.");
    }
    this.env = env;
    this.targetElement = env.container;

    this.initializeTheme();
    this.loadGoogleFont();
    this.setupState(this.parseRawContent());
    this.loadAppStyles();
    this.preloadResources();
    this.setupKeyboardListeners();
    this.handleRoute();

    window.addEventListener('hashchange', () => this.handleRoute());
  }

  destroy() {
    if (this.valueEmberLogo) {
      this.valueEmberLogo.destroy();
    }
    if (this.bfnPlayer) {
      this.bfnPlayer.destroy();
      this.bfnPlayer = null;
    }
    if (this.fallbackTimeout) clearTimeout(this.fallbackTimeout);
    if (this.fallbackTriggerTimeout) clearTimeout(this.fallbackTriggerTimeout);
    const overlay = document.getElementById('bfn-overlay');
    if (overlay) overlay.remove();
    if (this._currentKeydownHandler) {
      window.removeEventListener('keydown', this._currentKeydownHandler);
    }
  }

  parseRawContent() {
    return this.getValuationStaticData();
  }

  setupState(data) {
    this.data = data;
    this.activeTab = 'all';
    this.resultsRevealed = false;
    this.isTransitioning = false;
    this.revealMode = localStorage.getItem('accudraw-reveal-mode') || 'no-drama';
    this.wrongAnswerStage = 0;
    this.justCorrected = false;
    this.isCalculating = false;
    this.showRecalculateButton = false;
    this.showBFNButton = false;
    this.motionValue = parseFloat(localStorage.getItem('accudraw-motion-val') || '1.0');
    
    const hash = window.location.hash;
    if (hash === '#/elder-advocacy') {
      this.currentView = 'elder-advocacy';
    } else if (hash === '#/caretaker-bias') {
      this.currentView = 'caretaker-bias';
    } else if (hash === '#/value-assessment' || hash === '#/valuation') {
      this.currentView = 'valuation';
    } else if (hash === '#/ai-perspective') {
      this.currentView = 'ai-perspective';
    } else if (hash === '#/current-work') {
      this.currentView = 'current-work';
    } else {
      this.currentView = 'overview';
    }
    this.expandedMessages = {};
  }

  handleRoute() {
    const hash = window.location.hash;
    if (hash === '#/elder-advocacy') {
      this.currentView = 'elder-advocacy';
    } else if (hash === '#/caretaker-bias') {
      this.currentView = 'caretaker-bias';
    } else if (hash === '#/value-assessment' || hash === '#/valuation') {
      this.currentView = 'valuation';
    } else if (hash === '#/ai-perspective') {
      this.currentView = 'ai-perspective';
    } else if (hash === '#/current-work') {
      this.currentView = 'current-work';
    } else {
      this.currentView = 'overview';
    }
    this.renderApp();
  }

  renderApp() {
    this.targetElement.innerHTML = "";
    
    const themeClass = this.currentTheme === "light" 
      ? "cad-container cad-grid-bg theme-light" 
      : "cad-container cad-grid-bg";
    
    const appContainer = makeElement("div", { className: themeClass });
    appContainer.style.setProperty("--motion-scale", String(this.motionValue));

    const innerWrapper = makeElement("div", { className: "cad-wrapper" });

    if (this.currentView === "elder-advocacy") {
      innerWrapper.appendChild(this.buildElderHeader());
    } else if (this.currentView === "caretaker-bias") {
      innerWrapper.appendChild(this.buildCaretakerHeader());
    } else {
      innerWrapper.appendChild(this.buildMinimalHeader());
    }

    if (this.currentView === "overview") {
      const page = new OverviewPage();
      innerWrapper.appendChild(page.render(this));
    } else if (this.currentView === "ai-perspective") {
      const page = new AiPerspectivePage();
      innerWrapper.appendChild(page.render(this));
    } else if (this.currentView === "elder-advocacy") {
      const page = new ElderAdvocacyPage();
      innerWrapper.appendChild(page.render(this));
    } else if (this.currentView === "caretaker-bias") {
      const page = new CaretakerBiasPage();
      innerWrapper.appendChild(page.render(this));
    } else if (this.currentView === "current-work") {
      const page = new CurrentWorkPage();
      innerWrapper.appendChild(page.render(this));
    } else {
      const page = new ValuationPage();
      innerWrapper.appendChild(page.render(this));
    }

    innerWrapper.appendChild(this.buildFooter());
    appContainer.appendChild(innerWrapper);
    this.targetElement.appendChild(appContainer);

    if (this.currentView === "valuation" && this.resultsRevealed && !this._isAwaitingRecalculation()) {
      const emberValText = this.targetElement.querySelector(".glowing-consensus-value");
      if (emberValText) {
        if (this.valueEmberLogo) {
          this.valueEmberLogo.destroy();
        }
        this.valueEmberLogo = new ValueEmberLogo(emberValText, {
          isAwake: true,
          emberCountMultiplier: 0.4 * this.motionValue,
          emberSpeedMultiplier: 0.3 * this.motionValue,
          emberSizeMultiplier: 0.4 * this.motionValue
        });
      }
    } else if (this.valueEmberLogo) {
      this.valueEmberLogo.destroy();
      this.valueEmberLogo = null;
    }
  }

  buildMinimalHeader() {
    const revealModeSelect = makeElement('select', {
      className: 'reveal-mode-select',
      onchange: (e) => {
        this.revealMode = e.target.value;
        localStorage.setItem('accudraw-reveal-mode', this.revealMode);
      }
    }, [
      makeElement('option', { value: 'drum-roll' }, 'Drum Roll'),
      makeElement('option', { value: 'no-drama' }, 'No Drama'),
      makeElement('option', { value: 'wrong-answers' }, 'Wrong Answers')
    ]);
    revealModeSelect.value = this.revealMode;

    const controlsGroup = makeElement('div', {
      className: 'flex flex-col items-end gap-1'
    }, [
      this.buildThemeToggle(),
      makeElement('div', { className: 'reveal-mode-row' }, [revealModeSelect]),
      this.buildMotionSlider()
    ]);

    let headerTitle = 'Career Dossier & Valuation Assessment';
    let headerSubtitle = 'A comprehensive situational analysis and economic timeline';

    if (this.currentView === 'overview') {
      headerTitle = 'Executive Summary & Overview';
      headerSubtitle = 'A professional proposal and technical timeline';
    } else if (this.currentView === 'ai-perspective') {
      headerTitle = 'AI Automation & Urgent Career Timeline';
      headerSubtitle = 'The exponential pace of automation and professional time pressure';
    } else if (this.currentView === 'current-work') {
      headerTitle = 'Current Work & Vibe Coding Environment';
      headerSubtitle = 'Next-generation recursively self-improving visual code environments';
    } else if (this.currentView === 'valuation') {
      headerTitle = 'AccuDraw & SmartLine Value Assessment';
      headerSubtitle = 'A comparative analysis of enterprise value contribution';
    }

    return makeElement('header', { className: 'minimal-header' }, [
      makeElement('div', { className: 'header-top' }, [
        makeElement('div', { className: 'tags-wrapper' }, [
          makeElement('span', { className: 'tag-pill tag-pill-blue' }, 'Portfolio & Dossier'),
          makeElement('span', { className: 'tag-pill tag-pill-slate' }, '1994 - 2026')
        ]),
        controlsGroup
      ]),
      
      makeElement('div', { className: 'title-group' }, [
        makeElement('h1', {}, headerTitle),
        makeElement('p', { className: 'title-subtitle' }, headerSubtitle)
      ]),
      this.buildGlobalNavigation(this.currentView)
    ]);
  }

  buildElderHeader() {
    return makeElement("header", { className: "minimal-header" }, [
      makeElement("div", { className: "header-top" }, [
        makeElement("span", { className: "tag-pill tag-pill-blue" }, "Elder Advocacy Review"),
        this.buildThemeToggle()
      ]),
      makeElement("div", { className: "title-group" }, [
        makeElement("h1", {}, "Care Arrangements & Family Communication Review"),
        makeElement("p", { className: "title-subtitle" }, "A factual analysis of Power of Attorney limits and visitation guidelines")
      ]),
      this.buildGlobalNavigation("elder-advocacy")
    ]);
  }

  buildCaretakerHeader() {
    return makeElement("header", { className: "minimal-header" }, [
      makeElement("div", { className: "header-top" }, [
        makeElement("span", { className: "tag-pill tag-pill-blue" }, "Caretaker Bias Review"),
        this.buildThemeToggle()
      ]),
      makeElement("div", { className: "title-group" }, [
        makeElement("h1", {}, "Caretaker Bias & LinkedIn Exhibits Review"),
        makeElement("p", { className: "title-subtitle" }, "A documentary archive of ideological, personal, and communication obstacles")
      ]),
      this.buildGlobalNavigation("caretaker-bias")
    ]);
  }

  buildGlobalNavigation(activeRoute) {
    return makeElement('div', { className: 'global-nav-bar' }, [
      makeElement('a', {
        href: '#/overview',
        className: 'global-nav-link ' + (activeRoute === 'overview' ? 'active' : ''),
        onclick: (e) => { e.preventDefault(); window.location.hash = '#/overview'; }
      }, 'Executive Summary'),
      makeElement('a', {
        href: '#/elder-advocacy',
        className: 'global-nav-link ' + (activeRoute === 'elder-advocacy' ? 'active' : ''),
        onclick: (e) => { e.preventDefault(); window.location.hash = '#/elder-advocacy'; }
      }, 'Fiduciary & Care Arrangements'),
      makeElement('a', {
        href: '#/caretaker-bias',
        className: 'global-nav-link ' + (activeRoute === 'caretaker-bias' ? 'active' : ''),
        onclick: (e) => { e.preventDefault(); window.location.hash = '#/caretaker-bias'; }
      }, 'Caretaker Bias & Exhibits'),
      makeElement('a', {
        href: '#/ai-perspective',
        className: 'global-nav-link ' + (activeRoute === 'ai-perspective' ? 'active' : ''),
        onclick: (e) => { e.preventDefault(); window.location.hash = '#/ai-perspective'; }
      }, 'AI & Urgent Timeline'),
      makeElement('a', {
        href: '#/current-work',
        className: 'global-nav-link ' + (activeRoute === 'current-work' ? 'active' : ''),
        onclick: (e) => { e.preventDefault(); window.location.hash = '#/current-work'; }
      }, 'Current Work & Vibe Coding'),
      makeElement('a', {
        href: '#/value-assessment',
        className: 'global-nav-link ' + (activeRoute === 'valuation' ? 'active' : ''),
        onclick: (e) => { e.preventDefault(); window.location.hash = '#/value-assessment'; }
      }, 'Valuation Assessment'),
      makeElement('button', {
        className: 'global-nav-link deploy-nav-btn',
        style: {
          cursor: 'pointer',
          border: '1px solid #10b981',
          color: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginLeft: 'auto'
        },
        onclick: (e) => this.triggerGitHubDeploy(e.currentTarget)
      }, '🚀 Deploy to GitHub')
    ]);
  }

  async triggerGitHubDeploy(btnElement) {
    if (btnElement) {
      btnElement.disabled = true;
      btnElement.style.opacity = '0.7';
      btnElement.textContent = '⏳ Deploying...';
    }

    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitMsg: 'Automated deployment from Situation App' })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        this.showToastMessage('✨ Deployed successfully to GitHub Pages!');
      } else {
        const errMsg = data.error || 'Server error during deployment';
        this.showToastMessage('⚠️ Deploy notice: ' + errMsg);
      }
    } catch (e) {
      this.showToastMessage('ℹ️ Running in static/Pages mode. Local node server required for 1-tap deploy.');
    } finally {
      if (btnElement) {
        btnElement.disabled = false;
        btnElement.style.opacity = '1';
        btnElement.textContent = '🚀 Deploy to GitHub';
      }
    }
  }

  buildFooter() {
    return makeElement('footer', { className: 'dashboard-footer' }, [
      makeElement('div', { className: 'footer-content' }, [
        makeElement(
          'p',
          { className: 'footer-left' },
          'Documentary archive and analytical mapping of software IP development and career milestones.'
        ),
        makeElement(
          'p',
          { className: 'footer-right' },
          'Career & Situational Review • 1994 - 2026'
        )
      ])
    ]);
  }

  buildThemeToggle() {
    return makeElement('div', { className: 'theme-switcher' }, [
      makeElement('button', {
        className: this.currentTheme === 'light' ? 'active' : '',
        onclick: () => this.setTheme('light')
      }, [
        makeElement('span', { innerHTML: '☀️' }),
        makeElement('span', {}, 'Light')
      ]),
      makeElement('button', {
        className: this.currentTheme === 'dark' ? 'active' : '',
        onclick: () => this.setTheme('dark')
      }, [
        makeElement('span', { innerHTML: '🌙' }),
        makeElement('span', {}, 'Dark')
      ])
    ]);
  }

  buildMotionSlider() {
    const slider = makeElement('input', {
      type: 'range',
      min: '0.1',
      max: '3.0',
      step: '0.1',
      value: String(this.motionValue || 1.0),
      className: 'motion-slider',
      oninput: (e) => {
        this.updateMotionValue(parseFloat(e.target.value));
      }
    });

    return makeElement('div', { className: 'motion-slider-row' }, [
      makeElement('span', { className: 'motion-slider-label' }, 'Motion'),
      slider
    ]);
  }

  updateMotionValue(val) {
    this.motionValue = val;
    localStorage.setItem('accudraw-motion-val', String(val));
    const container = this.targetElement.querySelector('.cad-container');
    if (container) {
      container.style.setProperty('--motion-scale', String(val));
    }
    if (this.valueEmberLogo) {
      this.valueEmberLogo.options.emberCountMultiplier = 0.4 * val;
      this.valueEmberLogo.options.emberSpeedMultiplier = 0.3 * val;
      this.valueEmberLogo.options.emberSizeMultiplier = 0.4 * val;
    }
  }

  setTheme(themeName) {
    this.currentTheme = themeName;
    localStorage.setItem('accudraw-valuation-theme', themeName);
    const container = this.targetElement.querySelector('.cad-container');
    if (container) {
      if (themeName === 'light') {
        container.classList.add('theme-light');
      } else {
        container.classList.remove('theme-light');
      }
    }
    this.renderApp();
  }

  triggerReveal(buttonElement) {
    if (this.isTransitioning) return;
    this.wrongAnswerStage = 0;
    this.justCorrected = false;
    this.isCalculating = false;
    this.showRecalculateButton = false;
    this.showBFNButton = false;

    if (this.revealMode === 'no-drama' || this.revealMode === 'wrong-answers') {
      this.resultsRevealed = true;
      this.renderApp();
      this._scrollToConsensusBlock();
      if (this.revealMode === 'wrong-answers') {
        setTimeout(() => {
          this.showRecalculateButton = true;
          this.renderApp();
        }, 1000);
      } else {
        this.triggerBFNButtonDelay();
      }
      return;
    }

    this.isTransitioning = true;
    buttonElement.scrollIntoView({ block: 'center', behavior: 'smooth' });
    buttonElement.style.opacity = '0.85';
    buttonElement.style.pointerEvents = 'none';

    setTimeout(() => {
      if (window.SnareDrumAnimation) {
        const snare = new SnareDrumAnimation({
          duration: 3000,
          soundUrl: 'LogoExperiments/drumroll.mp4',
          accentColor: '#3b82f6',
          onComplete: () => {
            this.resultsRevealed = true;
            this.isTransitioning = false;
            this.renderApp();
            this._scrollToConsensusBlock(100);
            this.triggerBFNButtonDelay();
          }
        });
        snare.trigger(buttonElement);
      } else {
        setTimeout(() => {
          this.resultsRevealed = true;
          this.isTransitioning = false;
          this.renderApp();
          this.triggerBFNButtonDelay();
        }, 1500);
      }
    }, 350);
  }

  _scrollToConsensusBlock(delay = 80) {
    setTimeout(() => {
      const consensusBlock = this.targetElement.querySelector('.consensus-container');
      if (consensusBlock) {
        consensusBlock.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }, delay);
  }

  _isAwaitingRecalculation() {
    return this.revealMode === 'wrong-answers' && (this.wrongAnswerStage || 0) < 3;
  }

  advanceWrongAnswer() {
    if (this.wrongAnswerStage >= 3 || this.isCalculating) return;
    this.isCalculating = true;
    this.showRecalculateButton = false;
    this.renderApp();

    const tickerPool = [
      "$145K", "$2.8 Million", "$38 Million", "$620K", "$84.1 Million",
      "$5.4 Million", "$115 Million", "$430K", "$1.8 Billion", "$72 Million",
      "$9.1 Million", "$280K", "$2.4B", "$81.5M", "$4.2 Million", "$19.3 Million"
    ];

    const tickInterval = setInterval(() => {
      const valueNode = this.targetElement.querySelector(".glowing-consensus-value");
      if (valueNode) {
        valueNode.textContent = tickerPool[Math.floor(Math.random() * tickerPool.length)];
      }
    }, 90);

    setTimeout(() => {
      clearInterval(tickInterval);
      this.isCalculating = false;
      this.wrongAnswerStage++;
      if (this.wrongAnswerStage === 3) {
        this.justCorrected = true;
      }
      this.renderApp();

      if (this.wrongAnswerStage === 3) {
        this.triggerBFNButtonDelay();
        setTimeout(() => {
          this.justCorrected = false;
          const subtext = this.targetElement.querySelector(".consensus-figure-subtext");
          if (subtext) {
            subtext.classList.remove("flash-correct");
            subtext.textContent = "Consensus Contributed Midpoint";
          }
        }, 1800);
      } else {
        setTimeout(() => {
          this.showRecalculateButton = true;
          this.renderApp();
        }, 1000);
      }
    }, 1500);
  }

  triggerBFNButtonDelay() {
    this.showBFNButton = false;
    this.preloadBFNPlayer();
    setTimeout(() => {
      this.showBFNButton = true;
      this.renderApp();
    }, 1200);
  }

  preloadResources() {
    if (window.SnareDrumAnimation) {
      try {
        SnareDrumAnimation.preload('LogoExperiments/drumroll.mp4');
      } catch (e) {}
    }
    if (this.resultsRevealed) {
      this.preloadBFNPlayer();
    }
  }

  preloadBFNPlayer() {
    if (this.bfnPlayer) return;
    this.buildBFNOverlay();
    const videoFrame = document.getElementById('bfn-video-frame');
    if (!videoFrame) return;

    try {
      this.bfnPlayer = new VideoPlayer({
        container: videoFrame,
        containerId: 'bfn-video-frame',
        playerType: 'youtube',
        videoId: 'ply26G4DdcM',
        autoplay: false,
        controls: false,
        startTime: 0,
        endTime: 22
      }, (evt) => {
        if (evt.type === 'ready') {
          if (this.playPending) {
            this.playPending = false;
            this.executeBFNPlay();
          }
        }
        if (evt.type === 'play') {
          const activeFrame = document.getElementById('bfn-video-frame');
          if (activeFrame) activeFrame.style.opacity = '1';
        }
        if (evt.type === 'end') {
          this.fadeAndCloseBFN();
        }
      });
    } catch (e) {}
  }

  buildBFNOverlay() {
    if (document.getElementById('bfn-overlay')) return;
    const overlay = makeElement('div', {
      id: 'bfn-overlay',
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(5, 7, 18, 0.95)',
        zIndex: '9990',
        opacity: '0',
        pointerEvents: 'none',
        transition: 'opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }
    }, [
      makeElement('button', {
        className: 'bfn-close-btn',
        onclick: () => this.fadeAndCloseBFN(),
        style: {
          position: 'absolute',
          top: '24px',
          right: '24px',
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          borderRadius: '50%',
          width: '44px',
          height: '44px',
          cursor: 'pointer',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: '10001'
        }
      }, '✕'),
      makeElement('div', {
        id: 'bfn-video-frame',
        style: {
          width: '85vw',
          height: '47.8vw',
          maxWidth: '1200px',
          maxHeight: '675px',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
          overflow: 'hidden',
          backgroundColor: '#000000',
          transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.8s ease-in-out',
          transform: 'scale(0.9) translateY(20px)',
          opacity: '0'
        }
      })
    ]);
    document.body.appendChild(overlay);
  }

  startBFNPlayback() {
    this.buildBFNOverlay();
    this.preloadBFNPlayer();

    const overlay = document.getElementById('bfn-overlay');
    const videoFrame = document.getElementById('bfn-video-frame');
    const consensusContainer = this.targetElement.querySelector('.consensus-container');

    if (consensusContainer) {
      consensusContainer.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => {
        consensusContainer.classList.add('bfn-highlighted');
        document.body.classList.add('bfn-active');
        if (overlay) {
          overlay.style.opacity = '1';
          overlay.style.pointerEvents = 'auto';
        }
        if (videoFrame) {
          videoFrame.style.transform = 'scale(1) translateY(0)';
        }

        if (this.bfnPlayer && this.bfnPlayer.isReady) {
          this.executeBFNPlay();
        } else {
          this.playPending = true;
          if (this.fallbackTriggerTimeout) clearTimeout(this.fallbackTriggerTimeout);
          this.fallbackTriggerTimeout = setTimeout(() => {
            if (this.playPending) {
              this.playPending = false;
              this.executeBFNPlay();
            }
          }, 1200);
        }
      }, 500);
    }
  }

  executeBFNPlay() {
    const videoFrame = document.getElementById('bfn-video-frame');
    if (!videoFrame) return;
    const hasIframe = videoFrame.querySelector('iframe');
    if (this.bfnPlayer && this.bfnPlayer.isReady && hasIframe) {
      try {
        this.bfnPlayer.seekTo(0);
        this.bfnPlayer.unMute();
        this.bfnPlayer.setVolume(80);
        this.bfnPlayer.play();
      } catch (e) {
        this.useDirectIframeFallback(videoFrame);
      }
    } else {
      this.useDirectIframeFallback(videoFrame);
    }
  }

  useDirectIframeFallback(videoFrame) {
    videoFrame.innerHTML = '';
    const iframe = makeElement('iframe', {
      src: 'https://www.youtube.com/embed/ply26G4DdcM?autoplay=1&controls=0&start=0&end=22&enablejsapi=1&rel=0&showinfo=0',
      style: { width: '100%', height: '100%', border: 'none' },
      allow: 'autoplay; encrypted-media',
      allowfullscreen: 'true'
    });
    videoFrame.appendChild(iframe);
    setTimeout(() => {
      const activeFrame = document.getElementById('bfn-video-frame');
      if (activeFrame) activeFrame.style.opacity = '1';
    }, 1500);

    if (this.fallbackTimeout) clearTimeout(this.fallbackTimeout);
    this.fallbackTimeout = setTimeout(() => {
      this.fadeAndCloseBFN();
    }, 22000);
  }

  fadeAndCloseBFN() {
    const overlay = document.getElementById('bfn-overlay');
    const videoFrame = document.getElementById('bfn-video-frame');
    const consensusContainer = this.targetElement.querySelector('.consensus-container');

    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    }
    if (videoFrame) {
      videoFrame.style.opacity = '0';
      videoFrame.style.transform = 'scale(0.9) translateY(20px)';
    }
    if (this.fallbackTimeout) clearTimeout(this.fallbackTimeout);

    setTimeout(() => {
      if (this.bfnPlayer) {
        try { this.bfnPlayer.destroy(); } catch (e) {}
        this.bfnPlayer = null;
      }
      if (overlay) overlay.remove();
      document.body.classList.remove('bfn-active');
      if (consensusContainer) consensusContainer.classList.remove('bfn-highlighted');
    }, 800);
  }

  setupKeyboardListeners() {
    if (this._currentKeydownHandler) {
      window.removeEventListener('keydown', this._currentKeydownHandler);
    }
    this._currentKeydownHandler = (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
        return;
      }
      if (e.key === 't' || e.key === 'T') {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (text) {
          const config = this.generateHighlightConfig(text);
          if (config) {
            const codeString = '{\n  id: "' + config.id + '",\n  start: "' + config.start + '",\n  end: "' + config.end + '",\n  className: "slick-glow-highlight"\n},';
            navigator.clipboard.writeText(codeString).then(() => {
              this.showToastMessage('Copied highlight config for:\n' + config.start);
            }).catch(() => {});
          }
        }
      }
    };
    window.addEventListener('keydown', this._currentKeydownHandler);
  }

  generateHighlightConfig(text) {
    if (!text) return null;
    const words = text.split(/\s+/).filter(w => w.trim().length > 0);
    if (words.length === 0) return null;
    let start = text, end = text;
    if (words.length > 3) {
      start = words.slice(0, 2).join(' ');
      end = words.slice(-2).join(' ');
    }
    start = start.replace(/["']/g, '').trim();
    end = end.replace(/["']/g, '').trim();
    const cleanId = words.slice(0, 3).join('_').toLowerCase().replace(/[^a-z0-9_]/g, '').substring(0, 20);
    return {
      id: 'custom_' + (cleanId || 'highlight'),
      start: start,
      end: end
    };
  }

  showToastMessage(msg) {
    const existing = document.getElementById('bfn-toast');
    if (existing) existing.remove();

    const toast = makeElement('div', {
      id: 'bfn-toast',
      style: {
        position: 'fixed',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%) translateY(20px)',
        background: '#0f172a',
        border: '1px solid #3b82f6',
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '8px',
        zIndex: '100000',
        fontSize: '12px',
        fontFamily: 'ui-monospace, monospace',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
        transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
        opacity: '0',
        pointerEvents: 'none',
        whiteSpace: 'pre-line',
        textAlign: 'center'
      }
    }, msg);

    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  copyPromptText(text, btnElement) {
    navigator.clipboard.writeText(text).then(() => {
      const originalHtml = btnElement.innerHTML;
      btnElement.innerHTML = '<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg><span class="text-emerald-400 font-bold">Copied!</span>';
      btnElement.classList.add('border-emerald-500/40', 'bg-emerald-950/20');
      setTimeout(() => {
        btnElement.innerHTML = originalHtml;
        btnElement.classList.remove('border-emerald-500/40', 'bg-emerald-950/20');
      }, 1800);
    }).catch(() => {});
  }

  openExhibitModal(imgSrc, title, caption) {
    const existing = document.getElementById('logo-exhibit-overlay');
    if (existing) existing.remove();

    const overlay = this.createExhibitOverlay();
    const topBar = this.createModalTopBar(title, overlay);
    const contentContainer = this.createModalContentContainer(imgSrc, title, overlay);
    const captionBar = caption ? this.createModalCaptionBar(caption) : null;

    overlay.appendChild(topBar);
    overlay.appendChild(contentContainer);
    if (captionBar) overlay.appendChild(captionBar);

    document.body.appendChild(overlay);
    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
    });
  }

  createExhibitOverlay() {
    return makeElement('div', {
      id: 'logo-exhibit-overlay',
      style: {
        position: 'fixed',
        inset: '0',
        zIndex: '100002',
        background: 'rgba(5, 5, 8, 0.98)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        transition: 'opacity 0.25s ease',
        opacity: '0',
        width: '100vw',
        height: '100vh',
        boxSizing: 'border-box',
        overflow: 'hidden'
      },
      onclick: (e) => {
        const overlay = e.currentTarget;
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 250);
      }
    });
  }

  createModalTopBar(title, overlay) {
    return makeElement('div', {
      style: {
        width: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 24px',
        background: 'rgba(10, 10, 15, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        zIndex: '30'
      }
    }, [
      makeElement('span', {
        style: {
          color: '#ffffff',
          fontWeight: 'bold',
          fontSize: '13px',
          fontFamily: 'ui-monospace, monospace',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }
      }, title),
      makeElement('button', {
        style: {
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          borderRadius: '50%',
          width: '36px',
          height: '36px',
          cursor: 'pointer',
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '8px'
        },
        onclick: (e) => {
          e.stopPropagation();
          overlay.style.opacity = '0';
          setTimeout(() => overlay.remove(), 250);
        }
      }, '✕')
    ]);
  }

  createModalContentContainer(imgSrc, title, overlay) {
    let isFullRes = false;
    let isDragging = false;
    let startX = 0, startY = 0, scrollLeft = 0, scrollTop = 0;
    let dragThresholdMet = false;

    const badge = makeElement('div', {
      style: {
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(15, 23, 42, 0.9)',
        color: '#3b82f6',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '20px',
        padding: '6px 16px',
        fontSize: '11px',
        fontFamily: 'ui-monospace, monospace',
        pointerEvents: 'none',
        zIndex: '30',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }
    }, 'Click image for Full Resolution');

    const contentContainer = makeElement('div', {
      style: {
        flex: '1',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        position: 'relative',
        padding: '16px',
        background: '#020204',
        cursor: 'zoom-in',
        userSelect: 'none'
      }
    });

    const img = makeElement('img', {
      src: imgSrc,
      alt: title,
      style: {
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        borderRadius: '4px',
        display: 'block'
      },
      onerror: (e) => {
        e.target.style.display = 'none';
      }
    });

    contentContainer.onmousedown = (e) => {
      if (!isFullRes) return;
      isDragging = true;
      dragThresholdMet = false;
      startX = e.clientX;
      startY = e.clientY;
      scrollLeft = contentContainer.scrollLeft;
      scrollTop = contentContainer.scrollTop;
      contentContainer.style.cursor = 'grabbing';
    };

    contentContainer.onmousemove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragThresholdMet = true;
      contentContainer.scrollLeft = scrollLeft - dx;
      contentContainer.scrollTop = scrollTop - dy;
    };

    contentContainer.onmouseup = () => {
      if (!isDragging) return;
      isDragging = false;
      contentContainer.style.cursor = isFullRes ? 'zoom-out' : 'zoom-in';
    };

    contentContainer.onclick = (e) => {
      e.stopPropagation();
      if (dragThresholdMet) {
        dragThresholdMet = false;
        return;
      }
      if (e.target === contentContainer) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 250);
        return;
      }

      isFullRes = !isFullRes;
      if (isFullRes) {
        contentContainer.style.display = 'block';
        img.style.width = 'auto';
        img.style.height = 'auto';
        img.style.maxWidth = 'none';
        img.style.maxHeight = 'none';
        img.style.objectFit = 'none';
        img.style.margin = '0 auto';
        contentContainer.style.cursor = 'zoom-out';
        badge.textContent = 'Click image to fit screen (Drag to pan)';
      } else {
        contentContainer.style.display = 'flex';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '100%';
        img.style.objectFit = 'contain';
        img.style.margin = '0';
        contentContainer.style.cursor = 'zoom-in';
        badge.textContent = 'Click image for Full Resolution';
      }
    };

    contentContainer.appendChild(badge);
    contentContainer.appendChild(img);
    return contentContainer;
  }

  createModalCaptionBar(caption) {
    return makeElement('div', {
      style: {
        position: 'absolute',
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '90%',
        maxWidth: '800px',
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        padding: '12px 20px',
        color: '#e2e8f0',
        fontSize: '13px',
        lineHeight: '1.5',
        textAlign: 'center',
        zIndex: '30'
      },
      onclick: (e) => e.stopPropagation()
    }, caption);
  }

  initializeTheme() {
    document.body.classList.add('js-active');
    this.currentTheme = localStorage.getItem('accudraw-valuation-theme') || 'dark';
  }

  loadGoogleFont() {
    const fontId = 'GoogleFontComfortaa';
    if (!document.getElementById(fontId)) {
      const link = makeElement('link', {
        id: fontId,
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Comfortaa:wght@400;700;900&display=swap'
      });
      document.head.appendChild(link);
    }
  }

  loadAppStyles() {
    this.applyCoreResetCSS();
    this.applyCoreLayoutCSS();
    this.applyHeaderCSS();
    this.applyThemeSwitcherCSS();
    this.applyBFNCSS();
    this.applyNavigationCSS();
  }

  applyCoreResetCSS() {
    applyCss("html, body { margin: 0 !important; padding: 0 !important; min-height: 100vh; width: 100%; background-color: #070a12; } .cad-container, .cad-container * { box-sizing: border-box; margin: 0; padding: 0; }", "cad-core-reset-styles");
  }

  applyCoreLayoutCSS() {
    applyCss(".cad-container { --bg-primary: #070a12; --bg-grid: rgba(255, 255, 255, 0.02); --bg-panel: #0c111d; --bg-panel-inner: #05070a; --text-primary: #cbd5e1; --text-secondary: #94a3b8; --text-title: #ffffff; --border-color: #1e293b; --border-hover: #334155; --btn-bg: #1e293b; --btn-hover: #334155; --btn-text: #e2e8f0; --accent-story-from: rgba(59, 130, 246, 0.06); --accent-story-to: rgba(168, 85, 247, 0.06); background-color: var(--bg-primary); color: var(--text-primary); font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; min-height: 100vh; width: 100%; padding: 48px 16px; } .cad-grid-bg { background-size: 32px 32px; background-image: linear-gradient(to right, var(--bg-grid) 1px, transparent 1px), linear-gradient(to bottom, var(--bg-grid) 1px, transparent 1px); } .cad-wrapper { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 48px; } .cad-panel { background-color: var(--bg-panel); border: 1px solid var(--border-color); border-radius: 12px; padding: 32px; }", "cad-core-layout-styles");
  }

  applyHeaderCSS() {
    applyCss(".minimal-header { display: flex; flex-direction: column; gap: 24px; border-bottom: 1px solid var(--border-color); padding-bottom: 24px; } .header-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; } .tags-wrapper { display: flex; gap: 8px; } .tag-pill { font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; } .tag-pill-blue { background-color: rgba(59, 130, 246, 0.1); color: #3b82f6; border: 1px solid rgba(59, 130, 246, 0.3); } .tag-pill-slate { background-color: rgba(148, 163, 184, 0.1); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2); } .title-group h1 { font-size: 32px; font-weight: 800; color: var(--text-title); letter-spacing: -0.02em; margin-bottom: 8px; line-height: 1.1; } @media (min-width: 768px) { .title-group h1 { font-size: 44px; } } .title-subtitle { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-family: ui-monospace, monospace; color: var(--text-secondary); font-weight: 600; }", "cad-header-styles");
  }

  applyThemeSwitcherCSS() {
    applyCss(".theme-switcher { display: flex; align-items: center; gap: 6px; padding: 4px; background-color: var(--btn-bg); border: 1px solid var(--border-color); border-radius: 8px; } .theme-switcher button { padding: 4px 12px; font-size: 11px; font-weight: 600; border-radius: 6px; border: none; cursor: pointer; background: transparent; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; } .theme-switcher button.active { background-color: #3b82f6; color: #ffffff; } .reveal-mode-row { margin-top: 6px; display: flex; justify-content: flex-end; } .reveal-mode-select { appearance: none; background: transparent; border: none; color: var(--text-secondary); font-size: 10px; font-family: ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.06em; padding: 2px 4px; cursor: pointer; opacity: 0.6; }", "cad-theme-switcher-styles");
  }

  applyBFNCSS() {
    applyCss(".consensus-action-wrapper { display: flex; flex-direction: column; align-items: center; gap: 8px; width: 100%; } @media (min-width: 768px) { .consensus-action-wrapper { align-items: flex-end; } } .visualize-bfn-btn { margin-top: 10px; display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, #f59e0b, #ef4444); border: none; color: #ffffff; font-size: 11px; font-weight: 800; font-family: ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.08em; padding: 8px 16px; border-radius: 20px; cursor: pointer; } .motion-slider-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; } .motion-slider-label { font-size: 10px; font-family: ui-monospace, monospace; text-transform: uppercase; color: var(--text-secondary); font-weight: bold; } .motion-slider { width: 70px; height: 4px; border-radius: 2px; background: var(--border-color); outline: none; cursor: pointer; }", "cad-bfn-styles");
  }

  applyNavigationCSS() {
    applyCss(".global-nav-bar { display: flex; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px; margin-bottom: 16px; margin-top: 16px; width: 100%; } .global-nav-link { font-size: 11px; font-family: ui-monospace, monospace; font-weight: bold; text-transform: uppercase; color: var(--text-secondary); text-decoration: none; border: 1px solid var(--border-color); padding: 8px 16px; border-radius: 8px; background: var(--bg-panel); transition: all 0.2s ease-in-out; } .global-nav-link:hover { background: var(--btn-hover); color: var(--text-title); border-color: var(--border-hover); } .global-nav-link.active { background: #3b82f6; color: #ffffff; border-color: #3b82f6; } .backstory-gradient-card { padding: 32px; border: 1px solid var(--border-color); border-radius: 16px; display: flex; flex-direction: column; gap: 24px; background: linear-gradient(135deg, var(--accent-story-from), var(--accent-story-to)); } .backstory-paragraph-highlight { font-size: 16px; font-weight: 500; color: var(--text-primary); line-height: 1.6; } @media (min-width: 768px) { .backstory-paragraph-highlight { font-size: 18px; } } .backstory-paragraph { font-size: 14px; color: var(--text-secondary); line-height: 1.6; } .inline-link-highlight { color: #2563eb; font-weight: 600; text-decoration: underline; text-underline-offset: 4px; }", "cad-navigation-styles");
  }

  getValuationStaticData() {
    return {
      title: "AccuDraw & SmartLine Value Assessment",
      prompts: [
        { id: "1", text: "tell me everything you know about accudraw and smartline in microstation" },
        { id: "2", text: "how important are they to the success of microstation and bentley systems?" },
        { id: "3", text: "what is your rough estimate as to how much value they brought bentley in terms of profit and/or contribution to market cap?" }
      ],
      models: [
        { key: "claude", name: "Claude 3.5 Sonnet", min: "2.0B", max: "5.0B", pct: 33, color: "#f59e0b", url: "https://claude.ai/", quotes: ["\"My rough estimate: $2-5 billion in enterprise value contribution...\""] },
        { key: "gemini", name: "Gemini 3.5 Pro", min: "1.5B", max: "3.5B", pct: 27, color: "#3b82f6", url: "https://aistudio.google.com/", quotes: ["\"AccuDraw solved the 3D input problem for Bentley years before competitors had an elegant solution.\""] },
        { key: "chatgpt", name: "ChatGPT-4o", min: "1.0B", max: "3.0B", pct: 22, color: "#10b981", url: "https://chatgpt.com/", quotes: ["\"Around $1-3 billion as a plausible range for their contribution to Bentley's long-term enterprise value.\""] },
        { key: "grok", name: "Grok 2", min: "500M", max: "2.0B+", pct: 14, color: "#a855f7", url: "https://x.com/", quotes: ["\"Overall ballpark: $500 million to $2+ billion in total economic value...\""] }
      ]
    };
  }
}

window.AccuDrawValuation = AccuDrawValuation;
globalThis.AccuDrawValuation = AccuDrawValuation;
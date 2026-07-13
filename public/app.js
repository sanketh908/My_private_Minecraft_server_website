// Elysium Network Portal Core Script
document.addEventListener("DOMContentLoaded", () => {
  let serverData = null;

  // Cache Dom Elements
  const header = document.querySelector(".header");
  const mobileToggle = document.getElementById("mobile-toggle");
  const navMenu = document.getElementById("nav-menu");
  
  // IP Badges and copy triggers
  const navIpCopy = document.getElementById("nav-ip-copy");
  const navIpText = document.getElementById("nav-ip-text");
  const heroIpCopy = document.getElementById("hero-ip-copy");
  const heroIpText = document.getElementById("hero-ip-text");
  const heroCopyBtn = document.getElementById("hero-copy-btn");

  // Dynamic Content Containers
  const announcementTicker = document.getElementById("announcement-ticker");
  const announcementText = document.getElementById("announcement-text");
  const headerServerName = document.getElementById("header-server-name");
  const footerServerName = document.getElementById("footer-server-name");
  const footerCopyrightName = document.getElementById("footer-copyright-name");
  const footerDescription = document.getElementById("footer-description");
  const footerEmailText = document.getElementById("footer-email-text");
  const footerVersionText = document.getElementById("footer-version-text");
  const footerIpText = document.getElementById("footer-ip-text");

  const heroTitle = document.getElementById("hero-title");
  const heroSubtitle = document.getElementById("hero-subtitle");
  const heroBg = document.getElementById("hero-bg");

  const aboutSectionTitle = document.getElementById("about-section-title");
  const aboutText = document.getElementById("about-text");

  const featuresContainer = document.getElementById("features-container");
  const statsContainer = document.getElementById("stats-container");
  const newsContainer = document.getElementById("news-container");
  const galleryContainer = document.getElementById("gallery-container");
  const staffContainer = document.getElementById("staff-container");
  const faqContainer = document.getElementById("faq-container");

  const storeDescription = document.getElementById("store-description");
  const storeTiersContainer = document.getElementById("store-tiers-container");
  const votingRewards = document.getElementById("voting-rewards");
  const voteLinksContainer = document.getElementById("vote-links-container");
  
  // Server Live Status Elements
  const statusDot = document.getElementById("status-dot");
  const statusText = document.getElementById("status-text");
  const livePlayersCount = document.getElementById("live-players-count");
  const maxPlayersCount = document.getElementById("max-players-count");

  // Lightbox
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const lightboxTitle = document.getElementById("lightbox-title");
  const lightboxDesc = document.getElementById("lightbox-desc");
  const lightboxClose = document.getElementById("lightbox-close");

  // --- STICKY NAV & MOBILE MENU ---
  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  mobileToggle.addEventListener("click", () => {
    mobileToggle.classList.toggle("open");
    navMenu.classList.toggle("open");
  });

  // Close menu when clicking nav link
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      mobileToggle.classList.remove("open");
      navMenu.classList.remove("open");
    });
  });

  // --- CLIPBOARD IP COPY ---
  const copyIpAddress = (ipText, buttonEl = null) => {
    navigator.clipboard.writeText(ipText).then(() => {
      const origText = buttonEl ? buttonEl.innerText : "";
      if (buttonEl) {
        buttonEl.innerText = "Copied!";
        buttonEl.style.background = "var(--secondary-accent)";
        buttonEl.style.color = "#03080a";
        setTimeout(() => {
          buttonEl.innerText = origText;
          buttonEl.style.background = "";
          buttonEl.style.color = "";
        }, 2000);
      } else {
        // Show temp alert on header
        const tooltip = document.createElement("div");
        tooltip.innerText = "IP Copied!";
        tooltip.style.position = "absolute";
        tooltip.style.background = "var(--primary-accent)";
        tooltip.style.color = "#000";
        tooltip.style.padding = "5px 10px";
        tooltip.style.borderRadius = "4px";
        tooltip.style.fontSize = "0.75rem";
        tooltip.style.fontWeight = "bold";
        tooltip.style.top = "60px";
        tooltip.style.boxShadow = "0 0 10px var(--primary-glow)";
        tooltip.style.transform = "translateX(-25%)";
        navIpCopy.appendChild(tooltip);
        setTimeout(() => tooltip.remove(), 1500);
      }
    }).catch(err => {
      console.error("Could not copy IP to clipboard:", err);
    });
  };

  if (navIpCopy) {
    navIpCopy.addEventListener("click", () => copyIpAddress(navIpText.innerText));
  }
  if (heroIpCopy) {
    heroIpCopy.addEventListener("click", () => copyIpAddress(heroIpText.innerText, heroCopyBtn));
  }

  // --- DATA HYDRATION ---
  async function loadPortalData() {
    try {
      // First try fetching from local express backend API
      const res = await fetch("/api/portal-data");
      if (!res.ok) throw new Error("Backend offline");
      serverData = await res.json();
      hydrateFrontend(serverData);
    } catch (err) {
      console.warn("Express backend API offline or failed, loading static fallback...", err);
      // Backend not running, load hardcoded fallback so static site still works beautifully!
      serverData = getStaticFallbackData();
      hydrateFrontend(serverData);
    }
  }

  function hydrateFrontend(data) {
    // Colors & Branding
    const cfg = data.config;
    document.title = `${cfg.serverName} | Premium Minecraft Server`;
    headerServerName.innerText = cfg.serverName;
    footerServerName.innerText = cfg.serverName;
    footerCopyrightName.innerText = cfg.serverName;
    footerIpText.innerText = cfg.serverIp;
    navIpText.innerText = cfg.serverIp;
    heroIpText.innerText = cfg.serverIp;
    footerVersionText.innerText = `Minecraft ${cfg.serverVersion}`;
    footerDescription.innerText = `${cfg.serverName} is a premium, high-performance Minecraft network dedicated to providing an immersive, stable, and welcoming custom survival experience.`;
    footerEmailText.innerText = cfg.email || `support@${cfg.serverIp.replace("play.", "")}`;

    // Announcements
    if (data.announcements && data.announcements.length > 0) {
      const activeAnn = data.announcements.find(a => a.active);
      if (activeAnn) {
        announcementText.innerText = activeAnn.text;
        announcementTicker.style.display = "block";
      } else {
        announcementTicker.style.display = "none";
      }
    }

    // Hero Customization
    heroTitle.innerText = data.hero.title;
    heroSubtitle.innerText = data.hero.subtitle;
    if (data.hero.bannerImage) {
      heroBg.style.backgroundImage = `url('${data.hero.bannerImage}')`;
    }

    // About Customization
    aboutSectionTitle.innerText = data.about.title || `About ${cfg.serverName}`;
    aboutText.innerText = data.about.content;

    // Feature Cards
    if (data.features && featuresContainer) {
      featuresContainer.innerHTML = data.features.map(f => `
        <div class="feature-card">
          <div class="feature-icon-wrapper"><i class="feature-icon" data-lucide="${f.icon || 'star'}"></i></div>
          <h3>${f.title}</h3>
          <p>${f.description}</p>
        </div>
      `).join("");
    }

    // Stats Counters
    if (data.stats && statsContainer) {
      statsContainer.innerHTML = data.stats.map(s => `
        <div class="stat-card">
          <span class="stat-icon"><i data-lucide="${s.icon || 'bar-chart-2'}"></i></span>
          <div class="stat-number" data-target="${s.value}">${s.value}</div>
          <div class="stat-name">${s.name}</div>
        </div>
      `).join("");
      
      // Trigger counter animations
      initCounterAnimations();
    }

    // News Section
    if (data.news && newsContainer) {
      newsContainer.innerHTML = data.news.map(n => {
        const bgImg = n.image || "/assets/news-placeholder.jpg";
        return `
          <div class="news-card glass-card glow-primary">
            <div class="news-img-wrapper">
              <img src="${bgImg}" alt="${n.title}" class="news-img" onerror="this.src='/assets/news-placeholder.jpg'">
              <span class="news-badge ${n.category.toLowerCase()}">${n.category}</span>
            </div>
            <div class="news-meta">
              <span><i data-lucide="user" style="width: 12px; height:12px; display:inline-block; vertical-align:middle; margin-right:3px;"></i> ${n.author}</span>
              <span><i data-lucide="calendar" style="width: 12px; height:12px; display:inline-block; vertical-align:middle; margin-right:3px;"></i> ${n.date}</span>
            </div>
            <h3>${n.title}</h3>
            <p class="news-excerpt">${n.content.length > 120 ? n.content.substring(0, 120) + "..." : n.content}</p>
            <div class="news-readmore" onclick="showNewsModal('${escapeHtml(n.title)}', '${escapeHtml(n.date)}', '${escapeHtml(n.author)}', '${escapeHtml(n.content)}')">Read Details &rarr;</div>
          </div>
        `;
      }).join("");
    }

    // Gallery Lightbox Grid
    if (data.gallery && galleryContainer) {
      galleryContainer.innerHTML = data.gallery.map(g => `
        <div class="gallery-item" onclick="openLightbox('${g.url}', '${escapeHtml(g.title)}', '${escapeHtml(g.description)}')">
          <img src="${g.url}" alt="${g.title}" onerror="this.src='/assets/placeholder-screenshot.jpg'">
          <div class="gallery-hover-overlay">
            <h4>${g.title}</h4>
            <p>${g.description}</p>
          </div>
        </div>
      `).join("");
    }

    // Staff Showcase
    if (data.staff && staffContainer) {
      staffContainer.innerHTML = data.staff.map(s => `
        <div class="staff-card glass-card">
          <div class="staff-avatar-wrapper">
            <img src="${s.avatar || '/assets/avatar-default.png'}" alt="${s.name}" class="staff-avatar" onerror="this.src='/assets/avatar-default.png'">
          </div>
          <h3>${s.name}</h3>
          <span class="staff-role role-${s.role.toLowerCase()}">${s.role}</span>
          <p class="staff-desc">${s.description}</p>
        </div>
      `).join("");
    }

    // Store Ranks & Voting Links
    storeDescription.innerText = cfg.storeDescription;
    votingRewards.innerText = cfg.votingRewards;

    if (data.store && storeTiersContainer) {
      storeTiersContainer.innerHTML = data.store.map(st => `
        <div class="store-tier glass-card glow-primary ${st.popular ? 'popular glow-gold' : ''}">
          ${st.popular ? '<span class="popular-tag">Popular</span>' : ''}
          <div class="tier-info">
            <h4>${st.name}</h4>
            <span class="tier-price">${st.price}</span>
          </div>
          <ul class="tier-features">
            ${st.features.map(f => `<li>${f}</li>`).join("")}
          </ul>
          <a href="#" class="btn btn-secondary ${st.popular ? 'btn-primary' : ''}">Buy Now</a>
        </div>
      `).join("");
    }

    if (data.voting && voteLinksContainer) {
      voteLinksContainer.innerHTML = data.voting.map((v, index) => `
        <a href="${v.url}" target="_blank" class="vote-card glass-card">
          <div class="vote-details">
            <div class="vote-index">${index + 1}</div>
            <span class="vote-name">${v.name}</span>
          </div>
          <button class="vote-action-btn">Vote Now</button>
        </a>
      `).join("");
    }

    // FAQ Accordion
    if (data.faq && faqContainer) {
      faqContainer.innerHTML = data.faq.map(f => `
        <div class="faq-card glass-card">
          <button class="faq-trigger" onclick="toggleFaq(this)">
            <span>${f.question}</span>
            <span class="faq-icon">+</span>
          </button>
          <div class="faq-panel">
            <p>${f.answer}</p>
          </div>
        </div>
      `).join("");
    }

    // Set custom social buttons
    const footerSocials = document.getElementById("footer-socials");
    if (footerSocials) {
      footerSocials.innerHTML = `
        <a href="${cfg.discordInvite}" target="_blank" class="social-link" title="Discord"><i data-lucide="message-square"></i></a>
        ${cfg.email ? `<a href="mailto:${cfg.email}" class="social-link" title="Email"><i data-lucide="mail"></i></a>` : ''}
        ${cfg.youtube ? `<a href="${cfg.youtube}" target="_blank" class="social-link" title="YouTube"><i data-lucide="youtube"></i></a>` : ''}
        ${cfg.twitter ? `<a href="${cfg.twitter}" target="_blank" class="social-link" title="Twitter"><i data-lucide="twitter"></i></a>` : ''}
      `;
    }

    // Re-initialize Lucide icons for dynamically added elements
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- LIVE SERVER STATUS PING ---
  async function pingServer() {
    try {
      const res = await fetch("/api/ping");
      if (!res.ok) throw new Error("Ping API failure");
      const pingData = await res.json();
      updateStatusUI(pingData);
    } catch (err) {
      console.warn("Backend ping API offline, fetching direct via web API...", err);
      // Fallback: ping Minecraft server directly from client using free API (mcsrvstat)
      if (serverData && serverData.config) {
        const ip = serverData.config.serverIp;
        try {
          const res = await fetch(`https://api.mcsrvstat.us/2/${ip}`);
          const mcsrvData = await res.json();
          if (mcsrvData.online) {
            updateStatusUI({
              online: true,
              players: mcsrvData.players.online,
              maxPlayers: mcsrvData.players.max,
              version: mcsrvData.version || serverData.config.serverVersion,
              motd: mcsrvData.motd ? mcsrvData.motd.clean.join(" ") : ""
            });
          } else {
            updateStatusUI({
              online: false,
              players: 0,
              maxPlayers: serverData.config.mockMaxPlayers
            });
          }
        } catch (e) {
          // Absolute fallback to mock database settings
          updateStatusUI({
            online: true,
            players: serverData.config.mockPlayerCount,
            maxPlayers: serverData.config.mockMaxPlayers,
            version: serverData.config.serverVersion
          });
        }
      }
    }
  }

  function updateStatusUI(ping) {
    if (ping.isMaintenance) {
      statusDot.className = "status-dot";
      statusDot.style.backgroundColor = "var(--gold-accent)";
      statusDot.style.boxShadow = "0 0 10px var(--gold-accent)";
      statusDot.style.animation = "none";
      statusText.innerText = "Maintenance Mode";
      statusText.style.color = "var(--gold-accent)";
      livePlayersCount.innerText = "0";
      maxPlayersCount.innerText = ping.maxPlayers || "500";
    } else if (ping.online) {
      statusDot.className = "status-dot online";
      statusDot.style.backgroundColor = "";
      statusDot.style.boxShadow = "";
      statusDot.style.animation = "";
      statusText.innerText = "Server Online";
      statusText.style.color = "var(--primary-accent)";
      livePlayersCount.innerText = ping.players;
      maxPlayersCount.innerText = ping.maxPlayers;
    } else {
      statusDot.className = "status-dot";
      statusDot.style.backgroundColor = "#ff3838";
      statusDot.style.boxShadow = "0 0 10px #ff3838";
      statusDot.style.animation = "none";
      statusText.innerText = "Server Offline";
      statusText.style.color = "#ff3838";
      livePlayersCount.innerText = "0";
      maxPlayersCount.innerText = ping.maxPlayers || "0";
    }
  }

  // --- STATS ANIMATED COUNTERS ---
  function initCounterAnimations() {
    const counterElements = document.querySelectorAll(".stat-number");
    
    const countUp = (el) => {
      const target = parseInt(el.getAttribute("data-target"), 10);
      const isSeconds = el.nextElementSibling.innerText.toLowerCase().includes("playtime") || el.innerText.includes("h");
      const duration = 2000; // 2 seconds
      const frameRate = 1000 / 60; // 60fps
      const totalFrames = Math.round(duration / frameRate);
      let frame = 0;

      const timer = setInterval(() => {
        frame++;
        const progress = frame / totalFrames;
        const currentVal = Math.round(target * progress);
        
        // Add suffix if applicable
        const suffix = target >= 1000 && !isSeconds ? "+" : "";
        el.innerText = currentVal.toLocaleString() + suffix;

        if (frame >= totalFrames) {
          el.innerText = target.toLocaleString() + (target >= 1000 && !isSeconds ? "+" : "");
          clearInterval(timer);
        }
      }, frameRate);
    };

    // Trigger animation when scrolled into view
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          countUp(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    counterElements.forEach(el => observer.observe(el));
  }

  // --- FAQ ACCORDION TOGGLE ---
  window.toggleFaq = (buttonEl) => {
    const card = buttonEl.parentElement;
    const isActive = card.classList.contains("active");
    
    // Close other FAQ items
    document.querySelectorAll(".faq-card").forEach(c => c.classList.remove("active"));
    
    if (!isActive) {
      card.classList.add("active");
    }
  };

  // --- GALLERY LIGHTBOX ---
  window.openLightbox = (url, title, desc) => {
    lightboxImg.src = url;
    lightboxTitle.innerText = title;
    lightboxDesc.innerText = desc;
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden"; // disable scroll
  };

  const closeLightbox = () => {
    lightbox.classList.remove("open");
    document.body.style.overflow = ""; // enable scroll
  };

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Escape key closes lightbox
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeLightbox();
      closeNewsModal();
    }
  });

  // --- NEWS DETAIL POPUP ---
  window.showNewsModal = (title, date, author, content) => {
    // Re-use lightbox container as a modular popup container
    lightboxImg.style.display = "none";
    
    // Create text content element dynamically
    let modalTextDiv = document.getElementById("lightbox-text-content");
    if (!modalTextDiv) {
      modalTextDiv = document.createElement("div");
      modalTextDiv.id = "lightbox-text-content";
      modalTextDiv.style.padding = "40px 30px";
      modalTextDiv.style.maxWidth = "600px";
      modalTextDiv.style.color = "var(--text-secondary)";
      modalTextDiv.style.background = "var(--dark-bg)";
      modalTextDiv.style.borderRadius = "12px";
      modalTextDiv.style.lineHeight = "1.8";
      lightbox.querySelector(".lightbox-content").appendChild(modalTextDiv);
    }
    
    modalTextDiv.style.display = "block";
    lightbox.querySelector(".lightbox-caption").style.display = "none";
    
    modalTextDiv.innerHTML = `
      <h2 style="color:#fff; font-family:var(--font-display); font-size:1.8rem; margin-bottom:10px; text-transform:uppercase;">${title}</h2>
      <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:20px;">Posted by ${author} on ${date}</div>
      <div style="font-size:1rem; color:var(--text-secondary); white-space:pre-wrap;">${content}</div>
    `;
    
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  };

  window.closeNewsModal = () => {
    const textDiv = document.getElementById("lightbox-text-content");
    if (textDiv) textDiv.style.display = "none";
    lightboxImg.style.display = "block";
    lightbox.querySelector(".lightbox-caption").style.display = "block";
    closeLightbox();
  };

  // Override click close for news modal
  lightboxClose.addEventListener("click", () => {
    closeNewsModal();
  });

  // Helper Escape HTML
  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- STATIC FALLBACK DATABASE SEED ---
  function getStaticFallbackData() {
    return {
      config: {
        serverName: "Elysium Network",
        serverIp: "play.elysiummc.net",
        serverVersion: "1.20.4 - 1.21.x",
        discordInvite: "https://discord.gg/elysium",
        votingRewards: "Vote daily to earn 100 Elysium Coins, Key Chest keys, and exclusive temporary prefixes!",
        storeDescription: "Support the server and unlock exclusive ranks, cosmetics, custom tags, and crate keys. All purchases go directly towards funding server hosting and development.",
        mockPlayerCount: 142,
        mockMaxPlayers: 500
      },
      hero: {
        title: "The Ultimate Minecraft Experience",
        subtitle: "Embark on an epic adventure with custom quests, immersive survival gameplay, a dynamic player-driven economy, and an active, welcoming community.",
        bannerImage: "/assets/hero-bg.jpg"
      },
      about: {
        title: "An Independently Developed World",
        content: "Elysium Network is built from the ground up by passionate developers who love Minecraft. We focus on providing a lag-free, balanced, and feature-rich environment for players of all styles. Whether you are a master builder, an economic tycoon, or a quest hunter, you'll find your home here. We push regular weekly updates, host weekend events, and maintain a highly active moderation team to ensure a fair and fun experience for everyone."
      },
      features: [
        { title: "Custom Gameplay", description: "Experience unique mechanics, custom items, and tailored progression systems you won't find anywhere else.", icon: "swords" },
        { title: "Survival Experience", description: "A beautifully generated world with protected land claims, balanced difficulty, and custom biomes.", icon: "trees" },
        { title: "Weekly Events", description: "Compete in build battles, parkour tournaments, boss raids, and community scavenger hunts with huge rewards.", icon: "calendar" },
        { title: "Player Economy", description: "Create your own shops, trade on the dynamic global auction house, and build a massive financial empire.", icon: "coins" },
        { title: "Epic Quests", description: "Complete hundreds of unique daily and weekly quests to earn rare loot, currency, and ranks.", icon: "compass" },
        { title: "Custom Plugins", description: "Our dedicated developers write custom plugins to optimize performance and introduce exclusive features.", icon: "code" },
        { title: "Active Moderation", description: "A mature, helpful staff team online 24/7 to ensure a safe, hacker-free, and friendly environment.", icon: "shield" },
        { title: "Optimized Performance", description: "Hosted on dedicated premium hardware with 99.9% uptime, custom fork software, and absolute zero lag.", icon: "zap" },
        { title: "Frequent Updates", description: "We continuously listen to player feedback, deploying weekly patches, content expansions, and seasonal updates.", icon: "refresh" }
      ],
      news: [
        {
          title: "Summer Update 1.4: Rise of the Dungeons",
          category: "Update",
          date: "2026-07-10",
          content: "We are thrilled to launch our largest update of the year! Explore the new Dungeon Realm, battle customized bosses, collect unique legendary gear, and complete over 50 brand-new quests. The level cap has been raised to 60, and class specializations are now available. Check the server guide on Discord for full patch notes!",
          author: "Admin Elysian",
          image: ""
        },
        {
          title: "Upcoming Community Build Competition!",
          category: "Event",
          date: "2026-07-08",
          content: "Grab your blocks and get ready! Our seasonal build competition starts this Friday at 6:00 PM EST. The theme is 'Lost Civilizations'. Competitors will have a 64x64 plot and 48 hours to build. Prizes include permanent server ranks, store giftcards, and custom lobby trophies. Sign up in the #events channel on Discord.",
          author: "Moderator BuilderBob",
          image: ""
        }
      ],
      gallery: [
        { url: "/assets/gallery-spawn.jpg", title: "Elysium Server Spawn", description: "Our majestic floating island spawn built by the community team." },
        { url: "/assets/gallery-nether.jpg", title: "Custom Nether Fortress", description: "An overhauled custom Nether fortress featuring unique hostile monsters." }
      ],
      stats: [
        { name: "Registered Players", value: 12450, icon: "users" },
        { name: "Total Playtime", value: 85200, icon: "clock" },
        { name: "Monthly Votes", value: 3412, icon: "thumbs-up" },
        { name: "Discord Members", value: 4890, icon: "message-square" }
      ],
      staff: [
        { name: "Elysian", role: "Owner", avatar: "", description: "Founder and Lead Director. Oversees community relations, finance, and overall server vision." },
        { name: "Techy", role: "Developer", avatar: "", description: "Server optimization expert. Writes custom plugins and ensures Elysium runs smoothly with zero lag." }
      ],
      faq: [
        { question: "How do I join the server?", answer: "Open Minecraft, click 'Multiplayer', select 'Add Server', enter our server IP (play.elysiummc.net) in the Server Address field, and click 'Done'. Select the server and click 'Join Server'!" },
        { question: "What Minecraft versions are supported?", answer: "Elysium Network supports client versions from 1.20.4 all the way up to the latest release (1.21.x)." }
      ],
      voting: [
        { name: "MinecraftServers.org", url: "https://minecraftservers.org" },
        { name: "Minecraft-Server-List.com", url: "https://minecraft-server-list.com" }
      ],
      store: [
        { name: "Hero Rank", price: "$9.99", features: ["Gold Username Tag", "Access to /fly in Spawn", "5x Custom Claim Blocks"], popular: false },
        { name: "Legend Rank", price: "$24.99", features: ["Cyan Username Tag", "Access to /fly Globally", "10x Custom Claim Blocks", "Weekly Legend Key"], popular: true }
      ],
      announcements: [
        { text: "🔥 SUMMER SALE: Use code SUMMERSALE for 20% off all ranks in our server store!", active: true }
      ]
    };
  }

  // Run Hydration
  loadPortalData();
  // Server Status Ping
  pingServer();
  // Poll server status every 20 seconds
  setInterval(pingServer, 20000);
});

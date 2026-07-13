// Elysium Server Website Dashboard Controller
document.addEventListener("DOMContentLoaded", () => {
  let portalData = null;
  let activeTab = "general";
  let statusOverrideMode = "auto";

  // Cache Elements
  const authPanel = document.getElementById("auth-panel");
  const dashboardPanel = document.getElementById("dashboard-panel");
  const loginForm = document.getElementById("login-form");
  const logoutBtn = document.getElementById("logout-btn");
  const loginError = document.getElementById("login-error");
  const toast = document.getElementById("toast");
  const previewFrame = document.getElementById("preview-frame");

  // Sidebar navigation elements
  const sidebarItems = document.querySelectorAll(".sidebar-item");

  // Initial Auth Check
  checkAuth();

  // Handle Login form
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const usernameVal = document.getElementById("username").value;
      const passwordVal = document.getElementById("password").value;

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: usernameVal, password: passwordVal })
        });
        
        const data = await res.json();
        if (res.ok && data.success) {
          loginError.style.display = "none";
          checkAuth();
        } else {
          loginError.innerText = data.error || "Authentication failed.";
          loginError.style.display = "block";
        }
      } catch (err) {
        loginError.innerText = "Error connecting to authentication server.";
        loginError.style.display = "block";
      }
    });
  }

  // Handle Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        showAuth();
      } catch (err) {
        showToast("Logout failed, try closing the page.", true);
      }
    });
  }

  // Check authentication status
  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/verify");
      const data = await res.json();
      if (res.ok && data.authenticated) {
        showDashboard();
      } else {
        showAuth();
      }
    } catch (err) {
      showAuth();
    }
  }

  function showAuth() {
    authPanel.style.display = "flex";
    dashboardPanel.style.display = "none";
    document.body.className = "admin-body";
  }

  function showDashboard() {
    authPanel.style.display = "none";
    dashboardPanel.style.display = "grid";
    document.body.className = "admin-body";
    
    // Initialize icons
    if (window.lucide) window.lucide.createIcons();
    
    // Load dashboard configurations
    loadPortalConfigurations();
    setupTabNavigation();
  }

  // Tab switching setup
  function setupTabNavigation() {
    sidebarItems.forEach(item => {
      item.addEventListener("click", () => {
        sidebarItems.forEach(i => i.classList.remove("active"));
        item.classList.add("active");
        
        const tab = item.getAttribute("data-tab");
        activeTab = tab;

        // Hide all tabs and show active
        document.querySelectorAll(".tab-content").forEach(content => {
          content.classList.remove("active");
        });
        document.getElementById(`tab-${tab}`).classList.add("active");
      });
    });
  }

  // Toast notifier
  function showToast(message, isError = false) {
    toast.innerText = message;
    toast.style.background = isError ? "#ff3838" : "var(--primary-accent)";
    toast.style.boxShadow = isError ? "0 5px 15px rgba(255, 56, 56, 0.4)" : "0 5px 15px rgba(0, 255, 136, 0.4)";
    toast.style.color = isError ? "#fff" : "#000";
    toast.style.display = "block";
    setTimeout(() => {
      toast.style.display = "none";
    }, 3000);
  }

  // --- API CRUD INTERFACES ---

  async function loadPortalConfigurations() {
    try {
      const res = await fetch("/api/portal-data");
      portalData = await res.json();
      
      // Populate General Tab
      const cfg = portalData.config;
      document.getElementById("gen-server-name").value = cfg.serverName || "";
      document.getElementById("gen-server-version").value = cfg.serverVersion || "";
      document.getElementById("gen-server-ip").value = cfg.serverIp || "";
      document.getElementById("gen-server-port").value = cfg.serverPort || 25565;
      document.getElementById("gen-discord-invite").value = cfg.discordInvite || "";
      document.getElementById("gen-support-email").value = cfg.email || "";
      document.getElementById("gen-mock-players").value = cfg.mockPlayerCount || 100;
      document.getElementById("gen-mock-max").value = cfg.mockMaxPlayers || 500;
      
      setStatusOverride(cfg.statusOverride || "auto");

      // Color pickers
      document.getElementById("theme-primary").value = cfg.theme?.primaryAccent || "#00ff88";
      document.getElementById("theme-secondary").value = cfg.theme?.secondaryAccent || "#00f0ff";
      document.getElementById("theme-gold").value = cfg.theme?.goldAccent || "#ffd700";

      // Populate Hero Tab
      const hero = portalData.hero;
      document.getElementById("hero-edit-title").value = hero.title || "";
      document.getElementById("hero-edit-subtitle").value = hero.subtitle || "";
      document.getElementById("hero-banner-path").value = hero.bannerImage || "";
      if (hero.bannerImage) {
        document.getElementById("hero-banner-preview").style.backgroundImage = `url('${hero.bannerImage}')`;
        document.getElementById("hero-banner-preview").innerText = "";
      }

      // Populate About Content
      const about = portalData.about;
      document.getElementById("about-edit-title").value = about.title || "";
      document.getElementById("about-edit-content").value = about.content || "";

      // Populate Announcements list
      renderAnnouncementsList(portalData.announcements || []);

      // Features list
      renderFeaturesList(portalData.features || []);

      // News list
      renderNewsList(portalData.news || []);

      // Gallery list
      renderGalleryList(portalData.gallery || []);

      // Stats list
      renderStatsInputs(portalData.stats || []);

      // Staff list
      renderStaffList(portalData.staff || []);

      // FAQ list
      renderFaqList(portalData.faq || []);

      // Store settings
      document.getElementById("store-edit-desc").value = cfg.storeDescription || "";
      document.getElementById("vote-edit-desc").value = cfg.votingRewards || "";
      renderStoreRanksInputs(portalData.store || []);
      renderVotingLinksInputs(portalData.voting || []);

    } catch (err) {
      showToast("Failed to fetch server portal data.", true);
    }
  }

  // --- SAVE ACTIONS ---

  // Save General Section
  window.saveGeneralSettings = async () => {
    const body = {
      serverName: document.getElementById("gen-server-name").value,
      serverVersion: document.getElementById("gen-server-version").value,
      serverIp: document.getElementById("gen-server-ip").value,
      serverPort: parseInt(document.getElementById("gen-server-port").value, 10),
      discordInvite: document.getElementById("gen-discord-invite").value,
      email: document.getElementById("gen-support-email").value,
      statusOverride: statusOverrideMode,
      mockPlayerCount: parseInt(document.getElementById("gen-mock-players").value, 10),
      mockMaxPlayers: parseInt(document.getElementById("gen-mock-max").value, 10),
      theme: {
        primaryAccent: document.getElementById("theme-primary").value,
        secondaryAccent: document.getElementById("theme-secondary").value,
        goldAccent: document.getElementById("theme-gold").value,
        darkBg: "#0a0f0d",
        glassBg: "rgba(10, 15, 13, 0.7)"
      }
    };

    try {
      const res = await fetch("/api/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showToast("General settings saved successfully!");
        reloadThemeStylesheet();
        reloadPreview();
      } else {
        showToast("Failed to save settings.", true);
      }
    } catch (err) {
      showToast("Error connecting to server API.", true);
    }
  };

  // Save Hero section
  window.saveHeroSettings = async () => {
    const body = {
      title: document.getElementById("hero-edit-title").value,
      subtitle: document.getElementById("hero-edit-subtitle").value,
      bannerImage: document.getElementById("hero-banner-path").value
    };

    try {
      const res = await fetch("/api/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showToast("Hero settings updated!");
        reloadPreview();
      } else {
        showToast("Failed to save hero.", true);
      }
    } catch (err) {
      showToast("Error updating hero settings.", true);
    }
  };

  // Announcements List CRUD
  function renderAnnouncementsList(announcements) {
    const container = document.getElementById("announcements-container");
    if (!container) return;

    if (announcements.length === 0) {
      announcements = [{ id: "1", text: "", active: false }];
    }

    container.innerHTML = announcements.map((ann, idx) => `
      <div class="glass-card" style="padding: 20px; margin-bottom: 15px;">
        <div class="form-group">
          <label>Ticker Announcement Text</label>
          <input type="text" class="form-control gen-announcement-text" value="${ann.text}" placeholder="Enter scrolling alert ticker banner text here...">
        </div>
        <div style="display:flex; align-items:center; gap:10px;">
          <input type="checkbox" id="ann-active-${idx}" class="gen-announcement-active" ${ann.active ? 'checked' : ''} style="width:20px; height:20px; cursor:pointer;">
          <label for="ann-active-${idx}" style="margin-bottom:0; cursor:pointer;">Show Announcement Ticker publicly</label>
        </div>
      </div>
    `).join("");
  }

  window.saveAnnouncements = async () => {
    const list = [];
    const textEls = document.querySelectorAll(".gen-announcement-text");
    const activeEls = document.querySelectorAll(".gen-announcement-active");

    textEls.forEach((el, index) => {
      list.push({
        id: (index + 1).toString(),
        text: el.value,
        active: activeEls[index].checked
      });
    });

    try {
      const res = await fetch("/api/announcements", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(list)
      });
      if (res.ok) {
        showToast("Announcements saved!");
        reloadPreview();
      } else {
        showToast("Failed to update announcements.", true);
      }
    } catch (err) {
      showToast("Server error saving announcements.", true);
    }
  };

  // Save About Section content
  window.saveAboutSettings = async () => {
    const body = {
      title: document.getElementById("about-edit-title").value,
      content: document.getElementById("about-edit-content").value
    };

    try {
      const res = await fetch("/api/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showToast("About section updated!");
        reloadPreview();
      } else {
        showToast("Failed to update content.", true);
      }
    } catch (err) {
      showToast("Server error updating about section.", true);
    }
  };

  // --- FEATURES SECTION CRUD ---
  function renderFeaturesList(features) {
    const list = document.getElementById("features-list");
    if (!list) return;

    list.innerHTML = features.map(f => `
      <div class="item-list-row">
        <div class="item-details">
          <div class="item-icon-circle"><i data-lucide="${f.icon || 'star'}"></i></div>
          <div class="item-title-meta">
            <h4>${f.title}</h4>
            <p>${f.description.length > 80 ? f.description.substring(0, 80) + '...' : f.description}</p>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-icon" onclick="openFeatureModal('${f.id}', '${escapeQuote(f.title)}', '${f.icon}', '${escapeQuote(f.description)}')"><i data-lucide="edit"></i></button>
          <button class="btn-icon delete" onclick="deleteFeatureCard('${f.id}')"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    `).join("");

    if (window.lucide) window.lucide.createIcons();
  }

  window.openFeatureModal = (id = "", title = "", icon = "star", desc = "") => {
    document.getElementById("feature-card-id").value = id;
    document.getElementById("feature-edit-card-title").value = title;
    document.getElementById("feature-edit-card-icon").value = icon;
    document.getElementById("feature-edit-card-desc").value = desc;

    document.getElementById("feature-modal-title").innerText = id ? "Edit Feature Card" : "Add Feature Card";
    openModal("feature-modal");
  };

  window.submitFeatureCard = async () => {
    const id = document.getElementById("feature-card-id").value;
    const body = {
      title: document.getElementById("feature-edit-card-title").value,
      icon: document.getElementById("feature-edit-card-icon").value,
      description: document.getElementById("feature-edit-card-desc").value
    };

    const url = id ? `/api/features/${id}` : '/api/features';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        closeModal("feature-modal");
        showToast("Feature saved!");
        loadPortalConfigurations();
        reloadPreview();
      } else {
        showToast("Error saving feature card.", true);
      }
    } catch (err) {
      showToast("Server communication error.", true);
    }
  };

  window.deleteFeatureCard = async (id) => {
    if (!confirm("Are you sure you want to delete this feature card?")) return;

    try {
      const res = await fetch(`/api/features/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Feature card deleted.");
        loadPortalConfigurations();
        reloadPreview();
      } else {
        showToast("Delete failed.", true);
      }
    } catch (err) {
      showToast("Error deleting card.", true);
    }
  };

  // --- NEWS SECTION CRUD ---
  function renderNewsList(news) {
    const list = document.getElementById("news-list");
    if (!list) return;

    list.innerHTML = news.map(n => `
      <div class="item-list-row">
        <div class="item-details">
          <div style="width:50px; height:50px; border-radius:6px; background-image:url('${n.image || '/assets/news-placeholder.jpg'}'); background-size:cover; background-position:center; border:1px solid var(--glass-border);"></div>
          <div class="item-title-meta">
            <h4>${n.title}</h4>
            <p>${n.category} | By ${n.author} on ${n.date}</p>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-icon" onclick="openNewsModal('${n.id}', '${escapeQuote(n.title)}', '${n.category}', '${escapeQuote(n.author)}', '${n.image}', '${escapeQuote(n.content)}')"><i data-lucide="edit"></i></button>
          <button class="btn-icon delete" onclick="deleteNewsPost('${n.id}')"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    `).join("");

    if (window.lucide) window.lucide.createIcons();
  }

  window.openNewsModal = (id = "", title = "", category = "Announcement", author = "Admin", image = "", content = "") => {
    document.getElementById("news-post-id").value = id;
    document.getElementById("news-edit-post-title").value = title;
    document.getElementById("news-edit-post-category").value = category;
    document.getElementById("news-edit-post-author").value = author;
    document.getElementById("news-image-path").value = image;
    document.getElementById("news-edit-post-content").value = content;

    const preview = document.getElementById("news-image-preview");
    if (image) {
      preview.style.backgroundImage = `url('${image}')`;
      preview.innerText = "";
    } else {
      preview.style.backgroundImage = "none";
      preview.innerText = "No Image Selected";
    }

    document.getElementById("news-modal-title").innerText = id ? "Edit News Post" : "Create News Post";
    openModal("news-modal");
  };

  window.submitNewsPost = async () => {
    const id = document.getElementById("news-post-id").value;
    const body = {
      title: document.getElementById("news-edit-post-title").value,
      category: document.getElementById("news-edit-post-category").value,
      author: document.getElementById("news-edit-post-author").value,
      image: document.getElementById("news-image-path").value,
      content: document.getElementById("news-edit-post-content").value
    };

    const url = id ? `/api/news/${id}` : '/api/news';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        closeModal("news-modal");
        showToast("News post saved!");
        loadPortalConfigurations();
        reloadPreview();
      } else {
        showToast("Error saving post.", true);
      }
    } catch (err) {
      showToast("Server error.", true);
    }
  };

  window.deleteNewsPost = async (id) => {
    if (!confirm("Are you sure you want to delete this news post?")) return;

    try {
      const res = await fetch(`/api/news/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("News post deleted.");
        loadPortalConfigurations();
        reloadPreview();
      } else {
        showToast("Delete failed.", true);
      }
    } catch (err) {
      showToast("Server error.", true);
    }
  };

  // --- GALLERY IMAGES CRUD ---
  function renderGalleryList(gallery) {
    const list = document.getElementById("gallery-list");
    if (!list) return;

    list.innerHTML = gallery.map(g => `
      <div class="item-list-row">
        <div class="item-details">
          <div style="width:60px; height:50px; border-radius:6px; background-image:url('${g.url}'); background-size:cover; background-position:center; border:1px solid var(--glass-border);"></div>
          <div class="item-title-meta">
            <h4>${g.title}</h4>
            <p>${g.description}</p>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-icon delete" onclick="deleteGalleryItem('${g.id}')"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    `).join("");

    if (window.lucide) window.lucide.createIcons();
  }

  window.openGalleryModal = () => {
    document.getElementById("gallery-edit-title").value = "";
    document.getElementById("gallery-edit-desc").value = "";
    document.getElementById("gallery-image-path").value = "";
    const preview = document.getElementById("gallery-image-preview");
    preview.style.backgroundImage = "none";
    preview.innerText = "Choose File";
    openModal("gallery-modal");
  };

  window.submitGalleryItem = async () => {
    const body = {
      title: document.getElementById("gallery-edit-title").value,
      description: document.getElementById("gallery-edit-desc").value,
      url: document.getElementById("gallery-image-path").value
    };

    if (!body.url) {
      showToast("Please upload a screenshot image file first.", true);
      return;
    }

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        closeModal("gallery-modal");
        showToast("Screenshot added to gallery!");
        loadPortalConfigurations();
        reloadPreview();
      } else {
        showToast("Failed to save gallery screenshot.", true);
      }
    } catch (err) {
      showToast("Server error.", true);
    }
  };

  window.deleteGalleryItem = async (id) => {
    if (!confirm("Are you sure you want to delete this screenshot from the gallery?")) return;

    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Screenshot deleted.");
        loadPortalConfigurations();
        reloadPreview();
      } else {
        showToast("Delete failed.", true);
      }
    } catch (err) {
      showToast("Server error.", true);
    }
  };

  // --- STATS EDIT SECTION ---
  function renderStatsInputs(stats) {
    const container = document.getElementById("stats-inputs-container");
    if (!container) return;

    container.innerHTML = stats.map((s, idx) => `
      <div class="glass-card stat-item-input-row" style="padding:20px; margin-bottom:15px; display:flex; gap:15px; flex-wrap:wrap; align-items:center;">
        <input type="hidden" class="stat-input-id" value="${s.id}">
        <div style="flex:1; min-width:150px;">
          <label style="font-size:0.75rem;">Stat Title</label>
          <input type="text" class="form-control stat-input-name" value="${s.name}">
        </div>
        <div style="width:120px;">
          <label style="font-size:0.75rem;">Numeric Value</label>
          <input type="number" class="form-control stat-input-val" value="${s.value}">
        </div>
        <div style="width:80px;">
          <label style="font-size:0.75rem;">Suffix (e.g. +, h)</label>
          <input type="text" class="form-control stat-input-suffix" value="${s.suffix || ''}">
        </div>
        <div style="width:150px;">
          <label style="font-size:0.75rem;">Icon (Lucide name)</label>
          <input type="text" class="form-control stat-input-icon" value="${s.icon || 'bar-chart'}">
        </div>
      </div>
    `).join("");
  }

  window.saveStatsSettings = async () => {
    const list = [];
    const ids = document.querySelectorAll(".stat-input-id");
    const names = document.querySelectorAll(".stat-input-name");
    const values = document.querySelectorAll(".stat-input-val");
    const suffixes = document.querySelectorAll(".stat-input-suffix");
    const icons = document.querySelectorAll(".stat-input-icon");

    ids.forEach((idEl, index) => {
      list.push({
        id: idEl.value,
        name: names[index].value,
        value: parseInt(values[index].value, 10),
        suffix: suffixes[index].value,
        icon: icons[index].value
      });
    });

    try {
      const res = await fetch("/api/stats", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(list)
      });
      if (res.ok) {
        showToast("Statistics counters updated!");
        reloadPreview();
      } else {
        showToast("Failed to save stats.", true);
      }
    } catch (err) {
      showToast("Server error.", true);
    }
  };

  // --- STAFF TEAM CRUD ---
  function renderStaffList(staff) {
    const list = document.getElementById("staff-list");
    if (!list) return;

    list.innerHTML = staff.map(s => `
      <div class="item-list-row">
        <div class="item-details">
          <img src="${s.avatar || '/assets/avatar-default.png'}" style="width:45px; height:45px; border-radius:50%; border:2px solid var(--primary-accent); object-fit:cover;">
          <div class="item-title-meta">
            <h4>${s.name}</h4>
            <p>${s.role} | ${s.description.length > 60 ? s.description.substring(0, 60) + '...' : s.description}</p>
          </div>
        </div>
        <div class="item-actions">
          <button class="btn-icon" onclick="openStaffModal('${s.id}', '${escapeQuote(s.name)}', '${s.role}', '${s.avatar}', '${escapeQuote(s.description)}')"><i data-lucide="edit"></i></button>
          <button class="btn-icon delete" onclick="deleteStaffMember('${s.id}')"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    `).join("");

    if (window.lucide) window.lucide.createIcons();
  }

  window.openStaffModal = (id = "", name = "", role = "Helper", avatar = "", description = "") => {
    document.getElementById("staff-member-id").value = id;
    document.getElementById("staff-edit-name").value = name;
    document.getElementById("staff-edit-role").value = role;
    document.getElementById("staff-avatar-path").value = avatar;
    document.getElementById("staff-edit-desc").value = description;

    const preview = document.getElementById("staff-avatar-preview");
    if (avatar) {
      preview.style.backgroundImage = `url('${avatar}')`;
      preview.innerText = "";
    } else {
      preview.style.backgroundImage = "none";
      preview.innerText = "No Photo";
    }

    document.getElementById("staff-modal-title").innerText = id ? "Edit Staff Member" : "Add Staff Member";
    openModal("staff-modal");
  };

  window.submitStaffMember = async () => {
    const id = document.getElementById("staff-member-id").value;
    const body = {
      name: document.getElementById("staff-edit-name").value,
      role: document.getElementById("staff-edit-role").value,
      avatar: document.getElementById("staff-avatar-path").value,
      description: document.getElementById("staff-edit-desc").value
    };

    const url = id ? `/api/staff/${id}` : '/api/staff';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        closeModal("staff-modal");
        showToast("Staff card saved!");
        loadPortalConfigurations();
        reloadPreview();
      } else {
        showToast("Failed to save staff details.", true);
      }
    } catch (err) {
      showToast("Server error.", true);
    }
  };

  window.deleteStaffMember = async (id) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;

    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Staff member removed.");
        loadPortalConfigurations();
        reloadPreview();
      } else {
        showToast("Delete failed.", true);
      }
    } catch (err) {
      showToast("Server error.", true);
    }
  };

  // --- FAQ SECTION CRUD ---
  function renderFaqList(faq) {
    const list = document.getElementById("faq-list");
    if (!list) return;

    list.innerHTML = faq.map(f => `
      <div class="item-list-row">
        <div class="item-title-meta">
          <h4>${f.question}</h4>
          <p>${f.answer.length > 100 ? f.answer.substring(0, 100) + '...' : f.answer}</p>
        </div>
        <div class="item-actions">
          <button class="btn-icon" onclick="openFaqModal('${f.id}', '${escapeQuote(f.question)}', '${escapeQuote(f.answer)}')"><i data-lucide="edit"></i></button>
          <button class="btn-icon delete" onclick="deleteFaqItem('${f.id}')"><i data-lucide="trash-2"></i></button>
        </div>
      </div>
    `).join("");

    if (window.lucide) window.lucide.createIcons();
  }

  window.openFaqModal = (id = "", question = "", answer = "") => {
    document.getElementById("faq-id").value = id;
    document.getElementById("faq-edit-question").value = question;
    document.getElementById("faq-edit-answer").value = answer;

    document.getElementById("faq-modal-title").innerText = id ? "Edit FAQ Accordion" : "Add FAQ Accordion";
    openModal("faq-modal");
  };

  window.submitFaqItem = async () => {
    const id = document.getElementById("faq-id").value;
    const body = {
      question: document.getElementById("faq-edit-question").value,
      answer: document.getElementById("faq-edit-answer").value
    };

    const url = id ? `/api/faq/${id}` : '/api/faq';
    const method = id ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        closeModal("faq-modal");
        showToast("FAQ accordion saved!");
        loadPortalConfigurations();
        reloadPreview();
      } else {
        showToast("Failed to save FAQ.", true);
      }
    } catch (err) {
      showToast("Server error.", true);
    }
  };

  window.deleteFaqItem = async (id) => {
    if (!confirm("Are you sure you want to delete this FAQ entry?")) return;

    try {
      const res = await fetch(`/api/faq/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("FAQ entry deleted.");
        loadPortalConfigurations();
        reloadPreview();
      } else {
        showToast("Delete failed.", true);
      }
    } catch (err) {
      showToast("Server error.", true);
    }
  };

  // --- STORE RANKS & VOTES SETF ---
  function renderStoreRanksInputs(store) {
    const container = document.getElementById("store-ranks-inputs-container");
    if (!container) return;

    container.innerHTML = store.map((s, idx) => `
      <div class="glass-card store-rank-item" style="padding:20px; border-left: 3px solid ${s.popular ? 'var(--gold-accent)' : 'var(--glass-border)'}">
        <div class="row">
          <div class="col">
            <div class="form-group" style="margin-bottom:10px;">
              <label style="font-size:0.75rem;">Rank Name</label>
              <input type="text" class="form-control store-rank-name" value="${s.name}">
            </div>
          </div>
          <div class="col" style="flex:0; min-width:120px;">
            <div class="form-group" style="margin-bottom:10px;">
              <label style="font-size:0.75rem;">Price Tag</label>
              <input type="text" class="form-control store-rank-price" value="${s.price}">
            </div>
          </div>
          <div class="col" style="flex:0; min-width:120px; display:flex; align-items:center;">
            <div style="display:flex; align-items:center; gap:8px;">
              <input type="checkbox" id="rank-pop-${idx}" class="store-rank-popular" ${s.popular ? 'checked' : ''} style="width:18px; height:18px;">
              <label for="rank-pop-${idx}" style="margin-bottom:0; font-size:0.75rem;">Popular</label>
            </div>
          </div>
        </div>
        <div class="form-group" style="margin-bottom:0;">
          <label style="font-size:0.75rem;">Features List (Comma-separated)</label>
          <input type="text" class="form-control store-rank-features" value="${s.features.join(', ')}">
        </div>
      </div>
    `).join("");
  }

  function renderVotingLinksInputs(voting) {
    const container = document.getElementById("voting-links-inputs-container");
    if (!container) return;

    container.innerHTML = voting.map(v => `
      <div class="glass-card voting-link-item" style="padding:15px; display:flex; gap:15px; align-items:center;">
        <input type="hidden" class="voting-link-id" value="${v.id}">
        <div style="width:200px;">
          <label style="font-size:0.75rem;">Voting Site Name</label>
          <input type="text" class="form-control voting-link-name" value="${v.name}">
        </div>
        <div style="flex:1;">
          <label style="font-size:0.75rem;">Vote Site Referral Link</label>
          <input type="text" class="form-control voting-link-url" value="${v.url}">
        </div>
      </div>
    `).join("");
  }

  window.saveStoreSettings = async () => {
    // Collect ranks
    const ranks = [];
    const rankNames = document.querySelectorAll(".store-rank-name");
    const rankPrices = document.querySelectorAll(".store-rank-price");
    const rankPopulars = document.querySelectorAll(".store-rank-popular");
    const rankFeatures = document.querySelectorAll(".store-rank-features");

    rankNames.forEach((el, index) => {
      const featArr = rankFeatures[index].value.split(',').map(f => f.trim()).filter(f => f.length > 0);
      ranks.push({
        id: (index + 1).toString(),
        name: el.value,
        price: rankPrices[index].value,
        popular: rankPopulars[index].checked,
        features: featArr
      });
    });

    // Collect vote links
    const votes = [];
    const voteIds = document.querySelectorAll(".voting-link-id");
    const voteNames = document.querySelectorAll(".voting-link-name");
    const voteUrls = document.querySelectorAll(".voting-link-url");

    voteIds.forEach((el, index) => {
      votes.push({
        id: el.value,
        name: voteNames[index].value,
        url: voteUrls[index].value
      });
    });

    const body = {
      votingRewards: document.getElementById("vote-edit-desc").value,
      storeDescription: document.getElementById("store-edit-desc").value,
      store: ranks,
      voting: votes
    };

    try {
      const res = await fetch("/api/store-voting", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        showToast("Ranks Store and voting settings saved!");
        reloadPreview();
      } else {
        showToast("Save failed.", true);
      }
    } catch (err) {
      showToast("Server error updating store.", true);
    }
  };

  // --- PASSWORD UPDATE SECURITY ---
  window.changeAdminPassword = async () => {
    const currentPasswordVal = document.getElementById("sec-current-pass").value;
    const newPasswordVal = document.getElementById("sec-new-pass").value;

    if (!currentPasswordVal || !newPasswordVal) {
      showToast("Please fill in both current and new password fields.", true);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPasswordVal, newPassword: newPasswordVal })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Admin credentials updated successfully!");
        document.getElementById("sec-current-pass").value = "";
        document.getElementById("sec-new-pass").value = "";
      } else {
        showToast(data.error || "Failed to update credentials.", true);
      }
    } catch (err) {
      showToast("Error updating password.", true);
    }
  };

  // --- GENERAL HELPER LOGICS ---

  // Handle statusoverride mode setting pills
  window.setStatusOverride = (mode) => {
    statusOverrideMode = mode;
    
    // Remove active pill class
    document.querySelectorAll(".status-pill").forEach(p => p.classList.remove("active"));
    
    // Add to active
    if (mode === "auto") document.getElementById("pill-auto").classList.add("active");
    if (mode === "online") document.getElementById("pill-online").classList.add("active");
    if (mode === "offline") document.getElementById("pill-offline").classList.add("active");
    if (mode === "maintenance") document.getElementById("pill-maint").classList.add("active");

    const countsRow = document.getElementById("mock-player-counts-row");
    if (mode === "auto") {
      countsRow.style.opacity = "0.5";
    } else {
      countsRow.style.opacity = "1";
    }
  };

  // Image Upload handler
  window.uploadImage = async (fileInputId, previewId, uploadUrl, pathInputId) => {
    const fileInput = document.getElementById(fileInputId);
    const previewEl = document.getElementById(previewId);
    const pathInput = document.getElementById(pathInputId);

    if (fileInput.files.length === 0) return;

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("image", file);

    previewEl.style.backgroundImage = "none";
    previewEl.innerText = "Uploading...";

    try {
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        previewEl.style.backgroundImage = `url('${data.url}')`;
        previewEl.innerText = "";
        pathInput.value = data.url;
        showToast("Image uploaded successfully!");
        
        // Sync preview directly to active tab fields
        if (activeTab === "hero") {
          // Instantly sync preview
        }
      } else {
        previewEl.innerText = "Upload Failed";
        showToast(data.error || "Failed to upload image.", true);
      }
    } catch (err) {
      previewEl.innerText = "Connection Error";
      showToast("Error connecting to upload API.", true);
    }
  };

  // Live CSS injection for theme accent pickers in the dashboard admin portal itself
  window.updateLiveTheme = () => {
    const primary = document.getElementById("theme-primary").value;
    const secondary = document.getElementById("theme-secondary").value;
    const gold = document.getElementById("theme-gold").value;

    // Apply variables to current admin document so admin screen changes colors
    document.documentElement.style.setProperty('--primary-accent', primary);
    document.documentElement.style.setProperty('--secondary-accent', secondary);
    document.documentElement.style.setProperty('--gold-accent', gold);
    
    // Apply changes to preview iframe dynamically!
    try {
      const iframeDoc = previewFrame.contentWindow.document;
      iframeDoc.documentElement.style.setProperty('--primary-accent', primary);
      iframeDoc.documentElement.style.setProperty('--secondary-accent', secondary);
      iframeDoc.documentElement.style.setProperty('--gold-accent', gold);
    } catch (e) {
      // Ignore cross-origin issues if iframe isn't fully ready
    }
  };

  function reloadThemeStylesheet() {
    // Forces refetch of dynamic /api/theme.css by adding a query parameter
    try {
      const iframeDoc = previewFrame.contentWindow.document;
      const links = iframeDoc.querySelectorAll("link[href*='/api/theme.css']");
      links.forEach(l => {
        l.href = `/api/theme.css?v=${Date.now()}`;
      });
    } catch (e) {
      // Ignore
    }
  }

  window.reloadPreview = () => {
    if (previewFrame) {
      previewFrame.contentWindow.location.reload();
    }
  };

  // Dialog Modals opener/closers
  window.openModal = (modalId) => {
    document.getElementById(modalId).style.display = "flex";
  };

  window.closeModal = (modalId) => {
    document.getElementById(modalId).style.display = "none";
  };

  // Close modals when clicking overlay background
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.style.display = "none";
      }
    });
  });

  // Helpers
  function escapeQuote(str) {
    if (!str) return "";
    return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }
});

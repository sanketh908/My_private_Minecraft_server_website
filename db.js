const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DB_DIR, 'db.json');

// Default Seed Data
const DEFAULT_DATA = {
  config: {
    serverName: "Elysium Network",
    serverIp: "play.elysiummc.net",
    serverPort: 25565,
    serverVersion: "1.20.4 - 1.21.x",
    statusOverride: "auto", // auto, online, offline, maintenance
    mockPlayerCount: 142,
    mockMaxPlayers: 500,
    discordInvite: "https://discord.gg/elysium",
    votingRewards: "Vote daily to earn 100 Elysium Coins, Key Chest keys, and exclusive temporary prefixes!",
    storeDescription: "Support the server and unlock exclusive ranks, cosmetics, custom tags, and crate keys. All purchases go directly towards funding server hosting and development.",
    theme: {
      primaryAccent: "#00ff88", // Emerald Green
      secondaryAccent: "#00f0ff", // Cyan
      goldAccent: "#ffd700", // Gold
      darkBg: "#0a0f0d", // Dark background
      glassBg: "rgba(10, 15, 13, 0.7)"
    }
  },
  hero: {
    title: "The Ultimate Minecraft Experience",
    subtitle: "Embark on an epic adventure with custom quests, immersive survival gameplay, a dynamic player-driven economy, and an active, welcoming community.",
    btnJoinText: "Join the Server",
    btnDiscordText: "Join our Discord",
    bannerImage: "/assets/hero-bg.png"
  },
  about: {
    title: "An Independently Developed World",
    content: "Elysium Network is built from the ground up by passionate developers who love Minecraft. We focus on providing a lag-free, balanced, and feature-rich environment for players of all styles. Whether you are a master builder, an economic tycoon, or a quest hunter, you'll find your home here. We push regular weekly updates, host weekend events, and maintain a highly active moderation team to ensure a fair and fun experience for everyone."
  },
  features: [
    { id: "1", title: "Custom Gameplay", description: "Experience unique mechanics, custom items, and tailored progression systems you won't find anywhere else.", icon: "swords" },
    { id: "2", title: "Survival Experience", description: "A beautifully generated world with protected land claims, balanced difficulty, and custom biomes.", icon: "trees" },
    { id: "3", title: "Weekly Events", description: "Compete in build battles, parkour tournaments, boss raids, and community scavenger hunts with huge rewards.", icon: "calendar" },
    { id: "4", title: "Player Economy", description: "Create your own shops, trade on the dynamic global auction house, and build a massive financial empire.", icon: "coins" },
    { id: "5", title: "Epic Quests", description: "Complete hundreds of unique daily and weekly quests to earn rare loot, currency, and ranks.", icon: "compass" },
    { id: "6", title: "Custom Plugins", description: "Our dedicated developers write custom plugins to optimize performance and introduce exclusive features.", icon: "code" },
    { id: "7", title: "Active Moderation", description: "A mature, helpful staff team online 24/7 to ensure a safe, hacker-free, and friendly environment.", icon: "shield" },
    { id: "8", title: "Optimized Performance", description: "Hosted on dedicated premium hardware with 99.9% uptime, custom fork software, and absolute zero lag.", icon: "zap" },
    { id: "9", title: "Frequent Updates", description: "We continuously listen to player feedback, deploying weekly patches, content expansions, and seasonal updates.", icon: "refresh" }
  ],
  news: [
    {
      id: "1",
      title: "Summer Update 1.4: Rise of the Dungeons",
      category: "Update",
      date: "2026-07-10",
      content: "We are thrilled to launch our largest update of the year! Explore the new Dungeon Realm, battle customized bosses, collect unique legendary gear, and complete over 50 brand-new quests. The level cap has been raised to 60, and class specializations are now available. Check the server guide on Discord for full patch notes!",
      author: "Admin Elysian",
      image: "/assets/news-dungeons.jpg"
    },
    {
      id: "2",
      title: "Upcoming Community Build Competition!",
      category: "Event",
      date: "2026-07-08",
      content: "Grab your blocks and get ready! Our seasonal build competition starts this Friday at 6:00 PM EST. The theme is 'Lost Civilizations'. Competitors will have a 64x64 plot and 48 hours to build. Prizes include permanent server ranks, store giftcards, and custom lobby trophies. Sign up in the #events channel on Discord.",
      author: "Moderator BuilderBob",
      image: "/assets/news-build-comp.jpg"
    },
    {
      id: "3",
      title: "Scheduled Maintenance: Performance Enhancements",
      category: "Maintenance",
      date: "2026-07-05",
      content: "The server will undergo a brief scheduled maintenance on July 15th at 04:00 UTC. We will be migrating our database to a faster NVMe drive and performing software optimizations. Uptime interruption is expected to be under 30 minutes. Thank you for your patience!",
      author: "Dev Techy",
      image: ""
    }
  ],
  gallery: [
    { id: "1", url: "/assets/gallery-spawn.jpg", title: "Elysium Server Spawn", description: "Our majestic floating island spawn built by the community team." },
    { id: "2", url: "/assets/gallery-nether.jpg", title: "Custom Nether Fortress", description: "A overhauled custom Nether fortress featuring unique hostile monsters." },
    { id: "3", url: "/assets/gallery-town.jpg", title: "Player Town Square", description: "The bustling player-made marketplace where players trade and meet." },
    { id: "4", url: "/assets/gallery-dungeon.jpg", title: "Dungeon Entrance", description: "The mysterious gates leading into the depth of the new level 40 dungeon." }
  ],
  stats: [
    { id: "1", name: "Registered Players", value: 12450, suffix: "+", icon: "users" },
    { id: "2", name: "Total Playtime", value: 85200, suffix: "h", icon: "clock" },
    { id: "3", name: "Monthly Votes", value: 3412, suffix: "", icon: "thumbs-up" },
    { id: "4", name: "Discord Members", value: 4890, suffix: "", icon: "message-square" },
    { id: "5", name: "Years Online", value: 3, suffix: "+", icon: "award" }
  ],
  staff: [
    { id: "1", name: "Elysian", role: "Owner", avatar: "/assets/avatar-elysian.png", description: "Founder and Lead Director. Oversees community relations, finance, and overall server vision." },
    { id: "2", name: "Techy", role: "Developer", avatar: "/assets/avatar-techy.png", description: "Server optimization expert. Writes custom plugins and ensures Elysium runs smoothly with zero lag." },
    { id: "3", name: "BuilderBob", role: "Lead Builder", avatar: "/assets/avatar-bob.png", description: "Head of design and map creation. Architect behind the server spawn, warps, and dungeons." },
    { id: "4", name: "ModSarah", role: "Admin", avatar: "/assets/avatar-sarah.png", description: "Manages the helper/moderator staff, handles player ban appeals, and coordinates server events." }
  ],
  faq: [
    { id: "1", question: "How do I join the server?", answer: "Open Minecraft, click 'Multiplayer', select 'Add Server', enter our server IP (play.elysiummc.net) in the Server Address field, and click 'Done'. Select the server and click 'Join Server'!" },
    { id: "2", question: "What Minecraft versions are supported?", answer: "Elysium Network supports client versions from 1.20.4 all the way up to the latest release (1.21.x). For the absolute best performance and visual experience, we recommend playing on version 1.20.4." },
    { id: "3", question: "What are the server rules?", answer: "Our main rules are: 1. Be respectful to all players. 2. No hacking, cheating, or using client mods that give an unfair advantage. 3. No griefing or stealing in claimed territories. 4. No chat spamming or advertising. A full list of detailed rules is available on our Discord." },
    { id: "4", question: "How do I report a player or appeal a ban?", answer: "All player reports, bug reports, and ban appeals are handled through our Discord support ticket system. Simply join the Discord and type `/ticket open` in any channel to start a private conversation with our staff." },
    { id: "5", question: "Where is the server hosted?", answer: "Our dedicated servers are located in Ashburn, Virginia (US East), offering low latency to players across North America, South America, and Europe." }
  ],
  voting: [
    { id: "1", name: "MinecraftServers.org", url: "https://minecraftservers.org" },
    { id: "2", name: "Minecraft-Server-List.com", url: "https://minecraft-server-list.com" },
    { id: "3", name: "TopG.org", url: "https://topg.org" }
  ],
  store: [
    { id: "1", name: "Hero Rank", price: "$9.99", features: ["Gold Username Tag", "Access to /fly in Spawn", "5x Custom Claim Blocks", "+3 Active Auction Slots"], popular: false },
    { id: "2", name: "Legend Rank", price: "$24.99", features: ["Cyan Username Tag", "Access to /fly Globally", "10x Custom Claim Blocks", "Weekly Legend Key", "Priority Queue Access"], popular: true },
    { id: "3", name: "Elysian Rank", price: "$49.99", features: ["Glowing Emerald Tag", "All Custom Cosmetics", "25x Custom Claim Blocks", "Daily Elysian Chest Key", "Access to Staff Chat (Read-Only)"], popular: false }
  ],
  announcements: [
    { id: "1", text: "🔥 SUMMER SALE: Use code SUMMERSALE for 20% off all ranks in our server store!", active: true }
  ],
  admin: {
    username: "admin",
    passwordHash: "" // Hashed on runtime initialization if empty
  }
};

class JSONDatabase {
  constructor() {
    this.data = {};
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
      // Set default password hash dynamically
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync("password123", salt);
      DEFAULT_DATA.admin.passwordHash = hash;

      this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
      this.saveSync();
    } else {
      try {
        const fileContent = fs.readFileSync(DB_PATH, 'utf8');
        this.data = JSON.parse(fileContent);
        
        // Ensure default structure exists (in case of legacy/broken JSON structure)
        let modified = false;
        for (const key in DEFAULT_DATA) {
          if (this.data[key] === undefined) {
            this.data[key] = JSON.parse(JSON.stringify(DEFAULT_DATA[key]));
            modified = true;
          }
        }
        if (modified) {
          this.saveSync();
        }
      } catch (err) {
        console.error("Error reading database file, resetting to defaults...", err);
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync("password123", salt);
        DEFAULT_DATA.admin.passwordHash = hash;
        this.data = JSON.parse(JSON.stringify(DEFAULT_DATA));
        this.saveSync();
      }
    }
  }

  // Get data by root key
  get(key) {
    return this.data[key];
  }

  // Set data by root key and save atomically
  set(key, value) {
    this.data[key] = value;
    this.save();
    return value;
  }

  // Get all data
  all() {
    return this.data;
  }

  // Sync save for initialization
  saveSync() {
    try {
      const tempPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf8');
      fs.renameSync(tempPath, DB_PATH);
    } catch (err) {
      console.error("Failed to write database synchronously:", err);
    }
  }

  // Async atomic save
  save() {
    return new Promise((resolve, reject) => {
      const tempPath = `${DB_PATH}.tmp`;
      const dataStr = JSON.stringify(this.data, null, 2);
      
      fs.writeFile(tempPath, dataStr, 'utf8', (err) => {
        if (err) {
          console.error("Database write error:", err);
          return reject(err);
        }
        fs.rename(tempPath, DB_PATH, (renameErr) => {
          if (renameErr) {
            console.error("Database rename error:", renameErr);
            return reject(renameErr);
          }
          resolve(true);
        });
      });
    });
  }
}

module.exports = new JSONDatabase();

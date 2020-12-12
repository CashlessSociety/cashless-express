require("./lib/errors");
require("dotenv").config();
require("./lib/ssb");
require("./apollo");

let server;
setTimeout(() => {
  server = require("./express");
}, 500);


if (process.env.NODE_ENV != "production") {
  const chokidar = require("chokidar");
  const watcher = chokidar.watch("./lib");

  watcher.on("ready", () => {
    watcher.on("all", () => {
      console.log("Clearing /lib/ module cache from server");
      Object.keys(require.cache).forEach((id) => {
        if (id.includes("metrics")) return;
        if (/[\/\\]lib[\/\\]/.test(id)) delete require.cache[id];
      });
      if (server && server.close) server.close();
      server = require("./express");
    });
  });
}
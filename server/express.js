/* eslint consistent-return:0 import/order:0 */

const express = require('express');
const logger = require('./logger');
const argv = require('./argv');
const port = require('./port');
const setup = require('./middlewares/frontendMiddleware');
const isDev = process.env.NODE_ENV !== 'production';
const ssb = require("./lib/ssb-client");
const https = require('https');
const app = express();
const bodyParser = require("body-parser");
const pull = require("pull-stream");
const cookieParser = require("cookie-parser");
const fileUpload = require("express-fileupload");
const cookieEncrypter = require("cookie-encrypter");
const fs = require("fs");
const ssbKeys = require("ssb-keys");
const { sentry } = require("./lib/errors");
const cors = require('cors');
const exec = require('child_process').exec;

const ngrok = (isDev && process.env.ENABLE_TUNNEL) || argv.tunnel ? require('ngrok') : false;
const { resolve } = require('path');
const crypto = require('crypto')

const randomHash = () => {
  let bytes = crypto.randomBytes(256);
  let hash = crypto.createHash('sha256');
  hash.update(bytes);
  return hash.digest();
}

const promisePull = (...streams) =>
  new Promise((resolve, reject) => {
    pull(
      ...streams,
      pull.collect((err, msgs) => {
        if (err) return reject(err);
        return resolve(msgs);
      })
    );
});

const cookieOptions = {
    httpOnly: true,
    signed: true,
    expires: new Date(253402300000000), // Friday, 31 Dec 9999 23:59:59 GMT, nice date from stackoverflow
    sameSite: "Lax",
};

const keyshareDir = process.env.KEYSHARE_DIR || __dirname+'/';
console.log('key and key commands dir:', keyshareDir);

const sh = cmd => {
    return new Promise(function (resolve, reject) {
      exec(cmd, (err, stdout, stderr) => {
        if (err) {
          reject(err);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
}

if (sentry) {
  // Sentry request handler must be the first middleware on the app
  app.use(sentry.Handlers.requestHandler());
}
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

const cookieSecret =
  process.env.COOKIES_SECRET || "set_cookie_secret_you_are_unsafe"; // has to be 32-bits

app.use(cookieParser(cookieSecret));
app.use(cookieEncrypter(cookieSecret));
app.use(cors());

app.use(async (req, res, next) => {
  if (!ssb.client()) {
    setTimeout(() => {
      console.log("Waiting for SSB to load...");

      res.redirect(req.originalUrl);
    }, 500);
    return;
  }

  req.context = {
    status: ssb.getStatus(),
  };
  res.locals.context = req.context;

  let key;
  try {
    key = req.signedCookies["ssb_key"];
    if (key) key = JSON.parse(key);
  } catch (_) {}
  if (!key || !key.id) return next();

  ssb.client().identities.addUnboxer(key);
  req.context.key = key;

  next();
});

app.post("/login", async (req, res) => {
    res.cookie("ssb_key", JSON.stringify(req.body.key), cookieOptions);
    const returnTo = req.body.returnTo;
    res.redirect(returnTo ? returnTo : "/");
});

app.post("/pub_invite", async (_req, res) => {
  console.log(ssb.client());
  const invite = await ssb.client().invite.create({ uses: 1 });

  res.json({ invite });
});
  
app.post("/publish", async (req, res) => {
    try {
        await ssb.client().identities.publishAs({
            key: req.body.key,
            private: false,
            content: req.body.content,
        });
    } catch(_e) {
        return res.json({status: "fail"})
    }

    return res.json({status: "ok"});
});

app.post("/getPromises", async (req, res) => {
    const myQuery = [{
        "$filter": {
          value: {
            author: req.body.id,
            content: {
              type: "cashless/promise"
            }
          }
        }
    }];
    try {
        results = await promisePull(
            ssb.client().query.read({
                query: myQuery,
            })
        );
        return res.json(results);
    } catch(e) {
        return res.json({status: "fail"});
    }
});
app.post("/genKey", async(_req, res) => {
    return res.json(ssbKeys.generate("ed25519", randomHash()));
});

app.post("/upload", (req, res) => {
    // accessing the file
    const myFile = req.files.file;
    console.log('file retreived:', myFile.name, "saving as:", req.body.filename);

    //  mv() method places the file inside public directory
    myFile.mv(keyshareDir+req.body.filename, err => {
        if (err) {
            console.log(err)
            return res.json({ msg: "Error occured" });
        }

        return res.json({saved: req.body.filename, status: "ok"});
    });
});

app.post("/remove", (req, res) => {
    fs.unlink(keyshareDir+req.body.filename, err => {
        if (err) {
            console.log(err);
            return res.json({ msg: "Error occured" });
        } else {
            console.log('removing file', req.body.filename);
        }

        return res.json({deleted: req.body.filename, status: "ok"});
      });
});

app.post("/pollKeyfiles", async (_req, res) => {
    let nFound = 0;
    var outObj = {'1': false, '2': false, '3': false, '4': false};
    let cmd = keyshareDir+'checkAddressFromShards.sh';
    for (let i=0; i<4; i++) {
        let path = `${keyshareDir}${i+1}.json`;
        if (fs.existsSync(path)) {
            outObj[(i+1).toString()] = true;
            nFound += 1;
            cmd += ' '+path;
        }
    }
    if (nFound > 2) {
        try {
            let { stdout } = await sh(cmd);
            outObj.address = stdout.replace(/(\r\n|\n|\r)/gm,"");
        } catch(_e) {
            outObj.address = "n/a";
        }
    } else {
        outObj.address = "n/a";
    }
    res.json(outObj);
});

// In production we need to pass these values in instead of relying on webpack
setup(app, {
  outputPath: resolve(process.cwd(), 'build'),
  publicPath: '/',
});

// get the intended host and port number, use localhost and port 3000 if not provided
const customHost = argv.host || process.env.HOST;
const host = customHost || null; // Let http.Server use its default IPv6/4 host
const prettyHost = customHost || 'localhost';

// use the gzipped bundle
app.get('*.js', (req, res, next) => {
  req.url = req.url + '.gz'; // eslint-disable-line
  res.set('Content-Encoding', 'gzip');
  next();
});

if (sentry) {
  // The error handler must be before any other error middleware and after all controllers
  app.use(sentry.Handlers.errorHandler());
}

app.use((error, _req, res, _next) => {
  res.statusCode = 500;
  res.render("desktop/error", { error });
});

var expressServer;
if (process.env.HTTPS) {
    console.log("PROTOCOL: HTTPS (secure)");
    expressServer = https.createServer({
        key: fs.readFileSync(process.env.PROD_KEYFILE||'serverTest.key'),
        cert: fs.readFileSync(process.env.PROD_CERT||'serverTest.cert')
      }, app).listen(port, host, async err => {
      if (err) {
        return logger.error(err.message);
      }
    
      // Connect to ngrok in dev mode
      if (ngrok) {
        let url;
        try {
          url = await ngrok.connect(port);
        } catch (e) {
          return logger.error(e);
        }
        logger.appStarted(port, prettyHost, url);
      } else {
        logger.appStarted(port, prettyHost);
      }
    });
} else {
    console.log("PROTOCOL: HTTP (insecure)");
    expressServer = app.listen(port, host, async err => {
        if (err) {
          return logger.error(err.message);
        }
      
        // Connect to ngrok in dev mode
        if (ngrok) {
          let url;
          try {
            url = await ngrok.connect(port);
          } catch (e) {
            return logger.error(e);
          }
          logger.appStarted(port, prettyHost, url);
        } else {
          logger.appStarted(port, prettyHost);
        }
    });
}

module.exports = expressServer;

/*
const {
  reconstructKeys,
  uploadPicture,
  isPhone,
  ssbFolder,
} = require("./lib/utils");

const { filter } = require('lodash');
const metrics = require("./lib/metrics");

const cookieOptions = {
  httpOnly: true,
  signed: true,
  expires: new Date(253402300000000), // Friday, 31 Dec 9999 23:59:59 GMT, nice date from stackoverflow
  sameSite: "Lax",
};

const profileUrl = (id, path = "") => {
  return `/profile/${id}${path}`;
};

app.use((req, res, next) => {
  res.locals.profileUrl = profileUrl;
  res.locals.imageUrl = (imageHash) => {
    return imageHash && `/blob/${encodeURIComponent(imageHash)}`;
  };
  res.locals.profileImageUrl = (profile) => {
    if (profile.image) {
      return res.locals.imageUrl(profile.image);
    }
    return "/images/no-avatar.png";
  };

  const BLOB_PATTERN = /(&.*?=\.sha\d+)/g;
  res.locals.topicTitle = (post) => {
    const title = res.locals
      .escapeMarkdown(post.content.title || post.content.text)
      .replace(BLOB_PATTERN, "");
    if (title.length > 60) {
      return title.substr(0, 60) + "...";
    }
    return title;
  };
  res.locals.escapeMarkdown = (str) => {
    let result = str;
    result = result.replace(/!\[.*?\]\((.*?)\)/g, `$1`); // Images
    result = result.replace(/\[(@.*?)\]\(@.*?\)/g, `$1`); // Link to mention
    result = result.replace(/\[.*?\]\((.*?)\)/g, `$1`); // Any Link
    result = result.replace(/^#+ /gm, "");
    return result;
  };
  res.locals.htmlify = (str) => {
    let result = ejsUtils.escapeXML(str);
    let target = 'target="_blank"';
    if (isPhone(req)) {
      target = "";
    }
    result = result.replace(
      /(\s|^)&amp;(\S*?=\.sha\d+)/g, // Blobs
      `$1<a ${target} href="/blob/&$2">&$2</a>`
    );
    result = result.replace(
      /(https?:\/\/\S+)/g, // Urls with http in front
      `<a ${target} href="$1">$1</a>`
    );
    result = result.replace(
      /(\s|^)(([a-z-_])*(\.[^\s.]{2,})+)/gm, // Domains without http
      `$1<a ${target} href="http://$2">$2</a>`
    );
    result = result.replace(
      /(\s|^)#([a-z0-9-]+)/g, // Communities
      `$1<a href="/communities/$2">#$2</a>`
    );
    result = result.replace(/\n/g, "<br />");
    return result;
  };
  res.locals.splittedPosts = (post, limit) => {
    let text = res.locals.escapeMarkdown(post.content.text);

    if (text.length <= limit) {
      return [text];
    }

    let splittedPosts = [];
    let words = text.split(" ");
    let nextPost = "";
    for (let word of words) {
      const postsCount = splittedPosts.length + 1;
      const pageMarker = `${postsCount}/`;

      if (nextPost.length + word.length + pageMarker.length + 1 < limit) {
        nextPost += word + " ";
      } else {
        if (nextPost.length > 0) {
          splittedPosts.push(nextPost + pageMarker);
        }
        nextPost = word + " ";
      }
    }
    const postsCount = splittedPosts.length + 1;
    const lastMarker = postsCount > 1 ? `${postsCount}/${postsCount}` : "";
    splittedPosts.push(nextPost + lastMarker);

    return splittedPosts.reverse();
  };
  res.locals.timeSince = (date) => {
    const seconds = Math.floor((Date.now() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);

    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
      const dateTimeFormat = new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
      return dateTimeFormat.format(new Date(date));
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return interval + " days ago";
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return interval + " hours ago";
    interval = Math.floor(seconds / 60);
    if (interval > 1) return interval + " minutes ago";
    return "just now";
  };
  res.locals.getBranchKey = (post) => {
    let branch = post.value.content.branch;
    let branchKey = typeof branch == "string" ? branch : branch[0];
    return branchKey;
  };

  next();
});*/

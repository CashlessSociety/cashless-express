/* eslint consistent-return:0 import/order:0 */

const express = require('express');
require('express-async-errors');
require('dotenv').config();
if (!process.env.FIREBASE_SECRET) {
  throw Error(`Must set FIREBASE_SECRET as environment var (in .env file)`);
}
const logger = require('./logger');
const argv = require('./argv');
const port = require('./port');
const setup = require('./middlewares/frontendMiddleware');
const isDev = process.env.NODE_ENV !== 'production';
const ssb = require('./lib/ssb-client');
const https = require('https');
const ssbKeys = require("ssb-keys");
const { ssbFolder } = require("./lib/utils");
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const cookieEncrypter = require('cookie-encrypter');
//const axios = require('axios');
const fs = require('fs');
const { sentry } = require('./lib/errors');
const cors = require('cors');
// raise errors like this - throw httpErrorInfo(status, message, properties)
const httpErrorInfo = require('http-errors');
const firebaseAdmin = require('./firebase');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const ssbFlumeAPI = require('./datasource');

const dataSources = () => ({
    ssbFlumeAPI: new ssbFlumeAPI(),
});

const network = process.env.CASHLESS_NETWORK || "rinkeby";
const version = Number(process.env.CASHLESS_VERSION) || 1.0;
const customHost = process.env.HOST;
const host = customHost || null; // Let http.Server use its default IPv6/4 host
const prettyHost = customHost || 'localhost';
const ssbSecret = ssbKeys.loadOrCreateSync(`${ssbFolder()}/secret`);

const ngrok =
  (isDev && process.env.ENABLE_TUNNEL) || argv.tunnel
    ? require('ngrok')
    : false;
const { resolve } = require('path');

const cookieOptions = {
  httpOnly: true,
  signed: true,
  expires: new Date(253402300000000), // Friday, 31 Dec 9999 23:59:59 GMT, nice date from stackoverflow
  sameSite: 'Lax',
};

const apollo = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources,
  inrospection: true,
});

apollo.applyMiddleware({ app });

console.log(`Apollo endpoint deployed: ${apollo.graphqlPath}`);

if (sentry) {
  // Sentry request handler must be the first middleware on the app
  app.use(sentry.Handlers.requestHandler());
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload());

const cookieSecret =
  process.env.COOKIES_SECRET || 'set_cookie_secret_you_are_unsafe'; // has to be 32-bits

app.use(cookieParser(cookieSecret));
app.use(cookieEncrypter(cookieSecret));
app.use(cors());

app.use(async (req, res, next) => {
  if (!ssb.client()) {
    setTimeout(() => {
      console.log('Waiting for SSB to load...');

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
    key = req.signedCookies.ssb_key;
    if (key) key = JSON.parse(key);
  } catch (_) {}
  if (!key || !key.id) return next();

  ssb.client().identities.addUnboxer(key);
  req.context.key = key;
  next();
});

app.post('/login', async (req, res) => {
  res.cookie('ssb_key', JSON.stringify(req.body.key), cookieOptions);
  return res.json({ status: 'ok' });
});

app.use('/pub_invite', async (_req, res) => {
  const invite = await ssb.client().invite.create({ uses: 1 });

  res.json({ invite });
});

app.post('/publish', async (req, res) => {
  let key;
  if (req.body.key) {
    key = req.body.key;
  } else if (req.context.key) {
    key = req.context.key;
  } else {
    throw httpErrorInfo(401, 'No ssb key provided on publish.');
  }
  try {
    await ssb.client().identities.publishAs({
      key: key,
      private: false,
      content: req.body.content,
    });
  } catch (e) {
    console.log('publish failed:', e);
    return res.json({ status: 'fail' });
  }

  return res.json({ status: 'ok' });
});

app.post('/authenticatedEmail', async (req, res) => {
    let ssbid = req.body.ssbIdentity;
    let token = req.body.firebaseToken;
    user = await firebaseAdmin.getUserFromToken(token);
    if (user==null) {
        return res.json({status: 'fail'});
    }
    let ok = await firebaseAdmin.setUserDocument(user.email, ssbid);
    if (!ok) {
        return res.json({status: 'fail'});
    }
    let content =  {feed: {id: ssbid}, name: {type: "ACCOUNT", accountType:"GOOGLE", handle: user.email}, type: "cashless/identity", header: {version: version, network: network}, evidence:null};
    try {
        await ssb.client().identities.publishAs({
          key: ssbSecret,
          private: false,
          content: content,
        });
    } catch (e) {
        console.log('publish failed:', e);
        return res.json({ status: 'fail' });
    }
    
    return res.json({status: 'ok', verifierId: ssb.client().id});
});

// handle errors of type created by the 'httpErrorInfo' method
app.use((error, req, res, next) => {
  // Sets HTTP status code
  res.status(error.status);

  console.log(`${error.status} - ${error.message}`);
  console.log(error.stack);

  // Sends response
  res.json({
    status: error.status,
    message: error.message,
  });
});

// In production we need to pass these values in instead of relying on webpack
setup(app, {
  outputPath: resolve(process.cwd(), 'build'),
  publicPath: '/',
});

// use the gzipped bundle
app.get('*.js', (req, res, next) => {
  req.url = req.url + '.gz'; // eslint-disable-line
  res.set('Content-Encoding', 'gzip');
  next();
});

app.use((error, _req, res, _next) => {
  res.statusCode = 500;
  res.render('desktop/error', { error });
});

let expressServer;
if (process.env.HTTPS) {
  console.log('PROTOCOL: HTTPS (secure)');
  expressServer = https
    .createServer(
      {
        key: fs.readFileSync(process.env.PROD_KEYFILE || 'serverTest.key'),
        cert: fs.readFileSync(process.env.PROD_CERT || 'serverTest.cert'),
      },
      app,
    )
    .listen(port, host, async err => {
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
  console.log('PROTOCOL: HTTP (insecure)');
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

/*app.use('/transactions', async (_req, res) => {
  try {
    const query = `
        query { allPromises {
            id
            author {
                id
                commonName {
                    name
                }
                reserves {
                    address
                }
            }
            recipient {
                id
                commonName {
                    name
                }
                reserves {
                    address
                }
                verifiedAccounts {
                    accountType
                    handle
                }
            }
            sequence
            claimName
            amount
            denomination
            isLatest
            nonce
            claim {
                data
                fromSignature {
                    v
                    r
                    s
                }
            }
        }}`;

    const r = await axios.post('http://157.245.245.34:4000', { query }, {});
    return res.json(r.data.data.allPromises);
  } catch (e) {
    console.log(e);
    return res.json({ status: 'fail' });
  }
});

app.use('/identities', async (_req, res) => {
  try {
    const query = `query  { allIdMsgs {
            author {
                id
            }
            name {
              type
              ... on ReservesAddress {
                address
              }
              ... on CommonName {
                name
                id
              }
            }
          }
        }`;

    const r = await axios.post('http://157.245.245.34:4000', { query }, {});
    return res.json(r.data.data.allIdMsgs);
  } catch (e) {
    console.log(e);
    return res.json({ status: 'fail' });
  }
});
*/

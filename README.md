# cashless-express

run project on local with: 

1. `npm install`

2. `touch .env`

3. fill .env with FIREBASE_SECRET json var

4. `npm start`

ostensibly to run in production just add `HOST` env variable to the .env file

## environment variables

CASHLESS_NETWORK (mainnet or rinkeby)

HOST (endpoint of server)

PORT (port for serving react)

HTTPS (if set, will try to run ssl but will need proper certs)

## License

This project uses react-boilerplate from:

MIT License Copyright (c) 2019 Maximilian Stoiber. For more information see `LICENSE.md`.

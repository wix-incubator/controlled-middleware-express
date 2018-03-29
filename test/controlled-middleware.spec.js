import {expect} from 'chai';
import express, {Router} from 'express';
import {ControlledMiddleware} from '../src/controlled-middleware';

const rp = require('request-promise-native');
const env = {
  port: 5858
};

describe('Controlled Middleware Express', () => {
  let server;
  const app = express();
  const router = new Router();
  const driver = {
    _request: ({url, ...opts}) => rp({
      resolveWithFullResponse: true,
      simple: false,
      json: true,
      uri: `http://localhost:${env.port}${url}`,
      ...opts,
    }),
    get: url => driver._request({url, method: 'GET'}),
    post: (url, body) => driver._request({url, body, method: 'POST'}),
    createControlledMiddleware: responseText =>
      new ControlledMiddleware((req, res) => res.send(responseText)),
  };

  before(() => {
    server = app.use(router).listen(env.port);
  });

  after(() => {
    server.close();
  });

  describe('constructor()', () => {
    it('Should throw if passed argument is not a function', () => {
      expect(() => new ControlledMiddleware(1)).to.throw();
    });
  });

  describe('getHandler()', () => {
    it('Should return the handler function', () => {
      const aHandler = (req, res) => res.send();

      expect(new ControlledMiddleware(aHandler).getHandler())
        .to.be.equals(aHandler);
    });
  });

  describe('setHandler()', () => {
    it('Should replace the handler function', () => {
      const aHandler = (req, res) => res.send('first');
      const anotherHandler = (req, res) => res.send('second');
      const cm = new ControlledMiddleware(aHandler).activate();

      router.get('/replace-handler', cm.express());

      return driver.get('/replace-handler')
        .then(res => {
          expect(res.body).to.be.equals('first');
          cm.setHandler(anotherHandler);
        })
        .then(() =>
          driver.get('/replace-handler'))
        .then(res =>
          expect(res.body).to.be.equals('second'));
    });
  });

  describe('Activation Toggles', () => {
    it('Should be deactivated when created', () => {
      const cm = driver.createControlledMiddleware('something');

      router.get('/something', cm.express());

      return driver
        .get('/something')
        .then(res =>
          expect(res.statusCode).to.be.equals(404));
    });

    it('Should be activated when activate() is toggled', () => {
      const cm = driver.createControlledMiddleware('something-else');

      router.get('/something-else', cm.activate().express());

      return driver
        .get('/something-else')
        .then(res => {
          expect(res.body).to.be.equals('something-else');
          expect(res.statusCode).to.be.equals(200);
        });
    });

    it('Should be deactivated when deactivate() is toggled', () => {
      const cm = driver
        .createControlledMiddleware('something-to-deactivate')
        .activate();

      router.get('/something-to-deactivate', cm.express());

      return driver
        .get('/something-to-deactivate')
        .then(res => {
          expect(res.statusCode).to.be.equals(200);
          cm.deactivate();
        })
        .then(() =>
          driver.get('/something-to-deactivate')
        .then(res =>
          expect(res.statusCode).to.be.equals(404)));
    });
  });
});

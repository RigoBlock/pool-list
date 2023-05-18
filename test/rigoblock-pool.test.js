const packageJson = require('../package.json');
const schema = require('@uniswap/token-lists/src/tokenlist.schema.json');
const { expect } = require('chai');
const { getAddress } = require('@ethersproject/address');
const Ajv = require('ajv');
const buildList = require('../src/buildList');

const ajv = new Ajv({ allErrors: true, format: 'full' });
const validator = ajv.compile(schema);
let poolList;

before(async function () {
  this.timeout(120000);
  poolList = await buildList();
});

describe('buildList', () => {

  it('validates', () => {
    expect(validator(poolList)).to.equal(true);
  });

  it('contains no duplicate addresses', () => {
    const map = {};
    for (let token of poolList.tokens) {
      const key = `${token.chainId}-${token.address}`;
      expect(typeof map[key])
        .to.equal('undefined');
      map[key] = true;
    }
  });

  it('contains no duplicate symbols', () => {
    // manual override to approve certain tokens with duplicate symbols
    const approvedDuplicateSymbols = ["ust"];

    const map = {};
    for (let token of poolList.tokens) {
      let symbol = token.symbol.toLowerCase();
      if (approvedDuplicateSymbols.includes(symbol)) {
        continue;
      } else {
        const key = `${token.chainId}-${symbol}`;
        expect(typeof map[key])
          .to.equal('undefined', `duplicate symbol: ${symbol}`);
        map[key] = true;
      }
    }
  })

  it('contains no duplicate names', () => {
    const map = {};
    for (let token of poolList.tokens) {
      const key = `${token.chainId}-${token.name.toLowerCase()}`;
      expect(typeof map[key])
        .to.equal('undefined', `duplicate name: ${token.name}`);
      map[key] = true;
    }
  })

  it('all addresses are valid and checksummed', () => {
    for (let token of poolList.tokens) {
      expect(getAddress(token.address)).to.eq(token.address);
    }
  });

  it('version matches package.json', () => {
    expect(packageJson.version).to.match(/^\d+\.\d+\.\d+$/);
    expect(packageJson.version).to.equal(`${poolList.version.major}.${poolList.version.minor}.${poolList.version.patch}`);
  });
});
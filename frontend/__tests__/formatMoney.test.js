import formatMoney from '../lib/formatMoney';

describe('formatMoney function', () => {
  it('works with fractional pounds', () => {
    expect(formatMoney(1)).toEqual('£0.01');
    expect(formatMoney(10)).toEqual('£0.10');
    expect(formatMoney(9)).toEqual('£0.09');
    expect(formatMoney(40)).toEqual('£0.40');
  });

  it('leaves pences off for whole pounds', () => {
    expect(formatMoney(5000)).toEqual('£50');
    expect(formatMoney(100)).toEqual('£1');
    expect(formatMoney(500000)).toEqual('£5,000');
  });

  it('works with whole and fractional pounds', () => {
    expect(formatMoney(5019)).toEqual('£50.19');
    expect(formatMoney(101)).toEqual('£1.01');
    expect(formatMoney(110)).toEqual('£1.10');
    expect(formatMoney(76912548973852743110)).toEqual('£769,125,489,738,527,400.00');
  });
});
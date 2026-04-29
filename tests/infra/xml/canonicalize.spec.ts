import { describe, it } from 'node:test';
import assert from 'node:assert';
import { canonicalize } from '@nfe/infra/xml/canonicalize';

describe('canonicalize', () => {
  it('should remove XML declaration', () => {
    const xml = '<?xml version="1.0" encoding="UTF-8"?><root><child/></root>';
    const result = canonicalize(xml);
    assert.strictEqual(result, '<root><child/></root>');
  });

  it('should remove whitespace between tags', () => {
    const xml = '<root>  <child>  </child>  </root>';
    const result = canonicalize(xml);
    assert.strictEqual(result, '<root><child></child></root>');
  });

  it('should remove carriage returns', () => {
    const xml = '<root>\r\n<child/>\r\n</root>';
    const result = canonicalize(xml);
    assert.strictEqual(result, '<root><child/></root>');
  });

  it('should sort attributes alphabetically with xmlns first', () => {
    const xml = '<root versao="4.00" xmlns="http://example.com" Id="NFe123"><child/></root>';
    const result = canonicalize(xml);
    assert.strictEqual(
      result,
      '<root xmlns="http://example.com" Id="NFe123" versao="4.00"><child/></root>'
    );
  });

  it('should trim leading and trailing whitespace', () => {
    const xml = '  <root><child/></root>  ';
    const result = canonicalize(xml);
    assert.strictEqual(result, '<root><child/></root>');
  });

  it('should handle NFe infNFe element correctly', () => {
    const xml =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<NFe xmlns="http://www.portalfiscal.inf.br/nfe">' +
      '<infNFe versao="4.00" Id="NFe12345678901234567890123456789012345678901234">' +
      '<ide><cUF>51</cUF></ide>' +
      '</infNFe>' +
      '</NFe>';

    const result = canonicalize(xml);
    assert.ok(!result.includes('<?xml'));
    assert.ok(result.startsWith('<NFe'));
  });
});

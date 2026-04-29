import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NodeHttpSefazTransport } from '@nfe/infra/sefaz/NodeHttpSefazTransport';

describe('NodeHttpSefazTransport', () => {

  it('deve ser instanciavel com timeout padrao', () => {
    const transport = new NodeHttpSefazTransport();
    assert.ok(transport);
  });

  it('deve ser instanciavel com timeout customizado', () => {
    const transport = new NodeHttpSefazTransport({ timeout: 60000 });
    assert.ok(transport);
  });

  it('deve implementar interface SefazTransport', () => {
    const transport = new NodeHttpSefazTransport();
    assert.equal(typeof transport.send, 'function');
  });
});

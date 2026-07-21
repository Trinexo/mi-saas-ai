import net from 'node:net';
import tls from 'node:tls';
import { isAllowedLocalNetworkHost } from '../../src/utils/stripe-test-guards.js';

function extractHost(args) {
  const first = args[0];
  if (typeof first === 'object' && first !== null) return first.host ?? first.hostname;
  if (typeof first === 'string' && Number.isNaN(Number(first))) return first;
  return args[1];
}

export function installRemoteNetworkBlock() {
  const originalNetConnect = net.Socket.prototype.connect;
  const originalTlsConnect = tls.connect;
  const blockedHosts = [];

  net.Socket.prototype.connect = function patchedConnect(...args) {
    const host = extractHost(args);
    if (host && !isAllowedLocalNetworkHost(host)) {
      blockedHosts.push(String(host));
      throw new Error(`Remote network blocked in Stripe isolated test: ${host}`);
    }
    return originalNetConnect.apply(this, args);
  };

  tls.connect = function patchedTlsConnect(...args) {
    const host = extractHost(args);
    if (host && !isAllowedLocalNetworkHost(host)) {
      blockedHosts.push(String(host));
      throw new Error(`Remote TLS blocked in Stripe isolated test: ${host}`);
    }
    return originalTlsConnect.apply(this, args);
  };

  return {
    blockedHosts,
    restore() {
      net.Socket.prototype.connect = originalNetConnect;
      tls.connect = originalTlsConnect;
    },
  };
}

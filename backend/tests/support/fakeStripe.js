export function createFakeStripe({ session = {}, failCheckout = null, constructEvent = null } = {}) {
  const checkoutCalls = [];

  return {
    checkoutCalls,
    checkout: {
      sessions: {
        async create(params) {
          checkoutCalls.push(params);
          if (failCheckout) throw failCheckout;
          return {
            id: session.id ?? 'cs_test_fake_session',
            url: session.url ?? 'http://127.0.0.1:4173/fake-stripe-checkout',
            ...session,
          };
        },
      },
    },
    webhooks: {
      constructEvent(rawBody, signature, secret) {
        if (constructEvent) return constructEvent(rawBody, signature, secret);
        return JSON.parse(Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody));
      },
    },
  };
}

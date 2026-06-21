// Simulates a network round-trip so loading states behave like a real API.
// Swap this for fetchBaseQuery({ baseUrl: '/api' }) when a real backend exists.
export const fakeBaseQuery =
  (dataMap) =>
  async ({ url, data }) => {
    await new Promise((resolve) => setTimeout(resolve, 280 + Math.random() * 220))
    const resolver = dataMap[url]
    if (!resolver) {
      return { error: { status: 404, data: `No mock handler for ${url}` } }
    }
    try {
      const result = typeof resolver === 'function' ? resolver(data) : resolver
      return { data: result }
    } catch (err) {
      return { error: { status: 500, data: err.message } }
    }
  }

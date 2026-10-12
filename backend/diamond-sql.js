const DEFAULT_TIMEOUT_MS = 15000;

function connectProject(siteId, options = {}) {
  if (!siteId) throw new Error("A DBMS SITE_ID is required");
  if (!options.apiKey) throw new Error("A DBMS API_KEY is required");
  if (!options.dbmsUrl) throw new Error("A DBMS_URL is required");

  const baseUrl = options.dbmsUrl.replace(/\/$/, "");
  const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS);

  async function request(path, payload) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: payload ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Site-Id": siteId,
          "X-Api-Key": options.apiKey,
        },
        body: payload ? JSON.stringify({ siteId, ...payload }) : undefined,
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || `DBMS Gateway returned HTTP ${response.status}`);
      }
      return result;
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    async query(sql, params = []) {
      const result = await request("/api/query", { sql, params });
      return result.rows ?? result.data ?? result;
    },
    async execute(sql, params = []) {
      const result = await request("/api/execute", { sql, params });
      return result.result ?? result;
    },
    async status() {
      return request("/api/status");
    },
  };
}

module.exports = { connectProject };

/*
  A fetch wrapper with the conveniences people add Axios for: JSON in and out,
  a timeout, and an error thrown for 4xx/5xx responses (plain fetch does not throw).

    const users = await VWA.http.get("https://jsonplaceholder.typicode.com/users");
    const created = await VWA.http.post("/api/notes", { title: "Hello" });

    try {
      await VWA.http.get(url, { timeout: 5000 });
    } catch (error) {
      error.status; // 404, 500... (undefined for network errors and timeouts)
      error.data;   // the parsed error body, when the server sent one
    }

  Note: browsers block fetch() of local files when the page is opened from disk
  (file://). Use a public API, or serve the folder (VS Code Live Server,
  `python -m http.server`).
*/
(function () {
  "use strict";

  const VWA = (window.VWA = window.VWA || {});

  // Bodies fetch() sends as they are; anything else (objects, arrays) is sent as JSON
  const isRawBody = (body) =>
    typeof body === "string" ||
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer;

  async function request(url, { method = "GET", body, headers = {}, timeout = 10000, signal, ...rest } = {}) {
    // Your own signal (for example from an AbortController) and the timeout both apply
    const timeoutSignal = AbortSignal.timeout(timeout);
    const options = {
      method,
      headers: { Accept: "application/json", ...headers },
      signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal,
      ...rest,
    };

    if (isRawBody(body)) {
      options.body = body;
    } else if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const isJSON = (response.headers.get("content-type") || "").includes("application/json");
    const data = response.status === 204 ? null : isJSON ? await response.json() : await response.text();

    if (!response.ok) {
      const error = new Error(`${method} ${url} failed with ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  VWA.http = request;
  VWA.http.get = (url, options) => request(url, { ...options, method: "GET" });
  VWA.http.post = (url, body, options) => request(url, { ...options, method: "POST", body });
  VWA.http.put = (url, body, options) => request(url, { ...options, method: "PUT", body });
  VWA.http.patch = (url, body, options) => request(url, { ...options, method: "PATCH", body });
  VWA.http.delete = (url, options) => request(url, { ...options, method: "DELETE" });
})();

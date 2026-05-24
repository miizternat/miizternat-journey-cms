const API_BASE = `${window.location.origin}/api`;

async function fetchAPI(endpoint) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    credentials: "include",
  });

  return await response.json();
}

async function putAPI(endpoint, body) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  return await response.json();
}

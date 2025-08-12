const API_BASE_URL = import.meta.env.VITE_API_URL;

export async function sendREST(path, json = null, method = "GET") {
  const url = `${API_BASE_URL}${path}`;
  const options = { 
    method,
    credentials: "include",
    headers: {}
  };

  const token = localStorage.getItem("token");
  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  if (json) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(json);
  }

  try {
    let response = await fetch(url, options);

    if (response.status === 401) {
      // Access token expired, attempt refresh
      const refreshed = await refreshToken();
      if (refreshed) {
        // Retry original request with new token
        options.headers["Authorization"] = `Bearer ${refreshed}`;
        response = await fetch(url, options);
      } else {
        throw new Error("Unauthorized and refresh failed");
      }
    }

    // In error case send text
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API ${method} ${path} failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    // Return parsed JSON if response has content
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    } else {
      return await response.text();
    }

  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
}

async function refreshToken() {
  try {
    const response = await fetch(`${API_BASE_URL}/refresh`, {
      method: "POST",
      credentials: "include"
    });

    if (!response.ok) {
      console.error("Refresh token invalid or expired");
      localStorage.removeItem("token");
      return null;
    }

    const data = await response.json();
    localStorage.setItem("token", data.access_token);
    return data.access_token;
  } catch (error) {
    console.error("Refresh token error:", error);
    return null;
  }
}


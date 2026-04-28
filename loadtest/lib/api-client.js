import http from 'k6/http';

export class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  // Helper for requests with auth
  authHeaders(token) {
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // --- Auth Endpoints ---
  register(email, password, firstName, lastName) {
    const payload = JSON.stringify({ email, password, firstName, lastName });
    return http.post(`${this.baseUrl}/auth/register`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  login(email, password) {
    const payload = JSON.stringify({ email, password });
    return http.post(`${this.baseUrl}/auth/login`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // --- User Endpoints ---
  getMe(token) {
    return http.get(`${this.baseUrl}/users/me`, this.authHeaders(token));
  }

  getUserProfile(token, userId) {
    return http.get(`${this.baseUrl}/users/${userId}`, this.authHeaders(token));
  }

  searchUsers(token, query) {
    return http.get(`${this.baseUrl}/users/search?query=${query}`, this.authHeaders(token));
  }

  // --- Post Endpoints ---
  getPosts(token) {
    return http.get(`${this.baseUrl}/posts`, this.authHeaders(token));
  }

  createPost(token, content) {
    const payload = JSON.stringify({ content });
    return http.post(`${this.baseUrl}/posts`, payload, this.authHeaders(token));
  }

  likePost(token, postId) {
    return http.post(`${this.baseUrl}/posts/${postId}/like`, null, this.authHeaders(token));
  }

  // --- Message Endpoints ---
  getConversations(token) {
    return http.get(`${this.baseUrl}/message/conversations`, this.authHeaders(token));
  }

  sendMessage(token, recipientId, content) {
    const payload = JSON.stringify({ recipientId, content });
    return http.post(`${this.baseUrl}/message`, payload, this.authHeaders(token));
  }
}

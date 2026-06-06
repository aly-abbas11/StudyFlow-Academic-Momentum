// Academic Momentum Client API Wrapper (With Auth Token Injection)
const API = {
  // Helper to fetch session token
  getToken() {
    return localStorage.getItem('sessionToken');
  },

  // Helper to construct headers with auth
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  /* ==========================================================================
     AUTH APIS
     ========================================================================== */
  async login(emailOrUsername, password) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }
      // Save session credentials
      localStorage.setItem('sessionToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async register(username, email, password) {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getHeaders()
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API success
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
    }
  },

  async getMe() {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!response.ok) {
        throw new Error('Unauthorized');
      }
      return await response.json();
    } catch (error) {
      // Clear invalid session
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('user');
      return null;
    }
  },

  /* ==========================================================================
     TASK APIS
     ========================================================================== */
  async getTasks() {
    try {
      const response = await fetch('/api/tasks', {
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return await response.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  async createTask(taskData) {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(taskData)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create task');
      }
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async updateTask(id, updates) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update task');
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async deleteTask(id) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete task');
      return data;
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  async getStats() {
    try {
      const response = await fetch('/api/stats', {
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch (error) {
      console.error(error);
      return null;
    }
  }
};

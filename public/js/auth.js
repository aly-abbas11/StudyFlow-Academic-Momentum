// Auth client-side script
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const passwordToggle = document.getElementById('password-toggle');
  const toastContainer = document.getElementById('toast-container');

  // Handle password visibility toggle
  if (passwordToggle) {
    passwordToggle.addEventListener('click', () => {
      const passwordInput = document.getElementById('login-password') || document.getElementById('reg-password');
      const eyeIcon = document.getElementById('eye-icon');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        // Open eye SVG path
        eyeIcon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        `;
      } else {
        passwordInput.type = 'password';
        // Closed eye SVG path
        eyeIcon.innerHTML = `
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
        `;
      }
    });
  }

  // Handle Login submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailOrUsername = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;

      if (!emailOrUsername || !password) {
        showToast('Please fill in all fields.', 'danger');
        return;
      }

      try {
        const response = await API.login(emailOrUsername, password);
        showToast(`Welcome back, ${response.user.username}! Redirecting...`, 'success');
        
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 1200);
      } catch (error) {
        showToast(error.message || 'Login failed. Please try again.', 'danger');
      }
    });
  }

  // Handle Register submission
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('reg-username').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const termsAgree = document.getElementById('terms-agree').checked;

      if (!username || !email || !password) {
        showToast('Please fill in all fields.', 'danger');
        return;
      }

      if (username.length < 3) {
        showToast('Username must be at least 3 characters.', 'danger');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters.', 'danger');
        return;
      }

      if (!termsAgree) {
        showToast('You must agree to the terms.', 'danger');
        return;
      }

      try {
        const response = await API.register(username, email, password);
        showToast(response.message || 'Registration successful! Redirecting to login...', 'success');
        
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1500);
      } catch (error) {
        showToast(error.message || 'Registration failed. Please try again.', 'danger');
      }
    });
  }

  // Helper: Toast Notifications
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '🔔';
    if (type === 'success') icon = '✅';
    if (type === 'info') icon = 'ℹ️';
    if (type === 'danger') icon = '⚠️';

    toast.innerHTML = `
      <span>${icon}</span>
      <div>${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animation triggers
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Auto remove
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }
});

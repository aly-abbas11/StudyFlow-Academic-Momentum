const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');
const USERS_FILE = path.join(__dirname, 'data', 'users.json');

// In-memory session store (Session token -> User profile)
const sessions = {};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helpers for reading/writing task data
function readTasks() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading tasks file:', error);
    return [];
  }
}

function writeTasks(tasks) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing tasks file:', error);
    return false;
  }
}

// Helpers for reading/writing user data
function readUsers() {
  try {
    if (!fs.existsSync(USERS_FILE)) {
      fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
      fs.writeFileSync(USERS_FILE, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

function writeUsers(users) {
  try {
    fs.mkdirSync(path.dirname(USERS_FILE), { recursive: true });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing users file:', error);
    return false;
  }
}

// Secure password hash helper
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Middleware: Authenticate Session Token
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
  const token = authHeader.split(' ')[1];
  const session = sessions[token];
  if (!session) {
    return res.status(401).json({ error: 'Session expired. Please log in again.' });
  }
  req.user = session; // Contains { userId, username, email }
  next();
}

/* ==========================================================================
   AUTHENTICATION API
   ========================================================================== */

// API: Register User
app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All registration fields are required.' });
  }

  const users = readUsers();
  const emailLower = email.toLowerCase().trim();
  const usernameClean = username.trim();

  // Check unique constraints
  const emailExists = users.some(u => u.email.toLowerCase() === emailLower);
  const usernameExists = users.some(u => u.username.toLowerCase() === usernameClean.toLowerCase());

  if (emailExists) {
    return res.status(400).json({ error: 'Email is already registered.' });
  }
  if (usernameExists) {
    return res.status(400).json({ error: 'Username is already taken.' });
  }

  const userId = Date.now().toString();
  const newUser = {
    id: userId,
    username: usernameClean,
    email: emailLower,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  
  if (writeUsers(users)) {
    // Seed new user with introductory tasks
    const tasks = readTasks();
    const seedTasks = [
      {
        id: (Date.now() + 1).toString(),
        userId: userId,
        title: 'Explore Academic Momentum Dashboard',
        subject: 'General',
        priority: 'Academic',
        dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16), // Tomorrow
        estimatedHours: 1.0,
        completed: false,
        createdAt: new Date().toISOString()
      },
      {
        id: (Date.now() + 2).toString(),
        userId: userId,
        title: 'Create My First Study Task',
        subject: 'General',
        priority: 'Critical',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16), // Day after
        estimatedHours: 0.5,
        completed: false,
        createdAt: new Date().toISOString()
      }
    ];
    tasks.push(...seedTasks);
    writeTasks(tasks);

    res.status(201).json({ message: 'User registered successfully. Proceed to login.' });
  } else {
    res.status(500).json({ error: 'Failed to save account credentials.' });
  }
});

// API: Login User
app.post('/api/auth/login', (req, res) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ error: 'Email/Username and Password are required.' });
  }

  const users = readUsers();
  const searchKey = emailOrUsername.trim().toLowerCase();
  
  const user = users.find(u => 
    u.email.toLowerCase() === searchKey || 
    u.username.toLowerCase() === searchKey
  );

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Invalid email, username, or password.' });
  }

  // Generate random session token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Store session in server memory
  sessions[token] = {
    userId: user.id,
    username: user.username,
    email: user.email
  };

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    }
  });
});

// API: Logout
app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    delete sessions[token];
  }
  res.json({ message: 'Logged out successfully.' });
});

// API: Get current user profile (fetches fresh data from users DB)
app.get('/api/auth/me', authenticate, (req, res) => {
  const users = readUsers();
  const user = users.find(u => u.id === req.user.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found.' });
  }
  // Exclude password hash before returning
  const { passwordHash, ...profile } = user;
  res.json(profile);
});

// API: Update user profile and weekly goals
app.post('/api/auth/profile', authenticate, (req, res) => {
  const { username, weeklyGoal, focusSubject } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Name is required.' });
  }

  const users = readUsers();
  const userIndex = users.findIndex(u => u.id === req.user.userId);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  // Check unique constraints for username if it's changing
  const newUsername = username.trim();
  if (newUsername.toLowerCase() !== users[userIndex].username.toLowerCase()) {
    const nameExists = users.some(u => u.username.toLowerCase() === newUsername.toLowerCase());
    if (nameExists) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }
  }

  // Update properties
  users[userIndex].username = newUsername;
  users[userIndex].weeklyGoal = parseInt(weeklyGoal) || 40;
  users[userIndex].focusSubject = focusSubject || 'General';
  users[userIndex].streak = users[userIndex].streak || 5; // maintain a default streak if not set

  if (writeUsers(users)) {
    // Update active session metadata
    sessions[req.headers['authorization'].split(' ')[1]] = {
      userId: users[userIndex].id,
      username: users[userIndex].username,
      email: users[userIndex].email
    };
    
    const { passwordHash, ...profile } = users[userIndex];
    res.json(profile);
  } else {
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

/* ==========================================================================
   TASKS API (SCOPED BY LOGGED IN USER)
   ========================================================================== */

// API: Get tasks for authenticated user
app.get('/api/tasks', authenticate, (req, res) => {
  const tasks = readTasks();
  const userTasks = tasks.filter(t => t.userId === req.user.userId);
  res.json(userTasks);
});

// API: Create a task for authenticated user
app.post('/api/tasks', authenticate, (req, res) => {
  const { title, subject, priority, dueDate, estimatedHours } = req.body;

  if (!title || !subject || !priority || !dueDate || estimatedHours === undefined) {
    return res.status(400).json({ error: 'Missing required task fields.' });
  }

  const tasks = readTasks();
  const newTask = {
    id: Date.now().toString(),
    userId: req.user.userId,
    title: title.trim(),
    subject: subject.trim(),
    priority: priority.trim(),
    dueDate,
    estimatedHours: parseFloat(estimatedHours) || 0,
    completed: false,
    createdAt: new Date().toISOString()
  };

  tasks.push(newTask);
  if (writeTasks(tasks)) {
    res.status(201).json(newTask);
  } else {
    res.status(500).json({ error: 'Failed to save task.' });
  }
});

// API: Update a task (must belong to authenticated user)
app.put('/api/tasks/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const tasks = readTasks();
  const taskIndex = tasks.findIndex(t => t.id === id && t.userId === req.user.userId);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found or access denied.' });
  }

  const updatedTask = {
    ...tasks[taskIndex],
    ...updates,
    id: tasks[taskIndex].id, // Prevent ID hijacking
    userId: req.user.userId  // Prevent owner hijacking
  };

  tasks[taskIndex] = updatedTask;

  if (writeTasks(tasks)) {
    res.json(updatedTask);
  } else {
    res.status(500).json({ error: 'Failed to update task.' });
  }
});

// API: Delete a task (must belong to authenticated user)
app.delete('/api/tasks/:id', authenticate, (req, res) => {
  const { id } = req.params;
  let tasks = readTasks();
  
  const initialLength = tasks.length;
  tasks = tasks.filter(t => !(t.id === id && t.userId === req.user.userId));

  if (tasks.length === initialLength) {
    return res.status(404).json({ error: 'Task not found or access denied.' });
  }

  if (writeTasks(tasks)) {
    res.json({ message: 'Task deleted successfully.', id });
  } else {
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

// API: Get analytics stats for authenticated user
app.get('/api/stats', authenticate, (req, res) => {
  const tasks = readTasks().filter(t => t.userId === req.user.userId);
  
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Study hours
  const totalHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const completedHours = tasks.filter(t => t.completed).reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
  const pendingHours = totalHours - completedHours;

  // Breakdown by priority
  const priorityBreakdown = {
    Critical: 0,
    Academic: 0,
    Low: 0
  };
  tasks.forEach(t => {
    if (priorityBreakdown[t.priority] !== undefined) {
      priorityBreakdown[t.priority]++;
    } else {
      priorityBreakdown[t.priority] = (priorityBreakdown[t.priority] || 0) + 1;
    }
  });

  // Breakdown by subject
  const subjectBreakdown = {};
  tasks.forEach(t => {
    subjectBreakdown[t.subject] = (subjectBreakdown[t.subject] || 0) + 1;
  });

  // Productivity Score Calculation
  let productivityScore = 0;
  if (total > 0) {
    const baseScore = (completed / total) * 70;
    const criticalTasks = tasks.filter(t => t.priority === 'Critical');
    const completedCritical = criticalTasks.filter(t => t.completed).length;
    const criticalBonus = criticalTasks.length > 0 ? (completedCritical / criticalTasks.length) * 30 : 30;
    productivityScore = Math.round(baseScore + criticalBonus);
  }

  res.json({
    total,
    completed,
    pending,
    completionRate,
    totalHours: Number(totalHours.toFixed(1)),
    completedHours: Number(completedHours.toFixed(1)),
    pendingHours: Number(pendingHours.toFixed(1)),
    priorityBreakdown,
    subjectBreakdown,
    productivityScore: productivityScore || 85 // default to 85 if no tasks
  });
});

// API: Reset all user tasks and re-seed defaults
app.post('/api/tasks/reset', authenticate, (req, res) => {
  const userId = req.user.userId;
  let tasks = readTasks();
  
  // Remove existing tasks for this user
  tasks = tasks.filter(t => t.userId !== userId);
  
  // Re-seed standard tasks
  const seedTasks = [
    {
      id: (Date.now() + 1).toString(),
      userId: userId,
      title: 'Advanced Calculus Final Prep',
      subject: 'Mathematics',
      priority: 'Critical',
      dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16), // Tomorrow
      estimatedHours: 2.5,
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: (Date.now() + 2).toString(),
      userId: userId,
      title: 'Lab Report: Chemistry',
      subject: 'Chemistry',
      priority: 'Academic',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16), // 3 days later
      estimatedHours: 1.5,
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: (Date.now() + 3).toString(),
      userId: userId,
      title: 'World Literature Essay',
      subject: 'Literature',
      priority: 'Academic',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 16), // 5 days later
      estimatedHours: 3.0,
      completed: false,
      createdAt: new Date().toISOString()
    },
    {
      id: (Date.now() + 4).toString(),
      userId: userId,
      title: 'Organize Research Papers',
      subject: 'Computer Science',
      priority: 'Low',
      dueDate: new Date(Date.now() + 86400000 * 6).toISOString().slice(0, 16), // 6 days later
      estimatedHours: 1.0,
      completed: false,
      createdAt: new Date().toISOString()
    }
  ];

  tasks.push(...seedTasks);
  
  if (writeTasks(tasks)) {
    res.json({ message: 'Study planner workspace reset and seeded successfully.' });
  } else {
    res.status(500).json({ error: 'Failed to reset study planner tasks.' });
  }
});

// Wildcard route to serve landing page as default
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Restart listener
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

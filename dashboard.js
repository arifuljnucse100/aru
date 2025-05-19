// ===== User Welcome & Clock =====
document.getElementById("userName").innerText =
  localStorage.getItem("loggedInUser") || "User";

function updateClock() {
  const clock = document.getElementById("digitalClock");
  const now = new Date();
  clock.innerText = now.toLocaleTimeString();
}
setInterval(updateClock, 1000);
updateClock();

// ===== Tasks =====
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let editingIndex = null;

function renderTasks() {
  const taskList = document.getElementById("taskList");
  taskList.innerHTML = "";

  const filterPriority = document.getElementById("filterPriority")?.value || "";
  const filterStatus = document.getElementById("filterStatus")?.value || "";
  const filterCategory = document.getElementById("filterCategory")?.value || "";

  let filteredTasks = [...tasks];

  if (filterPriority) filteredTasks = filteredTasks.filter(t => t.priority === filterPriority);
  if (filterStatus)
    filteredTasks = filteredTasks.filter(t =>
      filterStatus === "completed" ? t.completed : !t.completed
    );
  if (filterCategory) filteredTasks = filteredTasks.filter(t => t.category === filterCategory);

  if (filteredTasks.length === 0) {
    taskList.innerHTML = "<li>No tasks found 🎉</li>";
    return;
  }

  filteredTasks.forEach((task, index) => {
    const elapsed = task.isRunning
      ? Math.floor((Date.now() - task.startTime + task.elapsedTime) / 1000)
      : Math.floor(task.elapsedTime / 1000);

    const li = document.createElement("li");
    li.className = "task-item";
    li.innerHTML = `
      <strong>${task.title}</strong> (${task.priority}, ${task.category})<br/>
      <span>Time: ${elapsed}s</span> | Due: ${task.dueDate} ${task.dueTime}
      <div class="controls">
        <button onclick="toggleTask(${index})">${task.isRunning ? "Pause" : "Start"}</button>
        <button onclick="completeTask(${index})">Complete</button>
        <button onclick="deleteTask(${index})">Delete</button>
        <button onclick="editTask(${index})">Edit</button>
      </div>
    `;
    taskList.appendChild(li);
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
  updateChart();
  updateCategoryChart();
}

document.getElementById("taskForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const title = document.getElementById("taskTitle").value;
  const priority = document.getElementById("taskPriority").value;
  const category = document.getElementById("taskCategory").value;
  const dueDate = document.getElementById("taskDate").value;
  const dueTime = document.getElementById("taskTime").value;

  tasks.push({
    title,
    priority,
    category,
    dueDate,
    dueTime,
    isRunning: false,
    startTime: null,
    elapsedTime: 0,
    completed: false,
    notified: false
  });

  this.reset();
  renderTasks();
  renderUpcomingTasks();
  renderDailyReport();
});

function toggleTask(index) {
  const task = tasks[index];
  if (task.isRunning) {
    task.elapsedTime += Date.now() - task.startTime;
    task.isRunning = false;
  } else {
    task.startTime = Date.now();
    task.isRunning = true;
  }
  renderTasks();
}

function completeTask(index) {
  tasks[index].isRunning = false;
  tasks[index].completed = true;
  tasks[index].notified = true;
  recordDailyProgress();
  renderTasks();
  renderUpcomingTasks();
  renderDailyReport();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  renderTasks();
}

// ===== Edit Task =====
function editTask(index) {
  const task = tasks[index];
  editingIndex = index;

  document.getElementById("editTitle").value = task.title;
  document.getElementById("editPriority").value = task.priority;
  document.getElementById("editDate").value = task.dueDate;
  document.getElementById("editModal").style.display = "flex";
}

function closeEditModal() {
  document.getElementById("editModal").style.display = "none";
}

document.getElementById("editTaskForm").addEventListener("submit", function (e) {
  e.preventDefault();

  tasks[editingIndex].title = document.getElementById("editTitle").value;
  tasks[editingIndex].priority = document.getElementById("editPriority").value;
  tasks[editingIndex].dueDate = document.getElementById("editDate").value;

  localStorage.setItem("tasks", JSON.stringify(tasks));
  closeEditModal();
  renderTasks();
  renderUpcomingTasks();
  renderDailyReport();
});

// ===== Charts =====
let chartInstance = null;
function updateChart() {
  const completed = tasks.filter(t => t.completed).length;
  const running = tasks.filter(t => t.isRunning && !t.completed).length;
  const paused = tasks.filter(t => !t.isRunning && !t.completed).length;

  const ctx = document.getElementById('taskChart').getContext('2d');
  const data = {
    labels: ['Completed', 'Running', 'Paused'],
    datasets: [{
      data: [completed, running, paused],
      backgroundColor: ['#28a745', '#007bff', '#ffc107']
    }]
  };

  if (chartInstance) {
    chartInstance.data = data;
    chartInstance.update();
  } else {
    chartInstance = new Chart(ctx, { type: 'pie', data });
  }
}

let progressChartInstance = null;
function recordDailyProgress() {
  const today = new Date().toISOString().split('T')[0];
  let dailyProgress = JSON.parse(localStorage.getItem("dailyProgress")) || {};
  dailyProgress[today] = (dailyProgress[today] || 0) + 1;
  localStorage.setItem("dailyProgress", JSON.stringify(dailyProgress));
  updateProgressChart();
  calculateUserStatus();
}

function updateProgressChart() {
  let dailyProgress = JSON.parse(localStorage.getItem("dailyProgress")) || {};
  const labels = Object.keys(dailyProgress).slice(-7);
  const values = labels.map(d => dailyProgress[d]);

  const ctx = document.getElementById('progressChart').getContext('2d');

  if (progressChartInstance) {
    progressChartInstance.data.labels = labels;
    progressChartInstance.data.datasets[0].data = values;
    progressChartInstance.update();
  } else {
    progressChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Tasks Completed', data: values, backgroundColor: '#007bff' }]
      }
    });
  }
}

function calculateUserStatus() {
  const today = new Date().toISOString().split('T')[0];
  const dailyProgress = JSON.parse(localStorage.getItem("dailyProgress")) || {};
  const todayCount = dailyProgress[today] || 0;

  const statusText = document.getElementById("userStatus");
  if (todayCount === 0) {
    statusText.innerText = "🐌 Lazy";
    statusText.style.color = "#dc3545";
  } else if (todayCount <= 4) {
    statusText.innerText = "😊 Active";
    statusText.style.color = "#ffc107";
  } else {
    statusText.innerText = "💪 Hardworking";
    statusText.style.color = "#28a745";
  }
}

let categoryChartInstance = null;
function updateCategoryChart() {
  const ctx = document.getElementById("categoryChart").getContext("2d");
  const categoryCount = { Work: 0, Personal: 0, Study: 0, Other: 0 };
  tasks.forEach(t => categoryCount[t.category]++);

  const labels = Object.keys(categoryCount);
  const values = Object.values(categoryCount);
  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: ['#007bff', '#ffc107', '#28a745', '#6c757d']
    }]
  };

  if (categoryChartInstance) {
    categoryChartInstance.data = data;
    categoryChartInstance.update();
  } else {
    categoryChartInstance = new Chart(ctx, { type: 'pie', data });
  }
}

// ===== Daily Sections =====
function renderUpcomingTasks() {
  const list = document.getElementById("upcomingTasksList");
  list.innerHTML = "";
  const today = new Date().toISOString().split('T')[0];

  const upcoming = tasks.filter(task => task.dueDate > today);
  if (upcoming.length === 0) {
    list.innerHTML = "<li>No upcoming tasks 🎉</li>";
    return;
  }

  upcoming.forEach(task => {
    const li = document.createElement("li");
    li.innerText = `${task.title} — Due: ${task.dueDate} (${task.priority})`;
    list.appendChild(li);
  });
}

function renderDailyReport() {
  const report = document.getElementById("dailyReport");
  const today = new Date().toISOString().split('T')[0];

  const todaysTasks = tasks.filter(t => t.dueDate === today);
  const completed = todaysTasks.filter(t => t.completed).length;
  const pending = todaysTasks.filter(t => !t.completed).length;

  let html = `
    <p>Total Tasks: ${todaysTasks.length}</p>
    <p>✅ Completed: ${completed}</p>
    <p>⌛ Pending: ${pending}</p>
  `;

  if (todaysTasks.length > 0) {
    html += "<ul>";
    todaysTasks.forEach(t => {
      html += `<li>${t.title} — ${t.completed ? "✅" : "⌛"}</li>`;
    });
    html += "</ul>";
  } else {
    html += "<p>No tasks today 💤</p>";
  }

  report.innerHTML = html;
}

// ===== Reminder with Sound =====
function checkReminders() {
  const now = new Date();
  const nowDate = now.toISOString().split("T")[0];
  const nowTime = now.toTimeString().slice(0, 5);

  tasks.forEach((task, index) => {
    if (
      task.dueDate === nowDate &&
      task.dueTime === nowTime &&
      !task.completed &&
      !task.notified
    ) {
      alert(`🔔 Reminder: ${task.title} is due now!`);
      playReminderSound();
      tasks[index].notified = true;
      localStorage.setItem("tasks", JSON.stringify(tasks));
    }
  });
}

function playReminderSound() {
  const audio = new Audio("https://www.soundjay.com/buttons/sounds/beep-07.mp3");
  audio.play();
}

// ===== Event Listeners =====
document.getElementById("filterPriority").addEventListener("change", renderTasks);
document.getElementById("filterStatus").addEventListener("change", renderTasks);
document.getElementById("filterCategory").addEventListener("change", renderTasks);

// ===== INIT =====
renderTasks();
updateChart();
updateProgressChart();
calculateUserStatus();
renderUpcomingTasks();
renderDailyReport();
updateCategoryChart();
setInterval(checkReminders, 60000);
checkReminders();

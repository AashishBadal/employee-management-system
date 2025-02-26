// script.js
let users = JSON.parse(localStorage.getItem('users')) || {
    'manager': { password: 'manager123', role: 'manager', name: 'System Manager', email: 'manager@nexus.com', empRole: 'manager', status: 'online' }
};
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let categories = JSON.parse(localStorage.getItem('categories')) || ['development', 'design', 'testing'];
let currentUser = null;

function saveData() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('categories', JSON.stringify(categories));
}

function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (users[username] && users[username].password === password) {
        currentUser = username;
        users[username].status = 'online';
        document.getElementById('loginContainer').style.display = 'none';
        users[username].role === 'manager' ? showManagerView() : showEmployeeView();
        saveData();
    } else {
        alert('Invalid credentials');
    }
}

function logout() {
    if (currentUser) users[currentUser].status = 'offline';
    currentUser = null;
    document.getElementById('managerView').style.display = 'none';
    document.getElementById('employeeView').style.display = 'none';
    document.getElementById('loginContainer').style.display = 'flex';
    saveData();
}

function togglePassword(id) {
    const passwordInput = document.getElementById(id);
    const toggleIcon = passwordInput.nextElementSibling;
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.textContent = 'visibility_off';
    } else {
        passwordInput.type = 'password';
        toggleIcon.textContent = 'visibility';
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}

function createEmployee() {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;
    const name = document.getElementById('empName').value;
    const email = document.getElementById('empEmail').value;
    const empRole = document.getElementById('empRole').value;

    if (!users[username]) {
        users[username] = { 
            password, 
            role: 'employee', 
            name, 
            email, 
            empRole, 
            performance: { completed: 0, total: 0 }, 
            status: 'offline' 
        };
        updateEmployeeSelect();
        saveData();
        updateTeamOverview();
        alert('Team member added successfully');
    } else {
        alert('Username already exists');
    }
}

function assignTask() {
    const employee = document.getElementById('employeeSelect').value;
    const description = document.getElementById('taskDesc').value;
    const deadline = document.getElementById('taskDeadline').value;
    const priority = document.getElementById('taskPriority').value;
    const category = document.getElementById('taskCategory').value;

    tasks.push({
        id: Date.now(),
        employee,
        description,
        deadline,
        priority,
        category,
        completed: false,
        assignedDate: new Date().toISOString().split('T')[0],
        comments: [],
        progress: 0
    });

    users[employee].performance.total++;
    saveData();
    updateViews();
    updateTeamOverview();
}

function addCategory() {
    const newCategory = document.getElementById('newCategory').value.trim().toLowerCase();
    if (newCategory && !categories.includes(newCategory)) {
        categories.push(newCategory);
        saveData();
        updateCategorySelects();
        document.getElementById('newCategory').value = '';
    }
}

function removeCategory(category) {
    categories = categories.filter(c => c !== category);
    tasks = tasks.map(t => t.category === category ? { ...t, category: 'uncategorized' } : t);
    saveData();
    updateCategorySelects();
}

function updateEmployeeSelect() {
    const select = document.getElementById('employeeSelect');
    select.innerHTML = '<option value="">Select Team Member</option>';
    Object.keys(users)
        .filter(u => users[u].role === 'employee')
        .forEach(username => {
            const option = document.createElement('option');
            option.value = username;
            option.textContent = `${users[username].name} (${users[username].empRole})`;
            select.appendChild(option);
        });
}

function updateCategorySelects() {
    const selects = [document.getElementById('taskCategory'), document.getElementById('filterCategory')];
    selects.forEach(select => {
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '<option value="all">All Categories</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                select.appendChild(option);
            });
            select.value = currentValue && categories.includes(currentValue) ? currentValue : 'all';
        }
    });
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';
    categories.forEach(category => {
        const li = document.createElement('li');
        li.innerHTML = `${category.charAt(0).toUpperCase() + category.slice(1)} 
            <button onclick="removeCategory('${category}')" class="btn-danger" style="padding: 5px 10px;">Remove</button>`;
        categoryList.appendChild(li);
    });
}

function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(section => section.style.display = 'none');
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(sectionId).style.display = 'block';
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');
    updateViews();
    if (sectionId === 'team') updateTeamOverview();
}

function showManagerView() {
    document.getElementById('managerView').style.display = 'flex';
    updateEmployeeSelect();
    updateCategorySelects();
    showSection('team');
}

function showEmployeeView() {
    document.getElementById('employeeView').style.display = 'block';
    document.getElementById('employeeName').textContent = users[currentUser].name;
    updateCategorySelects();
    updateViews();
}

function showProfile() {
    const profileView = document.getElementById('profileView');
    profileView.style.display = 'block';
    profileView.innerHTML = `
        <h3>Your Performance</h3>
        <p>Name: ${users[currentUser].name}</p>
        <p>Email: ${users[currentUser].email}</p>
        <p>Role: ${users[currentUser].empRole}</p>
        <p>Tasks Completed: ${users[currentUser].performance.completed}</p>
        <p>Total Tasks: ${users[currentUser].performance.total}</p>
        <p>Completion Rate: ${users[currentUser].performance.total > 0 ? 
            Math.round((users[currentUser].performance.completed / users[currentUser].performance.total) * 100) : 0}%</p>
        <button onclick="document.getElementById('profileView').style.display='none'" class="btn-primary">Close</button>
    `;
}

function updateViews() {
    updateManagerTasks();
    updateEmployeeTasks();
    updateAnalytics();
}

function filterTasks(tasksToFilter, isManager) {
    let filtered = [...tasksToFilter];
    const statusFilter = isManager ? document.getElementById('filterStatus').value : document.getElementById('empFilterStatus').value;
    const priorityFilter = isManager ? document.getElementById('filterPriority').value : 'all';
    const categoryFilter = isManager ? document.getElementById('filterCategory').value : 'all';
    const searchQuery = (isManager ? document.getElementById('taskSearch') : document.getElementById('empTaskSearch'))?.value.toLowerCase() || '';

    if (statusFilter !== 'all') {
        filtered = filtered.filter(t => (statusFilter === 'completed') === t.completed);
    }
    if (priorityFilter !== 'all') {
        filtered = filtered.filter(t => t.priority === priorityFilter);
    }
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }
    if (searchQuery) {
        filtered = filtered.filter(t => t.description.toLowerCase().includes(searchQuery));
    }
    return filtered;
}

function updateManagerTasks() {
    const managerTaskList = document.getElementById('managerTaskList');
    managerTaskList.innerHTML = '';
    const filteredTasks = filterTasks(tasks, true);
    filteredTasks.forEach((task, index) => {
        managerTaskList.appendChild(createTaskCard(task, index, true));
    });
}

function updateEmployeeTasks() {
    const employeeTaskList = document.getElementById('employeeTaskList');
    employeeTaskList.innerHTML = '';
    const filteredTasks = filterTasks(tasks.filter(t => t.employee === currentUser), false);
    filteredTasks.forEach((task, index) => {
        employeeTaskList.appendChild(createTaskCard(task, index, false));
    });
}

function createTaskCard(task, index, isManager) {
    const isOverdue = !task.completed && new Date(task.deadline) < new Date();
    const card = document.createElement('div');
    card.className = `task-card ${task.priority} ${task.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`;
    card.innerHTML = `
        <h4>${task.description}</h4>
        <p><strong>${users[task.employee].name}</strong> (${task.category})</p>
        <small>Due: ${task.deadline} | Progress: ${task.progress}%</small>
        <div class="comments" id="comments-${task.id}"></div>
        <div class="task-actions">
            <input type="text" placeholder="Add a comment..." id="comment-${task.id}" class="input-field">
            <button onclick="addComment(${task.id})" class="btn-primary">Post</button>
            ${!task.completed && !isManager ? `
                <label>Progress Update:</label>
                <input type="number" min="0" max="100" id="progress-${task.id}" value="${task.progress}" class="input-field" title="Enter your task progress (0-100)">
                <button onclick="updateProgress(${task.id})" class="btn-primary">Update</button>
                <button onclick="markTaskComplete(${index})" class="btn-primary">Complete</button>
            ` : ''}
            ${isManager ? `
                <button onclick="editTask(${index})" class="btn-primary">Edit</button>
                <button onclick="deleteTask(${index})" class="btn-danger">Delete</button>
            ` : ''}
        </div>
    `;
    task.comments.forEach(c => {
        const comment = document.createElement('p');
        comment.textContent = `${users[c.user].name}: ${c.text}`;
        card.querySelector('.comments').appendChild(comment);
    });
    return card;
}

function updateAnalytics() {
    const analyticsView = document.getElementById('analyticsView');
    analyticsView.innerHTML = '';
    
    const stats = {
        totalTasks: tasks.length,
        completed: tasks.filter(t => t.completed).length,
        overdue: tasks.filter(t => !t.completed && new Date(t.deadline) < new Date()).length,
        active: tasks.filter(t => !t.completed).length
    };
    
    for (let [key, value] of Object.entries(stats)) {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `<h3>${value}</h3><p>${key.replace(/([A-Z])/g, ' $1').toUpperCase()}</p>`;
        analyticsView.appendChild(card);
    }
}

function updateTeamOverview() {
    const teamOverview = document.getElementById('teamOverview');
    teamOverview.innerHTML = '';
    Object.keys(users)
        .filter(u => users[u].role === 'employee')
        .forEach(username => {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'team-member';
            memberDiv.innerHTML = `
                <h4>${users[username].name} (${users[username].empRole}) 
                    <span style="color: ${users[username].status === 'online' ? '#2ecc71' : '#e74c3c'};">●</span>
                </h4>
                <p>Email: ${users[username].email}</p>
            `;
            const activeTasks = tasks.filter(t => t.employee === username && !t.completed);
            if (activeTasks.length > 0) {
                const taskList = document.createElement('ul');
                activeTasks.forEach(task => {
                    const li = document.createElement('li');
                    li.textContent = `${task.description} (Due: ${task.deadline})`;
                    taskList.appendChild(li);
                });
                memberDiv.appendChild(taskList);
            } else {
                memberDiv.innerHTML += '<p>No active tasks</p>';
            }
            teamOverview.appendChild(memberDiv);
        });
}

function markTaskComplete(index) {
    tasks[index].completed = true;
    tasks[index].progress = 100;
    users[tasks[index].employee].performance.completed++;
    saveData();
    alert('Task marked as complete!');
    updateViews();
    updateTeamOverview();
}

function addComment(taskId) {
    const input = document.getElementById(`comment-${taskId}`);
    const comment = input.value.trim();
    if (comment) {
        tasks.find(t => t.id === taskId).comments.push({ user: currentUser, text: comment });
        input.value = '';
        saveData();
        updateViews();
    }
}

function updateProgress(taskId) {
    const progress = parseInt(document.getElementById(`progress-${taskId}`).value);
    if (progress >= 0 && progress <= 100) {
        const task = tasks.find(t => t.id === taskId);
        task.progress = progress;
        if (progress === 100) {
            task.completed = true;
            users[task.employee].performance.completed++;
            alert('Task marked as complete!');
        }
        saveData();
        updateViews();
        updateTeamOverview();
    } else {
        alert('Progress must be between 0 and 100');
    }
}

function deleteTask(index) {
    if (confirm('Delete this task?')) {
        const employee = tasks[index].employee;
        if (!tasks[index].completed) users[employee].performance.total--;
        tasks.splice(index, 1);
        saveData();
        updateViews();
        updateTeamOverview();
    }
}

function editTask(index) {
    const task = tasks[index];
    const taskForm = document.getElementById('taskForm');
    taskForm.innerHTML = `
        <div class="form-group">
            <select id="editEmployee" class="input-field">${document.getElementById('employeeSelect').innerHTML}</select>
            <input type="text" id="editDesc" value="${task.description}" class="input-field">
            <input type="date" id="editDeadline" value="${task.deadline}" class="input-field">
            <select id="editPriority" class="input-field">
                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
            </select>
            <select id="editCategory" class="input-field"></select>
            <button onclick="saveTaskEdit(${index})" class="btn-primary">Save Changes</button>
            <button onclick="cancelEdit()" class="btn-danger">Cancel</button>
        </div>
    `;
    document.getElementById('editEmployee').value = task.employee;
    const editCategory = document.getElementById('editCategory');
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        editCategory.appendChild(option);
    });
    editCategory.value = task.category;
}

function saveTaskEdit(index) {
    const task = tasks[index];
    task.employee = document.getElementById('editEmployee').value;
    task.description = document.getElementById('editDesc').value;
    task.deadline = document.getElementById('editDeadline').value;
    task.priority = document.getElementById('editPriority').value;
    task.category = document.getElementById('editCategory').value;
    saveData();
    cancelEdit();
    updateViews();
    updateTeamOverview();
}

function cancelEdit() {
    const taskForm = document.getElementById('taskForm');
    taskForm.innerHTML = `
        <div class="form-group">
            <select id="employeeSelect" class="input-field"></select>
            <input type="text" id="taskDesc" placeholder="Task Description" class="input-field">
            <input type="date" id="taskDeadline" class="input-field">
            <select id="taskPriority" class="input-field">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
            </select>
            <select id="taskCategory" class="input-field"></select>
            <button onclick="assignTask()" class="btn-primary">Assign Task</button>
        </div>
    `;
    updateEmployeeSelect();
    updateCategorySelects();
}

// Initialize theme from localStorage
document.body.classList.add(localStorage.getItem('theme') === 'dark' ? 'dark-theme' : 'light-theme');
updateCategorySelects();
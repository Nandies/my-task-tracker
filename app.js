// Main application code

// Function to format the date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to render tasks
function renderTasks() {
    const taskContainer = document.querySelector('.task-container');
    
    // Clear existing tasks
    taskContainer.innerHTML = '';
    
    // Sort tasks by priority (high → medium → low)
    const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
    const sortedTasks = [...tasks].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    
    // Create task cards
    sortedTasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        
        taskCard.innerHTML = `
            <h3 class="task-title">${task.title}</h3>
            <p class="task-description">${task.description}</p>
            <div class="task-meta">
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
                <span class="task-deadline">Due: ${formatDate(task.deadline)}</span>
            </div>
        `;
        
        taskContainer.appendChild(taskCard);
    });
}

// Update last updated timestamp
function updateTimestamp() {
    const lastUpdated = document.getElementById('last-updated');
    lastUpdated.textContent = new Date().toLocaleString();
}

// Initialize the application
function init() {
    renderTasks();
    updateTimestamp();
}

// Run initialization when the page loads
window.addEventListener('DOMContentLoaded', init);
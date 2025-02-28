// Main application code

// Function to format the date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to get relative time description
function getRelativeTimeDescription(dateString) {
    const taskDate = new Date(dateString);
    const today = new Date();
    
    // Reset time part for accurate day comparison
    today.setHours(0, 0, 0, 0);
    
    const diffTime = taskDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return `<span class="overdue">Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}</span>`;
    } else if (diffDays === 0) {
        return '<span class="due-today">Due today</span>';
    } else if (diffDays === 1) {
        return '<span class="due-soon">Due tomorrow</span>';
    } else if (diffDays <= 3) {
        return `<span class="due-soon">Due in ${diffDays} days</span>`;
    } else {
        return `Due in ${diffDays} days`;
    }
}

// Function to render categories
function renderCategories() {
    const categoryContainer = document.getElementById('category-filters');
    if (!categoryContainer) return;
    
    // Get unique categories
    const categories = ['All', ...new Set(tasks.map(task => task.category))];
    
    // Create category buttons
    categories.forEach(category => {
        const categoryBtn = document.createElement('button');
        categoryBtn.className = 'category-btn';
        categoryBtn.dataset.category = category;
        categoryBtn.textContent = category;
        
        if (category === 'All') {
            categoryBtn.classList.add('active');
        }
        
        categoryBtn.addEventListener('click', () => {
            // Remove active class from all buttons
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Add active class to clicked button
            categoryBtn.classList.add('active');
            
            // Filter tasks
            renderTasks(category);
        });
        
        categoryContainer.appendChild(categoryBtn);
    });
}

// Function to render tasks
function renderTasks(categoryFilter = 'All') {
    const taskContainer = document.querySelector('.task-container');
    
    // Clear existing tasks
    taskContainer.innerHTML = '';
    
    // Filter tasks by category if needed
    let filteredTasks = tasks;
    if (categoryFilter !== 'All') {
        filteredTasks = tasks.filter(task => task.category === categoryFilter);
    }
    
    // Filter out completed tasks
    filteredTasks = filteredTasks.filter(task => task.status !== 'completed');
    
    // Sort tasks by deadline (closest first) and then by priority
    const priorityOrder = { 'high': 1, 'medium': 2, 'low': 3 };
    const sortedTasks = [...filteredTasks].sort((a, b) => {
        // First sort by deadline
        const dateA = new Date(a.deadline);
        const dateB = new Date(b.deadline);
        if (dateA < dateB) return -1;
        if (dateA > dateB) return 1;
        
        // If deadlines are equal, sort by priority
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    // Check if we have any tasks
    if (sortedTasks.length === 0) {
        taskContainer.innerHTML = `
            <div class="no-tasks">
                <p>No ${categoryFilter !== 'All' ? categoryFilter + ' ' : ''}tasks found.</p>
            </div>
        `;
        return;
    }
    
    // Create task cards
    sortedTasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        
        // Add category class for styling
        taskCard.classList.add(`category-${task.category.toLowerCase().replace(/\s+/g, '-')}`);
        
        taskCard.innerHTML = `
            <div class="category-label">${task.category}</div>
            <h3 class="task-title">${task.title}</h3>
            <p class="task-description">${task.description}</p>
            <div class="task-meta">
                <span class="task-priority priority-${task.priority}">${task.priority}</span>
                <span class="task-deadline">${getRelativeTimeDescription(task.deadline)}</span>
            </div>
            <div class="task-date">${formatDate(task.deadline)}</div>
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
    renderCategories();
    renderTasks();
    updateTimestamp();
}

// Run initialization when the page loads
window.addEventListener('DOMContentLoaded', init);
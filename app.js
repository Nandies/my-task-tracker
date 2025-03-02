// Main application code

// The authorized Google email that can modify tasks
const AUTHORIZED_EMAIL = 'nandies1019@gmail.com';

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

// ------ GOOGLE AUTHENTICATION FUNCTIONALITY ------

// Using simplified authentication with direct link
function initializeGoogleAuth() {
    // Since we're using a direct HTML link, we just need to update the UI
    updateAuthUI();
}

// Function to check if user is authenticated with Google
function isGoogleAuthenticated() {
    return localStorage.getItem('google_authenticated') === 'true';
}

// Function to check if the authenticated user is authorized
function isAuthorizedUser() {
    if (!isGoogleAuthenticated()) return false;
    
    try {
        const userData = JSON.parse(localStorage.getItem('google_user_data') || '{}');
        return userData.email === AUTHORIZED_EMAIL;
    } catch (error) {
        console.error('Error checking authorization:', error);
        return false;
    }
}

// Function to handle Google logout
function logoutFromGoogle() {
    // Clear auth data from localStorage
    localStorage.removeItem('google_authenticated');
    localStorage.removeItem('google_user_data');
    localStorage.removeItem('google_id_token');
    
    // Disable task modification buttons
    document.querySelectorAll('.complete-btn, .restore-btn').forEach(btn => {
        btn.disabled = true;
    });
    
    // Update the UI
    updateAuthUI();
    
    // Reload the page to ensure all state is reset
    window.location.reload();
}

// Function to update the authentication UI
function updateAuthUI() {
    const authContainer = document.getElementById('auth-container');
    const authStatus = document.getElementById('auth-status');
    const signOutButton = document.getElementById('sign-out-button');
    const authButton = document.getElementById('auth-button');
    
    if (!authContainer || !authStatus || !signOutButton) return;
    
    if (isGoogleAuthenticated()) {
        try {
            const userData = JSON.parse(localStorage.getItem('google_user_data') || '{}');
            
            // Hide login button, show logout button
            if (authButton) authButton.style.display = 'none';
            signOutButton.style.display = 'block';
            
            if (isAuthorizedUser()) {
                authStatus.textContent = `Logged in as ${userData.email} (Authorized)`;
                authStatus.className = 'auth-status authorized';
                
                // Enable task modification buttons
                document.querySelectorAll('.complete-btn, .restore-btn').forEach(btn => {
                    btn.disabled = false;
                });
            } else {
                authStatus.textContent = `Logged in as ${userData.email} (Not authorized)`;
                authStatus.className = 'auth-status unauthorized';
            }
        } catch (error) {
            console.error('Error updating auth UI:', error);
        }
    } else {
        // Show Google Sign-In button, hide logout button
        if (authButton) authButton.style.display = 'inline-flex';
        signOutButton.style.display = 'none';
        
        authStatus.textContent = 'Not logged in';
        authStatus.className = 'auth-status';
        
        // Disable task modification buttons
        document.querySelectorAll('.complete-btn, .restore-btn').forEach(btn => {
            btn.disabled = true;
        });
    }
}

// Function to handle task completion attempt
function handleTaskCompletionAttempt(taskId) {
    if (isGoogleAuthenticated() && isAuthorizedUser()) {
        toggleTaskCompletion(taskId);
    } else {
        alert(`You must be logged in as ${AUTHORIZED_EMAIL} to modify tasks.`);
    }
}

// ------ NOTES FUNCTIONALITY ------

// Array to store notes
let notes = [];

// Function to toggle notes panel
function toggleNotesPanel() {
    const notesPanel = document.getElementById('notes-panel');
    notesPanel.classList.toggle('hidden');
}

// Function to save notes to localStorage
function saveNotes() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

// Function to load notes from localStorage
function loadNotes() {
    const savedNotes = localStorage.getItem('notes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
    }
}

// Function to render notes
function renderNotes() {
    const notesContainer = document.getElementById('notes-container');
    
    // Clear existing notes
    notesContainer.innerHTML = '';
    
    // Check if we have any notes
    if (notes.length === 0) {
        notesContainer.innerHTML = `
            <div class="no-notes">
                <p>No notes yet. Click "New Note" to create one.</p>
            </div>
        `;
        return;
    }
    
    // Sort notes by last modified date (newest first)
    const sortedNotes = [...notes].sort((a, b) => {
        return new Date(b.lastModified) - new Date(a.lastModified);
    });
    
    // Create note cards
    sortedNotes.forEach(note => {
        const noteCard = document.createElement('div');
        noteCard.className = 'note-card';
        noteCard.dataset.noteId = note.id;
        
        // Create a preview of the content (first 100 characters)
        const contentPreview = note.content.length > 100 
            ? note.content.substring(0, 100) + '...' 
            : note.content;
        
        noteCard.innerHTML = `
            <h3 class="note-card-title">${note.title}</h3>
            <p class="note-card-preview">${contentPreview}</p>
            <div class="note-card-actions">
                <button class="edit-note-btn" data-note-id="${note.id}">Edit</button>
                <button class="delete-note-btn" data-note-id="${note.id}">Delete</button>
            </div>
        `;
        
        notesContainer.appendChild(noteCard);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('.edit-note-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click event
            const noteId = btn.dataset.noteId;
            openNoteEditor(noteId);
        });
    });
    
    document.querySelectorAll('.delete-note-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent card click event
            const noteId = btn.dataset.noteId;
            deleteNote(noteId);
        });
    });
    
    // Make the entire note card clickable to view/edit
    document.querySelectorAll('.note-card').forEach(card => {
        card.addEventListener('click', () => {
            const noteId = card.dataset.noteId;
            openNoteEditor(noteId);
        });
    });
}

// Function to open the note editor
function openNoteEditor(noteId = null) {
    const noteEditor = document.getElementById('note-editor');
    const titleInput = document.getElementById('note-title');
    const contentInput = document.getElementById('note-content');
    
    // Show the editor
    noteEditor.classList.remove('hidden');
    
    // If we have a noteId, we're editing an existing note
    if (noteId) {
        const note = notes.find(n => n.id === noteId);
        if (note) {
            titleInput.value = note.title;
            contentInput.value = note.content;
            noteEditor.dataset.noteId = noteId;
        }
    } else {
        // New note
        titleInput.value = '';
        contentInput.value = '';
        delete noteEditor.dataset.noteId;
    }
    
    // Focus on the title input
    titleInput.focus();
}

// Function to save a note
function saveNote() {
    const noteEditor = document.getElementById('note-editor');
    const titleInput = document.getElementById('note-title');
    const contentInput = document.getElementById('note-content');
    
    const title = titleInput.value.trim() || 'Untitled Note';
    const content = contentInput.value.trim();
    
    // If we're editing an existing note
    if (noteEditor.dataset.noteId) {
        const noteId = noteEditor.dataset.noteId;
        const noteIndex = notes.findIndex(n => n.id === noteId);
        
        if (noteIndex !== -1) {
            notes[noteIndex].title = title;
            notes[noteIndex].content = content;
            notes[noteIndex].lastModified = new Date().toISOString();
        }
    } else {
        // Create a new note
        const newNote = {
            id: Date.now().toString(), // Use timestamp as ID
            title,
            content,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        notes.push(newNote);
    }
    
    // Save notes to localStorage
    saveNotes();
    
    // Rerender notes
    renderNotes();
    
    // Hide the editor
    noteEditor.classList.add('hidden');
}

// Function to cancel editing a note
function cancelNoteEdit() {
    const noteEditor = document.getElementById('note-editor');
    noteEditor.classList.add('hidden');
}

// Function to delete a note
function deleteNote(noteId) {
    if (confirm('Are you sure you want to delete this note?')) {
        // Filter out the note with the given ID
        notes = notes.filter(note => note.id !== noteId);
        
        // Save notes to localStorage
        saveNotes();
        
        // Rerender notes
        renderNotes();
    }
}

// ------ TASKS FUNCTIONALITY ------

// Function to render categories
function renderCategories() {
    const categoryContainer = document.getElementById('category-filters');
    if (!categoryContainer) return;
    
    // Get unique categories
    const categories = ['All', ...new Set(tasks.map(task => task.category))];
    
    // Clear existing categories
    categoryContainer.innerHTML = '';
    
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

// Function to save tasks to localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Function to load tasks from localStorage
function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        // Parse the saved tasks and update our tasks array
        const parsedTasks = JSON.parse(savedTasks);
        
        // Replace the tasks array content while preserving the reference
        tasks.length = 0;
        parsedTasks.forEach(task => tasks.push(task));
    }
}

// Function to toggle archive visibility
function toggleArchive() {
    const archiveSection = document.getElementById('archive-section');
    const archiveToggle = document.getElementById('archive-toggle');
    
    if (archiveSection.classList.contains('hidden')) {
        archiveSection.classList.remove('hidden');
        archiveToggle.textContent = 'Hide Completed Tasks ';
        archiveToggle.appendChild(document.querySelector('.archive-counter'));
    } else {
        archiveSection.classList.add('hidden');
        archiveToggle.textContent = 'Show Completed Tasks ';
        archiveToggle.appendChild(document.querySelector('.archive-counter'));
    }
    
    // Save preference to localStorage
    localStorage.setItem('archiveVisible', !archiveSection.classList.contains('hidden'));
}

// Function to toggle task completion
function toggleTaskCompletion(taskId) {
    // Find the task by ID
    const task = tasks.find(t => t.id === parseInt(taskId));
    
    if (task) {
        // Toggle the status
        task.status = task.status === 'completed' ? 'pending' : 'completed';
        
        // Save to localStorage
        saveTasks();
        
        // Refresh the task display
        const activeCategory = document.querySelector('.category-btn.active').dataset.category;
        renderTasks(activeCategory);
        renderArchive();
    }
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
            <button class="complete-btn" data-task-id="${task.id}" ${isAuthorizedUser() ? '' : 'disabled'}>Mark Complete</button>
        `;
        
        taskContainer.appendChild(taskCard);
    });
    
    // Add event listeners to complete buttons
    document.querySelectorAll('.complete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.target.dataset.taskId;
            handleTaskCompletionAttempt(taskId);
        });
    });
}

// Function to render archived tasks
function renderArchive() {
    const archiveContainer = document.querySelector('.archive-container');
    
    // Clear existing archived tasks
    archiveContainer.innerHTML = '';
    
    // Get completed tasks
    const completedTasks = tasks.filter(task => task.status === 'completed');
    
    // Check if we have any completed tasks
    if (completedTasks.length === 0) {
        archiveContainer.innerHTML = `
            <div class="no-tasks">
                <p>No completed tasks.</p>
            </div>
        `;
        return;
    }
    
    // Sort completed tasks by category and title
    const sortedTasks = [...completedTasks].sort((a, b) => {
        // First sort by category
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        
        // If categories are equal, sort by title
        return a.title.localeCompare(b.title);
    });
    
    // Create archived task cards
    sortedTasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card archived';
        
        // Add category class for styling
        taskCard.classList.add(`category-${task.category.toLowerCase().replace(/\s+/g, '-')}`);
        
        taskCard.innerHTML = `
            <div class="category-label">${task.category}</div>
            <h3 class="task-title">${task.title}</h3>
            <p class="task-description">${task.description}</p>
            <div class="task-date">Completed</div>
            <button class="restore-btn" data-task-id="${task.id}" ${isAuthorizedUser() ? '' : 'disabled'}>Restore Task</button>
        `;
        
        archiveContainer.appendChild(taskCard);
    });
    
    // Add event listeners to restore buttons
    document.querySelectorAll('.restore-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const taskId = e.target.dataset.taskId;
            handleTaskCompletionAttempt(taskId);
        });
    });
    
    // Update archive counter
    const archiveCounter = document.getElementById('archive-counter');
    if (archiveCounter) {
        archiveCounter.textContent = completedTasks.length;
    }
}

// Update last updated timestamp
function updateTimestamp() {
    const lastUpdated = document.getElementById('last-updated');
    lastUpdated.textContent = new Date().toLocaleString();
}

// Initialize the application
function init() {
    // Load tasks from localStorage
    loadTasks();
    
    // Load notes from localStorage
    loadNotes();
    
    // Check for authentication status from redirect
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    
    if (authStatus === 'success') {
        // Remove the query parameter
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (authStatus === 'error') {
        alert('Authentication failed. Please try again.');
        // Remove the query parameter
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Set up event listeners for tasks
    const archiveToggle = document.getElementById('archive-toggle');
    if (archiveToggle) {
        archiveToggle.addEventListener('click', toggleArchive);
    }
    
    // Check if archive should be visible based on previous preference
    const archiveVisible = localStorage.getItem('archiveVisible') === 'true';
    const archiveSection = document.getElementById('archive-section');
    if (archiveVisible && archiveSection) {
        archiveSection.classList.remove('hidden');
        if (archiveToggle) {
            archiveToggle.textContent = 'Hide Completed Tasks ';
            const counter = document.getElementById('archive-counter');
            if (counter) {
                archiveToggle.appendChild(counter);
            }
        }
    } else if (archiveSection) {
        archiveSection.classList.add('hidden');
        if (archiveToggle) {
            archiveToggle.textContent = 'Show Completed Tasks ';
            const counter = document.getElementById('archive-counter');
            if (counter) {
                archiveToggle.appendChild(counter);
            }
        }
    }
    
    // Set up event listeners for notes
    const notesToggle = document.getElementById('notes-toggle');
    if (notesToggle) {
        notesToggle.addEventListener('click', toggleNotesPanel);
    }
    
    const addNoteBtn = document.getElementById('add-note');
    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', () => openNoteEditor());
    }
    
    const saveNoteBtn = document.getElementById('save-note');
    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', saveNote);
    }
    
    const cancelNoteBtn = document.getElementById('cancel-note');
    if (cancelNoteBtn) {
        cancelNoteBtn.addEventListener('click', cancelNoteEdit);
    }
    
    // Set up auth event listeners
    const signOutButton = document.getElementById('sign-out-button');
    if (signOutButton) {
        signOutButton.addEventListener('click', logoutFromGoogle);
    }
    
    // Render the UI
    renderCategories();
    renderTasks();
    renderArchive();
    renderNotes();
    updateAuthUI();
    updateTimestamp();
}

// Run initialization when the page loads
window.addEventListener('DOMContentLoaded', init);
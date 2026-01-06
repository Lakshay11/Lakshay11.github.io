// Main JavaScript for Goal Tracker App
class GoalTracker {
    constructor() {
        this.API_URL = "https://script.google.com/macros/s/AKfycbzZ3mh6t9CLMVzb-nB06hmr3nwpQbfrHR6h-OEhS649H6nQnjp3A1XS_0CEv61XJX0P/exec"
        this.passphrase = localStorage.getItem('goalTrackerPassphrase') || '';
        this.goals = [];
        this.editingGoalId = null;
        
        this.init();
    }

    // Initialize the app
init() {
    this.setupEventListeners();

    // Auto-auth ONLY if passphrase already exists
    if (this.passphrase) {
        console.log('Auto-auth using stored passphrase');
        this.authenticate();
    }
}


    // Setup event listeners
    setupEventListeners() {
        // Goal form submission
        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGoalSubmit();
        });

        // Enter key for passphrase
        document.getElementById('passphraseInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.authenticate();
            }
        });
    }

    // Authentication
async authenticate() {
    const input = document.getElementById('passphraseInput');
    const enteredPassphrase = input.value.trim();

    // CASE 1: User typed passphrase now
    if (enteredPassphrase) {
        this.passphrase = enteredPassphrase;
        localStorage.setItem('goalTrackerPassphrase', enteredPassphrase);
    }

    // CASE 2: No passphrase anywhere
if (!this.passphrase) {
    console.warn('API call blocked: missing passphrase');
    throw new Error('Missing passphrase');
}


    console.log('AUTH ATTEMPT WITH PASSPHRASE:', this.passphrase);

    try {
        const response = await this.makeRequest('auth', {}, 'GET');

        if (response.success) {
            this.showApp();
            await this.loadGoals();
        } else {
            this.showAuthError('Invalid passphrase');
            this.passphrase = '';
            localStorage.removeItem('goalTrackerPassphrase');
        }
    } catch (err) {
        console.error('AUTH ERROR:', err);
        this.showAuthError('Authentication failed');
    }
}


    // Show authentication error
    showAuthError(message) {
        const errorDiv = document.getElementById('authError');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => errorDiv.classList.add('hidden'), 3000);
    }

    // Show main app
    showApp() {
        document.getElementById('authModal').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
    }

    // Logout
    logout() {
        localStorage.removeItem('goalTrackerPassphrase');
        this.passphrase = '';
        document.getElementById('authModal').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        document.getElementById('passphraseInput').value = '';
    }

    // Make API request
async makeRequest(action, params = {}) {
    if (!this.passphrase) throw new Error('Missing passphrase');

    const url = new URL(this.API_URL);
    url.searchParams.set('action', action);
    url.searchParams.set('passphrase', this.passphrase);

    Object.entries(params).forEach(([k, v]) => {
        url.searchParams.set(k, v);
    });

    console.log('JSONP REQUEST →', url.toString());
    return jsonpRequest(url.toString());
}


    // Load all goals
    async loadGoals() {
        try {
            // const response = await this.makeRequest('auth', {}, 'GET');
            const response = await this.makeRequest('getAll');
// this.goals = response.data || [];
// this.updateAllSections();

            if (response.success) {
                this.goals = response.data || [];
                this.updateAllSections();
            }
        } catch (error) {
            console.error('Failed to load goals:', error);
        }
    }

    // Handle goal form submission
    async handleGoalSubmit() {
        const formData = this.getFormData();
        
        if (!formData.name || !formData.target_date) {
            alert('Goal name and target date are required');
            return;
        }

        try {
            let response;
            if (this.editingGoalId) {
                // Update existing goal
                response = await this.makeRequest('update', {
                    id: this.editingGoalId,
                    ...formData
                });
            } else {
                // Create new goal
                response = await this.makeRequest('create', formData);
            }

            if (response.success) {
                this.resetForm();
                await this.loadGoals();
                this.showSuccessMessage(response.message);
            } else {
                alert('Error: ' + response.error);
            }
        } catch (error) {
            console.error('Failed to save goal:', error);
            alert('Failed to save goal');
        }
    }

    // Get form data
    getFormData() {
        return {
            name: document.getElementById('goalName').value.trim(),
            description: document.getElementById('goalDescription').value.trim(),
            outcome: document.getElementById('goalOutcome').value.trim(),
            target_date: document.getElementById('targetDate').value,
            priority: document.getElementById('goalPriority').value,
            status: document.getElementById('goalStatus').value,
            progress: parseInt(document.getElementById('goalProgress').value)
        };
    }

    // Reset form
    resetForm() {
        document.getElementById('goalForm').reset();
        document.getElementById('progressValue').textContent = '0';
        document.getElementById('goalStatus').value = 'todo';
        this.editingGoalId = null;
        
        // Change button text back
        const submitBtn = document.querySelector('#goalForm button[type="submit"]');
        submitBtn.textContent = 'Add Goal';
    }

    // Update all sections
    updateAllSections() {
        this.updateImmediateAttention();
        this.updateNeedsAttention();
        this.updateCompletionScore();
        this.updateFilteredGoals();
    }

    // Update immediate attention section
    updateImmediateAttention() {
        const container = document.getElementById('immediateAttention');
        const urgentGoals = this.goals.filter(goal => 
            goal.status === 'todo' && 
            goal.progress < 40 && 
            goal.days_remaining <= 7 && 
            goal.days_remaining >= 0
        );

        if (urgentGoals.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-sm italic">No goals need immediate attention</p>';
            return;
        }

        container.innerHTML = urgentGoals.map(goal => this.createGoalCard(goal, 'urgent')).join('');
    }

    // Update needs attention section
    updateNeedsAttention() {
        const container = document.getElementById('needsAttention');
        const attentionGoals = this.goals.filter(goal => 
            goal.status === 'todo' && 
            goal.progress < 70 && 
            goal.days_remaining <= 21 && 
            goal.days_remaining >= 0 &&
            !(goal.progress < 40 && goal.days_remaining <= 7) // Exclude urgent goals
        );

        if (attentionGoals.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-sm italic">No goals need attention</p>';
            return;
        }

        container.innerHTML = attentionGoals.map(goal => this.createGoalCard(goal, 'attention')).join('');
    }

    // Create goal card HTML
    createGoalCard(goal, type) {
        // Priority-based left accent border
        const priorityBorder = {
            'High': 'border-l-red-500',
            'Medium': 'border-l-amber-500', 
            'Low': 'border-l-emerald-500'
        };
        
        // Status-based background
        let bgClass = 'bg-white';
        if (goal.status === 'done') {
            bgClass = 'bg-emerald-50';
        } else if (goal.status === 'hold') {
            bgClass = 'bg-amber-50';
        } else if (goal.status === 'deferred') {
            bgClass = 'bg-slate-50';
        } else if (goal.status === 'archived') {
            bgClass = 'bg-red-50 opacity-75';
        }
        
        // Days display logic
        let daysDisplay = '';
        let daysClass = goal.days_remaining <= 3 ? 'text-red-600 font-medium' : 'text-slate-600';
        
        if (goal.status === 'done') {
            daysDisplay = '<span class="text-emerald-600 text-xs font-medium">✓ Completed</span>';
        } else if (goal.status === 'hold') {
            daysDisplay = '<span class="text-amber-600 text-xs">⏸ On Hold</span>';
        } else if (goal.status === 'deferred') {
            daysDisplay = '<span class="text-slate-500 text-xs">⏱ Deferred</span>';
        } else if (goal.status === 'archived') {
            daysDisplay = '<span class="text-red-600 text-xs">📦 Archived</span>';
        } else {
            daysDisplay = `<span class="${daysClass} text-xs">${goal.days_remaining} days left</span>`;
        }
        
        // Priority colors for badges
        const priorityColors = {
            'High': 'red',
            'Medium': 'amber',
            'Low': 'emerald'
        };
        const priorityColor = priorityColors[goal.priority] || 'slate';
        
        // Status colors for badges
        const statusColors = {
            'todo': 'blue',
            'hold': 'amber', 
            'done': 'emerald',
            'deferred': 'slate',
            'archived': 'red'
        };
        const statusColor = statusColors[goal.status] || 'slate';
        
        const statusLabels = {
            'todo': 'To Do',
            'hold': 'On Hold',
            'done': 'Done', 
            'deferred': 'Deferred',
            'archived': 'Archived'
        };
        const statusLabel = statusLabels[goal.status] || goal.status;

        return `
            <div class="goal-card ${bgClass} border-l-4 ${priorityBorder[goal.priority]} border border-slate-200 rounded-xl p-5 fade-in hover:shadow-md transition-all">
                <div class="flex justify-between items-start mb-3">
                    <h3 class="font-semibold text-slate-900 text-base flex-1 mr-3">${goal.name}</h3>
                    <div class="flex gap-2 flex-wrap">
                        <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-${statusColor}-100 text-${statusColor}-700 border border-${statusColor}-200">
                            ${statusLabel}
                        </span>
                        <span class="px-2.5 py-1 text-xs font-medium rounded-full bg-${priorityColor}-100 text-${priorityColor}-700 border border-${priorityColor}-200">
                            ${goal.priority}
                        </span>
                        ${daysDisplay}
                    </div>
                </div>
                
                ${goal.description ? `<p class="text-slate-600 text-sm mb-4 leading-relaxed">${goal.description}</p>` : ''}
                
                <div class="mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-xs font-medium text-slate-500 uppercase tracking-wide">Progress</span>
                        <span class="text-sm font-medium text-slate-700">${goal.progress}%</span>
                    </div>
                    <div class="w-full bg-slate-200 rounded-full h-2.5">
                        <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                             style="width: ${goal.progress}%"></div>
                    </div>
                </div>
                
                <div class="flex gap-2 flex-col sm:flex-row">
                    <button onclick="goalTracker.editGoal('${goal.id}')" 
                            class="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium order-1">
                        Edit
                    </button>
                    <button onclick="goalTracker.updateProgress('${goal.id}')" 
                            class="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium order-2">
                        Update Progress
                    </button>
                    <button onclick="goalTracker.archiveGoal('${goal.id}')" 
                            class="text-sm bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors font-medium order-3">
                        Archive
                    </button>
                </div>
            </div>
        `;
    }

    // Update completion score
    updateCompletionScore() {
        const activeGoals = this.goals.filter(goal => goal.status === 'todo');
        
        if (activeGoals.length === 0) {
            document.getElementById('completionScore').textContent = '0%';
            document.getElementById('progressRing').style.strokeDashoffset = '351.86';
            return;
        }

        const totalProgress = activeGoals.reduce((sum, goal) => sum + goal.progress, 0);
        const averageProgress = Math.round(totalProgress / activeGoals.length);
        
        document.getElementById('completionScore').textContent = averageProgress + '%';
        
        // Update progress ring
        const circumference = 2 * Math.PI * 56; // radius = 56
        const offset = circumference - (averageProgress / 100) * circumference;
        document.getElementById('progressRing').style.strokeDashoffset = offset;
    }

    // Edit goal
    editGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        this.editingGoalId = goalId;
        
        // Fill form with goal data
        document.getElementById('goalName').value = goal.name;
        document.getElementById('goalDescription').value = goal.description || '';
        document.getElementById('goalOutcome').value = goal.outcome || '';
        document.getElementById('targetDate').value = goal.target_date;
        document.getElementById('goalPriority').value = goal.priority;
        document.getElementById('goalStatus').value = goal.status || 'todo';
        document.getElementById('goalProgress').value = goal.progress;
        document.getElementById('progressValue').textContent = goal.progress;

        // Change button text
        const submitBtn = document.querySelector('#goalForm button[type="submit"]');
        submitBtn.textContent = 'Update Goal';

        // Scroll to form
        document.getElementById('goalForm').scrollIntoView({ behavior: 'smooth' });
    }

    // Update progress with quick dialog
    updateProgress(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;

        const newProgress = prompt(`Update progress for "${goal.name}" (0-100):`, goal.progress);
        
        if (newProgress !== null) {
            const progress = parseInt(newProgress);
            if (progress >= 0 && progress <= 100) {
                this.saveProgressUpdate(goalId, progress);
            } else {
                alert('Progress must be between 0 and 100');
            }
        }
    }

    // Save progress update
    async saveProgressUpdate(goalId, progress) {
        try {
            const goal = this.goals.find(g => g.id === goalId);
            const currentStatus = goal ? goal.status : 'todo';
            const newStatus = progress === 100 ? 'done' : currentStatus;
            
            const response = await this.makeRequest('update', {
                id: goalId,
                progress: progress,
                status: newStatus
            });

            if (response.success) {
                await this.loadGoals();
                this.showSuccessMessage('Progress updated successfully');
            } else {
                alert('Error: ' + response.error);
            }
        } catch (error) {
            console.error('Failed to update progress:', error);
            alert('Failed to update progress');
        }
    }

    // Archive goal
    async archiveGoal(goalId) {
        if (!confirm('Are you sure you want to archive this goal?')) return;

        try {
            const response = await this.makeRequest('delete', { id: goalId });
            
            if (response.success) {
                await this.loadGoals();
                this.showSuccessMessage('Goal archived successfully');
            } else {
                alert('Error: ' + response.error);
            }
        } catch (error) {
            console.error('Failed to archive goal:', error);
            alert('Failed to archive goal');
        }
    }

    // Filter goals
    filterGoals() {
        this.updateFilteredGoals();
    }

    // Update filtered goals section
    updateFilteredGoals() {
        const container = document.getElementById('filteredGoals');
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const priorityFilter = document.getElementById('priorityFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;

        let filteredGoals = this.goals.filter(goal => {
            // Search filter
            if (searchTerm && !goal.name.toLowerCase().includes(searchTerm) && 
                !goal.description.toLowerCase().includes(searchTerm)) {
                return false;
            }

            // Status filter
            if (statusFilter && goal.status !== statusFilter) {
                return false;
            }

            // Priority filter
            if (priorityFilter && goal.priority !== priorityFilter) {
                return false;
            }

            // Date filter
            if (dateFilter) {
                const daysRemaining = goal.days_remaining;
                switch (dateFilter) {
                    case 'overdue':
                        if (daysRemaining >= 0) return false;
                        break;
                    case 'week':
                        if (daysRemaining < 0 || daysRemaining > 7) return false;
                        break;
                    case 'month':
                        if (daysRemaining < 0 || daysRemaining > 30) return false;
                        break;
                    case 'quarter':
                        if (daysRemaining < 0 || daysRemaining > 90) return false;
                        break;
                }
            }

            return true;
        });

        if (filteredGoals.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-sm italic">No goals match your filters</p>';
            return;
        }

        container.innerHTML = filteredGoals.map(goal => this.createGoalCard(goal, 'normal')).join('');
    }

    // Show success message
    showSuccessMessage(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 fade-in';
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
let goalTracker;

function authenticate() {
    goalTracker.authenticate();
}

function logout() {
    goalTracker.logout();
}

function updateProgressValue(value) {
    document.getElementById('progressValue').textContent = value;
}

function resetForm() {
    goalTracker.resetForm();
}

function filterGoals() {
    goalTracker.filterGoals();
}
function jsonpRequest(url) {
    return new Promise((resolve, reject) => {
        const callbackName = 'jsonp_cb_' + Math.random().toString(36).slice(2);

        window[callbackName] = (data) => {
            delete window[callbackName];
            script.remove();
            resolve(data);
        };

        const script = document.createElement('script');
        script.src = `${url}&callback=${callbackName}`;
        script.onerror = () => {
            delete window[callbackName];
            script.remove();
            reject(new Error('JSONP request failed'));
        };

        document.body.appendChild(script);
    });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    goalTracker = new GoalTracker();
});


const userMessage = document.getElementById('userMessage');
const API_BASE_URL = window.location.port === '3000' ? '' : 'http://localhost:3000';
let me = null;
let announcements = [];
let leaves = [];
let training = [];
let performance = [];

async function apiRequest(url, options = {}) {
    const response = await fetch(`${API_BASE_URL}${url}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        ...options
    });

    const responseType = response.headers.get('content-type') || '';
    let data = {};
    if (responseType.includes('application/json')) {
        try {
            data = await response.json();
        } catch (error) {
            data = { success: false, message: 'Invalid JSON response from server' };
        }
    } else {
        const rawBody = await response.text();
        const looksLikeHtml = /<html|<!doctype/i.test(rawBody);
        data = {
            success: false,
            message: looksLikeHtml
                ? 'API endpoint not found. Start Node server and open http://localhost:3000'
                : (rawBody || `Request failed with status ${response.status}`)
        };
    }

    if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Request failed');
    }

    return data;
}

function showMessage(text, type = 'success') {
    userMessage.className = `message ${type}`;
    userMessage.textContent = text;
    setTimeout(() => {
        userMessage.className = 'message hidden';
    }, 2800);
}

function setUserDisplayName() {
    const nameEl = document.getElementById('userDisplayName');
    if (!nameEl || !me) return;

    const fullName = me.name || `${me.fname || ''} ${me.lname || ''}`.trim() || me.email || 'User';
    nameEl.textContent = fullName;
}

function htmlEscape(text) {
    return String(text ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function chatbotReply(input) {
    const text = input.toLowerCase();
    if (text.includes('leave')) {
        return 'To request leave, open Leave Management and submit leave type, date range, and reason. Admin will review it.';
    }
    if (text.includes('training') || text.includes('school')) {
        return 'Training/Schooling updates are maintained by admin. You can monitor assigned records in your Training section.';
    }
    if (text.includes('announcement')) {
        return 'Announcements are posted by administrators and shown in descending order in your Announcement Board.';
    }
    if (text.includes('pds')) {
        return 'Use the PDS form to update your profile data. Saving will overwrite your latest record.';
    }
    if (text.includes('performance') || text.includes('evaluation')) {
        return 'Your performance records are visible in the Performance and Evaluation section once reviewed by admin.';
    }
    return 'I can help with leaves, training/schooling, announcements, PDS, and performance inquiries.';
}

function appendChat(text, role) {
    const chatWindow = document.getElementById('chatWindow');
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${role}`;
    bubble.textContent = text;
    chatWindow.appendChild(bubble);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function renderAnnouncements() {
    const container = document.getElementById('userAnnouncementList');

    if (!announcements.length) {
        container.innerHTML = '<p>No announcements yet.</p>';
        return;
    }

    container.innerHTML = announcements.map(item => `
        <div class="list-item">
            <h4>${htmlEscape(item.title)}</h4>
            <p>${htmlEscape(item.content)}</p>
            <small>${new Date(item.created_at).toLocaleString()}</small>
        </div>
    `).join('');
}

function renderDashboardStats() {
    const announcementCount = announcements.length;
    const leaveCount = leaves.filter(item => item.status === 'pending').length || leaves.length;
    const trainingCount = training.length;
    const performanceCount = performance.length;

    const setValue = (id, value) => {
        const element = document.getElementById(id);
        if (element) element.textContent = String(value);
    };

    setValue('userStatAnnouncements', announcementCount);
    setValue('userStatLeaves', leaveCount);
    setValue('userStatTraining', trainingCount);
    setValue('userStatPerformance', performanceCount);
}

function renderLeaves() {
    const wrap = document.getElementById('userLeaveWrap');

    if (!leaves.length) {
        wrap.innerHTML = '<p>No leave requests submitted yet.</p>';
        return;
    }

    wrap.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Date Range</th>
                    <th>Status</th>
                    <th>Admin Comment</th>
                </tr>
            </thead>
            <tbody>
                ${leaves.map(item => `
                    <tr>
                        <td>${htmlEscape(item.leave_type)}</td>
                        <td>${item.start_date} to ${item.end_date}</td>
                        <td>${htmlEscape(item.status)}</td>
                        <td>${htmlEscape(item.admin_comment || '-')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderTraining() {
    const wrap = document.getElementById('userTrainingWrap');

    if (!training.length) {
        wrap.innerHTML = '<p>No training records assigned yet.</p>';
        return;
    }

    wrap.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Course</th>
                    <th>Provider</th>
                    <th>Schedule</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${training.map(item => `
                    <tr>
                        <td>${htmlEscape(item.course_title)}</td>
                        <td>${htmlEscape(item.provider || '-')}</td>
                        <td>${item.start_date || '-'} to ${item.end_date || '-'}</td>
                        <td>${htmlEscape(item.status)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderPerformance() {
    const wrap = document.getElementById('userPerformanceWrap');

    if (!performance.length) {
        wrap.innerHTML = '<p>No evaluations available yet.</p>';
        return;
    }

    wrap.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Review Period</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Evaluator</th>
                    <th>Remarks</th>
                </tr>
            </thead>
            <tbody>
                ${performance.map(item => `
                    <tr>
                        <td>${htmlEscape(item.review_period)}</td>
                        <td>${item.score}</td>
                        <td>${htmlEscape(item.status)}</td>
                        <td>${htmlEscape(item.evaluator)}</td>
                        <td>${htmlEscape(item.remarks || '-')}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function populatePdsForm(record) {
    document.getElementById('pdsFullName').value = record?.full_name || me.name || '';
    document.getElementById('pdsContact').value = record?.contact_no || '';
    document.getElementById('pdsEmergency').value = record?.emergency_contact || '';
    document.getElementById('pdsPosition').value = record?.position_title || '';
    document.getElementById('pdsDepartment').value = record?.department || '';
    document.getElementById('pdsAddress').value = record?.address || '';
    document.getElementById('pdsSchool').value = record?.school || '';
    document.getElementById('pdsSkills').value = record?.skills || '';
}

async function loadUserDashboardData() {
    const [announcementData, leaveData, trainingData, performanceData, pdsData] = await Promise.all([
        apiRequest('/api/announcements'),
        apiRequest('/api/leaves'),
        apiRequest('/api/training'),
        apiRequest('/api/performance'),
        apiRequest('/api/pds')
    ]);

    announcements = announcementData.data || [];
    leaves = leaveData.data || [];
    training = trainingData.data || [];
    performance = performanceData.data || [];

    renderAnnouncements();
    renderLeaves();
    renderTraining();
    renderPerformance();
    renderDashboardStats();
    populatePdsForm(pdsData.data || null);
}

async function guardUserAccess() {
    const result = await apiRequest('/api/me');
    if (!result.authenticated) {
        window.location.href = 'index.html';
        return;
    }

    me = result.data;
    setUserDisplayName();
    if (me.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    }
}

async function submitLeave(event) {
    event.preventDefault();

    const payload = {
        leaveType: document.getElementById('leaveType').value.trim(),
        startDate: document.getElementById('leaveStart').value,
        endDate: document.getElementById('leaveEnd').value,
        reason: document.getElementById('leaveReason').value.trim()
    };

    await apiRequest('/api/leaves', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    event.target.reset();
    showMessage('Leave request submitted.');
    await loadUserDashboardData();
}

async function submitPds(event) {
    event.preventDefault();

    const payload = {
        fullName: document.getElementById('pdsFullName').value.trim(),
        contactNo: document.getElementById('pdsContact').value.trim(),
        emergencyContact: document.getElementById('pdsEmergency').value.trim(),
        positionTitle: document.getElementById('pdsPosition').value.trim(),
        department: document.getElementById('pdsDepartment').value.trim(),
        address: document.getElementById('pdsAddress').value.trim(),
        school: document.getElementById('pdsSchool').value.trim(),
        skills: document.getElementById('pdsSkills').value.trim()
    };

    await apiRequest('/api/pds', {
        method: 'PUT',
        body: JSON.stringify(payload)
    });

    showMessage('PDS updated successfully.');
}

function handleChat(event) {
    event.preventDefault();
    const input = document.getElementById('chatInput');
    const question = input.value.trim();
    if (!question) return;

    appendChat(question, 'user');
    appendChat(chatbotReply(question), 'bot');
    input.value = '';
}

async function logout() {
    await apiRequest('/api/logout', { method: 'POST' });
    window.location.href = 'index.html';
}

function setupSectionNavigation() {
    const buttons = Array.from(document.querySelectorAll('.side-btn[data-target]'));
    const sections = Array.from(document.querySelectorAll('.dashboard-section'));

    const showSection = sectionId => {
        sections.forEach(section => {
            section.classList.toggle('is-hidden', section.id !== sectionId);
        });

        buttons.forEach(button => {
            button.classList.toggle('is-active', button.dataset.target === sectionId);
        });
    };

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            showSection(button.dataset.target);
            if (window.matchMedia('(max-width: 940px)').matches) {
                document.body.classList.remove('user-sidebar-open');
            }
        });
    });

    const initiallyActive = buttons.find(button => button.classList.contains('is-active'));
    showSection(initiallyActive ? initiallyActive.dataset.target : 'user-dashboard');
}

function setupSidebarToggle() {
    const toggleButton = document.getElementById('userSidebarToggle');
    if (!toggleButton) return;

    toggleButton.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 940px)').matches) {
            document.body.classList.toggle('user-sidebar-open');
            return;
        }

        document.body.classList.toggle('user-sidebar-collapsed');
    });

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            document.body.classList.remove('user-sidebar-open');
        }
    });
}

function bindEvents() {
    document.getElementById('leaveForm').addEventListener('submit', event => {
        submitLeave(event).catch(error => showMessage(error.message, 'error'));
    });

    document.getElementById('pdsForm').addEventListener('submit', event => {
        submitPds(event).catch(error => showMessage(error.message, 'error'));
    });

    document.getElementById('chatForm').addEventListener('submit', handleChat);

    document.getElementById('refreshUser').addEventListener('click', () => {
        loadUserDashboardData().then(() => showMessage('Dashboard refreshed.')).catch(error => showMessage(error.message, 'error'));
    });

    document.getElementById('logoutUser').addEventListener('click', () => {
        logout().catch(error => showMessage(error.message, 'error'));
    });
}

async function init() {
    await guardUserAccess();
    document.body.classList.remove('user-sidebar-open');
    setupSidebarToggle();
    setupSectionNavigation();
    bindEvents();
    appendChat('Hello! I am your Civilian HR assistant. Ask me about dashboard features.', 'bot');
    await loadUserDashboardData();
}

init().catch(error => {
    showMessage(error.message, 'error');
});

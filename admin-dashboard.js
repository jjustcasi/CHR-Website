const adminMessage = document.getElementById('adminMessage');
const API_BASE_URL = window.location.port === '3000' ? '' : 'http://localhost:3000';
let announcements = [];
let users = [];
let leaves = [];
let pdsCurrent = null;
let performance = [];
let training = [];

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
    adminMessage.className = `message ${type}`;
    adminMessage.textContent = text;
    setTimeout(() => {
        adminMessage.className = 'message hidden';
    }, 3000);
}

function htmlEscape(text) {
    return String(text ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function setAdminDisplayName(profile) {
    const nameEl = document.getElementById('adminDisplayName');
    if (!nameEl || !profile) return;

    const fullName = profile.name || `${profile.fname || ''} ${profile.lname || ''}`.trim() || profile.email || 'Administrator';
    nameEl.textContent = fullName;
}

async function guardAdminAccess() {
    try {
        const me = await apiRequest('/api/me');
        if (!me.authenticated || me.data.role !== 'admin') {
            window.location.href = 'index.html';
            return;
        }

        setAdminDisplayName(me.data);
    } catch (error) {
        window.location.href = 'index.html';
    }
}

function renderAnalytics(stats) {
    document.getElementById('statTotalUsers').textContent = stats.totalUsers || 0;
    document.getElementById('statPendingLeaves').textContent = stats.pendingLeaves || 0;
    document.getElementById('statAnnouncements').textContent = stats.totalAnnouncements || 0;
    document.getElementById('statTraining').textContent = stats.totalTrainingRecords || 0;
}

function renderAnnouncements() {
    const container = document.getElementById('announcementList');

    if (!announcements.length) {
        container.innerHTML = '<p>No announcements yet.</p>';
        return;
    }

    container.innerHTML = announcements.map(item => `
        <div class="list-item">
            <h4>${htmlEscape(item.title)}</h4>
            <p>${htmlEscape(item.content)}</p>
            <small>Posted by ${htmlEscape(item.posted_by)} on ${new Date(item.created_at).toLocaleString()}</small>
            <div class="list-actions">
                <button class="btn btn-secondary" data-edit-announcement="${item.id}">Edit</button>
                <button class="btn btn-danger" data-delete-announcement="${item.id}">Delete</button>
            </div>
        </div>
    `).join('');
}

function renderUsers() {
    const wrap = document.getElementById('employeeTableWrap');

    if (!users.length) {
        wrap.innerHTML = '<p>No employees found.</p>';
        return;
    }

    wrap.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.id ?? ''}</td>
                        <td>${htmlEscape(user.name || `${user.fname || ''} ${user.lname || ''}`.trim())}</td>
                        <td>${htmlEscape(user.email)}</td>
                        <td>${htmlEscape(user.role || 'employee')}</td>
                        <td><button class="btn btn-danger" data-delete-user="${user.id}">Delete</button></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderLeaves() {
    const wrap = document.getElementById('leaveTableWrap');

    if (!leaves.length) {
        wrap.innerHTML = '<p>No leave requests submitted.</p>';
        return;
    }

    wrap.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Status</th>
                    <th>Comment</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${leaves.map(leave => `
                    <tr>
                        <td>${htmlEscape(leave.requester_name)}<br><small>${htmlEscape(leave.requester_email)}</small></td>
                        <td>${htmlEscape(leave.leave_type)}</td>
                        <td>${leave.start_date} to ${leave.end_date}</td>
                        <td>${htmlEscape(leave.status)}</td>
                        <td>
                            <textarea id="leave-comment-${leave.id}" placeholder="Admin comment">${htmlEscape(leave.admin_comment || '')}</textarea>
                        </td>
                        <td>
                            <button class="btn" data-approve-leave="${leave.id}">Approve</button>
                            <button class="btn btn-danger" data-reject-leave="${leave.id}">Reject</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderPerformance() {
    const wrap = document.getElementById('performanceTableWrap');

    if (!performance.length) {
        wrap.innerHTML = '<p>No performance reviews yet.</p>';
        return;
    }

    wrap.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Period</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Evaluator</th>
                </tr>
            </thead>
            <tbody>
                ${performance.map(item => `
                    <tr>
                        <td>${htmlEscape(item.employee_name)}<br><small>${htmlEscape(item.employee_email)}</small></td>
                        <td>${htmlEscape(item.review_period)}</td>
                        <td>${item.score}</td>
                        <td>${htmlEscape(item.status)}</td>
                        <td>${htmlEscape(item.evaluator)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderTraining() {
    const wrap = document.getElementById('trainingTableWrap');

    if (!training.length) {
        wrap.innerHTML = '<p>No training records yet.</p>';
        return;
    }

    wrap.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Employee</th>
                    <th>Course</th>
                    <th>Schedule</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                ${training.map(item => `
                    <tr>
                        <td>${htmlEscape(item.employee_name)}<br><small>${htmlEscape(item.employee_email)}</small></td>
                        <td>${htmlEscape(item.course_title)}<br><small>${htmlEscape(item.provider || '')}</small></td>
                        <td>${item.start_date || '-'} to ${item.end_date || '-'}</td>
                        <td>${htmlEscape(item.status)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function fillAnnouncementForm(item) {
    document.getElementById('announcementId').value = item.id;
    document.getElementById('announcementTitle').value = item.title;
    document.getElementById('announcementContent').value = item.content;
}

async function loadAllAdminData() {
    const [analyticsData, announcementData, userData, leaveData, performanceData, trainingData] = await Promise.all([
        apiRequest('/api/admin/analytics'),
        apiRequest('/api/announcements'),
        apiRequest('/api/users'),
        apiRequest('/api/leaves'),
        apiRequest('/api/performance'),
        apiRequest('/api/training')
    ]);

    announcements = announcementData.data || [];
    users = userData.data || [];
    leaves = leaveData.data || [];
    performance = performanceData.data || [];
    training = trainingData.data || [];

    renderAnalytics(analyticsData.data || {});
    renderAnnouncements();
    renderUsers();
    renderLeaves();
    renderPerformance();
    renderTraining();
}

async function saveAnnouncement(event) {
    event.preventDefault();
    const id = document.getElementById('announcementId').value;
    const payload = {
        title: document.getElementById('announcementTitle').value.trim(),
        content: document.getElementById('announcementContent').value.trim()
    };

    if (!payload.title || !payload.content) {
        showMessage('Please provide title and content.', 'error');
        return;
    }

    if (id) {
        await apiRequest(`/api/announcements/${id}`, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        showMessage('Announcement updated.');
    } else {
        await apiRequest('/api/announcements', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showMessage('Announcement posted.');
    }

    document.getElementById('announcementForm').reset();
    document.getElementById('announcementId').value = '';
    await loadAllAdminData();
}

async function handleAnnouncementActions(event) {
    const editId = event.target.getAttribute('data-edit-announcement');
    const deleteId = event.target.getAttribute('data-delete-announcement');

    if (editId) {
        const item = announcements.find(entry => String(entry.id) === String(editId));
        if (item) fillAnnouncementForm(item);
    }

    if (deleteId) {
        if (!confirm('Delete this announcement?')) return;
        await apiRequest(`/api/announcements/${deleteId}`, { method: 'DELETE' });
        showMessage('Announcement deleted.');
        await loadAllAdminData();
    }
}

async function handleDeleteUser(event) {
    const userId = event.target.getAttribute('data-delete-user');
    if (!userId) return;

    if (!confirm('Delete this employee account?')) return;
    await apiRequest(`/api/users/${userId}`, { method: 'DELETE' });
    showMessage('Employee deleted.');
    await loadAllAdminData();
}

async function handleLeaveReview(event, status) {
    const leaveId = event.target.getAttribute(status === 'approved' ? 'data-approve-leave' : 'data-reject-leave');
    if (!leaveId) return;

    const comment = document.getElementById(`leave-comment-${leaveId}`).value;
    await apiRequest(`/api/leaves/${leaveId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status, comment })
    });
    showMessage(`Leave request ${status}.`);
    await loadAllAdminData();
}

async function fetchPdsByUserId(event) {
    event.preventDefault();
    const userId = Number(document.getElementById('pdsUserId').value);
    if (!userId) return;

    const result = await apiRequest(`/api/pds?userId=${userId}`);
    pdsCurrent = result.data;
    document.getElementById('pdsPreview').textContent = pdsCurrent
        ? JSON.stringify(pdsCurrent, null, 2)
        : 'No PDS found for this user.';
}

function exportPdsPdf() {
    if (!pdsCurrent) {
        showMessage('Load a PDS record first.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const lines = [
        'Civilian HR - PDS Export',
        '----------------------------------------'
    ];

    Object.entries(pdsCurrent).forEach(([key, value]) => {
        lines.push(`${key}: ${value ?? ''}`);
    });

    doc.setFontSize(11);
    doc.text(lines, 10, 15);
    doc.save(`pds-user-${pdsCurrent.user_id || 'record'}.pdf`);
}

async function savePerformance(event) {
    event.preventDefault();

    const payload = {
        userId: document.getElementById('perfUserId').value || null,
        employeeName: document.getElementById('perfEmployeeName').value.trim(),
        employeeEmail: document.getElementById('perfEmployeeEmail').value.trim(),
        reviewPeriod: document.getElementById('perfReviewPeriod').value.trim(),
        score: Number(document.getElementById('perfScore').value),
        status: document.getElementById('perfStatus').value,
        remarks: document.getElementById('perfRemarks').value.trim()
    };

    await apiRequest('/api/performance', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    event.target.reset();
    showMessage('Performance review saved.');
    await loadAllAdminData();
}

async function saveTraining(event) {
    event.preventDefault();

    const payload = {
        userId: document.getElementById('trainUserId').value || null,
        employeeName: document.getElementById('trainEmployeeName').value.trim(),
        employeeEmail: document.getElementById('trainEmployeeEmail').value.trim(),
        courseTitle: document.getElementById('trainCourseTitle').value.trim(),
        provider: document.getElementById('trainProvider').value.trim(),
        startDate: document.getElementById('trainStartDate').value || null,
        endDate: document.getElementById('trainEndDate').value || null,
        status: document.getElementById('trainStatus').value,
        remarks: document.getElementById('trainRemarks').value.trim()
    };

    await apiRequest('/api/training', {
        method: 'POST',
        body: JSON.stringify(payload)
    });

    event.target.reset();
    showMessage('Training record added.');
    await loadAllAdminData();
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
            if (window.matchMedia('(max-width: 1100px)').matches) {
                document.body.classList.remove('sidebar-open');
            }
        });
    });

    const initiallyActive = buttons.find(button => button.classList.contains('is-active'));
    showSection(initiallyActive ? initiallyActive.dataset.target : 'admin-analytics');
}

function setupSidebarToggle() {
    const toggleButton = document.getElementById('sidebarToggle');
    if (!toggleButton) return;

    toggleButton.addEventListener('click', () => {
        if (window.matchMedia('(max-width: 1100px)').matches) {
            document.body.classList.toggle('sidebar-open');
            return;
        }

        document.body.classList.toggle('sidebar-collapsed');
    });

    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            document.body.classList.remove('sidebar-open');
        }
    });
}

function bindEvents() {
    document.getElementById('announcementForm').addEventListener('submit', saveAnnouncement);
    document.getElementById('announcementReset').addEventListener('click', () => {
        document.getElementById('announcementForm').reset();
        document.getElementById('announcementId').value = '';
    });

    document.getElementById('announcementList').addEventListener('click', event => {
        handleAnnouncementActions(event).catch(error => showMessage(error.message, 'error'));
    });

    document.getElementById('employeeTableWrap').addEventListener('click', event => {
        handleDeleteUser(event).catch(error => showMessage(error.message, 'error'));
    });

    document.getElementById('leaveTableWrap').addEventListener('click', event => {
        if (event.target.hasAttribute('data-approve-leave')) {
            handleLeaveReview(event, 'approved').catch(error => showMessage(error.message, 'error'));
        }
        if (event.target.hasAttribute('data-reject-leave')) {
            handleLeaveReview(event, 'rejected').catch(error => showMessage(error.message, 'error'));
        }
    });

    document.getElementById('pdsFetchForm').addEventListener('submit', event => {
        fetchPdsByUserId(event).catch(error => showMessage(error.message, 'error'));
    });
    document.getElementById('pdsExport').addEventListener('click', exportPdsPdf);

    document.getElementById('performanceForm').addEventListener('submit', event => {
        savePerformance(event).catch(error => showMessage(error.message, 'error'));
    });

    document.getElementById('trainingForm').addEventListener('submit', event => {
        saveTraining(event).catch(error => showMessage(error.message, 'error'));
    });

    document.getElementById('refreshAdmin').addEventListener('click', () => {
        loadAllAdminData().then(() => showMessage('Dashboard refreshed.')).catch(error => showMessage(error.message, 'error'));
    });

    document.getElementById('logoutAdmin').addEventListener('click', () => {
        logout().catch(error => showMessage(error.message, 'error'));
    });
}

async function initAdminDashboard() {
    await guardAdminAccess();
    setupSidebarToggle();
    setupSectionNavigation();
    bindEvents();
    await loadAllAdminData();
}

initAdminDashboard().catch(error => {
    showMessage(error.message, 'error');
});

// dashboard.js
// Main Dashboard Controller (Logic & API only)
// View rendering is handled by js/dashboard_view.js

document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const DEMO_MODE = false;
    const API_BASE = IS_LOCAL ? 'http://localhost:3000/api' : '/api';
    window.API_BASE = API_BASE;

    // Define Functions First

    function loadUserInfo() {
        const userName = localStorage.getItem('user_name') || '사용자';
        const userId = localStorage.getItem('user_id');

        if (!userId) {
            window.location.href = 'login.html';
            return;
        }

        const elName = document.getElementById('userName');
        if (elName) elName.textContent = userName;

        const elInitial = document.getElementById('userInitial');
        if (elInitial) elInitial.textContent = userName.charAt(0).toUpperCase();

        const notifBadge = document.getElementById('notifBadge');
        if (notifBadge) {
            notifBadge.textContent = '5';
            notifBadge.style.display = 'block';
        }
    }

    function initializeMenu() {
        const initialUserId = localStorage.getItem('user_id');

        function checkSessionIntegrity() {
            const currentUserId = localStorage.getItem('user_id');
            if (currentUserId !== initialUserId) {
                alert('로그인 정보가 변경되었습니다. 페이지를 새로고침합니다.');
                window.location.reload();
            }
        }
        setInterval(checkSessionIntegrity, 2000);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') checkSessionIntegrity();
        });

        const menuItems = document.querySelectorAll('.nav-item[data-page]');
        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const pageName = item.dataset.page;
                menuItems.forEach(mi => mi.classList.remove('active'));
                item.classList.add('active');
                loadPage(pageName);
            });
        });
    }

    function updateActiveMenu(pageName) {
        const menuItems = document.querySelectorAll('.nav-item[data-page]');
        menuItems.forEach(mi => {
            if (mi.dataset.page === pageName) {
                mi.classList.add('active');
            } else {
                mi.classList.remove('active');
            }
        });
    }

    function loadPage(pageName) {
        const content = document.getElementById('mainContent');
        if (!content) return;

        switch (pageName) {
            case 'cases':
                content.innerHTML = window.getCasesPageHTML();
                initializeCasesPage();
                break;
            case 'guide':
                content.innerHTML = window.getGuidePageHTML();
                break;
            case 'profile':
                content.innerHTML = window.getProfilePageHTML();
                break;
            case 'notifications':
                content.innerHTML = window.getNotificationsPageHTML();
                initializeNotifications();
                break;
            case 'settings':
                content.innerHTML = window.getSettingsPageHTML();
                break;
            case 'help':
                content.innerHTML = window.getHelpPageHTML();
                break;
            default:
                content.innerHTML = window.getGuidePageHTML();
                updateActiveMenu('guide');
                break;
        }
    }

    function initializeCasesPage() {
        if (window.fetchAllCases) window.fetchAllCases();
        if (window.casePollInterval) clearInterval(window.casePollInterval);
        if (window.fetchAllCases) window.casePollInterval = setInterval(window.fetchAllCases, 3000);
    }

    // Connect to global scope for API calls
    window.fetchAllCases = async function () {
        const userId = localStorage.getItem('user_id');
        try {
            let data;
            if (DEMO_MODE) {
                data = { found: false, cases: [] };
            } else {
                const res = await fetch(`${API_BASE}/case/status?userId=${userId}`);
                data = await res.json();
            }

            const container = document.getElementById('casesContainer');
            const countEl = document.getElementById('caseCount');
            if (countEl) countEl.textContent = data.cases ? data.cases.length : 0;

            if (data.found && data.cases) {
                container.innerHTML = '';
                data.cases.forEach(caseItem => {
                    const caseCard = window.createCaseCard(caseItem);
                    container.appendChild(caseCard);
                });

                const newCaseCard = document.createElement('div');
                newCaseCard.className = 'glass-card';
                newCaseCard.style.cursor = 'pointer';
                newCaseCard.style.border = '2px dashed rgba(255,255,255,0.2)';
                newCaseCard.style.background = 'rgba(255,255,255,0.02)';
                newCaseCard.style.display = 'flex';
                newCaseCard.style.alignItems = 'center';
                newCaseCard.style.padding = '30px';
                newCaseCard.style.transition = 'all 0.3s';
                newCaseCard.onclick = () => openRegisterModal();
                newCaseCard.innerHTML = `
                   <div style="width: 60px; height: 60px; background: rgba(74, 222, 128, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 25px;">
                        <i class="fas fa-plus" style="font-size: 1.5rem; color: #4ade80;"></i>
                    </div>
                    <div>
                        <h3 style="margin: 0 0 5px 0; color: #4ade80;">+ 새로운 사건 등록</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">진행 중인 사건을 추가하여 관리하세요</p>
                    </div>
                `;
                container.appendChild(newCaseCard);

            } else {
                container.innerHTML = `
                    <div class="glass-card" style="text-align: center; padding: 40px;">
                        <i class="fas fa-folder-open" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 15px;"></i>
                        <h3 style="margin-bottom: 10px;">진행 중인 사건이 없습니다</h3>
                        <p style="color: var(--text-muted); margin-bottom: 20px;">새로 합의 요청을 보내거나 초대를 기다려주세요.</p>
                        <button class="btn btn-primary" onclick="window.openRegisterModal()">
                            <i class="fas fa-plus" style="margin-right: 8px;"></i> 새로운 사건 등록하기
                        </button>
                    </div>
                `;
            }
        } catch (e) {
            console.error('Failed to fetch cases:', e);
        }
    };

    window.openCaseDetail = (caseId, caseNumber, myRole, status, counterpartyName, registrationDate, roomTitle, summary, apologyStatus, apologyContent) => {
        localStorage.setItem('current_case_id', caseId);
        localStorage.setItem('current_case_number', caseNumber);
        localStorage.setItem('current_case_role', myRole);
        localStorage.setItem('current_case_status', status);
        localStorage.setItem('current_counterparty', counterpartyName);
        localStorage.setItem('current_case_date', registrationDate || '2024.01.01');
        localStorage.setItem('current_case_title', roomTitle || '');
        localStorage.setItem('current_case_summary', summary || '');
        localStorage.setItem('current_apology_status', apologyStatus || 'none');
        localStorage.setItem('current_apology_content', apologyContent || '');
        window.location.href = 'case_detail.html';
    };

    window.logout = function () {
        if (confirm('로그아웃 하시겠습니까?')) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    };

    // Modal Logic
    window.openRegisterModal = function () {
        document.getElementById('choiceModal').style.display = 'flex';
    };
    window.closeChoiceModal = function () {
        document.getElementById('choiceModal').style.display = 'none';
    };
    window.openCreateRoomModal = function () {
        closeChoiceModal();
        document.getElementById('createRoomModal').style.display = 'flex';
    };
    window.closeCreateRoomModal = function () {
        document.getElementById('createRoomModal').style.display = 'none';
    };
    window.submitCreateRoom = async function (e) {
        e.preventDefault();
        const title = document.getElementById('roomTitle').value;
        const password = document.getElementById('roomPassword').value;
        const summary = document.getElementById('roomSummary').value;
        const userId = localStorage.getItem('user_id');
        const radios = document.getElementsByName('roomRole');
        let role = null;
        for (const r of radios) if (r.checked) role = r.value;

        if (!title || !password || !role) return alert('필수 정보를 입력해주세요.');

        try {
            const res = await fetch(`${API_BASE}/case/create-room`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role, roomTitle: title, roomPassword: password, summary })
            });
            const data = await res.json();
            if (data.success) {
                alert('목록에 방이 개설되었습니다!');
                closeCreateRoomModal();
                if (window.fetchAllCases) window.fetchAllCases();
            } else {
                alert('개설 실패: ' + data.error);
            }
        } catch (err) {
            alert('오류 발생: ' + err.message);
        }
    };

    window.openJoinRoomModal = function () {
        closeChoiceModal();
        document.getElementById('joinRoomModal').style.display = 'flex';
        document.getElementById('roomSearchInput').value = '';
        if (window.searchRooms) window.searchRooms();
    };
    window.closeJoinRoomModal = function () {
        document.getElementById('joinRoomModal').style.display = 'none';
        document.getElementById('roomSearchInput').value = '';
    };
    window.searchRooms = async function () {
        const query = document.getElementById('roomSearchInput').value;
        const listArea = document.getElementById('roomListArea');
        if (listArea) listArea.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> 방 목록을 불러오는 중...</div>';
        const userId = localStorage.getItem('user_id');

        try {
            const res = await fetch(`${API_BASE}/case/search?query=${encodeURIComponent(query || '')}&userId=${userId}`);
            const data = await res.json();

            if (listArea && data.success && data.rooms.length > 0) {
                listArea.innerHTML = '';
                if (!query) {
                    const header = document.createElement('div');
                    header.style.padding = '0 5px 10px 5px';
                    header.style.fontSize = '0.9rem';
                    header.style.color = 'var(--text-muted)';
                    header.innerHTML = '<i class="fas fa-list"></i> 최근 개설된 방';
                    listArea.appendChild(header);
                }
                data.rooms.forEach(room => {
                    if (room.creatorId && (String(room.creatorId) === String(userId))) return;

                    const div = document.createElement('div');
                    div.className = 'glass-card';
                    div.style.padding = '15px';
                    div.style.cursor = 'pointer';
                    div.style.marginBottom = '10px';
                    div.style.border = '1px solid rgba(255,255,255,0.1)';
                    div.style.transition = '0.2s';
                    div.onmouseover = () => div.style.background = 'rgba(255,255,255,0.08)';
                    div.onmouseout = () => div.style.background = '';
                    div.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="font-weight: bold; font-size: 1.1rem; color: #fff;">${room.roomTitle}</div>
                            <span class="status-badge" style="background: rgba(74, 158, 255, 0.2); color: #4A9EFF; font-size: 0.75rem;">참여 가능</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 10px; font-size: 0.9rem; color: var(--text-muted);">
                            <span style="display: flex; align-items: center; gap: 5px;">
                                <span style="color: var(--secondary); font-weight: 600; font-size: 0.8rem; border: 1px solid var(--secondary); padding: 1px 6px; border-radius: 4px;">개설자</span>
                                <span style="color: #fff;">${room.creatorName}</span>
                                <span style="color: var(--text-muted);">(${room.creatorRole})</span>
                            </span>
                            <span style="width: 1px; height: 10px; background: rgba(255,255,255,0.2);"></span>
                            <span>${new Date(room.createdAt).toLocaleDateString()}</span>
                        </div>
                    `;
                    div.onclick = () => tryJoinRoom(room.id, room.roomTitle);
                    listArea.appendChild(div);
                });
            } else if (listArea) {
                listArea.innerHTML = '<div style="text-align: center; padding: 30px; color: var(--text-muted);">개설된 방이 없거나 검색 결과가 없습니다.</div>';
            }
        } catch (err) {
            console.error(err);
            if (listArea) listArea.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff6b6b;">목록을 불러오지 못했습니다.</div>';
        }
    };
    window.tryJoinRoom = async function (roomId, roomTitle) {
        const password = prompt(`[${roomTitle}] 방에 입장하려면 비밀번호를 입력하세요:`);
        if (!password) return;
        const userId = localStorage.getItem('user_id');
        try {
            const res = await fetch(`${API_BASE}/case/join-room`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, caseId: roomId, password })
            });
            const data = await res.json();
            if (data.success) {
                alert('입장 성공! 합의 방으로 연결되었습니다.');
                closeJoinRoomModal();
                if (window.fetchAllCases) window.fetchAllCases();
            } else {
                alert('입장 실패: ' + data.error);
            }
        } catch (err) {
            alert('오류: ' + err.message);
        }
    };

    // Notifications Logic
    function initializeNotifications() {
        if (window.fetchNotifications) window.fetchNotifications();
    }

    window.fetchNotifications = async function () {
        const userId = localStorage.getItem('user_id');
        const container = document.getElementById('notificationList');
        if (!container) return;

        try {
            const res = await fetch(`${API_BASE}/notification/${userId}`);
            const data = await res.json();

            if (data.success && data.notifications.length > 0) {
                container.innerHTML = '';
                data.notifications.forEach(noti => {
                    const div = document.createElement('div');
                    const isReadStyle = noti.isRead ? 'opacity: 0.6; background: rgba(255,255,255,0.03);' : 'background: rgba(100, 100, 255, 0.1); border-left: 3px solid #4A9EFF;';
                    const iconInfo = getNotificationIcon(noti.type);

                    div.style.cssText = `display: flex; gap: 15px; padding: 15px; border-radius: 8px; transition: 0.2s; ${isReadStyle}`;
                    div.innerHTML = `
                        <div style="width: 40px; height: 40px; background: ${iconInfo.bg}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <i class="fas ${iconInfo.icon}" style="color: ${iconInfo.color};"></i>
                        </div>
                        <div style="flex: 1; cursor: pointer;" onclick="handleNotificationClick(${noti.id}, ${noti.relatedCaseId})">
                            <div style="font-weight: 600; margin-bottom: 5px;">${noti.content}</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted);">${formatTimeAgo(noti.createdAt)}</div>
                        </div>
                        ${!noti.isRead ? `<button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;" onclick="markNotificationRead(${noti.id}, event)">확인</button>` : ''}
                    `;
                    container.appendChild(div);
                });
            } else {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <i class="far fa-bell-slash" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 15px;"></i>
                        <p style="color: var(--text-muted);">새로운 알림이 없습니다.</p>
                    </div>
                `;
            }
        } catch (e) {
            console.error(e);
            container.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff6b6b">알림을 불러오지 못했습니다.</div>';
        }
    };

    function getNotificationIcon(type) {
        switch (type) {
            case 'CHAT': return { icon: 'fa-comment', color: '#4A9EFF', bg: 'rgba(74, 158, 255, 0.2)' };
            case 'PROPOSAL': return { icon: 'fa-hand-holding-usd', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.2)' };
            case 'CASE_UPDATE': return { icon: 'fa-folder-open', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.2)' };
            default: return { icon: 'fa-bell', color: '#a8a29e', bg: 'rgba(255,255,255,0.1)' };
        }
    }

    function formatTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return '방금 전';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
        return `${Math.floor(diffInSeconds / 86400)}일 전`;
    }

    window.handleNotificationClick = async function (id, caseId) {
        await window.markNotificationRead(id);
        if (caseId) {
            alert("해당 사건으로 이동합니다 (상세 구현 필요)");
        }
    };

    window.markNotificationRead = async function (id, event) {
        if (event) event.stopPropagation();
        try {
            await fetch(`${API_BASE}/notification/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id })
            });
            window.fetchNotifications();
        } catch (e) { console.error(e); }
    };

    window.markAllNotificationsRead = async function () {
        if (!confirm("모든 알림을 읽음 처리하시겠습니까?")) return;
        const userId = localStorage.getItem('user_id');
        try {
            await fetch(`${API_BASE}/notification/read`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, all: true })
            });
            window.fetchNotifications();
        } catch (e) { console.error(e); }
    };

    // ==================== EXECUTION (Moved to bottom) ====================
    loadUserInfo();
    initializeMenu();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('open_detail') === 'true') {
        window.location.href = 'case_detail.html';
        return;
    }
    const initialPage = urlParams.get('page') || 'guide';

    // Now functions like fetchAllCases are defined and assigned to window
    // Load page handles render and API init
    loadPage(initialPage);
    updateActiveMenu(initialPage);

});
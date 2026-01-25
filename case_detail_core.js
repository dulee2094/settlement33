
// case_detail_core.js
// Main entry point for the Case Detail Page
// Depends on: case_detail_view.js, case_detail_chat.js, case_detail_docs.js, case_detail_agreement.js

document.addEventListener('DOMContentLoaded', () => {
    // Environment
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // 1. Load Data
    loadCaseData();

    // 2. Initialize Menu Listeners
    initializeMenu();

    // 3. Session Integrity Check
    const initialUserId = JSON.parse(localStorage.getItem('user_info') || '{}').id;
    setInterval(() => {
        const currentUserInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        if (currentUserInfo.id !== initialUserId) {
            alert('로그인 정보가 변경되었습니다. 최신 정보로 갱신합니다.');
            window.location.reload();
        }
    }, 2000);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const currentUserInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
            if (currentUserInfo.id !== initialUserId) window.location.reload();
        }
    });

    // 4. Load Initial Content
    const savedTab = localStorage.getItem('active_tab_on_load');
    if (savedTab && window.activateMenu) {
        window.activateMenu(savedTab);
        localStorage.removeItem('active_tab_on_load');
    } else {
        // Safety check: Ensure getOverviewHTML is defined
        if (typeof window.getOverviewHTML === 'function') {
            window.loadContent('overview');
        } else {
            console.error('getOverviewHTML is not defined. Retrying in 100ms...');
            setTimeout(() => {
                if (typeof window.getOverviewHTML === 'function') {
                    window.loadContent('overview');
                } else {
                    console.error('getOverviewHTML still not defined. Please check script loading order.');
                    // Fallback: Show error message
                    const contentArea = document.getElementById('contentArea');
                    if (contentArea) {
                        contentArea.innerHTML = `
                            <div class="glass-card" style="max-width: 600px; margin: 0 auto; text-align: center; padding: 60px 20px;">
                                <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
                                <h3 style="margin-bottom: 15px; color: #fbbf24;">페이지 로딩 오류</h3>
                                <p style="color: var(--text-muted); margin-bottom: 30px;">
                                    페이지를 불러오는 중 문제가 발생했습니다.<br>
                                    페이지를 새로고침해주세요.
                                </p>
                                <button class="btn btn-primary" onclick="location.reload()">
                                    <i class="fas fa-redo"></i> 새로고침
                                </button>
                            </div>
                        `;
                    }
                }
            }, 100);
        }
    }

    // 5. Check Toast Messages
    if (localStorage.getItem('show_draft_applied_msg') === 'true') {
        setTimeout(() => {
            alert("📝 AI가 작성한 초안이 적용되었습니다.\n내용을 확인하고 [디자인 미리보기 및 전송]을 진행해주세요.");
        }, 500);
        localStorage.removeItem('show_draft_applied_msg');
    }

    // 6. Start Polling for Apology Status
    startApologyPolling();
});

function startApologyPolling() {
    const caseId = localStorage.getItem('current_case_id');
    if (!caseId) return;

    // Check every 3 seconds
    setInterval(() => {
        fetch(`/api/case/apology?caseId=${caseId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    const currentStatus = localStorage.getItem('current_apology_status');

                    // If status changed from 'none' to 'sent' (or anything else)
                    if (data.status !== 'none' && data.status !== currentStatus) {
                        localStorage.setItem('current_apology_status', data.status);
                        localStorage.setItem('current_apology_content', data.content);
                        if (data.date) {
                            const d = new Date(data.date);
                            localStorage.setItem('current_apology_date', d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                        }

                        // Check active tab
                        const activeItem = document.querySelector('.nav-item.active');
                        const activeMenu = activeItem ? activeItem.dataset.menu : '';

                        if (activeMenu === 'apology') {
                            // Reload content to show the new apology
                            window.loadContent('apology');
                            // Optional: Alert notification
                            // alert("📨 새로운 사과문이 도착했습니다.");
                        } else {
                            // Show notification indicator/alert if elsewhere
                            // (Can be added later, for now just ensure data is fresh)
                        }
                    }
                }
            })
            .catch(err => console.error('Polling error:', err));
    }, 3000);
}

function loadCaseData() {
    const caseNumber = localStorage.getItem('current_case_number');
    const caseTitle = localStorage.getItem('current_case_title');
    const myRole = localStorage.getItem('current_case_role');
    const status = localStorage.getItem('current_case_status');
    const counterparty = localStorage.getItem('current_counterparty');

    if (!caseNumber && !caseTitle) {
        return;
    }

    const displayTitle = caseTitle || caseNumber;

    const elHeaderCase = document.getElementById('headerCaseNumber');
    const elHeaderRole = document.getElementById('headerMyRole');
    const elHeaderCounter = document.getElementById('headerCounterparty');
    const elHeaderStatus = document.getElementById('headerStatus');
    const elSidebarCase = document.getElementById('sidebarCaseNumber');
    const elSidebarCounter = document.getElementById('sidebarCounterparty');

    if (elHeaderCase) {
        elHeaderCase.textContent = displayTitle;
        if (caseTitle) elHeaderCase.setAttribute('title', `사건번호: ${caseNumber}`);
    }
    if (elHeaderRole) elHeaderRole.textContent = window.getRoleText(myRole);
    if (elHeaderCounter) elHeaderCounter.textContent = counterparty;
    if (elHeaderStatus) elHeaderStatus.textContent = window.getStatusText(status);

    if (elSidebarCase) elSidebarCase.textContent = displayTitle;
    if (elSidebarCounter) elSidebarCounter.textContent = counterparty;

    // Sync Apology Status
    const caseId = localStorage.getItem('current_case_id');
    if (caseId) {
        fetch(`/api/case/apology?caseId=${caseId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.status !== 'none') {
                    localStorage.setItem('current_apology_status', data.status);
                    localStorage.setItem('current_apology_content', data.content);
                    if (data.date) {
                        const d = new Date(data.date);
                        localStorage.setItem('current_apology_date', d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                    }
                }
            })
            .catch(err => console.error('Sync error:', err));
    }
}

function initializeMenu() {
    const menuItems = document.querySelectorAll('.nav-item[data-menu]');

    // Expose activateMenu globally
    window.activateMenu = function (menuName) {
        const targetItem = document.querySelector(`.nav-item[data-menu="${menuName}"]`);
        if (targetItem) {
            menuItems.forEach(mi => mi.classList.remove('active'));
            targetItem.classList.add('active');
        }
        window.loadContent(menuName);
        window.scrollTo(0, 0);
    };

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const menuName = item.dataset.menu;
            window.activateMenu(menuName);
        });
    });
}

// Global router function
window.loadContent = function (menuName) {
    const contentArea = document.getElementById('contentArea');
    if (!contentArea) return;

    // Helper function to check if function exists
    const safeCall = (funcName, fallbackHTML) => {
        if (typeof window[funcName] === 'function') {
            return window[funcName]();
        } else {
            console.error(`${funcName} is not defined`);
            return fallbackHTML || `
                <div class="glass-card" style="max-width: 600px; margin: 0 auto; text-align: center; padding: 60px 20px;">
                    <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
                    <h3 style="margin-bottom: 15px; color: #fbbf24;">콘텐츠 로딩 오류</h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">
                        이 섹션을 불러오는 중 문제가 발생했습니다.<br>
                        페이지를 새로고침해주세요.
                    </p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-redo"></i> 새로고침
                    </button>
                </div>
            `;
        }
    };

    switch (menuName) {
        case 'overview':
            contentArea.innerHTML = safeCall('getOverviewHTML');
            break;
        case 'proposal':
            contentArea.innerHTML = safeCall('getProposalHTML');
            // initializeProposal is possibly from case_proposal.js if it exists, checking import order.
            if (window.initializeProposal) window.initializeProposal();
            break;
        case 'analysis':
            contentArea.innerHTML = safeCall('getAnalysisHTML');
            setTimeout(() => { if (window.initializeChart) window.initializeChart(); }, 100);
            break;
        case 'chat':
            contentArea.innerHTML = safeCall('getChatHTML');
            if (window.initializeChat) window.initializeChat();
            break;
        case 'apology':
            contentArea.innerHTML = safeCall('getApologyHTML');
            if (window.loadApologyImage) window.loadApologyImage();
            break;
        case 'agreement':
            contentArea.innerHTML = safeCall('getAgreementHTML');
            break;
        case 'documents':
            contentArea.innerHTML = safeCall('getDocumentsHTML');
            if (window.loadDocuments) window.loadDocuments();
            break;
        case 'mediation':
            contentArea.innerHTML = safeCall('getMediationHTML');
            break;
        case 'account':
            contentArea.innerHTML = safeCall('getAccountInfoHTML');
            setTimeout(() => {
                if (window.initializeSignaturePad) window.initializeSignaturePad();
                if (window.loadPaymentRequestStatus) window.loadPaymentRequestStatus();
            }, 100);
            break;
        default:
            contentArea.innerHTML = safeCall('getOverviewHTML');
    }
};

window.goToStep2 = function () {
    const step1 = document.getElementById('step1_verification');
    const step2 = document.getElementById('step2_action');
    if (step1 && step2) {
        step1.style.display = 'none';
        step2.style.display = 'block';
        window.scrollTo(0, 0);
    }
};

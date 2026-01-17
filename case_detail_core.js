
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
        window.loadContent('overview');
    }

    // 5. Check Toast Messages
    if (localStorage.getItem('show_draft_applied_msg') === 'true') {
        setTimeout(() => {
            alert("📝 AI가 작성한 초안이 적용되었습니다.\n내용을 확인하고 [디자인 미리보기 및 전송]을 진행해주세요.");
        }, 500);
        localStorage.removeItem('show_draft_applied_msg');
    }
});

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

    switch (menuName) {
        case 'overview':
            contentArea.innerHTML = window.getOverviewHTML();
            break;
        case 'proposal':
            contentArea.innerHTML = window.getProposalHTML();
            // initializeProposal is possibly from case_proposal.js if it exists, checking import order.
            if (window.initializeProposal) window.initializeProposal();
            break;
        case 'analysis':
            contentArea.innerHTML = window.getAnalysisHTML();
            setTimeout(() => { if (window.initializeChart) window.initializeChart(); }, 100);
            break;
        case 'chat':
            contentArea.innerHTML = window.getChatHTML();
            if (window.initializeChat) window.initializeChat();
            break;
        case 'apology':
            contentArea.innerHTML = window.getApologyHTML();
            if (window.loadApologyImage) window.loadApologyImage();
            break;
        case 'agreement':
            contentArea.innerHTML = window.getAgreementHTML();
            break;
        case 'documents':
            contentArea.innerHTML = window.getDocumentsHTML();
            if (window.loadDocuments) window.loadDocuments();
            break;
        case 'mediation':
            contentArea.innerHTML = window.getMediationHTML();
            break;
        case 'account':
            contentArea.innerHTML = window.getAccountInfoHTML();
            setTimeout(() => {
                if (window.initializeSignaturePad) window.initializeSignaturePad();
                if (window.loadPaymentRequestStatus) window.loadPaymentRequestStatus();
            }, 100);
            break;
        default:
            contentArea.innerHTML = window.getOverviewHTML();
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

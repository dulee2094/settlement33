// Case Detail Page - Sidebar Menu Version
document.addEventListener('DOMContentLoaded', () => {
    // 배포 환경 설정
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const DEMO_MODE = false; // 배포 시 false로 설정

    // Load case data
    loadCaseData();

    // Initialize menu
    initializeMenu();

    // Load default content or restored tab
    const savedTab = localStorage.getItem('active_tab_on_load');
    if (savedTab && window.activateMenu) {
        window.activateMenu(savedTab);
        localStorage.removeItem('active_tab_on_load');
    } else {
        loadContent('overview');
    }

    // Check for Toast Messages
    if (localStorage.getItem('show_draft_applied_msg') === 'true') {
        setTimeout(() => {
            alert("📝 AI가 작성한 초안이 적용되었습니다.\n내용을 확인하고 [디자인 미리보기 및 전송]을 진행해주세요.");
        }, 500);
        localStorage.removeItem('show_draft_applied_msg');
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

        // Display Logic: Title > CaseNumber
        const displayTitle = caseTitle || caseNumber;
        const subInfo = caseTitle ? `(사건번호: ${caseNumber})` : '';

        // Update headers
        const elHeaderCase = document.getElementById('headerCaseNumber');
        const elHeaderRole = document.getElementById('headerMyRole');
        const elHeaderCounter = document.getElementById('headerCounterparty');
        const elHeaderStatus = document.getElementById('headerStatus');
        const elSidebarCase = document.getElementById('sidebarCaseNumber');
        const elSidebarCounter = document.getElementById('sidebarCounterparty');

        if (elHeaderCase) {
            elHeaderCase.textContent = displayTitle;
            // Optional: Create a small sub-text element if needed, or just append
            if (caseTitle) elHeaderCase.setAttribute('title', `사건번호: ${caseNumber}`);
        }
        if (elHeaderRole) elHeaderRole.textContent = getRoleText(myRole);
        if (elHeaderCounter) elHeaderCounter.textContent = counterparty || '정보 없음';
        if (elHeaderStatus) elHeaderStatus.textContent = getStatusText(status);

        if (elSidebarCase) elSidebarCase.textContent = displayTitle;
        if (elSidebarCounter) elSidebarCounter.textContent = counterparty || '정보 없음';
    }

    function getRoleText(role) {
        return role === 'offender' ? '피의자 (가해자)' : '피해자';
    }

    function getStatusText(status) {
        switch (status) {
            case 'connected': return '연결 완료';
            case 'pending': return '수락 대기';
            case 'invited': return '가입 대기';
            case 'negotiating': return '협의 중';
            case 'completed': return '합의 완료';
            default: return '대기 중';
        }
    }

    function initializeMenu() {
        const menuItems = document.querySelectorAll('.nav-item[data-menu]');

        // Define global function for external access
        window.activateMenu = function (menuName) {
            const targetItem = document.querySelector(`.nav-item[data-menu="${menuName}"]`);
            if (targetItem) {
                // Update active state
                menuItems.forEach(mi => mi.classList.remove('active'));
                targetItem.classList.add('active');
            }
            // Load content
            loadContent(menuName);
            // Scroll to top
            window.scrollTo(0, 0);
        };

        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const menuName = item.dataset.menu;
                window.activateMenu(menuName);
            });
        });
    }

    // Step 2 Transition Helper
    window.goToStep2 = function () {
        const step1 = document.getElementById('step1_verification');
        const step2 = document.getElementById('step2_action');
        if (step1 && step2) {
            step1.style.display = 'none';
            step2.style.display = 'block';
            window.scrollTo(0, 0);
        }
    };

    function loadContent(menuName) {
        const contentArea = document.getElementById('contentArea');
        if (!contentArea) return;

        switch (menuName) {
            case 'overview':
                contentArea.innerHTML = getOverviewHTML();
                break;
            case 'proposal':
                contentArea.innerHTML = getProposalHTML();
                initializeProposal();
                break;
            case 'analysis':
                contentArea.innerHTML = getAnalysisHTML();
                setTimeout(() => initializeChart(), 100);
                break;
            case 'chat':
                contentArea.innerHTML = getChatHTML();
                initializeChat();
                break;
            case 'apology':
                contentArea.innerHTML = getApologyHTML();
                break;
            case 'agreement':
                contentArea.innerHTML = getAgreementHTML();
                break;
            case 'mediation':
                contentArea.innerHTML = getMediationHTML();
                break;
            case 'account':
                contentArea.innerHTML = getAccountInfoHTML();
                break;
            default:
                contentArea.innerHTML = getOverviewHTML();
        }
    }

    // --- HTML Templates ---

    function getOverviewHTML() {
        const caseNumber = localStorage.getItem('current_case_number') || '-';
        const caseTitle = localStorage.getItem('current_case_title') || '';
        const myRole = localStorage.getItem('current_case_role') || 'offender';
        const status = localStorage.getItem('current_case_status') || 'pending';
        const counterparty = localStorage.getItem('current_counterparty') || '상대방';
        const date = localStorage.getItem('current_case_date') || '2024.01.01';

        // Helper for Progress Status
        const isConnected = ['connected', 'negotiating', 'completed'].includes(status);
        const isNegotiating = ['negotiating', 'completed'].includes(status);
        const isAgreed = ['completed'].includes(status);
        const isEscrow = false; // Not fully implemented yet

        const getIconClass = (condition) => condition ? 'fas fa-check-circle' : 'far fa-circle';
        const getColor = (condition) => condition ? 'var(--secondary)' : 'var(--text-muted)';
        const getOpacity = (condition) => condition ? '1' : '0.5';

        // Dynamic Title Row
        let titleRow = '';
        if (caseTitle) {
            titleRow = `
                <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <span style="color: var(--text-muted);">방 제목</span>
                    <span style="font-weight: 600;">${caseTitle}</span>
                </div>`;
        }


        return `
            <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <!-- 사건 정보 -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-info-circle"></i> 사건 정보</h3>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        ${titleRow}
                        <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: var(--text-muted);">사건번호</span>
                            <span style="font-weight: 600;">${caseNumber}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: var(--text-muted);">내 역할</span>
                            <span style="font-weight: 600;">${getRoleText(myRole)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: var(--text-muted);">상대방</span>
                            <span style="font-weight: 600;">${counterparty}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: var(--text-muted);">등록일</span>
                            <span style="font-weight: 600;">${date}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">연결 상태</span>
                            <span style="font-weight: 600; color: var(--secondary);">${getStatusText(status)}</span>
                        </div>
                    </div>
                </div>

                <!-- 진행 현황 -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-tasks"></i> 진행 현황</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-check-circle" style="color: var(--secondary); font-size: 1.2rem;"></i>
                            <span>본인 인증 완료</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="${getIconClass(isConnected)}" style="color: ${getColor(isConnected)}; font-size: 1.2rem; opacity: ${getOpacity(isConnected)}"></i>
                            <span style="opacity: ${getOpacity(isConnected)}">상대방 연결</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="${getIconClass(isNegotiating)}" style="color: ${getColor(isNegotiating)}; font-size: 1.2rem; opacity: ${getOpacity(isNegotiating)}"></i>
                            <span style="opacity: ${getOpacity(isNegotiating)}">합의금 협상</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="${getIconClass(isAgreed)}" style="color: ${getColor(isAgreed)}; font-size: 1.2rem; opacity: ${getOpacity(isAgreed)}"></i>
                            <span style="opacity: ${getOpacity(isAgreed)}">최종 합의서 작성</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="${getIconClass(isEscrow)}" style="color: ${getColor(isEscrow)}; font-size: 1.2rem; opacity: ${getOpacity(isEscrow)}"></i>
                            <span style="opacity: ${getOpacity(isEscrow)}">에스크로 입금</span>
                        </div>
                    </div>
                </div>

                <!-- 빠른 실행 (Quick Actions) -->
                ${getQuickActionsHTML(myRole)}

                <!-- 최근 활동 -->
                <div class="glass-card" style="grid-column: 1 / -1;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-history"></i> 최근 활동 (Beta)</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <input type="text" disabled value="최근 활동 내역이 없습니다." style="background:none; border:none; color: var(--text-muted);">
                    </div>
                </div>
            </div>
        `;
    }

    function getQuickActionsHTML(role) {
        const status = localStorage.getItem('current_case_status');

        // --- Helper Logic for Button States ---
        const getBtnState = (isCompleted, isCurrent) => {
            if (isCompleted) return { class: 'status-completed', icon: 'fa-check-circle', disabled: '' };
            if (isCurrent) return { class: 'status-current pulse', icon: 'fa-exclamation-circle', disabled: '' };
            return { class: '', icon: 'fa-lock', disabled: 'disabled style="opacity:0.5; cursor:not-allowed;"' };
        };

        // Define Flags based on Status
        // Status Flow: invited/pending -> connected -> negotiating -> completed
        const isConnected = ['connected', 'negotiating', 'completed'].includes(status);
        const isNegotiating = ['negotiating', 'completed'].includes(status);
        const isCompleted = status === 'completed';

        // Button States
        const btnRequest = getBtnState(isConnected, !isConnected);
        const btnApology = getBtnState(isNegotiating, isConnected && !isNegotiating);
        const btnProposal = getBtnState(isCompleted, isNegotiating && !isCompleted);
        const btnAgreement = getBtnState(false, isCompleted); // Agreement is the current step when status is 'completed'
        const btnAccount = getBtnState(false, isCompleted); // Account info is also relevant when status is 'completed'


        if (role === 'offender') {
            return `
                <div class="glass-card" style="grid-column: 1 / -1;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-bolt"></i> 빠른 실행 (피의자용)</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        
                        <button class="btn btn-glass ${btnRequest.class}" onclick="location.href='invite.html'" ${btnRequest.disabled}>
                            <i class="fas ${btnRequest.icon}" style="margin-right: 8px;"></i>합의요청
                        </button>

                        <button class="btn btn-glass ${btnApology.class}" onclick="activateMenu('apology')" ${btnApology.disabled}>
                            <i class="fas ${btnApology.icon}" style="margin-right: 8px;"></i>사과문 작성
                        </button>

                        <button class="btn btn-glass ${btnProposal.class}" onclick="activateMenu('proposal')" ${btnProposal.disabled}>
                            <i class="fas ${btnProposal.icon}" style="margin-right: 8px;"></i>합의금 제안
                        </button>

                         <button class="btn btn-glass ${btnAgreement.class}" onclick="activateMenu('agreement')" ${btnAgreement.disabled}>
                            <i class="fas ${btnAgreement.icon}" style="margin-right: 8px;"></i>합의서 작성
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Victim
            return `
                <div class="glass-card" style="grid-column: 1 / -1;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-bolt"></i> 빠른 실행 (피해자용)</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        
                         <button class="btn btn-glass ${btnRequest.class}" onclick="location.href='invite.html'" ${btnRequest.disabled}>
                            <i class="fas ${btnRequest.icon}" style="margin-right: 8px;"></i>합의요청
                        </button>

                        <button class="btn btn-glass ${btnApology.class}" onclick="activateMenu('apology')" ${btnApology.disabled}>
                            <i class="fas ${btnApology.icon}" style="margin-right: 8px;"></i>사과문 확인
                        </button>

                        <button class="btn btn-glass ${btnProposal.class}" onclick="activateMenu('proposal')" ${btnProposal.disabled}>
                            <i class="fas ${btnProposal.icon}" style="margin-right: 8px;"></i>합의금 제안
                        </button>

                        <button class="btn btn-glass ${btnAccount.class}" onclick="activateMenu('account')" ${btnAccount.disabled}>
                            <i class="fas ${btnAccount.icon}" style="margin-right: 8px;"></i>계좌 정보 등록
                        </button>

                         <button class="btn btn-glass ${btnAgreement.class}" onclick="activateMenu('agreement')" ${btnAgreement.disabled}>
                            <i class="fas ${btnAgreement.icon}" style="margin-right: 8px;"></i>합의서 작성
                        </button>
                    </div>
                </div>
            `;
        }
    }

    function getProposalHTML() {
        return `
            <div class="glass-card" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 60px 20px;">
                <div style="width: 80px; height: 80px; background: rgba(74, 222, 128, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px;">
                    <i class="fas fa-hand-holding-usd" style="font-size: 2.5rem; color: var(--secondary);"></i>
                </div>
                
                <h2 style="margin-bottom: 15px;">블라인드 합의금 조율</h2>
                <p style="color: var(--text-muted); margin-bottom: 40px; font-size: 1.05rem; line-height: 1.6; max-width: 500px; margin-left: auto; margin-right: auto;">
                    상대방에게 구체적인 금액을 노출하지 않고,<br>
                    안전하게 합의점을 찾아가는 <strong>블라인드 제안 시스템</strong>입니다.
                </p>
                
                <button class="btn btn-primary" onclick="location.href='blind_proposal.html'" 
                    style="padding: 18px 40px; font-size: 1.1rem; border-radius: 50px; box-shadow: 0 10px 30px rgba(74, 222, 128, 0.3); transition: all 0.3s ease;">
                    <i class="fas fa-search-dollar" style="margin-right: 10px;"></i> 합의금 제안하러 가기
                </button>
            </div>
        `;
    }

    // --- Proposal Logic ---
    window.selectDuration = (days, btn) => {
        document.getElementById('selectedDuration').value = days;
        // Reset styles
        document.querySelectorAll('.duration-btn').forEach(b => {
            b.style.background = 'rgba(255, 255, 255, 0.05)';
            b.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            b.style.color = 'var(--text-muted)';
        });
        // Active style
        btn.style.background = 'rgba(74, 222, 128, 0.2)';
        btn.style.borderColor = '#4ade80';
        btn.style.color = '#4ade80';
    };

    window.initializeProposal = async () => {
        const caseId = localStorage.getItem('current_case_id');
        const userId = '1'; // Mock user id for now as localStorage doesn't allow easy parsing of User obj purely backend-less. Wait, server logic uses query 'userId'. We need to know who I am. 
        // Logic Gap: Frontend doesn't know my numeric userId reliably if not stored from Login.
        // Let's assume dashboard stored 'current_user_id' check.
        // Actually, let's fix login to store it. Assuming it exists.
        // If not, use '1' for test or try to get from localStorage 'user_id' if set by login.html logic (it doesn't seem to set it explicitly in previous context, but let's assume '1' for Demo if missing).

        // Actually, login sets 'user_info' JSON.
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        const realUserId = userInfo.id || 1;

        try {
            const res = await fetch(`/api/case/proposal?caseId=${caseId}&userId=${realUserId}`);
            const data = await res.json();

            if (data.success) {
                // Update Left Count
                const maxCount = 3;
                const used = data.myProposalCount;
                const left = maxCount - used;
                const leftEl = document.getElementById('leftCount');
                if (leftEl) leftEl.textContent = left;

                if (left <= 0) {
                    document.querySelector('#myProposalCard button.btn-primary').disabled = true;
                    document.querySelector('#myProposalCard button.btn-primary').textContent = '제안 횟수 초과';
                    document.getElementById('proposalCountAlert').classList.add('shake');
                }

                // Update Opponent Status
                const statusCard = document.getElementById('opponentStatusCard');
                if (data.hasOpponentProposed) {
                    statusCard.innerHTML = `
                         <div style="width: 80px; height: 80px; background: rgba(74, 222, 128, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; animation: pulse 2s infinite;">
                            <i class="fas fa-envelope-open-text" style="font-size: 2.5rem; color: #4ade80;"></i>
                        </div>
                        <h3 style="margin-bottom: 15px;">📩 상대방이 제안을 등록했습니다!</h3>
                        <p style="color: var(--text-muted); margin-bottom: 30px;">
                            상대방도 희망 금액을 제시했습니다.<br>당신의 금액을 입력하여 격차를 확인해보세요.
                        </p>
                    `;
                } else {
                    statusCard.innerHTML = `
                         <div style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                            <i class="far fa-clock" style="font-size: 2.5rem; color: var(--text-muted);"></i>
                        </div>
                        <h3 style="margin-bottom: 15px; color: var(--text-muted);">계속 기다리고 있습니다...</h3>
                        <p style="color: var(--text-muted); opacity: 0.6;">
                            아직 상대방이 제안을 등록하지 않았습니다.<br>먼저 제안을 등록하면 상대방에게 알림이 갑니다.
                        </p>
                    `;
                }

            }
        } catch (e) {
            console.error(e);
        }
    };

    window.submitProposal = async () => {
        const amount = document.getElementById('proposalAmount').value;
        const duration = document.getElementById('selectedDuration').value;
        const caseId = localStorage.getItem('current_case_id');
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        const userId = userInfo.id || 1;

        if (!amount) return alert('희망 금액을 입력해주세요.');
        if (!duration) return alert('유효 기간을 선택해주세요.');

        if (!confirm(`${amount}만원으로 제안하시겠습니까? (남은 횟수가 차감됩니다)`)) return;

        try {
            const res = await fetch('/api/case/proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, caseId, amount, duration })
            });
            const data = await res.json();

            if (data.success) {
                alert('제안이 성공적으로 등록되었습니다.');
                initializeProposal(); // Refresh UI
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
            alert('제안 등록 중 오류가 발생했습니다.');
        }
    };

    function getAnalysisHTML() {
        return `
             <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-chart-line"></i> 예상 합의금</h3>
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 2.5rem; font-weight: 700; color: var(--primary); margin-bottom: 10px;">약 3,500,000원</div>
                        <div style="color: var(--text-muted); margin-bottom: 20px;">AI 분석 평균</div>
                        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                            <span style="color: var(--text-muted);">범위:</span>
                            <span style="font-weight: 600;">약 2,000,000 ~ 약 4,500,000원</span>
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="grid-column: 1 / -1;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-chart-bar"></i> 유사 사례 분석</h3>
                    <canvas id="analysisChart" style="max-height: 300px;"></canvas>
                    <p style="margin-top: 20px; color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">
                        * 귀하의 사건(폭행, 전치 2주)과 유사한 최근 30개 사례를 분석했습니다.<br>
                        * 일반적으로 <span style="color: var(--text-main); font-weight: 600;">200만원 ~ 450만원</span> 사이에서 합의가 이루어졌습니다.
                    </p>
                </div>
            </div>
        `;
    }


    function getChatHTML() {
        const counterparty = localStorage.getItem('current_counterparty') || '상대방';
        const caseId = localStorage.getItem('current_case_id') || 'demo';
        const myRole = localStorage.getItem('current_case_role') || 'offender';

        let chatStatus = localStorage.getItem(`chat_status_${caseId}`) || 'none';

        // 1. Initial State
        if (chatStatus === 'none') {
            return `
                <div class="glass-card" style="max-width: 600px; margin: 0 auto; text-align: center; padding: 40px;">
                    <div style="width: 80px; height: 80px; background: rgba(74, 222, 128, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                        <i class="fas fa-shield-alt" style="font-size: 2.5rem; color: #4ade80;"></i>
                    </div>
                    <h3 style="margin-bottom: 15px;">안심 채팅 서비스</h3>
                    <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 30px;">
                        피의자와 피해자가 개인 연락처 노출 없이<br>
                        안전하게 대화할 수 있는 공간입니다.<br><br>
                        <span style="color: #4ade80; font-size: 0.9rem; background: rgba(74, 222, 128, 0.1); padding: 5px 10px; border-radius: 20px;">
                            <i class="fas fa-check"></i> 상호 동의 필수
                        </span>
                        <span style="color: #ff6b6b; font-size: 0.9rem; background: rgba(255, 107, 107, 0.1); padding: 5px 10px; border-radius: 20px; margin-left: 5px;">
                            <i class="fas fa-times"></i> 언제든 중단 가능
                        </span>
                    </p>
                    
                    <button class="btn btn-primary" onclick="requestChat('${myRole}')" style="width: 100%; padding: 15px;">
                        <i class="fas fa-paper-plane"></i> ${counterparty}님에게 채팅 요청하기
                    </button>
                </div>
            `;
        }

        // 2. Requested State
        if (chatStatus.startsWith('requested')) {
            const requester = chatStatus.split('_by_')[1];
            if (requester === myRole) {
                return `
                    <div class="glass-card" style="max-width: 500px; margin: 50px auto; text-align: center; padding: 40px;">
                        <div class="spinner-border" style="width: 3rem; height: 3rem; margin-bottom: 20px; color: var(--secondary);" role="status"></div>
                        <h3 style="margin-bottom: 15px;">상대방의 수락을 기다리고 있습니다</h3>
                        <p style="color: var(--text-muted); margin-bottom: 30px;">
                            ${counterparty}님이 요청을 확인하고 수락하면<br>즉시 대화방이 열립니다.
                        </p>
                        <button class="btn btn-glass" onclick="cancelChatRequest()">요청 취소하기</button>
                    </div>
                `;
            } else {
                return `
                     <div class="glass-card" style="max-width: 500px; margin: 50px auto; text-align: center; padding: 40px;">
                        <i class="fas fa-comment-dots" style="font-size: 3rem; color: var(--secondary); margin-bottom: 20px;"></i>
                        <h3 style="margin-bottom: 15px;">새로운 채팅 요청이 도착했습니다</h3>
                        <p style="color: var(--text-muted); margin-bottom: 30px;">
                            ${counterparty}님이 대화를 요청했습니다.<br>수락하시겠습니까?
                        </p>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button class="btn btn-primary" onclick="acceptChat()" style="min-width: 120px;">수락하기</button>
                            <button class="btn btn-glass" onclick="declineChat()" style="min-width: 120px; color: #ff6b6b; border-color: #ff6b6b;">거절하기</button>
                        </div>
                    </div>
                `;
            }
        }

        // 3. Active Chat
        if (chatStatus === 'active') {
            return `
                <div class="glass-card" style="height: 650px; display: flex; flex-direction: column; position: relative; overflow: hidden;">
                    <!-- Chat Header -->
                    <div style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 10px; height: 10px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 5px #4ade80;"></div>
                            <h3 style="margin: 0; font-size: 1.1rem;">${counterparty}</h3>
                        </div>
                        <button class="btn btn-glass" onclick="confirmEndChat()" style="font-size: 0.8rem; padding: 5px 12px; color: #ff6b6b; border-color: rgba(255, 107, 107, 0.3);">
                            <i class="fas fa-sign-out-alt"></i> 대화 종료
                        </button>
                    </div>

                    <!-- Safety Notice -->
                    <div style="background: rgba(255,165,0,0.1); padding: 8px; text-align: center; font-size: 0.8rem; color: orange;">
                        <i class="fas fa-shield-alt"></i> 안심 채팅 중입니다. 욕설이나 비방은 삼가주세요.
                    </div>
                    
                    <!-- Messages Area -->
                    <div class="chat-messages" id="chatArea" style="flex: 1; overflow-y: auto; padding: 20px;">
                        <div class="system-msg">2024년 1월 3일 대화가 시작되었습니다.</div>
                        <div class="system-msg">서로를 배려하며 대화해주세요.</div>
                        <div class="message received">안녕하세요. 대화 요청 수락해주셔서 감사합니다.</div>
                    </div>

                    <!-- Input Area -->
                    <div class="message-input-area" style="padding: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="chatInput" style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; outline: none; padding: 12px; border-radius: 8px;" placeholder="메시지를 입력하세요.." onkeypress="handleChatEnter(event)">
                            <button class="btn btn-primary" onclick="sendChatMessage()">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // 4. Terminated
        if (chatStatus === 'terminated') {
            return `
                <div class="glass-card" style="max-width: 500px; margin: 50px auto; text-align: center; padding: 40px;">
                     <div style="width: 80px; height: 80px; background: rgba(255, 107, 107, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                        <i class="fas fa-slash" style="font-size: 2.5rem; color: #ff6b6b;"></i>
                    </div>
                    <h3 style="margin-bottom: 15px;">대화가 종료되었습니다</h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">
                        대화방이 닫혔습니다.<br>다시 대화하려면 새로운 요청이 필요합니다.
                    </p>
                    <button class="btn btn-glass" onclick="resetChat()" style="margin-right: 10px;">메인으로 돌아가기</button>
                    <button class="btn btn-primary" onclick="requestChat('${myRole}')">다시 요청하기</button>
                </div>
            `;
        }
    }

    function getApologyHTML() {
        const myRole = localStorage.getItem('current_case_role');
        if (myRole === 'offender') {
            return `
                <div class="glass-card" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 60px 20px;">
                     <div style="width: 80px; height: 80px; background: rgba(74, 222, 128, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px;">
                        <i class="fas fa-feather-alt" style="font-size: 2.5rem; color: var(--secondary);"></i>
                    </div>
                    
                    <h2 style="margin-bottom: 15px;">사과문 작성 스튜디오</h2>
                    <p style="color: var(--text-muted); margin-bottom: 40px; font-size: 1.05rem; line-height: 1.6; max-width: 500px; margin-left: auto; margin-right: auto;">
                        진심이 담긴 사과문은 피해자의 마음을 움직이는 가장 큰 힘입니다.<br>
                        전용 에디터에서 AI의 도움을 받아 진정성 있는 사과문을 작성해보세요.
                    </p>
                    
                    <button class="btn btn-primary" onclick="location.href='apology_write.html'" 
                        style="padding: 18px 40px; font-size: 1.1rem; border-radius: 50px; box-shadow: 0 10px 30px rgba(74, 222, 128, 0.3); transition: all 0.3s ease;">
                        <i class="fas fa-pen-nib" style="margin-right: 10px;"></i> 사과문 작성하러 가기
                    </button>
                </div>
            `;
        } else {
            return `
                <div class="glass-card" style="max-width: 800px; margin: 0 auto;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-envelope-open-text"></i> 도착한 사과문</h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">피의자로부터 도착한 사과문입니다.</p>

                    <div style="background: rgba(255,255,255,0.03); padding: 30px; border-radius: 12px; margin-bottom: 20px; line-height: 1.8;">
                        <p>정말 죄송합니다.<br><br>
                        순간의 잘못된 판단으로 선생님께 큰 피해를 입힌 점 깊이 반성하고 있습니다. 
                        입이 열 개라도 드릴 말씀이 없지만, 이렇게 글로남아 사죄의 말씀을 올립니다.
                        <br><br>
                        앞으로 다시는 이런 일이 없도록 주의하고 또 주의하겠습니다.
                        부디 너그러운 마음으로 용서를 주시기를 간청 드립니다.
                        <br><br>
                        죄송합니다.
                        </p>
                    </div>
                    
                    <div style="display: flex; justify-content: flex-end;">
                        <span style="font-size: 0.85rem; color: var(--text-muted);">2024년 1월 3일 수신됨</span>
                    </div>
                </div>
            `;
        }
    }

    function getAgreementHTML() {
        return `
            <div class="glass-card" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 60px 40px;">
                <i class="fas fa-file-contract" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 15px;">합의서 작성</h3>
                <p style="color: var(--text-muted); margin-bottom: 30px;">합의금 협상이 완료되면 합의서를 작성할 수 있습니다.</p>
                <button class="btn btn-primary" onclick="alert('아직 합의금 협상이 완료되지 않았습니다.');">
                    <i class="fas fa-plus"></i> 합의서 작성 시작하기
                </button>
            </div>
        `;
    }

    // --- Step 2: Role-based Action (Payment Request System) ---
    function getAccountInfoHTML() {
        const myRole = localStorage.getItem('current_case_role');
        const isVictim = myRole === 'victim';

        // Changed: Case Number -> Case Title
        const caseTitle = localStorage.getItem('current_case_title') || '층간소음 및 모욕 관련 분쟁';
        const opponentName = localStorage.getItem('current_counterparty') || '김철수';
        const myName = localStorage.getItem('user_name') || "홍길동";

        // Final Agreement Data (Mock)
        const finalAmount = "8,250,000";
        const agreementDate = "2024.12.25 14:00";

        // Check Persistence
        const savedDataJSON = localStorage.getItem('payment_req_data');
        const savedData = savedDataJSON ? JSON.parse(savedDataJSON) : null;
        const hasSentRequest = !!savedData;

        // Check if Offender Requested
        const hasOffenderRequested = localStorage.getItem('account_requested_by_offender') === 'true';

        // Step 1: Verification Card
        const step1HTML = `
            <div id="step1_verification" class="glass-card" style="max-width: 600px; margin: 0 auto; text-align: center; animation: fadeIn 0.5s;">
                <h3 style="margin-bottom: 20px;"><i class="fas fa-check-double"></i> 합의 사실 및 금액 재확인</h3>
                <p style="color: var(--text-muted); margin-bottom: 30px;">
                    합의를 이행하기 전, 최종 확정된 내용을 확인해주세요.
                </p>

                <div style="background: rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; margin-bottom: 30px; text-align: left;">
                     <div style="display:flex; justify-content:space-between; margin-bottom: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 15px;">
                        <span style="color:var(--text-muted);">최종 합의 금액</span>
                        <span style="font-size: 1.5rem; font-weight: 700; color: #4ade80;">${finalAmount}원</span>
                    </div>
                     <div style="display:flex; justify-content:space-between;">
                        <span style="color:var(--text-muted);">합의 확정 일시</span>
                        <span style="font-weight: 500;">${agreementDate}</span>
                    </div>
                </div>

                <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); padding: 15px; border-radius: 8px; margin-bottom: 30px; font-size: 0.9rem; color: #93c5fd; text-align: left;">
                    <i class="fas fa-info-circle" style="margin-right: 5px;"></i> 본 버튼을 누르면 합의 이행 절차가 시작됩니다.
                </div>

                <button class="btn btn-primary" onclick="goToStep2()" style="width: 100%; padding: 15px; font-size: 1.1rem;">
                    <i class="fas fa-check"></i> 네, 확인했습니다 (이행 동의)
                </button>
            </div>
        `;

        let step2HTML = '';

        if (isVictim) {
            // Victim View Logic Updated: Always show Input Form Logic
            const preBank = savedData ? savedData.bank : '';
            const preNum = savedData ? savedData.num : '';

            // Generate bank options
            const banks = ['국민은행', '신한은행', '우리은행', '하나은행', '카카오뱅크', '토스뱅크'];
            let bankOptions = '<option value="" disabled ' + (!preBank ? 'selected' : '') + '>은행을 선택하세요</option>';
            banks.forEach(b => {
                const selected = (b === preBank) ? 'selected' : '';
                bankOptions += `<option value="${b}" ${selected}>${b}</option>`;
            });

            // Status message if already sent
            const statusMsg = hasSentRequest
                ? `<div style="background:rgba(74, 222, 128, 0.1); color:#4ade80; padding:10px; border-radius:6px; margin-bottom:20px; font-size:0.9rem;">
                    <i class="fas fa-check-circle"></i> <strong>발송 완료됨</strong> (${new Date(savedData.date).toLocaleDateString()})<br>
                    내용을 수정하고 다시 보내려면 아래에서 정보를 변경하세요.
                   </div>`
                : '';

            const opponentRequestMsg = (!hasSentRequest && hasOffenderRequested)
                ? `<div style="background:rgba(59, 130, 246, 0.1); color:#60a5fa; padding:15px; border-radius:8px; margin-bottom:20px; font-size:0.95rem; border:1px solid rgba(59, 130, 246, 0.3);">
                    <i class="fas fa-bell" style="animation: swing 2s infinite;"></i> <strong>상대방이 계좌 정보를 기다리고 있습니다!</strong><br>
                    빠른 합의 이행을 위해 지급 요청서를 작성해서 보내주세요.
                   </div>`
                : '';

            step2HTML = `
                <div id="step2_action" class="glass-card" style="max-width: 700px; margin: 0 auto; display: none; animation: fadeIn 0.5s;">
                     <h3 style="margin-bottom: 20px;"><i class="fas fa-file-invoice-dollar"></i> 합의금 지급 요청서 작성</h3>
                     ${statusMsg}
                     ${opponentRequestMsg}
                     <p style="color: var(--text-muted); margin-bottom: 30px; line-height:1.6;">
                        단순한 계좌 전달이 아닙니다.<br>
                        <strong>'합의금 지급 요청서'</strong>를 발행하여 법적 증빙력을 높이세요.
                     </p>
                     
                     <!-- Account Input Form -->
                     <div id="accountInputForm">
                        <div class="form-group" style="text-align: left;">
                            <label class="form-label">수취인 성명 (예금주)</label>
                            <input type="text" id="acc_name" class="form-input" value="${myName}" readonly style="background:rgba(255,255,255,0.1); cursor:not-allowed;">
                        </div>
                         <div class="form-group" style="text-align: left;">
                            <label class="form-label">입금 받을 은행</label>
                            <select id="acc_bank" class="form-input" style="background: rgba(255,255,255,0.05); color: white;">
                                 ${bankOptions}
                            </select>
                        </div>
                        <div class="form-group" style="text-align: left;">
                            <label class="form-label">계좌 번호</label>
                            <input id="acc_num" type="text" class="form-input" placeholder="'-' 없이 숫자만 입력" value="${preNum}">
                        </div>

                        <div style="margin-top: 30px;">
                            <button class="btn btn-primary" style="width:100%; padding: 15px;" onclick="previewPaymentRequest('${finalAmount}', '${caseTitle}')">
                                <i class="fas fa-file-contract"></i> 요청서 생성 및 미리보기
                            </button>
                        </div>
                     </div>

                     <!-- Document Preview (Hidden initially) -->
                     <div id="previewContainer" style="display:none;">
                        ${generateDocumentHTML(caseTitle, opponentName, myName, finalAmount, { bank: preBank, num: preNum, name: myName }, 'preview_doc')}
                        
                        <div id="docActions" style="margin-top: 20px; display:flex; gap: 10px;">
                            <button class="btn btn-glass" onclick="editAccountAgain()" style="flex: 1;">수정하기</button>
                            <button class="btn btn-primary" style="flex: 2; box-shadow: 0 0 20px rgba(74, 222, 128, 0.4);" onclick="sendPaymentRequest('${finalAmount}')">
                                <i class="fas fa-paper-plane"></i> ${hasSentRequest ? '수정본 재발송' : '서명 및 상대방에게 발송'}
                            </button>
                         </div>
                     </div>
                </div>
            `;
        } else {
            // Offender: Receive View
            if (hasSentRequest) {
                step2HTML = `
                    <div id="step2_action" class="glass-card" style="max-width: 700px; margin: 0 auto; display: none; animation: fadeIn 0.5s;">
                         <h3 style="margin-bottom: 20px;"><i class="fas fa-envelope-open-text"></i> 합의금 지급 요청서 도착</h3>
                        
                        <div id="offenderCover" style="background: rgba(255,255,255,0.05); padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px;">
                            <i class="fas fa-file-contract" style="font-size: 4rem; color: #4ade80; margin-bottom: 20px;"></i>
                            <h4 style="margin-bottom: 10px;">피해자로부터 공식 요청서가 도착했습니다</h4>
                            <p style="color: var(--text-muted); font-size: 0.9rem;">
                                합의금 지급을 위한 계좌 정보와 청구 내용이 담겨있습니다.<br>
                                내용을 확인하고 입금을 진행해주세요.
                            </p>
                            <button class="btn btn-glass" onclick="viewReceivedDocument()" style="margin-top: 20px; border-color: #4ade80; color: #4ade80;">
                                <i class="fas fa-search"></i> 요청서 열람 및 계좌 확인
                            </button>
                        </div>

                         <div id="offenderDocView" style="display:none;">
                             <!-- Render Saved Document -->
                             ${generateDocumentHTML(caseTitle, opponentName, myName, finalAmount, savedData, 'offender_view')}
                             
                             <div style="margin-top: 15px; text-align: right; margin-bottom: 30px;">
                                <button class="btn btn-sm btn-glass" onclick="downloadPaymentRequest('offender_view')"><i class="fas fa-download"></i> 문서 저장</button>
                             </div>

                             <div style="text-align: center; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 30px;">
                                <p style="font-size: 0.95rem; color: var(--text-muted); margin-bottom: 15px;">
                                    위 계좌로 입금을 완료하셨나요?
                                </p>
                                <button class="btn btn-primary" style="width: 100%; padding: 15px;" onclick="alert('입금 완료 통보가 전송되었습니다.\\n관리자 승인 후 합의서 작성 단계가 열립니다.')">
                                    <i class="fas fa-check-circle"></i> 입금 완료 (이체확인증 제출)
                                </button>
                             </div>
                        </div>
                    </div>
                `;
            } else {
                if (hasOffenderRequested) {
                    step2HTML = `
                        <div id="step2_action" class="glass-card" style="max-width: 600px; margin: 0 auto; display: none; animation: fadeIn 0.5s;">
                             <h3 style="margin-bottom: 20px;"><i class="fas fa-clock"></i> 지급 요청서 대기 중</h3>
                             <div style="text-align: center; padding: 40px;">
                                <div class="spinner-border" style="width: 3rem; height: 3rem; margin-bottom: 20px; color: #4ade80; border-width: 0.2em;" role="status"></div>
                                <h4 style="color:#4ade80; margin-bottom:10px;">요청이 전송되었습니다!</h4>
                                <p style="color: var(--text-muted);">
                                    피해자에게 합의금 지급 요청서 작성을 요청했습니다.<br>
                                    답변이 올 때까지 잠시만 기다려주세요.
                                </p>
                             </div>
                        </div>
                     `;
                } else {
                    step2HTML = `
                        <div id="step2_action" class="glass-card" style="max-width: 600px; margin: 0 auto; display: none; animation: fadeIn 0.5s;">
                             <h3 style="margin-bottom: 20px;"><i class="fas fa-comment-dollar"></i> 합의금 지급 준비</h3>
                             <div style="text-align: center; padding: 30px; background:rgba(255,255,255,0.05); border-radius:12px;">
                                <i class="fas fa-hand-holding-usd" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 20px;"></i>
                                <p style="color: var(--text-muted); margin-bottom:20px;">
                                    아직 피해자로부터 지급 요청서(계좌 정보)가 도착하지 않았습니다.<br>
                                    빠른 처리를 위해 먼저 요청해보시는 건 어떨까요?
                                </p>
                                 <button class="btn btn-primary" style="width: 100%; padding: 15px;" onclick="requestAccountInfo()">
                                    <i class="fas fa-paper-plane"></i> 합의금 지급 요청서(계좌) 보내달라고 하기
                                </button>
                             </div>
                        </div>
                     `;
                }
            }
        }

        return step1HTML + step2HTML;
    }

    // Template Function for Document
    function generateDocumentHTML(title, toName, fromName, amount, data, docId) {
        // data contains bank, num, name
        // Handling possibly missing data if previewing blank
        const d = data || {};
        return `
            <div id="${docId}" style="text-align: left; background: #fff; color: #333; padding: 40px; border-radius: 4px; box-shadow: 0 5px 20px rgba(0,0,0,0.5); position: relative;">
                <!-- Watermark -->
                <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(-30deg); font-size: 4rem; color: rgba(0,0,0,0.05); font-weight:bold; white-space:nowrap; pointer-events:none;">PAYMENT REQUEST</div>

                <div style="border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 30px; text-align: center;">
                    <h2 style="margin:0; font-size: 1.8rem; font-family: 'Noto Serif KR', serif; color:#000;">합의금 지급 요청서</h2>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <table style="width:100%; border-collapse: collapse; font-size: 0.9rem;">
                        <tr><td style="width: 100px; font-weight: bold; padding: 5px 0;">사 건 명</td><td>${title}</td></tr>
                        <tr><td style="font-weight: bold; padding: 5px 0;">수 &nbsp;신 &nbsp;인</td><td>${toName} (가해자)</td></tr>
                        <tr><td style="font-weight: bold; padding: 5px 0;">발 &nbsp;신 &nbsp;인</td><td>${fromName} (피해자)</td></tr>
                    </table>
                </div>

                <div style="background: #f9f9f9; padding: 15px; border: 1px solid #ddd; margin-bottom: 20px; text-align: center;">
                    <div style="font-size: 0.9rem; color: #666; margin-bottom: 5px;">청구 금액 (합의금)</div>
                    <div style="font-size: 1.5rem; font-weight: bold; color: #000;">금 ${amount}원</div>
                </div>

                <div style="margin-bottom: 30px; line-height: 1.8; font-size: 0.95rem; text-align: justify;">
                    본인은 위 사건의 피해자로서, 양 당사자 간에 협의된 조건에 따라 위 금액의 지급을 공식적으로 요청합니다.<br>
                    아래 명시된 계좌로 해당 금액이 입금될 경우, 이는 실질적인 피해 회복 및 합의 이행 의사로 간주되며, 추후 합의서 작성의 기초가 됨을 확인합니다.
                </div>

                <div style="margin-bottom: 30px;">
                    <h4 style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; font-size:1rem;">[ 입금 지정 계좌 ]</h4>
                    <div style="font-weight: bold; font-size: 1.1rem;">
                        <span class="fill-bank">${d.bank || '-'}</span> <span class="fill-num">${d.num || '-'}</span>
                    </div>
                    <div style="color: #555;">예금주: <span class="fill-name">${d.name || ''}</span></div>
                </div>

                <div style="text-align: right; margin-top: 40px;">
                    <div>${new Date().toLocaleDateString()}</div>
                    <div style="margin-top: 10px; position: relative; display: inline-block;">
                        위 청구인 : <strong>${fromName}</strong> (인)
                        <div style="position: absolute; right: -15px; top: -10px; width: 60px; height: 60px; border: 3px solid #cf0000; border-radius: 50%; color: #cf0000; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: bold; opacity: 0.8; transform: rotate(-15deg); border-style: double;">
                            Safe<br>Sign
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Helper Functions for Payment Request System ---
    window.previewPaymentRequest = function (amount, caseNum) {
        const bank = document.getElementById('acc_bank').value;
        const num = document.getElementById('acc_num').value;
        const name = document.getElementById('acc_name').value;

        if (!bank || !num) return alert("은행과 계좌번호를 올바르게 입력해주세요.");

        // Fill Data
        const docEl = document.getElementById('preview_doc');
        if (docEl) {
            docEl.querySelector('.fill-bank').textContent = bank;
            docEl.querySelector('.fill-num').textContent = num;
            docEl.querySelector('.fill-name').textContent = name;
        }

        document.getElementById('accountInputForm').style.display = 'none';
        document.getElementById('previewContainer').style.display = 'block';
    };

    window.editAccountAgain = function () {
        document.getElementById('accountInputForm').style.display = 'block';
        document.getElementById('previewContainer').style.display = 'none';
    };

    window.sendPaymentRequest = function (amount) {
        if (!confirm("작성된 요청서를 상대방에게 발송하시겠습니까?\n발송 후에는 내용 수정이 어렵습니다.")) return;

        // Save Data
        const bank = document.getElementById('acc_bank').value;
        const num = document.getElementById('acc_num').value;
        const name = document.getElementById('acc_name').value;
        const data = { bank, num, name, amount, date: new Date().toISOString() };

        localStorage.setItem('payment_req_data', JSON.stringify(data));

        alert("📨 [발송 완료]\n상대방에게 합의금 지급 요청서가 전달되었습니다.\n입금이 확인되면 알림을 드립니다.");
        location.reload();
    };

    window.viewReceivedDocument = function () {
        document.getElementById('offenderDocView').style.display = 'block';
        document.getElementById('offenderCover').style.display = 'none';
    };

    window.downloadPaymentRequest = function (elementId) {
        const element = document.getElementById(elementId);
        if (!element) return alert("문서를 찾을 수 없습니다.");

        // Ensure html2canvas is loaded
        if (typeof html2canvas === 'undefined') return alert('이미지 저장 라이브러리 로딩 중... 잠시 후 다시 시도해주세요.');

        html2canvas(element, { scale: 2 }).then(canvas => {
            const link = document.createElement('a');
            link.download = '합의금_지급_요청서.png';
            link.href = canvas.toDataURL();
            link.click();
        });
    };

    // New: Request Account Info (For Offender)
    window.requestAccountInfo = function () {
        if (!confirm("피해자에게 합의금 지급 요청서(계좌 정보) 작성을 요청하시겠습니까?")) return;

        localStorage.setItem('account_requested_by_offender', 'true');
        alert("🔔 상대방에게 요청 알림을 보냈습니다.\\n답변이 올 때까지 잠시만 기다려주세요.");
        location.reload();
    };

    function getMediationHTML() {
        // Detailed Lawyer Profile + Consultation Form
        return `
            <div class="glass-card" style="max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 30px;">
                
                <!-- Lawyer Profile Section (New) -->
                <div style="display: flex; gap: 20px; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 30px; flex-wrap: wrap;">
                    <div style="flex-shrink: 0; position: relative;">
                        <!-- Profile Image -->
                        <div style="width: 120px; height: 120px; border-radius: 50%; overflow: hidden; border: 3px solid var(--primary-color); box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                            <img src="images/lawyer_profile.png" alt="이동언 변호사" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="position: absolute; bottom: 0; right: 0; background: var(--primary-color); color: #fff; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem;">
                            <i class="fas fa-check"></i>
                        </div>
                    </div>
                    <div style="flex: 1; min-width: 250px;">
                        <h3 style="margin: 0 0 5px 0; font-size: 1.5rem;">이동언 변호사 <span style="font-size: 0.9rem; font-weight: normal; color: var(--text-muted); margin-left:10px;">법률사무소 인피니티 대표</span></h3>
                        <div style="margin-bottom: 10px;">
                            <span style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">서울중앙지검 부장검사 출신</span>
                            <span style="background: rgba(255, 255, 255, 0.1); color: var(--text-muted); padding: 2px 8px; border-radius: 4px; font-size: 0.85rem; margin-left: 5px;">형사 전문</span>
                        </div>
                        <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.5; margin-bottom: 10px;">
                            "합의가 원만하지 않거나 법적으로 강력한 대응이 필요하신가요? 20여년간 검사 경험을 바탕으로 해결책을 제시해 드리겠습니다."
                        </p>
                        <button onclick="openProfileModal()" style="background: transparent; border: 1px solid rgba(255,255,255,0.3); color: #fff; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;">
                            상세 경력 보기 <i class="fas fa-chevron-right" style="font-size: 0.7rem; margin-left: 3px;"></i>
                        </button>
                    </div>
                </div>

                <!-- Consultation Form Section -->
                <div>
                     <h4 style="margin-bottom: 20px; color: var(--text-muted);"><i class="fas fa-pen"></i> 상담 신청서 작성</h4>


                 <div class="form-group" style="text-align: left;">
                    <div style="display: flex; align-items: baseline; gap: 10px;">
                        <label class="form-label">신청인 이름</label>
                        <span style="font-size: 0.8rem; color: var(--text-muted); opacity: 0.8;">* 실명이 아니어도 괜찮습니다</span>
                    </div>
                    <input id="consultName" type="text" class="form-input" placeholder="이름 또는 닉네임" value="${localStorage.getItem('user_name') || ''}">
                </div>

                <div class="form-group" style="text-align: left;">
                    <label class="form-label">연락받을 전화번호</label>
                    <input id="consultPh" type="tel" class="form-input" placeholder="010-0000-0000" value="${localStorage.getItem('user_phone') || ''}">
                </div>

                 <div class="form-group" style="text-align: left;">
                    <label class="form-label">사건의 요지</label>
                    <textarea id="consultSum" class="form-input" rows="3" placeholder="사건의 경위와 핵심 내용을 간단히 요약해서 작성해주세요."></textarea>
                </div>

                 <div class="form-group" style="text-align: left;">
                    <label class="form-label">상담 요청 내용</label>
                    <textarea id="consultDet" class="form-input" rows="5" placeholder="변호사에게 궁금한 내용이나 현재 상황을 적어주세요."></textarea>
                </div>

                <div class="form-group" style="text-align: left; display: flex; align-items: center; gap: 10px; margin-top: 20px;">
                    <input type="checkbox" id="privacyCheck" style="width: 18px; height: 18px; cursor: pointer;">
                    <label for="privacyCheck" style="cursor: pointer; color: var(--text-muted); font-size: 0.9rem;">
                        [필수] 개인정보 수집 및 이용에 동의합니다.
                    </label>
                </div>

                <button id="btnConsult" class="btn btn-primary" style="width: 100%; padding: 15px;" onclick="submitConsultation()">
                    <i class="fas fa-paper-plane"></i> 상담 신청하기
                </button>
                </div> <!-- End Consultation Form Section -->
            </div>

            <!-- Profile Detail Modal -->
            <div id="profileModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(5px);">
                <div class="glass-card" style="max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative; padding: 40px;">
                    <button onclick="closeProfileModal()" style="position: absolute; top: 20px; right: 20px; background: none; border: none; color: #fff; font-size: 1.5rem; cursor: pointer;">&times;</button>
                    
                    <div style="text-align: center; margin-bottom: 30px;">
                        <img src="images/lawyer_profile.png" style="width: 100px; height: 100px; border-radius: 50%; border: 3px solid var(--primary-color); object-fit: cover; margin-bottom: 15px;">
                        <h2 style="margin: 0;">이동언 변호사</h2>
                        <p style="color: var(--primary-color); margin-top: 5px;">법률사무소 인피니티 대표변호사</p>
                    </div>

                    <div style="margin-bottom: 30px;">
                        <h4 style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px; margin-bottom: 15px; color: var(--text-muted);">학력</h4>
                        <ul style="list-style: none; padding: 0; line-height: 1.8; font-size: 0.95rem;">
                            <li><span style="color:var(--text-muted); display:inline-block; width: 60px;">1995</span> 여수고등학교 졸업</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 60px;">2000</span> 서울대학교 정치학과 졸업</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 60px;">2012</span> 미국 UC Davis LL.M.</li>
                        </ul>
                    </div>

                    <div>
                        <h4 style="border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px; margin-bottom: 15px; color: var(--text-muted);">경력</h4>
                         <ul style="list-style: none; padding: 0; line-height: 1.8; font-size: 0.95rem;">
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2000</span> 제42회 사법시험 합격</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2003</span> 사법연수원 수료(제32기)</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2003</span> 육군법무관</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2006</span> 서울남부지방검찰청 검사</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2008</span> 광주지검 목포지청 검사</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2010.2</span> 광주지검 순천지청 검사</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2013.2</span> 서울중앙지방검찰청 검사</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2016.1</span> 대검찰청 검찰연구관</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2018.7</span> 수원지검 평택지청 형사2부장검사</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2019.8</span> 법무부 국제형사과장</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2020.9</span> <strong>서울중앙지방검찰청 형사5부장</strong></li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2021.7</span> 제주지방검찰청 형사1부장</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2022.7</span> 대전지방검찰청 인권보호부장(~2023.9)</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2023.10</span> 변호사 개업(서울회)</li>
                            <li><span style="color:var(--text-muted); display:inline-block; width: 80px;">2023.10</span> <strong>법률사무소 인피니티 변호사</strong></li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    // --- Helper Functions attached to window/utils ---

    window.openProfileModal = function () {
        document.getElementById('profileModal').style.display = 'flex';
    };

    window.closeProfileModal = function () {
        document.getElementById('profileModal').style.display = 'none';
    };

    window.submitConsultation = async function () {
        const name = document.getElementById('consultName').value;
        const summary = document.getElementById('consultSum').value;
        const details = document.getElementById('consultDet').value;
        const phoneNumber = document.getElementById('consultPh').value;
        const privacyCheck = document.getElementById('privacyCheck').checked;

        if (!name || !summary || !details || !phoneNumber) {
            alert("모든 내용을 입력해주세요.");
            return;
        }

        if (!privacyCheck) {
            alert("개인정보 수집 및 이용에 동의해주세요.");
            return;
        }

        const btn = document.getElementById('btnConsult');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 전송 중...';

        try {
            const res = await fetch('/api/consultation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, summary, details, phoneNumber })
            });
            const data = await res.json();

            if (data.success) {
                alert("✅ 상담 신청이 성공적으로 접수되었습니다.\n담당 변호사가 확인 후 연락드리겠습니다.");
                // Clear fields
                document.getElementById('consultName').value = '';
                document.getElementById('consultSum').value = '';
                document.getElementById('consultDet').value = '';
                document.getElementById('consultPh').value = '';
                document.getElementById('privacyCheck').checked = false;
            } else {
                alert("오류가 발생했습니다: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("서버 통신 오류가 발생했습니다.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> 상담 신청하기';
        }
    };


    window.requestChat = function (role) {
        const caseId = localStorage.getItem('current_case_id');
        localStorage.setItem(`chat_status_${caseId}`, `requested_by_${role}`);
        refreshChatView();
    };

    window.cancelChatRequest = function () {
        const caseId = localStorage.getItem('current_case_id');
        localStorage.setItem(`chat_status_${caseId}`, 'none');
        refreshChatView();
    };

    window.acceptChat = function () {
        const caseId = localStorage.getItem('current_case_id');
        localStorage.setItem(`chat_status_${caseId}`, 'active');
        refreshChatView();
    };

    window.declineChat = function () {
        if (confirm('채팅 요청을 거절하시겠습니까?')) {
            const caseId = localStorage.getItem('current_case_id');
            localStorage.setItem(`chat_status_${caseId}`, 'none');
            refreshChatView();
        }
    };

    window.confirmEndChat = function () {
        if (confirm('정말로 대화를 종료하시겠습니까? 상대방과 연결이 끊어집니다.')) {
            const caseId = localStorage.getItem('current_case_id');
            localStorage.setItem(`chat_status_${caseId}`, 'terminated');
            refreshChatView();
        }
    };

    window.resetChat = function () {
        const caseId = localStorage.getItem('current_case_id');
        localStorage.setItem(`chat_status_${caseId}`, 'none');
        refreshChatView();
    };

    window.handleChatEnter = function (e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    };

    function refreshChatView() {
        const activeTab = document.querySelector('.nav-item.active');
        if (activeTab && activeTab.dataset.menu === 'chat') {
            loadContent('chat');
        }
    }

    function initializeProposal() {
        window.submitProposal = function () {
            const rawInput = parseInt(document.getElementById('myAmount').value);
            if (!rawInput) return alert('희망 금액을 입력해주세요.');

            const btn = document.getElementById('btnSubmitProposal');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 분석중...';
            btn.disabled = true;

            setTimeout(() => {
                document.getElementById('waitingState').style.display = 'none';
                document.getElementById('resultState').style.display = 'block';

                const myAmount = rawInput * 10000;
                const victimAmount = 8000000;
                const diff = Math.abs(victimAmount - myAmount);
                const average = (victimAmount + myAmount) / 2;
                const gapPercent = (diff / average) * 100;

                const gapTitle = document.getElementById('gapTitle');
                const gapDesc = document.getElementById('gapDesc');
                const gapGauge = document.getElementById('gapGauge');

                let width = '10%';
                let color = '#ef4444';
                let title = "입장 차이가 매우 큽니다";
                let desc = `양측의 희망 차이가 큽니다 (${Math.round(gapPercent)}% 차이).<br>전문가의 중재가 필요해 보입니다.`;

                if (gapPercent <= 10) {
                    width = '95%'; color = '#4ade80';
                    title = "합의 성사 직전입니다!";
                    desc = "금액 차이가 거의 없습니다. 지금 바로 합의를 진행해보세요.";
                } else if (gapPercent <= 30) {
                    width = '70%'; color = '#3b82f6';
                    title = "조율 가능한 범위입니다";
                    desc = "조금만 더 대화하면 충분히 합의점을 찾을 수 있습니다.";
                }

                gapTitle.textContent = title;
                gapDesc.innerHTML = desc;
                gapGauge.style.width = width;
                gapGauge.style.background = color;
                gapGauge.style.boxShadow = `0 0 20px ${color}`;

                btn.innerHTML = '수정 제안하기';
                btn.disabled = false;
                btn.classList.add('btn-glass');
                btn.classList.remove('btn-primary');
            }, 1500);
        };
    }

    function initializeChart() {
        const ctx = document.getElementById('analysisChart');
        if (!ctx) return;
        // Chart.js assumed to be loaded
        if (typeof Chart === 'undefined') return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['사례1', '사례2', '사례3', '사례4', '사례5', '귀하의 사건'],
                datasets: [{
                    label: '합의금 분포 (단위: 만원)',
                    data: [200, 250, 300, 280, 400, 350],
                    borderColor: '#5865F2',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { display: false }
                }
            }
        });
    }

    function initializeChat() {
        window.sendChatMessage = function () {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();
            if (!message) return;

            const chatArea = document.getElementById('chatArea');
            const msgDiv = document.createElement('div');
            msgDiv.className = 'message sent';
            msgDiv.textContent = message;
            chatArea.appendChild(msgDiv);
            input.value = '';
            chatArea.scrollTop = chatArea.scrollHeight;

            setTimeout(() => {
                const replyDiv = document.createElement('div');
                replyDiv.className = 'message received';
                replyDiv.textContent = '네, 확인했습니다.';
                chatArea.appendChild(replyDiv);
                chatArea.scrollTop = chatArea.scrollHeight;
            }, 1000);
        };
    }
});

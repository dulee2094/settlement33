// Case Detail Page - Sidebar Menu Version
document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // 배포 시 정식 모드
    const DEMO_MODE = false;

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
        // Slight delay to allow UI to settle
        setTimeout(() => {
            alert("✅ AI가 작성한 초안이 적용되었습니다.\n내용을 확인하고 [디자인 미리보기 및 전송]을 진행해주세요.");
        }, 500);
        localStorage.removeItem('show_draft_applied_msg');
    }

    function loadCaseData() {
        const caseNumber = localStorage.getItem('current_case_number');
        const myRole = localStorage.getItem('current_case_role');
        const status = localStorage.getItem('current_case_status');
        const counterparty = localStorage.getItem('current_counterparty');

        if (!caseNumber) {
            alert('사건 정보를 불러올 수 없습니다.');
            window.location.href = 'dashboard.html';
            return;
        }

        // Update headers
        document.getElementById('headerCaseNumber').textContent = caseNumber;
        document.getElementById('headerMyRole').textContent = getRoleText(myRole);
        document.getElementById('headerCounterparty').textContent = counterparty || '알 수 없음';
        document.getElementById('headerStatus').textContent = getStatusText(status);

        // Update sidebar
        document.getElementById('sidebarCaseNumber').textContent = caseNumber;
        document.getElementById('sidebarCounterparty').textContent = counterparty || '알 수 없음';
    }

    function getRoleText(role) {
        return role === 'offender' ? '피의자 (가해자)' : '피해자';
    }

    function getStatusText(status) {
        switch (status) {
            case 'connected': return '연결 완료';
            case 'pending': return '수락 대기';
            case 'invited': return '가입 대기';
            default: return '대기 중';
        }
    }

    function initializeMenu() {
        const menuItems = document.querySelectorAll('.nav-item[data-menu]');

        // Define global function for external access (e.g. from Dashboard or Quick Actions)
        window.activateMenu = function (menuName) {
            const targetItem = document.querySelector(`.nav-item[data-menu="${menuName}"]`);
            if (targetItem) {
                // Update active state
                menuItems.forEach(mi => mi.classList.remove('active'));
                targetItem.classList.add('active');

                // Load content
                loadContent(menuName);

                // Scroll to top
                window.scrollTo(0, 0);
            }
        };

        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const menuName = item.dataset.menu;
                window.activateMenu(menuName);
            });
        });
    }

    function loadContent(menuName) {
        const contentArea = document.getElementById('contentArea');

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
        }
    }

    // HTML Templates
    function getOverviewHTML() {
        const caseNumber = localStorage.getItem('current_case_number');
        const myRole = localStorage.getItem('current_case_role');
        const status = localStorage.getItem('current_case_status');
        const counterparty = localStorage.getItem('current_counterparty');

        return `
            <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <!-- 사건 정보 -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-info-circle"></i> 사건 정보</h3>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: var(--text-muted);">사건정보<br><span style="font-size: 0.8em">(사건번호 등)</span></span>
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
                            <span style="font-weight: 600;">${localStorage.getItem('current_case_date') || '2024.01.01'}</span>
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
                            <i class="fas ${status === 'connected' ? 'fa-check-circle' : 'far fa-circle'}" style="color: ${status === 'connected' ? 'var(--secondary)' : 'var(--text-muted)'}; font-size: 1.2rem;"></i>
                            <span>상대방 연결</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="far fa-circle" style="color: var(--text-muted); font-size: 1.2rem; opacity: 0.5;"></i>
                            <span style="opacity: 0.5;">합의금 협상</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="far fa-circle" style="color: var(--text-muted); font-size: 1.2rem; opacity: 0.5;"></i>
                            <span style="opacity: 0.5;">최종 합의서 작성</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="far fa-circle" style="color: var(--text-muted); font-size: 1.2rem; opacity: 0.5;"></i>
                            <span style="opacity: 0.5;">에스크로 입금</span>
                        </div>
                    </div>
                </div>

                <!-- 빠른 액션 (Quick Actions) -->
                ${getQuickActionsHTML(myRole)}

                <!-- 최근 활동 -->
                <div class="glass-card" style="grid-column: 1 / -1;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-history"></i> 최근 활동</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; gap: 15px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                            <div style="color: var(--text-muted); font-size: 0.85rem; min-width: 80px;">방금 전</div>
                            <div><i class="fas fa-user-plus" style="color: var(--secondary); margin-right: 8px;"></i>사건 상세 페이지에 접속했습니다</div>
                        </div>
                        <div style="display: flex; gap: 15px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                            <div style="color: var(--text-muted); font-size: 0.85rem; min-width: 80px;">10분 전</div>
                            <div><i class="fas fa-comment" style="color: #4A9EFF; margin-right: 8px;"></i>상대방이 메시지를 전송했습니다</div>
                        </div>
                        <div style="display: flex; gap: 15px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                            <div style="color: var(--text-muted); font-size: 0.85rem; min-width: 80px;">1시간 전</div>
                            <div><i class="fas fa-hand-holding-usd" style="color: #FFB84D; margin-right: 8px;"></i>합의금 제안을 수신했습니다</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function getQuickActionsHTML(role) {
        const status = localStorage.getItem('current_case_status');
        let requestClass = '';
        let requestText = '합의요청 보내기';

        if (status === 'connected' || status === 'negotiating') {
            requestClass = 'status-completed';
            requestText = '합의요청 보내기 (완료)';
        } else if (status === 'pending' || status === 'invited') {
            requestClass = 'status-current';
            requestText = '합의요청 보내기 (진행 중)';
        }

        if (role === 'offender') {
            return `
                <div class="glass-card" style="grid-column: 1 / -1;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-bolt"></i> 빠른 액션 (피의자용)</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        
                        <!-- Step 0: Send Settlement Request -->
                        <button class="btn btn-glass ${requestClass}" onclick="location.href='invite.html'">
                            <i class="fas fa-paper-plane" style="margin-right: 8px;"></i>
                            ${requestText}
                        </button>

                        <!-- Step 1: Apology (Completed) -->
                        <button class="btn btn-glass status-completed" onclick="activateMenu('apology')">
                            <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                            사과문 작성 (완료)
                        </button>

                        <!-- Step 2: Proposal (Current) -->
                        <button class="btn btn-glass status-current" onclick="activateMenu('proposal')">
                            <i class="fas fa-hand-holding-usd" style="margin-right: 8px;"></i>
                            합의금 제안 (진행 중)
                        </button>

                        <!-- Step 3: Account Info (Pending) -->
                        <button class="btn btn-glass status-pending" onclick="activateMenu('account')">
                            <i class="fas fa-university" style="margin-right: 8px;"></i>
                            계좌 정보 확인
                        </button>

                        <!-- Step 4: Agreement (Pending) -->
                        <button class="btn btn-glass status-pending" onclick="activateMenu('agreement')">
                            <i class="fas fa-file-signature" style="margin-right: 8px;"></i>
                            합의서 작성
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Victim
            return `
                <div class="glass-card" style="grid-column: 1 / -1;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-bolt"></i> 빠른 액션 (피해자용)</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        
                        <!-- Step 0: Send Settlement Request -->
                        <button class="btn btn-glass ${requestClass}" onclick="location.href='invite.html'">
                            <i class="fas fa-paper-plane" style="margin-right: 8px;"></i>
                            ${requestText}
                        </button>

                        <!-- Step 1: Receive Apology (Completed/Received) -->
                        <button class="btn btn-glass status-completed" onclick="activateMenu('apology')">
                            <i class="fas fa-envelope-open-text" style="margin-right: 8px;"></i>
                            사과문 받기 (수신됨)
                        </button>

                        <!-- Step 2: Proposal (Current) -->
                        <button class="btn btn-glass status-current" onclick="activateMenu('proposal')">
                            <i class="fas fa-hand-holding-usd" style="margin-right: 8px;"></i>
                            합의금 제안 (진행 중)
                        </button>

                        <!-- Step 3: Provide Account Info (Pending) -->
                        <button class="btn btn-glass status-pending" onclick="activateMenu('account')">
                            <i class="fas fa-university" style="margin-right: 8px;"></i>
                            계좌 정보 주기
                        </button>

                        <!-- Step 4: Agreement (Pending) -->
                        <button class="btn btn-glass status-pending" onclick="activateMenu('agreement')">
                            <i class="fas fa-file-signature" style="margin-right: 8px;"></i>
                            합의서 작성
                        </button>
                    </div>
                </div>
            `;
        }
    }

    function getProposalHTML() {
        return `
            <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                <!-- Left: My Proposal -->
                <div class="glass-card" style="height: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                        <h3>나의 희망 금액</h3>
                        <span style="font-size: 0.8rem; padding: 4px 10px; background: rgba(255,255,255,0.1); border-radius: 12px;">비공개 안전 보장 <i class="fas fa-lock s"></i></span>
                    </div>

                    <div style="text-align: center; margin-bottom: 40px;">
                        <p style="color: var(--text-muted); margin-bottom: 10px;">상대방에게 구체적인 금액이 노출되지 않습니다.</p>
                        <div style="position: relative; max-width: 300px; margin: 0 auto;">
                            <!-- Unit Change: Won -> Man-won -->
                            <span style="position: absolute; right: 25px; top: 50%; transform: translateY(-50%); font-size: 1.2rem; color: var(--text-muted); font-weight: bold;">만원</span>
                            <input type="number" id="myAmount" class="form-input" style="padding-right: 70px; font-size: 1.5rem; font-weight: bold; text-align: center;" placeholder="0">
                        </div>
                        <p style="font-size: 0.8rem; color: #666; margin-top: 5px;">* 예: 300만원 입력 시 300만 입력</p>

                        <!-- Duration Selector -->
                        <div style="margin-top: 25px; text-align: left;">
                            <label style="font-size: 0.9rem; color: var(--text-muted); display: block; margin-bottom: 10px;">제안 유효 기간</label>
                            <div style="display: flex; gap: 10px;">
                                <label class="radio-chip">
                                    <input type="radio" name="proposalDuration" value="1" style="display: none;">
                                    <span style="padding: 8px 16px; border-radius: 20px; background: rgba(255,255,255,0.05); cursor: pointer; border: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem; transition: all 0.3s;">
                                        1일 (24시간)
                                    </span>
                                </label>
                                <label class="radio-chip">
                                    <input type="radio" name="proposalDuration" value="3" style="display: none;">
                                    <span style="padding: 8px 16px; border-radius: 20px; background: rgba(255,255,255,0.05); cursor: pointer; border: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem; transition: all 0.3s;">
                                        3일
                                    </span>
                                </label>
                                <label class="radio-chip">
                                    <input type="radio" name="proposalDuration" value="7" checked style="display: none;">
                                    <span style="padding: 8px 16px; border-radius: 20px; background: rgba(255,255,255,0.05); cursor: pointer; border: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem; transition: all 0.3s;">
                                        1주일
                                    </span>
                                </label>
                            </div>
                            <style>
                                .radio-chip input:checked + span {
                                    background: var(--primary);
                                    color: #000;
                                    font-weight: bold;
                                    border-color: var(--primary);
                                }
                            </style>
                        </div>
                    </div>

                    <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                        <h4 style="margin-bottom: 15px;"><i class="fas fa-balance-scale"></i> AI 분석 가이드</h4>
                        <ul style="font-size: 0.9rem; color: var(--text-muted); text-align: left; list-style: disc; padding-left: 20px;">
                            <li>유사 판례 평균: <strong>350만원 ~ 400만원</strong></li>
                            <li>너무 낮은 금액은 상대방의 거부감을 유발할 수 있습니다.</li>
                        </ul>
                    </div>

                    <button class="btn btn-primary" id="btnSubmitProposal" style="width: 100%;" onclick="submitProposal()">제안 등록하기</button>
                </div>

                <!-- Right: Gap Analysis Result -->
                <div class="glass-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">

                    <div id="waitingState">
                        <div style="font-size: 4rem; color: var(--text-muted); margin-bottom: 20px; opacity: 0.3;">
                            <i class="fas fa-time"></i>
                        </div>
                        <h3>상대방의 제안을 기다리고 있습니다</h3>
                        <p style="color: var(--text-muted); margin-top: 10px;" id="waitingDesc">
                            설정하신 유효 기간 내에 상대방이 응답하지 않으면<br>
                            제안은 자동으로 만료됩니다.
                        </p>
                    </div>

                    <div id="resultState" style="display: none; width: 100%;">
                        <div style="margin-bottom: 30px;">
                            <span style="font-size: 0.9rem; color: var(--secondary);">분석 완료</span>
                            <h2 style="font-size: 2rem; margin-top: 10px;" id="gapTitle">금액 차이가 큽니다</h2>
                        </div>

                        <!-- Gauge Visual -->
                        <div style="width: 100%; height: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-bottom: 30px; position: relative;">
                            <div id="gapGauge" style="width: 80%; height: 100%; background: linear-gradient(90deg, #ff4d4d, #f9cb28); border-radius: 10px; transition: width 1s ease;"></div>
                            
                            <div style="position: absolute; left: 20%; top: 25px; font-size: 0.7rem; color: #aaa;">| 100만 이내</div>
                            <div style="position: absolute; left: 50%; top: 25px; font-size: 0.7rem; color: #aaa;">| 500만 이내</div>
                            <div style="position: absolute; left: 80%; top: 25px; font-size: 0.7rem; color: #aaa;">| 1000만 이상</div>
                        </div>

                        <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 30px;" id="gapDesc">
                            양측의 의견 차이가 <strong>500만원 ~ 1000만원</strong> 사이입니다.<br>
                            직접적인 대화보다는 전문가의 중재를 고려해보시는 것이 좋습니다.
                        </p>
                        
                        <div id="actionButtons">
                            <button class="btn btn-glass" style="margin-right: 10px;">금액 수정 제안</button>
                            <button class="btn btn-primary" style="background: linear-gradient(135deg, #FF6B6B, #FF8E53);">변호사 중재 신청</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Proposal History Section -->
            <div class="glass-card" style="margin-top: 20px;">
                <h3 style="margin-bottom: 20px;"><i class="fas fa-history"></i> 제안 히스토리</h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
                                <th style="padding: 15px; font-weight: 500;">회차</th>
                                <th style="padding: 15px; font-weight: 500;">일시</th>
                                <th style="padding: 15px; font-weight: 500;">나의 제안 (원)</th>
                                <th style="padding: 15px; font-weight: 500;">분석 결과</th>
                            </tr>
                        </thead>
                        <tbody id="historyTableBody">
                            <tr>
                                <td colspan="4" style="padding: 30px; text-align: center; color: var(--text-muted);">
                                    아직 제안 내역이 없습니다.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function getAnalysisHTML() {
        return `
            <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-chart-line"></i> 예상 합의금</h3>
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 2.5rem; font-weight: 700; color: var(--primary); margin-bottom: 10px;">₩ 3,500,000</div>
                        <div style="color: var(--text-muted); margin-bottom: 20px;">AI 분석 평균</div>
                        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                            <span style="color: var(--text-muted);">범위:</span>
                            <span style="font-weight: 600;">₩ 2,000,000 ~ ₩ 4,500,000</span>
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="grid-column: 1 / -1;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-chart-bar"></i> 유사 사례 분석</h3>
                    <canvas id="analysisChart" style="max-height: 300px;"></canvas>
                    <p style="margin-top: 20px; color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">
                        * 귀하의 사건(폭행, 전치 2주)과 유사한 최근 3년 판례를 분석했습니다.<br>
                        * 일반적으로 <span style="color: var(--text-main); font-weight: 600;">200만원 ~ 450만원</span> 사이에서 합의가 이루어집니다.
                    </p>
                </div>
            </div>
        `;
    }

    function getChatHTML() {
        const counterparty = localStorage.getItem('current_counterparty');
        const caseId = localStorage.getItem('current_case_id');
        const myRole = localStorage.getItem('current_case_role'); // 'offender' or 'victim'

        // Chat Status: 'none', 'requested', 'active', 'terminated'
        // For demo, we store who requested it: 'requested_by_offender' or 'requested_by_victim'
        let chatStatus = localStorage.getItem(`chat_status_${caseId}`) || 'none';

        // 1. Initial State (None)
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
                    
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 30px; text-align: left; font-size: 0.9rem; color: #ddd;">
                        <strong><i class="fas fa-info-circle"></i> 이용 안내</strong>
                        <ul style="padding-left: 20px; margin-top: 10px; color: var(--text-muted);">
                            <li>안심 채팅은 한쪽이 신청하고, 상대방이 수락해야 시작됩니다.</li>
                            <li>대화 중 불편함을 느끼시면 언제든지 [채팅 종료]를 할 수 있습니다.</li>
                            <li>욕설이나 협박성 발언은 AI 필터링에 의해 제재될 수 있습니다.</li>
                        </ul>
                    </div>

                    <button class="btn btn-primary" onclick="requestChat('${myRole}')" style="width: 100%; padding: 15px;">
                        <i class="fas fa-paper-plane"></i> ${counterparty}님에게 채팅 요청하기
                    </button>
                </div>
            `;
        }

        // 2. Requested State
        if (chatStatus.startsWith('requested')) {
            const requester = chatStatus.split('_by_')[1]; // 'offender' or 'victim'

            // If I am the requester
            if (requester === myRole) {
                return `
                    <div class="glass-card" style="max-width: 500px; margin: 50px auto; text-align: center; padding: 40px;">
                        <div class="spinner-border" style="width: 3rem; height: 3rem; margin-bottom: 20px; color: var(--secondary);" role="status">
                            <span class="sr-only">Loading...</span>
                        </div>
                        <h3 style="margin-bottom: 15px;">상대방의 수락을 기다리고 있습니다</h3>
                        <p style="color: var(--text-muted); margin-bottom: 30px;">
                            ${counterparty}님이 채팅 요청을 확인하고 수락하면<br>
                            즉시 대화방이 열립니다.
                        </p>
                        <button class="btn btn-glass" onclick="cancelChatRequest()">
                            요청 취소하기
                        </button>
                    </div>
                `;
            } else {
                // If I am the receiver
                return `
                    <div class="glass-card" style="max-width: 500px; margin: 50px auto; text-align: center; padding: 40px;">
                        <i class="fas fa-comment-dots" style="font-size: 3rem; color: var(--secondary); margin-bottom: 20px;"></i>
                        <h3 style="margin-bottom: 15px;">새로운 채팅 요청이 도착했습니다</h3>
                        <p style="color: var(--text-muted); margin-bottom: 30px;">
                            ${counterparty}님이 대화를 요청했습니다.<br>
                            수락하시겠습니까? (언제든지 대화를 종료할 수 있습니다)
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
                        <div class="system-msg">서로를 배려하며 대화해주세요. 언제든 상단의 '대화 종료' 버튼으로 중단할 수 있습니다.</div>
                        <div class="message received">안녕하세요. 대화 요청 수락해주셔서 감사합니다.</div>
                        <div class="message sent">네, 하고 싶으신 말씀이 무엇인가요?</div>
                    </div>

                    <!-- Input Area -->
                    <div class="message-input-area" style="padding: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="chatInput" style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; outline: none; padding: 12px; border-radius: 8px;" placeholder="메시지를 입력하세요..." onkeypress="handleChatEnter(event)">
                            <button class="btn btn-primary" onclick="sendChatMessage()">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // 4. Terminated State
        if (chatStatus === 'terminated') {
            return `
                <div class="glass-card" style="max-width: 500px; margin: 50px auto; text-align: center; padding: 40px;">
                    <div style="width: 80px; height: 80px; background: rgba(255, 107, 107, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                        <i class="fas fa-slash" style="font-size: 2.5rem; color: #ff6b6b;"></i>
                    </div>
                    <h3 style="margin-bottom: 15px;">대화가 종료되었습니다</h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">
                        대화방이 닫혔습니다.<br>
                        다시 대화하려면 새로운 요청이 필요합니다.
                    </p>
                    <button class="btn btn-glass" onclick="resetChat()" style="margin-right: 10px;">
                        메인으로 돌아가기
                    </button>
                    <button class="btn btn-primary" onclick="requestChat('${myRole}')">
                        다시 요청하기
                    </button>
                </div>
            `;
        }
    }

    // --- Chat Logic Functions ---

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
            localStorage.setItem(`chat_status_${caseId}`, 'none'); // Just reset to none for demo
            refreshChatView();
        }
    };

    window.confirmEndChat = function () {
        if (confirm('정말로 대화를 종료하시겠습니까? 상대방과의 연결이 끊어집니다.')) {
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
        // Find the active tab and reload if it's chat
        const activeTab = document.querySelector('.sidebar-item.active');
        if (activeTab && activeTab.textContent.includes('안심 채팅')) {
            activateMenu('chat');
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
                        진심을 담은 사과문은 피해자의 마음을 움직이는 가장 큰 힘입니다.<br>
                        전용 에디터에서 AI의 도움을 받아 진정성 있는 사과문을 작성해보세요.
                    </p>
                    
                    <button class="btn btn-primary" onclick="location.href='apology_write.html'" 
                        style="padding: 18px 40px; font-size: 1.1rem; border-radius: 50px; box-shadow: 0 10px 30px rgba(74, 222, 128, 0.3); transition: all 0.3s ease;">
                        <i class="fas fa-pen-nib" style="margin-right: 10px;"></i> 사과문 작성하러 가기
                    </button>

                    <div style="margin-top: 40px; display: flex; gap: 20px; justify-content: center; color: var(--text-muted); font-size: 0.9rem;">
                        <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-magic"></i> AI 초안 생성</span>
                        <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-palette"></i> 다양한 편지지</span>
                        <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-eye"></i> 미리보기 제공</span>
                    </div>
                </div>
            `;
        } else {
            // Victim View
            return `
                <div class="glass-card" style="max-width: 800px; margin: 0 auto;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-envelope-open-text"></i> 도착한 사과문</h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">피의자로부터 도착한 사과문입니다.</p>

                    <div style="background: rgba(255,255,255,0.03); padding: 30px; border-radius: 12px; margin-bottom: 20px; line-height: 1.8;">
                        <p>정말 죄송합니다.<br><br>
                        순간의 잘못된 판단으로 선생님께 큰 피해를 입힌 점, 깊이 반성하고 있습니다. 
                        입이 열 개라도 할 말이 없지만, 이렇게 글로나마 사죄의 말씀을 드립니다.
                        <br><br>
                        무엇보다 선생님께서 겪으셨을 정신적, 육체적 고통을 생각하면 마음이 무겁습니다.
                        앞으로 다시는 이런 일이 없도록 주의하고 또 주의하겠습니다.
                        <br><br>
                        부디 너그러운 마음으로 용서해 주시기를 간청 드립니다.
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
                <button class="btn btn-primary" onclick="location.href='agreement.html'">
                    <i class="fas fa-plus"></i> 합의서 작성 시작하기
                </button>
            </div>
        `;
    }

    function getAccountInfoHTML() {
        const myRole = localStorage.getItem('current_case_role');

        if (myRole === 'victim') {
            return `
                <div class="glass-card" style="max-width: 600px; margin: 0 auto;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-university"></i> 내 계좌 정보 등록</h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">
                        합의금을 수령하실 본인 명의의 계좌 정보를 입력해주세요.<br>
                        입력하신 계좌 정보는 <strong>합의금 입금을 위해 피의자에게 직접 공개</strong>됩니다.
                    </p>

                    <div class="form-group">
                        <label class="form-label">은행 선택</label>
                        <select class="form-input" style="background: rgba(255,255,255,0.05); color: white;">
                            <option>국민은행</option>
                            <option>신한은행</option>
                            <option>우리은행</option>
                            <option>하나은행</option>
                            <option>카카오뱅크</option>
                            <option>토스뱅크</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">계좌 번호</label>
                        <input type="text" class="form-input" placeholder="'-' 없이 입력하세요">
                    </div>
                    <div class="form-group">
                        <label class="form-label">예금주</label>
                        <input type="text" class="form-input" placeholder="본인 실명">
                    </div>

                    <div style="margin-top: 30px; padding: 15px; background: rgba(255,165,0,0.1); border-radius: 8px; border-left: 4px solid orange;">
                        <h4 style="margin-bottom: 5px; color: orange;">⚠️ 주의사항</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">
                            정확한 계좌 정보를 입력해주세요. 오기입으로 인한 송금 사고 시 책임은 본인에게 있습니다.<br>
                            정보 등록 시 상대방이 즉시 확인할 수 있습니다.
                        </p>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button class="btn btn-primary" style="width: 100%;"><i class="fas fa-check"></i> 계좌 정보 등록 및 공개</button>
                    </div>
                </div>
            `;
        } else {
            // Offender View
            return `
                <div class="glass-card" style="max-width: 600px; margin: 0 auto;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-university"></i> 송금 대상 계좌 정보</h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">
                        피해자가 등록한 계좌 정보입니다.<br>
                        아래 계좌로 합의금을 입금하신 후 [입금 완료 알림]을 눌러주세요.
                    </p>
                    
                    <div style="padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 20px;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">입금은행 / 계좌번호</div>
                        <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 15px;">
                            카카오뱅크 3333-XXXX-XXXX
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">예금주</div>
                        <div style="font-size: 1.1rem;">홍길동 (피해자)</div>
                    </div>

                    <div style="margin-top: 20px; padding: 15px; background: rgba(74, 222, 128, 0.1); border-radius: 8px; border-left: 4px solid #4ade80;">
                        <h4 style="margin-bottom: 5px; color: #4ade80;">✅ 합의금 확정 완료</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">
                            입금하셔야 할 금액: <strong>3,500,000원</strong>
                        </p>
                    </div>

                    <button class="btn btn-primary" style="width: 100%; margin-top: 20px;" onclick="alert('상대방에게 입금 완료 알림을 보냈습니다.');">
                        <i class="fas fa-paper-plane"></i> 입금 완료 알림 보내기
                    </button>
                </div>
            `;
        }
    }

    function getMediationHTML() {
        return `
            <div class="glass-card" style="max-width: 800px; margin: 0 auto;">
                <h3 style="margin-bottom: 20px;"><i class="fas fa-gavel"></i> 변호사 상담 신청</h3>
                <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 30px;">
                    합의가 원만하지 않거나, 법적으로 강력한 대응이 필요하신가요?<br>
                    <strong>서울중앙지검 부장검사 출신</strong> 형사 전문 변호사가 직접 해결책을 제시합니다.
                </p>

                <!-- Lawyer Profile Section -->
                <div style="background: rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; margin-bottom: 30px;">
                    <div style="display: flex; align-items: flex-start; gap: 20px;">
                        <img src="images/lawyer_profile.png" alt="이동언 변호사" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid var(--secondary); flex-shrink: 0;">
                        <div>
                            <h4 style="margin-bottom: 8px; font-size: 1.3rem;">
                                이동언 변호사
                                <span style="font-size: 0.8rem; background: linear-gradient(135deg, #4ade80, #22c55e); color: #000; padding: 3px 8px; border-radius: 12px; vertical-align: middle; margin-left: 8px; font-weight: 700; box-shadow: 0 2px 5px rgba(74, 222, 128, 0.3);">형사사건 전문가</span>
                            </h4>
                            <p style="color: var(--secondary); font-weight: 600; font-size: 0.95rem; margin-bottom: 8px;">법률사무소 인피니티 대표변호사</p>
                            <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                                <span>前 서울중앙지방검찰청 부장검사</span><br>
                                <span>前 대검찰청 검찰연구관</span><br>
                                <span>前 법무부 국제형사과장</span>
                            </div>
                            <button onclick="toggleCareer()" class="btn btn-glass" style="margin-top: 15px; font-size: 0.8rem; padding: 5px 10px;">
                                <i class="fas fa-chevron-down"></i> 상세 약력 더보기
                            </button>
                        </div>
                    </div>

                    <!-- Hidden Detailed Career -->
                    <div id="lawyerDetailProfile" style="display: none; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; font-size: 0.85rem; color: #ddd;">
                            <div>
                                <h5 style="color: var(--secondary); margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">학력</h5>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>1995</span><span>여수고등학교 졸업</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2000</span><span>서울대학교 정치학과 졸업</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px;"><span>2012</span><span>미국 UC Davis LL.M.</span></div>
                            </div>
                            <div>
                                <h5 style="color: var(--secondary); margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">주요 경력</h5>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2000</span><span>제42회 사법시험 합격</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2003</span><span>사법연수원 수료(제32기)</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2006</span><span>서울남부지방검찰청 검사</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2013</span><span>서울중앙지방검찰청 검사</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2016</span><span>대검찰청 검찰연구관</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2019</span><span>법무부 국제형사과장</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2020</span><span>서울중앙지방검찰청 형사5부장</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2022</span><span>대전지방검찰청 인권보호부장</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px;"><span>2023</span><span>법률사무소 인피니티 변호사</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px;">
                    <div style="background: rgba(255,255,255,0.03); padding: 25px; border-radius: 12px; text-align: center;">
                        <div style="width: 50px; height: 50px; background: rgba(74, 158, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                            <i class="fas fa-comment-medical" style="color: #4A9EFF; font-size: 1.2rem;"></i>
                        </div>
                        <h4 style="margin-bottom: 10px;">법률 자문</h4>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">현재 상황에 대한 객관적인<br>법률적 판단과 조언</p>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 25px; border-radius: 12px; text-align: center;">
                        <div style="width: 50px; height: 50px; background: rgba(255, 184, 77, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                            <i class="fas fa-balance-scale" style="color: #FFB84D; font-size: 1.2rem;"></i>
                        </div>
                        <h4 style="margin-bottom: 10px;">법률대리인 선임</h4>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">변호사가 직접 정식 법적 대응 실행<br><span style="font-size: 0.8rem; color: #888;">(형사고소, 피의자 변론 등)</span></p>
                    </div>
                </div>

                <div class="form-group" style="text-align: left;">
                    <label class="form-label">사건 내용 (간략 설명)</label>
                    <textarea class="form-input" rows="3" placeholder="어떤 사건인지 간략하게 설명해주세요 (예: 폭행 시비, 사기 피해 등)"></textarea>
                </div>

                <div class="form-group" style="text-align: left;">
                    <label class="form-label">상담 요청 내용</label>
                    <textarea class="form-input" rows="5" placeholder="변호사님께 궁금한 점이나 도움받고 싶은 내용을 적어주세요."></textarea>
                </div>

                <div class="form-group" style="text-align: left;">
                    <label class="form-label">연락받을 전화번호</label>
                    <input type="tel" class="form-input" placeholder="010-0000-0000">
                </div>

                <button class="btn btn-primary" style="width: 100%; padding: 15px;" onclick="alert('변호사 상담 신청이 접수되었습니다. 담당 변호사가 확인 후 연락드리겠습니다. (데모)');">
                    <i class="fas fa-paper-plane"></i> 변호사 상담 신청하기
                </button>
            </div>
        `;
    }

    // Toggle Career Details Function
    window.toggleCareer = function () {
        const detail = document.getElementById('lawyerDetailProfile');
        if (detail.style.display === 'none') {
            detail.style.display = 'block';
        } else {
            detail.style.display = 'none';
        }
    };

    // Initialize functions
    function initializeProposal() {
        // Init state for history and count
        // Using window or closure scope if needed, but here closure is fine as long as submitProposal is attached to window inside
        let proposalHistory = [];
        let proposalCount = 0;

        window.submitProposal = function () {
            const rawInput = parseInt(document.getElementById('myAmount').value);
            if (!rawInput) return alert('희망 금액을 입력해주세요.');

            // Get selected duration
            const durationRadios = document.getElementsByName('proposalDuration');
            let durationDays = 7;
            for (const radio of durationRadios) {
                if (radio.checked) {
                    durationDays = parseInt(radio.value);
                    break;
                }
            }

            // Convert Man-won to Won
            const myAmount = rawInput * 10000;

            const btn = document.getElementById('btnSubmitProposal');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 분석중...';
            btn.disabled = true;

            // Simulate Server Delay and Victim's Hidden Amount
            setTimeout(() => {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + durationDays);
                const expiryString = `${expiryDate.getFullYear()}.${expiryDate.getMonth() + 1}.${expiryDate.getDate()}`;

                document.getElementById('waitingDesc').innerHTML = `
                    이 제안은 <strong>${expiryString}</strong>에 만료됩니다.<br>
                    기간 내에 상대방이 제안하지 않으면 자동으로 취소됩니다.
                `;
                const victimAmount = 8000000; // Victim wants 800 Man-won

                // Logic Update: Check for Over-offer
                let isOverOffer = false;
                if (myAmount >= victimAmount) {
                    isOverOffer = true;
                }

                const diff = Math.abs(victimAmount - myAmount);
                const average = (victimAmount + myAmount) / 2;
                let gapPercent = (diff / average) * 100;

                // Exception for small amounts
                if (diff <= 500000) gapPercent = 0;
                if (isOverOffer) gapPercent = 0;

                document.getElementById('waitingState').style.display = 'none';
                document.getElementById('resultState').style.display = 'block';

                const gapTitle = document.getElementById('gapTitle');
                const gapDesc = document.getElementById('gapDesc');
                const gapGauge = document.getElementById('gapGauge');
                const actionButtons = document.getElementById('actionButtons');

                let level = 0;
                let color = '';
                let title = '';
                let desc = '';
                let width = '';
                let badgeText = '';

                if (gapPercent <= 10) {
                    level = 1;
                    color = '#4ade80';
                    if (isOverOffer) {
                        title = "즉시 합의가 가능합니다!";
                        desc = `제안하신 금액이 상대방의 기대치를 충족합니다.<br>지금 바로 합의를 진행하셔도 좋습니다.`;
                    } else {
                        title = "축하합니다! 합의 성사 직전입니다";
                        desc = `양측의 제안 금액 차이가 <strong>10% 이내</strong>(약 ${diff.toLocaleString()}원)입니다.<br>사실상 합의가 성사된 상태입니다.`;
                    }
                    width = '98%';
                    badgeText = '성사 확실';
                    actionButtons.innerHTML = '<button class="btn btn-primary" style="background: #4ade80; color: #000;">지금 바로 합의하기</button>';
                } else if (gapPercent <= 30) {
                    level = 2;
                    color = '#3b82f6';
                    title = "긍정적 조율 단계입니다";
                    desc = `서로의 의견 차이가 <strong>크지 않습니다.</strong><br>안심 채팅을 통해 구체적인 사정을 설명하면 충분히 간극을 좁힐 수 있습니다.`;
                    width = '75%';
                    badgeText = '조율 가능';
                    actionButtons.innerHTML = '<button class="btn btn-glass" style="margin-right: 10px;">수정 제안하기</button><button class="btn btn-primary">안심 채팅방 열기</button>';
                } else if (gapPercent <= 60) {
                    level = 3;
                    color = '#facc15';
                    title = "조율이 더 필요해 보입니다";
                    desc = `시각 차이가 다소 큽니다. 개인 간의 대화보다는 안심 채팅을 통해<br>상대방의 입장을 조금 더 들어보는 것이 좋습니다.`;
                    width = '50%';
                    badgeText = '추가 조율';
                    actionButtons.innerHTML = '<button class="btn btn-glass" style="margin-right: 10px;">수정 제안하기</button><button class="btn btn-primary">안심 채팅방 열기</button>';
                } else if (gapPercent <= 100) {
                    level = 4;
                    color = '#fb923c';
                    title = "입장 차이가 매우 큽니다";
                    desc = `현재 상태로는 합의가 어렵습니다. 상대방은 귀하와 <strong>전혀 다른 기준</strong>을 가지고 있습니다.<br>잠시 냉각기를 가지는 것을 추천합니다.`;
                    width = '25%';
                    badgeText = '심각한 격차';
                    actionButtons.innerHTML = '<button class="btn btn-glass">제안 보류하기</button>';
                } else {
                    level = 5;
                    color = '#ef4444';
                    title = "합의점 도출이 불가능해 보입니다";
                    desc = `간극이 너무 큽니다 (100% 이상 차이).<br>사실상 결렬 상태입니다. 무리한 합의 시도보다는 잠시 상황을 지켜보는 것이 좋습니다.`;
                    width = '10%';
                    badgeText = '결렬 위기';
                    actionButtons.innerHTML = '<button class="btn btn-glass" style="margin-right: 10px;">수정 제안하기</button><button class="btn btn-primary" style="background: #ef4444;">형사 절차 안내</button>';
                }

                gapTitle.textContent = title;
                gapDesc.innerHTML = desc;
                gapGauge.style.width = width;
                gapGauge.style.background = color;
                gapGauge.style.boxShadow = `0 0 20px ${color}`;

                // Range Hint Logic
                const minRange = Math.floor(victimAmount * 0.8 / 10000) * 10000;
                const maxRange = Math.ceil(victimAmount * 1.2 / 10000) * 10000;
                let rangeElement = document.getElementById('rangeHintBox');
                if (!rangeElement) {
                    rangeElement = document.createElement('div');
                    rangeElement.id = 'rangeHintBox';
                    rangeElement.style.marginTop = '20px';
                    rangeElement.style.padding = '15px';
                    rangeElement.style.background = 'rgba(255,255,255,0.05)';
                    rangeElement.style.borderRadius = '8px';
                    document.getElementById('resultState').insertBefore(rangeElement, actionButtons);
                }
                rangeElement.innerHTML = `
                    <div style="font-size: 0.85rem; color: #aaa; margin-bottom: 5px;">상대방 제안 예상 범위</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: #fff; filter: blur(${level >= 4 ? '5px' : '0px'}); transition: filter 0.5s;">
                        ${minRange.toLocaleString()}원 ~ ${maxRange.toLocaleString()}원
                    </div>
                     ${level >= 4 ? '<div style="font-size:0.7rem; color:#ef4444; margin-top:5px;">격차가 너무 커서 범위조차 흐릿합니다.</div>' : ''}
                `;

                // Add to History
                proposalCount++;
                const now = new Date();
                const timeString = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

                const historyItem = {
                    round: proposalCount,
                    time: timeString,
                    amount: myAmount,
                    result: badgeText,
                    color: color
                };

                proposalHistory.unshift(historyItem);

                // Update History Table
                const tbody = document.getElementById('historyTableBody');
                if (proposalHistory.length > 0) {
                    tbody.innerHTML = proposalHistory.map(item => `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 15px;">${item.round}차</td>
                            <td style="padding: 15px; color: var(--text-muted); font-size: 0.9rem;">${item.time}</td>
                            <td style="padding: 15px; font-weight: bold;">${item.amount.toLocaleString()}</td>
                            <td style="padding: 15px;">
                                <span style="font-size: 0.8rem; padding: 4px 10px; border-radius: 12px; border: 1px solid ${item.color}; color: ${item.color}; background: rgba(255,255,255,0.05);">
                                    ${item.result}
                                </span>
                            </td>
                        </tr>
                    `).join('');
                }

                btn.innerHTML = '수정 제안하기';
                btn.disabled = false;
                btn.classList.add('btn-glass');
                btn.classList.remove('btn-primary');
            }, 1000);
        };
    }

    function initializeChart() {
        const ctx = document.getElementById('analysisChart');
        if (!ctx) return;

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(100, 100, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(100, 100, 255, 0.05)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['유사사례 1', '유사사례 2', '유사사례 3', '유사사례 4', '유사사례 5', '유사사례 6'],
                datasets: [{
                    label: '합의금 분포 (단위: 만원)',
                    data: [200, 250, 300, 280, 400, 350],
                    backgroundColor: gradient,
                    borderColor: '#5865F2',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' } },
                    x: { grid: { display: false }, ticks: { color: '#aaa' } }
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
                replyDiv.textContent = '네, 확인했습니다. 검토 후 답변 드리겠습니다.';
                chatArea.appendChild(replyDiv);
                chatArea.scrollTop = chatArea.scrollHeight;
            }, 1500);
        };

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }

    // Expose navigation function globally for Quick Action buttons - ALREADY DEFINED IN initializeMenu
    // window.activateMenu removed to prevent recursion


    // Invite Kakao Function
    window.inviteKakao = function () {
        alert("상대방에게 카카오톡으로 초대 메시지를 발송합니다. (데모)");
    };
});

// File Upload Helper Functions
window.handleFileSelect = function (input) {
    const fileNameSpan = document.getElementById('fileName');
    const cancelBtn = document.getElementById('fileCancelBtn');

    if (input.files && input.files.length > 0) {
        fileNameSpan.textContent = input.files[0].name;
        fileNameSpan.style.color = 'var(--text-main)';
        cancelBtn.style.display = 'block';
    } else {
        fileNameSpan.textContent = '선택된 파일 없음';
        fileNameSpan.style.color = 'var(--text-muted)';
        cancelBtn.style.display = 'none';
    }
};

window.cancelFileSelection = function () {
    const input = document.getElementById('apologyFile');
    const fileNameSpan = document.getElementById('fileName');
    const cancelBtn = document.getElementById('fileCancelBtn');

    input.value = ''; // Clear input
    fileNameSpan.textContent = '선택된 파일 없음';
    fileNameSpan.style.color = 'var(--text-muted)';
    cancelBtn.style.display = 'none';
};

window.sendApology = function () {
    const content = document.getElementById('apologyContent').value.trim();
    const fileInput = document.getElementById('apologyFile');
    const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;

    if (!content && !hasFile) {
        alert('사과문 내용이나 첨부 파일을 입력해주세요.');
        return;
    }

    let message = '✅ 사과문이 상대방에게 전송되었습니다.';
    if (hasFile) {
        message += `\n(첨부파일: ${fileInput.files[0].name})`;
    }

    alert(message);
    document.getElementById('apologyContent').value = '';
    if (hasFile) cancelFileSelection();
};


// --- Apology Styling & Preview Helpers ---

window.selectStyle = function (type, value, element) {
    // Update hidden inputs
    if (type === 'bg') {
        document.getElementById('selectedBg').value = value;
    } else if (type === 'font') {
        document.getElementById('selectedFont').value = value;
    }

    // Visual selection update
    // Find all siblings in the same grid container
    const siblings = element.parentElement.children;
    for (let i = 0; i < siblings.length; i++) {
        siblings[i].classList.remove('selected');
    }
    element.classList.add('selected');
};

window.openPreview = function () {
    const content = document.getElementById('apologyContent').value;
    if (!content || content.length < 10) {
        alert("사과문 내용이 너무 적습니다. 내용을 작성해주세요.");
        return;
    }

    const bg = document.getElementById('selectedBg').value;
    const font = document.getElementById('selectedFont').value;
    const previewBox = document.getElementById('finalPreviewBox');
    const modal = document.getElementById('previewModal');

    // Set Classes
    previewBox.className = `paper-preview bg-${bg} font-${font}`;
    previewBox.textContent = content;

    // Show Modal
    modal.style.display = 'flex';
};

window.closePreview = function () {
    document.getElementById('previewModal').style.display = 'none';
};

window.confirmSend = function () {
    const bg = document.getElementById('selectedBg').value;
    const font = document.getElementById('selectedFont').value;

    // In a real app, we would send these params to the server
    console.log(`Sending Apology with BG: ${bg}, Font: ${font}`);

    closePreview();

    // Call the original send logic or simulate success
    alert("✅ 사과문이 성공적으로 전송되었습니다!\n(상대방에게 선택하신 편지지와 글꼴로 전달됩니다)");

    // Clear
    localStorage.removeItem('saved_apology_text');
    document.getElementById('apologyContent').value = '';

    // Redirect or update UI
    // location.href = 'dashboard.html?page=cases'; // Optional
};


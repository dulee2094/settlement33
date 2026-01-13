// Dashboard - Main Navigation
document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // 배포 시 정식 모드 (백엔드 연결)
    const DEMO_MODE = false;
    const API_BASE = IS_LOCAL ? 'http://localhost:3000/api' : '/api';

    // Initialize
    loadUserInfo();
    initializeMenu();
    // Check URL params for page navigation
    const urlParams = new URLSearchParams(window.location.search);

    // Safety Net: If open_detail=true, redirect to case_detail.html
    if (urlParams.get('open_detail') === 'true') {
        window.location.href = 'case_detail.html';
        return; // Stop execution
    }

    const initialPage = urlParams.get('page') || 'guide';

    loadPage(initialPage);
    updateActiveMenu(initialPage);

    function loadUserInfo() {
        const userName = localStorage.getItem('user_name') || '사용자';
        const userId = localStorage.getItem('user_id');

        if (!userId) {
            window.location.href = 'login.html';
            return;
        }

        document.getElementById('userName').textContent = userName;
        document.getElementById('userInitial').textContent = userName.charAt(0).toUpperCase();

        // Update notification badge (demo)
        const notifBadge = document.getElementById('notifBadge');
        notifBadge.textContent = '5';
        notifBadge.style.display = 'block';
    }

    function initializeMenu() {
        const menuItems = document.querySelectorAll('.nav-item[data-page]');

        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const pageName = item.dataset.page;

                // Update active state
                menuItems.forEach(mi => mi.classList.remove('active'));
                item.classList.add('active');

                // Load page content
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

        switch (pageName) {
            case 'cases':
                content.innerHTML = getCasesPageHTML();
                initializeCasesPage();
                break;
            case 'guide':
                content.innerHTML = getGuidePageHTML();
                break;
            case 'profile':
                content.innerHTML = getProfilePageHTML();
                break;
            case 'notifications':
                content.innerHTML = getNotificationsPageHTML();
                break;
            case 'settings':
                content.innerHTML = getSettingsPageHTML();
                break;
            case 'help':
                content.innerHTML = getHelpPageHTML();
                break;
            default:
                // Fallback to guide if unknown page
                content.innerHTML = getGuidePageHTML();
                updateActiveMenu('guide');
                break;
        }
    }

    // ==================== CASES PAGE ====================
    function getCasesPageHTML() {
        return `
            <div class="top-bar">
                <div>
                    <h2 style="margin-bottom: 5px;">내 사건 목록</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">진행 중인 모든 사건을 확인하세요</p>
                </div>
            </div>

            <div id="casesContainer" style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
                <div class="glass-card" style="text-align: center; padding: 40px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 15px;"></i>
                    <p style="color: var(--text-muted);">사건 정보를 불러오는 중...</p>
                </div>
            </div>
        `;
    }

    function initializeCasesPage() {
        fetchAllCases();
    }

    async function fetchAllCases() {
        const userId = localStorage.getItem('user_id');

        try {
            let data;

            if (DEMO_MODE) {
                data = {
                    found: true,
                    cases: [
                        {
                            caseId: 1,
                            caseNumber: '크리스마스 폭행사건',
                            myRole: 'offender',
                            connectionStatus: 'connected',
                            counterpartyName: '김피해',
                            status: 'negotiating',
                            registrationDate: '2024.01.03'
                        },
                        {
                            caseId: 2,
                            caseNumber: '2024형제67890',
                            myRole: 'offender',
                            connectionStatus: 'pending',
                            counterpartyName: '이피해',
                            status: 'pending',
                            registrationDate: '2024.01.02'
                        },
                        {
                            caseId: 3,
                            caseNumber: '2024형제11111',
                            myRole: 'victim',
                            connectionStatus: 'invited',
                            counterpartyName: '임의의(가입대기중)',
                            status: 'pending',
                            registrationDate: '2023.12.28'
                        }
                    ]
                };
            } else {
                const res = await fetch(`${API_BASE}/case/status?userId=${userId}`);
                data = await res.json();
            }

            const container = document.getElementById('casesContainer');

            // Update case count
            document.getElementById('caseCount').textContent = data.cases ? data.cases.length : 0;

            if (data.found && data.cases) {
                container.innerHTML = '';

                // 1. Render existing cases
                data.cases.forEach(caseItem => {
                    const caseCard = createCaseCard(caseItem);
                    container.appendChild(caseCard);
                });

                // 2. Add 'New Case Registration' Card at the bottom
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
                newCaseCard.onmouseenter = () => {
                    newCaseCard.style.background = 'rgba(255,255,255,0.05)';
                    newCaseCard.style.borderColor = 'var(--secondary)';
                };
                newCaseCard.onmouseleave = () => {
                    newCaseCard.style.background = 'rgba(255,255,255,0.02)';
                    newCaseCard.style.borderColor = 'rgba(255,255,255,0.2)';
                };

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
                        <button class="btn btn-primary" onclick="openRegisterModal()">
                            <i class="fas fa-plus" style="margin-right: 8px;"></i> 새로운 사건 등록하기
                        </button>
                    </div>
                `;
            }
        } catch (e) {
            console.error('Failed to fetch cases:', e);
        }
    }

    function createCaseCard(caseItem) {
        const card = document.createElement('div');
        card.className = 'glass-card';
        card.style.cursor = 'pointer';
        card.style.transition = 'all 0.3s';
        card.style.borderLeft = '4px solid ' + getStatusColor(caseItem.connectionStatus);

        card.onclick = () => {
            openCaseDetail(
                caseItem.caseId,
                caseItem.caseNumber,
                caseItem.myRole,
                caseItem.connectionStatus,
                caseItem.counterpartyName,
                caseItem.registrationDate,
                caseItem.roomTitle,   // New
                caseItem.summary,      // New
                caseItem.apologyStatus, // New
                caseItem.apologyContent // New
            );
        };

        card.onmouseenter = () => {
            card.style.transform = 'translateX(5px)';
            card.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
        };
        card.onmouseleave = () => {
            card.style.transform = 'translateX(0)';
            card.style.boxShadow = '';
        };

        const statusBadge = getStatusBadge(caseItem.connectionStatus);
        const roleIcon = caseItem.myRole === 'offender' ? 'fa-user-tie' : 'fa-user-shield';
        const roleText = caseItem.myRole === 'offender' ? '피의자' : '피해자';

        // Display Logic: 1. RoomTitle, 2. Summary, 3. CaseNumber
        let displayTitle = caseItem.roomTitle || caseItem.summary || caseItem.caseNumber;
        let subTitle = '';

        if (caseItem.roomTitle) {
            subTitle = `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal; margin-left: 8px;">Ref: ${caseItem.caseNumber}</span>`;
        } else if (displayTitle !== caseItem.caseNumber) {
            subTitle = `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal; margin-left: 8px;">${caseItem.caseNumber}</span>`;
        }

        // Truncate if too long
        if (displayTitle.length > 25) displayTitle = displayTitle.substring(0, 25) + '...';


        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                <div>
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                        <i class="fas ${roleIcon}" style="color: var(--text-muted);"></i>
                        <h3 style="font-size: 1.1rem; margin: 0;">${displayTitle} ${subTitle}</h3>
                    </div>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">내 역할: ${roleText}</p>
                </div>
                ${statusBadge}
            </div>
            <div style="display: flex; align-items: center; gap: 15px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                <div style="width: 45px; height: 45px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                    <i class="fas fa-user-friends" style="font-size: 1.2rem; color: ${getStatusColor(caseItem.connectionStatus)};"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-size: 0.8rem; color: var(--text-muted);">합의 상대방</div>
                    <div style="font-weight: 600; font-size: 1rem;">${caseItem.counterpartyName}</div>
                </div>
                <div style="text-align: right; margin-right: 15px;">
                     <div style="font-size: 0.8rem; color: var(--text-muted);">등록일</div>
                     <div style="font-size: 0.9rem;">${caseItem.registrationDate || '2024.01.01'}</div>
                </div>
                <i class="fas fa-chevron-right" style="color: var(--text-muted); font-size: 1.2rem;"></i>
            </div>
        `;

        return card;
    }

    function getStatusColor(status) {
        switch (status) {
            case 'connected': return 'var(--secondary)';
            case 'pending': return 'orange';
            case 'invited': return 'rgba(255,255,255,0.3)';
            default: return 'rgba(255,255,255,0.1)';
        }
    }

    function getStatusBadge(status) {
        let text, bgColor, textColor;
        switch (status) {
            case 'connected':
                text = '연결 완료';
                bgColor = 'var(--secondary)';
                textColor = '#fff';
                break;
            case 'pending':
                text = '수락 대기';
                bgColor = 'rgba(255, 165, 0, 0.2)';
                textColor = 'orange';
                break;
            case 'invited':
                text = '가입 대기';
                bgColor = 'rgba(255,255,255,0.1)';
                textColor = '#aaa';
                break;
            default:
                text = '대기 중';
                bgColor = 'rgba(255,255,255,0.05)';
                textColor = '#888';
        }
        return `<span class="status-badge" style="background: ${bgColor}; color: ${textColor};">${text}</span>`;
    }

    window.openCaseDetail = (caseId, caseNumber, myRole, status, counterpartyName, registrationDate, roomTitle, summary, apologyStatus, apologyContent) => {
        localStorage.setItem('current_case_id', caseId);
        localStorage.setItem('current_case_number', caseNumber);
        localStorage.setItem('current_case_role', myRole);
        localStorage.setItem('current_case_status', status);
        localStorage.setItem('current_counterparty', counterpartyName);
        localStorage.setItem('current_case_date', registrationDate || '2024.01.01');
        // Save Title and Summary
        localStorage.setItem('current_case_title', roomTitle || '');
        localStorage.setItem('current_case_summary', summary || '');
        // Save Apology Info
        localStorage.setItem('current_apology_status', apologyStatus || 'none');
        localStorage.setItem('current_apology_content', apologyContent || '');

        window.location.href = 'case_detail.html';
    };

    // ==================== PROFILE PAGE ====================
    function getProfilePageHTML() {
        const userName = localStorage.getItem('user_name') || '사용자';
        const userEmail = localStorage.getItem('user_email') || 'user@example.com';
        const userRole = localStorage.getItem('user_role') || 'offender';
        const roleText = userRole === 'offender' ? '피의자 (가해자)' : '피해자';

        return `
            <div class="top-bar">
                <h2>나의 정보</h2>
            </div>

            <div style="max-width: 800px; margin: 20px auto; display: flex; flex-direction: column; gap: 20px;">
                <!-- 프로필 정보 -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-user"></i> 프로필 정보</h3>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: var(--text-muted);">이름</span>
                            <span style="font-weight: 600;">${userName}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: var(--text-muted);">이메일</span>
                            <span style="font-weight: 600;">${userEmail}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: var(--text-muted);">주 역할</span>
                            <span style="font-weight: 600;">${roleText}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 12px 0;">
                            <span style="color: var(--text-muted);">가입일</span>
                            <span style="font-weight: 600;">2024년 1월 1일</span>
                        </div>
                    </div>
                </div>

                <!-- 본인 인증 상태 -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-shield-alt"></i> 본인 인증 상태</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                            <i class="fas fa-check-circle" style="color: var(--secondary); font-size: 1.5rem;"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: 600;">이메일 인증</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">인증 완료</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                            <i class="fas fa-check-circle" style="color: var(--secondary); font-size: 1.5rem;"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: 600;">휴대폰 인증</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">인증 완료</div>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; opacity: 0.6;">
                            <i class="far fa-circle" style="color: var(--text-muted); font-size: 1.5rem;"></i>
                            <div style="flex: 1;">
                                <div style="font-weight: 600;">신분증 인증 (선택)</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">미인증</div>
                            </div>
                            <button class="btn btn-glass" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">인증하기</button>
                        </div>
                    </div>
                </div>

                <!-- 활동 통계 -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-chart-bar"></i> 활동 통계</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                        <div style="text-align: center; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                            <div style="font-size: 2rem; font-weight: 700; color: var(--primary);">3</div>
                            <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 5px;">진행 중인 사건</div>
                        </div>
                        <div style="text-align: center; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                            <div style="font-size: 2rem; font-weight: 700; color: var(--secondary);">0</div>
                            <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 5px;">완료된 사건</div>
                        </div>
                        <div style="text-align: center; padding: 20px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                            <div style="font-size: 2rem; font-weight: 700; color: #4A9EFF;">24</div>
                            <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 5px;">총 메시지</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== NOTIFICATIONS PAGE ====================
    function getNotificationsPageHTML() {
        return `
            <div class="top-bar">
                <h2>알림 센터</h2>
                <button class="btn btn-glass" style="font-size: 0.85rem; padding: 0.5rem 1rem;">
                    <i class="fas fa-check-double"></i> 모두 읽음 처리
                </button>
            </div>

            <div style="max-width: 900px; margin: 20px auto;">
                <div class="glass-card">
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; gap: 15px; padding: 15px; background: rgba(100, 100, 255, 0.1); border-radius: 8px; border-left: 3px solid #4A9EFF;">
                            <div style="width: 40px; height: 40px; background: rgba(74, 158, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-comment" style="color: #4A9EFF;"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; margin-bottom: 5px;">김피해님이 메시지를 전송했습니다</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">사건 2024형제12345 ? 10분 전</div>
                            </div>
                            <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">확인</button>
                        </div>

                        <div style="display: flex; gap: 15px; padding: 15px; background: rgba(255, 165, 0, 0.1); border-radius: 8px; border-left: 3px solid orange;">
                            <div style="width: 40px; height: 40px; background: rgba(255, 165, 0, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-hand-holding-usd" style="color: orange;"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; margin-bottom: 5px;">이피해님이 합의금을 제안했습니다</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">사건 2024형제67890 ? 1시간 전</div>
                            </div>
                            <button class="btn btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem;">확인</button>
                        </div>

                        <div style="display: flex; gap: 15px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px; opacity: 0.7;">
                            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-file-alt" style="color: var(--text-muted);"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; margin-bottom: 5px;">사과문 전송이 완료되었습니다</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">사건 2024형제12345 ? 어제</div>
                            </div>
                        </div>

                        <div style="display: flex; gap: 15px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px; opacity: 0.7;">
                            <div style="width: 40px; height: 40px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                                <i class="fas fa-user-plus" style="color: var(--text-muted);"></i>
                            </div>
                            <div style="flex: 1;">
                                <div style="font-weight: 600; margin-bottom: 5px;">새로운 사건이 등록되었습니다</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">사건 2024형제11111 ? 2일 전</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ==================== SETTINGS PAGE ====================
    function getSettingsPageHTML() {
        return `
            <div class="top-bar">
                <h2>설정</h2>
            </div>

            <div style="max-width: 800px; margin: 20px auto; display: flex; flex-direction: column; gap: 20px;">
                <!-- 계정 설정 -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-user-cog"></i> 계정 설정</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button class="btn btn-glass" style="justify-content: space-between; width: 100%; text-align: left;">
                            <span><i class="fas fa-envelope" style="margin-right: 10px;"></i> 이메일 변경</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-glass" style="justify-content: space-between; width: 100%; text-align: left;">
                            <span><i class="fas fa-key" style="margin-right: 10px;"></i> 비밀번호 변경</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-glass" style="justify-content: space-between; width: 100%; text-align: left;">
                            <span><i class="fas fa-phone" style="margin-right: 10px;"></i> 휴대폰 번호 변경</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>

                <!-- 알림 설정 -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-bell"></i> 알림 설정</h3>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <div>
                                <div style="font-weight: 600;">새 메시지 알림</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">상대방이 메시지를 보낼 때 알림</div>
                            </div>
                            <label class="switch">
                                <input type="checkbox" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <div>
                                <div style="font-weight: 600;">합의금 제안 알림</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">새로운 제안이 들어오면 알림</div>
                            </div>
                            <label class="switch">
                                <input type="checkbox" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <div>
                                <div style="font-weight: 600;">이메일 알림</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">중요한 업데이트를 이메일로 수신</div>
                            </div>
                            <label class="switch">
                                <input type="checkbox">
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0;">
                            <div>
                                <div style="font-weight: 600;">푸시 알림</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">브라우저 푸시 알림 활성화</div>
                            </div>
                            <label class="switch">
                                <input type="checkbox" checked>
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- 보안 설정 -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-shield-alt"></i> 보안 설정</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button class="btn btn-glass" style="justify-content: space-between; width: 100%; text-align: left;">
                            <span><i class="fas fa-mobile-alt" style="margin-right: 10px;"></i> 2단계 인증 (OTP)</span>
                            <span class="status-badge" style="background: rgba(255,255,255,0.1);">미설정</span>
                        </button>
                        <button class="btn btn-glass" style="justify-content: space-between; width: 100%; text-align: left;">
                            <span><i class="fas fa-history" style="margin-right: 10px;"></i> 로그인 기록 확인</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-glass" style="justify-content: space-between; width: 100%; text-align: left;">
                            <span><i class="fas fa-laptop" style="margin-right: 10px;"></i> 연결된 기기 관리</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>

                <!-- 기타 -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-ellipsis-h"></i> 기타</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button class="btn btn-glass" style="justify-content: space-between; width: 100%; text-align: left;">
                            <span><i class="fas fa-file-contract" style="margin-right: 10px;"></i> 개인정보 처리방침</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-glass" style="justify-content: space-between; width: 100%; text-align: left;">
                            <span><i class="fas fa-file-alt" style="margin-right: 10px;"></i> 이용약관</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn" style="justify-content: center; width: 100%; background: rgba(255,0,0,0.1); color: #ff4444; border: 1px solid rgba(255,0,0,0.3);">
                            <i class="fas fa-user-times" style="margin-right: 10px;"></i> 회원 탈퇴
                        </button>
                    </div>
                </div>
            </div>

            <style>
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 26px;
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(255,255,255,0.1);
                    transition: .4s;
                    border-radius: 34px;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 18px;
                    width: 18px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider {
                    background-color: var(--secondary);
                }
                input:checked + .slider:before {
                    transform: translateX(24px);
                }
            </style>
        `;
    }

    // ==================== HELP PAGE ====================
    function getHelpPageHTML() {
        return `
            <div class="top-bar">
                <h2>도움말</h2>
            </div>

            <div style="max-width: 900px; margin: 20px auto; display: flex; flex-direction: column; gap: 20px;">
                <!-- FAQ -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-question-circle"></i> 자주 묻는 질문 (FAQ)</h3>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <details style="padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px; cursor: pointer;">
                            <summary style="font-weight: 600; margin-bottom: 10px;">Q. 합의금은 어떻게 결정하나요?</summary>
                            <p style="color: var(--text-muted); line-height: 1.6; margin-top: 10px;">
                                AI가 유사 판례 데이터를 분석하여 평균 합의금을 제시합니다. 익명 블라인드 제안을 통해 금액을 조율하며, 
                                격차가 클 경우 단계별 피드백을 제공하여 합의를 지원합니다.
                            </p>
                        </details>
                        <details style="padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px; cursor: pointer;">
                            <summary style="font-weight: 600; margin-bottom: 10px;">Q. 상대방 정보가 공개되나요?</summary>
                            <p style="color: var(--text-muted); line-height: 1.6; margin-top: 10px;">
                                기본적으로 이름만 공개되며, 연락처는 보호합니다. 안심 채팅을 통해 익명으로 대화할 수 있으며, 
                                합의가 완료된 후에만 상세 정보가 공유됩니다.
                            </p>
                        </details>
                        <details style="padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px; cursor: pointer;">
                            <summary style="font-weight: 600; margin-bottom: 10px;">Q. 합의서는 법적 효력이 있나요?</summary>
                            <p style="color: var(--text-muted); line-height: 1.6; margin-top: 10px;">
                                네, 플랫폼에서 작성된 합의서는 전자서명법에 따라 법적 효력이 있습니다. 
                                양쪽의 전자 서명이 완료되면 PDF로 다운로드 가능하며, 법원 제출용으로 사용할 수 있습니다.
                            </p>
                        </details>
                        <details style="padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px; cursor: pointer;">
                            <summary style="font-weight: 600; margin-bottom: 10px;">Q. 에스크로 서비스는 무엇인가요?</summary>
                            <p style="color: var(--text-muted); line-height: 1.6; margin-top: 10px;">
                                합의금을 안전하게 보관하는 제3자 예치 서비스입니다. 피의자가 합의금을 입금하면 
                                플랫폼이 보관하고, 합의서 작성 완료 후 피해자에게 전달합니다.
                            </p>
                        </details>
                    </div>
                </div>

                <!-- 고객센터 -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-headset"></i> 고객센터</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="padding: 20px; background: rgba(255,255,255,0.03); border-radius: 8px; text-align: center;">
                            <i class="fas fa-phone" style="font-size: 2rem; color: var(--primary); margin-bottom: 10px;"></i>
                            <div style="font-weight: 600; margin-bottom: 5px;">전화 상담</div>
                            <div style="font-size: 0.9rem; color: var(--text-muted);">1588-XXXX</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">평일 09:00 - 18:00</div>
                        </div>
                        <div style="padding: 20px; background: rgba(255,255,255,0.03); border-radius: 8px; text-align: center;">
                            <i class="fas fa-envelope" style="font-size: 2rem; color: var(--secondary); margin-bottom: 10px;"></i>
                            <div style="font-weight: 600; margin-bottom: 5px;">이메일 문의</div>
                            <div style="font-size: 0.9rem; color: var(--text-muted);">support@SafeHappE.com</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">24시간 접수</div>
                        </div>
                        <div style="padding: 20px; background: rgba(255,255,255,0.03); border-radius: 8px; text-align: center;">
                            <i class="fab fa-kickstarter-k" style="font-size: 2rem; color: #FFE812; margin-bottom: 10px;"></i>
                            <div style="font-weight: 600; margin-bottom: 5px;">카카오톡 상담</div>
                            <div style="font-size: 0.9rem; color: var(--text-muted);">@SafeHappE</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 5px;">평일 09:00 - 18:00</div>
                        </div>
                    </div>
                </div>

                <!-- 사용 가이드 -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-book"></i> 사용 가이드</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button class="btn btn-glass" style="justify-content: space-between; width: 100%; text-align: left;">
                            <span><i class="fas fa-play-circle" style="margin-right: 10px;"></i> 처음 사용하시나요?</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-glass" style="justify-content: space-between; width: 100%; text-align: left;">
                            <span><i class="fas fa-paper-plane" style="margin-right: 10px;"></i> 합의 요청 보내는 방법</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-glass" style="justify-content: space-between; width: 100%; text-align: left;">
                            <span><i class="fas fa-hand-holding-usd" style="margin-right: 10px;"></i> 블라인드 제안 사용법</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-glass" style="justify-content: space-between; width: 100%; text-align: left;">
                            <span><i class="fas fa-file-signature" style="margin-right: 10px;"></i> 합의서 작성 가이드</span>
                            <i class="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Logout function
    window.logout = function () {
        if (confirm('로그아웃 하시겠습니까?')) {
            localStorage.clear();
            window.location.href = 'index.html';
        }
    };

    // ==================== INITIALIZE CASE DETAIL NAV ====================
    // Legacy logic for open_detail removed as it is handled by redirection at the top.
    // ==================== CASE REGISTRATION MODAL ====================
    // ==================== NEW: Room & Choice Logic ====================
    window.openRegisterModal = function () {
        // Open Choice Modal instead of direct register
        document.getElementById('choiceModal').style.display = 'flex';
    };

    window.closeChoiceModal = function () {
        document.getElementById('choiceModal').style.display = 'none';
    };

    // Create Room
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
                fetchAllCases();
            } else {
                alert('개설 실패: ' + data.error);
            }
        } catch (err) {
            alert('오류 발생: ' + err.message);
        }
    };

    // Join Room
    window.openJoinRoomModal = function () {
        closeChoiceModal();
        document.getElementById('joinRoomModal').style.display = 'flex';
        // Immediately load recent rooms
        document.getElementById('roomSearchInput').value = '';
        searchRooms();
    };
    window.closeJoinRoomModal = function () {
        document.getElementById('joinRoomModal').style.display = 'none';
        document.getElementById('roomSearchInput').value = '';
    };
    window.searchRooms = async function () {
        const query = document.getElementById('roomSearchInput').value;
        const listArea = document.getElementById('roomListArea');

        // Show loading state
        listArea.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> 방 목록을 불러오는 중...</div>';

        const userId = localStorage.getItem('user_id');

        try {
            // Pass empty query to get all/recent rooms
            const res = await fetch(`${API_BASE}/case/search?query=${encodeURIComponent(query || '')}&userId=${userId}`);
            const data = await res.json();

            if (data.success && data.rooms.length > 0) {
                listArea.innerHTML = '';

                // Add a small header if showing all rooms
                if (!query) {
                    const header = document.createElement('div');
                    header.style.padding = '0 5px 10px 5px';
                    header.style.fontSize = '0.9rem';
                    header.style.color = 'var(--text-muted)';
                    header.innerHTML = '<i class="fas fa-list"></i> 최근 개설된 방';
                    listArea.appendChild(header);
                }

                data.rooms.forEach(room => {
                    // Safety: Skip my own rooms locally
                    if (room.creatorId && room.creatorId == userId) return;

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
            } else {
                listArea.innerHTML = '<div style="text-align: center; padding: 30px; color: var(--text-muted);">개설된 방이 없거나 검색 결과가 없습니다.</div>';
            }
        } catch (err) {
            console.error(err);
            listArea.innerHTML = '<div style="text-align: center; padding: 20px; color: #ff6b6b;">목록을 불러오지 못했습니다.</div>';
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
                fetchAllCases();
            } else {
                alert('입장 실패: ' + data.error);
            }
        } catch (err) {
            alert('오류: ' + err.message);
        }
    };

    // Legacy Register Function (Hidden but kept if needed, or repurposed)
    window.submitRegisterCase_Legacy = async function (e) {
        e.preventDefault();
        const roleInputs = document.getElementsByName('caseRole');
        let selectedRole = null;
        for (const radio of roleInputs) {
            if (radio.checked) {
                selectedRole = radio.value;
                break;
            }
        }

        const caseNumber = document.getElementById('regCaseNumber').value;
        const summary = document.getElementById('regSummary').value;
        const userId = localStorage.getItem('user_id');

        if (!selectedRole) {
            alert('역할을 선택해주세요.');
            return;
        }

        if (DEMO_MODE) {
            // Simulation for Demo Mode
            alert('?? 데모 모드: 사건이 등록되었습니다.\n' + caseNumber + ' (' + selectedRole + ')');
            closeRegisterModal();
            // Reload cases (mock)
            loadPage('cases');
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/case/link`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    caseNumber: caseNumber,
                    role: selectedRole,
                    summary: summary
                })
            });

            const data = await res.json();

            if (data.success) {
                alert('사건이 성공적으로 등록되었습니다.');
                closeRegisterModal();
                fetchAllCases(); // Reload list
            } else {
                alert('등록 실패: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('오류가 발생했습니다: ' + err.message);
        }
    }

    // ==================== GUIDE PAGE ====================
    function getGuidePageHTML() {
        return `
            <div class="top-bar">
                <div>
                    <h2 style="margin-bottom: 5px;">형사 합의 가이드</h2>
                    <p style="color: var(--text-muted);">안전하고 원만한 합의를 위한 필수 정보를 확인하세요.</p>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 30px;">
                
                <!-- 1. Intro & Meaning -->
                <div class="glass-card" style="padding: 30px;">
                    <h3 style="margin-bottom: 20px; font-size: 1.3rem; border-left: 4px solid var(--primary); padding-left: 15px;">
                        형사 합의란 무엇인가요?
                    </h3>
                    <p style="line-height: 1.8; color: #ddd; margin-bottom: 20px;">
                        형사 합의는 단순한 금전적 보상을 넘어, 가해자가 자신의 잘못을 진심으로 뉘우치고 
                        <span style="color: #4A9EFF; font-weight: bold;">피해 회복을 위해 노력했음</span>을 증명하는 공식적인 법적 절차입니다.<br>
                        이는 수사기관과 법원에 제출되는 가장 중요한 양형 자료 중 하나로, 사건의 원만한 해결을 위한 첫걸음입니다.
                    </p>
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px;">
                        <div style="font-weight: bold; margin-bottom: 8px; color: var(--text-muted); font-size: 0.9rem;">관련 법률</div>
                        <div style="font-style: italic; color: #ccc;">
                            "범죄의 정상에 참작할 만한 사유가 있는 때에는 작량하여 그 형을 감경할 수 있다."<br>
                            - <span style="color: #FFB84D;">형법 제53조 (작량감경)</span>
                        </div>
                    </div>
                </div>

                <!-- 2. Benefits -->
                <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div class="glass-card">
                        <h4 style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-gavel" style="color: #FF6B6B;"></i> 가해자(피의자)의 이점
                        </h4>
                        <ul style="line-height: 1.7; color: var(--text-muted); padding-left: 20px;">
                            <li>처벌 수위가 대폭 낮아질 수 있습니다. (기소유예, 집행유예 등)</li>
                            <li>반의사불벌죄의 경우, 합의 시 <strong style="color: #fff;">처벌을 면할 수 있습니다.</strong></li>
                            <li>전과 기록을 최소화하여 사회생활의 불이익을 막을 수 있습니다.</li>
                        </ul>
                    </div>
                    <div class="glass-card">
                        <h4 style="margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                            <i class="fas fa-heart" style="color: #4A9EFF;"></i> 피해자의 이점
                        </h4>
                        <ul style="line-height: 1.7; color: var(--text-muted); padding-left: 20px;">
                            <li>별도의 복잡한 민사 소송 없이 <strong style="color: #fff;">신속하게 피해 배상</strong>을 받을 수 있습니다.</li>
                            <li>사건을 조기에 종결하고 일상 생활로 빠르게 복귀할 수 있습니다.</li>
                            <li>가해자로부터 진심 어린 사과를 받고 심리적 안정을 찾을 수 있습니다.</li>
                        </ul>
                    </div>
                </div>

                <!-- 3. Why SafeHappE -->
                <div class="glass-card" style="background: linear-gradient(135deg, rgba(74, 158, 255, 0.1), rgba(124, 58, 237, 0.1)); border: 1px solid rgba(255,255,255,0.1);">
                    <h3 style="text-align: center; margin-bottom: 30px;">SafeHappE는 무엇이 다른가요?</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; text-align: center;">
                        <div>
                            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 1.5rem;">
                                <i class="fas fa-user-shield"></i>
                            </div>
                            <h4 style="margin-bottom: 10px;">철저한 비대면</h4>
                            <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">
                                서로 연락처를 몰라도 합의가 가능합니다.<br>
                                스토킹이나 보복 범죄에 대한<br>막연한 두려움을 해소합니다.
                            </p>
                        </div>
                        <div>
                            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 1.5rem;">
                                <i class="fas fa-handshake"></i>
                            </div>
                            <h4 style="margin-bottom: 10px;">합리적 제안</h4>
                            <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">
                                블라인드 제안 방식을 통해<br>감정적 대립 없이 서로가 원하는<br>합의점을 찾아갑니다.
                            </p>
                        </div>
                        <div>
                            <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-size: 1.5rem;">
                                <i class="fas fa-tasks"></i>
                            </div>
                            <h4 style="margin-bottom: 10px;">체계적 합의 관리</h4>
                            <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">
                                합의에 이르는 모든 과정을 기록하고<br>단계별로 지원하여 성실한<br>합의 노력을 돕습니다.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- 4. How to Use (Steps) -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 25px;">이용 방법 안내</h3>
                    <div style="display: flex; justify-content: space-between; position: relative;">
                        <!-- Connection Line -->
                        <div style="position: absolute; top: 25px; left: 50px; right: 50px; height: 2px; background: rgba(255,255,255,0.1); z-index: 0;"></div>
                        
                        <!-- Step 1 -->
                        <div style="text-align: center; position: relative; z-index: 1; flex: 1;">
                            <div style="width: 50px; height: 50px; background: var(--bg-card); border: 2px solid var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-weight: bold;">1</div>
                            <h4 style="font-size: 0.95rem; margin-bottom: 5px;">사건 등록</h4>
                            <p style="font-size: 0.8rem; color: var(--text-muted);">본인의 사건 정보를<br>입력하세요.</p>
                        </div>
                         <!-- Step 2 -->
                        <div style="text-align: center; position: relative; z-index: 1; flex: 1;">
                            <div style="width: 50px; height: 50px; background: var(--bg-card); border: 2px solid var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-weight: bold;">2</div>
                            <h4 style="font-size: 0.95rem; margin-bottom: 5px;">합의 요청</h4>
                            <p style="font-size: 0.8rem; color: var(--text-muted);">안심 번호로 상대방에게<br>알림 메시지를 발송합니다.</p>
                        </div>
                         <!-- Step 3 -->
                        <div style="text-align: center; position: relative; z-index: 1; flex: 1;">
                            <div style="width: 50px; height: 50px; background: var(--bg-card); border: 2px solid var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-weight: bold;">3</div>
                            <h4 style="font-size: 0.95rem; margin-bottom: 5px;">블라인드 조율</h4>
                            <p style="font-size: 0.8rem; color: var(--text-muted);">희망 금액을 입력하고<br>격차를 좁혀갑니다.</p>
                        </div>
                         <!-- Step 4 -->
                        <div style="text-align: center; position: relative; z-index: 1; flex: 1;">
                            <div style="width: 50px; height: 50px; background: var(--bg-card); border: 2px solid var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; font-weight: bold; color: var(--secondary);">4</div>
                            <h4 style="font-size: 0.95rem; margin-bottom: 5px;">합의서 날인</h4>
                            <p style="font-size: 0.8rem; color: var(--text-muted);">합의가 성사되면<br>즉시 문서를 생성합니다.</p>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 40px;">
                        <button class="btn btn-primary" onclick="location.href='dashboard.html?page=cases'">내 사건 등록하러 가기</button>
                    </div>
                </div>

            </div>
        `;
    }
});
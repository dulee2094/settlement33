// js/dashboard_view.js
// Handles HTML rendering for Dashboard

window.getCasesPageHTML = function () {
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
};

window.createCaseCard = function (caseItem) {
    const card = document.createElement('div');
    card.className = 'glass-card';
    card.style.cursor = 'pointer';
    card.style.transition = 'all 0.3s';
    card.style.borderLeft = '4px solid ' + getStatusColor(caseItem.connectionStatus);

    card.onclick = () => {
        window.openCaseDetail(
            caseItem.caseId,
            caseItem.caseNumber,
            caseItem.myRole,
            caseItem.connectionStatus,
            caseItem.counterpartyName,
            caseItem.registrationDate,
            caseItem.roomTitle,
            caseItem.summary,
            caseItem.apologyStatus,
            caseItem.apologyContent
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

    let displayTitle = caseItem.roomTitle || caseItem.summary || caseItem.caseNumber;
    let subTitle = '';

    if (caseItem.roomTitle) {
        subTitle = `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal; margin-left: 8px;">Ref: ${caseItem.caseNumber}</span>`;
    } else if (displayTitle !== caseItem.caseNumber) {
        subTitle = `<span style="font-size: 0.8rem; color: var(--text-muted); font-weight: normal; margin-left: 8px;">${caseItem.caseNumber}</span>`;
    }

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
};

window.getStatusColor = function (status) {
    switch (status) {
        case 'connected': return 'var(--secondary)';
        case 'pending': return 'orange';
        case 'invited': return 'rgba(255,255,255,0.3)';
        default: return 'rgba(255,255,255,0.1)';
    }
};

window.getStatusBadge = function (status) {
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
};

window.getProfilePageHTML = function () {
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
};

window.getNotificationsPageHTML = function () {
    return `
        <div class="top-bar">
            <h2>알림 센터</h2>
            <button class="btn btn-glass" style="font-size: 0.85rem; padding: 0.5rem 1rem;" onclick="markAllNotificationsRead()">
                <i class="fas fa-check-double"></i> 모두 읽음 처리
            </button>
        </div>

        <div style="max-width: 900px; margin: 20px auto;">
            <div class="glass-card">
                <div id="notificationList" style="display: flex; flex-direction: column; gap: 10px;">
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--text-muted); margin-bottom: 15px;"></i>
                        <p style="color: var(--text-muted);">알림을 불러오는 중...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
};

window.getSettingsPageHTML = function () {
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
                    <button class="btn" style="justify-content: center; width: 100%; background: rgba(255,0,0,0.1); color: #ff4444; border: 1px solid rgba(255,0,0,0.3);">
                        <i class="fas fa-user-times" style="margin-right: 10px;"></i> 회원 탈퇴
                    </button>
                </div>
            </div>
        </div>
        <style>
            .switch { position: relative; display: inline-block; width: 50px; height: 26px; }
            .switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.1); transition: .4s; border-radius: 34px; }
            .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
            input:checked + .slider { background-color: var(--secondary); }
            input:checked + .slider:before { transform: translateX(24px); }
        </style>
    `;
};

window.getHelpPageHTML = function () {
    // ... (Omitted full repeated content, but assuming standard FAQ structure)
    return `
       <div class="top-bar"><h2>도움말</h2></div>
       <div style="max-width: 900px; margin: 20px auto; display: flex; flex-direction: column; gap: 20px;">
           <div class="glass-card">
               <h3 style="margin-bottom: 20px;">자주 묻는 질문 (FAQ)</h3>
               <p style="color:var(--text-muted);">준비 중입니다.</p>
           </div>
       </div>
   `;
};

window.getGuidePageHTML = function () {
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
                    <p style="line-height: 1.8; color: #cbd5e1; margin-bottom: 0;">
                        형사 합의는 단순한 금전적 보상을 넘어, 가해자가 자신의 잘못을 진심으로 뉘우치고 
                        <span style="color: #60a5fa; font-weight: bold;">피해 회복을 위해 노력했음</span>을 증명하는 공식적인 법적 절차입니다.<br>
                        이는 수사기관과 법원에 제출되는 가장 중요한 양형 자료 중 하나로, 사건의 원만한 해결을 위한 첫걸음입니다.
                    </p>
                </div>

                <!-- 2. Benefits for Both Sides (New) -->
                <div class="glass-card" style="padding: 30px;">
                    <h3 style="margin-bottom: 25px; text-align: center;">왜 합의가 필요할까요?</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
                        <!-- Offender Side -->
                        <div style="background: rgba(255, 255, 255, 0.03); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="display: flex; align-items: center; margin-bottom: 15px; color: #fbbf24;">
                                <i class="fas fa-user-tie" style="font-size: 1.2rem; margin-right: 10px;"></i>
                                <h4 style="margin: 0;">피의자 (가해자) 입장</h4>
                            </div>
                            <ul style="padding-left: 20px; color: #94a3b8; font-size: 0.95rem; line-height: 1.8;">
                                <li style="margin-bottom: 10px;">⚖️ <strong>양형의 핵심 요소</strong><br>감형을 위한 가장 확실하고 필수적인 자료가 됩니다.</li>
                                <li style="margin-bottom: 10px;">🛡️ <strong>전과 기록 최소화</strong><br>기소유예 등 불이익을 최소화할 수 있는 기회입니다.</li>
                                <li>🕊️ <strong>심리적 부채 해소</strong><br>처벌과 별개로 도의적 책임을 다했다는 안도감을 줍니다.</li>
                            </ul>
                        </div>

                        <!-- Victim Side -->
                        <div style="background: rgba(255, 255, 255, 0.03); padding: 25px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="display: flex; align-items: center; margin-bottom: 15px; color: #34d399;">
                                <i class="fas fa-user-shield" style="font-size: 1.2rem; margin-right: 10px;"></i>
                                <h4 style="margin: 0;">피해자 입장</h4>
                            </div>
                            <ul style="padding-left: 20px; color: #94a3b8; font-size: 0.95rem; line-height: 1.8;">
                                <li style="margin-bottom: 10px;">💰 <strong>실질적 피해 회복</strong><br>민사 소송보다 빠르고 확실하게 배상받을 수 있습니다.</li>
                                <li style="margin-bottom: 10px;">🏥 <strong>사건의 조기 종결</strong><br>수사/재판의 긴 스트레스에서 벗어나 일상으로 복귀합니다.</li>
                                <li>🤝 <strong>진정한 사과 수용</strong><br>가해자의 반성을 공식적으로 확인하고 치유를 시작합니다.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- 3. Inspirational Quote (New) -->
                <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05)); padding: 40px; border-radius: 16px; text-align: center; border: 1px solid rgba(59, 130, 246, 0.2);">
                    <i class="fas fa-quote-left" style="font-size: 2rem; color: rgba(96, 165, 250, 0.5); margin-bottom: 15px;"></i>
                    <p style="font-size: 1.2rem; font-style: italic; color: #e2e8f0; margin-bottom: 15px; font-weight: 300;">
                        "용서는 과거를 바꿀 수 없지만,<br>미래를 확장시킨다."
                    </p>
                    <p style="color: #94a3b8; font-size: 0.9rem;">- Paul Boese -</p>
                </div>

                <!-- 4. How to Use (Steps) -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 25px;">이용 방법 안내</h3>
                    <div style="display: flex; justify-content: space-between; position: relative;">
                        <div style="position: absolute; top: 25px; left: 50px; right: 50px; height: 2px; background: rgba(255,255,255,0.1); z-index: 0;"></div>
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
};


// case_detail_view.js
// Handles HTML rendering for general sections (Overview, Proposal, Analysis, Mediation)
// and shared helper functions.

window.getRoleText = function (role) {
    return role === 'offender' ? '피의자 (가해자)' : '피해자';
};

window.getStatusText = function (status) {
    switch (status) {
        case 'connected': return '연결 완료';
        case 'pending': return '수락 대기';
        case 'invited': return '가입 대기';
        case 'negotiating': return '협의 중';
        case 'completed': return '합의 완료';
        default: return '대기 중';
    }
};

window.getOverviewHTML = function () {
    const caseNumber = localStorage.getItem('current_case_number') || '-';
    const caseTitle = localStorage.getItem('current_case_title') || '';
    const myRole = localStorage.getItem('current_case_role') || 'offender';
    const status = localStorage.getItem('current_case_status') || 'pending';
    const counterparty = localStorage.getItem('current_counterparty') || '상대방';
    const date = localStorage.getItem('current_case_date') || new Date().toLocaleDateString();

    const isConnected = ['connected', 'negotiating', 'completed'].includes(status);
    const isNegotiating = ['negotiating', 'completed'].includes(status);
    const isAgreed = ['completed'].includes(status);
    const isEscrow = false;

    const getIconClass = (condition) => condition ? 'fas fa-check-circle' : 'far fa-circle';
    const getColor = (condition) => condition ? 'var(--secondary)' : 'var(--text-muted)';
    const getOpacity = (condition) => condition ? '1' : '0.5';

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
                        <span style="font-weight: 600;">${window.getRoleText(myRole)}</span>
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
                        <span style="font-weight: 600; color: var(--secondary);">${window.getStatusText(status)}</span>
                    </div>
                </div>
            </div>

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

            ${window.getQuickActionsHTML(myRole)}

            <div class="glass-card" style="grid-column: 1 / -1;">
                <h3 style="margin-bottom: 20px;"><i class="fas fa-history"></i> 최근 활동 (Beta)</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <input type="text" disabled value="최근 활동 내역이 없습니다." style="background:none; border:none; color: var(--text-muted);">
                </div>
            </div>
        </div>
    `;
};

window.getQuickActionsHTML = function (role) {
    const status = localStorage.getItem('current_case_status');
    const isConnected = ['connected', 'negotiating', 'completed'].includes(status);
    const isNegotiating = ['negotiating', 'completed'].includes(status);
    const isCompleted = status === 'completed';

    const getBtnState = (isCompleted, isCurrent) => {
        if (isCompleted) return { class: 'status-completed', icon: 'fa-check-circle', disabled: '' };
        if (isCurrent) return { class: 'status-current pulse', icon: 'fa-exclamation-circle', disabled: '' };
        return { class: '', icon: 'fa-lock', disabled: 'disabled style="opacity:0.5; cursor:not-allowed;"' };
    };

    const btnRequest = getBtnState(isConnected, !isConnected);
    const btnApology = getBtnState(isNegotiating, isConnected && !isNegotiating);
    const btnProposal = getBtnState(isCompleted, isNegotiating && !isCompleted);
    const btnAgreement = getBtnState(false, isCompleted);
    const btnAccount = getBtnState(false, isCompleted);

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
};

window.getProposalHTML = function () {
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
};

window.getAnalysisHTML = function () {
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
};

window.generateChartData = function () {
    const base = 300;
    const data = [];
    for (let i = 0; i < 6; i++) {
        data.push(base + Math.floor(Math.random() * 200) - 100);
    }
    return data;
};

window.initializeChart = function () {
    const ctx = document.getElementById('analysisChart');
    if (!ctx) return;
    if (typeof Chart === 'undefined') return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['사례1', '사례2', '사례3', '사례4', '사례5', '귀하의 사건'],
            datasets: [{
                label: '합의금 분포 (단위: 만원)',
                data: window.generateChartData(),
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
};

window.getMediationHTML = function () {
    return `
        <div class="glass-card" style="max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 30px;">
            <div style="display: flex; gap: 20px; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 30px; flex-wrap: wrap;">
                <div style="flex-shrink: 0; position: relative;">
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
            </div>
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
};


window.openProfileModal = function () {
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'flex';
};

window.closeProfileModal = function () {
    const modal = document.getElementById('profileModal');
    if (modal) modal.style.display = 'none';
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

window.getApologyHTML = function () {
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
        const apologyStatus = localStorage.getItem('current_apology_status') || 'none';
        const apologyContent = localStorage.getItem('current_apology_content') || '';
        const apologyDate = localStorage.getItem('current_apology_date') || new Date().toLocaleDateString();

        if (apologyStatus === 'sent' || apologyStatus === 'read') {
            return `
                <div class="glass-card" style="max-width: 800px; margin: 0 auto;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-envelope-open-text"></i> 도착한 사과문</h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">피의자로부터 도착한 사과문입니다.</p>

                    <div id="apologyImageContainer" style="margin-bottom: 30px; text-align: center; display: none;">
                        <div style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 8px; display: inline-block;">
                            <img id="apologyImage" src="" alt="사과문 이미지" style="max-width: 100%; border-radius: 4px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);">
                        </div>
                        <div style="margin-top: 15px;">
                            <a id="apologyDownloadBtn" href="#" download class="btn btn-glass" style="font-size: 0.9rem; padding: 8px 16px;">
                                <i class="fas fa-download"></i> 이미지 원본 다운로드
                            </a>
                        </div>
                    </div>

                    <div style="background: rgba(255,255,255,0.03); padding: 30px; border-radius: 12px; margin-bottom: 20px; line-height: 1.8; white-space: pre-wrap; border: 1px solid rgba(255,255,255,0.05);">${apologyContent}</div>
                    
                    <div style="display: flex; justify-content: flex-end;">
                        <span style="font-size: 0.85rem; color: var(--text-muted);">${apologyDate} 수신됨</span>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="glass-card" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 60px 40px;">
                    <div style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px;">
                        <i class="far fa-envelope" style="font-size: 2.5rem; color: var(--text-muted);"></i>
                    </div>
                    <h3 style="margin-bottom: 15px; color: var(--text-muted);">아직 도착한 사과문이 없습니다</h3>
                    <p style="color: var(--text-muted); opacity: 0.6; margin-bottom: 0;">
                        피의자가 아직 사과문을 작성하지 않았습니다.<br>
                        사과문이 도착하면 알림을 보내드립니다.
                    </p>
                </div>
            `;
        }
    }
};

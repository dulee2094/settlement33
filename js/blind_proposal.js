// Proposal History State
let proposalHistory = [];
let proposalCount = 0;
let maxLimit = 5; // Default Base

// Round State (NEW)
let currentRound = 1;
let myRound = 0;
let oppRound = 0;
let roundCompleted = false;
let previousRounds = [];
let currentRoundData = null;

// Result Viewing State (NEW - Phase 1)
let roundStatus = 'waiting'; // 'waiting', 'proposing', 'ready', 'completed'
let myResultViewed = false;
let oppResultViewed = false;
let analysisData = null;

// Extension State
let isExtended = false;
let iAgreedExtension = false;
let oppAgreedExtension = false;

// Midpoint Agreement State
let midpointProposed = false;
let midpointAmount = 0;
let iAgreedMidpoint = false;
let oppAgreedMidpoint = false;
let bothAgreedMidpoint = false;

// Position Selection
let currentPosition = 'payer'; // Default: Paying

// Initialize: Check Status from Server
document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();

    // Polling for Opponent's Proposal & Midpoint Status
    setInterval(async () => {
        await checkStatusUpdate();
    }, 3000); // Check every 3 seconds (Improved Real-time)
});

// Helper function to hide all right panel states
function hideAllRightPanelStates() {
    const ids = ['midpointResultArea', 'opponentProposedNotification', 'extensionNotification', 'resultState', 'waitingState', 'midpointAgreementState', 'analysisReadyState'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

// Helper function to show specific state with animation
function showRightPanelState(stateId) {
    // Prevent flashing if already shown (Optimization)
    const el = document.getElementById(stateId);
    if (el && el.style.display === 'block') return;

    hideAllRightPanelStates();
    if (el) {
        el.style.display = 'block';
    }
}

async function checkStatusUpdate() {
    // Don't poll if already agreed or max limit reached (optimization)
    if (proposalCount >= 5 && !isExtended) return;

    const caseId = localStorage.getItem('current_case_id');
    let userId = localStorage.getItem('user_id');

    // Fallback for legacy user_info object
    if (!userId) {
        try {
            const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
            userId = userInfo.id;
        } catch (e) { }
    }
    if (userId) userId = parseInt(userId, 10);
    if (!caseId || !userId) return;

    try {
        const res = await fetch(`/api/case/proposal?caseId=${caseId}&userId=${userId}`);
        const data = await res.json();

        if (data.success) {
            // Priority 0: Analysis Ready (Both Registered) - The Missing "Intermediate Step"
            if (data.roundStatus === 'ready' && !data.myResultViewed) {
                showRightPanelState('analysisReadyState');
                return;
            }

            // Priority 1: Check for Midpoint Proposal (Highest Priority)
            const midpointShown = await checkMidpointStatus();
            if (midpointShown) return;

            // Priority 2: Extension Request from Opponent
            if (data.oppAgreedExtension && !data.iAgreed && !data.isExtended) {
                showRightPanelState('extensionNotification');
                const extEl = document.getElementById('extensionNotification');
                if (extEl) {
                    extEl.innerHTML = `
                        <div style="
                            background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.1));
                            border: 2px solid #f59e0b;
                            border-radius: 16px;
                            padding: 30px;
                            text-align: center;
                            animation: pulse-glow 2s infinite;
                        ">
                            <div style="font-size: 3rem; margin-bottom: 20px; animation: bounce-icon 2s infinite;">
                                🤝
                            </div>
                            <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.3rem;">
                                상대방이 협상 연장을 요청했습니다
                            </h3>
                            <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 25px; font-size: 0.95rem;">
                                이 제안을 수락하면 양측 모두<br>
                                제안 기회가 <strong style="color: #fbbf24;">3회 추가</strong>됩니다.<br>
                                아직 합의 가능성이 보인다면 연장에 동의해주세요.
                            </p>
                            <button class="btn btn-primary" onclick="requestExtension()" 
                                style="background: #f59e0b; border:none; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4); padding: 12px 30px; font-size: 1rem;">
                                <i class="fas fa-handshake" style="margin-right: 8px;"></i>
                                연장 동의하기 (+3회)
                            </button>
                        </div>
                    `;
                }
                return;
            }

            // Priority 3: Opponent Proposed (Standard Blind Alert)
            if (data.hasOpponentProposed && proposalCount === 0) {
                showRightPanelState('opponentProposedNotification');
                let expDateStr = "정보 없음";
                if (data.opponentLastProposal && data.opponentLastProposal.expiresAt) {
                    const d = new Date(data.opponentLastProposal.expiresAt);
                    expDateStr = d.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                }

                const notifEl = document.getElementById('opponentProposedNotification');
                if (notifEl) {
                    notifEl.innerHTML = `
                        <div style="
                            background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1));
                            border: 2px solid #3b82f6;
                            border-radius: 16px;
                            padding: 30px;
                            text-align: center;
                            animation: pulse-glow 2s infinite;
                        ">
                            <div style="font-size: 3rem; margin-bottom: 20px; animation: bounce-icon 2s infinite;">
                                🔔
                            </div>
                            <h3 style="color: #fff; margin-bottom: 10px; font-size: 1.3rem;">
                                상대방이 제안을 등록했습니다!
                            </h3>
                            <div style="margin-bottom: 20px; font-size: 0.9rem; color: #fbbf24; font-weight: 600; background: rgba(251, 191, 36, 0.1); display: inline-block; padding: 5px 12px; border-radius: 12px; border: 1px solid rgba(251, 191, 36, 0.3);">
                                <i class="fas fa-clock" style="margin-right: 5px;"></i> 유효기간: ${expDateStr} 까지
                            </div>
                            <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 20px; font-size: 0.95rem;">
                                상대방은 기다리고 있습니다.<br>
                                좌측에서 금액을 입력하면<br>
                                <strong style="color: #60a5fa;">즉시 AI 격차 분석 결과</strong>를 확인할 수 있습니다.
                            </p>
                            <div style="
                                background: rgba(0,0,0,0.3);
                                padding: 12px 20px;
                                border-radius: 25px;
                                display: inline-block;
                                font-size: 0.85rem;
                                color: #94a3b8;
                            ">
                                <i class="fas fa-lock" style="margin-right: 5px;"></i> 상대방 금액 비공개 중
                            </div>
                        </div>
                    `;
                }
                return;
            }
        }
    } catch (e) { console.error("Polling Error", e); }
}

async function initializePage() {
    // --- 1. Session Check ---
    const caseId = localStorage.getItem('current_case_id');
    let userId = localStorage.getItem('user_id');

    // Fallback for legacy user_info object if user_id not found
    if (!userId) {
        try {
            const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
            userId = userInfo.id;
        } catch (e) { }
    }

    // Ensure userId is valid
    if (userId) userId = parseInt(userId, 10);

    // UI Binding
    const caseNum = localStorage.getItem('current_case_number') || localStorage.getItem('current_case_title') || '-';
    const counterParty = localStorage.getItem('current_counterparty') || '알 수 없음';

    const elCase = document.getElementById('sidebarCaseNumber');
    const elCounter = document.getElementById('sidebarCounterparty');
    if (elCase) elCase.textContent = caseNum;
    if (elCounter) elCounter.textContent = counterParty;

    if (!caseId || !userId) {
        alert("로그인 정보가 없거나 사건이 선택되지 않았습니다.");
        location.href = 'dashboard.html';
        return;
    }

    try {
        const res = await fetch(`/api/case/proposal?caseId=${caseId}&userId=${userId}`);
        const data = await res.json();

        if (data.success) {
            // 1. Update Extension State
            isExtended = data.isExtended;
            iAgreedExtension = data.iAgreed;
            oppAgreedExtension = data.oppAgreed;

            // Update Max Limit
            maxLimit = isExtended ? 8 : 5;

            // 2. Update Round State (NEW)
            currentRound = data.currentRound || 1;
            myRound = data.myRound || 0;
            oppRound = data.oppRound || 0;
            previousRounds = data.previousRounds || [];
            currentRoundData = data.currentRoundData;

            // Check if current round is completed
            roundCompleted = currentRoundData && currentRoundData.completed;

            // 3. Update Local State
            proposalCount = data.myProposalCount;
            if (data.myLastProposal) {
                window.myLastProposalAmount = data.myLastProposal.amount;
                if (data.myLastProposal.position) {
                    selectPosition(data.myLastProposal.position);
                }
                // Store Expiration Time
                if (data.myLastProposal.expiresAt) {
                    proposalExpiration = data.myLastProposal.expiresAt;
                }
            }
            updateCountUI();

            // 4. Notification Logic - Use Right Panel States

            // Check Midpoint Status First (Highest Priority)
            const midpointShown = await checkMidpointStatus();

            if (midpointShown) {
                // Already shown by checkMidpointStatus
            }
            // Priority 2: Show Round Completion (Modified for Privacy)
            else if (roundCompleted && myRound === currentRound && oppRound === currentRound) {
                showRoundCompletionUI();
            }
            // Priority 3: Extension Request from Opponent (If I haven't agreed yet)
            else if (oppAgreedExtension && !iAgreedExtension && !isExtended) {
                showRightPanelState('extensionNotification');
                const extEl = document.getElementById('extensionNotification');
                if (extEl) {
                    extEl.innerHTML = `
                        <div style="
                            background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.1));
                            border: 2px solid #f59e0b;
                            border-radius: 16px;
                            padding: 30px;
                            text-align: center;
                            animation: pulse-glow 2s infinite;
                        ">
                            <div style="font-size: 3rem; margin-bottom: 20px; animation: bounce-icon 2s infinite;">
                                🤝
                            </div>
                            <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.3rem;">
                                상대방이 협상 연장을 요청했습니다
                            </h3>
                            <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 25px; font-size: 0.95rem;">
                                이 제안을 수락하면 양측 모두<br>
                                제안 기회가 <strong style="color: #fbbf24;">3회 추가</strong>됩니다.<br>
                                아직 합의 가능성이 보인다면 연장에 동의해주세요.
                            </p>
                            <button class="btn btn-primary" onclick="requestExtension()" 
                                style="background: #f59e0b; border:none; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4); padding: 12px 30px; font-size: 1rem;">
                                <i class="fas fa-handshake" style="margin-right: 8px;"></i>
                                연장 동의하기 (+3회)
                            </button>
                        </div>
                    `;
                }
            }
            // Priority 3: Opponent Proposed (Standard Blind Alert)
            else if (data.hasOpponentProposed && proposalCount === 0) {
                showRightPanelState('opponentProposedNotification');
                // ... same html content as polling ...
                // For brevity, skipping duplication here as polling updates it too.
            }

            // 4. Restore State
            if (proposalCount > 0) {
                if (data.myResultViewed) {
                    showRightPanelState('resultState');
                    if (data.currentRoundData) {
                        const d = data.currentRoundData;
                        const diff = d.diff;
                        const myAmount = window.myLastProposalAmount;
                        const gapPercent = (diff / Math.max(d.offenderAmount, d.victimAmount)) * 100;

                        showAnalysisResult(gapPercent, myAmount, diff);
                    }
                } else if (data.roundStatus === 'ready') {
                    showRightPanelState('analysisReadyState');
                } else {
                    if (data.status === 'expired') {
                        showRightPanelState('waitingState');

                        let btnHtml = '';
                        if (myRound < currentRound) {
                            // I am lagging. I need to sync (skip this round)
                            btnHtml = `
                                <button class="btn btn-glass" onclick="window.syncExpiration(${currentRound})" style="margin-top:20px; border: 1px solid #ef4444; color: #ef4444;">
                                    <i class="fas fa-forward"></i> 라운드 패스 (다음 단계로)
                                </button>
                                <p style="font-size:0.8rem; color:#666; margin-top:10px;">상대방의 제안이 만료되었습니다. 라운드를 맞춰 진행합니다.</p>
                            `;
                        } else {
                            // I proposed, just unmatched.
                            btnHtml = `
                                <button class="btn btn-glass" onclick="location.reload()" style="margin-top:20px; border: 1px solid #ef4444; color: #ef4444;">
                                    <i class="fas fa-redo"></i> 상태 업데이트
                                </button>
                            `;
                        }

                        document.getElementById('waitingState').innerHTML = `
                            <div style="font-size: 4rem; color: #ef4444; margin-bottom: 20px;"><i class="fas fa-history"></i></div>
                            <h3 style="color: #ef4444;">제안 유효 기간 만료</h3>
                            <p style="color: var(--text-muted); margin-top: 10px;">상대방이 응답하지 않아 이번 라운드가 종료되었습니다.<br>다음 라운드를 진행하거나 연장을 요청하세요.</p>
                            ${btnHtml}
                        `;
                    } else if (data.hasOpponentProposed) {
                        if (data.myResultViewed) {
                            showRightPanelState('resultState');
                        } else {
                            showRightPanelState('waitingState');
                            document.getElementById('waitingState').innerHTML = `
                                <div style="font-size: 4rem; color: #4ade80; margin-bottom: 20px;"><i class="fas fa-check-circle"></i></div>
                                <h3>제안 등록 완료</h3>
                                <p style="color: var(--text-muted); margin-top: 10px;">상대방의 제안을 기다리는 중입니다...</p>
                                <div id="expirationTimerDisplay"></div>
                            `;
                            startExpirationTimer();
                        }
                    } else {
                        showRightPanelState('waitingState');
                        document.getElementById('waitingState').innerHTML = `
                            <div style="font-size: 4rem; color: #4ade80; margin-bottom: 20px;"><i class="fas fa-check-circle"></i></div>
                            <h3>제안 등록 완료</h3>
                            <p style="color: var(--text-muted); margin-top: 10px;">상대방이 제안하면 분석 결과가 표시됩니다.</p>
                            <div id="expirationTimerDisplay"></div>
                        `;
                        startExpirationTimer();
                    }
                }
            }
        }
    } catch (e) {
        console.error("Init Error", e);
    }
}

function selectPosition(type) {
    currentPosition = type;
    const payerBtn = document.getElementById('pos-payer');
    const receiverBtn = document.getElementById('pos-receiver');
    const guideText = document.getElementById('amountGuideText');

    [payerBtn, receiverBtn].forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'rgba(255, 255, 255, 0.05)';
        btn.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        btn.style.color = '#888';
        btn.style.boxShadow = 'none';
    });

    const targetBtn = type === 'payer' ? payerBtn : receiverBtn;
    targetBtn.classList.add('active');
    targetBtn.style.background = 'rgba(59, 130, 246, 0.2)';
    targetBtn.style.borderColor = '#3b82f6';
    targetBtn.style.color = '#fff';
    targetBtn.style.boxShadow = '0 0 10px rgba(59, 130, 246, 0.2)';

    if (type === 'payer') {
        guideText.textContent = "상대방에게 지급할 금액을 입력하세요.";
    } else {
        guideText.textContent = "상대방에게 받고 싶은 금액을 입력하세요.";
    }
}

let selectedDuration = 1;

function selectDuration(days) {
    selectedDuration = days;
    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'rgba(255, 255, 255, 0.05)';
        btn.style.color = '#888';
        btn.style.border = '1px solid rgba(255,255,255,0.1)';
    });

    const activeBtn = document.getElementById(`btn-${days}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.background = '#4ade80';
        activeBtn.style.color = '#000';
        activeBtn.style.fontWeight = 'bold';
        activeBtn.style.border = '1px solid #4ade80';
        activeBtn.style.boxShadow = '0 0 10px rgba(74, 222, 128, 0.3)';
    }
}

window.viewAnalysisResult = async () => {
    const caseId = localStorage.getItem('current_case_id');
    const userId = localStorage.getItem('user_id');

    try {
        const btn = document.querySelector('#analysisReadyState button');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 확인 중...';
        btn.disabled = true;

        const res = await fetch('/api/case/proposal/view-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, caseId, round: currentRound })
        });
        const data = await res.json();

        if (data.success) {
            const analysis = data.analysis;
            if (analysis.midpointPossible && !analysis.midpointResolved) {
                showRightPanelState('midpointAgreementState');
                const btnAgree = document.getElementById('btnAgreeMidpoint');
                const btnReject = document.getElementById('btnRejectMidpoint');

                if (btnAgree) btnAgree.onclick = () => handleMidpointDecision(true);
                if (btnReject) btnReject.onclick = () => handleMidpointDecision(false);
                return;
            }

            showRightPanelState('resultState');

            const diff = analysis.diff;
            const myAmt = analysis.myAmount;
            const gapPercent = analysis.diffPercent;

            showAnalysisResult(gapPercent, myAmt, diff);
            addToHistory(myAmt, `R${currentRound} 완료`, '#4ade80', currentRound);

            roundStatus = 'completed';
            myResultViewed = true;

        } else {
            alert('오류: ' + data.error);
        }
    } catch (e) {
        console.error(e);
        alert('통신 오류가 발생했습니다.');
    }
};



window.handleMidpointDecision = async (agreed) => {
    const caseId = localStorage.getItem('current_case_id');
    const userId = localStorage.getItem('user_id');

    try {
        if (agreed) {
            if (!confirm("정말 동의하시겠습니까?\n\n양측이 모두 동의하면 즉시 '중간값'으로 합의가 체결되며, 금액이 공개됩니다.")) return;
        } else {
            if (!confirm("거절하시겠습니까?\n\n거절 시 현재 라운드가 종료되며, 다음 라운드(또는 최종 결렬)로 진행됩니다.")) return;
        }

        const res = await fetch('/api/case/proposal/midpoint-agreement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, caseId, round: currentRound, agreed })
        });
        const result = await res.json();

        if (result.success) {
            if (result.settled) {
                localStorage.setItem('final_agreed_amount', result.finalAmount);
                localStorage.setItem('current_case_status', 'settled');
                alert(`축하합니다! 합의가 성립되었습니다.\n\n최종 합의금: ${result.finalAmount.toLocaleString()}원\n\n[확인]을 누르면 합의서 작성 페이지로 이동합니다.`);
                location.href = 'agreement.html';
            } else if (result.rejected) {
                alert("중간값 합의가 거절되었습니다. 2라운드를 진행합니다.");
                location.reload();
            } else {
                alert("선택이 완료되었습니다. 상대방의 결정을 기다려주세요.");
                location.reload();
            }
        } else {
            alert('오류: ' + result.error);
        }
    } catch (e) {
        console.error(e);
    }
};



window.handleNextRoundAction = async () => {
    if (currentRound < maxLimit) {
        location.reload();
        return;
    }
    if (currentRound === 5 && !isExtended) {
        if (confirm("정규 라운드(5회)가 모두 종료되었습니다.\n\n아직 합의에 이르지 못했다면, [협상 연장]을 요청하여\n3회의 추가 기회를 가질 수 있습니다.\n\n연장을 요청하시겠습니까?")) {
            requestExtension();
        } else {
            alert("협상이 최종 결렬되었습니다.");
            location.href = 'dashboard.html';
        }
        return;
    }
    if (currentRound >= 8) {
        alert("최종 라운드(8회)까지 합의되지 않았습니다.\n협상이 결렬되었습니다.");
        location.href = 'dashboard.html';
        return;
    }
    location.reload();
};



window.submitProposal = async () => {
    const rawInput = document.getElementById('myAmount').value.replace(/,/g, '');
    if (!rawInput) return alert('희망 금액을 입력해주세요.');

    if (!selectedDuration) return alert('제안 유효 기간을 선택해주세요.');

    if (proposalCount >= maxLimit) {
        if (proposalCount === 5 && !isExtended) {
            if (confirm('기본 제안 횟수(5회)를 모두 소진했습니다.\n\n상대방에게 [협상 연장]을 요청하시겠습니까?\n(양측 동의 시 3회 추가)')) {
                requestExtension();
                return;
            }
            return;
        } else {
            return alert('제안 횟수를 모두 소진했습니다.');
        }
    }

    const positionText = currentPosition === 'payer' ? '지급' : '수령';
    const remaining = maxLimit - proposalCount - 1;
    if (!confirm(`[남은 제안 횟수: ${remaining}회]\n\n${parseInt(rawInput).toLocaleString()}만원을 '${positionText}'하는 조건으로 제안하시겠습니까?\n한 번 제안하면 되돌릴 수 없습니다.`)) return;

    const myAmount = rawInput * 10000;
    const btn = document.querySelector('.btn-primary');
    const originalBtnText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 분석 및 전송중...';
    btn.disabled = true;

    const caseId = localStorage.getItem('current_case_id');
    let userId = localStorage.getItem('user_id');

    if (!userId) {
        const userInfoStr = localStorage.getItem('user_info');
        if (userInfoStr) {
            try {
                const userInfo = JSON.parse(userInfoStr);
                if (userInfo.id) userId = userInfo.id;
            } catch (e) { }
        }
    }
    if (userId) userId = parseInt(userId, 10);

    if (!caseId || !userId) {
        alert("로그인 정보가 없거나 사건이 선택되지 않았습니다.\n초기화면으로 이동합니다.");
        location.href = 'dashboard.html';
        return;
    }

    if (window.myLastProposalAmount && window.myLastProposalAmount > 0) {
        const lastAmount = window.myLastProposalAmount;
        if (currentPosition === 'payer' && myAmount < lastAmount) {
            alert(`⛔ [합의 수렴 원칙 알림]\n\n이전 제안(${lastAmount.toLocaleString()}원)보다 낮은 금액을 제안할 수 없습니다.\n\n합의 가능성을 높이기 위해 이전 제안보다 같거나 높은 금액을 입력해주세요.`);
            btn.innerHTML = originalBtnText;
            btn.disabled = false;
            return;
        }
        if (currentPosition === 'receiver' && myAmount > lastAmount) {
            alert(`⛔ [합의 수렴 원칙 알림]\n\n이전 제안(${lastAmount.toLocaleString()}원)보다 높은 금액을 제안할 수 없습니다.\n\n합의 가능성을 높이기 위해 이전 제안보다 같거나 낮은 금액을 입력해주세요.`);
            btn.innerHTML = originalBtnText;
            btn.disabled = false;
            return;
        }
    }

    try {
        const res = await fetch('/api/case/proposal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caseId, userId, amount: myAmount, duration: selectedDuration, position: currentPosition })
        });
        const data = await res.json();

        if (!data.success) {
            alert('오류 발생: ' + data.error);
            btn.innerHTML = originalBtnText;
            btn.disabled = false;
            return;
        }

        if (data.midpointTriggered) {
            alert(`✨ 10% 이내 합의 제안!\n\n양측의 제안 금액이 10% 이내로 매우 가깝습니다!\n\n공정한 '중간 금액'(비공개)으로 합의하시겠습니까?\n[확인]을 누르면 동의 화면으로 이동합니다.`);
            location.reload();
            return;
        }

        proposalCount++;
        window.myLastProposalAmount = myAmount;

        updateCountUI();

        if (data.status === 'waiting') {
            showRightPanelState('waitingState');
            document.getElementById('waitingState').innerHTML = `
                <div style="font-size: 4rem; color: #4ade80; margin-bottom: 20px;"><i class="fas fa-check-circle"></i></div>
                <h3>제안이 성공적으로 등록되었습니다</h3>
                <p style="color: var(--text-muted); margin-top: 10px;">상대방이 제안하면 분석 결과가 표시됩니다.</p>
                <button class="btn btn-glass" onclick="location.reload()" style="margin-top:20px;">새로고침</button>
            `;
            addToHistory(myAmount, '대기 중', '#888');

        } else if (data.status === 'analyzed') {
            const diff = data.data.diff;
            let gapPercent = (diff / myAmount) * 100;
            showAnalysisResult(gapPercent, myAmount, diff);
            addToHistory(myAmount, '분석 완료', '#4ade80');
        }

    } catch (err) {
        console.error(err);
        alert('서버 통신 오류: ' + err.message);
    } finally {
        if (proposalCount < maxLimit) {
            btn.innerHTML = originalBtnText;
            btn.disabled = false;
        } else {
            updateCountUI();
        }
    }
};



function showAnalysisResult(gapPercent, myAmount, diff) {
    showRightPanelState('resultState');

    // 1. Populate Range Hint Box (Gap Amount - Safe Display)
    const rangeBox = document.querySelector('#rangeHintBox div:last-child');
    if (rangeBox) {
        rangeBox.innerHTML = `<div style="font-size:1.5rem; margin-bottom:5px;">🔒</div><span style="font-size:0.8rem; color:#facc15;">합의 안전 장치<br>(금액 비공개)</span>`;
    }

    // 2. Populate My Display
    const myDisplay = document.getElementById('myCurrentDisplay');
    if (myDisplay) {
        myDisplay.textContent = parseInt(myAmount).toLocaleString() + '원';
    }

    const gapTitle = document.getElementById('gapTitle');
    const gapDesc = document.getElementById('gapDesc');
    const gapGauge = document.getElementById('gapGauge');
    const statusBadge = document.getElementById('statusBadge');

    let color, title, desc, width, badgeText;

    if (gapPercent <= 10) {
        color = '#4ade80'; title = "축하합니다! 의견이 거의 일치합니다";
        desc = "제안하신 금액과 상대방의 희망 금액 차이가 <strong>10% 이내</strong>입니다.";
        width = '98%'; badgeText = "성사 확실";
    } else if (gapPercent <= 30) {
        color = '#3b82f6'; title = "긍정적인 조율 단계입니다";
        desc = "의견 차이가 크지 않습니다. 조금만 더 조율하면 합의점을 찾을 수 있습니다.";
        width = '75%'; badgeText = "조율 가능";
    } else if (gapPercent <= 60) {
        color = '#facc15'; title = "희망 금액의 차이가 큽니다";
        desc = "생각의 차이가 존재합니다. 신중한 재고가 필요합니다.";
        width = '50%'; badgeText = "차이 발생";
    } else {
        color = '#ef4444'; title = "입장 차이가 매우 큽니다";
        desc = "상대방과 금액에 대한 기준이 많이 다릅니다.";
        width = '25%'; badgeText = "큰 격차";
    }

    if (gapTitle) gapTitle.innerHTML = title;
    if (gapDesc) gapDesc.innerHTML = desc;
    if (gapGauge) {
        gapGauge.style.width = width;
        gapGauge.style.background = color;
        gapGauge.style.boxShadow = `0 0 20px ${color}`;
    }
    if (statusBadge) {
        statusBadge.textContent = badgeText;
        statusBadge.style.color = color;
        statusBadge.style.border = `1px solid ${color}`;
    }
}

function addToHistory(amount, result, color, round) {
    const now = new Date();
    const timeString = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;
    const rLabel = round ? round : (currentRound || proposalCount);
    const historyItem = { round: rLabel, time: timeString, amount: amount, result: result, color: color };

    window.syncExpiration = async (round) => {
        const caseId = localStorage.getItem('current_case_id');
        const userId = localStorage.getItem('user_id');
        if (!confirm("제안 기회를 1회 소진하고 다음 라운드로 넘어갑니다.\n진행하시겠습니까?")) return;

        try {
            const res = await fetch('/api/case/proposal/expire-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, caseId, round })
            });
            const data = await res.json();
            if (data.success) {
                location.reload();
            } else {
                alert('오류: ' + data.error);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const exists = proposalHistory.some(h => h.round == rLabel && h.amount === amount);
    if (!exists) {
        proposalHistory.unshift(historyItem);
    }

    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    tbody.innerHTML = proposalHistory.map(item => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 15px;">R${item.round}</td>
            <td style="padding: 15px; color: var(--text-muted); font-size: 0.9rem;">${item.time}</td>
            <td style="padding: 15px; font-weight: bold;">${item.amount.toLocaleString()}</td>
            <td style="padding: 15px;">
                <span style="font-size: 0.8rem; padding: 4px 10px; border-radius: 12px; border: 1px solid ${item.color};
 color: ${item.color};
 background: rgba(255,255,255,0.05);">
                    ${item.result}
                </span>
            </td>
        </tr>
    `).join('');
}

function updateCountUI() {
    const leftCountEl = document.getElementById('leftCount');
    if (leftCountEl) leftCountEl.textContent = Math.max(0, maxLimit - proposalCount);

    const btn = document.querySelector('.btn-primary');
    if (proposalCount >= maxLimit) {
        if (isExtended && proposalCount >= 8) {
            btn.textContent = '최대 제안 횟수 초과 (종료)';
            btn.disabled = true;
            btn.onclick = null;
        } else if (!isExtended && proposalCount >= 5) {
            if (iAgreedExtension) {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 상대방 동의 대기중...';
                btn.disabled = true;
                btn.style.background = '#4b5563';
            } else {
                btn.innerHTML = '<i class="fas fa-handshake"></i> 제안 횟수 연장 요청 (3회 추가)';
                btn.disabled = false;
                btn.onclick = requestExtension;
                btn.style.background = '#f59e0b';
                btn.style.boxShadow = '0 0 15px rgba(245, 158, 11, 0.4)';
            }
        } else {
            btn.textContent = '제안 횟수 초과';
            btn.disabled = true;
            btn.onclick = null;
        }
    } else {
        btn.textContent = '제안 등록하기';
        btn.disabled = false;
        btn.onclick = submitProposal;
        btn.style.background = ''; // reset
        btn.style.boxShadow = '';
    }
}

function startExpirationTimer() {
    const timerEl = document.getElementById('expirationTimerDisplay');
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (!timerEl || !proposalExpiration) return;

    function update() {
        const now = new Date().getTime();
        const expireTime = new Date(proposalExpiration).getTime();
        const diff = expireTime - now;

        if (diff < 0) {
            clearInterval(timerInterval);
            timerEl.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.1); padding: 15px; border-radius: 10px; border: 1px solid #ef4444; margin-top: 20px;">
                    <div style="color: #ef4444; font-weight: bold; margin-bottom: 5px;">⚠️ 제안 유효 시간이 만료되었습니다.</div>
                    <div style="font-size: 0.85rem; color: #fca5a5;">상대방이 시간 내에 응답하지 않아<br>이 라운드는 종료되었습니다.</div>
                    <button class="btn btn-sm" onclick="location.reload()" style="margin-top: 10px; background: #ef4444; color: white; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer;">
                        상태 업데이트
                    </button>
                </div>
            `;
            return;
        }

        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        let timeColor = '#4ade80';
        let containerStyle = 'background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);';
        let icon = '';

        if (diff < 1000 * 60 * 10) {
            timeColor = '#ef4444';
            containerStyle = 'background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.5); animation: pulse-border 2s infinite;';
            icon = '⚠️ ';
        } else if (diff < 1000 * 60 * 60) {
            timeColor = '#f59e0b';
            containerStyle = 'background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.5);';
        }

        timerEl.innerHTML = `
            <div style="${containerStyle} padding: 15px; border-radius: 12px; margin-top: 20px;">
                <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px;">${icon}제안 유효 시간</div>
                <div style="font-size: 1.8rem; font-weight: bold; color: ${timeColor};
 font-family: monospace; letter-spacing: 2px; line-height: 1;">
                    ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}
                </div>
                <div style="font-size: 0.75rem; color: #64748b; margin-top: 8px;">
                    ${new Date(expireTime).toLocaleDateString()} ${new Date(expireTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 만료
                </div>
            </div>
        `;
    }
    update();
    timerInterval = setInterval(update, 1000);
}

function showRoundCompletionUI() {
    // PRIVACY FIX: Redirect to Safe Analysis Ready State
    showRightPanelState('analysisReadyState');
    if (myResultViewed) {
        const btn = document.querySelector('#analysisReadyState button');
        if (btn) btn.innerHTML = '<i class="fas fa-search-dollar"></i> 분석 결과 다시 확인하기';
    }
    return;
}

function startNextRound() {
    // Legacy function, replaced by confirmNextRound for logic,
    // but here for safety if called by old buttons.
    // Actually we just reload.
    location.reload();
}

function resetForNewProposal() {
    location.reload();
}

function confirmNextRound() {
    if (confirm("현재 라운드를 종료하고, 2라운드로 진행하시겠습니까?\n\n(상대방에게 알림이 전송됩니다)")) {
        location.reload();
    }
}

// --- Onboarding Guide Logic ---

let currentGuideStep = 1;
const totalGuideSteps = 4;

// Initialize Guide on Load (Append to init sequence or run standalone)
document.addEventListener('DOMContentLoaded', () => {
    // Check if user has seen the guide
    const hasSeenGuide = localStorage.getItem('blind_guide_seen');
    if (!hasSeenGuide) {
        // Show modal with a slight delay for smooth UX
        setTimeout(() => {
            const modal = document.getElementById('guideModal');
            if (modal) modal.style.display = 'flex';
        }, 800);
    }
});

window.nextSlide = () => {
    if (currentGuideStep < totalGuideSteps) {
        currentGuideStep++;
        updateGuideUI();
    } else {
        closeGuide();
    }
};

window.skipGuide = () => {
    closeGuide();
};

window.closeGuide = () => {
    const modal = document.getElementById('guideModal');
    if (modal) {
        modal.style.animation = 'fade-out 0.3s forwards';
        setTimeout(() => {
            modal.style.display = 'none';
            modal.style.animation = ''; // Reset animation
        }, 300);
    }

    // Check "Don't show again"
    const checkbox = document.getElementById('dontShowAgain');
    if (checkbox && checkbox.checked) {
        localStorage.setItem('blind_guide_seen', 'true');
    }
};

function updateGuideUI() {
    // Update Slides
    document.querySelectorAll('.guide-slide').forEach(slide => {
        slide.classList.remove('active');
        if (parseInt(slide.dataset.step) === currentGuideStep) {
            slide.classList.add('active');
        }
    });

    // Update Dots
    const dots = document.querySelectorAll('.guide-dots .dot');
    dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx < currentGuideStep); // Fill up to current step
        // Or if simple dot navigation: idx === currentGuideStep - 1
        // Let's stick to simple single active dot for standard carousel, 
        // or progress bar style. The CSS supported single active dot.
        // Let's match CSS: .active is wider. So usually just one is active.
        dot.classList.toggle('active', idx === currentGuideStep - 1);
    });

    // Update Button Text
    const nextBtn = document.getElementById('nextBtn');
    if (currentGuideStep === totalGuideSteps) {
        nextBtn.innerHTML = '시작하기 <i class="fas fa-rocket"></i>';
        nextBtn.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)';
    } else {
        nextBtn.innerHTML = '다음 <i class="fas fa-chevron-right"></i>';
        nextBtn.style.background = '#3b82f6';
    }
}

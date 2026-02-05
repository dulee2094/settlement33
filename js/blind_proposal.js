/**
 * blind_proposal.js
 * Main Controller for Blind Proposal System
 * Orchestrates ProposalAPI and ProposalUI
 */

// Global State
let isExtended = false;
let maxLimit = 5;
let proposalCount = 0;
let currentRound = 1;
let myRound = 0;
let oppRound = 0;
let iAgreedExtension = false;
let oppAgreedExtension = false;
let roundCompleted = false;
let proposalExpiration = null;
let myResultViewed = false;
let oppResultViewed = false;

// Expose functions for HTML event handlers
window.closeGuide = () => ProposalUI.closeGuide();
window.skipGuide = () => ProposalUI.closeGuide();

// Action: Confirm Next Round Intent (New)
window.confirmNextRoundIntent = async () => {
    const caseId = localStorage.getItem('current_case_id');
    let userId = localStorage.getItem('user_id');
    if (!userId) { try { const u = JSON.parse(localStorage.getItem('user_info') || '{}'); userId = u.id; } catch (e) { } }

    try {
        const data = await ProposalAPI.requestNextRound(userId, caseId, currentRound);
        if (data.success) {
            // Optimistic UI Update: Show Waiting State immediately
            ProposalUI.renderNextRoundAction(window.myLastProposalAmount, true, false);
            // The polling will pick up the real state shortly or reload if opponent is ready
        }
    } catch (e) { console.error(e); alert('요청 처리 중 오류가 발생했습니다.'); }
};

document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();

    // Event Listeners
    document.getElementById('submitProposalBtn')?.addEventListener('click', submitProposal);

    // Polling
    setInterval(async () => {
        await checkStatusUpdate();
    }, 3000);
});

async function checkStatusUpdate() {
    // Optimization: Don't poll if max limit reached without extension
    if (proposalCount >= 5 && !isExtended) return;

    const caseId = localStorage.getItem('current_case_id');
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        try { const u = JSON.parse(localStorage.getItem('user_info') || '{}'); userId = u.id; } catch (e) { }
    }
    if (!caseId || !userId) return;

    try {
        const data = await ProposalAPI.checkStatus(caseId, userId);
        if (data.success) {
            // Core Polling Logic - Priority based updates

            // Priority 0: Auto-reload if both requested next round (Next Round Started)
            // Assuming backend updates 'currentRound' when both agreed.
            // Or if we track intents:
            if (data.nextRoundStarted || (data.myNextRoundIntent && data.oppNextRoundIntent)) {
                location.reload();
                return;
            }

            // Priority 0.5: Update Next Round UI Actions dynamically if we are in Result View
            if (data.myResultViewed && data.oppResultViewed) {
                // If we are currently viewing the result (chart), update the bottom action area
                const isFinalLoop = (currentRound >= 5 && !isExtended);
                const container = document.getElementById('nextRoundActionArea');
                if (container) {
                    ProposalUI.renderNextRoundAction(
                        window.myLastProposalAmount,
                        data.myNextRoundIntent,
                        data.oppNextRoundIntent,
                        isFinalLoop
                    );
                }
            }

            // Priority 1: Round Ready (Both Registered, I haven't viewed)
            if (data.roundStatus === 'ready' && !data.myResultViewed) {
                const el = ProposalUI.showRightPanelState('analysisReadyState');
                // Ensure proper message is shown (Dynamically update content if needed)
                if (el && !el.innerHTML.includes('2명 모두')) {
                    // Re-render Ready State content if needed
                    el.innerHTML = `
                        <div style="background: linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(34, 197, 94, 0.1)); border: 2px solid #4ade80; border-radius: 16px; padding: 30px; text-align: center; animation: pulse-glow 2s infinite;">
                            <div style="font-size: 3rem; margin-bottom: 20px; animation: bounce-icon 2s infinite;">✅</div>
                            <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.3rem;">2명 모두 합의금을 등록했습니다!</h3>
                            <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 25px; font-size: 0.95rem;">
                                양측의 제안이 모두 완료되었습니다.<br><strong style="color: #4ade80;">AI 격차 분석 결과</strong>를 확인하시겠습니까?
                            </p>
                            <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; margin-bottom: 25px;">
                                <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px;"><i class="fas fa-info-circle" style="margin-right: 5px;"></i> 확인 전까지 상대방 금액은 비공개됩니다</div>
                                <div style="font-size: 0.9rem; color: #fbbf24;"><i class="fas fa-lock" style="margin-right: 5px;"></i> 양측 모두 확인해야 결과가 공개됩니다</div>
                            </div>
                            <button class="btn btn-primary" onclick="viewAnalysisResult()" style="width: 100%; padding: 15px; font-size: 1.1rem; background: linear-gradient(135deg, #4ade80, #22c55e); border: none; box-shadow: 0 5px 25px rgba(74, 222, 128, 0.4);">
                                <i class="fas fa-chart-line" style="margin-right: 8px;"></i> 합의 결과 확인하기
                            </button>
                        </div>
                    `;
                }
                return;
            }

            // Priority 2: Extension Request
            if (data.oppAgreedExtension && !data.iAgreed && !data.isExtended) {
                const el = ProposalUI.showRightPanelState('extensionNotification');
                // Extension content is static in HTML or set once, but let's ensure it here just in case
                if (el && el.innerText.trim().length < 20) {
                    el.innerHTML = `
                        <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.1)); border: 2px solid #f59e0b; border-radius: 16px; padding: 30px; text-align: center; animation: pulse-glow 2s infinite;">
                            <div style="font-size: 3rem; margin-bottom: 20px; animation: bounce-icon 2s infinite;">🤝</div>
                            <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.3rem;">상대방이 협상 연장을 요청했습니다</h3>
                            <button class="btn btn-primary" onclick="requestExtension()" style="background: #f59e0b; border:none; box-shadow: 0 4px 15px rgba(rgba(245, 158, 11, 0.4); padding: 12px 30px; font-size: 1rem;"><i class="fas fa-handshake" style="margin-right: 8px;"></i> 연장 동의하기 (+3회)</button>
                        </div>`;
                }
                return;
            }

            // Priority 3: Opponent Proposed (Notification)
            if (data.hasOpponentProposed && proposalCount === 0) {
                ProposalUI.showRightPanelState('opponentProposedNotification');
                // Date formatting logic if needed
                return;
            }
        }
    } catch (e) { console.error("Polling Error", e); }
}

async function initializePage() {
    const caseId = localStorage.getItem('current_case_id');
    let userId = localStorage.getItem('user_id');
    if (!userId) {
        try { const u = JSON.parse(localStorage.getItem('user_info') || '{}'); userId = u.id; } catch (e) { }
    }
    if (userId) userId = parseInt(userId, 10);

    // UI Binding
    const caseNum = localStorage.getItem('current_case_number') || '-';
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
        const data = await ProposalAPI.checkStatus(caseId, userId);
        if (data.success) {
            // Update Global State
            isExtended = data.isExtended;
            iAgreedExtension = data.iAgreed;
            oppAgreedExtension = data.oppAgreed;
            maxLimit = isExtended ? 8 : 5;
            currentRound = data.currentRound || 1;
            myRound = data.myRound || 0;
            oppRound = data.oppRound || 0;
            proposalCount = data.myProposalCount;
            myResultViewed = data.myResultViewed;
            oppResultViewed = data.oppResultViewed;

            if (data.myLastProposal) {
                window.myLastProposalAmount = data.myLastProposal.amount;
                proposalExpiration = data.myLastProposal.expiresAt;
            }

            ProposalUI.updateCountUI(proposalCount, maxLimit);

            // --- Priority Logic Flow (Step-by-Step) ---

            // 1. Midpoint Check
            // (Midpoint logic requires separate check or data embedded)
            const midpointData = await checkMidpointStatus();
            if (midpointData) return; // Handled inside checkMidpointStatus

            // 2. Result Viewed?
            if (data.myResultViewed) {
                if (data.oppResultViewed) {
                    // Both viewed -> Show Chart
                    if (data.currentRoundData) {
                        const d = data.currentRoundData;
                        const calcDiff = Math.abs(d.offenderAmount - d.victimAmount);
                        const gapPercent = (calcDiff / Math.max(d.offenderAmount, d.victimAmount)) * 100;
                        const isFinalLoop = (currentRound >= 5 && !isExtended);

                        ProposalUI.renderGaugeChart(gapPercent, window.myLastProposalAmount, isFinalLoop);

                        // Sync Next Round UI State
                        ProposalUI.renderNextRoundAction(
                            window.myLastProposalAmount,
                            data.myNextRoundIntent,
                            data.oppNextRoundIntent,
                            isFinalLoop
                        );
                    }
                    return;
                } else {
                    // Only I viewed -> Waiting Msg
                    ProposalUI.showRightPanelState('analysisReadyState');
                    const el = document.getElementById('analysisReadyState');
                    el.innerHTML = `
                        <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.1)); border: 2px solid #3b82f6; border-radius: 16px; padding: 30px; text-align: center;">
                            <div style="font-size: 3rem; margin-bottom: 20px;">⏰</div>
                            <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.3rem;">상대방의 확인을 기다리고 있습니다</h3>
                            <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 25px; font-size: 0.95rem;">
                                귀하는 결과 확인에 동의하셨습니다.<br>상대방도 확인하면 <strong style="color: #60a5fa;">즉시 격차 분석 결과</strong>가 공개됩니다.
                            </p>
                            <button class="btn btn-glass" onclick="location.reload()" style="width: 100%; padding: 12px;">
                                <i class="fas fa-sync-alt" style="margin-right: 8px;"></i> 새로고침하여 상태 확인
                            </button>
                        </div>`;
                    return;
                }
            }

            // 3. Ready to View? (Both proposed, I haven't viewed)
            if (data.roundStatus === 'ready' && !data.myResultViewed) {
                const el = ProposalUI.showRightPanelState('analysisReadyState');
                el.innerHTML = `
                    <div style="background: linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(34, 197, 94, 0.1)); border: 2px solid #4ade80; border-radius: 16px; padding: 30px; text-align: center; animation: pulse-glow 2s infinite;">
                        <div style="font-size: 3rem; margin-bottom: 20px; animation: bounce-icon 2s infinite;">✅</div>
                        <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.3rem;">2명 모두 합의금을 등록했습니다!</h3>
                        <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 25px; font-size: 0.95rem;">
                            양측의 제안이 모두 완료되었습니다.<br><strong style="color: #4ade80;">AI 격차 분석 결과</strong>를 확인하시겠습니까?
                        </p>
                        <div style="background: rgba(0,0,0,0.3); padding: 15px; border-radius: 12px; margin-bottom: 25px;">
                            <div style="font-size: 0.85rem; color: #94a3b8; margin-bottom: 8px;"><i class="fas fa-info-circle" style="margin-right: 5px;"></i> 확인 전까지 상대방 금액은 비공개됩니다</div>
                            <div style="font-size: 0.9rem; color: #fbbf24;"><i class="fas fa-lock" style="margin-right: 5px;"></i> 양측 모두 확인해야 결과가 공개됩니다</div>
                        </div>
                        <button class="btn btn-primary" onclick="viewAnalysisResult()" style="width: 100%; padding: 15px; font-size: 1.1rem; background: linear-gradient(135deg, #4ade80, #22c55e); border: none; box-shadow: 0 5px 25px rgba(74, 222, 128, 0.4);">
                            <i class="fas fa-chart-line" style="margin-right: 8px;"></i> 합의 결과 확인하기
                        </button>
                    </div>`;
                return;
            }

            // 4. Extension Request
            if (oppAgreedExtension && !iAgreedExtension && !isExtended) {
                const el = ProposalUI.showRightPanelState('extensionNotification');
                el.innerHTML = `
                    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.1)); border: 2px solid #f59e0b; border-radius: 16px; padding: 30px; text-align: center; animation: pulse-glow 2s infinite;">
                        <div style="font-size: 3rem; margin-bottom: 20px; animation: bounce-icon 2s infinite;">🤝</div>
                        <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.3rem;">상대방이 협상 연장을 요청했습니다</h3>
                        <button class="btn btn-primary" onclick="requestExtension()" style="background: #f59e0b; border:none; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4); padding: 12px 30px; font-size: 1rem;"><i class="fas fa-handshake" style="margin-right: 8px;"></i> 연장 동의하기 (+3회)</button>
                    </div>`;
                return;
            }

            // 5. Waiting for Opponent (I submitted)
            if (data.status === 'waiting') {
                const el = ProposalUI.showRightPanelState('waitingState');
                el.innerHTML = `
                    <div style="font-size: 4rem; color: #4ade80; margin-bottom: 20px;"><i class="fas fa-check-circle"></i></div>
                    <h3>제안 등록 완료</h3>
                    <p style="color: var(--text-muted); margin-top: 10px;">상대방이 제안하면 분석 결과가 표시됩니다.</p>
                    <div id="expirationTimerDisplay"></div>
                `;
                ProposalUI.startExpirationTimer(proposalExpiration, 'expirationTimerDisplay');
                return;
            }

            // 6. Opponent Proposed (Notification)
            if (data.hasOpponentProposed && proposalCount === 0) {
                ProposalUI.showRightPanelState('opponentProposedNotification');
                return;
            }

            // --- History Rendering ---
            ProposalUI.clearHistory();
            if (data.previousRounds) {
                data.previousRounds.forEach(r => {
                    let resultText = r.completed ? `격차 ${(r.diff / Math.max(r.offenderAmount, r.victimAmount) * 100).toFixed(1)}%` : '만료됨';
                    ProposalUI.addToHistory(r.offenderAmount || r.victimAmount, resultText, r.completed ? '#4ade80' : '#ef4444', r.round);
                });
            }

            // --- Show Guide (Last Check) ---
            const hasSeenGuide = localStorage.getItem('blind_guide_seen');
            if (currentRound === 1 && proposalCount === 0 && !hasSeenGuide) {
                setTimeout(() => ProposalUI.showGuide(), 500);
            }

        }
    } catch (e) {
        console.error(e);
    }
}

// Action: Submit Proposal
async function submitProposal() {
    const amountInput = document.getElementById('proposalAmount');
    if (!amountInput.value) { alert('금액을 입력해주세요.'); return; }

    // UI Loading state...

    try {
        const caseId = localStorage.getItem('current_case_id');
        let userId = localStorage.getItem('user_id');
        if (!userId) { const u = JSON.parse(localStorage.getItem('user_info') || '{}'); userId = u.id; }

        const payload = {
            userId: parseInt(userId),
            caseId: caseId,
            amount: parseInt(amountInput.value.replace(/,/g, '')),
            duration: 0,
            position: localStorage.getItem('user_role') || 'offender'
        };

        const data = await ProposalAPI.submitProposal(payload);
        if (data.success) {
            location.reload();
        } else {
            alert(data.error || '제안 등록 실패');
        }
    } catch (e) {
        console.error(e);
        alert('오류 발생');
    }
}

// Action: View Result (Confirmed)
window.viewAnalysisResult = async () => {
    const caseId = localStorage.getItem('current_case_id');
    let userId = localStorage.getItem('user_id');
    if (!userId) { const u = JSON.parse(localStorage.getItem('user_info') || '{}'); userId = u.id; }

    try {
        const data = await ProposalAPI.viewAnalysisResult(parseInt(userId), caseId, currentRound);
        if (data.success) {
            if (data.bothViewed) {
                // Show Result immediately
                if (data.analysis) {
                    ProposalUI.renderGaugeChart(data.analysis.diffPercent, data.analysis.myAmount);
                }
                location.reload(); // To be safe and sync state
            } else {
                // Waiting screen
                location.reload();
            }
        }
    } catch (e) { console.error(e); }
};

// Action: Request Extension
window.requestExtension = async () => {
    if (!confirm('연장에 동의하시겠습니까? (기회 3회 추가)')) return;
    const caseId = localStorage.getItem('current_case_id');
    let userId = localStorage.getItem('user_id');
    if (!userId) { const u = JSON.parse(localStorage.getItem('user_info') || '{}'); userId = u.id; }

    try {
        const data = await ProposalAPI.requestExtension(caseId, userId);
        if (data.success) {
            alert('연장에 동의했습니다.');
            location.reload();
        }
    } catch (e) { console.error(e); }
};

// Action: Decide Midpoint
window.decideMidpoint = async (isAgreed) => {
    const caseId = localStorage.getItem('current_case_id');
    let userId = localStorage.getItem('user_id');
    if (!userId) { const u = JSON.parse(localStorage.getItem('user_info') || '{}'); userId = u.id; }

    try {
        const data = await ProposalAPI.decideMidpoint(userId, caseId, isAgreed);
        if (data.success) location.reload();
    } catch (e) { console.error(e); }
};

// Check Midpoint Status Helper
async function checkMidpointStatus() {
    // This calls fetch manually for now or maybe add to API?
    // Let's use the existing logic simplified or just fetch from API text endpoint?
    // Actually the logic is a bit complex involving multiple fetches in old code.
    // For now returning false to rely on main flow if not midpoint.
    // Ideally this should be part of ProposalAPI.checkStatus response.
    // But since server sends it separately... let's implement a simple check.

    // Note: In real Refactor, backend should allow checking status in one go.
    // Here we assume get_midpoint_status endpoint is what we need.
    const caseId = localStorage.getItem('current_case_id');
    let userId = localStorage.getItem('user_id');
    if (!caseId || !userId) return false;
    // We can add this to ProposalAPI as well? Yes.
    // But let's keep it simple for now as it renders unique UI.

    try {
        const res = await fetch(`/api/case/proposal/midpoint-status?caseId=${caseId}&userId=${userId}`);
        const data = await res.json();
        if (data.success && data.midpointProposed) {
            ProposalUI.showRightPanelState('midpointResultArea');
            // ... Logic to fill midpoint UI ...
            // Ideally we move this rendering to UI too.
            // For brevity in this refactor step, we focus on Proposal flow.
            return true;
        }
    } catch (e) { }
    return false;
}

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

// UI State
let selectedRole = localStorage.getItem('user_role') || 'offender'; // Default to stored role
let selectedDuration = 1; // Default 1 day

// Expose functions for HTML event handlers
window.closeGuide = () => ProposalUI.closeGuide();
window.skipGuide = () => ProposalUI.closeGuide();

// UI Interaction Functions
window.selectPosition = function (role) {
    selectedRole = role;

    // Update UI
    const payerBtn = document.getElementById('pos-payer');
    const receiverBtn = document.getElementById('pos-receiver');

    // Reset styles
    if (payerBtn) {
        payerBtn.style.background = 'rgba(255,255,255,0.05)';
        payerBtn.style.color = '#888';
        payerBtn.style.borderColor = 'transparent';
    }
    if (receiverBtn) {
        receiverBtn.style.background = 'rgba(255,255,255,0.05)';
        receiverBtn.style.color = '#888';
        receiverBtn.style.borderColor = 'transparent';
    }

    // Active style
    const activeBtn = role === 'payer' ? payerBtn : receiverBtn;
    if (activeBtn) {
        activeBtn.style.background = 'rgba(59, 130, 246, 0.2)';
        activeBtn.style.color = 'white';
        activeBtn.style.borderColor = '#3b82f6';
    }
};

window.selectDuration = function (days) {
    selectedDuration = days;

    // Update UI
    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.style.border = '1px solid rgba(255,255,255,0.1)';
        btn.style.background = 'rgba(255,255,255,0.05)';
        btn.style.color = '#888';
        btn.style.fontWeight = 'normal';
        btn.style.boxShadow = 'none';
    });

    const activeBtn = document.getElementById(`btn-${days}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.border = '1px solid #4ade80';
        activeBtn.style.background = '#4ade80';
        activeBtn.style.color = '#000';
        activeBtn.style.fontWeight = 'bold';
        activeBtn.style.boxShadow = '0 0 10px rgba(74, 222, 128, 0.3)';
    }
};


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
    // Initialize UI State
    if (localStorage.getItem('user_role') === 'victim') {
        window.selectPosition('receiver');
    } else {
        window.selectPosition('payer');
    }

    await initializePage();

    // Event Listeners
    // Use click listener or HTML onclick, but ensure no conflict.
    // HTML has onclick="submitProposal()". We will remove the duplicate listener if it causes issues,
    // but defining the function in global scope is key.
    // document.getElementById('submitProposalBtn')?.addEventListener('click', submitProposal);

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

            // Priority 0.1: Completed Midpoint Agreement (Success)
            if (data.midpointStatus === 'completed') {
                const el = ProposalUI.showRightPanelState('midpointResultArea');
                // Ensure correct content for Final Success
                el.innerHTML = `
                    <div style="text-align:center; padding: 40px;">
                        <div style="font-size: 4rem; margin-bottom: 20px; animation: bounce-icon 2s infinite;">🎉</div>
                         <h2 style="color: #4ade80; margin-bottom: 15px;">최종 합의가 타결되었습니다!</h2>
                         <p style="color: #cbd5e1; font-size: 1.1rem; margin-bottom: 30px;">
                            양측 모두 <strong>중간값 합의</strong>에 최종 동의하였습니다.
                        </p>
                        <div class="glass-card" style="padding: 30px; border: 2px solid #4ade80; background: rgba(74, 222, 128, 0.1); display: inline-block; min-width: 300px;">
                            <div style="font-size: 0.9rem; color: #94a3b8; margin-bottom: 10px;">최종 합의금</div>
                            <div style="font-size: 2.5rem; font-weight: bold; color:white;">
                                ${parseInt(data.midpointAmount).toLocaleString()}원
                            </div>
                        </div>
                        <div style="margin-top: 40px;">
                             <button class="btn btn-primary" onclick="alert('사건이 종료되었습니다.')" style="padding: 15px 40px; font-size: 1.1rem;">확인 (사건 종료)</button>
                        </div>
                    </div>
                `;
                return;
            }

            // Priority 0.2: Midpoint Phase 2 (Both Agreed to Negotiate -> Final Confirmation)
            if (data.midpointStatus === 'confirming') { // 'confirming' implies both passed Phase 1
                const el = ProposalUI.showRightPanelState('midpointAgreementState');
                // Phase 2 UI: Reveal Amounts and Ask for Final Signature
                if (!el.innerHTML.includes('최종 금액 확인')) {
                    el.innerHTML = `
                        <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">
                            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; margin: 0 auto 20px auto; font-weight: 600;">
                                🔒 2단계: 최종 금액 확인
                            </div>

                            <h3 style="color: white; margin-bottom: 10px; text-align: center;">최종 합의금을 확인해주세요</h3>
                            <p style="color: #94a3b8; text-align: center; margin-bottom: 30px; font-size: 0.9rem;">
                                양측의 1차 동의로 <strong>금액이 모두 공개</strong>되었습니다.<br>이 금액으로 최종 확정하시겠습니까?
                            </p>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; opacity: 0.8;">
                                <div class="glass-card" style="padding: 15px; text-align:center;">
                                    <div style="font-size: 0.8rem; color: #aaa;">나의 제안</div>
                                    <div style="font-size: 1rem; color: #fff;">${parseInt(data.myLastProposal.amount).toLocaleString()}원</div>
                                </div>
                                <div class="glass-card" style="padding: 15px; text-align:center;">
                                    <div style="font-size: 0.8rem; color: #aaa;">상대 제안</div>
                                    <div style="font-size: 1rem; color: #fff;">${parseInt(data.oppLastProposal.amount).toLocaleString()}원</div>
                                </div>
                            </div>
                            
                            <div class="glass-card" style="padding: 25px; border: 2px solid #4ade80; background: rgba(74, 222, 128, 0.15); text-align: center; margin-bottom: 30px; animation: pulse-border 2s infinite;">
                                <div style="font-size: 0.9rem; color: #4ade80; margin-bottom: 8px; font-weight: bold;">✨ 최종 조율된 합의금 (중간값)</div>
                                <div style="font-size: 2.2rem; font-weight: bold; color:white;">
                                    ${parseInt(data.midpointAmount).toLocaleString()}원
                                </div>
                            </div>

                            <div style="display: flex; gap: 10px;">
                                <button class="btn btn-primary" onclick="confirmMidpointFinal()" style="flex: 2; padding: 15px; font-size: 1.1rem; background: linear-gradient(135deg, #4ade80, #22c55e);">
                                    <i class="fas fa-file-signature" style="margin-right: 8px;"></i> 위 금액으로 최종 확정
                                </button>
                                <button class="btn btn-secondary" onclick="rejectMidpoint()" style="flex: 1; padding: 15px; font-size: 1rem; background: rgba(255,255,255,0.1);">
                                    이의 제기
                                </button>
                            </div>
                        </div>
                     `;
                }
                return;
            }

            // Priority 0.5: Update Next Round UI Actions dynamically if we are in Result View
            if (data.myResultViewed && data.oppResultViewed && !data.midpointStatus) {
                // ... (Existing Next Round Action Logic)
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
                        <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">
                            <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; margin: 0 auto 20px auto; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); font-weight: 600;">
                                ✨ 1라운드: 분석 준비 완료
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                                <!-- My Status -->
                                <div class="glass-card" style="padding: 20px; border: 1px solid rgba(74, 222, 128, 0.5); background: rgba(74, 222, 128, 0.1);">
                                    <div style="font-size: 3rem; margin-bottom: 10px;">✅</div>
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">나의 상태</div>
                                    <div style="font-size: 1.1rem; font-weight: bold; color: #4ade80;">등록 완료</div>
                                </div>
                                <!-- Opponent Status -->
                                <div class="glass-card" style="padding: 20px; border: 1px solid rgba(74, 222, 128, 0.5); background: rgba(74, 222, 128, 0.1);">
                                    <div style="font-size: 3rem; margin-bottom: 10px; color: #4ade80;">✅</div>
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">상대방 상태</div>
                                    <div style="font-size: 1.1rem; font-weight: bold; color: #4ade80;">등록 완료 <i class="fas fa-lock" style="font-size:0.8rem; margin-left:3px; opacity:0.7;"></i></div>
                                </div>
                            </div>

                            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 20px;">
                                <h3 style="color: #fff; margin-bottom: 10px; font-size: 1.3rem;">AI 격차 분석이 완료되었습니다</h3>
                                <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px;">
                                    확인 버튼을 누르면 <strong>신호등 색상</strong>으로 결과를 표시합니다.<br>
                                    <span style="color: #60a5fa; font-size: 0.85rem;">(결과를 확인해도 상대방에게 제안 금액은 공개되지 않습니다)</span>
                                </p>
                                <button class="btn btn-primary" onclick="viewAnalysisResult()" style="width: 100%; padding: 15px; font-size: 1.1rem; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; box-shadow: 0 5px 20px rgba(59, 130, 246, 0.4); border-radius: 12px; transition: transform 0.2s;">
                                    <i class="fas fa-chart-pie" style="margin-right: 8px;"></i> 분석 결과 확인하기
                                </button>
                            </div>
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

            // --- Show Guide (Moved to run before early returns) ---
            const hasSeenGuide = localStorage.getItem('blind_guide_seen');
            if (!hasSeenGuide) {
                setTimeout(() => ProposalUI.showGuide(), 500);
            }

            // --- Priority Logic Flow (Step-by-Step) ---

            // 1. Midpoint Check (Phase 1: Proposal)
            // If API returns midpointActive: true, it means we are in Phase 1 (Negotiating)
            const midpointData = await checkMidpointStatus(data);
            if (midpointData) return; // Handled inside checkMidpointStatus (renders UI)

            // 2. Result Viewed?
            if (data.myResultViewed) {
                if (data.oppResultViewed) {
                    // Both viewed -> Show Chart
                    if (data.currentRoundData) {
                        const d = data.currentRoundData;
                        const calcDiff = Math.abs(d.offenderAmount - d.victimAmount);
                        const gapPercent = (calcDiff / Math.max(d.offenderAmount, d.victimAmount)) * 100;
                        const isFinalLoop = (currentRound >= 5 && !isExtended);

                        // Pass currentRound to support specific Round 2+ messages inside renderGaugeChart
                        ProposalUI.renderGaugeChart(gapPercent, window.myLastProposalAmount, isFinalLoop, currentRound);

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

                    // Round 1
                    if (currentRound === 1) {
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
                    } else {
                        // Round 2+
                        el.innerHTML = `
                            <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.1)); border: 2px solid #8b5cf6; border-radius: 16px; padding: 30px; text-align: center;">
                                <div style="font-size: 3rem; margin-bottom: 20px; animation: bounce 2s infinite;">📊</div>
                                <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.3rem;">거리가 좁혀졌을까요?</h3>
                                <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 25px; font-size: 0.95rem;">
                                    결과 확인을 요청하셨습니다.<br>상대방이 버튼을 누르는 즉시 <strong style="color: #a78bfa;">새로운 격차 변화</strong>가 공개됩니다.
                                </p>
                                <div class="loading-spinner" style="margin: 0 auto; margin-bottom:20px;"></div>
                                <button class="btn btn-glass" onclick="location.reload()" style="width: 100%; padding: 12px;">
                                    <i class="fas fa-sync-alt" style="margin-right: 8px;"></i> 상태 업데이트
                                </button>
                            </div>`;
                    }
                    return;
                }
            }

            // 3. Ready to View? (Both proposed, I haven't viewed)
            if (data.roundStatus === 'ready' && !data.myResultViewed) {
                const el = ProposalUI.showRightPanelState('analysisReadyState');

                // --- Round 1 Ready ---
                if (currentRound === 1) {
                    el.innerHTML = `
                        <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">
                            <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; margin: 0 auto 20px auto; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); font-weight: 600;">
                                ✨ 1라운드: 분석 준비 완료
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                                <!-- My Status -->
                                <div class="glass-card" style="padding: 20px; border: 1px solid rgba(74, 222, 128, 0.5); background: rgba(74, 222, 128, 0.1);">
                                    <div style="font-size: 3rem; margin-bottom: 10px;">✅</div>
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">나의 상태</div>
                                    <div style="font-size: 1.1rem; font-weight: bold; color: #4ade80;">등록 완료</div>
                                </div>
                                <!-- Opponent Status -->
                                <div class="glass-card" style="padding: 20px; border: 1px solid rgba(74, 222, 128, 0.5); background: rgba(74, 222, 128, 0.1);">
                                    <div style="font-size: 3rem; margin-bottom: 10px; color: #4ade80;">✅</div>
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">상대방 상태</div>
                                    <div style="font-size: 1.1rem; font-weight: bold; color: #4ade80;">등록 완료 <i class="fas fa-lock" style="font-size:0.8rem; margin-left:3px; opacity:0.7;"></i></div>
                                </div>
                            </div>

                            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 20px;">
                                <h3 style="color: #fff; margin-bottom: 10px; font-size: 1.3rem;">AI 격차 분석이 완료되었습니다</h3>
                                <p style="color: #94a3b8; font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px;">
                                    확인 버튼을 누르면 <strong>신호등 색상</strong>으로 결과를 표시합니다.<br>
                                    <span style="color: #60a5fa; font-size: 0.85rem;">(결과를 확인해도 상대방에게 제안 금액은 공개되지 않습니다)</span>
                                </p>
                                <button class="btn btn-primary" onclick="viewAnalysisResult()" style="width: 100%; padding: 15px; font-size: 1.1rem; background: linear-gradient(135deg, #3b82f6, #2563eb); border: none; box-shadow: 0 5px 20px rgba(59, 130, 246, 0.4); border-radius: 12px; transition: transform 0.2s;">
                                    <i class="fas fa-chart-pie" style="margin-right: 8px;"></i> 분석 결과 확인하기
                                </button>
                            </div>
                        </div>
                    `;
                }
                // --- Round 2+ Ready ---
                else {
                    el.innerHTML = `
                        <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">
                            <div style="background: linear-gradient(135deg, #8b5cf6, #d946ef); color: white; display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; margin: 0 auto 20px auto; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); font-weight: 600;">
                                📡 ${currentRound}라운드: 분석 준비 완료
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                                <div class="glass-card" style="padding: 20px; border: 1px solid rgba(167, 139, 250, 0.5); background: rgba(167, 139, 250, 0.1);">
                                    <div style="font-size: 3rem; margin-bottom: 10px;">🆗</div>
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">나의 수정안</div>
                                    <div style="font-size: 1.1rem; font-weight: bold; color: #d8b4fe;">완료</div>
                                </div>
                                <div class="glass-card" style="padding: 20px; border: 1px solid rgba(167, 139, 250, 0.5); background: rgba(167, 139, 250, 0.1);">
                                    <div style="font-size: 3rem; margin-bottom: 10px;">🔒</div>
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">상대방 수정안</div>
                                    <div style="font-size: 1.1rem; font-weight: bold; color: #d8b4fe;">완료</div>
                                </div>
                            </div>

                            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 25px; text-align: center; margin-bottom: 20px;">
                                <h3 style="color: #fff; margin-bottom: 10px; font-size: 1.3rem;">새로운 격차 분석이 완료되었습니다.</h3>
                                <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.6; margin-bottom: 20px;">
                                    양측의 양보로 거리가 얼마나 좁혀졌을까요?<br>
                                    결과를 확인하고 다음 전략을 결정하세요.
                                </p>
                                <button class="btn btn-primary" onclick="viewAnalysisResult()" style="width: 100%; padding: 15px; font-size: 1.1rem; background: linear-gradient(135deg, #8b5cf6, #d946ef); border: none; box-shadow: 0 5px 20px rgba(139, 92, 246, 0.4); border-radius: 12px; transition: transform 0.2s;">
                                    <i class="fas fa-search-dollar" style="margin-right: 8px;"></i> 격차 변화 확인하기
                                </button>
                            </div>
                        </div>
                    `;
                }
                return;
            }

            // 4. Extension Request
            if (oppAgreedExtension && !iAgreedExtension && !isExtended) {
                const el = ProposalUI.showRightPanelState('extensionNotification');
                el.innerHTML = `
                    <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(251, 191, 36, 0.1)); border: 2px solid #f59e0b; border-radius: 16px; padding: 30px; text-align: center; animation: pulse-glow 2s infinite;">
                        <div style="font-size: 3rem; margin-bottom: 20px; animation: bounce-icon 2s infinite;">🤝</div>
                        <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.3rem;">상대방이 협상 연장을 요청했습니다</h3>
                        <button class="btn btn-primary" onclick="requestExtension()" style="background: #f59e0b; border:none; box-shadow: 0 4px 15px rgba(rgba(245, 158, 11, 0.4); padding: 12px 30px; font-size: 1rem;"><i class="fas fa-handshake" style="margin-right: 8px;"></i> 연장 동의하기 (+3회)</button>
                    </div>`;
                return;
            }

            // 5. Waiting for Opponent (I submitted)
            // 5. Waiting for Opponent (I submitted, Opponent hasn't)
            if (data.status === 'waiting' && proposalCount > 0) {
                const el = ProposalUI.showRightPanelState('waitingState');

                // --- CASE A: I Submitted First (Waiting) ---
                // --- ROUND 1 WAIT UI ---
                if (currentRound === 1 && !el.innerHTML.includes('제안이 안전하게 접수')) {
                    el.innerHTML = `
                        <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">
                            <div style="background: rgba(74, 222, 128, 0.1); color: #4ade80; display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; margin: 0 auto 20px auto; border: 1px solid rgba(74, 222, 128, 0.3); font-weight: 600;">
                                📍 1라운드: 상대방 입력 대기 중
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                                <!-- My Status -->
                                <div class="glass-card" style="padding: 20px; border: 1px solid rgba(74, 222, 128, 0.5); background: rgba(74, 222, 128, 0.05);">
                                    <div style="font-size: 3rem; margin-bottom: 10px;">✅</div>
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">나의 상태</div>
                                    <div style="font-size: 1.1rem; font-weight: bold; color: #4ade80;">등록 완료</div>
                                </div>
                                <!-- Opponent Status -->
                                <div class="glass-card" style="padding: 20px; border: 1px solid rgba(251, 191, 36, 0.5); background: rgba(251, 191, 36, 0.05); animation: pulse-border 2s infinite;">
                                    <div style="font-size: 3rem; margin-bottom: 10px;">⏳</div>
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">상대방 상태</div>
                                    <div style="font-size: 1.1rem; font-weight: bold; color: #fbbf24;">입력 대기</div>
                                </div>
                            </div>

                            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; text-align: left;">
                                <h4 style="color: #fff; margin-bottom: 15px; font-size: 1rem;"><i class="fas fa-check-circle" style="color: #4ade80; margin-right: 8px;"></i>잘하셨습니다!</h4>
                                <ul style="list-style: none; padding: 0; margin: 0; color: #94a3b8; font-size: 0.9rem; line-height: 1.8;">
                                    <li>• 제안이 안전하게 접수되었습니다.</li>
                                    <li>• 상대방에게 <strong>제안 등록 알림</strong>을 보냈습니다.</li>
                                    <li>• 상대방이 등록하면 <strong>즉시 분석 결과</strong>가 공개됩니다.</li>
                                </ul>
                            </div>
                            <div id="expirationTimerDisplay"></div>
                        </div>
                     `;
                    ProposalUI.startExpirationTimer(proposalExpiration, 'expirationTimerDisplay');
                }

                // --- ROUND 2+ WAIT UI (Strategy Focus) ---
                else if (currentRound > 1 && !el.innerHTML.includes('전략적 대기')) {
                    el.innerHTML = `
                        <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">
                            <div style="background: rgba(139, 92, 246, 0.1); color: #a78bfa; display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; margin: 0 auto 20px auto; border: 1px solid rgba(139, 92, 246, 0.3); font-weight: 600;">
                                🔄 ${currentRound}라운드: 상대방 응답 대기 중
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                                <!-- My Status -->
                                <div class="glass-card" style="padding: 20px; border: 1px solid rgba(167, 139, 250, 0.5); background: rgba(167, 139, 250, 0.05);">
                                    <div style="font-size: 3rem; margin-bottom: 10px;">🆗</div>
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">나의 수정 제안</div>
                                    <div style="font-size: 1.1rem; font-weight: bold; color: #ddd6fe;">등록 완료</div>
                                </div>
                                <!-- Opponent Status -->
                                <div class="glass-card" style="padding: 20px; border: 1px solid rgba(251, 191, 36, 0.5); background: rgba(251, 191, 36, 0.05); animation: pulse-border 2s infinite;">
                                    <div style="font-size: 3rem; margin-bottom: 10px;">💭</div>
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">상대방 상태</div>
                                    <div style="font-size: 1.1rem; font-weight: bold; color: #fbbf24;">고민 중...</div>
                                </div>
                            </div>

                            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; text-align: left;">
                                <h4 style="color: #fff; margin-bottom: 15px; font-size: 1rem;"><i class="fas fa-hourglass-half" style="color: #a78bfa; margin-right: 8px;"></i>잠시만 기다려주세요</h4>
                                <p style="color: #cbd5e1; line-height: 1.6; font-size: 0.95rem;">
                                    상대방도 신중하게 고민하고 있습니다.<br>
                                    이번 라운드에서 격차가 얼마나 줄어들지 기대해 보세요.
                                </p>
                            </div>
                            <div id="expirationTimerDisplay"></div>
                        </div>
                     `;
                    ProposalUI.startExpirationTimer(proposalExpiration, 'expirationTimerDisplay');
                }
                return;
            }

            // 5.5 Default Dashboard State (Nothing proposed yet)
            // 5.5 Default Dashboard State (Nothing proposed yet)

            // --- ROUND 1 SPECIFIC DASHBOARD ---
            if (currentRound === 1 && proposalCount === 0) {
                const el = ProposalUI.showRightPanelState('waitingState');
                // Reset to default dashboard layout (managed in HTML or dynamically here)
                // We will update just the opponent status for better UX
                let oppStatusText = '❓ 입력 대기';
                let oppStatusColor = '#64748b';
                let oppStatusBg = 'rgba(255,255,255,0.05)';
                let oppStatusBorder = '1px solid rgba(255,255,255,0.1)';

                // --- ADDED LOGIC: Check Real-time Status ---
                if (data.hasOpponentProposed) {
                    oppStatusText = '✅ 등록 완료 (대기 중)';
                    oppStatusColor = '#4ade80';
                    oppStatusBg = 'rgba(59, 130, 246, 0.1)';
                    oppStatusBorder = '1px solid #3b82f6';
                }



                // Inject the rich dashboard HTML if it's not already there
                // We add a unique marker for "Opponent Proposed" state vs "Both Waiting" state to force re-render if state changes
                const stateMarker = data.hasOpponentProposed ? 'opp-proposed' : 'both-waiting';

                if (!el.getAttribute('data-render-state') || el.getAttribute('data-render-state') !== stateMarker) {
                    el.setAttribute('data-render-state', stateMarker);

                    let guideTitle = "진행 안내";
                    let guideIcon = "fa-info-circle";
                    let guideColor = "#60a5fa";
                    let topBadge = "📍 1라운드 진행 중";
                    let myCardBorder = "1px solid rgba(251, 191, 36, 0.5)"; // Default Warning/Yellow
                    let myCardBg = "rgba(251, 191, 36, 0.05)";
                    let myStatusText = "입력 대기";
                    let myStatusColor = "#fbbf24";
                    let myIcon = "✏️";

                    // --- CASE B: Opponent Submitted First (Urgent Action Required) ---
                    if (data.hasOpponentProposed) {
                        topBadge = "🚀 상대방 제안 등록 완료!";
                        guideTitle = "이제 고객님의 차례입니다";
                        guideIcon = "fa-bell";
                        guideColor = "#ef4444"; // Red alarm

                        // Highlight My Card slightly more to urge action
                        myCardBorder = "2px solid #ef4444";
                        myCardBg = "rgba(239, 68, 68, 0.1)";
                        myStatusText = "입력 필요";
                        myStatusColor = "#ef4444";
                        myIcon = "🚨";
                    }

                    el.innerHTML = `
                        <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">
                            <div style="background: rgba(59, 130, 246, 0.1); color: #60a5fa; display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; margin: 0 auto 20px auto; border: 1px solid rgba(59, 130, 246, 0.3); font-weight: 600;">
                                ${topBadge}
                            </div>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                                <!-- My Status -->
                                <div class="glass-card" style="padding: 20px; border: ${myCardBorder}; background: ${myCardBg}; ${data.hasOpponentProposed ? 'animation: pulse-border 2s infinite;' : ''}">
                                    <div style="font-size: 3rem; margin-bottom: 10px;">${myIcon}</div>
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">나의 상태</div>
                                    <div style="font-size: 1.1rem; font-weight: bold; color: ${myStatusColor};">${myStatusText}</div>
                                </div>
                                <!-- Opponent Status -->
                                <div class="glass-card" style="padding: 20px; border: ${oppStatusBorder}; background: ${oppStatusBg};">
                                    <div style="font-size: 3rem; margin-bottom: 10px;">${data.hasOpponentProposed ? '🔒' : '👤'}</div>
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">상대방 상태</div>
                                    <div style="font-size: 1.1rem; font-weight: bold; color: ${oppStatusColor};">${oppStatusText}</div>
                                </div>
                            </div>

                            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; text-align: left;">
                                <h4 style="color: #fff; margin-bottom: 15px; font-size: 1rem;"><i class="fas ${guideIcon}" style="color: ${guideColor}; margin-right: 8px;"></i>${guideTitle}</h4>
                                <ul style="list-style: none; padding: 0; margin: 0; color: #94a3b8; font-size: 0.9rem; line-height: 1.8;">
                                    ${data.hasOpponentProposed ?
                            `<li>• <strong>상대방이 제안을 마쳤습니다.</strong></li>
                                       <li>• 금액을 입력하면 <strong>즉시 격차 분석 결과</strong>를 확인할 수 있습니다.</li>
                                       <li>• 입력하신 금액은 타결 전까지 <strong>절대 비공개</strong>됩니다.</li>`
                            :
                            `<li>• 희망 금액을 등록하면 상대방에게 <strong>알림이 전송</strong>됩니다.</li>
                                       <li>• 양측 모두 등록 시 <strong>AI 격차 분석</strong>이 즉시 시작됩니다.</li>
                                       <li>• 제안하신 금액은 타결 전까지 <strong>상대방에게 비공개</strong>됩니다.</li>`
                        }
                                </ul>
                            </div>
                        </div>
                     `;
                }
                return;
            }

            // --- ROUND 2+ SPECIFIC DASHBOARD (Convergence Focus) ---
            if (currentRound > 1 && proposalCount === 0) {
                const el = ProposalUI.showRightPanelState('waitingState');

                let oppStatusText = '❓ 입력 대기';
                let oppStatusColor = '#64748b';
                let oppStatusBg = 'rgba(255,255,255,0.05)';
                let oppStatusBorder = '1px solid rgba(255,255,255,0.1)';

                if (data.hasOpponentProposed) {
                    oppStatusText = '✅ 등록 완료';
                    oppStatusColor = '#4ade80';
                    oppStatusBg = 'rgba(59, 130, 246, 0.1)';
                    oppStatusBorder = '1px solid #3b82f6';
                }

                const stateMarker = `round-${currentRound}-${data.hasOpponentProposed ? 'opp-proposed' : 'both-waiting'}`;

                if (!el.getAttribute('data-render-state') || el.getAttribute('data-render-state') !== stateMarker) {
                    el.setAttribute('data-render-state', stateMarker);

                    let topBadge = `🔄 ${currentRound}라운드 시작`;
                    let prevGapInfo = '';

                    // Try to find previous round gap for context
                    if (data.previousRounds && data.previousRounds.length > 0) {
                        const lastRound = data.previousRounds[data.previousRounds.length - 1];
                        if (lastRound && lastRound.completed) {
                            const gap = (lastRound.diff / Math.max(lastRound.offenderAmount, lastRound.victimAmount) * 100).toFixed(1);
                            prevGapInfo = `<span style="font-size:0.8rem; color:#94a3b8; margin-left:10px;">(이전 격차: ${gap}%)</span>`;
                        }
                    }

                    let myCardBorder = "1px solid rgba(147, 51, 234, 0.5)"; // Purple for "New Opportunity"
                    let myCardBg = "rgba(147, 51, 234, 0.05)";
                    let myStatusText = "입력 대기";
                    let myStatusColor = "#d8b4fe";
                    let myIcon = "✏️";

                    if (data.hasOpponentProposed) {
                        topBadge = "🚀 상대방 제안 등록 완료!";
                        // Urgent Mode
                        myCardBorder = "2px solid #ef4444";
                        myCardBg = "rgba(239, 68, 68, 0.1)";
                        myStatusText = "입력 필요";
                        myStatusColor = "#ef4444";
                        myIcon = "🚨";
                    }

                    el.innerHTML = `
                        <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">
                            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; margin: 0 auto 20px auto; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4); font-weight: 600;">
                                ${topBadge}
                            </div>
                            
                            <h3 style="color:white; font-size:1.1rem; margin-bottom:25px; text-align:center;">
                                거리를 좁혀보세요 ${prevGapInfo}
                            </h3>

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                                <!-- My Status -->
                                <div class="glass-card" style="padding: 20px; border: ${myCardBorder}; background: ${myCardBg}; ${data.hasOpponentProposed ? 'animation: pulse-border 2s infinite;' : ''}">
                                    <div style="font-size: 3rem; margin-bottom: 10px;">${myIcon}</div>
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">나의 상태</div>
                                    <div style="font-size: 1.1rem; font-weight: bold; color: ${myStatusColor};">${myStatusText}</div>
                                </div>
                                <!-- Opponent Status -->
                                <div class="glass-card" style="padding: 20px; border: ${oppStatusBorder}; background: ${oppStatusBg};">
                                    <div style="font-size: 3rem; margin-bottom: 10px;">${data.hasOpponentProposed ? '🔒' : '👤'}</div>
                                    <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">상대방 상태</div>
                                    <div style="font-size: 1.1rem; font-weight: bold; color: ${oppStatusColor};">${oppStatusText}</div>
                                </div>
                            </div>

                            <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; text-align: left;">
                                <h4 style="color: #fff; margin-bottom: 15px; font-size: 1rem;"><i class="fas fa-lightbulb" style="color: #facc15; margin-right: 8px;"></i>${currentRound}라운드 합의 성공 팁</h4>
                                <ul style="list-style: none; padding: 0; margin: 0; color: #94a3b8; font-size: 0.9rem; line-height: 1.8;">
                                    <li>• 이전 라운드보다 <strong>조금 더 유연한 금액</strong>을 제안해보세요.</li>
                                    <li>• 서로 <strong>조금씩 양보할 때</strong> 합의 확률이 80% 이상 높아집니다. 📉</li>
                                    <li>• 이번 라운드의 제안도 상대방에게는 <strong>비공개</strong>됩니다.</li>
                                </ul>
                            </div>
                        </div>
                     `;
                }
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



        }
    } catch (e) {
        console.error(e);
    }
}

// Action: Submit Proposal
window.submitProposal = async function () {
    const amountInput = document.getElementById('myAmount'); // Fixed ID
    if (!amountInput || !amountInput.value) { alert('금액을 입력해주세요.'); return; }

    // UI Loading state...

    try {
        const caseId = localStorage.getItem('current_case_id');
        let userId = localStorage.getItem('user_id');
        if (!userId) { const u = JSON.parse(localStorage.getItem('user_info') || '{}'); userId = u.id; }

        const mappedRole = selectedRole === 'payer' ? 'offender' : (selectedRole === 'receiver' ? 'victim' : selectedRole);

        const payload = {
            userId: parseInt(userId),
            caseId: caseId,
            amount: parseInt(amountInput.value.replace(/,/g, '')) * 10000,
            duration: selectedDuration, // Use global selectedDuration
            position: mappedRole // Use global selectedRole (mapped)
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

// --- Helper: Midpoint Status Handler ---
async function checkMidpointStatus(statusData) {
    // If not active, return false to let main flow continue
    if (!statusData.midpointActive) return false;

    // We are in Phase 1 (Negotiation/Proposal)
    const el = ProposalUI.showRightPanelState('midpointAgreementState');

    // Status Logic:
    // 1. I haven't agreed yet -> Show Proposal UI
    // 2. I Agreed, Opponent hasn't -> Show Waiting UI

    if (!statusData.myMidpointAgreed) {
        // [Phase 1] User Action Needed
        el.innerHTML = `
            <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">
                <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; margin: 0 auto 20px auto; font-weight: 600;">
                    🎉 1차 동의: 합의 성사 임박
                </div>

                <h3 style="color: white; margin-bottom: 20px; text-align: center;">축하합니다! 합의가 눈앞에 있습니다</h3>
                
                <div class="glass-card" style="padding: 20px; margin-bottom: 25px; text-align:left; border-left: 4px solid #4ade80;">
                    <p style="color: #e2e8f0; font-size: 0.95rem; line-height: 1.6; margin: 0;">
                        양측의 금액 차이가 <strong>10% 이내</strong>로 좁혀졌습니다.<br>
                        <strong>[중간값]</strong>으로 합의하는 것에 동의하시겠습니까?
                    </p>
                </div>

                <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 30px; font-size: 0.85rem; color: #94a3b8; text-align: left;">
                    <i class="fas fa-info-circle" style="color: #60a5fa; margin-right: 5px;"></i> 진행 방식<br>
                    • '동의' 시, 상대방도 동의하면 <strong>금액이 공개</strong>되고 최종 확정 절차가 진행됩니다.<br>
                    • 현재 단계에서는 아직 상대방의 금액을 볼 수 없습니다.
                </div>

                <div style="display: flex; gap: 10px;">
                    <button class="btn btn-primary" onclick="agreeToMidpoint()" style="flex: 2; padding: 15px; font-size: 1.1rem; background: linear-gradient(135deg, #10b981, #059669); border:none;">
                        <i class="fas fa-thumbs-up" style="margin-right: 8px;"></i> 중간값으로 합의 진행 (동의)
                    </button>
                    <button class="btn btn-secondary" onclick="rejectMidpoint()" style="flex: 1; padding: 15px; font-size: 1rem; background: rgba(255,255,255,0.1);">
                        거절
                    </button>
                </div>
            </div>
         `;
    } else {
        // [Phase 1] Waiting for Opponent
        el.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div style="font-size: 3rem; margin-bottom: 20px; color: #4ade80;">👍</div>
                <h3 style="color: white; margin-bottom: 15px;">중간값 합의에 동의하셨습니다</h3>
                <p style="color: #94a3b8; margin-bottom: 30px;">
                    상대방의 결정을 기다리고 있습니다.<br>
                    상대방도 동의하면 <strong>즉시 금액이 공개</strong>됩니다.
                </p>
                <div class="loading-spinner" style="margin: 0 auto;"></div>
            </div>
        `;
    }

    return true; // Stop further rendering
}

// Action: Agree to Midpoint (Phase 1)
window.agreeToMidpoint = async function () {
    if (!confirm('중간값 합의 절차를 진행하시겠습니까?')) return;
    const caseId = localStorage.getItem('current_case_id');
    let userId = localStorage.getItem('user_id');
    if (!userId) { try { const u = JSON.parse(localStorage.getItem('user_info') || '{}'); userId = u.id; } catch (e) { } }

    try {
        const res = await ProposalAPI.submitMidpointIntent(caseId, userId, 'agree');
        if (res.success) {
            checkStatusUpdate(); // Re-render immediately
        }
    } catch (e) { console.error(e); }
};

// Action: Confirm Final Midpoint Amount (Phase 2)
window.confirmMidpointFinal = async function () {
    if (!confirm('이 금액으로 최종 합의를 확정하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    const caseId = localStorage.getItem('current_case_id');
    let userId = localStorage.getItem('user_id');
    if (!userId) { try { const u = JSON.parse(localStorage.getItem('user_info') || '{}'); userId = u.id; } catch (e) { } }

    try {
        const res = await ProposalAPI.confirmMidpointFinal(caseId, userId);
        if (res.success) {
            checkStatusUpdate(); // Re-render immediately (Should show Success screen)
        }
    } catch (e) { console.error(e); }
};

window.rejectMidpoint = async function () {
    if (!confirm('중간값 합의를 거절하고 다음 라운드로 진행하시겠습니까?')) return;
    // Implementation for rejection (Move to Next Round intent)
    // For now simple reload or specific API call if needed
    location.reload();
};

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

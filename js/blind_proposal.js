/**
 * blind_proposal.js
 * Main Controller for Blind Proposal System
 * Orchestrates ProposalAPI and ProposalUI
 * 
 * REFACTORED: Now uses ProposalHandler for complex state management and UI rendering.
 */

// Global State (Kept minimal for UI bindings)
let selectedDuration = 1; // Default 1 day
window.myLastProposalAmount = 0; // Needed for Gauge Chart rendering in Handler

// --- UI Interaction Functions (Controller Logic) ---

// 1. Select Role (Though usually fixed by login)
window.selectPosition = function (role) {
    // Current UI implementation seems to toggle button styles
    const payerBtn = document.getElementById('pos-payer');
    const receiverBtn = document.getElementById('pos-receiver');

    // Reset
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

    // Active
    const activeBtn = role === 'payer' ? payerBtn : receiverBtn;
    if (activeBtn) {
        activeBtn.style.background = 'rgba(59, 130, 246, 0.2)';
        activeBtn.style.color = 'white';
        activeBtn.style.borderColor = '#3b82f6';
    }
};

// 2. Select Duration
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
        btn.style.transform = 'scale(1)';
    });

    const activeBtn = document.getElementById(`btn-${days}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        activeBtn.style.border = '1px solid #4ade80';
        activeBtn.style.background = '#4ade80';
        activeBtn.style.color = '#000';
        activeBtn.style.fontWeight = 'bold';
        activeBtn.style.boxShadow = '0 0 10px rgba(74, 222, 128, 0.3)';
        activeBtn.style.transform = 'scale(1.05)';
    }

    // Update explanation text
    const desc = document.getElementById('duration-desc');
    if (desc) {
        if (days === '6h' || days === 0.25) desc.textContent = '빠른 합의를 원할 때 적합합니다.';
        else if (days === 1) desc.textContent = '표준적인 대기 시간입니다.';
        else if (days === 3) desc.textContent = '상대방에게 충분한 시간을 줍니다.';
    }
};

// 3. Submit Proposal
window.submitProposal = async () => {
    const amountInput = document.getElementById('myAmount');
    if (!amountInput) {
        console.error('Submission Error: Input element #myAmount not found');
        alert('입력 필드를 찾을 수 없습니다.');
        return;
    }

    const amount = parseInt(amountInput.value.replace(/,/g, ''), 10) * 10000;
    if (!amount || isNaN(amount) || amount <= 0) {
        alert('유효한 합의 금액을 입력해주세요.');
        return;
    }

    const caseId = localStorage.getItem('current_case_id');
    const userId = localStorage.getItem('user_id');

    // Calculate expiration (In Days)
    let durationDays = 1;

    // Normalize selectedDuration
    const sel = String(selectedDuration);

    if (sel === '6h' || sel === '0.25') {
        durationDays = 0.25;
    } else if (sel === '3') {
        durationDays = 3;
    }

    console.log(`[UI] Submitting Proposal: Amount=${amount}, Duration=${durationDays} (Selected=${selectedDuration})`);

    // Prevent Double Click
    const submitBtn = document.querySelector('button[onclick="submitProposal()"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "처리 중...";
    }

    try {
        // FIXED: ProposalAPI.submitProposal expects { caseId, userId, amount, duration }
        const result = await ProposalAPI.submitProposal({ caseId, userId, amount, duration: durationDays });
        if (result.success) {
            // alert('제안이 성공적으로 등록되었습니다.');
            amountInput.value = '';

            // Force immediate update
            await checkStatus();

            // Note: Button remains disabled as the UI will likely update to "Waiting" state immediately
            // If the state doesn't change for some reason, we might want to re-enable, but usually it's safer to keep disabled to prevent races.
        } else {
            alert(result.error || '제안 등록에 실패했습니다.');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "제안 등록하기";
            }
        }
    } catch (e) {
        console.error("Submission Error:", e);
        alert('서버 통신 중 오류가 발생했습니다.');
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            if (amountInput) amountInput.disabled = false;
            // Restore button text only if we didn't navigate away or succeed fully (success case reloads anyway)
            // Check if "Processing..." is still there, meaning we didn't succeed
            if (submitBtn.innerText === "처리 중...") {
                submitBtn.innerText = "제안 등록하기";
            }
        }
    }
};

// 4. Confirm View Result
// 4. Confirm View Result
window.viewAnalysisResult = async () => {
    console.log('[UI] View Analysis Result Clicked');

    const caseId = localStorage.getItem('current_case_id');
    const userId = localStorage.getItem('user_id');
    // Get round directly from debug data if available, or UI
    // Fallback to 1 if parsing fails
    const currentRound = parseInt(document.getElementById('currentRoundDisplay')?.textContent || '1');

    console.log(`[UI] Requesting View Result: Case=${caseId}, User=${userId}, Round=${currentRound}`);

    try {
        const res = await ProposalAPI.viewAnalysisResult(userId, caseId, currentRound);
        console.log('[UI] View Result Response:', res);

        if (res.success) {
            if (!res.bothViewed) {
                alert('결과 확인이 완료되었습니다.\n상대방이 아직 결과를 확인하지 않았습니다.\n상대방이 확인할 때까지 잠시 대기해주세요.');
            }
            await checkStatus(); // Refresh to update state
        } else {
            alert(res.message || '결과를 불러오는데 실패했습니다.');
        }
    } catch (e) {
        console.error('[UI] View Result Error:', e);
        alert('서버 통신 중 오류가 발생했습니다.');
    }
};

// Alias for compatibility if HTML calls legacy name
window.confirmViewResultBase = window.viewAnalysisResult;

// 5. Next Round Intent
window.confirmNextRoundIntent = async () => {
    const caseId = localStorage.getItem('current_case_id');
    const userId = localStorage.getItem('user_id');
    // currentRound logic needs to be safe. Handler handles UI, but Action needs data.
    // Let's assume Handler updated the UI correctly.
    const currentRound = parseInt(document.getElementById('currentRoundDisplay')?.textContent || '1');

    if (!confirm(`${currentRound + 1}라운드로 진행하시겠습니까?\n새로운 금액을 제안할 수 있습니다.`)) return;

    try {
        const res = await fetch('/api/case/proposal/next-round-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, caseId, round: currentRound })
        });
        const data = await res.json();
        if (data.success) {
            alert('다음 라운드 진행 의사를 전달했습니다.\n상대방도 동의하면 즉시 다음 라운드가 시작됩니다.');
            checkStatus();
        }
    } catch (e) {
        console.error(e);
    }
};

// 6. Midpoint Actions
window.acceptMidpoint = async () => {
    const caseId = localStorage.getItem('current_case_id');
    const userId = localStorage.getItem('user_id');

    if (!confirm('중간값 합의에 동의하시겠습니까?\n양측 모두 동의하면 즉시 합의금이 확정됩니다.')) return;

    try {
        const res = await ProposalAPI.decideMidpoint(userId, caseId, true, 1); // Phase 1 is initial agreement
        if (res.success) {
            alert('중간값 합의에 동의하셨습니다.\n상대방의 동의를 기다립니다.');
            await checkStatus();
        } else {
            alert(res.message || '처리 중 오류가 발생했습니다.');
        }
    } catch (e) {
        console.error(e);
        alert('서버 통신 오류');
    }
};

// Phase 1 Rejection
window.rejectMidpoint = async () => {
    const caseId = localStorage.getItem('current_case_id');
    const userId = localStorage.getItem('user_id');

    if (!confirm('중간값 합의를 거절하고 협상을 계속하시겠습니까?')) return;

    try {
        // Rejecting midpoint essentially means moving to next round intent
        // Or explicitly rejecting. The API might handle 'agreed: false' as rejection.
        const res = await ProposalAPI.decideMidpoint(userId, caseId, false, 1);
        if (res.success) {
            alert('중간값 합의를 거절했습니다.\n다음 라운드 제안 단계로 이동합니다.');
            // Automatically trigger next round intent if needed, or just refresh to show next round UI
            await checkStatus();
        } else {
            alert(res.message || '처리 중 오류가 발생했습니다.');
        }
    } catch (e) {
        console.error(e);
        alert('서버 통신 오류');
    }
};

// Phase 2 Final Agreement
window.acceptMidpointFinal = async () => {
    const caseId = localStorage.getItem('current_case_id');
    const userId = localStorage.getItem('user_id');

    if (!confirm('최종 합의 금액에 동의하시겠습니까?\n이 결정은 번복할 수 없으며 사건이 종결됩니다.')) return;

    try {
        const res = await ProposalAPI.decideMidpoint(userId, caseId, true, 2); // Phase 2 Final Agreement
        if (res.success) {
            alert('최종 합의에 동의하셨습니다.\n상대방의 최종 동의를 기다립니다.');
            await checkStatus();
        } else {
            alert(res.message || '처리 중 오류가 발생했습니다.');
        }
    } catch (e) {
        console.error(e);
        alert('서버 통신 오류');
    }
};

window.rejectMidpointFinal = async () => {
    const caseId = localStorage.getItem('current_case_id');
    const userId = localStorage.getItem('user_id');

    if (!confirm('중간값 합의를 최종 거절하시겠습니까?\n거절 시 다음 라운드로 넘어갑니다.')) return;

    try {
        const res = await ProposalAPI.decideMidpoint(userId, caseId, false, 2); // Phase 2 Rejection
        if (res.success) {
            alert('최종 합의를 거절했습니다.\n다음 라운드로 진행됩니다.');
            await checkStatus();
        } else {
            alert(res.message || '처리 중 오류가 발생했습니다.');
        }
    } catch (e) {
        console.error(e);
        alert('서버 통신 오류');
    }
};

// 7. Request Extension
window.requestExtension = async () => {
    const caseId = localStorage.getItem('current_case_id');
    const userId = localStorage.getItem('user_id');

    // Confirm dialog
    if (!confirm('3라운드 추가 진행을 요청하시겠습니까?\n상대방도 동의하면 총 8라운드까지 기회가 늘어납니다.')) return;

    try {
        const res = await ProposalAPI.requestExtension(caseId, userId);
        if (res.success) {
            if (res.isExtended) {
                alert('양측 모두 동의하여 3라운드가 추가되었습니다!\n협상을 계속 진행해주세요.');
            } else {
                alert('연장 요청을 보냈습니다.\n상대방이 동의하면 즉시 라운드가 추가됩니다.');
            }
            // Force status update
            await checkStatus();
        } else {
            alert(res.error || '요청 처리에 실패했습니다.');
        }
    } catch (e) {
        console.error("Extension Request Error:", e);
        alert('서버 통신 중 오류가 발생했습니다.');
    }
};

// --- Main Loop ---

async function checkStatus() {
    const caseId = localStorage.getItem('current_case_id');
    const userId = localStorage.getItem('user_id');

    if (!caseId || !userId) {
        console.warn('[BlindProposal] Missing credentials. Redirecting...');
        alert('사건 정보가 유실되었습니다. 대시보드에서 사건을 다시 선택해주세요.');
        window.location.href = 'dashboard.html';
        return;
    }

    try {
        const data = await ProposalAPI.checkStatus(caseId, userId);

        if (window.ProposalHandler) {
            window.ProposalHandler.process(data);
        }

        if (data && !data.success) {
            console.warn('[BlindProposal] Status Check Failed:', data.error);

            // Add visual feedback for error
            if (data.error === 'Case not found') {
                clearInterval(window.statusPollInterval);
                alert('사건 정보를 찾을 수 없습니다. 대시보드로 이동합니다.');
                window.location.href = 'dashboard.html';
                return;
            } else {
                // For diagnosis
                console.error("Server Error:", data.error);
                // Only alert once to avoid spamming
                if (!window._errorAlerted) {
                    alert('Status Check Error: ' + data.error);
                    window._errorAlerted = true;
                }
            }
        }

        // Reset alert flag on success
        if (data && data.success) window._errorAlerted = false;

        // DEBUG
        if (window.updateDebugInfo) window.updateDebugInfo(data);
    } catch (e) {
        console.error(e);
    }
}



// --- Initialization ---

window.addEventListener('DOMContentLoaded', () => {
    console.log('[Controller] Initializing Blind Proposal...');

    // Quick Sidebar Update from LocalStorage (Fallback)
    const savedTitle = localStorage.getItem('current_case_title') || localStorage.getItem('current_case_number');
    const savedOpponent = localStorage.getItem('current_counterparty');

    if (savedTitle) {
        const el = document.getElementById('sidebarCaseNumber');
        if (el) el.textContent = savedTitle;
    }
    if (savedOpponent) {
        const el = document.getElementById('sidebarCounterparty');
        if (el) el.textContent = savedOpponent;
    }

    // Start Poll
    checkStatus();
    window.statusPollInterval = setInterval(checkStatus, 3000); // 3-second poll

    // Input Formatting
    const input = document.getElementById('myAmount');
    if (input) {
        input.addEventListener('input', (e) => {
            let val = e.target.value.replace(/[^0-9]/g, '');
            if (val) {
                e.target.value = parseInt(val).toLocaleString();
            } else {
                e.target.value = '';
            }
        });
    }

    // Midpoint Buttons Binding
    const btnAgree = document.getElementById('btnAgreeMidpoint');
    const btnReject = document.getElementById('btnRejectMidpoint');
    if (btnAgree) {
        btnAgree.onclick = window.acceptMidpoint;
        console.log('[Controller] Bound acceptMidpoint to button');
    }
    if (btnReject) {
        btnReject.onclick = window.rejectMidpoint;
        console.log('[Controller] Bound rejectMidpoint to button');
    }
});

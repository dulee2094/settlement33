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
        if (days === '6h') desc.textContent = '빠른 합의를 원할 때 적합합니다.';
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

    // Calculate expiration
    let durationHours = 24;
    if (selectedDuration === '6h') durationHours = 6;
    else if (selectedDuration === 3) durationHours = 72;

    // Prevent Double Click
    const submitBtn = document.querySelector('button[onclick="submitProposal()"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "처리 중...";
    }

    try {
        // FIXED: ProposalAPI.submitProposal expects { caseId, userId, amount, duration }
        const result = await ProposalAPI.submitProposal({ caseId, userId, amount, duration: durationHours });
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
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerText = "제안 등록하기";
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
                alert('1라운드 결과 확인 완료.\n상대방이 아직 결과를 확인하지 않았습니다.\n상대방이 확인할 때까지 잠시 대기해주세요.');
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
    // Legacy logic
    // ... (Implementation if needed, or rely on existing API)
    // For now, let's keep it minimal
    alert('중간값 합의 수락 로직 구현 필요');
};
window.rejectMidpoint = async () => {
    alert('중간값 합의 거절 로직 구현 필요');
};

// --- Main Loop ---

async function checkStatus() {
    const caseId = localStorage.getItem('current_case_id');
    const userId = localStorage.getItem('user_id');

    if (!caseId || !userId) return;

    try {
        const data = await ProposalAPI.checkStatus(caseId, userId);

        if (window.ProposalHandler) {
            window.ProposalHandler.process(data);
        }

        if (data && !data.success) {
            console.warn('[BlindProposal] Status Check Failed:', data.error);
            if (data.error === 'Case not found') {
                clearInterval(window.statusPollInterval); // Stop polling
                alert('사건 정보를 찾을 수 없습니다. 대시보드로 이동합니다.');
                window.location.href = 'dashboard.html';
            }
        }

        // DEBUG
        if (window.updateDebugInfo) window.updateDebugInfo(data);
    } catch (e) {
        console.error(e);
    }
}



// --- Initialization ---

window.addEventListener('DOMContentLoaded', () => {
    console.log('[Controller] Initializing Blind Proposal...');

    // Initial Setup
    // ProposalUI.init(); // Removed: Method does not exist and is not needed.

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
});

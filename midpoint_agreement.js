// Midpoint Agreement Functions for blind_proposal.html

// Function to agree to midpoint
async function agreeMidpoint() {
    if (!confirm(`중간 금액 ${(midpointAmount / 10000).toLocaleString()}만원으로 합의하시겠습니까?\n\n양측이 모두 동의하면 최종 합의금이 결정됩니다.`)) {
        return;
    }

    const caseId = localStorage.getItem('current_case_id');
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    const userId = userInfo.id;

    try {
        const res = await fetch('/api/case/proposal/midpoint-agree', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caseId, userId })
        });

        const data = await res.json();

        if (data.success) {
            if (data.bothAgreed) {
                // Save final agreed amount to localStorage for payment page
                localStorage.setItem('final_agreed_amount', data.midpointAmount.toString());
                localStorage.setItem('final_agreed_date', new Date().toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }));

                // Update case status to settled
                localStorage.setItem('current_case_status', 'settled');

                alert(`🎉 축하합니다!\n\n양측이 모두 동의하여 최종 합의금이 결정되었습니다.\n\n최종 합의금: ${(data.midpointAmount / 10000).toLocaleString()}만원`);
            } else {
                alert('중간 금액 합의에 동의하셨습니다.\n상대방의 동의를 기다리는 중입니다.');
            }
            location.reload();
        } else {
            alert('오류 발생: ' + data.error);
        }
    } catch (e) {
        console.error(e);
        alert('서버 통신 오류');
    }
}

// Function to check midpoint status and update UI
async function checkMidpointStatus() {
    const caseId = localStorage.getItem('current_case_id');
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    const userId = userInfo.id;

    try {
        const res = await fetch(`/api/case/proposal/midpoint-status?caseId=${caseId}&userId=${userId}`);
        const data = await res.json();

        if (data.success && data.midpointProposed) {
            midpointProposed = data.midpointProposed;
            midpointAmount = data.midpointAmount;
            iAgreedMidpoint = data.iAgreed;
            oppAgreedMidpoint = data.oppAgreed;
            bothAgreedMidpoint = data.bothAgreed;

            const notifArea = document.getElementById('notificationArea');

            // Both agreed - Show final settlement
            if (bothAgreedMidpoint) {
                // Save final agreed amount to localStorage for payment page
                localStorage.setItem('final_agreed_amount', midpointAmount.toString());
                localStorage.setItem('final_agreed_date', new Date().toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }));
                localStorage.setItem('current_case_status', 'settled');

                notifArea.style.display = 'block';
                notifArea.innerHTML = `
                    <div class="glass-card" style="background: rgba(74, 222, 128, 0.15); border: 2px solid #4ade80; display: flex; align-items: center; gap: 20px; padding: 30px; animation: pulse-border 2s infinite;">
                        <div style="width: 70px; height: 70px; background: #4ade80; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 20px rgba(74, 222, 128, 0.6);">
                            <i class="fas fa-check-circle" style="color: white; font-size: 2.2rem;"></i>
                        </div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 10px 0; color: #4ade80; font-size: 1.4rem;">🎉 합의 성사! 최종 합의금이 결정되었습니다</h3>
                            <p style="margin: 0 0 15px 0; color: #cbd5e1; font-size: 1rem; line-height: 1.6;">
                                양측이 모두 중간 금액 합의에 동의하셨습니다.<br>
                                <strong style="color: #fff; font-size: 1.2rem;">최종 합의금: ${(midpointAmount / 10000).toLocaleString()}만원</strong>
                            </p>
                            <div style="background: rgba(74, 222, 128, 0.1); padding: 12px; border-radius: 8px; border-left: 3px solid #4ade80;">
                                <p style="margin: 0; color: #94a3b8; font-size: 0.9rem;">
                                    이제 사건 상세 페이지로 이동하여 다음 단계를 진행해주세요.
                                </p>
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <button class="btn btn-primary" onclick="location.href='case_detail.html'" style="background: #4ade80; border:none; box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4); color: #000; font-weight: bold;">
                                사건 상세로 이동
                            </button>
                        </div>
                    </div>
                `;
                return true; // Highest priority
            }
            // Waiting for my agreement
            else if (!iAgreedMidpoint) {
                notifArea.style.display = 'block';
                notifArea.innerHTML = `
                    <div class="glass-card" style="background: rgba(74, 222, 128, 0.1); border: 1px solid #4ade80; display: flex; align-items: center; gap: 20px; padding: 25px; animation: pulse-border 2s infinite;">
                        <div style="width: 60px; height: 60px; background: #4ade80; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 15px rgba(74, 222, 128, 0.5);">
                            <i class="fas fa-balance-scale" style="color: white; font-size: 1.8rem;"></i>
                        </div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 8px 0; color: #fff; font-size: 1.2rem;">✨ 10% 이내 합의 제안!</h3>
                            <p style="margin: 0; color: #cbd5e1; font-size: 0.95rem; line-height: 1.5;">
                                양측의 제안 금액이 <strong>10% 이내</strong>로 매우 가깝습니다!<br>
                                중간 금액 <strong style="color: #4ade80;">${(midpointAmount / 10000).toLocaleString()}만원</strong>으로 합의하시겠습니까?
                            </p>
                        </div>
                        <div style="text-align: right;">
                            <button class="btn btn-primary" onclick="agreeMidpoint()" style="background: #4ade80; border:none; box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4); color: #000; font-weight: bold;">
                                중간 금액 합의 동의
                            </button>
                        </div>
                    </div>
                `;
                return true; // High priority
            }
            // Waiting for opponent's agreement
            else if (iAgreedMidpoint && !oppAgreedMidpoint) {
                notifArea.style.display = 'block';
                notifArea.innerHTML = `
                    <div class="glass-card" style="background: rgba(59, 130, 246, 0.1); border: 1px solid #3b82f6; display: flex; align-items: center; gap: 20px; padding: 25px;">
                        <div style="width: 60px; height: 60px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);">
                            <i class="fas fa-hourglass-half" style="color: white; font-size: 1.8rem;"></i>
                        </div>
                        <div style="flex: 1;">
                            <h3 style="margin: 0 0 8px 0; color: #fff; font-size: 1.2rem;">⏳ 상대방의 동의를 기다리는 중...</h3>
                            <p style="margin: 0; color: #cbd5e1; font-size: 0.95rem; line-height: 1.5;">
                                중간 금액 <strong>${(midpointAmount / 10000).toLocaleString()}만원</strong>에 동의하셨습니다.<br>
                                상대방이 동의하면 최종 합의금이 결정됩니다.
                            </p>
                        </div>
                    </div>
                `;
                return true; // High priority
            }
        }
    } catch (e) {
        console.error('Midpoint status check error:', e);
    }

    return false; // No midpoint notification shown
}

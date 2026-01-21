// Midpoint Agreement Functions for blind_proposal.html

// Function to agree to midpoint
async function agreeMidpoint() {
    if (!confirm(`중간 금액(비공개)으로 합의하시겠습니까?\n\n양측이 모두 동의하면 구체적인 합의금이 공개되고 최종 확정됩니다.\n*동의 후에는 철회가 불가능합니다.`)) {
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
                alert('중간 금액 합의에 동의하셨습니다.\n상대방의 동의를 기다리는 중입니다.\n(아직 금액은 공개되지 않습니다)');
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

            const notifArea = document.getElementById('midpointResultArea');

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
                    <div class="glass-card" style="background: rgba(74, 222, 128, 0.15); border: 2px solid #4ade80; display: flex; flex-direction: column; align-items: center; gap: 20px; padding: 25px; animation: pulse-border 2s infinite;">
                        <div style="width: 80px; height: 80px; background: #4ade80; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 0 20px rgba(74, 222, 128, 0.6);">
                            <i class="fas fa-check-circle" style="color: white; font-size: 2.5rem;"></i>
                        </div>
                        <div style="text-align: center;">
                            <h3 style="margin: 0 0 10px 0; color: #4ade80; font-size: 1.4rem;">🎉 합의 성사!</h3>
                            <p style="margin: 0 0 15px 0; color: #cbd5e1; font-size: 1rem; line-height: 1.6;">
                                양측이 모두 중간 금액 합의에 동의하여<br>최종 합의금이 결정되었습니다.
                            </p>
                            <div style="background: rgba(74, 222, 128, 0.1); padding: 15px; border-radius: 8px; border: 1px solid #4ade80; margin-bottom: 10px;">
                                <div style="font-size: 0.9rem; color: #86efac; margin-bottom: 5px;">최종 합의금</div>
                                <strong style="color: #fff; font-size: 1.5rem;">${(midpointAmount / 10000).toLocaleString()}만원</strong>
                            </div>
                        </div>
                        <div style="width: 100%;">
                            <button class="btn btn-primary" onclick="location.href='case_detail.html'" style="width: 100%; background: #4ade80; border:none; box-shadow: 0 4px 15px rgba(74, 222, 128, 0.4); color: #000; font-weight: bold; padding: 15px;">
                                사건 상세로 이동
                            </button>
                        </div>
                    </div>
                `;
                return true; // Highest priority
            }
            // Waiting for my agreement (ENHANCED - Opponent agreed first)
            else if (!iAgreedMidpoint) {
                notifArea.style.display = 'block';
                notifArea.innerHTML = `
                    <div class="glass-card" style="
                        background: linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(34, 197, 94, 0.1));
                        border: 2px solid #4ade80;
                        border-radius: 16px;
                        padding: 30px;
                        text-align: center;
                        animation: pulse-glow 2s infinite;
                    ">
                        <!-- Progress Indicator -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                            <div style="background: rgba(74, 222, 128, 0.2); padding: 15px; border-radius: 12px; border: 2px solid #4ade80;">
                                <div style="font-size: 0.85rem; color: #86efac; margin-bottom: 8px;">상대방</div>
                                <div style="font-size: 2rem; margin-bottom: 5px;">✅</div>
                                <div style="font-size: 0.9rem; color: #4ade80; font-weight: bold;">동의함</div>
                            </div>
                            <div style="background: rgba(251, 191, 36, 0.1); padding: 15px; border-radius: 12px; border: 2px dashed #fbbf24; animation: pulse-glow 2s infinite;">
                                <div style="font-size: 0.85rem; color: #fcd34d; margin-bottom: 8px;">나</div>
                                <div style="font-size: 2rem; margin-bottom: 5px; animation: bounce-icon 2s infinite;">⏳</div>
                                <div style="font-size: 0.9rem; color: #fbbf24; font-weight: bold;">대기중</div>
                            </div>
                        </div>

                        <!-- Progress Bar -->
                        <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; margin-bottom: 25px; overflow: hidden;">
                            <div style="background: linear-gradient(90deg, #4ade80, #22c55e); width: 50%; height: 100%; border-radius: 4px; animation: pulse-glow 2s infinite;"></div>
                        </div>

                        <!-- Main Message -->
                        <div style="font-size: 2.5rem; margin-bottom: 15px; animation: bounce-icon 2s infinite;">
                            🤝
                        </div>
                        <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.4rem;">
                            상대방이 먼저 합의에 동의했습니다!
                        </h3>
                        <p style="color: #fbbf24; font-size: 1.1rem; font-weight: bold; margin-bottom: 25px;">
                            ✅ 귀하의 동의만 기다리고 있습니다
                        </p>

                        <!-- Benefits Box -->
                        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: left;">
                            <div style="color: #4ade80; font-size: 1rem; margin-bottom: 12px; font-weight: bold;">
                                💎 지금 동의하시면:
                            </div>
                            <div style="color: #cbd5e1; font-size: 0.95rem; line-height: 2;">
                                • <strong style="color: #4ade80;">즉시 합의 성사</strong> 🎉<br>
                                • 공정한 중간 금액으로 확정<br>
                                • 더 이상의 협상 불필요<br>
                                • 빠른 사건 종결
                            </div>
                        </div>

                        <!-- CTA Button -->
                        <button class="btn btn-primary" onclick="agreeMidpoint()" style="
                            width: 100%;
                            background: linear-gradient(135deg, #4ade80, #22c55e);
                            border: none;
                            box-shadow: 0 6px 25px rgba(74, 222, 128, 0.6);
                            color: #000;
                            font-weight: bold;
                            padding: 20px;
                            font-size: 1.15rem;
                            margin-bottom: 15px;
                            transition: all 0.3s;
                        ">
                            <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                            중간 금액 합의 동의하기
                        </button>

                        <!-- Warning -->
                        <div style="background: rgba(251, 191, 36, 0.1); padding: 12px; border-radius: 8px; border-left: 3px solid #fbbf24;">
                            <p style="font-size: 0.85rem; color: #fbbf24; margin: 0; line-height: 1.6;">
                                ⚠️ <strong>동의하지 않으면</strong> 협상이 계속되며,<br>
                                이 기회를 놓칠 수 있습니다
                            </p>
                        </div>

                        <!-- Info -->
                        <p style="font-size: 0.75rem; color: #94a3b8; margin-top: 15px; margin-bottom: 0;">
                            💡 양측 모두 동의 시 즉시 타결됩니다 (10% 이내 합의)
                        </p>
                    </div>
                `;
                return true; // High priority
            }
            // Waiting for opponent's agreement (ENHANCED)
            else if (iAgreedMidpoint && !oppAgreedMidpoint) {
                notifArea.style.display = 'block';
                notifArea.innerHTML = `
                    <div class="glass-card" style="
                        background: linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(34, 197, 94, 0.1));
                        border: 2px solid #4ade80;
                        border-radius: 16px;
                        padding: 30px;
                        text-align: center;
                        animation: pulse-glow 2s infinite;
                    ">
                        <!-- Progress Indicator -->
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                            <div style="background: rgba(74, 222, 128, 0.2); padding: 15px; border-radius: 12px; border: 2px solid #4ade80;">
                                <div style="font-size: 0.85rem; color: #86efac; margin-bottom: 8px;">나</div>
                                <div style="font-size: 2rem; margin-bottom: 5px;">✅</div>
                                <div style="font-size: 0.9rem; color: #4ade80; font-weight: bold;">동의함</div>
                            </div>
                            <div style="background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 12px; border: 2px dashed #3b82f6;">
                                <div style="font-size: 0.85rem; color: #93c5fd; margin-bottom: 8px;">상대방</div>
                                <div style="font-size: 2rem; margin-bottom: 5px; animation: bounce-icon 2s infinite;">⏳</div>
                                <div style="font-size: 0.9rem; color: #60a5fa; font-weight: bold;">대기중</div>
                            </div>
                        </div>

                        <!-- Progress Bar -->
                        <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; margin-bottom: 25px; overflow: hidden;">
                            <div style="background: linear-gradient(90deg, #4ade80, #22c55e); width: 50%; height: 100%; border-radius: 4px; animation: pulse-glow 2s infinite;"></div>
                        </div>

                        <!-- Main Message -->
                        <div style="font-size: 2.5rem; margin-bottom: 15px;">
                            ⏰
                        </div>
                        <h3 style="color: #fff; margin-bottom: 15px; font-size: 1.3rem;">
                            상대방의 동의를 기다리는 중...
                        </h3>
                        <p style="color: #4ade80; font-size: 1.05rem; font-weight: bold; margin-bottom: 20px;">
                            ✅ 귀하는 이미 동의하셨습니다
                        </p>

                        <!-- Status Message -->
                        <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                            <p style="color: #cbd5e1; font-size: 0.95rem; line-height: 1.8; margin: 0;">
                                중간 금액 합의에 동의하셨습니다.<br>
                                상대방이 동의하면 <strong style="color: #4ade80;">즉시 합의가 성사</strong>되고<br>
                                최종 합의금이 공개됩니다.
                            </p>
                        </div>

                        <!-- What Happens Next -->
                        <div style="background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 12px; border-left: 3px solid #3b82f6; text-align: left; margin-bottom: 15px;">
                            <div style="color: #60a5fa; font-size: 0.9rem; margin-bottom: 8px; font-weight: bold;">
                                💡 다음 단계
                            </div>
                            <div style="color: #cbd5e1; font-size: 0.85rem; line-height: 1.6;">
                                • 상대방이 동의하면 즉시 알림<br>
                                • 최종 합의금 자동 공개<br>
                                • 사건 상태 "합의 완료"로 변경
                            </div>
                        </div>

                        <!-- Info -->
                        <p style="font-size: 0.8rem; color: #94a3b8; margin: 0;">
                            <i class="fas fa-info-circle"></i> 페이지를 새로고침하면 최신 상태를 확인할 수 있습니다
                        </p>
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

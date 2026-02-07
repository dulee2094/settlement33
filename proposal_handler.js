/**
 * ProposalHandler.js
 * Handles UI transitions based on state
 * Replaces complex logic in blind_proposal.js
 */
window.ProposalHandler = {
    // Current State for caching
    currentState: null,

    /**
     * Main entry point
     */
    process(data) {
        if (!data) return;

        // Augment data with computed properties (Fix for missing maxLimit)
        data.maxLimit = data.isExtended ? 8 : 5;

        // Use ProposalState logic
        const state = ProposalState.determineState(data);
        console.log(`[ProposalHandler] Processing State: ${state}`);

        // Update UI based on State
        switch (state) {
            case ProposalState.CONST.STEP_1_INPUT:
                this.renderInputDashboard(data);
                break;
            case ProposalState.CONST.STEP_2_WAITING:
                this.renderWaitingDashboard(data, false);
                break;
            case ProposalState.CONST.STEP_3_READY_TO_VIEW:
                this.renderReadyDashboard(data);
                break;
            case ProposalState.CONST.STEP_4_RESULT_VIEW:
                this.renderResultDashboard(data);
                break;
            case ProposalState.CONST.STEP_5A_MIDPOINT:
                this.renderMidpointDashboard(data);
                break;
            case ProposalState.CONST.STEP_5B_NEXT_ROUND_WAITING:
                this.renderWaitingDashboard(data, true); // True for Next Round Waiting
                break;
            default:
                console.warn('[ProposalHandler] Unknown State:', state);
        }

        this.currentState = state;
    },

    // --- Phase Handlers ---

    renderInputDashboard(data) {
        ProposalUI.updateCountUI(data.myProposalCount, data.maxLimit, data.currentRound);
        ProposalUI.toggleProposalInput(true);
        const el = ProposalUI.showRightPanelState('waitingState');
        const currentRound = data.currentRound || 1;

        // Round 1 Input
        if (currentRound === 1) {
            let oppStatusText = '❓ 입력 대기';
            let oppStatusColor = '#64748b';
            let oppStatusBg = 'rgba(255,255,255,0.05)';
            let oppStatusBorder = '1px solid rgba(255,255,255,0.1)';

            if (data.hasOpponentProposed) {
                oppStatusText = '✅ 등록 완료 (대기 중)';
                oppStatusColor = '#4ade80';
                oppStatusBg = 'rgba(59, 130, 246, 0.1)';
                oppStatusBorder = '1px solid #3b82f6';
            }

            let guideTitle = "진행 안내";
            let guideIcon = "fa-info-circle";
            let guideColor = "#60a5fa";
            let topBadge = "📍 1라운드 진행 중";
            let myCardBorder = "1px solid rgba(251, 191, 36, 0.5)";
            let myCardBg = "rgba(251, 191, 36, 0.05)";
            let myStatusText = "입력 대기";
            let myStatusColor = "#fbbf24";
            let myIcon = "✏️";

            if (data.hasOpponentProposed) {
                topBadge = "🚀 상대방 제안 등록 완료!";
                guideTitle = "이제 고객님의 차례입니다";
                guideIcon = "fa-bell";
                guideColor = "#ef4444";
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
                        <div class="glass-card" style="padding: 20px; border: ${myCardBorder}; background: ${myCardBg}; ${data.hasOpponentProposed ? 'animation: pulse-border 2s infinite;' : ''}">
                            <div style="font-size: 3rem; margin-bottom: 10px;">${myIcon}</div>
                            <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">나의 상태</div>
                            <div style="font-size: 1.1rem; font-weight: bold; color: ${myStatusColor};">${myStatusText}</div>
                        </div>
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
                    `<li>• <strong>상대방이 제안을 마쳤습니다.</strong></li><li>• 금액을 입력하면 <strong>즉시 격차 분석 결과</strong>를 확인할 수 있습니다.</li><li>• 입력하신 금액은 타결 전까지 <strong>절대 비공개</strong>됩니다.</li>` :
                    `<li>• 희망 금액을 등록하면 상대방에게 <strong>알림이 전송</strong>됩니다.</li><li>• 양측 모두 등록 시 <strong>AI 격차 분석</strong>이 즉시 시작됩니다.</li><li>• 제안하신 금액은 타결 전까지 <strong>상대방에게 비공개</strong>됩니다.</li>`
                }
                        </ul>
                    </div>
                </div>`;
        } else {
            // Round 2+ Input
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

            el.innerHTML = `
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">
                    <div style="background: rgba(59, 130, 246, 0.1); color: #60a5fa; display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; margin: 0 auto 20px auto; border: 1px solid rgba(59, 130, 246, 0.3); font-weight: 600;">
                        🔄 ${currentRound}라운드 제안 진행 중
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                        <div class="glass-card" style="padding: 20px; border: 2px solid #f59e0b; background: rgba(251, 191, 36, 0.05); animation: pulse-border 2s infinite;">
                            <div style="font-size: 3rem; margin-bottom: 10px;">✏️</div>
                            <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">나의 수정 제안</div>
                            <div style="font-size: 1.1rem; font-weight: bold; color: #fbbf24;">입력 필요</div>
                        </div>
                        <div class="glass-card" style="padding: 20px; border: ${oppStatusBorder}; background: ${oppStatusBg};">
                            <div style="font-size: 3rem; margin-bottom: 10px;">${data.hasOpponentProposed ? '🔒' : '👤'}</div>
                             <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">상대방 상태</div>
                            <div style="font-size: 1.1rem; font-weight: bold; color: ${oppStatusColor};">${oppStatusText}</div>
                        </div>
                    </div>
                     <div style="background: rgba(255,255,255,0.03); border-radius: 12px; padding: 20px; text-align: left;">
                        <h4 style="color: #fff; margin-bottom: 15px; font-size: 1rem;"><i class="fas fa-sync-alt" style="color: #60a5fa; margin-right: 8px;"></i>협상 진행 중</h4>
                        <div style="color: #cbd5e1; line-height: 1.6; font-size: 0.95rem;">
                            이전 라운드에서 합의점에 도달하지 못했습니다.<br>
                            격차를 줄이기 위해 <strong>새로운 금액</strong>을 제안해주세요.
                        </div>
                    </div>
                </div>`;
        }
    },

    renderWaitingDashboard(data, isNextRoundWait = false) {
        ProposalUI.updateCountUI(data.myProposalCount, data.maxLimit, data.currentRound);
        ProposalUI.toggleProposalInput(false);
        const el = ProposalUI.showRightPanelState('waitingState');
        const currentRound = data.currentRound || 1;
        const proposalExpiration = data.myLastProposal ? data.myLastProposal.expiresAt : null;

        if (currentRound === 1 && !isNextRoundWait) {
            el.innerHTML = `
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">
                    <div style="background: rgba(74, 222, 128, 0.1); color: #4ade80; display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; margin: 0 auto 20px auto; border: 1px solid rgba(74, 222, 128, 0.3); font-weight: 600;">
                        📍 1라운드: 상대방 입력 대기 중
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                        <div class="glass-card" style="padding: 20px; border: 1px solid rgba(74, 222, 128, 0.5); background: rgba(74, 222, 128, 0.05);">
                            <div style="font-size: 3rem; margin-bottom: 10px;">✅</div>
                            <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">나의 상태</div>
                            <div style="font-size: 1.1rem; font-weight: bold; color: #4ade80;">등록 완료</div>
                        </div>
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
                </div>`;
        } else {
            // Round 2+ or Next Round Waiting
            el.innerHTML = `
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center;">
                    <div style="background: rgba(139, 92, 246, 0.1); color: #a78bfa; display: inline-block; padding: 6px 15px; border-radius: 20px; font-size: 0.9rem; margin: 0 auto 20px auto; border: 1px solid rgba(139, 92, 246, 0.3); font-weight: 600;">
                        🔄 ${currentRound}라운드: 상대방 응답 대기 중
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
                        <div class="glass-card" style="padding: 20px; border: 1px solid rgba(167, 139, 250, 0.5); background: rgba(167, 139, 250, 0.05);">
                            <div style="font-size: 3rem; margin-bottom: 10px;">🆗</div>
                            <div style="font-size: 0.9rem; color: #cbd5e1; margin-bottom: 5px;">나의 수정 제안</div>
                             <div style="font-size: 1.1rem; font-weight: bold; color: #ddd6fe;">등록 완료</div>
                        </div>
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
                </div>`;
        }

        if (proposalExpiration) {
            ProposalUI.startExpirationTimer(proposalExpiration, 'expirationTimerDisplay');
        }
    },

    renderReadyDashboard(data) {
        ProposalUI.updateCountUI(data.myProposalCount, data.maxLimit, data.currentRound);
        ProposalUI.toggleProposalInput(false);
        ProposalUI.showRightPanelState('analysisReadyState');
    },

    renderResultDashboard(data) {
        ProposalUI.updateCountUI(data.myProposalCount, data.maxLimit, data.currentRound);
        ProposalUI.toggleProposalInput(false);
        const d = data.currentRoundData;

        // Safety check if d is null
        if (!d) {
            console.error("Result Dashboard requested but no round data available");
            return;
        }

        const calcDiff = Math.abs(d.offenderAmount - d.victimAmount);
        const gapPercent = (calcDiff / Math.max(d.offenderAmount, d.victimAmount)) * 100;
        // isFinalLoop logic: round >= 5 and NOT extended
        // Use data.isExtended if available
        const isFinalLoop = (data.currentRound >= 5 && !data.isExtended);

        ProposalUI.renderGaugeChart(gapPercent, window.myLastProposalAmount, isFinalLoop, data.currentRound);

        ProposalUI.renderNextRoundAction(
            window.myLastProposalAmount,
            data.myNextRoundIntent,
            data.oppNextRoundIntent,
            isFinalLoop,
            data.currentRound
        );
    },

    renderMidpointDashboard(data) {
        ProposalUI.updateCountUI(data.myProposalCount, data.maxLimit, data.currentRound);
        ProposalUI.toggleProposalInput(false);
        ProposalUI.showRightPanelState('midpointAgreementState');
    }
};

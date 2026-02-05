/**
 * ProposalAPI
 * Handling all server communications for blind proposal
 */
window.ProposalAPI = {
    // Check Proposal Status (Polling)
    async checkStatus(caseId, userId) {
        if (!caseId || !userId) throw new Error('Missing credentials');
        const res = await fetch(`/api/case/proposal?caseId=${caseId}&userId=${userId}`);
        const data = await res.json();
        return data;
    },

    // Submit a new proposal
    async submitProposal(payload) {
        const res = await fetch('/api/case/proposal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        return data;
    },

    // View Analysis Result (2-Step Verification)
    async viewAnalysisResult(userId, caseId, round) {
        const res = await fetch('/api/case/proposal/view-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, caseId, round })
        });
        const data = await res.json();
        return data;
    },

    // Agree/Reject Midpoint (Step 1 or 2)
    async decideMidpoint(userId, caseId, isAgreed, phase = 1) {
        const endpoint = phase === 2
            ? '/api/case/proposal/midpoint-final-agree'
            : '/api/case/proposal/midpoint-procedure-agree';

        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, caseId, agreed: isAgreed })
        });
        const data = await res.json();
        return data;
    },

    // Request Extension
    async requestExtension(caseId, userId) {
        const res = await fetch('/api/case/proposal/extend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caseId, userId })
        });
        const data = await res.json();
        return data;
    },

    // Skip/Sync Expiration Round
    async syncExpiration(userId, caseId, round) {
        const res = await fetch('/api/case/proposal/expire-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, caseId, round })
        });
        const data = await res.json();
        return data;
    },

    // Request to proceed to next round (Intent)
    async requestNextRound(userId, caseId, currentRound) {
        // Assuming an endpoint exists or reusing a generic state update endpoint through 'proposal'
        // For demonstration, we'll try a specific endpoint. 
        // If server logic is strictly "reload to next", this might need backend support.
        // We will try to send a specific 'intent' payload.
        const res = await fetch('/api/case/proposal/next-round-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, caseId, round: currentRound })
        });
        const data = await res.json();
        return data;
    }
};

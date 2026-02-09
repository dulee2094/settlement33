/**
 * Debugging Helper
 * Appends a small status panel to the bottom left
 */
window.updateDebugInfo = function (data) {
    let debugEl = document.getElementById('proposal-debug-panel');
    if (!debugEl) {
        debugEl = document.createElement('div');
        debugEl.id = 'proposal-debug-panel';
        debugEl.style.cssText = 'position:fixed; bottom:10px; left:10px; background:rgba(0,0,0,0.8); color:#0f0; padding:15px; font-size:12px; z-index:9999; border:1px solid #0f0; font-family:monospace; border-radius:8px;';
        document.body.appendChild(debugEl);
    }

    // Safety check for ProposalHandler state
    const handlerState = window.ProposalHandler ? window.ProposalHandler.currentState : 'Not Loaded';

    debugEl.innerHTML = `
        <div style="margin-bottom:5px; font-weight:bold; border-bottom:1px solid #333; padding-bottom:5px;">🔍 Debug Info</div>
        <div>Current Round: <span style="color:#fff">${data.currentRound}</span></div>
        <div>My Round: <span style="color:#fff">${data.myRound}</span></div>
        <div>Opp Round: <span style="color:#fff">${data.oppRound !== undefined ? data.oppRound : '?'}</span></div>
        <div>My Intent: <span style="color:${data.myNextRoundIntent ? '#4ade80' : '#ef4444'}">${data.myNextRoundIntent ? 'TRUE' : 'FALSE'}</span></div>
        <div>Opp Intent: <span style="color:${data.oppNextRoundIntent ? '#4ade80' : '#ef4444'}">${data.oppNextRoundIntent ? 'TRUE' : 'FALSE'}</span></div>
        <div style="margin-top:5px; border-top:1px solid #333; padding-top:5px;">State: <span style="color:#facc15">${handlerState}</span></div>
    `;
};

// Case Detail Page - Sidebar Menu Version
document.addEventListener('DOMContentLoaded', () => {
    const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    // 諛고룷 ???뺤떇 紐⑤뱶
    const DEMO_MODE = false;

    // Load case data
    loadCaseData();

    // Initialize menu
    initializeMenu();

    // Load default content or restored tab
    const savedTab = localStorage.getItem('active_tab_on_load');
    if (savedTab && window.activateMenu) {
        window.activateMenu(savedTab);
        localStorage.removeItem('active_tab_on_load');
    } else {
        loadContent('overview');
    }

    // Check for Toast Messages
    if (localStorage.getItem('show_draft_applied_msg') === 'true') {
        // Slight delay to allow UI to settle
        setTimeout(() => {
            alert("??AI媛 ?묒꽦??珥덉븞???곸슜?섏뿀?듬땲??\n?댁슜???뺤씤?섍퀬 [?붿옄??誘몃━蹂닿린 諛??꾩넚]??吏꾪뻾?댁＜?몄슂.");
        }, 500);
        localStorage.removeItem('show_draft_applied_msg');
    }

    function loadCaseData() {
        const caseNumber = localStorage.getItem('current_case_number');
        const myRole = localStorage.getItem('current_case_role');
        const status = localStorage.getItem('current_case_status');
        const counterparty = localStorage.getItem('current_counterparty');

        if (!caseNumber) {
            alert('?ш굔 ?뺣낫瑜?遺덈윭?????놁뒿?덈떎.');
            window.location.href = 'dashboard.html';
            return;
        }

        // Update headers
        document.getElementById('headerCaseNumber').textContent = caseNumber;
        document.getElementById('headerMyRole').textContent = getRoleText(myRole);
        document.getElementById('headerCounterparty').textContent = counterparty || '?????놁쓬';
        document.getElementById('headerStatus').textContent = getStatusText(status);

        // Update sidebar
        document.getElementById('sidebarCaseNumber').textContent = caseNumber;
        document.getElementById('sidebarCounterparty').textContent = counterparty || '?????놁쓬';
    }

    function getRoleText(role) {
        return role === 'offender' ? '?쇱쓽??(媛?댁옄)' : '?쇳빐??;
    }

    function getStatusText(status) {
        switch (status) {
            case 'connected': return '?곌껐 ?꾨즺';
            case 'pending': return '?섎씫 ?湲?;
            case 'invited': return '媛???湲?;
            default: return '?湲?以?;
        }
    }

    function initializeMenu() {
        const menuItems = document.querySelectorAll('.nav-item[data-menu]');

        // Define global function for external access (e.g. from Dashboard or Quick Actions)
        window.activateMenu = function (menuName) {
            const targetItem = document.querySelector(`.nav-item[data-menu="${menuName}"]`);
            if (targetItem) {
                // Update active state
                menuItems.forEach(mi => mi.classList.remove('active'));
                targetItem.classList.add('active');

                // Load content
                loadContent(menuName);

                // Scroll to top
                window.scrollTo(0, 0);
            }
        };

        menuItems.forEach(item => {
            item.addEventListener('click', () => {
                const menuName = item.dataset.menu;
                window.activateMenu(menuName);
            });
        });
    }

    function loadContent(menuName) {
        const contentArea = document.getElementById('contentArea');

        switch (menuName) {
            case 'overview':
                contentArea.innerHTML = getOverviewHTML();
                break;
            case 'proposal':
                contentArea.innerHTML = getProposalHTML();
                initializeProposal();
                break;
            case 'analysis':
                contentArea.innerHTML = getAnalysisHTML();
                setTimeout(() => initializeChart(), 100);
                break;
            case 'chat':
                contentArea.innerHTML = getChatHTML();
                initializeChat();
                break;
            case 'apology':
                contentArea.innerHTML = getApologyHTML();
                break;
            case 'agreement':
                contentArea.innerHTML = getAgreementHTML();
                break;
            case 'mediation':
                contentArea.innerHTML = getMediationHTML();
                break;
            case 'account':
                contentArea.innerHTML = getAccountInfoHTML();
                break;
        }
    }

    // HTML Templates
    function getOverviewHTML() {
        const caseNumber = localStorage.getItem('current_case_number');
        const myRole = localStorage.getItem('current_case_role');
        const status = localStorage.getItem('current_case_status');
        const counterparty = localStorage.getItem('current_counterparty');

        return `
            <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <!-- ?ш굔 ?뺣낫 -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-info-circle"></i> ?ш굔 ?뺣낫</h3>
                    <div style="display: flex; flex-direction: column; gap: 15px;">
                        <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: var(--text-muted);">?ш굔?뺣낫<br><span style="font-size: 0.8em">(?ш굔踰덊샇 ??</span></span>
                            <span style="font-weight: 600;">${caseNumber}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: var(--text-muted);">????븷</span>
                            <span style="font-weight: 600;">${getRoleText(myRole)}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: var(--text-muted);">?곷?諛?/span>
                            <span style="font-weight: 600;">${counterparty}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <span style="color: var(--text-muted);">?깅줉??/span>
                            <span style="font-weight: 600;">${localStorage.getItem('current_case_date') || '2024.01.01'}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span style="color: var(--text-muted);">?곌껐 ?곹깭</span>
                            <span style="font-weight: 600; color: var(--secondary);">${getStatusText(status)}</span>
                        </div>
                    </div>
                </div>

                <!-- 吏꾪뻾 ?꾪솴 -->
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-tasks"></i> 吏꾪뻾 ?꾪솴</h3>
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-check-circle" style="color: var(--secondary); font-size: 1.2rem;"></i>
                            <span>蹂몄씤 ?몄쬆 ?꾨즺</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="fas ${status === 'connected' ? 'fa-check-circle' : 'far fa-circle'}" style="color: ${status === 'connected' ? 'var(--secondary)' : 'var(--text-muted)'}; font-size: 1.2rem;"></i>
                            <span>?곷?諛??곌껐</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="far fa-circle" style="color: var(--text-muted); font-size: 1.2rem; opacity: 0.5;"></i>
                            <span style="opacity: 0.5;">?⑹쓽湲??묒긽</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="far fa-circle" style="color: var(--text-muted); font-size: 1.2rem; opacity: 0.5;"></i>
                            <span style="opacity: 0.5;">理쒖쥌 ?⑹쓽???묒꽦</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <i class="far fa-circle" style="color: var(--text-muted); font-size: 1.2rem; opacity: 0.5;"></i>
                            <span style="opacity: 0.5;">?먯뒪?щ줈 ?낃툑</span>
                        </div>
                    </div>
                </div>

                <!-- 鍮좊Ⅸ ?≪뀡 (Quick Actions) -->
                ${getQuickActionsHTML(myRole)}

                <!-- 理쒓렐 ?쒕룞 -->
                <div class="glass-card" style="grid-column: 1 / -1;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-history"></i> 理쒓렐 ?쒕룞</h3>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        <div style="display: flex; gap: 15px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                            <div style="color: var(--text-muted); font-size: 0.85rem; min-width: 80px;">諛⑷툑 ??/div>
                            <div><i class="fas fa-user-plus" style="color: var(--secondary); margin-right: 8px;"></i>?ш굔 ?곸꽭 ?섏씠吏???묒냽?덉뒿?덈떎</div>
                        </div>
                        <div style="display: flex; gap: 15px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                            <div style="color: var(--text-muted); font-size: 0.85rem; min-width: 80px;">10遺???/div>
                            <div><i class="fas fa-comment" style="color: #4A9EFF; margin-right: 8px;"></i>?곷?諛⑹씠 硫붿떆吏瑜??꾩넚?덉뒿?덈떎</div>
                        </div>
                        <div style="display: flex; gap: 15px; padding: 15px; background: rgba(255,255,255,0.03); border-radius: 8px;">
                            <div style="color: var(--text-muted); font-size: 0.85rem; min-width: 80px;">1?쒓컙 ??/div>
                            <div><i class="fas fa-hand-holding-usd" style="color: #FFB84D; margin-right: 8px;"></i>?⑹쓽湲??쒖븞???섏떊?덉뒿?덈떎</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function getQuickActionsHTML(role) {
        const status = localStorage.getItem('current_case_status');
        let requestClass = '';
        let requestText = '?⑹쓽?붿껌 蹂대궡湲?;

        if (status === 'connected' || status === 'negotiating') {
            requestClass = 'status-completed';
            requestText = '?⑹쓽?붿껌 蹂대궡湲?(?꾨즺)';
        } else if (status === 'pending' || status === 'invited') {
            requestClass = 'status-current';
            requestText = '?⑹쓽?붿껌 蹂대궡湲?(吏꾪뻾 以?';
        }

        if (role === 'offender') {
            return `
                <div class="glass-card" style="grid-column: 1 / -1;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-bolt"></i> 鍮좊Ⅸ ?≪뀡 (?쇱쓽?먯슜)</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        
                        <!-- Step 0: Send Settlement Request -->
                        <button class="btn btn-glass ${requestClass}" onclick="location.href='invite.html'">
                            <i class="fas fa-paper-plane" style="margin-right: 8px;"></i>
                            ${requestText}
                        </button>

                        <!-- Step 1: Apology (Completed) -->
                        <button class="btn btn-glass status-completed" onclick="activateMenu('apology')">
                            <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                            ?ш낵臾??묒꽦 (?꾨즺)
                        </button>

                        <!-- Step 2: Proposal (Current) -->
                        <button class="btn btn-glass status-current" onclick="activateMenu('proposal')">
                            <i class="fas fa-hand-holding-usd" style="margin-right: 8px;"></i>
                            ?⑹쓽湲??쒖븞 (吏꾪뻾 以?
                        </button>

                        <!-- Step 3: Account Info (Pending) -->
                        <button class="btn btn-glass status-pending" onclick="activateMenu('account')">
                            <i class="fas fa-university" style="margin-right: 8px;"></i>
                            怨꾩쥖 ?뺣낫 ?뺤씤
                        </button>

                        <!-- Step 4: Agreement (Pending) -->
                        <button class="btn btn-glass status-pending" onclick="activateMenu('agreement')">
                            <i class="fas fa-file-signature" style="margin-right: 8px;"></i>
                            ?⑹쓽???묒꽦
                        </button>
                    </div>
                </div>
            `;
        } else {
            // Victim
            return `
                <div class="glass-card" style="grid-column: 1 / -1;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-bolt"></i> 鍮좊Ⅸ ?≪뀡 (?쇳빐?먯슜)</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        
                        <!-- Step 0: Send Settlement Request -->
                        <button class="btn btn-glass ${requestClass}" onclick="location.href='invite.html'">
                            <i class="fas fa-paper-plane" style="margin-right: 8px;"></i>
                            ${requestText}
                        </button>

                        <!-- Step 1: Receive Apology (Completed/Received) -->
                        <button class="btn btn-glass status-completed" onclick="activateMenu('apology')">
                            <i class="fas fa-envelope-open-text" style="margin-right: 8px;"></i>
                            ?ш낵臾?諛쏄린 (?섏떊??
                        </button>

                        <!-- Step 2: Proposal (Current) -->
                        <button class="btn btn-glass status-current" onclick="activateMenu('proposal')">
                            <i class="fas fa-hand-holding-usd" style="margin-right: 8px;"></i>
                            ?⑹쓽湲??쒖븞 (吏꾪뻾 以?
                        </button>

                        <!-- Step 3: Provide Account Info (Pending) -->
                        <button class="btn btn-glass status-pending" onclick="activateMenu('account')">
                            <i class="fas fa-university" style="margin-right: 8px;"></i>
                            怨꾩쥖 ?뺣낫 二쇨린
                        </button>

                        <!-- Step 4: Agreement (Pending) -->
                        <button class="btn btn-glass status-pending" onclick="activateMenu('agreement')">
                            <i class="fas fa-file-signature" style="margin-right: 8px;"></i>
                            ?⑹쓽???묒꽦
                        </button>
                    </div>
                </div>
            `;
        }
    }

    function getProposalHTML() {
        return `
            <div class="dashboard-grid" style="grid-template-columns: 1fr 1fr; gap: 20px;">
                <!-- Left: My Proposal -->
                <div class="glass-card" style="height: 100%;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                        <h3>?섏쓽 ?щ쭩 湲덉븸</h3>
                        <span style="font-size: 0.8rem; padding: 4px 10px; background: rgba(255,255,255,0.1); border-radius: 12px;">鍮꾧났媛??덉쟾 蹂댁옣 <i class="fas fa-lock s"></i></span>
                    </div>

                    <div style="text-align: center; margin-bottom: 40px;">
                        <p style="color: var(--text-muted); margin-bottom: 10px;">?곷?諛⑹뿉寃?援ъ껜?곸씤 湲덉븸???몄텧?섏? ?딆뒿?덈떎.</p>
                        <div style="position: relative; max-width: 300px; margin: 0 auto;">
                            <!-- Unit Change: Won -> Man-won -->
                            <span style="position: absolute; right: 25px; top: 50%; transform: translateY(-50%); font-size: 1.2rem; color: var(--text-muted); font-weight: bold;">留뚯썝</span>
                            <input type="number" id="myAmount" class="form-input" style="padding-right: 70px; font-size: 1.5rem; font-weight: bold; text-align: center;" placeholder="0">
                        </div>
                        <p style="font-size: 0.8rem; color: #666; margin-top: 5px;">* ?? 300留뚯썝 ?낅젰 ??300留??낅젰</p>

                        <!-- Duration Selector -->
                        <div style="margin-top: 25px; text-align: left;">
                            <label style="font-size: 0.9rem; color: var(--text-muted); display: block; margin-bottom: 10px;">?쒖븞 ?좏슚 湲곌컙</label>
                            <div style="display: flex; gap: 10px;">
                                <label class="radio-chip">
                                    <input type="radio" name="proposalDuration" value="1" style="display: none;">
                                    <span style="padding: 8px 16px; border-radius: 20px; background: rgba(255,255,255,0.05); cursor: pointer; border: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem; transition: all 0.3s;">
                                        1??(24?쒓컙)
                                    </span>
                                </label>
                                <label class="radio-chip">
                                    <input type="radio" name="proposalDuration" value="3" style="display: none;">
                                    <span style="padding: 8px 16px; border-radius: 20px; background: rgba(255,255,255,0.05); cursor: pointer; border: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem; transition: all 0.3s;">
                                        3??
                                    </span>
                                </label>
                                <label class="radio-chip">
                                    <input type="radio" name="proposalDuration" value="7" checked style="display: none;">
                                    <span style="padding: 8px 16px; border-radius: 20px; background: rgba(255,255,255,0.05); cursor: pointer; border: 1px solid rgba(255,255,255,0.1); font-size: 0.9rem; transition: all 0.3s;">
                                        1二쇱씪
                                    </span>
                                </label>
                            </div>
                            <style>
                                .radio-chip input:checked + span {
                                    background: var(--primary);
                                    color: #000;
                                    font-weight: bold;
                                    border-color: var(--primary);
                                }
                            </style>
                        </div>
                    </div>

                    <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                        <h4 style="margin-bottom: 15px;"><i class="fas fa-balance-scale"></i> AI 遺꾩꽍 媛?대뱶</h4>
                        <ul style="font-size: 0.9rem; color: var(--text-muted); text-align: left; list-style: disc; padding-left: 20px;">
                            <li>?좎궗 ?먮? ?됯퇏: <strong>350留뚯썝 ~ 400留뚯썝</strong></li>
                            <li>?덈Т ??? 湲덉븸? ?곷?諛⑹쓽 嫄곕?媛먯쓣 ?좊컻?????덉뒿?덈떎.</li>
                        </ul>
                    </div>

                    <button class="btn btn-primary" id="btnSubmitProposal" style="width: 100%;" onclick="submitProposal()">?쒖븞 ?깅줉?섍린</button>
                </div>

                <!-- Right: Gap Analysis Result -->
                <div class="glass-card" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">

                    <div id="waitingState">
                        <div style="font-size: 4rem; color: var(--text-muted); margin-bottom: 20px; opacity: 0.3;">
                            <i class="fas fa-time"></i>
                        </div>
                        <h3>?곷?諛⑹쓽 ?쒖븞??湲곕떎由ш퀬 ?덉뒿?덈떎</h3>
                        <p style="color: var(--text-muted); margin-top: 10px;" id="waitingDesc">
                            ?ㅼ젙?섏떊 ?좏슚 湲곌컙 ?댁뿉 ?곷?諛⑹씠 ?묐떟?섏? ?딆쑝硫?br>
                            ?쒖븞? ?먮룞?쇰줈 留뚮즺?⑸땲??
                        </p>
                    </div>

                    <div id="resultState" style="display: none; width: 100%;">
                        <div style="margin-bottom: 30px;">
                            <span style="font-size: 0.9rem; color: var(--secondary);">遺꾩꽍 ?꾨즺</span>
                            <h2 style="font-size: 2rem; margin-top: 10px;" id="gapTitle">湲덉븸 李⑥씠媛 ?쎈땲??/h2>
                        </div>

                        <!-- Gauge Visual -->
                        <div style="width: 100%; height: 20px; background: rgba(255,255,255,0.1); border-radius: 10px; margin-bottom: 30px; position: relative;">
                            <div id="gapGauge" style="width: 80%; height: 100%; background: linear-gradient(90deg, #ff4d4d, #f9cb28); border-radius: 10px; transition: width 1s ease;"></div>
                            
                            <div style="position: absolute; left: 20%; top: 25px; font-size: 0.7rem; color: #aaa;">| 100留??대궡</div>
                            <div style="position: absolute; left: 50%; top: 25px; font-size: 0.7rem; color: #aaa;">| 500留??대궡</div>
                            <div style="position: absolute; left: 80%; top: 25px; font-size: 0.7rem; color: #aaa;">| 1000留??댁긽</div>
                        </div>

                        <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 30px;" id="gapDesc">
                            ?묒륫???섍껄 李⑥씠媛 <strong>500留뚯썝 ~ 1000留뚯썝</strong> ?ъ씠?낅땲??<br>
                            吏곸젒?곸씤 ??붾낫?ㅻ뒗 ?꾨Ц媛??以묒옱瑜?怨좊젮?대낫?쒕뒗 寃껋씠 醫뗭뒿?덈떎.
                        </p>
                        
                        <div id="actionButtons">
                            <button class="btn btn-glass" style="margin-right: 10px;">湲덉븸 ?섏젙 ?쒖븞</button>
                            <button class="btn btn-primary" style="background: linear-gradient(135deg, #FF6B6B, #FF8E53);">蹂?몄궗 以묒옱 ?좎껌</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Proposal History Section -->
            <div class="glass-card" style="margin-top: 20px;">
                <h3 style="margin-bottom: 20px;"><i class="fas fa-history"></i> ?쒖븞 ?덉뒪?좊━</h3>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; text-align: left;">
                        <thead>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1); color: var(--text-muted);">
                                <th style="padding: 15px; font-weight: 500;">?뚯감</th>
                                <th style="padding: 15px; font-weight: 500;">?쇱떆</th>
                                <th style="padding: 15px; font-weight: 500;">?섏쓽 ?쒖븞 (??</th>
                                <th style="padding: 15px; font-weight: 500;">遺꾩꽍 寃곌낵</th>
                            </tr>
                        </thead>
                        <tbody id="historyTableBody">
                            <tr>
                                <td colspan="4" style="padding: 30px; text-align: center; color: var(--text-muted);">
                                    ?꾩쭅 ?쒖븞 ?댁뿭???놁뒿?덈떎.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function getAnalysisHTML() {
        return `
            <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div class="glass-card">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-chart-line"></i> ?덉긽 ?⑹쓽湲?/h3>
                    <div style="text-align: center; padding: 20px;">
                        <div style="font-size: 2.5rem; font-weight: 700; color: var(--primary); margin-bottom: 10px;">??3,500,000</div>
                        <div style="color: var(--text-muted); margin-bottom: 20px;">AI 遺꾩꽍 ?됯퇏</div>
                        <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px;">
                            <span style="color: var(--text-muted);">踰붿쐞:</span>
                            <span style="font-weight: 600;">??2,000,000 ~ ??4,500,000</span>
                        </div>
                    </div>
                </div>

                <div class="glass-card" style="grid-column: 1 / -1;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-chart-bar"></i> ?좎궗 ?щ? 遺꾩꽍</h3>
                    <canvas id="analysisChart" style="max-height: 300px;"></canvas>
                    <p style="margin-top: 20px; color: var(--text-muted); font-size: 0.9rem; line-height: 1.6;">
                        * 洹?섏쓽 ?ш굔(??뻾, ?꾩튂 2二?怨??좎궗??理쒓렐 3???먮?瑜?遺꾩꽍?덉뒿?덈떎.<br>
                        * ?쇰컲?곸쑝濡?<span style="color: var(--text-main); font-weight: 600;">200留뚯썝 ~ 450留뚯썝</span> ?ъ씠?먯꽌 ?⑹쓽媛 ?대（?댁쭛?덈떎.
                    </p>
                </div>
            </div>
        `;
    }

    function getChatHTML() {
        const counterparty = localStorage.getItem('current_counterparty');
        const caseId = localStorage.getItem('current_case_id');
        const myRole = localStorage.getItem('current_case_role'); // 'offender' or 'victim'

        // Chat Status: 'none', 'requested', 'active', 'terminated'
        // For demo, we store who requested it: 'requested_by_offender' or 'requested_by_victim'
        let chatStatus = localStorage.getItem(`chat_status_${caseId}`) || 'none';

        // 1. Initial State (None)
        if (chatStatus === 'none') {
            return `
                <div class="glass-card" style="max-width: 600px; margin: 0 auto; text-align: center; padding: 40px;">
                    <div style="width: 80px; height: 80px; background: rgba(74, 222, 128, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                        <i class="fas fa-shield-alt" style="font-size: 2.5rem; color: #4ade80;"></i>
                    </div>
                    <h3 style="margin-bottom: 15px;">?덉떖 梨꾪똿 ?쒕퉬??/h3>
                    <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 30px;">
                        ?쇱쓽?먯? ?쇳빐?먭? 媛쒖씤 ?곕씫泥??몄텧 ?놁씠<br>
                        ?덉쟾?섍쾶 ??뷀븷 ???덈뒗 怨듦컙?낅땲??<br><br>
                        <span style="color: #4ade80; font-size: 0.9rem; background: rgba(74, 222, 128, 0.1); padding: 5px 10px; border-radius: 20px;">
                            <i class="fas fa-check"></i> ?곹샇 ?숈쓽 ?꾩닔
                        </span>
                        <span style="color: #ff6b6b; font-size: 0.9rem; background: rgba(255, 107, 107, 0.1); padding: 5px 10px; border-radius: 20px; margin-left: 5px;">
                            <i class="fas fa-times"></i> ?몄젣??以묐떒 媛??
                        </span>
                    </p>
                    
                    <div style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; margin-bottom: 30px; text-align: left; font-size: 0.9rem; color: #ddd;">
                        <strong><i class="fas fa-info-circle"></i> ?댁슜 ?덈궡</strong>
                        <ul style="padding-left: 20px; margin-top: 10px; color: var(--text-muted);">
                            <li>?덉떖 梨꾪똿? ?쒖そ???좎껌?섍퀬, ?곷?諛⑹씠 ?섎씫?댁빞 ?쒖옉?⑸땲??</li>
                            <li>???以?遺덊렪?⑥쓣 ?먮겮?쒕㈃ ?몄젣?좎? [梨꾪똿 醫낅즺]瑜??????덉뒿?덈떎.</li>
                            <li>?뺤꽕?대굹 ?묐컯??諛쒖뼵? AI ?꾪꽣留곸뿉 ?섑빐 ?쒖옱?????덉뒿?덈떎.</li>
                        </ul>
                    </div>

                    <button class="btn btn-primary" onclick="requestChat('${myRole}')" style="width: 100%; padding: 15px;">
                        <i class="fas fa-paper-plane"></i> ${counterparty}?섏뿉寃?梨꾪똿 ?붿껌?섍린
                    </button>
                </div>
            `;
        }

        // 2. Requested State
        if (chatStatus.startsWith('requested')) {
            const requester = chatStatus.split('_by_')[1]; // 'offender' or 'victim'

            // If I am the requester
            if (requester === myRole) {
                return `
                    <div class="glass-card" style="max-width: 500px; margin: 50px auto; text-align: center; padding: 40px;">
                        <div class="spinner-border" style="width: 3rem; height: 3rem; margin-bottom: 20px; color: var(--secondary);" role="status">
                            <span class="sr-only">Loading...</span>
                        </div>
                        <h3 style="margin-bottom: 15px;">?곷?諛⑹쓽 ?섎씫??湲곕떎由ш퀬 ?덉뒿?덈떎</h3>
                        <p style="color: var(--text-muted); margin-bottom: 30px;">
                            ${counterparty}?섏씠 梨꾪똿 ?붿껌???뺤씤?섍퀬 ?섎씫?섎㈃<br>
                            利됱떆 ??붾갑???대┰?덈떎.
                        </p>
                        <button class="btn btn-glass" onclick="cancelChatRequest()">
                            ?붿껌 痍⑥냼?섍린
                        </button>
                    </div>
                `;
            } else {
                // If I am the receiver
                return `
                    <div class="glass-card" style="max-width: 500px; margin: 50px auto; text-align: center; padding: 40px;">
                        <i class="fas fa-comment-dots" style="font-size: 3rem; color: var(--secondary); margin-bottom: 20px;"></i>
                        <h3 style="margin-bottom: 15px;">?덈줈??梨꾪똿 ?붿껌???꾩갑?덉뒿?덈떎</h3>
                        <p style="color: var(--text-muted); margin-bottom: 30px;">
                            ${counterparty}?섏씠 ??붾? ?붿껌?덉뒿?덈떎.<br>
                            ?섎씫?섏떆寃좎뒿?덇퉴? (?몄젣?좎? ??붾? 醫낅즺?????덉뒿?덈떎)
                        </p>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button class="btn btn-primary" onclick="acceptChat()" style="min-width: 120px;">?섎씫?섍린</button>
                            <button class="btn btn-glass" onclick="declineChat()" style="min-width: 120px; color: #ff6b6b; border-color: #ff6b6b;">嫄곗젅?섍린</button>
                        </div>
                    </div>
                `;
            }
        }

        // 3. Active Chat
        if (chatStatus === 'active') {
            return `
                <div class="glass-card" style="height: 650px; display: flex; flex-direction: column; position: relative; overflow: hidden;">
                    <!-- Chat Header -->
                    <div style="padding: 15px; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div style="width: 10px; height: 10px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 5px #4ade80;"></div>
                            <h3 style="margin: 0; font-size: 1.1rem;">${counterparty}</h3>
                        </div>
                        <button class="btn btn-glass" onclick="confirmEndChat()" style="font-size: 0.8rem; padding: 5px 12px; color: #ff6b6b; border-color: rgba(255, 107, 107, 0.3);">
                            <i class="fas fa-sign-out-alt"></i> ???醫낅즺
                        </button>
                    </div>

                    <!-- Safety Notice -->
                    <div style="background: rgba(255,165,0,0.1); padding: 8px; text-align: center; font-size: 0.8rem; color: orange;">
                        <i class="fas fa-shield-alt"></i> ?덉떖 梨꾪똿 以묒엯?덈떎. ?뺤꽕?대굹 鍮꾨갑? ?쇨?二쇱꽭??
                    </div>
                    
                    <!-- Messages Area -->
                    <div class="chat-messages" id="chatArea" style="flex: 1; overflow-y: auto; padding: 20px;">
                        <div class="system-msg">2024??1??3????붽? ?쒖옉?섏뿀?듬땲??</div>
                        <div class="system-msg">?쒕줈瑜?諛곕젮?섎ŉ ??뷀빐二쇱꽭?? ?몄젣???곷떒??'???醫낅즺' 踰꾪듉?쇰줈 以묐떒?????덉뒿?덈떎.</div>
                        <div class="message received">?덈뀞?섏꽭?? ????붿껌 ?섎씫?댁＜?붿꽌 媛먯궗?⑸땲??</div>
                        <div class="message sent">?? ?섍퀬 ?띠쑝??留먯???臾댁뾿?멸???</div>
                    </div>

                    <!-- Input Area -->
                    <div class="message-input-area" style="padding: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; gap: 10px;">
                            <input type="text" id="chatInput" style="flex: 1; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: white; outline: none; padding: 12px; border-radius: 8px;" placeholder="硫붿떆吏瑜??낅젰?섏꽭??.." onkeypress="handleChatEnter(event)">
                            <button class="btn btn-primary" onclick="sendChatMessage()">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        // 4. Terminated State
        if (chatStatus === 'terminated') {
            return `
                <div class="glass-card" style="max-width: 500px; margin: 50px auto; text-align: center; padding: 40px;">
                    <div style="width: 80px; height: 80px; background: rgba(255, 107, 107, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                        <i class="fas fa-slash" style="font-size: 2.5rem; color: #ff6b6b;"></i>
                    </div>
                    <h3 style="margin-bottom: 15px;">??붽? 醫낅즺?섏뿀?듬땲??/h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">
                        ??붾갑???ロ삍?듬땲??<br>
                        ?ㅼ떆 ??뷀븯?ㅻ㈃ ?덈줈???붿껌???꾩슂?⑸땲??
                    </p>
                    <button class="btn btn-glass" onclick="resetChat()" style="margin-right: 10px;">
                        硫붿씤?쇰줈 ?뚯븘媛湲?
                    </button>
                    <button class="btn btn-primary" onclick="requestChat('${myRole}')">
                        ?ㅼ떆 ?붿껌?섍린
                    </button>
                </div>
            `;
        }
    }

    // --- Chat Logic Functions ---

    window.requestChat = function (role) {
        const caseId = localStorage.getItem('current_case_id');
        localStorage.setItem(`chat_status_${caseId}`, `requested_by_${role}`);
        refreshChatView();
    };

    window.cancelChatRequest = function () {
        const caseId = localStorage.getItem('current_case_id');
        localStorage.setItem(`chat_status_${caseId}`, 'none');
        refreshChatView();
    };

    window.acceptChat = function () {
        const caseId = localStorage.getItem('current_case_id');
        localStorage.setItem(`chat_status_${caseId}`, 'active');
        refreshChatView();
    };

    window.declineChat = function () {
        if (confirm('梨꾪똿 ?붿껌??嫄곗젅?섏떆寃좎뒿?덇퉴?')) {
            const caseId = localStorage.getItem('current_case_id');
            localStorage.setItem(`chat_status_${caseId}`, 'none'); // Just reset to none for demo
            refreshChatView();
        }
    };

    window.confirmEndChat = function () {
        if (confirm('?뺣쭚濡???붾? 醫낅즺?섏떆寃좎뒿?덇퉴? ?곷?諛⑷낵???곌껐???딆뼱吏묐땲??')) {
            const caseId = localStorage.getItem('current_case_id');
            localStorage.setItem(`chat_status_${caseId}`, 'terminated');
            refreshChatView();
        }
    };

    window.resetChat = function () {
        const caseId = localStorage.getItem('current_case_id');
        localStorage.setItem(`chat_status_${caseId}`, 'none');
        refreshChatView();
    };

    window.handleChatEnter = function (e) {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    };

    function refreshChatView() {
        // Find the active tab and reload if it's chat
        const activeTab = document.querySelector('.sidebar-item.active');
        if (activeTab && activeTab.textContent.includes('?덉떖 梨꾪똿')) {
            activateMenu('chat');
        }
    }

    function getApologyHTML() {
        const myRole = localStorage.getItem('current_case_role');

        if (myRole === 'offender') {
            return `
                <div class="glass-card" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 60px 20px;">
                    <div style="width: 80px; height: 80px; background: rgba(74, 222, 128, 0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 25px;">
                        <i class="fas fa-feather-alt" style="font-size: 2.5rem; color: var(--secondary);"></i>
                    </div>
                    
                    <h2 style="margin-bottom: 15px;">?ш낵臾??묒꽦 ?ㅽ뒠?붿삤</h2>
                    <p style="color: var(--text-muted); margin-bottom: 40px; font-size: 1.05rem; line-height: 1.6; max-width: 500px; margin-left: auto; margin-right: auto;">
                        吏꾩떖???댁? ?ш낵臾몄? ?쇳빐?먯쓽 留덉쓬???吏곸씠??媛?????섏엯?덈떎.<br>
                        ?꾩슜 ?먮뵒?곗뿉??AI???꾩???諛쏆븘 吏꾩젙???덈뒗 ?ш낵臾몄쓣 ?묒꽦?대낫?몄슂.
                    </p>
                    
                    <button class="btn btn-primary" onclick="location.href='apology_write.html'" 
                        style="padding: 18px 40px; font-size: 1.1rem; border-radius: 50px; box-shadow: 0 10px 30px rgba(74, 222, 128, 0.3); transition: all 0.3s ease;">
                        <i class="fas fa-pen-nib" style="margin-right: 10px;"></i> ?ш낵臾??묒꽦?섎윭 媛湲?
                    </button>

                    <div style="margin-top: 40px; display: flex; gap: 20px; justify-content: center; color: var(--text-muted); font-size: 0.9rem;">
                        <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-magic"></i> AI 珥덉븞 ?앹꽦</span>
                        <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-palette"></i> ?ㅼ뼇???몄?吏</span>
                        <span style="display: flex; align-items: center; gap: 5px;"><i class="fas fa-eye"></i> 誘몃━蹂닿린 ?쒓났</span>
                    </div>
                </div>
            `;
        } else {
            // Victim View
            return `
                <div class="glass-card" style="max-width: 800px; margin: 0 auto;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-envelope-open-text"></i> ?꾩갑???ш낵臾?/h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">?쇱쓽?먮줈遺???꾩갑???ш낵臾몄엯?덈떎.</p>

                    <div style="background: rgba(255,255,255,0.03); padding: 30px; border-radius: 12px; margin-bottom: 20px; line-height: 1.8;">
                        <p>?뺣쭚 二꾩넚?⑸땲??<br><br>
                        ?쒓컙???섎せ???먮떒?쇰줈 ?좎깮?섍퍡 ???쇳빐瑜??낇엺 ?? 源딆씠 諛섏꽦?섍퀬 ?덉뒿?덈떎. 
                        ?낆씠 ??媛쒕씪????留먯씠 ?놁?留? ?대젃寃?湲濡쒕굹留??ъ즲??留먯????쒕┰?덈떎.
                        <br><br>
                        臾댁뾿蹂대떎 ?좎깮?섍퍡??寃れ쑝?⑥쓣 ?뺤떊?? ?≪껜??怨좏넻???앷컖?섎㈃ 留덉쓬??臾닿쾪?듬땲??
                        ?욎쑝濡??ㅼ떆???대윴 ?쇱씠 ?녿룄濡?二쇱쓽?섍퀬 ??二쇱쓽?섍쿋?듬땲??
                        <br><br>
                        遺???덇렇?ъ슫 留덉쓬?쇰줈 ?⑹꽌??二쇱떆湲곕? 媛꾩껌 ?쒕┰?덈떎.
                        <br><br>
                        二꾩넚?⑸땲??
                        </p>
                    </div>
                    
                    <div style="display: flex; justify-content: flex-end;">
                        <span style="font-size: 0.85rem; color: var(--text-muted);">2024??1??3???섏떊??/span>
                    </div>
                </div>
            `;
        }
    }

    function getAgreementHTML() {
        return `
            <div class="glass-card" style="max-width: 800px; margin: 0 auto; text-align: center; padding: 60px 40px;">
                <i class="fas fa-file-contract" style="font-size: 4rem; color: var(--text-muted); margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 15px;">?⑹쓽???묒꽦</h3>
                <p style="color: var(--text-muted); margin-bottom: 30px;">?⑹쓽湲??묒긽???꾨즺?섎㈃ ?⑹쓽?쒕? ?묒꽦?????덉뒿?덈떎.</p>
                <button class="btn btn-primary" onclick="location.href='agreement.html'">
                    <i class="fas fa-plus"></i> ?⑹쓽???묒꽦 ?쒖옉?섍린
                </button>
            </div>
        `;
    }

    function getAccountInfoHTML() {
        const myRole = localStorage.getItem('current_case_role');

        if (myRole === 'victim') {
            return `
                <div class="glass-card" style="max-width: 600px; margin: 0 auto;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-university"></i> ??怨꾩쥖 ?뺣낫 ?깅줉</h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">
                        ?⑹쓽湲덉쓣 ?섎졊?섏떎 蹂몄씤 紐낆쓽??怨꾩쥖 ?뺣낫瑜??낅젰?댁＜?몄슂.<br>
                        ?낅젰?섏떊 怨꾩쥖 ?뺣낫??<strong>?⑹쓽湲??낃툑???꾪빐 ?쇱쓽?먯뿉寃?吏곸젒 怨듦컻</strong>?⑸땲??
                    </p>

                    <div class="form-group">
                        <label class="form-label">????좏깮</label>
                        <select class="form-input" style="background: rgba(255,255,255,0.05); color: white;">
                            <option>援?????/option>
                            <option>?좏븳???/option>
                            <option>?곕━???/option>
                            <option>?섎굹???/option>
                            <option>移댁뭅?ㅻ콉??/option>
                            <option>?좎뒪諭낇겕</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">怨꾩쥖 踰덊샇</label>
                        <input type="text" class="form-input" placeholder="'-' ?놁씠 ?낅젰?섏꽭??>
                    </div>
                    <div class="form-group">
                        <label class="form-label">?덇툑二?/label>
                        <input type="text" class="form-input" placeholder="蹂몄씤 ?ㅻ챸">
                    </div>

                    <div style="margin-top: 30px; padding: 15px; background: rgba(255,165,0,0.1); border-radius: 8px; border-left: 4px solid orange;">
                        <h4 style="margin-bottom: 5px; color: orange;">?좑툘 二쇱쓽?ы빆</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">
                            ?뺥솗??怨꾩쥖 ?뺣낫瑜??낅젰?댁＜?몄슂. ?ㅺ린?낆쑝濡??명븳 ?↔툑 ?ш퀬 ??梨낆엫? 蹂몄씤?먭쾶 ?덉뒿?덈떎.<br>
                            ?뺣낫 ?깅줉 ???곷?諛⑹씠 利됱떆 ?뺤씤?????덉뒿?덈떎.
                        </p>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button class="btn btn-primary" style="width: 100%;"><i class="fas fa-check"></i> 怨꾩쥖 ?뺣낫 ?깅줉 諛?怨듦컻</button>
                    </div>
                </div>
            `;
        } else {
            // Offender View
            return `
                <div class="glass-card" style="max-width: 600px; margin: 0 auto;">
                    <h3 style="margin-bottom: 20px;"><i class="fas fa-university"></i> ?↔툑 ???怨꾩쥖 ?뺣낫</h3>
                    <p style="color: var(--text-muted); margin-bottom: 30px;">
                        ?쇳빐?먭? ?깅줉??怨꾩쥖 ?뺣낫?낅땲??<br>
                        ?꾨옒 怨꾩쥖濡??⑹쓽湲덉쓣 ?낃툑?섏떊 ??[?낃툑 ?꾨즺 ?뚮┝]???뚮윭二쇱꽭??
                    </p>
                    
                    <div style="padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; margin-bottom: 20px;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">?낃툑???/ 怨꾩쥖踰덊샇</div>
                        <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 15px;">
                            移댁뭅?ㅻ콉??3333-XXXX-XXXX
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 5px;">?덇툑二?/div>
                        <div style="font-size: 1.1rem;">?띻만??(?쇳빐??</div>
                    </div>

                    <div style="margin-top: 20px; padding: 15px; background: rgba(74, 222, 128, 0.1); border-radius: 8px; border-left: 4px solid #4ade80;">
                        <h4 style="margin-bottom: 5px; color: #4ade80;">???⑹쓽湲??뺤젙 ?꾨즺</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted);">
                            ?낃툑?섏뀛????湲덉븸: <strong>3,500,000??/strong>
                        </p>
                    </div>

                    <button class="btn btn-primary" style="width: 100%; margin-top: 20px;" onclick="alert('?곷?諛⑹뿉寃??낃툑 ?꾨즺 ?뚮┝??蹂대깉?듬땲??');">
                        <i class="fas fa-paper-plane"></i> ?낃툑 ?꾨즺 ?뚮┝ 蹂대궡湲?
                    </button>
                </div>
            `;
        }
    }

    function getMediationHTML() {
        return `
            <div class="glass-card" style="max-width: 800px; margin: 0 auto;">
                <h3 style="margin-bottom: 20px;"><i class="fas fa-gavel"></i> 蹂?몄궗 ?곷떞 ?좎껌</h3>
                <p style="color: var(--text-muted); line-height: 1.6; margin-bottom: 30px;">
                    ?⑹쓽媛 ?먮쭔?섏? ?딄굅?? 踰뺤쟻?쇰줈 媛뺣젰????묒씠 ?꾩슂?섏떊媛??<br>
                    <strong>?쒖슱以묒븰吏寃 遺?κ???異쒖떊</strong> ?뺤궗 ?꾨Ц 蹂?몄궗媛 吏곸젒 ?닿껐梨낆쓣 ?쒖떆?⑸땲??
                </p>

                <!-- Lawyer Profile Section -->
                <div style="background: rgba(255,255,255,0.05); padding: 25px; border-radius: 12px; margin-bottom: 30px;">
                    <div style="display: flex; align-items: flex-start; gap: 20px;">
                        <img src="images/lawyer_profile.png" alt="?대룞??蹂?몄궗" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 2px solid var(--secondary); flex-shrink: 0;">
                        <div>
                            <h4 style="margin-bottom: 8px; font-size: 1.3rem;">
                                ?대룞??蹂?몄궗
                                <span style="font-size: 0.8rem; background: linear-gradient(135deg, #4ade80, #22c55e); color: #000; padding: 3px 8px; border-radius: 12px; vertical-align: middle; margin-left: 8px; font-weight: 700; box-shadow: 0 2px 5px rgba(74, 222, 128, 0.3);">?뺤궗?ш굔 ?꾨Ц媛</span>
                            </h4>
                            <p style="color: var(--secondary); font-weight: 600; font-size: 0.95rem; margin-bottom: 8px;">踰뺣쪧?щТ???명뵾?덊떚 ??쒕??몄궗</p>
                            <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.6;">
                                <span>???쒖슱以묒븰吏諛⑷?李곗껌 遺?κ???/span><br>
                                <span>???寃李곗껌 寃李곗뿰援ш?</span><br>
                                <span>??踰뺣Т遺 援?젣?뺤궗怨쇱옣</span>
                            </div>
                            <button onclick="toggleCareer()" class="btn btn-glass" style="margin-top: 15px; font-size: 0.8rem; padding: 5px 10px;">
                                <i class="fas fa-chevron-down"></i> ?곸꽭 ?쎈젰 ?붾낫湲?
                            </button>
                        </div>
                    </div>

                    <!-- Hidden Detailed Career -->
                    <div id="lawyerDetailProfile" style="display: none; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; font-size: 0.85rem; color: #ddd;">
                            <div>
                                <h5 style="color: var(--secondary); margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">?숇젰</h5>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>1995</span><span>?ъ닔怨좊벑?숆탳 議몄뾽</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2000</span><span>?쒖슱??숆탳 ?뺤튂?숆낵 議몄뾽</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px;"><span>2012</span><span>誘멸뎅 UC Davis LL.M.</span></div>
                            </div>
                            <div>
                                <h5 style="color: var(--secondary); margin-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 5px;">二쇱슂 寃쎈젰</h5>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2000</span><span>??2???щ쾿?쒗뿕 ?⑷꺽</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2003</span><span>?щ쾿?곗닔???섎즺(??2湲?</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2006</span><span>?쒖슱?⑤?吏諛⑷?李곗껌 寃??/span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2013</span><span>?쒖슱以묒븰吏諛⑷?李곗껌 寃??/span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2016</span><span>?寃李곗껌 寃李곗뿰援ш?</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2019</span><span>踰뺣Т遺 援?젣?뺤궗怨쇱옣</span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2020</span><span>?쒖슱以묒븰吏諛⑷?李곗껌 ?뺤궗5遺??/span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px; margin-bottom: 5px;"><span>2022</span><span>??꾩?諛⑷?李곗껌 ?멸텒蹂댄샇遺??/span></div>
                                <div style="display: grid; grid-template-columns: 60px 1fr; gap: 5px;"><span>2023</span><span>踰뺣쪧?щТ???명뵾?덊떚 蹂?몄궗</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="dashboard-grid" style="grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px;">
                    <div style="background: rgba(255,255,255,0.03); padding: 25px; border-radius: 12px; text-align: center;">
                        <div style="width: 50px; height: 50px; background: rgba(74, 158, 255, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                            <i class="fas fa-comment-medical" style="color: #4A9EFF; font-size: 1.2rem;"></i>
                        </div>
                        <h4 style="margin-bottom: 10px;">踰뺣쪧 ?먮Ц</h4>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">?꾩옱 ?곹솴?????媛앷??곸씤<br>踰뺣쪧???먮떒怨?議곗뼵</p>
                    </div>
                    <div style="background: rgba(255,255,255,0.03); padding: 25px; border-radius: 12px; text-align: center;">
                        <div style="width: 50px; height: 50px; background: rgba(255, 184, 77, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                            <i class="fas fa-balance-scale" style="color: #FFB84D; font-size: 1.2rem;"></i>
                        </div>
                        <h4 style="margin-bottom: 10px;">踰뺣쪧?由ъ씤 ?좎엫</h4>
                        <p style="font-size: 0.9rem; color: var(--text-muted);">蹂?몄궗媛 吏곸젒 ?뺤떇 踰뺤쟻 ????ㅽ뻾<br><span style="font-size: 0.8rem; color: #888;">(?뺤궗怨좎냼, ?쇱쓽??蹂濡???</span></p>
                    </div>
                </div>

                <div class="form-group" style="text-align: left;">
                    <label class="form-label">?ш굔 ?댁슜 (媛꾨왂 ?ㅻ챸)</label>
                    <textarea class="form-input" rows="3" placeholder="?대뼡 ?ш굔?몄? 媛꾨왂?섍쾶 ?ㅻ챸?댁＜?몄슂 (?? ??뻾 ?쒕퉬, ?ш린 ?쇳빐 ??"></textarea>
                </div>

                <div class="form-group" style="text-align: left;">
                    <label class="form-label">?곷떞 ?붿껌 ?댁슜</label>
                    <textarea class="form-input" rows="5" placeholder="蹂?몄궗?섍퍡 沅곴툑???먯씠???꾩?諛쏄퀬 ?띠? ?댁슜???곸뼱二쇱꽭??"></textarea>
                </div>

                <div class="form-group" style="text-align: left;">
                    <label class="form-label">?곕씫諛쏆쓣 ?꾪솕踰덊샇</label>
                    <input type="tel" class="form-input" placeholder="010-0000-0000">
                </div>

                <button class="btn btn-primary" style="width: 100%; padding: 15px;" onclick="alert('蹂?몄궗 ?곷떞 ?좎껌???묒닔?섏뿀?듬땲?? ?대떦 蹂?몄궗媛 ?뺤씤 ???곕씫?쒕━寃좎뒿?덈떎. (?곕え)');">
                    <i class="fas fa-paper-plane"></i> 蹂?몄궗 ?곷떞 ?좎껌?섍린
                </button>
            </div>
        `;
    }

    // Toggle Career Details Function
    window.toggleCareer = function () {
        const detail = document.getElementById('lawyerDetailProfile');
        if (detail.style.display === 'none') {
            detail.style.display = 'block';
        } else {
            detail.style.display = 'none';
        }
    };

    // Initialize functions
    function initializeProposal() {
        // Init state for history and count
        // Using window or closure scope if needed, but here closure is fine as long as submitProposal is attached to window inside
        let proposalHistory = [];
        let proposalCount = 0;

        window.submitProposal = function () {
            const rawInput = parseInt(document.getElementById('myAmount').value);
            if (!rawInput) return alert('?щ쭩 湲덉븸???낅젰?댁＜?몄슂.');

            // Get selected duration
            const durationRadios = document.getElementsByName('proposalDuration');
            let durationDays = 7;
            for (const radio of durationRadios) {
                if (radio.checked) {
                    durationDays = parseInt(radio.value);
                    break;
                }
            }

            // Convert Man-won to Won
            const myAmount = rawInput * 10000;

            const btn = document.getElementById('btnSubmitProposal');
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 遺꾩꽍以?..';
            btn.disabled = true;

            // Simulate Server Delay and Victim's Hidden Amount
            setTimeout(() => {
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + durationDays);
                const expiryString = `${expiryDate.getFullYear()}.${expiryDate.getMonth() + 1}.${expiryDate.getDate()}`;

                document.getElementById('waitingDesc').innerHTML = `
                    ???쒖븞? <strong>${expiryString}</strong>??留뚮즺?⑸땲??<br>
                    湲곌컙 ?댁뿉 ?곷?諛⑹씠 ?쒖븞?섏? ?딆쑝硫??먮룞?쇰줈 痍⑥냼?⑸땲??
                `;
                const victimAmount = 8000000; // Victim wants 800 Man-won

                // Logic Update: Check for Over-offer
                let isOverOffer = false;
                if (myAmount >= victimAmount) {
                    isOverOffer = true;
                }

                const diff = Math.abs(victimAmount - myAmount);
                const average = (victimAmount + myAmount) / 2;
                let gapPercent = (diff / average) * 100;

                // Exception for small amounts
                if (diff <= 500000) gapPercent = 0;
                if (isOverOffer) gapPercent = 0;

                document.getElementById('waitingState').style.display = 'none';
                document.getElementById('resultState').style.display = 'block';

                const gapTitle = document.getElementById('gapTitle');
                const gapDesc = document.getElementById('gapDesc');
                const gapGauge = document.getElementById('gapGauge');
                const actionButtons = document.getElementById('actionButtons');

                let level = 0;
                let color = '';
                let title = '';
                let desc = '';
                let width = '';
                let badgeText = '';

                if (gapPercent <= 10) {
                    level = 1;
                    color = '#4ade80';
                    if (isOverOffer) {
                        title = "利됱떆 ?⑹쓽媛 媛?ν빀?덈떎!";
                        desc = `?쒖븞?섏떊 湲덉븸???곷?諛⑹쓽 湲곕?移섎? 異⑹”?⑸땲??<br>吏湲?諛붾줈 ?⑹쓽瑜?吏꾪뻾?섏뀛??醫뗭뒿?덈떎.`;
                    } else {
                        title = "異뺥븯?⑸땲?? ?⑹쓽 ?깆궗 吏곸쟾?낅땲??;
                        desc = `?묒륫???쒖븞 湲덉븸 李⑥씠媛 <strong>10% ?대궡</strong>(??${diff.toLocaleString()}???낅땲??<br>?ъ떎???⑹쓽媛 ?깆궗???곹깭?낅땲??`;
                    }
                    width = '98%';
                    badgeText = '?깆궗 ?뺤떎';
                    actionButtons.innerHTML = '<button class="btn btn-primary" style="background: #4ade80; color: #000;">吏湲?諛붾줈 ?⑹쓽?섍린</button>';
                } else if (gapPercent <= 30) {
                    level = 2;
                    color = '#3b82f6';
                    title = "湲띿젙??議곗쑉 ?④퀎?낅땲??;
                    desc = `?쒕줈???섍껄 李⑥씠媛 <strong>?ъ? ?딆뒿?덈떎.</strong><br>?덉떖 梨꾪똿???듯빐 援ъ껜?곸씤 ?ъ젙???ㅻ챸?섎㈃ 異⑸텇??媛꾧레??醫곹옄 ???덉뒿?덈떎.`;
                    width = '75%';
                    badgeText = '議곗쑉 媛??;
                    actionButtons.innerHTML = '<button class="btn btn-glass" style="margin-right: 10px;">?섏젙 ?쒖븞?섍린</button><button class="btn btn-primary">?덉떖 梨꾪똿諛??닿린</button>';
                } else if (gapPercent <= 60) {
                    level = 3;
                    color = '#facc15';
                    title = "議곗쑉?????꾩슂??蹂댁엯?덈떎";
                    desc = `?쒓컖 李⑥씠媛 ?ㅼ냼 ?쎈땲?? 媛쒖씤 媛꾩쓽 ??붾낫?ㅻ뒗 ?덉떖 梨꾪똿???듯빐<br>?곷?諛⑹쓽 ?낆옣??議곌툑 ???ㅼ뼱蹂대뒗 寃껋씠 醫뗭뒿?덈떎.`;
                    width = '50%';
                    badgeText = '異붽? 議곗쑉';
                    actionButtons.innerHTML = '<button class="btn btn-glass" style="margin-right: 10px;">?섏젙 ?쒖븞?섍린</button><button class="btn btn-primary">?덉떖 梨꾪똿諛??닿린</button>';
                } else if (gapPercent <= 100) {
                    level = 4;
                    color = '#fb923c';
                    title = "?낆옣 李⑥씠媛 留ㅼ슦 ?쎈땲??;
                    desc = `?꾩옱 ?곹깭濡쒕뒗 ?⑹쓽媛 ?대졄?듬땲?? ?곷?諛⑹? 洹?섏? <strong>?꾪? ?ㅻⅨ 湲곗?</strong>??媛吏怨??덉뒿?덈떎.<br>?좎떆 ?됯컖湲곕? 媛吏??寃껋쓣 異붿쿇?⑸땲??`;
                    width = '25%';
                    badgeText = '?ш컖??寃⑹감';
                    actionButtons.innerHTML = '<button class="btn btn-glass">?쒖븞 蹂대쪟?섍린</button>';
                } else {
                    level = 5;
                    color = '#ef4444';
                    title = "?⑹쓽???꾩텧??遺덇??ν빐 蹂댁엯?덈떎";
                    desc = `媛꾧레???덈Т ?쎈땲??(100% ?댁긽 李⑥씠).<br>?ъ떎??寃곕젹 ?곹깭?낅땲?? 臾대━???⑹쓽 ?쒕룄蹂대떎???좎떆 ?곹솴??吏耳쒕낫??寃껋씠 醫뗭뒿?덈떎.`;
                    width = '10%';
                    badgeText = '寃곕젹 ?꾧린';
                    actionButtons.innerHTML = '<button class="btn btn-glass" style="margin-right: 10px;">?섏젙 ?쒖븞?섍린</button><button class="btn btn-primary" style="background: #ef4444;">?뺤궗 ?덉감 ?덈궡</button>';
                }

                gapTitle.textContent = title;
                gapDesc.innerHTML = desc;
                gapGauge.style.width = width;
                gapGauge.style.background = color;
                gapGauge.style.boxShadow = `0 0 20px ${color}`;

                // Range Hint Logic
                const minRange = Math.floor(victimAmount * 0.8 / 10000) * 10000;
                const maxRange = Math.ceil(victimAmount * 1.2 / 10000) * 10000;
                let rangeElement = document.getElementById('rangeHintBox');
                if (!rangeElement) {
                    rangeElement = document.createElement('div');
                    rangeElement.id = 'rangeHintBox';
                    rangeElement.style.marginTop = '20px';
                    rangeElement.style.padding = '15px';
                    rangeElement.style.background = 'rgba(255,255,255,0.05)';
                    rangeElement.style.borderRadius = '8px';
                    document.getElementById('resultState').insertBefore(rangeElement, actionButtons);
                }
                rangeElement.innerHTML = `
                    <div style="font-size: 0.85rem; color: #aaa; margin-bottom: 5px;">?곷?諛??쒖븞 ?덉긽 踰붿쐞</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: #fff; filter: blur(${level >= 4 ? '5px' : '0px'}); transition: filter 0.5s;">
                        ${minRange.toLocaleString()}??~ ${maxRange.toLocaleString()}??
                    </div>
                     ${level >= 4 ? '<div style="font-size:0.7rem; color:#ef4444; margin-top:5px;">寃⑹감媛 ?덈Т 而ㅼ꽌 踰붿쐞議곗감 ?먮┸?⑸땲??</div>' : ''}
                `;

                // Add to History
                proposalCount++;
                const now = new Date();
                const timeString = `${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

                const historyItem = {
                    round: proposalCount,
                    time: timeString,
                    amount: myAmount,
                    result: badgeText,
                    color: color
                };

                proposalHistory.unshift(historyItem);

                // Update History Table
                const tbody = document.getElementById('historyTableBody');
                if (proposalHistory.length > 0) {
                    tbody.innerHTML = proposalHistory.map(item => `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                            <td style="padding: 15px;">${item.round}李?/td>
                            <td style="padding: 15px; color: var(--text-muted); font-size: 0.9rem;">${item.time}</td>
                            <td style="padding: 15px; font-weight: bold;">${item.amount.toLocaleString()}</td>
                            <td style="padding: 15px;">
                                <span style="font-size: 0.8rem; padding: 4px 10px; border-radius: 12px; border: 1px solid ${item.color}; color: ${item.color}; background: rgba(255,255,255,0.05);">
                                    ${item.result}
                                </span>
                            </td>
                        </tr>
                    `).join('');
                }

                btn.innerHTML = '?섏젙 ?쒖븞?섍린';
                btn.disabled = false;
                btn.classList.add('btn-glass');
                btn.classList.remove('btn-primary');
            }, 1000);
        };
    }

    function initializeChart() {
        const ctx = document.getElementById('analysisChart');
        if (!ctx) return;

        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(100, 100, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(100, 100, 255, 0.05)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['?좎궗?щ? 1', '?좎궗?щ? 2', '?좎궗?щ? 3', '?좎궗?щ? 4', '?좎궗?щ? 5', '?좎궗?щ? 6'],
                datasets: [{
                    label: '?⑹쓽湲?遺꾪룷 (?⑥쐞: 留뚯썝)',
                    data: [200, 250, 300, 280, 400, 350],
                    backgroundColor: gradient,
                    borderColor: '#5865F2',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' } },
                    x: { grid: { display: false }, ticks: { color: '#aaa' } }
                }
            }
        });
    }

    function initializeChat() {
        window.sendChatMessage = function () {
            const input = document.getElementById('chatInput');
            const message = input.value.trim();

            if (!message) return;

            const chatArea = document.getElementById('chatArea');
            const msgDiv = document.createElement('div');
            msgDiv.className = 'message sent';
            msgDiv.textContent = message;
            chatArea.appendChild(msgDiv);

            input.value = '';
            chatArea.scrollTop = chatArea.scrollHeight;

            setTimeout(() => {
                const replyDiv = document.createElement('div');
                replyDiv.className = 'message received';
                replyDiv.textContent = '?? ?뺤씤?덉뒿?덈떎. 寃?????듬? ?쒕━寃좎뒿?덈떎.';
                chatArea.appendChild(replyDiv);
                chatArea.scrollTop = chatArea.scrollHeight;
            }, 1500);
        };

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendChatMessage();
        });
    }

    // Expose navigation function globally for Quick Action buttons - ALREADY DEFINED IN initializeMenu
    // window.activateMenu removed to prevent recursion


    // Invite Kakao Function
    window.inviteKakao = function () {
        alert("?곷?諛⑹뿉寃?移댁뭅?ㅽ넚?쇰줈 珥덈? 硫붿떆吏瑜?諛쒖넚?⑸땲?? (?곕え)");
    };
});

// File Upload Helper Functions
window.handleFileSelect = function (input) {
    const fileNameSpan = document.getElementById('fileName');
    const cancelBtn = document.getElementById('fileCancelBtn');

    if (input.files && input.files.length > 0) {
        fileNameSpan.textContent = input.files[0].name;
        fileNameSpan.style.color = 'var(--text-main)';
        cancelBtn.style.display = 'block';
    } else {
        fileNameSpan.textContent = '?좏깮???뚯씪 ?놁쓬';
        fileNameSpan.style.color = 'var(--text-muted)';
        cancelBtn.style.display = 'none';
    }
};

window.cancelFileSelection = function () {
    const input = document.getElementById('apologyFile');
    const fileNameSpan = document.getElementById('fileName');
    const cancelBtn = document.getElementById('fileCancelBtn');

    input.value = ''; // Clear input
    fileNameSpan.textContent = '?좏깮???뚯씪 ?놁쓬';
    fileNameSpan.style.color = 'var(--text-muted)';
    cancelBtn.style.display = 'none';
};

window.sendApology = function () {
    const content = document.getElementById('apologyContent').value.trim();
    const fileInput = document.getElementById('apologyFile');
    const hasFile = fileInput && fileInput.files && fileInput.files.length > 0;

    if (!content && !hasFile) {
        alert('?ш낵臾??댁슜?대굹 泥⑤? ?뚯씪???낅젰?댁＜?몄슂.');
        return;
    }

    let message = '???ш낵臾몄씠 ?곷?諛⑹뿉寃??꾩넚?섏뿀?듬땲??';
    if (hasFile) {
        message += `\n(泥⑤??뚯씪: ${fileInput.files[0].name})`;
    }

    alert(message);
    document.getElementById('apologyContent').value = '';
    if (hasFile) cancelFileSelection();
};


// --- Apology Styling & Preview Helpers ---

window.selectStyle = function (type, value, element) {
    // Update hidden inputs
    if (type === 'bg') {
        document.getElementById('selectedBg').value = value;
    } else if (type === 'font') {
        document.getElementById('selectedFont').value = value;
    }

    // Visual selection update
    // Find all siblings in the same grid container
    const siblings = element.parentElement.children;
    for (let i = 0; i < siblings.length; i++) {
        siblings[i].classList.remove('selected');
    }
    element.classList.add('selected');
};

window.openPreview = function () {
    const content = document.getElementById('apologyContent').value;
    if (!content || content.length < 10) {
        alert("?ш낵臾??댁슜???덈Т ?곸뒿?덈떎. ?댁슜???묒꽦?댁＜?몄슂.");
        return;
    }

    const bg = document.getElementById('selectedBg').value;
    const font = document.getElementById('selectedFont').value;
    const previewBox = document.getElementById('finalPreviewBox');
    const modal = document.getElementById('previewModal');

    // Set Classes
    previewBox.className = `paper-preview bg-${bg} font-${font}`;
    previewBox.textContent = content;

    // Show Modal
    modal.style.display = 'flex';
};

window.closePreview = function () {
    document.getElementById('previewModal').style.display = 'none';
};

window.confirmSend = function () {
    const bg = document.getElementById('selectedBg').value;
    const font = document.getElementById('selectedFont').value;

    // In a real app, we would send these params to the server
    console.log(`Sending Apology with BG: ${bg}, Font: ${font}`);

    closePreview();

    // Call the original send logic or simulate success
    alert("???ш낵臾몄씠 ?깃났?곸쑝濡??꾩넚?섏뿀?듬땲??\n(?곷?諛⑹뿉寃??좏깮?섏떊 ?몄?吏? 湲瑗대줈 ?꾨떖?⑸땲??");

    // Clear
    localStorage.removeItem('saved_apology_text');
    document.getElementById('apologyContent').value = '';

    // Redirect or update UI
    // location.href = 'dashboard.html?page=cases'; // Optional
};

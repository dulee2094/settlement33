
// case_detail_docs.js
// Handles Document Sharing Box Logic

window.getDocumentsHTML = function () {
    return `
        <div class="glass-card" style="max-width: 900px; margin: 0 auto; min-height: 600px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
                <div>
                    <h3 style="margin-bottom: 5px;"><i class="fas fa-folder-open"></i> 서류 공유함</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">
                        합의 관련 문서를 안전하게 공유하고 보관하세요.<br>
                        업로드된 문서는 양측 모두 열람 가능합니다.
                    </p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <select id="docCategorySelect" class="form-input" style="width: 150px; background: rgba(255,255,255,0.1);">
                        <option value="evidence">증거 자료</option>
                        <option value="apology">사과문 (파일)</option>
                        <option value="agreement">합의서 (초안)</option>
                        <option value="request">합의금 요청서</option>
                        <option value="other">기타</option>
                    </select>
                    <button class="btn btn-primary" onclick="triggerFileUpload()">
                        <i class="fas fa-cloud-upload-alt"></i> 파일 업로드
                    </button>
                    <input type="file" id="docFileInput" style="display: none;" onchange="uploadDocumentAction(this)">
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 2fr 1.5fr 1fr 1fr; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px 8px 0 0; font-weight: 600; color: var(--text-muted); font-size: 0.9rem;">
                <div>분류</div>
                <div>파일명</div>
                <div>업로더</div>
                <div>등록일</div>
                <div style="text-align: center;">다운로드</div>
            </div>

            <div id="documentList" style="display: flex; flex-direction: column; gap: 5px; margin-top: 5px;">
                <div style="padding: 40px; text-align: center; color: var(--text-muted);">
                    <div class="spinner-border" role="status"></div>
                    <p style="margin-top: 10px;">문서 목록을 불러오는 중...</p>
                </div>
            </div>
        </div>
    `;
};

window.triggerFileUpload = () => {
    const input = document.getElementById('docFileInput');
    if (input) input.click();
};

window.loadDocuments = async () => {
    const caseId = localStorage.getItem('current_case_id');
    if (!caseId) return;

    try {
        const res = await fetch(`/api/case/${caseId}/documents`);
        const data = await res.json();
        const listEl = document.getElementById('documentList');

        if (data.success) {
            if (data.documents.length === 0) {
                listEl.innerHTML = `
                    <div style="padding: 60px; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: 8px;">
                        <i class="far fa-folder-open" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                        <p>공유된 문서가 없습니다.</p>
                    </div>
                `;
                return;
            }

            listEl.innerHTML = data.documents.map(doc => {
                const icon = window.getFileIcon(doc.fileName);
                const categoryMap = {
                    'evidence': '<span class="badge" style="background:rgba(239, 68, 68, 0.1); color:#fca5a5;">증거</span>',
                    'apology': '<span class="badge" style="background:rgba(59, 130, 246, 0.1); color:#93c5fd;">사과문</span>',
                    'agreement': '<span class="badge" style="background:rgba(16, 185, 129, 0.1); color:#6ee7b7;">합의서</span>',
                    'request': '<span class="badge" style="background:rgba(245, 158, 11, 0.1); color:#fcd34d;">요청서</span>',
                    'other': '<span class="badge" style="background:rgba(255, 255, 255, 0.1); color:#cbd5e1;">기타</span>'
                };

                return `
                    <div style="display: grid; grid-template-columns: 1fr 2fr 1.5fr 1fr 1fr; padding: 15px; background: rgba(255,255,255,0.02); border-radius: 6px; align-items: center; font-size: 0.95rem; transition: background 0.2s; cursor: pointer;" class="doc-item">
                        <div>${categoryMap[doc.category] || doc.category}</div>
                        <div style="display: flex; align-items: center; gap: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${icon}
                            <span>${doc.fileName}</span>
                        </div>
                        <div style="color: var(--text-muted); font-size: 0.9rem;">${doc.uploaderName}</div>
                        <div style="color: var(--text-muted); font-size: 0.85rem;">${new Date(doc.createdAt).toLocaleDateString()}</div>
                        <div style="text-align: center;">
                            <button class="btn btn-sm btn-glass" onclick="downloadDocumentAction('${doc.id}')" title="다운로드">
                                <i class="fas fa-download"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (e) {
        console.error(e);
        const listEl = document.getElementById('documentList');
        if (listEl) listEl.innerHTML = '<p style="text-align:center; color:red;">목록을 불러오는데 실패했습니다.</p>';
    }
};

window.getFileIcon = function (fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return '<i class="fas fa-file-pdf" style="color: #ef4444;"></i>';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return '<i class="fas fa-file-image" style="color: #3b82f6;"></i>';
    if (['doc', 'docx'].includes(ext)) return '<i class="fas fa-file-word" style="color: #2563eb;"></i>';
    return '<i class="fas fa-file" style="color: var(--text-muted);"></i>';
};

window.uploadDocumentAction = async (input) => {
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const category = document.getElementById('docCategorySelect').value;
    const caseId = localStorage.getItem('current_case_id');

    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    const userId = userInfo.id || 1;

    if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기는 5MB 이하여야 합니다.');
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        const fileData = e.target.result;

        if (!confirm(`'${file.name}' 파일을 업로드하시겠습니까?`)) {
            input.value = '';
            return;
        }

        try {
            const btn = document.querySelector('button[onclick="triggerFileUpload()"]');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 업로드 중...';
            btn.disabled = true;

            const res = await fetch('/api/case/document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    caseId,
                    uploaderId: userId,
                    category,
                    fileName: file.name,
                    fileType: file.type,
                    fileData
                })
            });

            const data = await res.json();
            if (data.success) {
                await window.loadDocuments();
                input.value = '';
                alert('업로드가 완료되었습니다.');
            } else {
                alert('업로드 실패: ' + data.error);
            }
        } catch (err) {
            console.error(err);
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            const btn = document.querySelector('button[onclick="triggerFileUpload()"]');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    };
    reader.readAsDataURL(file);
};

window.downloadDocumentAction = async (docId) => {
    try {
        const res = await fetch(`/api/document/${docId}`);
        if (!res.ok) throw new Error('Download failed');

        const data = await res.json();
        if (data.success) {
            const link = document.createElement('a');
            link.href = data.fileData;
            link.download = data.fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert('다운로드 실패');
        }
    } catch (e) {
        console.error(e);
        alert('파일을 다운로드할 수 없습니다.');
    }
};

window.loadApologyImage = async function () {
    const caseId = localStorage.getItem('current_case_id');
    const imgEl = document.getElementById('apologyImage');
    const container = document.getElementById('apologyImageContainer');
    const downloadBtn = document.getElementById('apologyDownloadBtn');

    if (!caseId || !imgEl) return;

    try {
        const listRes = await fetch('/api/case/' + caseId + '/documents');
        const listData = await listRes.json();

        if (!listData.success || !listData.documents) return;

        const apologyDocs = listData.documents.filter(d => d.category === 'apology');
        if (apologyDocs.length === 0) return;

        const latestDocId = apologyDocs[0].id;

        const fileRes = await fetch('/api/document/' + latestDocId);
        const fileJson = await fileRes.json();

        if (fileJson.success) {
            imgEl.src = fileJson.fileData;
            container.style.display = 'block';
            downloadBtn.href = fileJson.fileData;
            downloadBtn.download = fileJson.fileName;
        }
    } catch (e) {
        console.error('Failed to load apology image', e);
    }
};

# 분석 결과 확인 동의 시스템 구현 가이드 (Phase 1 & 2)

## 📅 작업 일시
2026-01-21

## 🎯 구현 목표
블라인드 제안 시스템에서 양측 제안 완료 시 즉시 결과를 보여주지 않고, 사용자의 명시적 동의 후 결과를 공개하는 2단계 확인 시스템 구현

---

## ✅ 완료된 작업 (서버)

### 1. **데이터베이스 스키마 업데이트** ✅

#### **Proposal 모델에 필드 추가**
```javascript
const Proposal = sequelize.define('Proposal', {
    // ... 기존 필드
    resultViewed: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    }, // 결과 확인 여부
    viewedAt: { 
        type: DataTypes.DATE 
    } // 결과 확인 시간
});
```

### 2. **GET /api/case/proposal 업데이트** ✅

#### **추가된 응답 필드**
```javascript
{
    roundStatus: 'ready', // 'waiting', 'proposing', 'ready', 'completed'
    myResultViewed: false,
    oppResultViewed: false,
    currentRoundData: {
        bothViewed: false
    }
}
```

#### **roundStatus 값**
- `waiting`: 아무도 제안 안 함
- `proposing`: 한쪽만 제안
- `ready`: 양측 제안 완료, 결과 미확인 ⭐
- `completed`: 양측 모두 결과 확인 완료

### 3. **POST /api/case/proposal/view-result 엔드포인트 추가** ✅

#### **요청**
```javascript
POST /api/case/proposal/view-result
{
    userId: 1,
    caseId: 1,
    round: 1
}
```

#### **응답**
```javascript
{
    success: true,
    bothViewed: false,
    analysis: {
        round: 1,
        offenderAmount: 5000000,
        victimAmount: 8000000,
        diff: 3000000,
        diffPercent: "37.50",
        myAmount: 5000000,
        oppAmount: 8000000
    }
}
```

---

## 🎨 프론트엔드 구현 가이드

### **Phase 1: 기본 구현**

#### **1. 상태 변수 추가** ✅
```javascript
// Result Viewing State
let roundStatus = 'waiting';
let myResultViewed = false;
let oppResultViewed = false;
let analysisData = null;
```

#### **2. initializePage 함수 업데이트** (TODO)
```javascript
async function initializePage() {
    const data = await fetch(`/api/case/proposal?caseId=${caseId}&userId=${userId}`);
    
    // 상태 업데이트
    roundStatus = data.roundStatus;
    myResultViewed = data.myResultViewed;
    oppResultViewed = data.oppResultViewed;
    
    // UI 표시
    if (roundStatus === 'ready' && !myResultViewed) {
        showAnalysisReadyUI(); // 분석 준비 완료 화면
    } else if (roundStatus === 'ready' && myResultViewed) {
        showAnalysisResultUI(data.currentRoundData); // 결과 화면
    } else if (roundStatus === 'completed') {
        showRoundCompletionUI(); // 라운드 완료
    }
}
```

#### **3. showAnalysisReadyUI 함수** (TODO)
```javascript
function showAnalysisReadyUI() {
    showRightPanelState('resultState');
    
    document.getElementById('resultState').innerHTML = `
        <div style="width: 100%;">
            <div style="font-size: 3rem; margin-bottom: 20px;">✅</div>
            <h3 style="color: #fff; margin-bottom: 15px;">
                양측 모두 제안을 등록했습니다!
            </h3>
            
            <!-- Progress -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                <div style="background: rgba(74, 222, 128, 0.2); padding: 15px; border-radius: 12px;">
                    <div>가해자</div>
                    <div style="font-size: 2rem;">✅</div>
                    <div>등록완료</div>
                </div>
                <div style="background: rgba(74, 222, 128, 0.2); padding: 15px; border-radius: 12px;">
                    <div>피해자</div>
                    <div style="font-size: 2rem;">✅</div>
                    <div>등록완료</div>
                </div>
            </div>
            
            <p style="color: #4ade80; font-size: 1.1rem; margin-bottom: 25px;">
                📊 AI 격차 분석 결과가 준비되었습니다
            </p>
            
            <!-- Warning Box -->
            <div style="background: rgba(251, 191, 36, 0.1); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h4 style="color: #fbbf24; margin-bottom: 15px;">
                    ⚠️ 분석 결과 확인 전 주의사항
                </h4>
                <div style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.8; text-align: left;">
                    • 상대방의 제안 금액이 공개됩니다<br>
                    • 금액 격차 분석 결과를 확인합니다<br>
                    • 결과 확인 후 이 라운드는 종료됩니다<br>
                    • 다음 라운드로 진행할 수 있습니다
                </div>
            </div>
            
            <button class="btn btn-primary" onclick="viewAnalysisResult()" style="
                width: 100%;
                padding: 18px;
                font-size: 1.1rem;
                margin-bottom: 15px;
            ">
                📊 분석 결과 확인하기
            </button>
            
            <p style="font-size: 0.85rem; color: #94a3b8;">
                💡 결과를 확인하지 않으면 다음 라운드로 진행할 수 없습니다
            </p>
        </div>
    `;
}
```

#### **4. viewAnalysisResult 함수** (TODO)
```javascript
async function viewAnalysisResult() {
    const caseId = localStorage.getItem('current_case_id');
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    const userId = userInfo.id;
    
    try {
        const res = await fetch('/api/case/proposal/view-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId, 
                caseId, 
                round: currentRound 
            })
        });
        
        const data = await res.json();
        
        if (data.success) {
            analysisData = data.analysis;
            myResultViewed = true;
            
            // 결과 화면 표시
            showAnalysisResultUI(data.analysis);
        } else {
            alert('오류: ' + data.error);
        }
    } catch (e) {
        console.error(e);
        alert('서버 통신 오류');
    }
}
```

#### **5. showAnalysisResultUI 함수** (TODO)
```javascript
function showAnalysisResultUI(analysis) {
    showRightPanelState('resultState');
    
    document.getElementById('resultState').innerHTML = `
        <div style="width: 100%;">
            <h3 style="color: #fff; margin-bottom: 20px;">
                라운드 ${analysis.round} 분석 결과
            </h3>
            
            <!-- Amounts -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div style="background: rgba(59, 130, 246, 0.1); padding: 15px; border-radius: 12px;">
                    <div style="font-size: 0.85rem; color: #93c5fd;">가해자 제안</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: #60a5fa;">
                        ${analysis.offenderAmount.toLocaleString()}원
                    </div>
                </div>
                <div style="background: rgba(168, 85, 247, 0.1); padding: 15px; border-radius: 12px;">
                    <div style="font-size: 0.85rem; color: #d8b4fe;">피해자 제안</div>
                    <div style="font-size: 1.2rem; font-weight: bold; color: #c084fc;">
                        ${analysis.victimAmount.toLocaleString()}원
                    </div>
                </div>
            </div>
            
            <!-- Difference -->
            <div style="background: rgba(251, 191, 36, 0.1); padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
                <div style="font-size: 0.9rem; color: #fbbf24; margin-bottom: 5px;">금액 차이</div>
                <div style="font-size: 1.5rem; font-weight: bold; color: #fbbf24;">
                    ${analysis.diff.toLocaleString()}원
                </div>
                <div style="font-size: 0.85rem; color: #fcd34d; margin-top: 5px;">
                    (${analysis.diffPercent}%)
                </div>
            </div>
            
            <!-- Next Round Button -->
            <button class="btn btn-primary" onclick="startNextRound()" style="
                width: 100%;
                padding: 15px;
                font-size: 1rem;
            ">
                <i class="fas fa-arrow-right" style="margin-right: 8px;"></i>
                다음 라운드 시작 (라운드 ${analysis.round + 1})
            </button>
        </div>
    `;
}
```

---

### **Phase 2: 상대방 확인 상태 표시**

#### **showAnalysisReadyUI 함수 개선** (TODO)
```javascript
function showAnalysisReadyUI() {
    // ... 기존 코드 ...
    
    // Phase 2: 상대방 확인 상태 추가
    let oppStatusHTML = '';
    if (oppResultViewed) {
        oppStatusHTML = `
            <div style="background: rgba(74, 222, 128, 0.1); padding: 15px; border-radius: 12px; margin-bottom: 20px; border-left: 3px solid #4ade80;">
                <p style="color: #4ade80; margin: 0; font-size: 0.95rem;">
                    ⏰ 상대방은 이미 결과를 확인했습니다<br>
                    귀하의 확인을 기다리고 있습니다
                </p>
            </div>
        `;
    }
    
    // Warning Box 앞에 추가
    document.getElementById('resultState').innerHTML = `
        ...
        ${oppStatusHTML}
        <!-- Warning Box -->
        ...
    `;
}
```

---

## 🔄 사용자 흐름

### **시나리오 1: 정상 흐름**

```
1. 가해자: 500만원 제안
   → "상대방 대기 중"

2. 피해자: 800만원 제안
   → "분석 준비 완료" 화면 ⭐
   
3. 피해자: "분석 결과 확인하기" 클릭
   → 분석 결과 표시 (차이: 300만원)
   
4. 가해자: 페이지 새로고침
   → "분석 준비 완료" 화면
   → "⏰ 상대방은 이미 결과를 확인했습니다" ⭐ (Phase 2)
   
5. 가해자: "분석 결과 확인하기" 클릭
   → 분석 결과 표시
   
6. 양측: "다음 라운드 시작" 클릭
   → 라운드 2 시작
```

---

## 📊 데이터 흐름

### **제안 제출 시**
```
POST /api/case/proposal
→ resultViewed: false (기본값)
→ roundStatus: 'ready' (양측 완료 시)
```

### **상태 조회 시**
```
GET /api/case/proposal
→ roundStatus: 'ready'
→ myResultViewed: false
→ oppResultViewed: false
```

### **결과 확인 시**
```
POST /api/case/proposal/view-result
→ myProposal.resultViewed = true
→ myProposal.viewedAt = new Date()
→ return analysis data
```

### **양측 확인 후**
```
GET /api/case/proposal
→ roundStatus: 'completed'
→ myResultViewed: true
→ oppResultViewed: true
```

---

## 🧪 테스트 시나리오

### **테스트 1: 분석 준비 완료 화면**
1. 두 사용자 생성
2. 양측 제안 등록
3. **"분석 준비 완료" 화면 확인** ✅
4. 주의사항 메시지 확인
5. "분석 결과 확인하기" 버튼 확인

### **테스트 2: 결과 확인**
1. "분석 결과 확인하기" 클릭
2. **분석 결과 표시 확인** ✅
3. 양측 금액 공개 확인
4. 차이 및 퍼센트 확인

### **테스트 3: 상대방 확인 상태** (Phase 2)
1. 한쪽 사용자만 결과 확인
2. 다른 사용자 페이지 새로고침
3. **"상대방은 이미 결과를 확인했습니다" 메시지 확인** ✅

### **테스트 4: 라운드 종료**
1. 양측 모두 결과 확인
2. **"다음 라운드 시작" 버튼 확인** ✅
3. 버튼 클릭 → 라운드 2 시작 확인

---

## 📝 구현 체크리스트

### **서버 (완료)** ✅
- [x] Proposal 모델에 resultViewed, viewedAt 필드 추가
- [x] GET /api/case/proposal에 roundStatus 추가
- [x] POST /api/case/proposal/view-result 엔드포인트 추가

### **프론트엔드 (TODO)**
- [ ] 상태 변수 추가 (완료)
- [ ] initializePage 함수 업데이트
- [ ] showAnalysisReadyUI 함수 구현
- [ ] viewAnalysisResult 함수 구현
- [ ] showAnalysisResultUI 함수 구현
- [ ] Phase 2: 상대방 확인 상태 표시

---

## 🚀 다음 단계

1. **프론트엔드 함수 구현**
   - initializePage 업데이트
   - showAnalysisReadyUI 추가
   - viewAnalysisResult 추가
   - showAnalysisResultUI 업데이트

2. **테스트**
   - 브라우저 테스트
   - 자동 테스트 스크립트

3. **문서화**
   - 사용자 가이드
   - 개발자 문서

---

## 💡 참고사항

### **블라인드 원칙 유지**
- 결과 확인 전까지 상대방 금액 비공개
- 사용자가 준비될 때까지 대기
- 명시적 동의 후 공개

### **라운드 종료 시점**
- 양측 모두 결과 확인 = 라운드 종료
- 한쪽만 확인 = 대기 상태 유지
- 다음 라운드는 양측 확인 후 시작 가능

### **사용자 경험**
- 명확한 주의사항 제공
- 상대방 확인 상태 표시 (Phase 2)
- 부드러운 애니메이션

---

이 가이드를 참고하여 프론트엔드 구현을 완료하세요! 🎊

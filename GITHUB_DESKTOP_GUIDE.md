# GitHub Desktop 사용 가이드

## 🎯 GitHub Desktop으로 코드 업로드하기

### 1단계: 저장소 클론 또는 추가

**방법 A: 기존 GitHub 저장소 클론 (추천)**

1. GitHub Desktop 열기
2. `File` > `Clone Repository` 클릭
3. `URL` 탭 선택
4. Repository URL 입력: `https://github.com/dulee2094/settlement33`
5. Local Path 선택: 새로운 폴더 (예: `C:\Users\SAMSUNG\Desktop\settlement33-clone`)
6. `Clone` 클릭

**방법 B: 현재 폴더를 저장소로 추가**

1. GitHub Desktop 열기
2. `File` > `Add Local Repository` 클릭
3. `Choose...` 버튼 클릭
4. 폴더 선택: `c:\Users\SAMSUNG\OneDrive\바탕 화면\합의 홈페이지`
5. `Add Repository` 클릭

만약 "This directory does not appear to be a Git repository" 에러가 나오면:
- `create a repository` 링크 클릭
- 또는 방법 A 사용 (추천)

---

### 2단계: 파일 복사 (방법 A를 선택한 경우)

방법 A로 클론했다면:

1. 클론된 폴더의 **모든 기존 파일 삭제** (숨김 파일 `.git` 제외!)
2. 현재 프로젝트 폴더(`c:\Users\SAMSUNG\OneDrive\바탕 화면\합의 홈페이지`)의 모든 파일을 클론된 폴더로 복사
3. 다음 항목은 복사하지 않음:
   - `node_modules` 폴더
   - `database.sqlite` 파일
   - `.env` 파일 (있다면)
   - `*.log` 파일

---

### 3단계: GitHub Desktop에서 변경사항 확인

1. GitHub Desktop으로 돌아가기
2. 왼쪽 패널에 변경된 파일 목록이 표시됨
3. 중요 파일들이 포함되어 있는지 확인:
   - ✅ `server.js`
   - ✅ `package.json`
   - ✅ `models/` 폴더 및 모든 파일
   - ✅ `routes/` 폴더 및 모든 파일
   - ✅ `config/` 폴더 및 모든 파일
   - ✅ `render.yaml`
   - ✅ `.gitignore`

---

### 4단계: 커밋

1. 왼쪽 하단의 "Summary" 입력란에 커밋 메시지 입력:
   ```
   Fix: Render 배포 문제 해결 - 모듈 경로 수정
   ```

2. "Description" (선택사항):
   ```
   - server.js의 require 경로 수정 (./models/index.js → ./models)
   - package.json에 name과 version 추가
   - render.yaml 배포 설정 추가
   - .gitignore 개선
   ```

3. `Commit to main` 버튼 클릭

---

### 5단계: GitHub에 푸시

1. 상단의 `Push origin` 버튼 클릭
2. GitHub 로그인 요청이 나오면 로그인
3. 푸시 완료 대기

---

### 6단계: GitHub에서 확인

1. 브라우저에서 https://github.com/dulee2094/settlement33 열기
2. 파일들이 업데이트되었는지 확인
3. 특히 `models/` 폴더가 있는지 확인!

---

### 7단계: Render 재배포

1. Render 대시보드로 이동: https://dashboard.render.com/
2. 자동으로 재배포가 시작되거나
3. `Manual Deploy` > `Deploy latest commit` 클릭

---

## ⚠️ 주의사항

### models 폴더가 GitHub에 업로드되었는지 반드시 확인!

GitHub 웹사이트에서 다음 파일들이 보여야 합니다:
- `models/index.js`
- `models/User.js`
- `models/Case.js`
- `models/Proposal.js`
- `models/Message.js`
- `models/PaymentReq.js`
- `models/Consultation.js`
- `models/Document.js`

---

## 🚀 성공 확인

Render 로그에서 다음과 같은 메시지가 나오면 성공:
```
Server running on http://localhost:XXXX
```

더 이상 `Cannot find module './models'` 에러가 나오지 않아야 합니다!

---

## 문제 발생 시

1. **"This directory does not appear to be a Git repository"**
   → 방법 A (클론) 사용

2. **models 폴더가 GitHub에 안 보임**
   → GitHub Desktop에서 models 폴더가 체크되어 있는지 확인
   → 강제로 추가: `git add models/ -f` (터미널에서)

3. **푸시가 안 됨**
   → GitHub Desktop에서 로그아웃 후 다시 로그인
   → Personal Access Token 사용

---

문제가 있으면 알려주세요!

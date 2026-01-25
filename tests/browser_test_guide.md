# 브라우저 로컬 테스트 가이드

## 🌐 로컬 서버에서 직접 테스트하기

### 1단계: 서버 실행
```bash
npm start
```

### 2단계: 브라우저에서 접속
```
http://localhost:3000
```

### 3단계: 수동 테스트 시나리오

#### A. 블라인드 제안 기능 테스트

**창 1 (가해자)**
1. `http://localhost:3000/signup.html` - 회원가입
   - 이메일: `offender@test.com`
   - 비밀번호: `1234`
   
2. 로그인 후 대시보드에서 사건 생성
   - 사건번호: `TEST-001`
   - 역할: 가해자

3. 블라인드 제안 페이지에서 금액 제안
   - 금액: 5,000,000원

**창 2 (피해자) - 시크릿 모드 또는 다른 브라우저**
1. `http://localhost:3000/signup.html` - 회원가입
   - 이메일: `victim@test.com`
   - 비밀번호: `1234`

2. 로그인 후 같은 사건 연결
   - 사건번호: `TEST-001`
   - 역할: 피해자

3. 블라인드 제안 페이지에서 금액 제안
   - 금액: 8,000,000원

4. **결과 확인**: 양측 모두 차이 분석 결과 표시 확인

---

## 🔧 개발자 도구 활용

### 네트워크 탭 확인
1. F12 → Network 탭
2. API 호출 확인:
   - `/api/case/proposal` (POST)
   - `/api/case/proposal?caseId=...` (GET)

### 콘솔 로그 확인
- 에러 메시지
- API 응답 데이터
- localStorage 상태

### localStorage 확인
```javascript
// 콘솔에서 실행
console.log('User ID:', localStorage.getItem('user_id'));
console.log('Case ID:', localStorage.getItem('current_case_id'));
```

---

## 🚀 빠른 테스트 팁

### 데이터베이스 초기화
테스트 데이터가 꼬였을 때:
```bash
# database.sqlite 파일 삭제 후 서버 재시작
rm database.sqlite
npm start
```

### 여러 사용자 동시 테스트
- Chrome 일반 모드: 사용자 1
- Chrome 시크릿 모드: 사용자 2
- Edge/Firefox: 사용자 3

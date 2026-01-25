# 로컬 멀티 유저 테스트 가이드

## 🎯 목표
로컬 환경에서 2명의 사용자(가해자/피해자)로 동시에 접속하여 실제와 동일하게 테스트

---

## 📋 준비 단계

### 1. 로컬 서버 실행

#### Git 저장소 폴더에서 실행 (권장)
```powershell
cd C:\Users\SAMSUNG\Documents\GitHub\settlement33
npm install
npm start
```

#### 또는 원본 폴더에서 실행
```powershell
cd "c:\Users\SAMSUNG\OneDrive\바탕 화면\합의 홈페이지"
npm install
npm start
```

서버가 시작되면 다음과 같은 메시지가 표시됩니다:
```
Server running on http://localhost:3000
```

---

## 🌐 멀티 유저 테스트 방법

### 방법 1: 다른 브라우저 사용 (추천) ⭐

**사용자 A (가해자)**
1. **Chrome** 브라우저 열기
2. `http://localhost:3000` 접속
3. 회원가입 또는 로그인
   - 이메일: `offender@test.com`
   - 비밀번호: `test1234`
   - 역할: 가해자

**사용자 B (피해자)**
1. **Edge** 브라우저 열기
2. `http://localhost:3000` 접속
3. 회원가입 또는 로그인
   - 이메일: `victim@test.com`
   - 비밀번호: `test1234`
   - 역할: 피해자

### 방법 2: 시크릿 모드 사용

**사용자 A (가해자)**
1. Chrome **일반 창** 열기
2. `http://localhost:3000` 접속
3. 가해자로 로그인

**사용자 B (피해자)**
1. Chrome **시크릿 모드** (Ctrl+Shift+N)
2. `http://localhost:3000` 접속
3. 피해자로 로그인

### 방법 3: Chrome 프로필 사용

**프로필 생성**
1. Chrome 우측 상단 프로필 아이콘 클릭
2. "Add" 클릭
3. "Offender Profile" 생성
4. "Victim Profile" 생성

**테스트**
1. Offender Profile 창에서 가해자로 로그인
2. Victim Profile 창에서 피해자로 로그인

---

## 🧪 테스트 시나리오

### 시나리오 1: 사건 생성 및 연결

**사용자 A (가해자) - Chrome**
1. 로그인
2. 대시보드에서 "새 사건 생성"
3. 사건 정보 입력
4. 초대 코드 복사 (예: `ABC123`)

**사용자 B (피해자) - Edge**
1. 로그인
2. "사건 참여" 클릭
3. 초대 코드 입력: `ABC123`
4. 사건 연결 확인

### 시나리오 2: 블라인드 제안 테스트

**사용자 A (가해자) - Chrome**
1. 사건 상세 페이지 진입
2. "블라인드 제안" 탭 클릭
3. 제안 금액 입력 (예: 500만원)
4. "제안 제출" 클릭

**사용자 B (피해자) - Edge**
1. 같은 사건 상세 페이지 진입
2. "블라인드 제안" 탭 클릭
3. 제안 금액 입력 (예: 700만원)
4. "제안 제출" 클릭

**양쪽 모두**
- 분석 결과 확인
- 신호등 표시 확인
- 다음 라운드 진행

### 시나리오 3: 실시간 채팅 테스트

**사용자 A (가해자) - Chrome**
1. 채팅 탭 클릭
2. 메시지 입력: "안녕하세요"
3. 전송

**사용자 B (피해자) - Edge**
1. 채팅 탭 클릭
2. 메시지 실시간 수신 확인
3. 답장 전송

### 시나리오 4: 서류 공유 테스트

**사용자 A (가해자) - Chrome**
1. "서류 공유" 탭 클릭
2. 사과문 작성 및 제출
3. 또는 파일 업로드

**사용자 B (피해자) - Edge**
1. "서류 공유" 탭 클릭
2. 업로드된 서류 확인
3. 다운로드 또는 확인

### 시나리오 5: 중간 합의 테스트

**조건**: 블라인드 제안에서 10% 이내 차이 발생 시

**양쪽 모두**
1. 중간 합의 제안 알림 확인
2. 수락 또는 거부 선택
3. 결과 확인

---

## 🔧 테스트 자동화 스크립트

### 빠른 테스트 계정 생성

데이터베이스에 테스트 계정을 미리 생성하는 스크립트:

```javascript
// test_users_setup.js
const { User } = require('./models');

async function createTestUsers() {
    try {
        // 가해자 계정
        await User.create({
            email: 'offender@test.com',
            password: 'test1234',
            name: '가해자',
            role: 'offender'
        });

        // 피해자 계정
        await User.create({
            email: 'victim@test.com',
            password: 'test1234',
            name: '피해자',
            role: 'victim'
        });

        console.log('테스트 계정 생성 완료!');
    } catch (error) {
        console.error('에러:', error.message);
    }
}

createTestUsers();
```

---

## 📱 모바일 테스트 (선택사항)

### 같은 네트워크의 다른 기기에서 접속

1. **PC의 IP 주소 확인**
```powershell
ipconfig
```
IPv4 주소 확인 (예: 192.168.0.10)

2. **모바일에서 접속**
```
http://192.168.0.10:3000
```

3. **방화벽 설정**
Windows 방화벽에서 포트 3000 허용 필요

---

## 🐛 디버깅 팁

### 1. 브라우저 개발자 도구 활용
- **F12** 또는 **Ctrl+Shift+I**
- Console 탭에서 에러 확인
- Network 탭에서 API 요청 확인

### 2. 서버 로그 확인
터미널에서 실시간 로그 확인

### 3. 데이터베이스 확인
```powershell
# SQLite 데이터베이스 확인
sqlite3 database.sqlite
.tables
SELECT * FROM Users;
SELECT * FROM Cases;
```

---

## 🎬 화면 분할 팁

### Windows 화면 분할
1. Chrome 창 선택 → **Win + ←** (왼쪽 절반)
2. Edge 창 선택 → **Win + →** (오른쪽 절반)

이렇게 하면 두 사용자의 화면을 동시에 볼 수 있습니다!

---

## ⚡ 빠른 시작 체크리스트

- [ ] 로컬 서버 실행 (`npm start`)
- [ ] Chrome 브라우저 열기 (사용자 A)
- [ ] Edge 브라우저 열기 (사용자 B)
- [ ] 양쪽에서 `http://localhost:3000` 접속
- [ ] 각각 다른 계정으로 회원가입/로그인
- [ ] 사건 생성 및 연결
- [ ] 기능 테스트 시작!

---

## 🆘 문제 해결

### "Cannot connect to server"
- 서버가 실행 중인지 확인
- 포트 3000이 사용 중인지 확인

### "Session conflict"
- 브라우저 쿠키 삭제
- 시크릿 모드 사용

### "Database locked"
- 서버 재시작
- database.sqlite 파일 권한 확인

---

## 📞 다음 단계

테스트 중 발견한 버그나 개선사항을 알려주시면 바로 수정해드리겠습니다!

---

**Happy Testing! 🚀**

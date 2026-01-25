# Render 배포 가이드

## 문제 해결 완료 ✅

### 발생했던 문제
- **에러**: `Error: Cannot find module './models/index.js'`
- **원인**: Node.js 모듈 경로 해석 문제

### 적용된 수정 사항

1. **server.js 수정**
   - `require('./models/index.js')` → `require('./models')`
   - Node.js가 자동으로 index.js를 찾도록 변경

2. **package.json 개선**
   - `name`과 `version` 필드 추가
   - npm 표준 준수

3. **render.yaml 생성**
   - Render 배포 설정 명시
   - 빌드 및 시작 명령 지정

4. **.gitignore 개선**
   - 로그 파일 및 IDE 설정 파일 제외

## Render 배포 단계

### 1. Git 저장소 준비

```bash
# Git 초기화 (아직 안 했다면)
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "Fix: Render 배포 문제 해결 - 모듈 경로 수정"

# GitHub에 푸시 (저장소가 있다면)
git push origin main
```

### 2. Render 설정

1. **Render 대시보드 접속**: https://dashboard.render.com/
2. **New > Web Service** 클릭
3. **Git 저장소 연결**
4. **설정 입력**:
   - **Name**: `settlement-agreement-platform` (또는 원하는 이름)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (또는 원하는 플랜)

### 3. 환경 변수 설정 (선택사항)

Render 대시보드에서 Environment Variables 섹션에 추가:
- `NODE_ENV`: `production`
- `PORT`: Render가 자동으로 설정 (설정 불필요)

### 4. 배포 시작

- **Create Web Service** 클릭
- Render가 자동으로 빌드 및 배포 시작

## 주의사항

### SQLite 데이터베이스
현재 SQLite를 사용 중입니다. Render의 Free 플랜은 파일 시스템이 임시적이므로:

⚠️ **중요**: 서버 재시작 시 데이터가 손실될 수 있습니다.

**권장 사항**:
1. **PostgreSQL로 마이그레이션** (Render 무료 PostgreSQL 제공)
2. 또는 **Render Disk 추가** (유료)

### PostgreSQL 마이그레이션 (권장)

Render에서 무료 PostgreSQL 데이터베이스를 생성하고 연결하려면:

1. Render 대시보드에서 **New > PostgreSQL** 생성
2. `config/database.js` 수정:

```javascript
const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../database.sqlite'),
      logging: false
    });

module.exports = sequelize;
```

3. `package.json`에 `pg` 추가:

```json
"dependencies": {
  "express": "^4.18.2",
  "sequelize": "^6.32.1",
  "sqlite3": "^5.1.6",
  "pg": "^8.11.0",
  "pg-hstore": "^2.3.4",
  "cors": "^2.8.5",
  "body-parser": "^1.20.2"
}
```

4. Render 환경 변수에 `DATABASE_URL` 추가 (PostgreSQL 연결 문자열)

## 배포 확인

배포 완료 후:
1. Render 대시보드에서 제공하는 URL 확인
2. 브라우저에서 접속하여 정상 작동 확인
3. 로그 확인: Render 대시보드 > Logs 탭

## 트러블슈팅

### 배포 실패 시
1. Render 로그 확인
2. `node_modules` 삭제 후 재배포
3. Node.js 버전 확인 (현재 18.0.0 이상 요구)

### 데이터베이스 연결 오류
- SQLite 경로 확인
- PostgreSQL 사용 시 연결 문자열 확인

## 문의
배포 중 문제가 발생하면 Render 로그를 공유해주세요.

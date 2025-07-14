# 게시판 서비스 (Board Service)

> 비밀번호 기반 익명 게시판 - 토이 프로젝트 통합 플랫폼의 첫 번째 마이크로서비스

## 📋 프로젝트 개요

이 프로젝트는 **마이크로서비스 아키텍처** 기반 통합 플랫폼의 첫 번째 백엔드 서비스입니다. 
회원가입 없이 누구나 사용할 수 있는 **비밀번호 기반 익명 게시판**으로, 
Fastify와 TypeScript를 활용한 RESTful API 개발 경험을 쌓기 위한 프로젝트입니다.

### 주요 특징
- 🚫 **회원가입 불필요** - 즉시 사용 가능한 익명 게시판
- 🔒 **비밀번호 기반 권한 관리** - 작성자만 수정/삭제 가능
- ⚡ **빠른 설정** - Docker Compose로 원클릭 환경 구축
- 🛡️ **보안 구현** - bcrypt 해싱
- 🐳 **컨테이너화** - 개발 환경 표준화

## 🛠 기술 스택

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: MariaDB (Docker)
- **Database Client**: mysql2
- **Password Hashing**: bcrypt

### Development Tools
- **Container**: Docker & Docker Compose
- **Package Manager**: npm
- **Code Style**: ESLint + Prettier
- **Environment**: dotenv


## 🚀 시작하기

### 환경 요구사항
- Node.js 20.0+
- Docker & Docker Compose
- npm 9.0+

### 설치 및 실행

1. **저장소 클론**
```bash
git clone <repository-url>
cd board-service
```

2. **환경 설정 및 실행**
```bash
# 전체 환경 설정 (의존성 설치 + DB 컨테이너 + 스키마 생성)
make setup

# 개발 서버 시작
make dev
```

3. **브라우저에서 확인**
```
http://localhost:8000
```

## 💡 사용법

### 게시글 작성
1. 제목, 내용, 작성자명 입력
2. **수정/삭제용 비밀번호** 설정 (중요!)
3. 작성 완료

### 게시글 수정/삭제
1. 게시글 상세페이지에서 수정/삭제 버튼 클릭
2. **작성 시 설정한 비밀번호** 입력
3. 비밀번호 일치 시에만 수정/삭제 가능

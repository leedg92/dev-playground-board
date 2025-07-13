# Makefile for Board Service Development with Docker
# 프로젝트: 개인 개발 실험실 (Board Service Backend)

# 변수 정의
COMPOSE_FILE = docker-compose.yml
SERVICE_NAME = api
DB_SERVICE_NAME = mariadb
IMAGE_NAME = dev-playground-board
DB_PORT = 3306
API_PORT = 8000

# 기본 타겟 (help 출력)
.DEFAULT_GOAL := help

# PHONY 타겟 선언 (실제 파일이 아닌 명령어임을 명시)
.PHONY: help setup install build dev dev-build dev-logs dev-logs-all stop clean logs shell lint test db-up db-down db-reset db-seed db-logs

# 도움말 출력
help:
	@echo "🚀 개인 개발 실험실 - Board Service Backend 개발 명령어"
	@echo ""
	@echo "📦 설치 및 설정:"
	@echo "  make setup     - 프로젝트 초기 설정 (npm install + DB 설정)"
	@echo "  make install   - 의존성 설치"
	@echo ""
	@echo "🏗️  빌드:"
	@echo "  make build     - Docker 이미지 빌드"
	@echo "  make build-nc  - Docker 이미지 빌드 (캐시 없이)"
	@echo ""
	@echo "🔧 개발 환경:"
	@echo "  make dev       - 개발 서버 시작 (백그라운드)"
	@echo "  make dev-build - 빌드 후 개발 서버 시작 (백그라운드)"
	@echo "  make dev-logs  - API 서버 로그만 실시간 확인"
	@echo "  make dev-logs-all - 모든 서비스 로그 확인"
	@echo ""
	@echo "🗄️  데이터베이스:"
	@echo "  make db-up     - MariaDB 컨테이너만 시작"
	@echo "  make db-down   - MariaDB 컨테이너 중지"
	@echo "  make db-reset  - 데이터베이스 초기화"
	@echo "  make db-seed   - 테스트 데이터 삽입"
	@echo "  make db-logs   - MariaDB 로그 확인"
	@echo "  make db-shell  - MariaDB 콘솔 접속"
	@echo ""
	@echo "📋 모니터링:"
	@echo "  make logs      - API 서버 로그 확인"
	@echo "  make logs-f    - API 서버 로그 실시간 확인"
	@echo "  make status    - 컨테이너 상태 확인"
	@echo ""
	@echo "🛠️  유틸리티:"
	@echo "  make shell     - API 서버 컨테이너 내부 접속"
	@echo "  make lint      - ESLint 실행"
	@echo "  make test      - 테스트 실행"
	@echo "  make stop      - 모든 서비스 중지"
	@echo "  make restart   - 모든 서비스 재시작"
	@echo "  make clean     - 컨테이너 및 이미지 정리"
	@echo "  make clean-all - 모든 Docker 리소스 정리"

# 프로젝트 초기 설정
setup:
	@echo "🔧 프로젝트 초기 설정 중..."
	npm install
	@echo "📦 의존성 설치 완료"
	@echo "🗄️  데이터베이스 설정 중..."
	docker-compose up -d $(DB_SERVICE_NAME)
	@echo "⏳ 데이터베이스 준비 중..."
	sleep 10
	npm run db:setup
	@echo "✅ 프로젝트 설정 완료!"
	@echo "💡 개발 서버를 시작하려면 'make dev' 를 실행하세요"

# 의존성 설치
install:
	@echo "📦 의존성 설치 중..."
	npm install

# Docker 이미지 빌드
build:
	@echo "🏗️  Docker 이미지 빌드 중..."
	docker-compose build

# Docker 이미지 빌드 (캐시 없이)
build-nc:
	@echo "🏗️  Docker 이미지 빌드 중 (캐시 없이)..."
	docker-compose build --no-cache

# 개발 서버 시작 (백그라운드)
dev:
	@echo "🚀 개발 서버 시작 중 (백그라운드)..."
	docker-compose up -d
	@echo "✅ 개발 서버가 시작되었습니다!"
	@echo "🌐 API 서버: http://localhost:$(API_PORT)"
	@echo "💡 API 로그를 보려면 'make dev-logs' 를 실행하세요"

# 빌드 후 개발 서버 시작 (백그라운드)
dev-build:
	@echo "🏗️  빌드 후 개발 서버 시작 중..."
	docker-compose up -d --build
	@echo "✅ 개발 서버가 시작되었습니다!"
	@echo "🌐 API 서버: http://localhost:$(API_PORT)"
	@echo "💡 API 로그를 보려면 'make dev-logs' 를 실행하세요"

# API 서버 로그만 실시간 확인
dev-logs:
	@echo "📋 API 서버 로그 실시간 확인 중..."
	@echo "💡 Ctrl+C로 중지할 수 있습니다"
	docker-compose up -d
	docker-compose logs -f $(SERVICE_NAME)

# 모든 서비스 로그 확인
dev-logs-all:
	@echo "📋 모든 서비스 로그 확인 중..."
	@echo "💡 Ctrl+C로 중지할 수 있습니다"
	docker-compose logs -f

# MariaDB 컨테이너만 시작
db-up:
	@echo "🗄️  MariaDB 컨테이너 시작 중..."
	docker-compose up -d $(DB_SERVICE_NAME)
	@echo "✅ MariaDB가 시작되었습니다 (포트: $(DB_PORT))"

# MariaDB 컨테이너 중지
db-down:
	@echo "🗄️  MariaDB 컨테이너 중지 중..."
	docker-compose stop $(DB_SERVICE_NAME)

# 데이터베이스 초기화
db-reset:
	@echo "🔄 데이터베이스 초기화 중..."
	docker-compose exec $(DB_SERVICE_NAME) mysql -u root -ppassword -e "DROP DATABASE IF EXISTS board_db; CREATE DATABASE board_db;"
	npm run db:setup
	@echo "✅ 데이터베이스가 초기화되었습니다"

# 테스트 데이터 삽입
db-seed:
	@echo "🌱 테스트 데이터 삽입 중..."
	npm run db:seed
	@echo "✅ 테스트 데이터가 삽입되었습니다"

# MariaDB 로그 확인
db-logs:
	@echo "📋 MariaDB 로그 확인 중..."
	docker-compose logs $(DB_SERVICE_NAME)

# MariaDB 콘솔 접속
db-shell:
	@echo "🐚 MariaDB 콘솔 접속 중..."
	docker-compose exec $(DB_SERVICE_NAME) mysql -u root -ppassword board_db

# API 서버 로그 확인
logs:
	@echo "📋 API 서버 로그 확인 중..."
	docker-compose logs $(SERVICE_NAME)

# API 서버 로그 실시간 확인
logs-f:
	@echo "📋 API 서버 로그 실시간 확인 중..."
	docker-compose logs -f $(SERVICE_NAME)

# 컨테이너 상태 확인
status:
	@echo "📊 컨테이너 상태 확인 중..."
	docker-compose ps

# API 서버 컨테이너 내부 접속
shell:
	@echo "🐚 API 서버 컨테이너 내부 접속 중..."
	docker-compose exec $(SERVICE_NAME) sh

# ESLint 실행
lint:
	@echo "🔍 ESLint 실행 중..."
	npm run lint

# 테스트 실행
test:
	@echo "🧪 테스트 실행 중..."
	npm run test

# 모든 서비스 중지
stop:
	@echo "⏹️  모든 서비스 중지 중..."
	docker-compose down
	@echo "✅ 모든 서비스가 중지되었습니다"

# 모든 서비스 재시작
restart:
	@echo "🔄 모든 서비스 재시작 중..."
	docker-compose restart
	@echo "✅ 모든 서비스가 재시작되었습니다"

# 컨테이너 및 이미지 정리
clean:
	@echo "🧹 컨테이너 및 이미지 정리 중..."
	docker-compose down --rmi local --volumes --remove-orphans
	@echo "✅ 정리 완료!"

# 모든 Docker 리소스 정리 (주의: 다른 프로젝트에도 영향)
clean-all:
	@echo "⚠️  모든 Docker 리소스 정리 중..."
	@echo "이 명령은 다른 프로젝트에도 영향을 줄 수 있습니다."
	@read -p "계속하시겠습니까? (y/N): " confirm && [ "$$confirm" = "y" ]
	docker system prune -a --volumes
	@echo "✅ 모든 Docker 리소스가 정리되었습니다"
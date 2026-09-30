# 배포 가이드 (EC2 + Docker Compose)

구조·결정 이유: `docs/superpowers/specs/2026-09-30-deploy-ci-design.md`

## 1. EC2 (1회)
1. EC2 → 인스턴스 시작: Ubuntu 24.04, t3.micro, 스토리지 20GB, 키페어는 **배포 전용**으로 새로 생성(`petcare-deploy.pem`)
2. 보안그룹 인바운드: 22(내 IP), 80(0.0.0.0/0), 443(0.0.0.0/0)
3. 탄력적 IP 할당 → 인스턴스에 연결 (퍼블릭 IPv4는 프리티어 12개월 750시간 포함, 이후 과금)
4. https://www.duckdns.org 로그인 → 서브도메인 생성 → current ip에 탄력적 IP 입력

## 2. 서버 준비 (1회, `ssh -i petcare-deploy.pem ubuntu@<IP>`)
```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu && exit   # 재접속해야 그룹 반영
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
mkdir -p ~/petcare && nano ~/petcare/.env   # .env.deploy.example 키 전부 채우기
```

## 3. GitHub (1회)
- Settings → Secrets and variables → Actions: `EC2_HOST`(탄력적 IP), `EC2_USER`(`ubuntu`), `EC2_SSH_KEY`(pem 파일 내용 전체)
- 첫 main push 후 `build-push`가 끝나면: GitHub 프로필 → Packages → `petcare-backend`, `petcare-web` 각각 Package settings → Change visibility → **Public** (서버가 로그인 없이 pull)
- 그다음 실패한 `deploy` job을 Re-run

## 4. 평소 배포
main에 push(또는 PR 머지) → test 통과 시 자동 배포. 진행 상황은 Actions 탭

## 5. 운영 명령 (서버에서, `cd ~/petcare`)
- 로그: `docker compose logs -f backend`
- 상태/메모리: `docker compose ps`, `docker stats --no-stream`
- 배포되는 이미지: 자동 배포는 그 커밋의 `sha-<커밋 SHA>` 태그를 씀(`.env`의 `TAG`는 무시됨). 지금 뜬 버전은 `docker compose images`로 확인
- 롤백(수동, 다음 main push 때 자동 배포가 최신으로 덮어씀):
  `TAG=sha-<이전 커밋 SHA 40자리> docker compose pull && TAG=sha-<같은 값> docker compose up -d --no-build`
  또는 Actions 탭에서 이전 커밋의 run을 열어 "Re-run all jobs"
- DB 접속: `docker compose exec mysql mysql -u petcare -p petcare`

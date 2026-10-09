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
- Settings → Secrets and variables → Actions: `EC2_HOST`(탄력적 IP), `EC2_USER`(`ubuntu`), `EC2_SSH_KEY`(pem 파일 내용 전체),
  `EC2_HOST_KEY`(서버에서 `cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub` 결과 — `ssh-ed25519 AAAA...` 한 줄. 배포가 이 키와 다른 서버엔 접속 거부.
  인스턴스를 새로 만들면 이 값도 다시 등록)
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

## 6. 장애 감시 (2026-10-05)
- 헬스체크: `https://<도메인>/api/health` → `{"status":"UP"}` (DB 연결까지 확인, Redis는 fail-open이라 제외)
- `.github/workflows/uptime.yml`이 15분마다 호출 → 실패하면 워크플로 실패로 GitHub가 메일 발송(별도 서비스 가입 불필요)
  - 메일이 안 오면: GitHub → Settings → Notifications → Actions에서 "실패한 워크플로" 알림이 켜져 있는지 확인
  - 레포에 60일간 활동이 없으면 GitHub가 스케줄을 끔 → Actions 탭에서 다시 Enable
  - 수동 확인: Actions 탭 → uptime → Run workflow
- 알림이 오면: AWS 콘솔(리전 확인!)에서 인스턴스 상태 → 서버 접속해 `docker compose ps`, `docker compose logs --tail 100 backend`

## 7. 백업과 복구 (2026-10-05)
**자동 백업(같은 서버)**: compose의 `db-backup` 서비스가 하루 한 번 `~/petcare/backups/`에 저장, 7일치 보관
- `db-YYYY-MM-DD.sql.gz`(DB 전체 덤프), `uploads-YYYY-MM-DD.tar.gz`(반려동물·병원·리뷰 사진)
- 확인: `ls -lh ~/petcare/backups`, `docker compose logs db-backup`

**서버 밖 백업(인스턴스·디스크 자체를 잃는 경우 대비, 1회 설정)**: EC2 → Elastic Block Store → 수명 주기 관리자(Data Lifecycle Manager)
→ 정책 생성: 대상 = 이 인스턴스의 볼륨(태그로 지정), 매일 1회, 보관 7개. 스냅샷 비용은 변경분만큼(소량)

**DB 복구** (서버에서, `cd ~/petcare`):
```bash
docker compose stop backend                        # 복구 중 쓰기 막기
gunzip -c backups/db-2026-10-05.sql.gz | docker compose exec -T mysql sh -c 'mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" petcare'
docker compose start backend
```
**사진 복구**: `docker compose run --rm --no-deps -v "$PWD/backups:/backups" --entrypoint tar backend xzf /backups/uploads-2026-10-05.tar.gz -C /app/uploads`

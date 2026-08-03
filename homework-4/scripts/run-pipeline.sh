#!/usr/bin/env bash
#
# 4-Agent Pipeline — single-command orchestrator
#
#   Research Verifier -> Bug Fixer -> Security Verifier
#                                  -> Unit Test Generator
#
# Кожен агент запускається в headless-режимі (`claude -p`).
# Модель і перелік інструментів беруться З FRONTMATTER файлу агента —
# файл агента є єдиним джерелом істини, скрипт нічого не дублює.
#
# Між етапами читаються машиночитні ворота (GATE) з виводу попереднього
# агента. Ворота HALT/FAIL зупиняють пайплайн.
#
# Запуск:  npm run pipeline
#          bash scripts/run-pipeline.sh
#
set -euo pipefail

# ---------------------------------------------------------------- налаштування

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BUG_ID="001"
BUG_DIR="context/bugs/${BUG_ID}"
RUN_DIR="docs/runs"

RESEARCH="${BUG_DIR}/research/codebase-research.md"
VERIFIED="${BUG_DIR}/research/verified-research.md"
PLAN="${BUG_DIR}/implementation-plan.md"
FIX_SUMMARY="${BUG_DIR}/fix-summary.md"
SECURITY_REPORT="${BUG_DIR}/security-report.md"
TEST_REPORT="${BUG_DIR}/test-report.md"

mkdir -p "$RUN_DIR"

# --------------------------------------------------------------------- вивід

BOLD=$'\033[1m'; RED=$'\033[31m'; GREEN=$'\033[32m'
YELLOW=$'\033[33m'; BLUE=$'\033[34m'; RESET=$'\033[0m'

banner()  { printf '\n%s%s══ %s ══%s\n' "$BOLD" "$BLUE" "$1" "$RESET"; }
info()    { printf '%s→%s %s\n' "$BLUE" "$RESET" "$1"; }
ok()      { printf '%s✔%s %s\n' "$GREEN" "$RESET" "$1"; }
warn()    { printf '%s!%s %s\n' "$YELLOW" "$RESET" "$1"; }
die()     { printf '%s✖ %s%s\n' "$RED" "$1" "$RESET" >&2; exit 1; }

# ------------------------------------------------------------------ утиліти

# Витягти поле з YAML-frontmatter агента.
#   frontmatter_field <файл> <ключ>
frontmatter_field() {
  awk -v key="$2" '
    /^---[[:space:]]*$/ { fence++; next }
    fence == 1 && $0 ~ "^" key ":" {
      sub("^" key ":[[:space:]]*", ""); print; exit
    }
  ' "$1"
}

# Прочитати значення з машиночитного блоку звіту.
#   verdict <файл> <КЛЮЧ>
verdict() {
  [ -f "$1" ] || return 1
  grep -E "^$2:" "$1" | head -1 | sed -E "s/^$2:[[:space:]]*//" | tr -d '\r'
}

# Перевірити, що обов'язковий вхід існує.
require_file() {
  [ -f "$1" ] || die "Немає обов'язкового файлу: $1"
}

# --------------------------------------------------------- запуск одного агента

# run_agent <шлях-до-agent.md> <очікуваний-вихідний-файл> <опис-задачі>
run_agent() {
  local agent_file="$1" expected_output="$2" task="$3"
  local agent_name model tools log

  require_file "$agent_file"

  agent_name="$(basename "$agent_file" .agent.md)"
  model="$(frontmatter_field "$agent_file" model)"
  tools="$(frontmatter_field "$agent_file" tools | tr -d ' ')"
  log="${RUN_DIR}/${agent_name}.txt"

  [ -n "$model" ] || die "У ${agent_file} не вказано model у frontmatter"
  [ -n "$tools" ] || die "У ${agent_file} не вказано tools у frontmatter"

  banner "$agent_name"
  info "модель:      $model"
  info "інструменти: $tools"
  info "вихід:       $expected_output"

  local prompt
  prompt="Ти виконуєш роль агента, визначеного у файлі ${agent_file}.

Прочитай цей файл повністю і виконай описану в ньому процедуру дослівно,
включно з розділами «Заборонено» та «Готово, коли».

Якщо агент вимагає завантажити skill — прочитай його ПЕРШИМ, до будь-якої
іншої роботи, і застосовуй його правила.

Задача цього запуску: ${task}

Обов'язковий результат: створити файл ${expected_output} у форматі, який
задає контракт виводу агента, включно з машиночитним блоком MACHINE-READABLE
VERDICT. Формат блоку критичний — його читає скрипт оркестрації.

Не змінюй жодних файлів поза межами, дозволеними твоєю роллю."

  if claude -p "$prompt" \
      --model "$model" \
      --allowed-tools "$tools" \
      --permission-mode acceptEdits \
      2>&1 | tee "$log"; then
    :
  else
    die "Агент ${agent_name} завершився з помилкою. Лог: ${log}"
  fi

  [ -f "$expected_output" ] || die "Агент ${agent_name} не створив ${expected_output}"
  ok "${agent_name} завершив роботу → ${expected_output}"
}

# ------------------------------------------------------------ передполітна перевірка

banner "Передполітна перевірка"

command -v claude >/dev/null 2>&1 || die "CLI 'claude' не знайдено в PATH"
command -v node   >/dev/null 2>&1 || die "Node.js не знайдено в PATH"

require_file "$RESEARCH"
require_file "$PLAN"
require_file "${BUG_DIR}/bug-context.md"
require_file "skills/research-quality-measurement.md"
require_file "skills/unit-tests-FIRST.md"

info "базлайн тестів до пайплайну:"
npm test 2>&1 | tail -12 | tee "${RUN_DIR}/00-baseline-tests.txt" || true
ok "усі вхідні артефакти на місці"

# ================================================================== ЕТАП 1

run_agent "agents/research-verifier.agent.md" "$VERIFIED" \
  "Перевірити ${RESEARCH} проти реальних джерел у src/ і tests/."

QUALITY="$(verdict "$VERIFIED" RESEARCH_QUALITY || echo '?')"
GATE="$(verdict "$VERIFIED" GATE || echo '?')"
CRIT="$(verdict "$VERIFIED" DISCREPANCIES_CRITICAL || echo '?')"

banner "Ворота 1 — якість дослідження"
info "рівень якості:        $QUALITY"
info "CRITICAL-розбіжності: $CRIT"
info "ворота:               $GATE"

case "$GATE" in
  HALT)
    die "Дослідження визнано непридатним (рівень ${QUALITY}). Код не змінюється." ;;
  CONDITIONAL)
    warn "Рівень ${QUALITY}: продовження дозволене лише за нейтралізації CRITICAL у плані."
    if grep -q "Claims excluded after verification" "$PLAN"; then
      ok "План містить розділ виключень — умову виконано."
    else
      die "У плані немає розділу 'Claims excluded after verification'. Зупинка."
    fi ;;
  PASS)
    ok "Дослідження придатне (рівень ${QUALITY})." ;;
  *)
    die "Не вдалося прочитати GATE із ${VERIFIED}. Машиночитний блок відсутній або пошкоджений." ;;
esac

# ================================================================== ЕТАП 2

run_agent "agents/bug-fixer.agent.md" "$FIX_SUMMARY" \
  "Застосувати ${PLAN} до src/, запускаючи npm test після кожної зміни."

STATUS="$(verdict "$FIX_SUMMARY" OVERALL_STATUS || echo '?')"
FIX_GATE="$(verdict "$FIX_SUMMARY" GATE || echo '?')"
FILES_CHANGED="$(verdict "$FIX_SUMMARY" FILES_CHANGED || echo '')"
TESTS_FAIL="$(verdict "$FIX_SUMMARY" TESTS_AFTER_FAIL || echo '?')"

banner "Ворота 2 — результат виправлення"
info "статус:          $STATUS"
info "тестів падає:    $TESTS_FAIL"
info "змінені файли:   ${FILES_CHANGED:-<порожньо>}"

[ "$FIX_GATE" = "PASS" ] || die "Виправлення не пройшло ворота (статус ${STATUS}). Див. ${FIX_SUMMARY}"
[ -n "$FILES_CHANGED" ]  || die "Порожнє поле FILES_CHANGED — наступні агенти не знатимуть, що перевіряти."
ok "Виправлення застосовано, тести зелені."

# ================================================================== ЕТАП 3

run_agent "agents/security-verifier.agent.md" "$SECURITY_REPORT" \
  "Провести security-review файлів зі списку FILES_CHANGED у ${FIX_SUMMARY}."

SEC_CRIT="$(verdict "$SECURITY_REPORT" FINDINGS_CRITICAL || echo '?')"
SEC_HIGH="$(verdict "$SECURITY_REPORT" FINDINGS_HIGH || echo '?')"
VULN_STATUS="$(verdict "$SECURITY_REPORT" VULN_001_STATUS || echo '?')"
SEC_GATE="$(verdict "$SECURITY_REPORT" GATE || echo '?')"

banner "Ворота 3 — безпека"
info "CRITICAL:        $SEC_CRIT"
info "HIGH:            $SEC_HIGH"
info "VULN-001:        $VULN_STATUS"
info "ворота:          $SEC_GATE"

if [ "$SEC_GATE" != "PASS" ]; then
  warn "Security-review не пройдено. Пайплайн продовжується для повноти звітів,"
  warn "але результат вважається незадовільним. Див. ${SECURITY_REPORT}"
  SECURITY_OK=0
else
  ok "Вразливостей рівня CRITICAL/HIGH не знайдено; VULN-001 закрито."
  SECURITY_OK=1
fi

# ================================================================== ЕТАП 4

run_agent "agents/unit-test-generator.agent.md" "$TEST_REPORT" \
  "Згенерувати юніт-тести за FIRST для файлів зі списку FILES_CHANGED і запустити їх."

TESTS_GEN="$(verdict "$TEST_REPORT" TESTS_GENERATED || echo '?')"
TESTS_PASS="$(verdict "$TEST_REPORT" TESTS_PASSED || echo '?')"
TESTS_FAILED="$(verdict "$TEST_REPORT" TESTS_FAILED || echo '?')"
FIRST_VIOL="$(verdict "$TEST_REPORT" FIRST_VIOLATIONS || echo '?')"
TEST_GATE="$(verdict "$TEST_REPORT" GATE || echo '?')"

banner "Ворота 4 — тести"
info "згенеровано:       $TESTS_GEN"
info "проходить:         $TESTS_PASS"
info "падає:             $TESTS_FAILED"
info "порушень FIRST:    $FIRST_VIOL"

[ "$TEST_GATE" = "PASS" ] || die "Генерація тестів не пройшла ворота. Див. ${TEST_REPORT}"
ok "Згенеровані тести зелені, порушень FIRST немає."

# ================================================================== ПІДСУМОК

banner "Пайплайн завершено"

npm test 2>&1 | tail -8 | tee "${RUN_DIR}/99-final-tests.txt" || true

printf '\n%sАртефакти:%s\n' "$BOLD" "$RESET"
for f in "$VERIFIED" "$FIX_SUMMARY" "$SECURITY_REPORT" "$TEST_REPORT"; do
  printf '  %s✔%s %s\n' "$GREEN" "$RESET" "$f"
done

printf '\n%sВердикти:%s\n' "$BOLD" "$RESET"
printf '  якість дослідження : %s (ворота %s)\n' "$QUALITY" "$GATE"
printf '  виправлення        : %s\n' "$STATUS"
printf '  безпека            : CRITICAL=%s HIGH=%s VULN-001=%s\n' "$SEC_CRIT" "$SEC_HIGH" "$VULN_STATUS"
printf '  тести              : +%s згенеровано, %s падає\n' "$TESTS_GEN" "$TESTS_FAILED"

if [ "$SECURITY_OK" -eq 1 ]; then
  printf '\n%s✔ Пайплайн пройдено повністю.%s\n\n' "$GREEN$BOLD" "$RESET"
else
  printf '\n%s! Пайплайн завершено із зауваженнями безпеки.%s\n\n' "$YELLOW$BOLD" "$RESET"
  exit 2
fi

# Skill 10: Bible Audit Template

## What It Does
A process for auditing a project's codebase against its design document (BIBLE).
Score: X/10. Finds: features in BIBLE but not built, features built but not in
BIBLE, contradictions between design intent and implementation.

## Source
Process reverse-engineered from 9Soccer Bible Audit (docs/BIBLE-AUDIT-2026-03-24.md)

## Process
1. Read ALL code files (no skipping)
2. Read BIBLE / design doc
3. For each BIBLE feature: is it built? Correctly? Check off
4. For each code file: is this feature in the BIBLE?
5. Find contradictions: code does X, BIBLE says Y
6. Score each section 1-10
7. Output: compliance score + priority fix list

## Use BIBLE-AUDIT-TEMPLATE.md as starting point for any project

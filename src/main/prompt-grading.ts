import { getAll, getOne, runQuery } from './database';
import type { FinalReport, PromptGrade } from './shared-memory';

export function gradePrompt(report: FinalReport): PromptGrade {
  const efficiency = Math.max(0, 10 - report.bot_questions_asked * 1.5);
  const accuracy = Math.max(0, 10 - report.errors_encountered * 2);
  const completeness = report.total_tasks > 0
    ? (report.completed_tasks / report.total_tasks) * 10
    : 5;
  const reusability = 5;
  const score = efficiency * 0.25 + accuracy * 0.30 + completeness * 0.35 + reusability * 0.10;
  return {
    score: Math.round(score * 10) / 10,
    efficiency: Math.round(efficiency * 10) / 10,
    accuracy: Math.round(accuracy * 10) / 10,
    completeness: Math.round(completeness * 10) / 10,
    reusability: Math.round(reusability * 10) / 10,
    calculated_at: new Date().toISOString(),
  };
}

export function getTopPrompts(category: string, limit = 10): FinalReport[] {
  const rows = getAll(
    'SELECT raw_json FROM final_reports WHERE prompt_category = ? AND grade_score IS NOT NULL ORDER BY grade_score DESC LIMIT ?',
    [category, limit]
  );
  return rows.flatMap(r => { try { return [JSON.parse(r.raw_json as string) as FinalReport]; } catch { return []; } });
}

export function getCategoryAverages(): { category: string; avgScore: number; count: number }[] {
  return getAll(
    "SELECT prompt_category as category, ROUND(AVG(grade_score), 1) as avgScore, COUNT(*) as count FROM final_reports WHERE grade_score IS NOT NULL AND prompt_category IS NOT NULL AND prompt_category != '' GROUP BY prompt_category ORDER BY avgScore DESC"
  ) as { category: string; avgScore: number; count: number }[];
}

export function getWeakPrompts(threshold = 6.0): FinalReport[] {
  const rows = getAll(
    'SELECT raw_json FROM final_reports WHERE grade_score IS NOT NULL AND grade_score < ? ORDER BY grade_score ASC LIMIT 20',
    [threshold]
  );
  return rows.flatMap(r => { try { return [JSON.parse(r.raw_json as string) as FinalReport]; } catch { return []; } });
}

export function updateReusability(promptAction: string, newScore: number): void {
  runQuery(
    'UPDATE final_reports SET grade_reusability = ? WHERE prompt_action = ? AND grade_reusability IS NOT NULL',
    [newScore, promptAction]
  );
}

export function getGradesSummary(): { totalGraded: number; avgScore: number; topCategory: string; weakCount: number } {
  const row = getOne('SELECT COUNT(*) as total, AVG(grade_score) as avg FROM final_reports WHERE grade_score IS NOT NULL');
  const weakRow = getOne('SELECT COUNT(*) as weak FROM final_reports WHERE grade_score IS NOT NULL AND grade_score < 6');
  const topRow = getOne(
    'SELECT prompt_category as cat FROM final_reports WHERE grade_score IS NOT NULL GROUP BY prompt_category ORDER BY AVG(grade_score) DESC LIMIT 1'
  );
  return {
    totalGraded: Number(row?.total ?? 0),
    avgScore: Math.round(Number(row?.avg ?? 0) * 10) / 10,
    topCategory: String(topRow?.cat ?? '—'),
    weakCount: Number(weakRow?.weak ?? 0),
  };
}

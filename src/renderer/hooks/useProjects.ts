import { useState, useEffect, useCallback } from 'react';
import type { Project } from '../../shared/types';
import * as api from '../services/api';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('[useProjects] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { projects, loading, refresh };
}

export function useProject(id: number) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getProject(id);
      setProject(data);
    } catch (err) {
      console.error('[useProject] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  const update = useCallback(async (data: Partial<Project>) => {
    try {
      const updated = await api.updateProject(id, data);
      setProject(updated);
      return updated;
    } catch (err) {
      console.error('[useProject] update error:', err);
      throw err;
    }
  }, [id]);

  return { project, loading, refresh, update };
}

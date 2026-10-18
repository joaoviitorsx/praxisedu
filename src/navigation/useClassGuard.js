import { useEffect, useState } from 'react';
import { classStillExists } from '../services/classService';
import { clearClassId } from '../services/userService';

// When a student opens the app, check that the class still exists.
// If the teacher deleted it, clear users/{uid}/classId so the student goes to "Entrar na turma".
// Returns true while the check is running.
export default function useClassGuard(uid, profile) {
  const classId = profile?.role === 'student' ? profile.classId : null;
  const [checkedFor, setCheckedFor] = useState(null);

  useEffect(() => {
    if (!classId || checkedFor === classId) return undefined;
    let active = true;
    classStillExists(classId).then(async (exists) => {
      if (!active) return;
      if (!exists) await clearClassId(uid).catch(() => {});
      if (active) setCheckedFor(classId);
    });
    return () => { active = false; };
  }, [classId, checkedFor, uid]);

  return !!classId && checkedFor !== classId;
}

import { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Helper to safely stringify constraints for comparison
const stringifyConstraints = (constraints: QueryConstraint[]) => {
  try {
    return JSON.stringify(constraints.map(c => ({ type: c.type })));
  } catch (e) {
    return '[]';
  }
};

export function useCollection<T>(collectionPath: string, constraints: QueryConstraint[] = [], deps: any[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (collectionPath === 'null') {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, collectionPath), ...constraints);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      setData(items);
      setLoading(false);
    }, (err) => {
      console.error(`Error in useCollection (${collectionPath}):`, err);
      setError(err as Error);
      setLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionPath, ...deps]);

  return { data, loading, error };
}

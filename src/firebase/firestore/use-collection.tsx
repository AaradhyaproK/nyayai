'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { useFirestore } from '../provider';

export function useCollection<T>(path: string) {
  const firestore = useFirestore();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!firestore) {
      setLoading(false);
      return;
    }

    const q: Query<DocumentData> = query(collection(firestore, path));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const docs: T[] = [];
        querySnapshot.forEach((doc) => {
          docs.push({ id: doc.id, ...doc.data() } as T);
        });
        setData(docs);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, path]);

  return { data, loading, error };
}

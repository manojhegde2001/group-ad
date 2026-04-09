import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot,
    limit as firestoreLimit,
    Timestamp
} from 'firebase/firestore';

export interface FirestoreMessage {
    id: string;
    content: string;
    senderId: string;
    createdAt: any;
    type: string;
}

export function useFirestoreMessages(conversationId: string | null) {
    const [messages, setMessages] = useState<FirestoreMessage[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!conversationId) {
            setMessages([]);
            return;
        }

        setLoading(true);
        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(
            messagesRef,
            orderBy('createdAt', 'asc'),
            firestoreLimit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs: FirestoreMessage[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                msgs.push({
                    id: doc.id,
                    content: data.content,
                    senderId: data.senderId,
                    type: data.type || 'TEXT',
                    createdAt: data.createdAt?.toDate() || new Date(),
                });
            });
            setMessages(msgs);
            setLoading(false);
        }, (error) => {
            console.error('Firestore messages error:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [conversationId]);

    return { messages, loading };
}

import { useEffect, useState } from 'react';
import { db, ensureFirebaseAuth } from '@/lib/firebase';
import { 
    collection, 
    query, 
    orderBy, 
    onSnapshot,
    limit as firestoreLimit
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

        let unsubscribe: () => void;

        const setupListener = async () => {
            setLoading(true);
            
            // Ensure we are authenticated with Firebase
            await ensureFirebaseAuth();

            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const q = query(
                messagesRef,
                orderBy('createdAt', 'asc'),
                firestoreLimit(50) // Reduced limit for better performance
            );

            unsubscribe = onSnapshot(q, (snapshot) => {
                const msgs: FirestoreMessage[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    // Skip if createdAt is not yet set by server
                    if (!data.createdAt) return;
                    
                    msgs.push({
                        id: doc.id,
                        content: data.content,
                        senderId: data.senderId,
                        type: data.type || 'TEXT',
                        createdAt: data.createdAt.toDate(),
                    });
                });
                
                setMessages(msgs);
                setLoading(false);
            }, (error) => {
                console.error('Firestore messages error:', error);
                setLoading(false);
            });
        };

        setupListener();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [conversationId]);

    return { messages, loading };
}


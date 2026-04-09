import { db } from './firebase';
import { 
    collection, 
    addDoc, 
    serverTimestamp, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    doc,
    setDoc,
    updateDoc
} from 'firebase/firestore';

export interface ChatMessage {
    id?: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: any;
    type: string;
}

export const sendFirestoreMessage = async (message: Omit<ChatMessage, 'id' | 'createdAt'>) => {
    try {
        const conversationRef = doc(db, 'conversations', message.conversationId);
        
        // Ensure conversation document exists
        await setDoc(conversationRef, {
            lastMessageAt: serverTimestamp(),
            lastMessageContent: message.content,
            participantIds: [] // This should be updated by the caller or a trigger
        }, { merge: true });

        const messagesRef = collection(db, 'conversations', message.conversationId, 'messages');
        const docRef = await addDoc(messagesRef, {
            ...message,
            createdAt: serverTimestamp()
        });

        return docRef.id;
    } catch (error) {
        console.error('Error sending firestore message:', error);
        throw error;
    }
};

export const syncConversationToFirestore = async (conversationId: string, participantIds: string[]) => {
    try {
        const conversationRef = doc(db, 'conversations', conversationId);
        await updateDoc(conversationRef, {
            participantIds
        });
    } catch (error) {
        // If doc doesn't exist, set it
        const conversationRef = doc(db, 'conversations', conversationId);
        await setDoc(conversationRef, {
            participantIds,
            lastMessageAt: serverTimestamp()
        }, { merge: true });
    }
};

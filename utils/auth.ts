
import type { SchoolUser } from '../types';
import { db, collection, addDoc, getDocs, query, where } from '../services/firebase';

const USERS_STORAGE_KEY = 'school_users';

// Helper for LocalStorage retrieval
const getLocalUsers = (): SchoolUser[] => {
    try {
        const usersJson = localStorage.getItem(USERS_STORAGE_KEY);
        if (usersJson) {
            return JSON.parse(usersJson) as SchoolUser[];
        }
    } catch (e) {
        console.error("Could not retrieve users from localStorage", e);
    }
    return [];
};

/**
 * Registers a new school user.
 * Tries to save to Firebase first, falls back to LocalStorage.
 */
export const registerSchoolUser = async (newUser: SchoolUser): Promise<void> => {
    // 1. Try Firebase if available
    if (db) {
        try {
            // Check for existing user
            const schoolsRef = collection(db, "schools");
            const q = query(schoolsRef, where("emisNumber", "==", newUser.emisNumber));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                throw new Error("An account with this EMIS Number already exists (Cloud).");
            }
            
            // Save user
            await addDoc(schoolsRef, newUser);
            return; 
        } catch (e: any) {
             // If the error is our own duplicate check, rethrow it
             if (e.message && e.message.includes("already exists")) {
                 throw e;
             }
             console.error("Firebase registration failed, falling back to local storage:", e);
             // Proceed to fallback
        }
    } else {
        // Simulate network latency if we are in local-only mode to make it feel real
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    // 2. Fallback to LocalStorage
    const existingUsers = getLocalUsers();
    if (existingUsers.some(u => u.emisNumber === newUser.emisNumber)) {
        throw new Error("An account with this EMIS Number already exists.");
    }

    const updatedUsers = [...existingUsers, newUser];
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    } catch (e) {
        console.error("Could not save user to localStorage", e);
        throw new Error("Failed to save user data locally.");
    }
};

/**
 * Authenticates a school user.
 * Tries Firebase first, falls back to LocalStorage.
 */
export const loginSchoolUser = async (emisNumber: string, password: string): Promise<SchoolUser | null> => {
    // 1. Try Firebase if available
    if (db) {
        try {
            const schoolsRef = collection(db, "schools");
            const q = query(schoolsRef, where("emisNumber", "==", emisNumber));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Get the first match
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data() as SchoolUser;
                
                // Simple password check (Note: In production, use hashed passwords or Firebase Auth)
                if (userData.password === password) {
                    return userData;
                }
            }
            // If we checked cloud and found nothing (or wrong password), don't check local unless we want hybrid
            // For this implementation, we assume if DB is active, data is there.
            if (!querySnapshot.empty) return null; // Found user but wrong password
            
        } catch (e) {
            console.error("Firebase login error:", e);
        }
    } else {
         // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 600));
    }

    // 2. LocalStorage Check
    const users = getLocalUsers();
    const user = users.find(u => u.emisNumber === emisNumber);

    if (user && user.password === password) {
        return user;
    }

    return null;
};

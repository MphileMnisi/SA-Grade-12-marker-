import type { SchoolUser } from '../types';

const USERS_STORAGE_KEY = 'school_users';

/**
 * Retrieves the list of registered school users from localStorage.
 * @returns An array of SchoolUser objects, or an empty array if none are found or an error occurs.
 */
export const getSchoolUsers = (): SchoolUser[] => {
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
 * Adds a new school user to the list in localStorage.
 * @param newUser The SchoolUser object to add.
 */
export const saveSchoolUser = (newUser: SchoolUser) => {
    const existingUsers = getSchoolUsers();
    const updatedUsers = [...existingUsers, newUser];
    try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    } catch (e) {
        console.error("Could not save user to localStorage", e);
        throw new Error("Failed to save user data.");
    }
};

//Function to Set into sessionStorage
export function setTokenIntoSessionStorage(token) {
    sessionStorage.setItem('token', token)
}

//Function to Read sessionStorage
export function readSessionStorage() {
    return sessionStorage.getItem('token');
}
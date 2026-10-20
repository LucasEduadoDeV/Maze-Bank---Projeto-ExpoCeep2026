//Function to Set into sessionStorage
function setTokenIntoSessionStorage(token) {
    sessionStorage.setItem('token', token)
}

//Function to Read sessionStorage
function readSessionStorage() {
    return sessionStorage.getItem('token');
}
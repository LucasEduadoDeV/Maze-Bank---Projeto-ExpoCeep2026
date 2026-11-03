export async function createArtificialDueDate() {
    const today = new Date();
    const dueDate = new Date();
    
    dueDate.setMonth(today.getMonth() + 1);
    
    return dueDate;
}
export const getCurrentMonthIndex = (startDateStr: string): number => {
    // Ensure date string is parsed correctly (YYYY-MM-DD)
    const start = new Date(startDateStr + 'T00:00:00');
    const now = new Date();
    
    // Calculate difference in months
    const diffYears = now.getFullYear() - start.getFullYear();
    const diffMonths = now.getMonth() - start.getMonth();
    
    // If today is before the start date, month index is 1.
    if (diffYears < 0 || (diffYears === 0 && diffMonths < 0)) {
        return 1;
    }
    
    // Month index is 1-based.
    return (diffYears * 12) + diffMonths + 1;
};

export const getMonthDate = (startDateStr: string, monthIndex: number): string => {
    const start = new Date(startDateStr + 'T00:00:00');
    const targetDate = new Date(start.getFullYear(), start.getMonth() + monthIndex - 1, 1);
    
    return targetDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
};
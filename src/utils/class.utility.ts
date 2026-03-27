// Convert numeric format class names to text format
export const convertNumericToTextFormat = (className: string): string => {
  if (!className) return className;
  
  const classMap: { [key: string]: string } = {
    '1': '1st',
    '2': '2nd', 
    '3': '3rd',
    '4': '4th',
    '5': '5th',
    '6': '6th',
    '7': '7th',
    '8': '8th',
    '9': '9th',
    '10': '10th',
    '11': '11th',
    '12': '12th'
  };
  
  return classMap[className] || className;
};

// Convert text format class names to numeric format
export const convertClassNameToNumeric = (className: string): string => {
  if (!className) return className;
  
  const classMap: { [key: string]: string } = {
    '1st': '1',
    '2nd': '2', 
    '3rd': '3',
    '4th': '4',
    '5th': '5',
    '6th': '6',
    '7th': '7',
    '8th': '8',
    '9th': '9',
    '10th': '10',
    '11th': '11',
    '12th': '12'
  };
  
  return classMap[className.toLowerCase()] || className;
};
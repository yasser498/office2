export const formatPhoneNumber = (phone?: string | number): string => {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, ''); // Remove non-numeric characters
  
  // If it starts with 05, replace 0 with 966
  if (cleaned.startsWith('05')) {
    return '966' + cleaned.substring(1);
  }
  
  // If it starts with 5, prepend 966
  if (cleaned.startsWith('5')) {
    return '966' + cleaned;
  }
  
  // If it already starts with 966, return as is
  if (cleaned.startsWith('966')) {
    return cleaned;
  }
  
  // Otherwise, return cleaned
  return cleaned;
};
